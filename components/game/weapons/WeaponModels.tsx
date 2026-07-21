"use client";

import * as THREE from "three";

/** First-person machine gun (M4 carbine style) model built from primitives. */
export function MachineGunModel() {
  return (
    <group>
      {/* upper receiver */}
      <mesh castShadow position={[0, 0, -0.05]}>
        <boxGeometry args={[0.06, 0.07, 0.5]} />
        <meshBasicMaterial color="#2a2a2e" />
      </mesh>
      {/* handguard */}
      <mesh castShadow position={[0, -0.005, -0.42]}>
        <boxGeometry args={[0.055, 0.06, 0.28]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* ribs on handguard */}
      {[-0.1, -0.06, -0.02, 0.02, 0.06, 0.1].map((z, i) => (
        <mesh key={i} position={[0, -0.005, -0.42 + z]}>
          <boxGeometry args={[0.058, 0.062, 0.012]} />
          <meshBasicMaterial color="#0e0e10" />
        </mesh>
      ))}
      {/* barrel */}
      <mesh castShadow position={[0, 0.005, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.2, 12]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* flash hider */}
      <mesh castShadow position={[0, 0.005, -0.74]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.05, 12]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      {/* top rail / carry handle */}
      <mesh castShadow position={[0, 0.05, -0.05]}>
        <boxGeometry args={[0.03, 0.025, 0.4]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* rear sight */}
      <mesh castShadow position={[0, 0.075, 0.1]}>
        <boxGeometry args={[0.025, 0.03, 0.03]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      {/* front sight post */}
      <mesh castShadow position={[0, 0.06, -0.55]}>
        <boxGeometry args={[0.012, 0.05, 0.012]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      {/* magazine (curved approximation) */}
      <group position={[0, -0.14, -0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.04, 0.18, 0.07]} />
          <meshBasicMaterial color="#2a2a2e" />
        </mesh>
        <mesh castShadow position={[0, -0.13, 0.04]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.04, 0.1, 0.06]} />
          <meshBasicMaterial color="#222226" />
        </mesh>
      </group>
      {/* pistol grip */}
      <mesh castShadow position={[0, -0.1, 0.18]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.04, 0.13, 0.05]} />
        <meshBasicMaterial color="#0e0e10" />
      </mesh>
      {/* trigger guard */}
      <mesh position={[0, -0.06, 0.1]}>
        <torusGeometry args={[0.04, 0.008, 8, 16, Math.PI]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* stock */}
      <mesh castShadow position={[0, 0, 0.34]}>
        <boxGeometry args={[0.05, 0.07, 0.22]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* stock buffer tube */}
      <mesh castShadow position={[0, 0.01, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.1, 12]} />
        <meshBasicMaterial color="#2a2a2e" />
      </mesh>
      {/* charging handle */}
      <mesh castShadow position={[0, 0.045, 0.18]}>
        <boxGeometry args={[0.02, 0.012, 0.06]} />
        <meshBasicMaterial color="#3a3a3e" />
      </mesh>
    </group>
  );
}

/** First-person pump shotgun (M870 style) model. */
export function ShotgunModel() {
  return (
    <group>
      {/* receiver */}
      <mesh castShadow position={[0, 0, 0.02]}>
        <boxGeometry args={[0.06, 0.07, 0.4]} />
        <meshBasicMaterial color="#2a2a2e" />
      </mesh>
      {/* barrel (thicker) */}
      <mesh castShadow position={[0, 0.01, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.6, 16]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* barrel extension under (magazine tube) */}
      <mesh castShadow position={[0, -0.035, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.5, 16]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* pump (forend) - sliding grip */}
      <mesh castShadow position={[0, -0.035, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.16, 16]} />
        <meshBasicMaterial color="#3a2410" />
      </mesh>
      {/* pump ribs */}
      {[-0.05, -0.03, -0.01, 0.01, 0.03].map((z, i) => (
        <mesh key={i} position={[0, -0.035, -0.28 + z]}>
          <torusGeometry args={[0.029, 0.004, 6, 16]} />
          <meshBasicMaterial color="#2a1808" />
        </mesh>
      ))}
      {/* bead sight */}
      <mesh castShadow position={[0, 0.04, -0.6]}>
        <sphereGeometry args={[0.006, 8, 8]} />
        <meshBasicMaterial color="#aaa" />
      </mesh>
      {/* extractor / ejection port */}
      <mesh position={[0.025, 0.03, -0.05]}>
        <boxGeometry args={[0.012, 0.02, 0.08]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      {/* trigger guard */}
      <mesh position={[0, -0.05, 0.14]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.045, 0.01, 8, 16, Math.PI]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* trigger */}
      <mesh position={[0, -0.04, 0.16]}>
        <boxGeometry args={[0.01, 0.02, 0.012]} />
        <meshBasicMaterial color="#3a3a3e" />
      </mesh>
      {/* pistol grip */}
      <mesh castShadow position={[0, -0.12, 0.26]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.045, 0.14, 0.055]} />
        <meshBasicMaterial color="#0e0e10" />
      </mesh>
      {/* stock */}
      <mesh castShadow position={[0, 0.005, 0.36]}>
        <boxGeometry args={[0.05, 0.09, 0.22]} />
        <meshBasicMaterial color="#1a1a1e" />
      </mesh>
      {/* recoil pad */}
      <mesh castShadow position={[0, 0.005, 0.48]}>
        <boxGeometry args={[0.052, 0.095, 0.025]} />
        <meshBasicMaterial color="#0a0a0a" />
      </mesh>
      {/* shell in chamber (visible) */}
      <mesh position={[0, 0.04, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.05, 8]} />
        <meshBasicMaterial color="#c8a040" />
      </mesh>
    </group>
  );
}
