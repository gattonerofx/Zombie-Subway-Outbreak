"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { SubwayLevel } from "./level/SubwayLevel";
import { Player } from "./player/Player";
import { WeaponView } from "./weapons/WeaponView";
import { ZombieManager } from "./enemies/ZombieManager";
import { BloodEffects } from "./effects/BloodEffects";
import { useGameStore } from "@/lib/game/store";
import { initAudio, startAmbient, stopAmbient, setAudioEnabled, setMasterVolume, setSfxVolume } from "@/lib/game/audio";
import { gameLog } from "@/lib/game/logger";

// Initialize rect area light uniforms (required for RectAreaLight to emit light)
RectAreaLightUniformsLib.init();

// Expose THREE for debugging
if (typeof window !== "undefined") {
  (window as unknown as { THREE?: typeof THREE }).THREE = THREE;
}

/** Updates renderer exposure & fog from settings each frame. */
function RenderSettingsController() {
  const { gl, scene } = useThree();
  const brightness = useGameStore((s) => s.settings.brightness);
  useEffect(() => {
    gl.toneMappingExposure = brightness;
    (window as unknown as { __scene?: THREE.Scene }).__scene = scene;
    (window as unknown as { __gl?: THREE.WebGLRenderer }).__gl = gl;
    gameLog.success("render", "WebGL renderer initialized", {
      toneMappingExposure: brightness,
      renderer: gl.capabilities.isWebGL2 ? "WebGL2" : "WebGL1",
    });
  }, [gl, scene, brightness]);
  useEffect(() => {
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.setRGB(0.04 * brightness, 0.03 * brightness, 0.03 * brightness);
    }
  }, [scene, brightness]);
  return null;
}

/** Suspense fallback that logs loading state. */
function LoadingFallback({ label }: { label: string }) {
  useEffect(() => {
    gameLog.debug("asset", `Loading: ${label}…`);
  }, [label]);
  return null;
}

export function GameScene() {
  const phase = useGameStore((s) => s.phase);
  const settings = useGameStore((s) => s.settings);

  // Apply audio settings live
  useEffect(() => {
    setAudioEnabled(settings.audioEnabled);
    setMasterVolume(settings.masterVolume);
    setSfxVolume(settings.sfxVolume);
  }, [settings.audioEnabled, settings.masterVolume, settings.sfxVolume]);

  // Start ambient drone when playing
  useEffect(() => {
    if (phase === "playing") {
      initAudio();
      startAmbient();
      gameLog.info("audio", "Ambient drone started");
    } else {
      stopAmbient();
    }
  }, [phase]);

  // Log GLB asset loading
  useEffect(() => {
    gameLog.info("asset", "Fetching zombie model: /models/zombie.glb (35MB)");
    const start = performance.now();
    fetch("/models/zombie.glb")
      .then((r) => r.blob())
      .then((blob) => {
        const ms = Math.round(performance.now() - start);
        gameLog.success("asset", `Zombie model downloaded`, {
          size: (blob.size / 1024 / 1024).toFixed(1) + " MB",
          time: ms + "ms",
        });
      })
      .catch((e) => gameLog.error("asset", "Failed to download zombie model", e));
  }, []);

  return (
    <Canvas
      dpr={[0.75, 1]}
      gl={{
        antialias: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: settings.brightness,
      }}
      camera={{ fov: 75, near: 0.05, far: 200, position: [26, 1.7, 0] }}
      onCreated={({ gl }) => {
        gl.setClearColor("#15101a");
        const dbg = gl.getContext().getExtension("WEBGL_debug_renderer_info");
        const renderer = dbg ? gl.getContext().getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "unknown";
        gameLog.info("render", "Canvas created", { renderer });
      }}
    >
      <fog attach="fog" args={["#1a1418", 45, 160]} />
      <Suspense fallback={<LoadingFallback label="level & player" />}>
        <RenderSettingsController />
        <SubwayLevel />
        <BloodEffects />
        <Player />
        <WeaponView />
        {/* Zombies load the heavy GLB; isolate so the level renders immediately */}
        <Suspense fallback={<LoadingFallback label="zombie model (35MB GLB)" />}>
          <ZombieManager />
        </Suspense>
      </Suspense>
    </Canvas>
  );
}
