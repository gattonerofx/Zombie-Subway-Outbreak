"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { initAudio, startAmbient, stopAmbient } from "@/lib/game/audio";
import { gameLog } from "@/lib/game/logger";

interface ScoreRow {
  id: string;
  playerName: string;
  score: number;
  wave: number;
  kills: number;
  weapon: string;
}

export function MainMenu() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const resetGame = useGameStore((s) => s.resetGame);
  const setDebugMode = useGameStore((s) => s.setDebugMode);
  const setDemoMode = useGameStore((s) => s.setDemoMode);
  const setConsoleOpen = useGameStore((s) => s.setConsoleOpen);
  const [leaderboard, setLeaderboard] = useState<ScoreRow[]>([]);
  const [loadingLb, setLoadingLb] = useState(true);
  const [showDebugOptions, setShowDebugOptions] = useState(false);

  useEffect(() => {
    if (phase !== "menu") return;
    stopAmbient();
    // reset debug flags when returning to menu
    setDebugMode(false);
    setDemoMode(false);
    setConsoleOpen(false);
    fetch("/api/scores")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.scores || []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingLb(false));
  }, [phase, setDebugMode, setDemoMode, setConsoleOpen]);

  if (phase !== "menu") return null;

  const startGame = () => {
    initAudio();
    resetGame();
    setDebugMode(false);
    setDemoMode(false);
    setConsoleOpen(false);
    setPhase("playing");
    startAmbient();
    gameLog.info("system", "Game started (normal mode)");
    const canvas = document.querySelector("canvas");
    canvas?.requestPointerLock?.();
  };

  const startDebug = (withDemo: boolean) => {
    initAudio();
    resetGame();
    setDebugMode(true);
    setDemoMode(withDemo);
    setConsoleOpen(true);
    setPhase("playing");
    startAmbient();
    gameLog.info("system", `Debug mode started${withDemo ? " (DEMO: 2 fixed zombies)" : ""}`);
    if (withDemo) {
      gameLog.info("system", "Demo mode: player is invulnerable, 2 fixed zombies (front + behind)");
    }
    const canvas = document.querySelector("canvas");
    canvas?.requestPointerLock?.();
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-black via-[#0a0608] to-[#1a0606] font-mono text-white">
      {/* background scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* red vignette */}
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 200px 80px rgba(80,0,0,0.6)" }} />

      <div className="relative z-10 w-full max-w-3xl px-6 py-10 text-center">
        <div className="mb-2 text-sm uppercase tracking-[0.5em] text-red-500/70">Tokyo Underground</div>
        <h1
          className="text-6xl font-black tracking-tight text-red-600 drop-shadow-[0_0_25px_rgba(200,0,0,0.6)] sm:text-7xl"
          style={{ fontFamily: "monospace" }}
        >
          ZOMBIE
        </h1>
        <h2 className="mb-1 text-2xl font-bold tracking-[0.3em] text-zinc-200"> subway outbreak</h2>
        <div className="mb-8 text-xs text-zinc-500">ゾンビ · 地下鉄 · 生存者</div>

        <div className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-zinc-400">
          The last train never came. The platform is overrun. Hold the line in the Tokyo subway
          against endless waves of the infected.
        </div>

        {/* Main start button */}
        <button
          onClick={startGame}
          className="group relative mb-3 w-64 overflow-hidden rounded-md border border-red-700 bg-red-900/40 px-8 py-4 text-lg font-bold uppercase tracking-widest text-red-100 transition hover:bg-red-700/60 hover:text-white"
        >
          <span className="relative z-10">▶ Start Game</span>
          <span className="absolute inset-0 -translate-x-full bg-red-600/20 transition-transform duration-500 group-hover:translate-x-0" />
        </button>

        {/* Debug mode toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowDebugOptions((v) => !v)}
            className="text-xs uppercase tracking-widest text-cyan-400/70 transition hover:text-cyan-300"
          >
            {showDebugOptions ? "▼" : "▶"} Debug Mode
          </button>

          {showDebugOptions && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <button
                onClick={() => startDebug(false)}
                className="w-72 rounded-md border border-cyan-700/50 bg-cyan-900/20 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-cyan-200 transition hover:bg-cyan-800/40 hover:text-cyan-100"
              >
                ⚙ Start Debug Mode
              </button>
              <div className="text-[10px] text-zinc-500">
                Full game with real-time console, log streaming &amp; debug overlays
              </div>

              <button
                onClick={() => startDebug(true)}
                className="mt-2 w-72 rounded-md border border-amber-700/50 bg-amber-900/20 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-amber-200 transition hover:bg-amber-800/40 hover:text-amber-100"
              >
                🧟 Start Demo (2 Fixed Zombies)
              </button>
              <div className="max-w-xs text-[10px] text-zinc-500">
                Debug mode with only 2 fixed zombies — one in front, one behind — to inspect the
                3D model size &amp; proportions. Player is invulnerable.
              </div>
            </div>
          )}
        </div>

        <div className="mb-10 text-xs text-zinc-500">
          Press <kbd className="rounded border border-white/20 px-1.5 py-0.5">ESC</kbd> in-game to pause · return to menu · resume
        </div>

        {/* Controls */}
        <div className="mx-auto mb-8 grid max-w-lg grid-cols-2 gap-2 text-left text-xs text-zinc-400 sm:grid-cols-4">
          <Ctrl k="WASD" v="Move" />
          <Ctrl k="Mouse" v="Look" />
          <Ctrl k="Click" v="Fire" />
          <Ctrl k="Shift" v="Sprint" />
          <Ctrl k="1 / 2" v="Switch weapon" />
          <Ctrl k="R" v="Reload" />
          <Ctrl k="ESC" v="Pause / Menu" />
          <Ctrl k="` / F3" v="Toggle Console" />
        </div>

        {/* Leaderboard */}
        <div className="mx-auto max-w-lg">
          <div className="mb-2 text-xs uppercase tracking-widest text-amber-300/70">Leaderboard</div>
          <div className="rounded-md border border-white/10 bg-black/40">
            {loadingLb ? (
              <div className="py-6 text-center text-sm text-zinc-500">Loading…</div>
            ) : leaderboard.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-600">No survivors yet. Be the first.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2 text-right">Score</th>
                    <th className="px-3 py-2 text-right">Wave</th>
                    <th className="px-3 py-2 text-right">Kills</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r, i) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0">
                      <td className="px-3 py-1.5 text-zinc-500">{i + 1}</td>
                      <td className="px-3 py-1.5 text-zinc-200">{r.playerName}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-amber-300">{r.score.toLocaleString()}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-red-300">{r.wave}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-zinc-300">{r.kills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Ctrl({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="min-w-[3rem] rounded border border-white/15 bg-white/5 px-2 py-1 text-center text-[10px] text-zinc-200">
        {k}
      </kbd>
      <span className="text-zinc-400">{v}</span>
    </div>
  );
}
