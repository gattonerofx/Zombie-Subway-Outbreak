"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { playerState } from "@/lib/game/shared";

/** Live debug info overlay (top-left): player position, yaw, FPS, zombie positions. */
export function DebugInfoOverlay() {
  const [tick, setTick] = useState(0);
  const zombies = useGameStore((s) => s.zombies);
  const phase = useGameStore((s) => s.phase);

  // Refresh ~5x/sec
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 200);
    return () => clearInterval(interval);
  }, []);
  void tick;

  if (phase !== "playing" && phase !== "paused") return null;

  const px = playerState.position.x;
  const pz = playerState.position.z;
  const py = playerState.position.y;
  const yawDeg = ((playerState.yaw * 180) / Math.PI).toFixed(1);
  const pitchDeg = ((playerState.pitch * 180) / Math.PI).toFixed(1);

  const liveZombies = Array.from(zombies.values()).filter((z) => !z.dead);

  return (
    <div className="absolute left-3 top-3 rounded border border-cyan-700/40 bg-black/70 px-3 py-2 font-mono text-[10px] leading-tight text-cyan-200 backdrop-blur-sm">
      <div className="mb-1 font-bold text-cyan-300">DEBUG</div>
      <div className="text-zinc-400">
        Player:{" "}
        <span className="text-cyan-200">
          X={px.toFixed(1)} Y={py.toFixed(1)} Z={pz.toFixed(1)}
        </span>
      </div>
      <div className="text-zinc-400">
        Yaw: <span className="text-cyan-200">{yawDeg}°</span> Pitch:{" "}
        <span className="text-cyan-200">{pitchDeg}°</span>
      </div>
      <div className="mt-1 border-t border-white/10 pt-1">
        <div className="text-zinc-400">
          Zombies: <span className="text-red-300">{liveZombies.length}</span>
        </div>
        {liveZombies.slice(0, 6).map((z) => {
          const dx = z.position[0] - px;
          const dz = z.position[2] - pz;
          const dist = Math.sqrt(dx * dx + dz * dz);
          // angle relative to player forward (-X = forward when yaw=PI/2)
          const angle = Math.atan2(dx, dz) - playerState.yaw;
          const angleDeg = ((angle * 180) / Math.PI).toFixed(0);
          // is zombie in front (within ±90° of forward)?
          const inFront = Math.abs(angle) < Math.PI / 2;
          return (
            <div key={z.id} className="text-zinc-500">
              #{z.id}: d={dist.toFixed(1)}m{" "}
              <span className={inFront ? "text-green-400" : "text-orange-400"}>
                {inFront ? "FRONT" : "BEHIND"}
              </span>{" "}
              <span className="text-zinc-600">({angleDeg}°)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
