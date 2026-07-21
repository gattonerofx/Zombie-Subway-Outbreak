"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/lib/game/store";

interface Burst {
  id: number;
  bornAt: number;
  particles: { pos: THREE.Vector3; vel: THREE.Vector3 }[];
}

const BURST_LIFE = 0.6;

/** Spawns blood particle bursts at hit markers consumed from the store. */
export function BloodEffects() {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const seq = useRef(1);
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);

  // Poll hit markers (throttled, not per-frame)
  useEffect(() => {
    const interval = setInterval(() => {
      const st = useGameStore.getState();
      const markers = st.consumeHitMarkers();
      if (markers.length) {
        setBursts((prev) => {
          const next = [...prev];
          for (const m of markers) {
            const particles: { pos: THREE.Vector3; vel: THREE.Vector3 }[] = [];
            for (let i = 0; i < 12; i++) {
              const dir = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 2
              ).normalize();
              particles.push({
                pos: new THREE.Vector3(m.point[0], m.point[1], m.point[2]),
                vel: dir.multiplyScalar(2 + Math.random() * 3),
              });
            }
            next.push({ id: seq.current++, bornAt: performance.now(), particles });
          }
          return next.slice(-16);
        });
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Update particle positions and write into geometry (only when bursts exist)
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const now = performance.now();
    if (bursts.length === 0) return;

    // cull old bursts
    const live = bursts.filter((b) => now - b.bornAt < BURST_LIFE * 1000);
    if (live.length !== bursts.length) setBursts(live);

    // update + collect positions
    const all: number[] = [];
    for (const b of live) {
      for (const p of b.particles) {
        p.vel.y -= 9.8 * dt;
        p.pos.addScaledVector(p.vel, dt);
        if (p.pos.y < 0.02) p.pos.y = 0.02;
        all.push(p.pos.x, p.pos.y, p.pos.z);
      }
    }
    if (geomRef.current && all.length) {
      const arr = new Float32Array(all);
      const existing = geomRef.current.attributes.position as THREE.BufferAttribute | undefined;
      if (existing && existing.array.length === arr.length) {
        existing.array.set(arr);
        existing.needsUpdate = true;
      } else {
        geomRef.current.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      }
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial color="#8a0a0a" size={0.06} sizeAttenuation transparent opacity={0.9} depthWrite={false} />
    </points>
  );
}
