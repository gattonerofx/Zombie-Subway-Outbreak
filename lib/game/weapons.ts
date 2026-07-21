// Weapon definitions for the FPS game
export type WeaponId = "machinegun" | "shotgun";

export interface WeaponDef {
  id: WeaponId;
  name: string;
  nameJa: string;
  // Ammo
  magSize: number; // rounds per magazine
  reserveMax: number; // max reserve ammo
  // Firing
  damage: number; // per pellet/bullet
  pellets: number; // bullets per shot (1 for MG, 8 for shotgun)
  spread: number; // radians of inaccuracy
  fireMode: "burst" | "pump";
  burstCount: number; // rounds per burst (MG = 3)
  burstDelay: number; // seconds between burst rounds
  fireInterval: number; // seconds between trigger pulls
  range: number; // meters
  // Reload
  reloadTime: number; // seconds (pump = per shell time)
  pumpTime: number; // seconds for pump-action cycle (shotgun)
  // Audio cues
  // Recoil
  recoilVertical: number; // radians
  recoilHorizontal: number; // radians
  // Muzzle
  muzzleScale: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  machinegun: {
    id: "machinegun",
    name: "M4 Carbine",
    nameJa: "M4 カービン",
    magSize: 30,
    reserveMax: 180,
    damage: 22,
    pellets: 1,
    spread: 0.012,
    fireMode: "burst",
    burstCount: 3,
    burstDelay: 0.08,
    fireInterval: 0.34,
    range: 80,
    reloadTime: 2.0,
    pumpTime: 0,
    recoilVertical: 0.018,
    recoilHorizontal: 0.008,
    muzzleScale: 1.0,
  },
  shotgun: {
    id: "shotgun",
    name: "M870 Pump",
    nameJa: "M870 ポンプ",
    magSize: 12,
    reserveMax: 48,
    damage: 18, // per pellet, 8 pellets
    pellets: 8,
    spread: 0.07,
    fireMode: "pump",
    burstCount: 1,
    burstDelay: 0,
    fireInterval: 0.9,
    range: 30,
    reloadTime: 0.55, // per shell
    pumpTime: 0.6,
    recoilVertical: 0.05,
    recoilHorizontal: 0.02,
    muzzleScale: 1.8,
  },
};
