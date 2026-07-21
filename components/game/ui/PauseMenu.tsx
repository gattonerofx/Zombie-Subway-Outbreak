"use client";

import { useEffect, useState } from "react";
import { useGameStore, type Settings } from "@/lib/game/store";
import { initAudio } from "@/lib/game/audio";

export function PauseMenu() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const settings = useGameStore((s) => s.settings);
  const setSettings = useGameStore((s) => s.setSettings);
  const resetGame = useGameStore((s) => s.resetGame);
  const [tab, setTab] = useState<"settings" | "help">("settings");
  const [saved, setSaved] = useState(false);

  // Persist settings to backend (debounced)
  useEffect(() => {
    if (phase !== "paused") return;
    const t = setTimeout(() => {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
        .then(() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
        })
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [settings, phase]);

  if (phase !== "paused") return null;

  const debugMode = useGameStore.getState().debugMode;
  const demoMode = useGameStore.getState().demoMode;

  const resume = () => {
    initAudio();
    setPhase("playing");
    const canvas = document.querySelector("canvas");
    canvas?.requestPointerLock?.();
  };
  const quitToMenu = () => {
    resetGame();
    setPhase("menu");
  };

  const update = (patch: Partial<Settings>) => setSettings(patch);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 font-mono text-white backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0c0a0c] shadow-2xl">
        {/* header */}
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="text-xs uppercase tracking-[0.3em] text-red-500/70">Paused</div>
            {debugMode && (
              <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[9px] uppercase text-cyan-300">Debug</span>
            )}
            {demoMode && (
              <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-[9px] uppercase text-amber-300">Demo</span>
            )}
          </div>
          <div className="text-2xl font-bold">Settings</div>
        </div>

        {/* tabs */}
        <div className="flex border-b border-white/10 px-6 text-xs">
          <button
            onClick={() => setTab("settings")}
            className={`mr-4 border-b-2 py-2 px-1 uppercase tracking-wider transition ${
              tab === "settings" ? "border-red-500 text-red-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setTab("help")}
            className={`border-b-2 py-2 px-1 uppercase tracking-wider transition ${
              tab === "help" ? "border-red-500 text-red-300" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Controls
          </button>
        </div>

        {tab === "settings" ? (
          <div className="space-y-5 px-6 py-5">
            {/* Lighting / Brightness */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
                <span>🔆 Lighting</span>
                <span className="tabular-nums text-amber-300">{settings.brightness.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={4.0}
                step={0.1}
                value={settings.brightness}
                onChange={(e) => update({ brightness: parseFloat(e.target.value) })}
                className="w-full accent-red-600"
              />
              <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
                <span>Darker</span>
                <span>Brighter</span>
              </div>
            </div>

            {/* Audio on/off */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
                <span>🔊 Audio</span>
                <button
                  onClick={() => update({ audioEnabled: !settings.audioEnabled })}
                  className={`rounded border px-3 py-1 text-xs transition ${
                    settings.audioEnabled
                      ? "border-green-600 bg-green-900/30 text-green-300"
                      : "border-zinc-600 bg-zinc-800/50 text-zinc-400"
                  }`}
                >
                  {settings.audioEnabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            {/* Master volume */}
            <div className={settings.audioEnabled ? "" : "opacity-40"}>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
                <span>Master Volume</span>
                <span className="tabular-nums text-amber-300">{Math.round(settings.masterVolume * 100)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.masterVolume}
                disabled={!settings.audioEnabled}
                onChange={(e) => update({ masterVolume: parseFloat(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* SFX volume */}
            <div className={settings.audioEnabled ? "" : "opacity-40"}>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
                <span>SFX Volume</span>
                <span className="tabular-nums text-amber-300">{Math.round(settings.sfxVolume * 100)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.sfxVolume}
                disabled={!settings.audioEnabled}
                onChange={(e) => update({ sfxVolume: parseFloat(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* Mouse sensitivity */}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
                <span>🖱️ Mouse Sensitivity</span>
                <span className="tabular-nums text-amber-300">{settings.mouseSensitivity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={2.5}
                step={0.05}
                value={settings.mouseSensitivity}
                onChange={(e) => update({ mouseSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {saved && <div className="text-center text-[10px] text-green-400">Settings saved</div>}
          </div>
        ) : (
          <div className="space-y-2 px-6 py-5 text-xs text-zinc-300">
            <Row k="W A S D" v="Move" />
            <Row k="Mouse" v="Look around" />
            <Row k="Left Click" v="Fire weapon" />
            <Row k="Shift" v="Sprint" />
            <Row k="1 / 2" v="Switch weapon (MG / Shotgun)" />
            <Row k="R" v="Reload" />
            <Row k="ESC" v="Pause / Resume" />
            <div className="mt-4 rounded border border-white/10 bg-black/30 p-3 text-[11px] text-zinc-400">
              <div className="mb-1 font-bold text-amber-300">Weapons</div>
              <div><span className="text-red-300">M4 Carbine</span> — 3-round burst, 30-round mag.</div>
              <div><span className="text-red-300">M870 Pump</span> — 12 shells, pump-action after each shot.</div>
            </div>
          </div>
        )}

        {/* footer actions */}
        <div className="flex gap-2 border-t border-white/10 px-6 py-4">
          <button
            onClick={resume}
            className="flex-1 rounded border border-red-700 bg-red-800/40 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-red-100 transition hover:bg-red-700/60"
          >
            Resume
          </button>
          <button
            onClick={quitToMenu}
            className="rounded border border-white/15 bg-white/5 px-4 py-2.5 text-sm uppercase tracking-wider text-zinc-300 transition hover:bg-white/10"
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-1">
      <kbd className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-200">{k}</kbd>
      <span className="text-zinc-400">{v}</span>
    </div>
  );
}
