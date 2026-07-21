"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";

export function GameOverScreen() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const resetGame = useGameStore((s) => s.resetGame);
  const score = useGameStore((s) => s.score);
  const wave = useGameStore((s) => s.wave);
  const kills = useGameStore((s) => s.kills);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const scoreSubmitted = useGameStore((s) => s.scoreSubmitted);
  const setScoreSubmitted = useGameStore((s) => s.setScoreSubmitted);

  const [name, setName] = useState("Survivor");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (phase !== "dead") return;
    setSubmitted(scoreSubmitted);
  }, [phase, scoreSubmitted]);

  if (phase !== "dead") return null;

  const submit = async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: name.trim() || "Survivor",
          score,
          wave,
          kills,
          weapon: currentWeapon,
        }),
      });
      setSubmitted(true);
      setScoreSubmitted(true);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    resetGame();
    setPhase("playing");
    const canvas = document.querySelector("canvas");
    canvas?.requestPointerLock?.();
  };
  const toMenu = () => {
    resetGame();
    setPhase("menu");
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 font-mono text-white backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-red-900/50 bg-[#0c0606] p-8 text-center shadow-2xl">
        <div className="mb-1 text-xs uppercase tracking-[0.4em] text-red-600/70">You Died</div>
        <h1 className="mb-6 text-5xl font-black text-red-600 drop-shadow-[0_0_20px_rgba(200,0,0,0.5)]">
          GAME OVER
        </h1>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Score" value={score.toLocaleString()} color="text-amber-300" />
          <Stat label="Wave" value={String(wave)} color="text-red-300" />
          <Stat label="Kills" value={String(kills)} color="text-zinc-200" />
        </div>

        {!submitted ? (
          <div className="mb-6">
            <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-400">Submit to leaderboard</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 24))}
                placeholder="Your name"
                className="flex-1 rounded border border-white/15 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-red-600"
                maxLength={24}
              />
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded border border-red-700 bg-red-800/40 px-4 py-2 text-sm font-bold uppercase tracking-wider text-red-100 transition hover:bg-red-700/60 disabled:opacity-50"
              >
                {submitting ? "…" : "Submit"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded border border-green-800/50 bg-green-900/20 py-2 text-sm text-green-300">
            ✓ Score submitted
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={restart}
            className="flex-1 rounded border border-red-700 bg-red-800/40 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-red-100 transition hover:bg-red-700/60"
          >
            ↻ Retry
          </button>
          <button
            onClick={toMenu}
            className="rounded border border-white/15 bg-white/5 px-4 py-2.5 text-sm uppercase tracking-wider text-zinc-300 transition hover:bg-white/10"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/40 py-3">
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
