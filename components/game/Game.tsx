"use client";

import { useEffect, useState } from "react";
import { GameScene } from "./GameScene";
import { HUD } from "./ui/HUD";
import { MainMenu } from "./ui/MainMenu";
import { PauseMenu } from "./ui/PauseMenu";
import { GameOverScreen } from "./ui/GameOverScreen";
import { DebugConsole } from "./ui/DebugConsole";
import { useGameStore } from "@/lib/game/store";
import { gameLog } from "@/lib/game/logger";

/** Root game component: persistent canvas + UI overlays. */
export function Game() {
  const phase = useGameStore((s) => s.phase);
  const setSettings = useGameStore((s) => s.setSettings);
  const [ready, setReady] = useState(false);

  // System startup log
  useEffect(() => {
    gameLog.info("system", "Zombie Subway Outbreak — initializing");
    gameLog.info("system", "Loading settings from server…");
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings(d.settings);
          gameLog.success("system", "Settings loaded", d.settings);
        }
      })
      .catch((e) => {
        gameLog.warn("system", "Failed to load settings, using defaults", e);
      })
      .finally(() => {
        setReady(true);
        gameLog.success("system", "Game ready");
      });
  }, [setSettings]);

  // Global ESC handler for pause toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      const st = useGameStore.getState();
      if (st.phase === "playing") {
        if (!document.pointerLockElement) st.setPhase("paused");
      } else if (st.phase === "paused") {
        st.setPhase("playing");
        const canvas = document.querySelector("canvas");
        canvas?.requestPointerLock?.();
      } else if (st.phase === "dead") {
        // ESC on death screen -> back to menu
        st.resetGame();
        st.setPhase("menu");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black font-mono text-red-500">
        <div className="text-center">
          <div className="mb-3 text-2xl font-bold tracking-widest animate-pulse">LOADING…</div>
          <div className="text-xs text-zinc-600">Preparing the outbreak</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* The 3D canvas (always mounted so the scene persists) */}
      <GameScene />

      {/* UI overlays */}
      <HUD />
      <PauseMenu />
      <GameOverScreen />
      <MainMenu />

      {/* Debug console (only renders in debug mode) */}
      <DebugConsole />

      {/* Vignette overlay for mood */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ boxShadow: "inset 0 0 140px 20px rgba(0,0,0,0.45)" }}
      />
    </div>
  );
}
