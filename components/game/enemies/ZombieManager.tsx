"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/lib/game/store";
import { LEVEL } from "@/lib/game/level";
import { playerState } from "@/lib/game/shared";
import { Zombie } from "./Zombie";
import { playWaveHorn } from "@/lib/game/audio";
import { gameLog } from "@/lib/game/logger";

// Wave configuration
function waveConfig(wave: number) {
  return {
    count: Math.min(3 + Math.floor(wave * 1.5), 12), // zombies in this wave
    spawnInterval: Math.max(2.4 - wave * 0.12, 0.9), // seconds between spawns
    healthBonus: wave * 8,
    speedBonus: Math.min(wave * 0.06, 0.5),
  };
}

// Spawn positions: tunnel mouth (far, atmospheric) + side vents along the platform (closer)
const SPAWN_POINTS: [number, number, number][] = [
  // Tunnel mouth (far end) - main source
  [LEVEL.tunnelX + 1, 0, LEVEL.tunnelZ],
  [LEVEL.tunnelX + 1, 0, LEVEL.tunnelZ - 1.5],
  [LEVEL.tunnelX + 1, 0, LEVEL.tunnelZ + 1.5],
  // Mid-level side openings (back wall vents)
  [-20, 0, 5.2],
  [-8, 0, 5.2],
  [4, 0, 5.2],
  [16, 0, 5.2],
  // Near entrance alcoves
  [28, 0, 5.2],
];

// Demo mode: fixed zombie positions relative to player start (x=26)
// One in FRONT (toward tunnel, -X), one BEHIND (toward entrance, +X)
const DEMO_FRONT: [number, number, number] = [20, 0, 0]; // 6m in front of player
const DEMO_BEHIND: [number, number, number] = [32, 0, 0]; // 6m behind player

interface LiveZombie {
  id: number;
  fixed: boolean;
}

