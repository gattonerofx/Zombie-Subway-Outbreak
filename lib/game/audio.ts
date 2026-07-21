"use client";

import { useGameStore } from "./store";

/**
 * Procedural audio engine using the Web Audio API.
 * All SFX are synthesized at runtime - no external sound files needed.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let ambientNodes: { stop: () => void } | null = null;
let audioEnabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.9;
    sfxGain.connect(masterGain);
  }
  return ctx;
}

export function initAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume();
}

export function setAudioEnabled(v: boolean) {
  audioEnabled = v;
  if (masterGain) masterGain.gain.value = v ? useGameStore.getState().settings.masterVolume : 0;
}

export function setMasterVolume(v: number) {
  if (masterGain) masterGain.gain.value = audioEnabled ? v : 0;
}

export function setSfxVolume(v: number) {
  if (sfxGain) sfxGain.gain.value = v;
}

// Create a white noise buffer
function makeNoiseBuffer(c: AudioContext, duration: number): AudioBuffer {
  const len = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function envGain(c: AudioContext, peak: number, attack: number, decay: number): GainNode {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

// ---- Machine gun shot (sharp burst) ----
export function playMachineGunShot() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;

  // Body: noise burst through lowpass + bandpass for "crack"
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.15);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(3500, t);
  lp.frequency.exponentialRampToValueAtTime(800, t + 0.1);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  bp.Q.value = 0.7;
  const g1 = envGain(c, 0.5, 0.001, 0.12);
  noise.connect(lp);
  lp.connect(bp);
  bp.connect(g1);
  g1.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.16);

  // Low thump
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
  const g2 = envGain(c, 0.35, 0.001, 0.09);
  osc.connect(g2);
  g2.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.12);

  // High crack click
  const click = c.createOscillator();
  click.type = "square";
  click.frequency.setValueAtTime(2200, t);
  const g3 = envGain(c, 0.18, 0.0005, 0.02);
  click.connect(g3);
  g3.connect(sfxGain);
  click.start(t);
  click.stop(t + 0.03);
}

// ---- Shotgun blast (big, boomy) ----
export function playShotgunShot() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;

  // Big noise burst
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.35);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2200, t);
  lp.frequency.exponentialRampToValueAtTime(300, t + 0.3);
  const g1 = envGain(c, 0.75, 0.001, 0.32);
  noise.connect(lp);
  lp.connect(g1);
  g1.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.36);

  // Deep boom
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
  const g2 = envGain(c, 0.7, 0.002, 0.28);
  osc.connect(g2);
  g2.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.32);

  // Bright crack
  const noise2 = c.createBufferSource();
  noise2.buffer = makeNoiseBuffer(c, 0.05);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 3000;
  const g3 = envGain(c, 0.4, 0.0005, 0.05);
  noise2.connect(hp);
  hp.connect(g3);
  g3.connect(sfxGain);
  noise2.start(t);
  noise2.stop(t + 0.06);
}

// ---- Shotgun pump action ----
export function playShotgunPump() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;

  // Rack slide (noise sweep)
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.25);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(600, t);
  bp.frequency.linearRampToValueAtTime(1400, t + 0.18);
  bp.Q.value = 1.2;
  const g1 = envGain(c, 0.25, 0.01, 0.2);
  noise.connect(bp);
  bp.connect(g1);
  g1.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.22);

  // Click-clack
  const click = c.createOscillator();
  click.type = "square";
  click.frequency.setValueAtTime(900, t + 0.18);
  const g2 = envGain(c, 0.3, 0.001, 0.04);
  g2.gain.setValueAtTime(0, t);
  g2.gain.setValueAtTime(0, t + 0.17);
  g2.gain.linearRampToValueAtTime(0.3, t + 0.171);
  g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  click.connect(g2);
  g2.connect(sfxGain);
  click.start(t + 0.18);
  click.stop(t + 0.24);
}

// ---- Reload click ----
export function playReloadClick() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(700, t);
  osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
  const g = envGain(c, 0.18, 0.001, 0.05);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.06);
}

// ---- Empty click ----
export function playEmptyClick() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.value = 1200;
  const g = envGain(c, 0.12, 0.001, 0.03);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.04);
}

// ---- Shell insert (shotgun reload) ----
export function playShellInsert() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  // metallic ping
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1600, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.06);
  const g = envGain(c, 0.22, 0.001, 0.08);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.1);
}

// ---- Zombie groan (varied) ----
export function playZombieGroan(variant = 0) {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;

  // Growl: low oscillator with vibrato + noise
  const base = 70 + variant * 15;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.linearRampToValueAtTime(base * 0.7, t + 0.6);

  const lfo = c.createOscillator();
  lfo.frequency.value = 7 + Math.random() * 4;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 12;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  lp.Q.value = 3;

  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.22, t + 0.1);
  g.gain.linearRampToValueAtTime(0.18, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

  osc.connect(lp);
  lp.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.95);
  lfo.stop(t + 0.95);

  // breathy noise layer
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.6);
  const nlp = c.createBiquadFilter();
  nlp.type = "bandpass";
  nlp.frequency.value = 500;
  nlp.Q.value = 0.8;
  const ng = envGain(c, 0.08, 0.05, 0.5);
  noise.connect(nlp);
  nlp.connect(ng);
  ng.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.6);
}

// ---- Zombie attack swipe ----
export function playZombieAttack() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  // whoosh
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.3);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.linearRampToValueAtTime(1200, t + 0.2);
  bp.Q.value = 0.8;
  const g = envGain(c, 0.22, 0.04, 0.24);
  noise.connect(bp);
  bp.connect(g);
  g.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.3);
}

// ---- Player hurt ----
export function playPlayerHurt() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.2);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 600;
  const g = envGain(c, 0.3, 0.001, 0.18);
  noise.connect(lp);
  lp.connect(g);
  g.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.22);
  // thud
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  const g2 = envGain(c, 0.35, 0.001, 0.16);
  osc.connect(g2);
  g2.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 0.2);
}

// ---- Footstep ----
export function playFootstep() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.08);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 350;
  const g = envGain(c, 0.08, 0.002, 0.07);
  noise.connect(lp);
  lp.connect(g);
  g.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.09);
}

// ---- Zombie hit (squish) ----
export function playZombieHit() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 0.1);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(900, t);
  lp.frequency.exponentialRampToValueAtTime(200, t + 0.08);
  const g = envGain(c, 0.2, 0.001, 0.09);
  noise.connect(lp);
  lp.connect(g);
  g.connect(sfxGain);
  noise.start(t);
  noise.stop(t + 0.11);
}

// ---- Wave start horn ----
export function playWaveHorn() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !sfxGain) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.linearRampToValueAtTime(90, t + 1.2);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 800;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.1);
  g.gain.linearRampToValueAtTime(0.3, t + 1.0);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  osc.connect(lp);
  lp.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + 1.5);
}

// ---- Ambient drone (looping) ----
export function startAmbient() {
  if (!audioEnabled) return;
  const c = getCtx();
  if (!c || !masterGain || ambientNodes) return;
  const t = c.currentTime;

  const ag = c.createGain();
  ag.gain.value = 0.12;
  ag.connect(masterGain);

  // Low drone
  const osc1 = c.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 55;
  const osc2 = c.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 82.5;
  const g1 = c.createGain();
  g1.gain.value = 0.5;
  const g2 = c.createGain();
  g2.gain.value = 0.3;
  osc1.connect(g1);
  g1.connect(ag);
  osc2.connect(g2);
  g2.connect(ag);
  osc1.start();
  osc2.start();

  // Slow noise wind
  const noise = c.createBufferSource();
  noise.buffer = makeNoiseBuffer(c, 4);
  noise.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 200;
  const ng = c.createGain();
  ng.gain.value = 0.15;
  noise.connect(lp);
  lp.connect(ng);
  ng.connect(ag);
  noise.start();

  // Slow LFO on noise gain for breathing effect
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.08;
  const lfoGain = c.createGain();
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain);
  lfoGain.connect(ng.gain);
  lfo.start();

  ambientNodes = {
    stop: () => {
      try {
        osc1.stop();
        osc2.stop();
        noise.stop();
        lfo.stop();
      } catch {
        // ignore
      }
      ag.disconnect();
    },
  };
}

export function stopAmbient() {
  if (ambientNodes) {
    ambientNodes.stop();
    ambientNodes = null;
  }
}
