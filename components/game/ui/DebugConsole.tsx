"use client";

import { useEffect, useRef, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { gameLog, type LogEntry, type LogLevel } from "@/lib/game/logger";

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "text-zinc-300",
  success: "text-green-400",
  warn: "text-yellow-400",
  error: "text-red-400",
  debug: "text-blue-300",
};

const LEVEL_BG: Record<LogLevel, string> = {
  info: "",
  success: "bg-green-950/30",
  warn: "bg-yellow-950/30",
  error: "bg-red-950/40",
  debug: "bg-blue-950/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  system: "text-purple-400",
  asset: "text-cyan-400",
  render: "text-blue-400",
  zombie: "text-red-400",
  weapon: "text-orange-400",
  player: "text-green-400",
  audio: "text-pink-400",
  wave: "text-amber-400",
  net: "text-indigo-400",
};

/** Retractable debug console panel on the right side of the screen. */
export function DebugConsole() {
  const debugMode = useGameStore((s) => s.debugMode);
  const consoleOpen = useGameStore((s) => s.consoleOpen);
  const toggleConsole = useGameStore((s) => s.toggleConsole);
  const setConsoleOpen = useGameStore((s) => s.setConsoleOpen);
  const phase = useGameStore((s) => s.phase);
  const demoMode = useGameStore((s) => s.demoMode);
  const zombies = useGameStore((s) => s.zombies);
  const health = useGameStore((s) => s.health);

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryCount = useRef(0);

  // Subscribe to logger
  useEffect(() => {
    if (!debugMode) return;
    const unsub = gameLog.subscribe((all) => {
      setEntries(all.slice(-500));
    });
    setEntries(gameLog.getRecent(500));
    return unsub;
  }, [debugMode]);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (autoScroll && scrollRef.current && consoleOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, autoScroll, consoleOpen]);

  // Keyboard shortcut: toggle console with backtick (`) or F3
  useEffect(() => {
    if (!debugMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Backquote" || e.code === "F3") {
        e.preventDefault();
        toggleConsole();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [debugMode, toggleConsole]);

  if (!debugMode) return null;

  const filtered = filter === "all" ? entries : entries.filter((e) => e.category === filter);

  const categories = ["all", "system", "asset", "render", "zombie", "weapon", "player", "audio", "wave", "net"];

  const handleExport = () => {
    gameLog.download();
  };

  const handleClear = () => {
    gameLog.clear();
  };

  // Live stats
  const liveZombies = Array.from(zombies.values()).filter((z) => !z.dead);
  const errorCount = entries.filter((e) => e.level === "error").length;
  const warnCount = entries.filter((e) => e.level === "warn").length;

  return (
    <>
      {/* Toggle button (always visible in debug mode) */}
      {!consoleOpen && (
        <button
          onClick={() => setConsoleOpen(true)}
          className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-md border border-l-0 border-white/20 bg-black/80 px-2 py-4 font-mono text-[10px] uppercase tracking-widest text-cyan-300 transition hover:bg-black/90 hover:px-3"
          title="Open debug console (` or F3)"
        >
          <div className="flex flex-col items-center gap-1">
            <span>▶</span>
            <span
              className="writing-vertical"
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              Console
            </span>
            {errorCount > 0 && <span className="text-red-400">●{errorCount}</span>}
          </div>
        </button>
      )}

      {/* Console panel */}
      {consoleOpen && (
        <div className="fixed right-0 top-0 z-40 flex h-full w-[420px] max-w-[90vw] flex-col border-l border-white/15 bg-[#0a0a0c]/95 font-mono text-xs shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-cyan-300">⚙ DEBUG CONSOLE</span>
              {demoMode && (
                <span className="rounded bg-amber-900/50 px-1.5 py-0.5 text-[9px] uppercase text-amber-300">
                  Demo
                </span>
              )}
              {errorCount > 0 && (
                <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-[9px] text-red-300">
                  {errorCount} err
                </span>
              )}
              {warnCount > 0 && (
                <span className="rounded bg-yellow-900/40 px-1.5 py-0.5 text-[9px] text-yellow-300">
                  {warnCount} warn
                </span>
              )}
            </div>
            <button
              onClick={() => setConsoleOpen(false)}
              className="rounded px-1.5 py-0.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              title="Hide console (` or F3)"
            >
              ✕
            </button>
          </div>

          {/* Live stats bar */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-3 py-1.5 text-[10px] text-zinc-400">
            <span>
              PHASE: <span className="text-cyan-300">{phase}</span>
            </span>
            <span>
              HP: <span className={health < 35 ? "text-red-400" : "text-green-400"}>{health}</span>
            </span>
            <span>
              ZOMBIES: <span className="text-red-400">{liveZombies.length}</span>
            </span>
            <span>
              LOGS: <span className="text-zinc-300">{entries.length}</span>
            </span>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-1 border-b border-white/10 bg-black/30 px-2 py-1.5">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded border border-white/15 bg-black/50 px-1.5 py-0.5 text-[10px] text-zinc-300 outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-[10px] text-zinc-400">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-cyan-500"
              />
              auto-scroll
            </label>
            <div className="flex-1" />
            <button
              onClick={handleExport}
              className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:bg-white/10"
              title="Export log to file"
            >
              ⬇ Save
            </button>
            <button
              onClick={handleClear}
              className="rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:bg-white/10"
            >
              Clear
            </button>
          </div>

          {/* Log entries */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-1 text-[11px] leading-relaxed"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#333 transparent",
            }}
          >
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-zinc-600">No log entries</div>
            ) : (
              filtered.map((e) => {
                const time = new Date(e.ts).toLocaleTimeString("en-US", { hour12: false }) + "." + String(e.ts % 1000).padStart(3, "0");
                const dataStr =
                  e.data !== undefined
                    ? typeof e.data === "object"
                      ? JSON.stringify(e.data)
                      : String(e.data)
                    : "";
                return (
                  <div
                    key={e.id}
                    className={`flex gap-1.5 border-b border-white/5 px-1 py-0.5 ${LEVEL_BG[e.level]}`}
                  >
                    <span className="shrink-0 text-zinc-600">{time.split(" ")[1] || time}</span>
                    <span className={`shrink-0 uppercase ${LEVEL_COLORS[e.level]}`} style={{ width: "42px" }}>
                      {e.level}
                    </span>
                    <span
                      className={`shrink-0 ${CATEGORY_COLORS[e.category] || "text-zinc-500"}`}
                      style={{ width: "52px" }}
                    >
                      {e.category}
                    </span>
                    <span className="break-all text-zinc-300">
                      {e.msg}
                      {dataStr && <span className="text-zinc-500"> {dataStr}</span>}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-black/60 px-3 py-1.5 text-[9px] text-zinc-500">
            <span>` or F3 to toggle</span>
            <span className="mx-2">·</span>
            <span>ESC to pause</span>
            <span className="mx-2">·</span>
            <span>{filtered.length} entries</span>
          </div>

          {/* Scrollbar styling */}
          <style>{`
            .overflow-y-auto::-webkit-scrollbar { width: 6px; }
            .overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
            .overflow-y-auto::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
          `}</style>
        </div>
      )}
    </>
  );
}
