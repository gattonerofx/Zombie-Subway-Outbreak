"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LEVEL } from "@/lib/game/level";
import { useGameStore } from "@/lib/game/store";

/** Flickering fluorescent ceiling lights + warm tunnel glow + red emergency light. */
export function LevelLights() {
  const settings = useGameStore((s) => s.settings);
  const brightness = settings.brightness;

  // refs to each light for flicker
  const lightRefs = useRef<(THREE.RectAreaLight | null)[]>([]);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flickerSeed = useRef(LEVEL.lights.map(() => Math.random() * 100));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    lightRefs.current.forEach((light, i) => {
      if (!light) return;
      const seed = flickerSeed.current[i];
      // base flicker: most lights steady, a few flicker
      const flickers = i % 3 === 1;
      let intensity = 1;
      if (flickers) {
        const n = Math.sin(t * 13 + seed) * Math.sin(t * 7.3 + seed * 2);
        intensity = 0.55 + (n > 0.6 ? 0.5 : 0.15) + Math.random() * 0.05;
      } else {
        intensity = 0.92 + Math.sin(t * 0.7 + seed) * 0.04;
      }
      light.intensity = intensity * 6 * brightness;
      const mesh = meshRefs.current[i];
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = intensity * 2.2 * brightness;
      }
    });
  });

  return (
    <group>
      {/* Ambient (cool fill) — main illumination to keep light count low */}
      <ambientLight intensity={2.2 * brightness} color="#8a9aba" />
      {/* Hemisphere for soft fill */}
      <hemisphereLight args={["#c8d2e8", "#202024", 2.5 * brightness]} />

      {/* Ceiling fluorescent tubes (emissive mesh only — no per-fixture lights for performance) */}
      {LEVEL.lights.map((x, i) => (
        <group key={i} position={[x, LEVEL.ceilingY - 0.1, 0]}>
          {/* Light fixture housing */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[2.4, 0.1, 0.5]} />
            <meshStandardMaterial color="#2a2a2e" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* Emissive tube */}
          <mesh
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={[0, -0.02, 0]}
          >
            <boxGeometry args={[2.2, 0.06, 0.32]} />
            <meshStandardMaterial
              color="#fdf6d8"
              emissive="#fdf6d8"
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Only 2 dynamic point lights for key atmospheric areas (keeps per-fragment cost low) */}
      <pointLight position={[26, 3.5, 0]} intensity={60 * brightness} distance={16} decay={2} color="#fdf0c8" />
      <pointLight position={[0, 3.5, 0]} intensity={50 * brightness} distance={14} decay={2} color="#fdf0c8" />

      {/* Warm glow at tunnel mouth (-X end) */}
      <pointLight
        position={[LEVEL.tunnelX + 3, 2.2, LEVEL.tunnelZ]}
        intensity={2.5 * brightness}
        distance={16}
        decay={2}
        color="#ff8a3a"
      />
      {/* Red emergency light near tunnel */}
      <pointLight
        position={[LEVEL.tunnelX + 6, 2.6, 3]}
        intensity={1.6 * brightness}
        distance={10}
        decay={2}
        color="#ff2020"
      >
        <mesh>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#ff2020" emissive="#ff2020" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      </pointLight>

      {/* Cool fill near entrance (+X) */}
      <pointLight
        position={[LEVEL.xMax - 2, 2.5, 0]}
        intensity={1.2 * brightness}
        distance={12}
        decay={2}
        color="#6a90c0"
      />
    </group>
  );
}
