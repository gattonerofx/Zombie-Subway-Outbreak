"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { vendingTexture, posterTexture, woodTexture } from "@/lib/game/textures";

/** Wooden slat bench against the wall. */
export function Bench({ position }: { position: [number, number, number] }) {
  const wood = useMemo(() => woodTexture(), []);
  return (
    <group position={position}>
      {/* seat slats */}
      {[0, 0.18, 0.36].map((dy, i) => (
        <mesh key={i} position={[0, 0.5 + dy, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.06, 0.45]} />
          <meshStandardMaterial map={wood} color="#6a4a26" roughness={0.8} metalness={0.05} />
        </mesh>
      ))}
      {/* backrest */}
      <mesh position={[0, 0.95, -0.2]} castShadow>
        <boxGeometry args={[2.0, 0.5, 0.06]} />
        <meshStandardMaterial map={wood} color="#5a3a1a" roughness={0.85} />
      </mesh>
      {/* legs */}
      {[-0.85, 0.85].map((x, i) => (
        <mesh key={i} position={[x, 0.25, 0]} castShadow>
          <boxGeometry args={[0.08, 0.5, 0.4]} />
          <meshStandardMaterial color="#3a3a3e" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Vending machine. */
export function VendingMachine({
  position,
  rotation = [0, 0, 0],
  type,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  type: "coffee" | "snack" | "drink";
}) {
  const tex = useMemo(() => vendingTexture(type), [type]);
  return (
    <group position={position} rotation={rotation}>
      {/* body */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.2, 0.8]} />
        <meshStandardMaterial color="#2c2c30" metalness={0.6} roughness={0.45} />
      </mesh>
      {/* front panel with texture */}
      <mesh position={[0, 1.1, 0.41]}>
        <planeGeometry args={[1.05, 2.0]} />
        <meshStandardMaterial map={tex} emissive="#222" emissiveMap={tex} emissiveIntensity={0.35} toneMapped={false} />
      </mesh>
      {/* glass reflection sheen */}
      <mesh position={[0, 1.4, 0.42]}>
        <planeGeometry args={[1.0, 1.2]} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.06} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* top sign */}
      <mesh position={[0, 2.3, 0.1]} castShadow>
        <boxGeometry args={[1.25, 0.2, 0.6]} />
        <meshStandardMaterial
          color={type === "coffee" ? "#1a4a8a" : type === "snack" ? "#aa2020" : "#aa1010"}
          emissive={type === "coffee" ? "#1a4a8a" : type === "snack" ? "#aa2020" : "#aa1010"}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* feet */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.04, 0]}>
          <boxGeometry args={[0.1, 0.08, 0.7]} />
          <meshStandardMaterial color="#1a1a1e" />
        </mesh>
      ))}
    </group>
  );
}

/** Trash can (domed metal bin). */
export function TrashCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* body */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.32, 1.0, 16]} />
        <meshStandardMaterial color="#2a4a3a" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* dome lid */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.38, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a3a2a" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* openings */}
      <mesh position={[0, 1.0, 0.36]}>
        <boxGeometry args={[0.18, 0.1, 0.05]} />
        <meshStandardMaterial color="#000" />
      </mesh>
      <mesh position={[0, 1.0, -0.36]}>
        <boxGeometry args={[0.18, 0.1, 0.05]} />
        <meshStandardMaterial color="#000" />
      </mesh>
    </group>
  );
}

