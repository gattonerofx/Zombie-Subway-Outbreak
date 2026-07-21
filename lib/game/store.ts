"use client";

import { create } from "zustand";
import { WEAPONS, type WeaponId } from "./weapons";

export type GamePhase =
  | "menu" // main menu
  | "loading"
  | "playing"
  | "paused"
  | "dead"
  | "victory";

export interface Settings {
  brightness: number; // 0.5 - 1.6
  audioEnabled: boolean;
  masterVolume: number; // 0 - 1
  sfxVolume: number; // 0 - 1
  mouseSensitivity: number; // 0.3 - 2.5
}

export interface ZombieState {
  id: number;
  position: [number, number, number];
  health: number;
  maxHealth: number;
  state: "arise" | "walking" | "running" | "attacking" | "dead";
  hitFlash: number; // timestamp of last hit for flash effect
  dead: boolean;
  deadAt: number; // time of death
  speed: number;
}

interface GameStore {
  // Phase
  phase: GamePhase;
  setPhase: (p: GamePhase) => void;

  // Settings
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  settingsLoaded: boolean;

  // Player
  health: number;
  maxHealth: number;
  takeDamage: (d: number) => void;
  heal: (d: number) => void;
  lastDamageAt: number; // for damage vignette

  // Weapons
  currentWeapon: WeaponId;
  switchWeapon: (w: WeaponId) => void;
  toggleWeapon: () => void;
  ammo: Record<WeaponId, number>; // mag ammo
  reserve: Record<WeaponId, number>; // reserve ammo
  reloading: boolean;
  pumping: boolean;
  // Weapon action requests (consumed by the weapon view component)
  fireRequest: number; // increments to request a shot
  muzzleFlashAt: number;
  lastShotAt: number;
  // ammo mutators
  consumeAmmo: (n: number) => void;
  startReload: () => void;
  finishReload: () => void;
  setReloading: (v: boolean) => void;
  setPumping: (v: boolean) => void;
  addReserve: (w: WeaponId, n: number) => void;
  triggerMuzzle: () => void;

  // Zombies
  zombies: Map<number, ZombieState>;
  zombieSeq: number;
  spawnZombie: (pos: [number, number, number]) => number;
  damageZombie: (id: number, dmg: number, hitPoint?: [number, number, number]) => boolean;
  removeZombie: (id: number) => void;
  clearZombies: () => void;

  // Combat stats
  kills: number;
  score: number;
  wave: number;
  addKill: (points: number) => void;
  setWave: (w: number) => void;
  waveEnemiesRemaining: number;
  setWaveEnemiesRemaining: (n: number) => void;
  waveSpawnQueue: number;
  setWaveSpawnQueue: (n: number) => void;

  // Damage events for blood effects (transient list consumed by effects)
  hitMarkers: { id: number; point: [number, number, number]; at: number }[];
  pushHitMarker: (point: [number, number, number]) => void;
  consumeHitMarkers: () => { id: number; point: [number, number, number]; at: number }[];

  // Killfeed / floating score popups
  popups: { id: number; text: string; at: number; kind: "kill" | "hit" | "wave" }[];
  pushPopup: (text: string, kind?: "kill" | "hit" | "wave") => void;
  popupsSeq: number;

  // Reset
  resetGame: () => void;

  // Score submission
  scoreSubmitted: boolean;
  setScoreSubmitted: (v: boolean) => void;

  // Debug mode
  debugMode: boolean; // show debug console + overlays
  demoMode: boolean; // 2 fixed zombies, no waves, invulnerable
  consoleOpen: boolean; // debug console panel retractable
  setDebugMode: (v: boolean) => void;
  setDemoMode: (v: boolean) => void;
  setConsoleOpen: (v: boolean) => void;
  toggleConsole: () => void;
}

const initialAmmo: Record<WeaponId, number> = {
  machinegun: WEAPONS.machinegun.magSize,
  shotgun: WEAPONS.shotgun.magSize,
};
const initialReserve: Record<WeaponId, number> = {
  machinegun: 120,
  shotgun: 36,
};

