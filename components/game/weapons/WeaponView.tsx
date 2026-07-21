"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/lib/game/store";
import { WEAPONS } from "@/lib/game/weapons";
import { inputState, playerState } from "@/lib/game/shared";
import { MachineGunModel, ShotgunModel } from "./WeaponModels";
import {
  playMachineGunShot,
  playShotgunShot,
  playShotgunPump,
  playShellInsert,
  playReloadClick,
  playEmptyClick,
  playZombieHit,
  playZombieGroan,
} from "@/lib/game/audio";

// Weapon view holds live timing state in a ref (not React state) to avoid re-renders.
interface WeaponTimers {
  burstRemaining: number;
  nextBurstAt: number;
  nextFireAt: number; // when we can fire again
  reloading: boolean;
  reloadEndAt: number;
  pumping: boolean;
  pumpEndAt: number;
  // shotgun sequential reload (each shell)
  nextShellAt: number;
  shellsLoadedThisReload: number;
  // recoil / sway
  recoil: number; // 0..1
  pumpOffset: number; // 0..1 (pump pull back amount)
  swayX: number;
  swayY: number;
  materialsBrightened: boolean; // flag to ensure weapon materials are brightened once
}

export function WeaponView() {
  const { camera } = useThree();
  const weaponGroup = useRef<THREE.Group>(null);
  const muzzleGroup = useRef<THREE.Group>(null);
  const muzzleLight = useRef<THREE.PointLight>(null);

  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const phase = useGameStore((s) => s.phase);

  // Reset material brightening flag when weapon changes
  useEffect(() => {
    timers.current.materialsBrightened = false;
  }, [currentWeapon]);

  const timers = useRef<WeaponTimers>({
    burstRemaining: 0,
    nextBurstAt: 0,
    nextFireAt: 0,
    reloading: false,
    reloadEndAt: 0,
    pumping: false,
    pumpEndAt: 0,
    nextShellAt: 0,
    shellsLoadedThisReload: 0,
    recoil: 0,
    pumpOffset: 0,
    swayX: 0,
    swayY: 0,
    materialsBrightened: false,
  });

  // Raycaster for hit detection
  const raycaster = useRef(new THREE.Raycaster());
  const tmpDir = useRef(new THREE.Vector3());
  const tmpOrigin = useRef(new THREE.Vector3());

  // ---- Mouse fire input ----
  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (useGameStore.getState().phase !== "playing") return;
      if (document.pointerLockElement) inputState.fire = true;
      inputState.fireQueued = true;
    };
    const up = (e: MouseEvent) => {
      if (e.button !== 0) return;
      inputState.fire = false;
    };
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  // ---- Set weapon renderOrder high so it draws on top ----
  useEffect(() => {
    if (!weaponGroup.current) return;
    weaponGroup.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.renderOrder = 999;
      }
    });
  }, [currentWeapon]);

  // ---- Reload key ----
  useEffect(() => {
    const onKey = () => {
      if (inputState.reload) {
        inputState.reload = false;
        startReload();
      }
    };
    const interval = setInterval(onKey, 30);
    return () => clearInterval(interval);
  }, [currentWeapon]);

  function startReload() {
    const st = useGameStore.getState();
    if (st.phase !== "playing") return;
    const def = WEAPONS[st.currentWeapon];
    const t = timers.current;
    if (t.reloading) return;
    if (st.ammo[st.currentWeapon] >= def.magSize) return;
    if (st.reserve[st.currentWeapon] <= 0) return;

    t.reloading = true;
    st.setReloading(true);

    if (st.currentWeapon === "shotgun") {
      // load shells one at a time
      t.shellsLoadedThisReload = 0;
      t.nextShellAt = performance.now() / 1000 + 0.25;
      playShellInsert();
    } else {
      t.reloadEndAt = performance.now() / 1000 + def.reloadTime;
      playReloadClick();
    }
  }

  function performShot(weaponId: "machinegun" | "shotgun") {
    const st = useGameStore.getState();
    const def = WEAPONS[weaponId];

    // Muzzle flash + sound
    st.triggerMuzzle();
    if (weaponId === "machinegun") playMachineGunShot();
    else playShotgunShot();

    // Recoil
    t_recoil(def.recoilVertical, def.recoilHorizontal);
    timers.current.recoil = 1;

    // Consume ammo
    st.consumeAmmo(1);

    // Raycast for hits
    fireRaycast(def.pellets, def.spread, def.damage, def.range);
  }

  // helper to set recoil into player pitch/yaw
  function t_recoil(v: number, h: number) {
    playerState.pitch += v * (0.6 + Math.random() * 0.5);
    playerState.yaw += (Math.random() - 0.5) * h * 2;
    // clamp pitch
    playerState.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, playerState.pitch));
  }

  // Raycast hits: pellets -> closest zombie per ray
  function fireRaycast(pellets: number, spread: number, damage: number, range: number) {
    const st = useGameStore.getState();
    const zombies = Array.from(st.zombies.values()).filter((z) => !z.dead);
    if (zombies.length === 0) return;

    // origin = camera position; dir = camera forward (with spread per pellet)
    const origin = tmpOrigin.current.copy(camera.position);
    const forward = tmpDir.current.set(0, 0, -1).applyQuaternion(camera.quaternion);

    for (let p = 0; p < pellets; p++) {
      // spread offset
      const sx = (Math.random() - 0.5) * spread * 2;
      const sy = (Math.random() - 0.5) * spread * 2;
      const dir = forward.clone();
      // apply spread in camera space
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      dir.addScaledVector(right, sx).addScaledVector(up, sy).normalize();

      raycaster.current.set(origin, dir);
      raycaster.current.far = range;

      // find closest zombie hit by testing headshot/body capsules
      let closestZ: { z: (typeof zombies)[0]; dist: number; point: THREE.Vector3; headshot: boolean } | null = null;
      for (const z of zombies) {
        const zp = z.position;
        // body cylinder approx: center at [zp.x, 1.1, zp.z], radius 0.45, height 1.6
        // Hit spheres calibrated to the zombie's actual bone height (~1.6m tall)
        const bodyCenter = new THREE.Vector3(zp[0], 0.85, zp[2]);
        const headCenter = new THREE.Vector3(zp[0], 1.5, zp[2]);
        // ray-sphere for head (r=0.25) and body (r=0.45)
        const headHit = raySphere(origin, dir, headCenter, 0.25);
        const bodyHit = raySphere(origin, dir, bodyCenter, 0.45);
        if (headHit !== null) {
          if (!closestZ || headHit < closestZ.dist) {
            closestZ = { z, dist: headHit, point: origin.clone().addScaledVector(dir, headHit), headshot: true };
          }
        } else if (bodyHit !== null) {
          if (!closestZ || bodyHit < closestZ.dist) {
            closestZ = { z, dist: bodyHit, point: origin.clone().addScaledVector(dir, bodyHit), headshot: false };
          }
        }
      }

      if (closestZ) {
        const dmg = closestZ.headshot ? damage * 2.2 : damage;
        const killed = st.damageZombie(closestZ.z.id, dmg, [closestZ.point.x, closestZ.point.y, closestZ.point.z]);
        playZombieHit();
        st.pushHitMarker([closestZ.point.x, closestZ.point.y, closestZ.point.z]);
        if (killed) {
          const pts = closestZ.headshot ? 150 : 100;
          st.addKill(pts);
          st.pushPopup(closestZ.headshot ? `+${pts} HEADSHOT` : `+${pts}`, "kill");
          // chance to groan on death
          if (Math.random() < 0.5) playZombieGroan(Math.floor(Math.random() * 3));
        } else {
          st.pushPopup(closestZ.headshot ? "HEADSHOT" : "HIT", "hit");
        }
      }
    }
  }

  // Weapon group is rendered in world space; we sync its transform to the camera each frame.
  // (Avoids reparenting into the camera, which conflicts with R3F's reconciler.)

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = useGameStore.getState();
    const now = performance.now() / 1000;
    const t = timers.current;
    const def = WEAPONS[st.currentWeapon];

    // ---- Reload progression ----
    if (t.reloading) {
      if (st.currentWeapon === "shotgun") {
        // load a shell every reloadTime seconds until full or reserve empty
        if (now >= t.nextShellAt) {
          const before = st.ammo.shotgun;
          st.finishReload(); // loads one shell
          const after = useGameStore.getState().ammo.shotgun;
          if (after > before) {
            playShellInsert();
          }
          const stillReloading = useGameStore.getState().reloading;
          if (stillReloading && after < def.magSize && useGameStore.getState().reserve.shotgun > 0) {
            t.nextShellAt = now + def.reloadTime;
          } else {
            t.reloading = false;
            st.setReloading(false);
            // pump after reload completes
            t.pumping = true;
            t.pumpEndAt = now + def.pumpTime;
            st.setPumping(true);
            playShotgunPump();
          }
        }
      } else {
        if (now >= t.reloadEndAt) {
          st.finishReload();
          t.reloading = false;
          st.setReloading(false);
          playReloadClick();
        }
      }
    }

    // ---- Pump cycle progression ----
    if (t.pumping && now >= t.pumpEndAt) {
      t.pumping = false;
      st.setPumping(false);
    }

    // ---- Firing ----
    if (st.phase === "playing" && !t.reloading) {
      const wantFire = def.fireMode === "burst" ? inputState.fire : inputState.fireQueued || inputState.fire;
      const canFire = now >= t.nextFireAt && !t.pumping;

      if (def.fireMode === "burst") {
        // machine gun: burst of 3 while holding
        if (inputState.fire && canFire) {
          // start a burst if ammo available
          if (st.ammo[st.currentWeapon] > 0) {
            performShot(st.currentWeapon);
            t.burstRemaining = def.burstCount - 1;
            t.nextBurstAt = now + def.burstDelay;
            t.nextFireAt = now + def.fireInterval;
          } else {
            // empty -> click, auto reload
            playEmptyClick();
            t.nextFireAt = now + 0.25;
            startReload();
          }
        }
        // continue burst
        if (t.burstRemaining > 0 && now >= t.nextBurstAt) {
          const cur = useGameStore.getState();
          if (cur.ammo[cur.currentWeapon] > 0) {
            performShot(cur.currentWeapon);
            t.burstRemaining -= 1;
            t.nextBurstAt = now + def.burstDelay;
          } else {
            t.burstRemaining = 0;
          }
        }
      } else {
        // shotgun: pump-action, one shot per click; must wait pump
        if (inputState.fireQueued && canFire) {
          inputState.fireQueued = false;
          if (st.ammo[st.currentWeapon] > 0) {
            performShot(st.currentWeapon);
            // start pump cycle
            t.pumping = true;
            t.pumpEndAt = now + def.pumpTime;
            st.setPumping(true);
            t.nextFireAt = now + def.fireInterval;
            // pump sound slightly delayed
            setTimeout(() => playShotgunPump(), def.pumpTime * 600);
          } else {
            playEmptyClick();
            t.nextFireAt = now + 0.3;
            // auto reload attempt
            startReload();
          }
        }
        // holding fire doesn't auto-fire shotgun; require click. Clear queued if held without new click.
        if (!inputState.fire) inputState.fireQueued = false;
      }
    }
    // Always clear queued if not playing
    if (st.phase !== "playing") inputState.fireQueued = false;

    // ---- Recoil decay ----
    t.recoil = Math.max(0, t.recoil - dt * 7);

    // ---- Pump offset animation (slide pump back) ----
    if (t.pumping) {
      const p = 1 - (t.pumpEndAt - now) / def.pumpTime; // 0..1
      t.pumpOffset = Math.sin(p * Math.PI); // ease in-out
    } else {
      t.pumpOffset = Math.max(0, t.pumpOffset - dt * 6);
    }

    // ---- Sway (from mouse movement) ----
    t.swayX = THREE.MathUtils.lerp(t.swayX, 0, dt * 8);
    t.swayY = THREE.MathUtils.lerp(t.swayY, 0, dt * 8);

    // ---- Position weapon in view (world space, synced to camera) ----
    if (weaponGroup.current) {
      // local offset in camera space: lower-right, in front
      const baseX = 0.18 + t.swayX;
      const baseY = -0.16 + t.swayY - t.recoil * 0.025;
      const baseZ = -0.42 + t.recoil * 0.09 + t.pumpOffset * 0.05;
      const offset = new THREE.Vector3(baseX, baseY, baseZ);
      offset.applyQuaternion(camera.quaternion);
      weaponGroup.current.position.copy(camera.position).add(offset);
      // match camera orientation, plus recoil/pump pitch
      weaponGroup.current.quaternion.copy(camera.quaternion);
      weaponGroup.current.rotateX(t.recoil * 0.12 - t.pumpOffset * 0.08);
      weaponGroup.current.rotateY(t.swayX * 0.5);
    }

    // ---- Muzzle flash ----
    const flashAge = (performance.now() - st.muzzleFlashAt) / 1000;
    const showFlash = flashAge < 0.05;
    if (muzzleGroup.current) {
      muzzleGroup.current.visible = showFlash;
      if (showFlash) {
        const s = def.muzzleScale * (0.7 + Math.random() * 0.6);
        muzzleGroup.current.scale.setScalar(s);
        muzzleGroup.current.rotation.z = Math.random() * Math.PI;
      }
    }
    if (muzzleLight.current) {
      muzzleLight.current.intensity = showFlash ? 6 * def.muzzleScale : 0;
    }

    // expose camera for raycast fallback (not used now)
    (window as unknown as { __camera?: THREE.Camera }).__camera = camera;
  });

  return (
    <>
      {/* Weapon group (world-space, synced to camera each frame, renders on top) */}
      <group ref={weaponGroup} renderOrder={999}>
        {currentWeapon === "machinegun" ? <MachineGunModel /> : <ShotgunModel />}
        {/* Light attached to weapon so it's always visible even in dark areas */}
        <pointLight position={[0, 0.1, -0.3]} intensity={2} distance={4} decay={2} color="#fff0c8" />
        {/* muzzle flash */}
        <group ref={muzzleGroup} position={[0, 0.005, currentWeapon === "machinegun" ? -0.78 : -0.74]} renderOrder={1000}>
          <mesh renderOrder={1000}>
            <coneGeometry args={[0.06, 0.18, 8]} />
            <meshBasicMaterial color="#fff2b0" transparent opacity={0.95} toneMapped={false} depthTest={false} depthWrite={false} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 4]} renderOrder={1000}>
            <planeGeometry args={[0.18, 0.18]} />
            <meshBasicMaterial color="#ffd060" transparent opacity={0.7} toneMapped={false} side={THREE.DoubleSide} depthTest={false} depthWrite={false} />
          </mesh>
          <pointLight ref={muzzleLight} color="#ffd070" intensity={0} distance={6} decay={2} />
        </group>
      </group>
    </>
  );
}

// Ray-sphere intersection. Returns distance t >= 0 along ray, or null.
function raySphere(origin: THREE.Vector3, dir: THREE.Vector3, center: THREE.Vector3, radius: number): number | null {
  const ox = origin.x - center.x;
  const oy = origin.y - center.y;
  const oz = origin.z - center.z;
  const b = ox * dir.x + oy * dir.y + oz * dir.z;
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  const disc = b * b - c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t0 = -b - sq;
  const t1 = -b + sq;
  if (t0 >= 0) return t0;
  if (t1 >= 0) return t1;
  return null;
}