/** Turnstile unit. */
export function Turnstile({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* base */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.16, 0.7]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* housing */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[0.5, 1.1, 0.5]} />
        <meshStandardMaterial color="#4a4a4e" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* top */}
      <mesh position={[0, 1.32, 0]} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#2a2a2e" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* rotating arms (3-way) */}
      <group position={[0, 1.0, 0.3]} rotation={[0, 0, 0]}>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a, i) => (
          <mesh key={i} rotation={[a, 0, 0]} castShadow>
            <boxGeometry args={[0.06, 0.06, 0.7]} />
            <meshStandardMaterial color="#9a9a9e" metalness={0.85} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Wall-mounted billboard/poster. */
export function Billboard({
  position,
  rotation = [0, 0, 0],
  variant = "red",
  size = [2.4, 1.8],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  variant?: "red" | "blue" | "ramen";
  size?: [number, number];
}) {
  const tex = useMemo(() => posterTexture(variant), [variant]);
  return (
    <group position={position} rotation={rotation}>
      {/* frame */}
      <mesh position={[0, 0, -0.03]} castShadow>
        <boxGeometry args={[size[0] + 0.12, size[1] + 0.12, 0.06]} />
        <meshStandardMaterial color="#1a1a1e" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* poster face */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={size} />
        <meshStandardMaterial map={tex} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* protective glass sheen */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.04} metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

/** Japanese station sign (hanging). */
export function StationSign({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <group position={position}>
      {/* chains */}
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.25, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
          <meshStandardMaterial color="#3a3a3e" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* sign board */}
      <mesh position={[0, -0.15, 0]} castShadow>
        <boxGeometry args={[1.6, 0.5, 0.08]} />
        <meshStandardMaterial color="#1a3a6a" emissive="#0a2040" emissiveIntensity={0.3} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* text via simple emissive plane (drawn separately is complex; use a thin box pattern) */}
      <mesh position={[0, -0.15, 0.045]}>
        <planeGeometry args={[1.5, 0.4]} />
        <meshBasicMaterial color="#fdf0c8" transparent opacity={0} />
      </mesh>
      {/* small light bar above */}
      <pointLight position={[0, 0.1, 0.4]} intensity={0.3} distance={3} color="#fdf0c8" />
      <group>
        {/* Use a simple emissive strip to suggest kanji */}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((x, i) => (
          <mesh key={i} position={[x, -0.15, 0.05]}>
            <boxGeometry args={[0.12, 0.18, 0.01]} />
            <meshStandardMaterial color="#fdf0c8" emissive="#fdf0c8" emissiveIntensity={0.8} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Scattered debris: newspaper, bottle, box. */
export function Debris({ position, kind }: { position: [number, number, number]; kind: "paper" | "bottle" | "box" | "barrel" }) {
  if (kind === "paper") {
    return (
      <mesh position={position} rotation={[-Math.PI / 2, 0, Math.random()]}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial color="#c8c4b0" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    );
  }
  if (kind === "bottle") {
    return (
      <group position={position} rotation={[0, Math.random() * Math.PI, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.22, 8]} />
          <meshStandardMaterial color="#1a4a3a" transparent opacity={0.6} metalness={0.3} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.06, 6]} />
          <meshStandardMaterial color="#aa2020" />
        </mesh>
      </group>
    );
  }
  if (kind === "barrel") {
    return (
      <group position={position}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.35, 0.35, 1.0, 16]} />
          <meshStandardMaterial color="#4a3a1a" metalness={0.6} roughness={0.6} />
        </mesh>
        {/* rings */}
        {[0.2, 0.8].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <torusGeometry args={[0.36, 0.02, 6, 16]} />
            <meshStandardMaterial color="#2a2a2e" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
      </group>
    );
  }
  // box
  return (
    <mesh position={[position[0], position[1] + 0.25, position[2]]} rotation={[0, Math.random() * Math.PI, 0]} castShadow>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#6a5a3a" roughness={0.9} />
    </mesh>
  );
}

/** Ticket booth/kiosk near entrance. */
export function TicketBooth({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.2, 1.0]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.4} roughness={0.6} />
      </mesh>
      {/* glass upper */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[1.55, 0.8, 0.95]} />
        <meshStandardMaterial color="#88aacc" transparent opacity={0.25} metalness={0.8} roughness={0.15} />
      </mesh>
      {/* counter */}
      <mesh position={[0, 0.95, 0.5]}>
        <boxGeometry args={[1.4, 0.1, 0.3]} />
        <meshStandardMaterial color="#1a1a1e" />
      </mesh>
      {/* roof */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <boxGeometry args={[1.8, 0.1, 1.2]} />
        <meshStandardMaterial color="#3a3a3e" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