export const useGameStore = create<GameStore>((set, get) => ({
  phase: "menu",
  setPhase: (p) => set({ phase: p }),

  settings: {
    brightness: 2.5,
    audioEnabled: true,
    masterVolume: 0.8,
    sfxVolume: 0.9,
    mouseSensitivity: 1.0,
  },
  setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
  settingsLoaded: false,

  health: 100,
  maxHealth: 100,
  takeDamage: (d) =>
    set((st) => {
      if (st.phase !== "playing") return {} as Partial<GameStore>;
      if (st.demoMode) return {} as Partial<GameStore>; // invulnerable in demo mode
      const nh = Math.max(0, st.health - d);
      if (nh <= 0) {
        return { health: 0, phase: "dead", lastDamageAt: performance.now() } as Partial<GameStore>;
      }
      return { health: nh, lastDamageAt: performance.now() } as Partial<GameStore>;
    }),
  heal: (d) => set((st) => ({ health: Math.min(st.maxHealth, st.health + d) })),
  lastDamageAt: 0,

  currentWeapon: "machinegun",
  switchWeapon: (w) =>
    set((st) =>
      st.currentWeapon === w || st.reloading
        ? ({} as Partial<GameStore>)
        : ({ currentWeapon: w, pumping: false } as Partial<GameStore>)
    ),
  toggleWeapon: () =>
    set((st) =>
      st.reloading
        ? ({} as Partial<GameStore>)
        : ({ currentWeapon: st.currentWeapon === "machinegun" ? "shotgun" : "machinegun", pumping: false } as Partial<GameStore>)
    ),
  ammo: { ...initialAmmo },
  reserve: { ...initialReserve },
  reloading: false,
  pumping: false,
  fireRequest: 0,
  muzzleFlashAt: 0,
  lastShotAt: 0,
  consumeAmmo: (n) =>
    set((st) => {
      const w = st.currentWeapon;
      const cur = st.ammo[w];
      return { ammo: { ...st.ammo, [w]: Math.max(0, cur - n) } } as Partial<GameStore>;
    }),
  startReload: () => set({ reloading: true }),
  finishReload: () =>
    set((st) => {
      const w = st.currentWeapon;
      const def = WEAPONS[w];
      const need = def.magSize - st.ammo[w];
      if (need <= 0) return { reloading: false } as Partial<GameStore>;
      if (w === "shotgun") {
        // pump-action: load one shell at a time
        if (st.reserve[w] <= 0) return { reloading: false } as Partial<GameStore>;
        const load = 1;
        const taken = Math.min(load, st.reserve[w]);
        return {
          ammo: { ...st.ammo, [w]: st.ammo[w] + taken },
          reserve: { ...st.reserve, [w]: st.reserve[w] - taken },
          reloading: st.ammo[w] + taken >= def.magSize || st.reserve[w] - taken <= 0 ? false : true,
        } as Partial<GameStore>;
      }
      const taken = Math.min(need, st.reserve[w]);
      return {
        ammo: { ...st.ammo, [w]: st.ammo[w] + taken },
        reserve: { ...st.reserve, [w]: st.reserve[w] - taken },
        reloading: false,
      } as Partial<GameStore>;
    }),
  setReloading: (v) => set({ reloading: v }),
  setPumping: (v) => set({ pumping: v }),
  addReserve: (w, n) =>
    set((st) => {
      const def = WEAPONS[w];
      return { reserve: { ...st.reserve, [w]: Math.min(def.reserveMax, st.reserve[w] + n) } } as Partial<GameStore>;
    }),
  triggerMuzzle: () => set({ muzzleFlashAt: performance.now(), lastShotAt: performance.now(), fireRequest: get().fireRequest + 1 }),

  zombies: new Map(),
  zombieSeq: 1,
  spawnZombie: (pos) => {
    const id = get().zombieSeq;
    const maxHealth = 100;
    set((st) => {
      const m = new Map(st.zombies);
      m.set(id, {
        id,
        position: pos,
        health: maxHealth,
        maxHealth,
        state: "arise",
        hitFlash: 0,
        dead: false,
        deadAt: 0,
        speed: 1.0 + Math.random() * 0.6,
      });
      return { zombies: m, zombieSeq: id + 1 } as Partial<GameStore>;
    });
    return id;
  },
  damageZombie: (id, dmg) => {
    let killed = false;
    set((st) => {
      const z = st.zombies.get(id);
      if (!z || z.dead) return {} as Partial<GameStore>;
      const nh = z.health - dmg;
      if (nh <= 0) {
        killed = true;
        const m = new Map(st.zombies);
        m.set(id, { ...z, health: 0, state: "dead", dead: true, deadAt: performance.now() });
        return { zombies: m } as Partial<GameStore>;
      }
      const m = new Map(st.zombies);
      // If hit while arising, start walking
      const nextState = z.state === "arise" ? "walking" : z.state;
      m.set(id, { ...z, health: nh, state: nextState, hitFlash: performance.now() });
      return { zombies: m } as Partial<GameStore>;
    });
    return killed;
  },
  removeZombie: (id) =>
    set((st) => {
      const m = new Map(st.zombies);
      m.delete(id);
      return { zombies: m } as Partial<GameStore>;
    }),
  clearZombies: () => set({ zombies: new Map() }),

  kills: 0,
  score: 0,
  wave: 0,
  addKill: (points) => set((st) => ({ kills: st.kills + 1, score: st.score + points })),
  setWave: (w) => set({ wave: w }),
  waveEnemiesRemaining: 0,
  setWaveEnemiesRemaining: (n) => set({ waveEnemiesRemaining: n }),
  waveSpawnQueue: 0,
  setWaveSpawnQueue: (n) => set({ waveSpawnQueue: n }),

  hitMarkers: [],
  pushHitMarker: (point) =>
    set((st) => ({
      hitMarkers: [...st.hitMarkers, { id: st.popupsSeq, point, at: performance.now() }].slice(-24),
    })),
  consumeHitMarkers: () => {
    const arr = get().hitMarkers;
    if (arr.length) set({ hitMarkers: [] });
    return arr;
  },

  popups: [],
  popupsSeq: 1,
  pushPopup: (text, kind = "hit") =>
    set((st) => {
      const id = st.popupsSeq;
      return {
        popups: [...st.popups, { id, text, at: performance.now(), kind }].slice(-8),
        popupsSeq: id + 1,
      } as Partial<GameStore>;
    }),

  resetGame: () =>
    set({
      phase: "menu",
      health: 100,
      currentWeapon: "machinegun",
      ammo: { ...initialAmmo },
      reserve: { ...initialReserve },
      reloading: false,
      pumping: false,
      zombies: new Map(),
      zombieSeq: 1,
      kills: 0,
      score: 0,
      wave: 0,
      waveEnemiesRemaining: 0,
      waveSpawnQueue: 0,
      hitMarkers: [],
      popups: [],
      scoreSubmitted: false,
      lastDamageAt: 0,
    }),

  scoreSubmitted: false,
  setScoreSubmitted: (v) => set({ scoreSubmitted: v }),

  debugMode: false,
  demoMode: false,
  consoleOpen: false,
  setDebugMode: (v) => set({ debugMode: v }),
  setDemoMode: (v) => set({ demoMode: v }),
  setConsoleOpen: (v) => set({ consoleOpen: v }),
  toggleConsole: () => set((st) => ({ consoleOpen: !st.consoleOpen })),
}));

// Selectors / helpers
export function getWeaponDef(id: WeaponId) {
  return WEAPONS[id];
}

// Debug exposure (harmless in production)
if (typeof window !== "undefined") {
  (window as unknown as { __gameStore?: typeof useGameStore }).__gameStore = useGameStore;
}
