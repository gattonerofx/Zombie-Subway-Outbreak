"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useGLTF } from "@react-three/drei";
import { useGameStore } from "@/lib/game/store";
import { playerState } from "@/lib/game/shared";
import { resolveCollision } from "@/lib/game/level";
import { playZombieGroan, playZombieAttack, playPlayerHurt } from "@/lib/game/audio";
import { gameLog } from "@/lib/game/logger";

const ZOMBIE_URL = "/models/zombie.glb";

// Preload
useGLTF.preload(ZOMBIE_URL);

// Map animation clip names to roles
const ANIM = {
  arise: "Arise",
  walking: "Walking",
  running: "Running",
  attack: "Attack",
  dead: "Dead",
  alert: "Alert",
  unsteady: "Unsteady_Walk",
};

interface ZombieProps {
  id: number;
  fixed?: boolean; // demo mode: don't move, just stand and animate
}

export function Zombie({ id, fixed = false }: ZombieProps) {
  const { scene, animations } = useGLTF(ZOMBIE_URL) as unknown as {
    scene: THREE.Group;
    animations: THREE.AnimationClip[];
  };

  // Clone the skinned scene for this instance
  const cloned = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(cloned), [cloned]);

  // Build action map
  const actions = useMemo(() => {
    const map: Record<string, THREE.AnimationAction | null> = {};
    for (const key of Object.keys(ANIM)) {
      const name = ANIM[key as keyof typeof ANIM];
      const clip = animations.find((a) => a.name === name);
      map[key] = clip ? mixer.clipAction(clip) : null;
    }
    return map;
  }, [animations, mixer]);

  const groupRef = useRef<THREE.Group>(null);
  const currentState = useRef<string>("arise");
  const attackCooldown = useRef(0);
  const lastGroanAt = useRef(0);
  const deadTimer = useRef(0);
  const hitFlashMat = useRef<THREE.MeshStandardMaterial | null>(null);
  const [loaded, setLoaded] = useState(false);
  const debugMode = useGameStore((s) => s.debugMode);

  // Initialize: set up material, measure size, log info, play arise animation
  useEffect(() => {
    gameLog.info("zombie", `Initializing zombie #${id}`);

    let meshCount = 0;
    let boneCount = 0;
    let armatureScale = 1;
    let measureBox: THREE.Box3 | null = null;

    // walk through cloned to find skinned mesh material for hit flash + brighten
    cloned.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        meshCount++;
        mesh.castShadow = true;
        mesh.frustumCulled = false;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          const mat = m as THREE.MeshStandardMaterial;
          if (mat && (mat.isMeshStandardMaterial || (mat as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial)) {
            // Display the GLB texture at its TRUE colors (no over-brightening).
            // Force opaque rendering to avoid alpha-blend artifacts:
            mat.metalness = 0;
            mat.roughness = 0.9;
            mat.transparent = false;
            mat.opacity = 1;
            mat.alphaTest = 0;
            mat.side = THREE.DoubleSide;
            mat.depthWrite = true;
            // White multiplier = texture shows at original color values
            mat.color = new THREE.Color(1.0, 1.0, 1.0);
            // No emissive in resting state (hit flash will set it temporarily)
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
            mat.needsUpdate = true;
            hitFlashMat.current = mat;
          }
        });
      }
      // find Armature for scale logging
      if (o.type === "Object3D" && o.name === "Armature") {
        armatureScale = o.scale.x;
      }
    });

    // Measure skeleton bone height (the TRUE rendered height)
    cloned.traverse((o) => {
      const bone = o as THREE.Bone;
      if (bone.isBone) {
        boneCount++;
      }
    });

    // Measure bind-pose bounding box
    cloned.updateMatrixWorld(true);
    measureBox = new THREE.Box3().setFromObject(cloned);
    const bindHeight = measureBox.max.y - measureBox.min.y;

    gameLog.success("zombie", `Zombie #${id} loaded`, {
      meshes: meshCount,
      bones: boneCount,
      armatureScale,
      bindBoxHeight: Math.round(bindHeight * 1000) / 1000 + "m",
      bindBoxMinY: Math.round(measureBox.min.y * 1000) / 1000,
      bindBoxMaxY: Math.round(measureBox.max.y * 1000) / 1000,
      animations: animations.map((a) => a.name),
      fixed,
    });

    // The GLB's Armature has scale 0.01 (Blender cm→m export). Three.js applies this
    // correctly to both mesh and bones. The zombie renders at ~1.6m tall. Do NOT modify.
    gameLog.debug("zombie", `Zombie #${id} scale info`, {
      groupScale: cloned.scale.x,
      armatureScale,
      note: "Armature 0.01 scale = Blender cm→m conversion, applied correctly by three.js",
    });

    // start arise animation
    const a = actions.arise;
    if (a) {
      a.reset();
      a.setLoop(THREE.LoopOnce, 1);
      a.clampWhenFinished = true;
      a.play();
      gameLog.debug("zombie", `Zombie #${id} playing animation: Arise`);
    } else {
      actions.walking?.play();
      gameLog.warn("zombie", `Zombie #${id} Arise animation not found, falling back to Walking`);
    }
    currentState.current = "arise";
    setLoaded(true);

    return () => {
      mixer.stopAllAction();
    };
  }, [actions, mixer, cloned, id, animations, fixed]);

  function playAnim(name: string, loop: boolean = true) {
    if (currentState.current === name) return;
    const next = actions[name];
    if (!next) return;
    const prev = actions[currentState.current];
    currentState.current = name;
    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.play();
    if (prev && prev !== next) {
      prev.fadeOut(0.2);
      next.fadeIn(0.2);
    }
  }

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    mixer.update(dt);
    const st = useGameStore.getState();
    const z = st.zombies.get(id);
    if (!z || !groupRef.current) return;

    // ---- HIT FLASH (flash red briefly on hit, otherwise no emissive) ----
    if (hitFlashMat.current) {
      const flashAge = (performance.now() - z.hitFlash) / 1000;
      if (z.hitFlash > 0 && flashAge < 0.12) {
        hitFlashMat.current.emissive.setRGB(0.9 - flashAge * 6, 0.1, 0.1);
        hitFlashMat.current.emissiveIntensity = 1.5;
      } else {
        // No emissive when not being hit — show true texture colors
        hitFlashMat.current.emissive.setRGB(0, 0, 0);
        hitFlashMat.current.emissiveIntensity = 0;
      }
    }

    // ---- DEAD ----
    if (z.dead) {
      deadTimer.current += dt;
      if (deadTimer.current > 2.5) {
        groupRef.current.position.y -= dt * 0.6;
      }
      if (deadTimer.current > 4.5) {
        st.removeZombie(id);
      }
      return;
    }

    // ---- FIXED MODE (demo): just stand and face the player, no movement ----
    if (fixed) {
      // face the player
      const px = playerState.position.x;
      const pz = playerState.position.z;
      const dx = px - z.position[0];
      const dz = pz - z.position[2];
      const targetYaw = Math.atan2(dx, dz);
      const cur = groupRef.current.rotation.y;
      let diff = targetYaw - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      groupRef.current.rotation.y = cur + diff * Math.min(1, dt * 3);
      // idle animation: unsteady walk (gentle swaying)
      playAnim("unsteady", true);
      groupRef.current.position.set(z.position[0], 0, z.position[2]);
      return;
    }

    // ---- ATTACK COOLDOWN ----
    attackCooldown.current = Math.max(0, attackCooldown.current - dt);

    // ---- MOVE TOWARD PLAYER ----
    const px = playerState.position.x;
    const pz = playerState.position.z;
    const dx = px - z.position[0];
    const dz = pz - z.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    // face the player
    const targetYaw = Math.atan2(dx, dz);
    const cur = groupRef.current.rotation.y;
    let diff = targetYaw - cur;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    groupRef.current.rotation.y = cur + diff * Math.min(1, dt * 6);

    const attackRange = 1.6;
    if (dist > attackRange) {
      // move toward player
      const speed = z.speed * (dist < 22 ? 1.9 : 1.2);
      const nx = z.position[0] + (dx / dist) * speed * dt;
      const nz = z.position[2] + (dz / dist) * speed * dt;
      const [rx, rz] = resolveCollision(nx, nz, z.position[0], z.position[2], 0.4);
      z.position[0] = rx;
      z.position[2] = rz;

      if (dist < 22) playAnim("running", true);
      else playAnim("walking", true);

      const now = performance.now();
      if (now - lastGroanAt.current > 4000 + Math.random() * 4000) {
        lastGroanAt.current = now;
        if (Math.random() < 0.5) playZombieGroan(Math.floor(Math.random() * 3));
      }
    } else {
      playAnim("attack", false);
      if (attackCooldown.current <= 0) {
        attackCooldown.current = 1.3;
        playZombieAttack();
        setTimeout(() => {
          const s = useGameStore.getState();
          if (s.phase !== "playing") return;
          if (s.demoMode) return; // no damage in demo mode
          const zz = s.zombies.get(id);
          if (!zz || zz.dead) return;
          const ddx = playerState.position.x - zz.position[0];
          const ddz = playerState.position.z - zz.position[2];
          const dd = Math.sqrt(ddx * ddx + ddz * ddz);
          if (dd < 2.2) {
            playPlayerHurt();
            s.takeDamage(12);
          }
        }, 400);
      }
    }

    // ---- POSITION MESH ----
    groupRef.current.position.set(z.position[0], 0, z.position[2]);
  });

  if (!loaded) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* cloned skinned mesh (Armature 0.01 scale = Blender cm→m, applied by three.js) */}
      <primitive object={cloned} />
      {/* subtle red eye glow */}
      <pointLight position={[0, 1.5, 0.2]} color="#ff3018" intensity={0.4} distance={3} decay={2} />
      {/* Debug bounding box visualization */}
      {debugMode && <ZombieDebugBox />}
    </group>
  );
}

/** Wireframe bounding box around the zombie for debug visualization. */
function ZombieDebugBox() {
  const ref = useRef<THREE.LineSegments>(null);
  const geom = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.9, 1.7, 0.5)), []);
  useFrame(() => {
    // nothing needed per-frame; box is static relative to zombie group
  });
  return (
    <lineSegments ref={ref} geometry={geom} position={[0, 0.85, 0]} renderOrder={1000}>
      <lineBasicMaterial color="#00ff00" linewidth={2} transparent opacity={0.8} depthTest={false} depthWrite={false} />
    </lineSegments>
  );
}
