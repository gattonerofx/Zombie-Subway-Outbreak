"use client";

export type LogLevel = "info" | "success" | "warn" | "error" | "debug";
export type LogCategory = "system" | "asset" | "render" | "zombie" | "weapon" | "player" | "audio" | "wave" | "net";

export interface LogEntry {
  id: number;
  ts: number; // epoch ms
  level: LogLevel;
  category: LogCategory;
  msg: string;
  data?: unknown;
}

type Listener = (entries: LogEntry[]) => void;

class GameLogger {
  private entries: LogEntry[] = [];
  private maxEntries = 2000;
  private seq = 1;
  private listeners = new Set<Listener>();
  private consoleMirror = true;

  log(level: LogLevel, category: LogCategory, msg: string, data?: unknown) {
    const entry: LogEntry = {
      id: this.seq++,
      ts: Date.now(),
      level,
      category,
      msg,
      data,
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    // Mirror to browser console
    if (this.consoleMirror && typeof console !== "undefined") {
      const prefix = `[${category}]`;
      const full = data !== undefined ? `${msg}` : msg;
      switch (level) {
        case "error":
          console.error(prefix, full, data ?? "");
          break;
        case "warn":
          console.warn(prefix, full, data ?? "");
          break;
        case "success":
        case "info":
          console.info(prefix, full, data ?? "");
          break;
        case "debug":
          console.debug(prefix, full, data ?? "");
          break;
      }
    }
    this.notify();
  }

  info(cat: LogCategory, msg: string, data?: unknown) {
    this.log("info", cat, msg, data);
  }
  success(cat: LogCategory, msg: string, data?: unknown) {
    this.log("success", cat, msg, data);
  }
  warn(cat: LogCategory, msg: string, data?: unknown) {
    this.log("warn", cat, msg, data);
  }
  error(cat: LogCategory, msg: string, data?: unknown) {
    this.log("error", cat, msg, data);
  }
  debug(cat: LogCategory, msg: string, data?: unknown) {
    this.log("debug", cat, msg, data);
  }

  getAll(): LogEntry[] {
    return this.entries;
  }

  getRecent(n: number): LogEntry[] {
    return this.entries.slice(-n);
  }

  clear() {
    this.entries = [];
    this.notify();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const snapshot = this.entries.slice();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  /** Export logs as a text file for download. */
  exportText(): string {
    const lines = this.entries.map((e) => {
      const time = new Date(e.ts).toISOString().split("T")[1] + "";
      const dataStr = e.data !== undefined ? " " + this.safeStringify(e.data) : "";
      return `[${time}] ${e.level.toUpperCase().padEnd(7)} ${e.category.padEnd(8)} | ${e.msg}${dataStr}`;
    });
    return lines.join("\n");
  }

  private safeStringify(obj: unknown): string {
    try {
      if (obj instanceof Error) return obj.message + (obj.stack ? "\n" + obj.stack : "");
      if (typeof obj === "object" && obj !== null) {
        return JSON.stringify(obj, null, 0).slice(0, 500);
      }
      return String(obj);
    } catch {
      return String(obj);
    }
  }

  /** Trigger a browser download of the log file. */
  download(filename = `zombie-game-log-${Date.now()}.txt`) {
    const text = this.exportText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const gameLog = new GameLogger();

// Expose for debugging
if (typeof window !== "undefined") {
  (window as unknown as { gameLog?: GameLogger }).gameLog = gameLog;
}
