"use client";

import * as THREE from "three";

// Module-level mutable refs shared between player controller and zombie AI.
// Avoids re-renders while letting systems read live player state each frame.
export const playerState = {
  position: new THREE.Vector3(26, 1.7, 0),
  yaw: Math.PI / 2,
  pitch: 0,
  alive: true,
  moving: false,
};

// Input state (keyboard/mouse) - written by the Player component.
export const inputState = {
  forward: false,
  back: false,
  left: false,
  right: false,
  sprint: false,
  fire: false,
  fireQueued: false, // single-shot edge
  reload: false,
};
