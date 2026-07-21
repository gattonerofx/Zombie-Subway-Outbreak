"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { LEVEL } from "@/lib/game/level";
import {
  floorTexture,
  tileWallTexture,
  concreteTexture,
  ceilingTexture,
  tactileTexture,
  ballastTexture,
  tileTexture,
} from "@/lib/game/textures";
import { Bench, VendingMachine, TrashCan, Turnstile, Billboard, StationSign, Debris, TicketBooth } from "./Props";
import { LevelLights } from "./Lights";

/** Tile size constants (meters) for texture repeat calculation */
const TILE = {
  floor: 0.6, // floor tile size
  wallTile: 0.3, // wall ceramic tile size
  concrete: 2.0, // concrete slab size
  ceiling: 1.0, // ceiling panel size
};

/** A single concrete pillar with tiled base. */
function Pillar({ position }: { position: [number, number, number] }) {
  const tile = useMemo(() => tileWallTexture(), []);
  const concrete = useMemo(() => concreteTexture(), []);
  // Pillar is ~1.6m tall base + 2.8m column = proper tiling
  const tileMat = useMemo(() => tileTexture(tile, 2.0, 1.0, TILE.wallTile), [tile]);
  const concMat = useMemo(() => tileTexture(concrete, 2.0, 2.8, TILE.concrete), [concrete]);
  return (
    <group position={position}>
      {/* tiled base (cylinder, 1m tall) */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.8, 1.0, 16]} />
        <meshStandardMaterial map={tileMat} color="#8a9ab0" roughness={0.7} />
      </mesh>
      {/* concrete column (cylinder, 2.8m tall) */}
      <mesh position={[0, 2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.72, 2.8, 16]} />
        <meshStandardMaterial map={concMat} color="#7a7a7e" roughness={0.9} />
      </mesh>
      {/* capital */}
      <mesh position={[0, 3.9, 0]} castShadow>
        <cylinderGeometry args={[0.82, 0.72, 0.3, 16]} />
        <meshStandardMaterial color="#5a5a5e" roughness={0.9} />
      </mesh>
      {/* blood splatter on base */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.81, 0.81, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#3a0808" transparent opacity={0.55} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Train tracks in the pit. */
function Tracks() {
  const ballast = useMemo(() => ballastTexture(), []);
  const length = LEVEL.xMax - LEVEL.xMin;
  const cx = (LEVEL.xMax + LEVEL.xMin) / 2;

  // Build sleeper instances as a single InstancedMesh for performance
  const sleeperCount = Math.floor(length / 0.6);
  const sleeperMatrices = useMemo(() => {
    const mats: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    for (let i = 0; i < sleeperCount; i++) {
      const x = LEVEL.xMin + 0.3 + i * 0.6;
      m.makeTranslation(x, -0.45, LEVEL.trackZ);
      mats.push(m.clone());
    }
    return mats;
  }, [sleeperCount]);

  const ballastMat = useMemo(() => tileTexture(ballast, length, LEVEL.trackWidth, 0.5), [ballast, length]);

  return (
    <group>
      {/* ballast bed */}
      <mesh position={[cx, -0.6, LEVEL.trackZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[length, LEVEL.trackWidth]} />
        <meshStandardMaterial map={ballastMat} color="#3a342a" roughness={1} />
      </mesh>
      {/* two rails */}
      {[LEVEL.trackZ - 0.7, LEVEL.trackZ + 0.7].map((z, i) => (
        <mesh key={i} position={[cx, -0.35, z]} castShadow>
          <boxGeometry args={[length, 0.12, 0.1]} />
          <meshStandardMaterial color="#6a5a4a" metalness={0.7} roughness={0.5} />
        </mesh>
      ))}
      {/* sleepers (single instanced mesh) */}
      <instancedMesh args={[undefined, undefined, sleeperCount]} ref={(ref) => {
        if (ref) {
          sleeperMatrices.forEach((m, i) => ref.setMatrixAt(i, m));
          ref.instanceMatrix.needsUpdate = true;
        }
      }}>
        <boxGeometry args={[0.18, 0.1, 2.2]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
      </instancedMesh>
      {/* pit wall (near side, facing player) */}
      <mesh position={[cx, -0.3, LEVEL.zMin]} receiveShadow>
        <boxGeometry args={[length, 0.6, 0.1]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** A wall segment using a plane (front face only) with properly tiled texture. */
function TiledWall({
  position,
  rotation = [0, 0, 0],
  width,
  height,
  texture,
  tileSize,
  color = "#8a9ab0",
  roughness = 0.7,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width: number;
  height: number;
  texture: THREE.Texture;
  tileSize: number;
  color?: string;
  roughness?: number;
}) {
  const mat = useMemo(() => tileTexture(texture, width, height, tileSize), [texture, width, height, tileSize]);
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial map={mat} color={color} roughness={roughness} />
    </mesh>
  );
}

/** The full Tokyo subway level. */
export function SubwayLevel() {
  const floor = useMemo(() => floorTexture(), []);
  const wallTile = useMemo(() => tileWallTexture(), []);
  const wallConcrete = useMemo(() => concreteTexture(), []);
  const ceil = useMemo(() => ceilingTexture(), []);
  const tactile = useMemo(() => tactileTexture(), []);

  const length = LEVEL.xMax - LEVEL.xMin; // 94m
  const cx = (LEVEL.xMax + LEVEL.xMin) / 2; // -1
  const width = LEVEL.zMax - LEVEL.zMin; // 11m

  // Pre-tiled materials for large surfaces
  const floorMat = useMemo(() => tileTexture(floor, length, width, TILE.floor), [floor, length, width]);
  const ceilMat = useMemo(() => tileTexture(ceil, length, width + 4, TILE.ceiling), [ceil, length, width]);
  const tactileMat = useMemo(() => tileTexture(tactile, length, 0.5, 0.25), [tactile, length]);

  // Wall heights
  const lowerH = 2.0; // tiled lower wall
  const upperH = LEVEL.ceilingY - lowerH; // concrete upper wall (2.2m)

  return (
    <group>
      <LevelLights />

      {/* ===== FLOOR (platform) ===== */}
      <mesh position={[cx, 0, (LEVEL.zMin + LEVEL.zMax) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[length, width]} />
        <meshStandardMaterial map={floorMat} color="#6a6a6e" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Yellow tactile paving strip along track edge */}
      <mesh position={[cx, 0.01, LEVEL.zMin + 0.35]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[length, 0.5]} />
        <meshStandardMaterial map={tactileMat} color="#b8902a" roughness={0.95} />
      </mesh>
      {/* yellow safety line */}
      <mesh position={[cx, 0.015, LEVEL.zMin + 0.7]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 0.08]} />
        <meshStandardMaterial color="#d8b040" roughness={0.7} />
      </mesh>

      {/* ===== TRACKS PIT ===== */}
      <Tracks />

      {/* ===== BACK WALL (z = zMax) — faces -Z (toward player) ===== */}
      {/* tiled lower wall (front-facing plane) */}
      <TiledWall
        position={[cx, lowerH / 2, LEVEL.zMax - 0.15]}
        width={length}
        height={lowerH}
        texture={wallTile}
        tileSize={TILE.wallTile}
        color="#8a9ab0"
        roughness={0.6}
      />
      {/* concrete upper wall (front-facing plane) */}
      <TiledWall
        position={[cx, lowerH + upperH / 2, LEVEL.zMax - 0.15]}
        width={length}
        height={upperH}
        texture={wallConcrete}
        tileSize={TILE.concrete}
        color="#7a7a7e"
        roughness={0.9}
      />
      {/* solid backing box (so wall has depth and no see-through) */}
      <mesh position={[cx, LEVEL.ceilingY / 2, LEVEL.zMax]} receiveShadow>
        <boxGeometry args={[length, LEVEL.ceilingY, 0.3]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>
      {/* baseboard strip */}
      <mesh position={[cx, 0.05, LEVEL.zMax - 0.1]}>
        <boxGeometry args={[length, 0.12, 0.12]} />
        <meshStandardMaterial color="#1a1a1e" roughness={0.8} />
      </mesh>

      {/* ===== TRACK-SIDE WALL (across the tracks, faces +Z toward player) ===== */}
      <TiledWall
        position={[cx, 2.0, LEVEL.zMin - 4]}
        rotation={[0, Math.PI, 0]}
        width={length}
        height={4.0}
        texture={wallConcrete}
        tileSize={TILE.concrete}
        color="#6a6a6e"
        roughness={0.9}
      />
      {/* trackside tiled base (front-facing) */}
      <TiledWall
        position={[cx, 0.6, LEVEL.zMin - 4]}
        rotation={[0, Math.PI, 0]}
        width={length}
        height={1.2}
        texture={wallTile}
        tileSize={TILE.wallTile}
        color="#7a8aa0"
        roughness={0.7}
      />
      {/* solid backing for trackside wall */}
      <mesh position={[cx, 2.0, LEVEL.zMin - 4]} receiveShadow>
        <boxGeometry args={[length, 4.0, 0.3]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>

      {/* ===== ENTRANCE END WALL (x = xMax) — faces +X (toward entrance) ===== */}
      <TiledWall
        position={[LEVEL.xMax - 0.15, lowerH / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={width + 4}
        height={lowerH}
        texture={wallTile}
        tileSize={TILE.wallTile}
        color="#8a9ab0"
        roughness={0.6}
      />
      <TiledWall
        position={[LEVEL.xMax - 0.15, lowerH + upperH / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={width + 4}
        height={upperH}
        texture={wallConcrete}
        tileSize={TILE.concrete}
        color="#6a6a6e"
        roughness={0.9}
      />
      {/* solid backing */}
      <mesh position={[LEVEL.xMax, LEVEL.ceilingY / 2, 0]} receiveShadow>
        <boxGeometry args={[0.3, LEVEL.ceilingY, width + 4]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>

      {/* ===== TUNNEL END WALL (x = xMin) with opening ===== */}
      {/* top wall above tunnel */}
      <mesh position={[LEVEL.xMin, 4.0, 0]}>
        <boxGeometry args={[0.3, 0.8, width + 4]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>
      {/* side walls of tunnel opening */}
      <mesh position={[LEVEL.xMin, 2.0, -5.5]}>
        <boxGeometry args={[0.3, 4.0, 3]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>
      <mesh position={[LEVEL.xMin, 2.0, 4]}>
        <boxGeometry args={[0.3, 4.0, 3]} />
        <meshStandardMaterial color="#3a3a3e" roughness={0.9} />
      </mesh>
      {/* lintel above tunnel */}
      <mesh position={[LEVEL.xMin, 4.0, LEVEL.tunnelZ]}>
        <boxGeometry args={[0.3, 0.8, LEVEL.tunnelWidth]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.9} />
      </mesh>
      {/* dark tunnel interior (a dark box receding) */}
      <mesh position={[LEVEL.xMin - 8, 2.0, LEVEL.tunnelZ]}>
        <boxGeometry args={[16, LEVEL.tunnelHeight + 1, LEVEL.tunnelWidth]} />
        <meshStandardMaterial color="#080606" roughness={1} side={THREE.BackSide} />
      </mesh>
      {/* tunnel floor (dark) */}
      <mesh position={[LEVEL.xMin - 8, 0.01, LEVEL.tunnelZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, LEVEL.tunnelWidth]} />
        <meshStandardMaterial color="#0c0a08" roughness={1} />
      </mesh>
      {/* second set of rails into tunnel */}
      {[LEVEL.tunnelZ - 0.7, LEVEL.tunnelZ + 0.7].map((z, i) => (
        <mesh key={i} position={[LEVEL.xMin - 8, 0.05, z]}>
          <boxGeometry args={[16, 0.08, 0.08]} />
          <meshStandardMaterial color="#4a3a2a" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* fog volume plane at tunnel mouth */}
      <mesh position={[LEVEL.xMin - 0.5, 2.0, LEVEL.tunnelZ]}>
        <planeGeometry args={[LEVEL.tunnelWidth, LEVEL.tunnelHeight]} />
        <meshBasicMaterial color="#1a0f08" transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* ===== CEILING ===== */}
      <mesh position={[cx, LEVEL.ceilingY, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[length, width + 4]} />
        <meshStandardMaterial map={ceilMat} color="#5a5a5e" roughness={0.9} />
      </mesh>
      {/* ceiling backing (seals gap between ceiling and walls) */}
      <mesh position={[cx, LEVEL.ceilingY + 0.1, 0]}>
        <boxGeometry args={[length, 0.2, width + 4]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.9} />
      </mesh>
      {/* exposed pipes along ceiling (HORIZONTAL, running along X axis) */}
      {[-3, 0, 3].map((z, i) => (
        <mesh key={i} position={[cx, LEVEL.ceilingY - 0.2, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, length, 8]} />
          <meshStandardMaterial color="#3a3a3e" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* secondary thinner pipes */}
      {[-2, 2].map((z, i) => (
        <mesh key={`p${i}`} position={[cx, LEVEL.ceilingY - 0.3, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, length, 8]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.5} roughness={0.6} />
        </mesh>
      ))}

      {/* ===== CORNER SEALS (prevent gaps at wall-ceiling-floor junctions) ===== */}
      {/* back wall floor junction */}
      <mesh position={[cx, 0.05, LEVEL.zMax - 0.2]}>
        <boxGeometry args={[length, 0.1, 0.3]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.8} />
      </mesh>
      {/* trackside wall floor junction */}
      <mesh position={[cx, 0.05, LEVEL.zMin - 0.2]}>
        <boxGeometry args={[length, 0.1, 0.3]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.8} />
      </mesh>

      {/* ===== PILLARS ===== */}
      {LEVEL.pillars.map(([x, z], i) => (
        <Pillar key={i} position={[x, 0, z]} />
      ))}

      {/* ===== BENCHES ===== */}
      {LEVEL.benches.map(([x, z], i) => (
        <Bench key={i} position={[x, 0, z]} />
      ))}

      {/* ===== VENDING MACHINES (nook near entrance) ===== */}
      <VendingMachine position={[LEVEL.vendingX - 1.4, 0, LEVEL.vendingZ]} type="coffee" />
      <VendingMachine position={[LEVEL.vendingX, 0, LEVEL.vendingZ]} type="snack" />
      <VendingMachine position={[LEVEL.vendingX + 1.4, 0, LEVEL.vendingZ]} type="drink" />
      <TrashCan position={[LEVEL.vendingX - 2.6, 0, LEVEL.vendingZ]} />

      {/* ===== TURNSTILES (entrance) ===== */}
      {[-2.5, -1.2, 1.2, 2.5].map((z, i) => (
        <Turnstile key={i} position={[LEVEL.turnstileX, 0, z]} />
      ))}
      <TicketBooth position={[LEVEL.turnstileX - 0.2, 0, -4.5]} />

      {/* ===== BILLBOARDS / POSTERS on back wall ===== */}
      <Billboard position={[-34, 2.4, LEVEL.zMax - 0.3]} variant="red" size={[3.0, 2.2]} />
      <Billboard position={[-18, 2.4, LEVEL.zMax - 0.3]} variant="blue" size={[2.4, 1.8]} />
      <Billboard position={[18, 2.4, LEVEL.zMax - 0.3]} variant="ramen" size={[2.4, 1.8]} />
      <Billboard position={[34, 2.6, LEVEL.zMax - 0.3]} variant="red" size={[2.0, 1.6]} />
      {/* poster on trackside wall */}
      <Billboard position={[-6, 2.4, LEVEL.zMin - 3.7]} rotation={[0, Math.PI, 0]} variant="blue" size={[2.4, 1.8]} />

      {/* ===== STATION SIGNS (hanging from ceiling) ===== */}
      <StationSign position={[-20, LEVEL.ceilingY - 0.7, 0]} text="改札" />
      <StationSign position={[20, LEVEL.ceilingY - 0.7, 0]} text="ホーム" />

      {/* ===== DEBRIS ===== */}
      <Debris position={[-28, 0.01, 2]} kind="paper" />
      <Debris position={[-26, 0.01, -1]} kind="bottle" />
      <Debris position={[-14, 0.01, 1.5]} kind="paper" />
      <Debris position={[-8, 0, -2]} kind="barrel" />
      <Debris position={[8, 0, 2]} kind="barrel" />
      <Debris position={[14, 0.01, -1]} kind="bottle" />
      <Debris position={[22, 0.01, 1]} kind="paper" />
      <Debris position={[28, 0, -2]} kind="box" />
      <Debris position={[-40, 0, 1]} kind="barrel" />
      <Debris position={[-38, 0.01, 3]} kind="bottle" />
      <Debris position={[0, 0.01, 3]} kind="paper" />
      <Debris position={[4, 0.01, -2]} kind="bottle" />

      {/* blood pool decals on floor */}
      {[-30, -10, 10, 30].map((x, i) => (
        <mesh key={i} position={[x, 0.02, 1]} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}>
          <circleGeometry args={[0.9 + Math.random() * 0.5, 24]} />
          <meshStandardMaterial color="#3a0606" transparent opacity={0.7} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
