// Level layout constants shared across components (collision, spawning, etc.)

// The platform runs along X axis. Player starts near entrance (+X end),
// tunnel / spawn point at -X end.
export const LEVEL = {
  // Platform extent (walkable floor)
  xMin: -48, // tunnel wall (zombies spawn beyond this)
  xMax: 46, // entrance wall
  zMin: -5, // track edge (player blocked here)
  zMax: 6, // back wall
  floorY: 0,
  ceilingY: 4.2,
  // Tunnel mouth (where zombies emerge)
  tunnelX: -48,
  tunnelZ: -2.5,
  tunnelWidth: 5,
  tunnelHeight: 4,
  // Player start
  playerStart: [26, 1.7, 0] as [number, number, number],
  playerStartYaw: Math.PI / 2, // face -X (toward tunnel). yaw=PI/2 -> forward=(-1,0,0)
  // Pillar positions along the platform (x, z)
  pillars: [
    [-36, -1],
    [-24, -1],
    [-12, -1],
    [0, -1],
    [12, -1],
    [24, -1],
    [36, -1],
  ] as [number, number][],
  pillarRadius: 0.7,
  // Benches along back wall
  benches: [
    [-30, 5.4],
    [-10, 5.4],
    [10, 5.4],
    [30, 5.4],
  ] as [number, number][],
  // Vending machines nook (near entrance)
  vendingX: 38,
  vendingZ: 5.5,
  // Turnstiles (entrance)
  turnstileX: 44,
  // Track
  trackZ: -7, // center of track
  trackWidth: 3,
  // Lights along ceiling
  lights: [-42, -30, -18, -6, 6, 18, 30, 42] as number[],
};

// Collision: list of cylinder obstacles (pillars) and AABB walls.
export const COLLIDERS = {
  // Pillar cylinders: [x, z, radius]
  pillars: LEVEL.pillars.map(([x, z]) => ({ x, z, r: LEVEL.pillarRadius + 0.3 })),
  // World bounds for the player (clamped)
  bounds: { xMin: LEVEL.xMin + 1.2, xMax: LEVEL.xMax - 1.2, zMin: LEVEL.zMin + 0.4, zMax: LEVEL.zMax - 0.5 },
  // Vending machine block
  vending: { x: LEVEL.vendingX, z: LEVEL.vendingZ + 0.6, hw: 2.2, hd: 0.7 },
  // Turnstile block
  turnstile: { x: LEVEL.turnstileX, z: 0, hw: 0.6, hd: 3.5 },
  // Benches
  benches: LEVEL.benches.map(([x, z]) => ({ x, z, hw: 1.1, hd: 0.5 })),
};

// Resolve a proposed position against colliders; returns adjusted [x,z].
export function resolveCollision(
  x: number,
  z: number,
  prevX: number,
  prevZ: number,
  radius = 0.35
): [number, number] {
  let nx = x;
  let nz = z;

  // World bounds
  nx = Math.max(COLLIDERS.bounds.xMin, Math.min(COLLIDERS.bounds.xMax, nx));
  nz = Math.max(COLLIDERS.bounds.zMin, Math.min(COLLIDERS.bounds.zMax, nz));

  // Pillar cylinders
  for (const p of COLLIDERS.pillars) {
    const dx = nx - p.x;
    const dz = nz - p.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = p.r + radius;
    if (dist < minDist && dist > 0.0001) {
      const push = (minDist - dist) / dist;
      nx += dx * push;
      nz += dz * push;
    }
  }

  // AABB obstacles (vending, turnstile, benches): push out on the smaller axis
  const aabbs = [COLLIDERS.vending, COLLIDERS.turnstile, ...COLLIDERS.benches];
  for (const b of aabbs) {
    const minX = b.x - b.hw - radius;
    const maxX = b.x + b.hw + radius;
    const minZ = b.z - b.hd - radius;
    const maxZ = b.z + b.hd + radius;
    if (nx > minX && nx < maxX && nz > minZ && nz < maxZ) {
      // Determine overlap on each axis from previous position
      const fromX = prevX < minX || prevX > maxX;
      const fromZ = prevZ < minZ || prevZ > maxZ;
      if (fromX && !fromZ) {
        // came from x side -> push out on x
        nx = prevX < b.x ? minX : maxX;
      } else if (fromZ && !fromX) {
        nz = prevZ < b.z ? minZ : maxZ;
      } else {
        // corner / both: push out on nearest
        const dLeft = Math.abs(nx - minX);
        const dRight = Math.abs(maxX - nx);
        const dTop = Math.abs(nz - minZ);
        const dBot = Math.abs(maxZ - nz);
        const m = Math.min(dLeft, dRight, dTop, dBot);
        if (m === dLeft) nx = minX;
        else if (m === dRight) nx = maxX;
        else if (m === dTop) nz = minZ;
        else nz = maxZ;
      }
    }
  }

  return [nx, nz];
}