/** Manages wave spawning and renders all live zombies. */
export function ZombieManager() {
  const phase = useGameStore((s) => s.phase);
  const demoMode = useGameStore((s) => s.demoMode);
  const debugMode = useGameStore((s) => s.debugMode);
  // track live zombie ids with their mode (fixed or not)
  const [liveZombies, setLiveZombies] = useState<LiveZombie[]>([]);
  const spawnQueue = useRef(0);
  const nextSpawnAt = useRef(0);
  const waveActive = useRef(false);

  // wave control refs (not React state to avoid re-renders during play)
  const currentWave = useRef(0);
  const demoSpawned = useRef(false);

  useEffect(() => {
    if (phase !== "playing") {
      spawnQueue.current = 0;
      waveActive.current = false;
      demoSpawned.current = false;
    }
  }, [phase]);

  // Poll the store for zombie id list changes (throttled to avoid per-frame setState)
  useEffect(() => {
    const interval = setInterval(() => {
      const st = useGameStore.getState();
      const liveIds = Array.from(st.zombies.keys());
      setLiveZombies((prev) => {
        const prevIds = prev.map((z) => z.id);
        if (prevIds.length !== liveIds.length || prevIds.some((v, i) => v !== liveIds[i])) {
          // rebuild with fixed flag based on demo mode
          return liveIds.map((id) => ({ id, fixed: st.demoMode }));
        }
        return prev;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Demo mode: spawn 2 fixed zombies immediately on enter
  useEffect(() => {
    if (phase !== "playing") return;
    if (!demoMode) return;
    if (demoSpawned.current) return;
    demoSpawned.current = true;

    gameLog.info("wave", "Demo mode: spawning 2 fixed zombies");
    const st = useGameStore.getState();
    st.clearZombies();

    const id1 = st.spawnZombie(DEMO_FRONT);
    const z1 = useGameStore.getState().zombies.get(id1);
    if (z1) {
      z1.health = 99999;
      z1.maxHealth = 99999;
      z1.speed = 0;
    }
    gameLog.success("zombie", `Demo zombie #1 spawned at front`, { pos: DEMO_FRONT, id: id1 });

    const id2 = st.spawnZombie(DEMO_BEHIND);
    const z2 = useGameStore.getState().zombies.get(id2);
    if (z2) {
      z2.health = 99999;
      z2.maxHealth = 99999;
      z2.speed = 0;
    }
    gameLog.success("zombie", `Demo zombie #2 spawned at behind`, { pos: DEMO_BEHIND, id: id2 });

    st.setWave(0);
    st.pushPopup("DEBUG DEMO — 2 fixed zombies", "wave");
  }, [phase, demoMode]);

  // Wave + spawn loop (only in normal mode, not demo)
  useEffect(() => {
    if (phase !== "playing") return;
    if (demoMode) return; // no waves in demo mode
    let raf = 0;
    const loop = () => {
      const st = useGameStore.getState();
      if (st.phase === "playing" && !st.demoMode) {
        const now = performance.now() / 1000;
        const liveCount = st.zombies.size;
        const remaining = st.waveEnemiesRemaining;

        // Start a new wave if none active and all cleared
        if (!waveActive.current && liveCount === 0 && remaining <= 0 && spawnQueue.current <= 0) {
          currentWave.current += 1;
          const w = currentWave.current;
          const cfg = waveConfig(w);
          st.setWave(w);
          st.setWaveEnemiesRemaining(cfg.count);
          spawnQueue.current = cfg.count;
          waveActive.current = true;
          nextSpawnAt.current = now + 2.0;
          st.pushPopup(`WAVE ${w}`, "wave");
          playWaveHorn();
          gameLog.info("wave", `Wave ${w} started`, { count: cfg.count, healthBonus: cfg.healthBonus });
        }

        // Spawn from queue
        if (waveActive.current && spawnQueue.current > 0 && now >= nextSpawnAt.current) {
          const cfg = waveConfig(currentWave.current);
          const useTunnel = Math.random() < 0.3;
          const pool = useTunnel ? SPAWN_POINTS.slice(0, 3) : SPAWN_POINTS.slice(3);
          const sp = pool[Math.floor(Math.random() * pool.length)];
          const id = st.spawnZombie(sp);
          const z = useGameStore.getState().zombies.get(id);
          if (z) {
            z.maxHealth = 100 + cfg.healthBonus;
            z.health = z.maxHealth;
            z.speed = 1.6 + cfg.speedBonus + Math.random() * 0.5;
          }
          gameLog.debug("zombie", `Spawned zombie #${id} at`, { pos: sp, speed: z?.speed });
          spawnQueue.current -= 1;
          nextSpawnAt.current = now + cfg.spawnInterval * (0.7 + Math.random() * 0.6);
        }

        // Wave complete?
        if (waveActive.current && spawnQueue.current <= 0 && liveCount === 0) {
          waveActive.current = false;
          st.setWaveEnemiesRemaining(0);
          st.addReserve("machinegun", 30);
          st.addReserve("shotgun", 6);
          st.pushPopup("WAVE CLEAR  +AMMO", "wave");
          st.heal(15);
          gameLog.success("wave", `Wave ${currentWave.current} cleared! +ammo +15hp`);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, demoMode]);

  return (
    <group>
      {liveZombies.map((z) => (
        <Zombie key={z.id} id={z.id} fixed={z.fixed || demoMode} />
      ))}
      {/* Debug: show player forward direction marker */}
      {debugMode && phase === "playing" && <DebugPlayerMarker />}
    </group>
  );
}

/** A floating marker showing where the player is and which way they're facing. */
function DebugPlayerMarker() {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(playerState.position.x, 0.02, playerState.position.z);
    ref.current.rotation.y = playerState.yaw;
  });
  return (
    <group ref={ref}>
      {/* player position disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 16]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* forward direction arrow (player forward = -X, so arrow at -X) */}
      <mesh position={[-1.5, 0.05, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.5, 4]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
