"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { WEAPONS } from "@/lib/game/weapons";
import { initAudio } from "@/lib/game/audio";
import { DebugInfoOverlay } from "./DebugInfoOverlay";

/** In-game HUD overlay: health, ammo, weapon, score, wave, crosshair, damage vignette, popups. */
export function HUD() {
  const phase = useGameStore((s) => s.phase);
  const health = useGameStore((s) => s.health);
  const maxHealth = useGameStore((s) => s.maxHealth);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const ammo = useGameStore((s) => s.ammo);
  const reserve = useGameStore((s) => s.reserve);
  const reloading = useGameStore((s) => s.reloading);
  const pumping = useGameStore((s) => s.pumping);
  const kills = useGameStore((s) => s.kills);
  const score = useGameStore((s) => s.score);
  const wave = useGameStore((s) => s.wave);
  const lastDamageAt = useGameStore((s) => s.lastDamageAt);
  const popups = useGameStore((s) => s.popups);
  const debugMode = useGameStore((s) => s.debugMode);
  const demoMode = useGameStore((s) => s.demoMode);

  const [damageFlash, setDamageFlash] = useState(0);
  const [lowHealth, setLowHealth] = useState(false);

  // Damage vignette pulse
  useEffect(() => {
    if (lastDamageAt > 0) {
      setDamageFlash(1);
      const t = setTimeout(() => setDamageFlash(0), 350);
      return () => clearTimeout(t);
    }
  }, [lastDamageAt]);

  // Low health heartbeat
  useEffect(() => {
    setLowHealth(health < 35 && health > 0);
  }, [health]);

  const def = WEAPONS[currentWeapon];
  const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  if (phase !== "playing" && phase !== "paused" && phase !== "dead") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none font-mono text-white">
      {/* Demo mode banner */}
      {demoMode && phase === "playing" && (
        <div className="absolute left-1/2 top-20 -translate-x-1/2 rounded border border-amber-600/50 bg-amber-950/60 px-4 py-1 text-center text-xs text-amber-200 backdrop-blur">
          🧟 DEMO MODE — 2 fixed zombies · Invulnerable · ESC to return to menu
        </div>
      )}

      {/* Debug info overlay */}
      {debugMode && <DebugInfoOverlay />}

      {/* Damage vignette */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: damageFlash,
          boxShadow: "inset 0 0 200px 60px rgba(170,10,10,0.85)",
        }}
      />
      {/* Low health pulsing vignette */}
      {lowHealth && phase === "playing" && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ boxShadow: "inset 0 0 160px 40px rgba(150,0,0,0.45)" }}
        />
      )}

      {/* Crosshair */}
      {phase === "playing" && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative h-6 w-6">
            <span className="absolute left-1/2 top-0 h-2 w-[2px] -translate-x-1/2 bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
            <span className="absolute bottom-0 left-1/2 h-2 w-[2px] -translate-x-1/2 bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
            <span className="absolute left-0 top-1/2 h-[2px] w-2 -translate-y-1/2 bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
            <span className="absolute right-0 top-1/2 h-[2px] w-2 -translate-y-1/2 bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.9)]" />
            <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" />
          </div>
        </div>
      )}

      {/* Top bar: wave + score + kills */}
      <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-6 rounded-md border border-white/10 bg-black/55 px-6 py-2 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-red-400/80">Wave</div>
          <div className="text-xl font-bold tabular-nums text-red-300">{wave || "—"}</div>
        </div>
        <div className="h-8 w-px bg-white/15" />
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-amber-300/80">Score</div>
          <div className="text-xl font-bold tabular-nums text-amber-200">{score.toLocaleString()}</div>
        </div>
        <div className="h-8 w-px bg-white/15" />
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-zinc-300/80">Kills</div>
          <div className="text-xl font-bold tabular-nums text-zinc-100">{kills}</div>
        </div>
      </div>

      {/* Bottom-left: health */}
      <div className="absolute bottom-6 left-6 w-64">
        <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wider">
          <span className="text-red-300/90">Health</span>
          <span className={`tabular-nums ${health < 35 ? "text-red-400" : "text-zinc-200"}`}>{Math.ceil(health)}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-sm border border-white/15 bg-black/50">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${healthPct}%`,
              background:
                health < 35
                  ? "linear-gradient(90deg,#7a0d0d,#d62828)"
                  : "linear-gradient(90deg,#2d6a2d,#5cb85c)",
            }}
          />
        </div>
      </div>

      {/* Bottom-right: weapon + ammo */}
      <div className="absolute bottom-6 right-6 text-right">
        <div className="mb-1 text-xs uppercase tracking-widest text-zinc-400">
          {def.name} <span className="text-zinc-500">/ {def.nameJa}</span>
        </div>
        <div className="flex items-end justify-end gap-2">
          <span
            className={`text-4xl font-bold tabular-nums ${
              ammo[currentWeapon] === 0 ? "text-red-500" : "text-white"
            }`}
          >
            {ammo[currentWeapon]}
          </span>
          <span className="mb-1 text-lg text-zinc-400">/ {reserve[currentWeapon]}</span>
        </div>
        <div className="mt-1 h-1 w-40 overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full bg-amber-400/80 transition-all"
            style={{ width: `${(ammo[currentWeapon] / def.magSize) * 100}%` }}
          />
        </div>
        <div className="mt-1 h-5 text-xs">
          {reloading && (
            <span className="animate-pulse text-amber-300">
              {currentWeapon === "shotgun" ? "LOADING SHELLS…" : "RELOADING…"}
            </span>
          )}
          {pumping && !reloading && <span className="text-amber-300">PUMP</span>}
        </div>
      </div>

      {/* Weapon switch hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-[11px] text-zinc-400/80">
        <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5">1</span> MG
        <span className="mx-2">·</span>
        <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5">2</span> Shotgun
        <span className="mx-2">·</span>
        <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5">R</span> Reload
        <span className="mx-2">·</span>
        <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5">ESC</span> Pause
      </div>

      {/* Floating popups */}
      <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center">
        {popups.map((p) => (
          <div
            key={p.id}
            className={`mb-1 text-lg font-bold drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] ${
              p.kind === "kill"
                ? "text-red-400"
                : p.kind === "wave"
                  ? "text-amber-300"
                  : "text-white/70"
            }`}
            style={{ animation: "popupFade 1.2s ease-out forwards" }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* Click-to-resume hint when playing but pointer not locked */}
      {phase === "playing" && (
        <ClickToFocus />
      )}

      <style>{`
        @keyframes popupFade {
          0% { opacity: 0; transform: translateY(8px) scale(0.9); }
          15% { opacity: 1; transform: translateY(0) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}

function ClickToFocus() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const check = () => {
      setShow(useGameStore.getState().phase === "playing" && !document.pointerLockElement);
    };
    check();
    document.addEventListener("pointerlockchange", check);
    const interval = setInterval(check, 500);
    return () => {
      document.removeEventListener("pointerlockchange", check);
      clearInterval(interval);
    };
  }, []);
  if (!show) return null;
  return (
    <div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/20"
      onClick={() => {
        initAudio();
        const el = document.querySelector("canvas");
        el?.requestPointerLock?.();
      }}
    >
      <div className="rounded-lg border border-white/15 bg-black/70 px-8 py-5 text-center">
        <div className="text-2xl font-bold text-white">Click to Resume</div>
        <div className="mt-1 text-sm text-zinc-400">Pointer lock required to aim</div>
      </div>
    </div>
  );
}
