"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LEVEL, resolveCollision } from "@/lib/game/level";
import { useGameStore } from "@/lib/game/store";
import { playerState, inputState } from "@/lib/game/shared";
import { playFootstep } from "@/lib/game/audio";

const EYE_HEIGHT = 1.7;
const WALK_SPEED = 4.2;
const SPRINT_SPEED = 6.5;
const STRAFE_SPEED = 3.4;

/** First-person player controller: pointer lock, WASD, mouse look, collision. */
export function Player() {
  const { camera, gl } = useThree();
  const phase = useGameStore((s) => s.phase);
  const settings = useGameStore((s) => s.settings);

  const velocity = useRef(new THREE.Vector3());
  const prevPos = useRef(new THREE.Vector3(LEVEL.playerStart[0], EYE_HEIGHT, LEVEL.playerStart[2]));
  const footstepTimer = useRef(0);
  const locked = useRef(false);

  // Init camera
  useEffect(() => {
    camera.position.set(LEVEL.playerStart[0], EYE_HEIGHT, LEVEL.playerStart[2]);
    playerState.position.set(...LEVEL.playerStart);
    playerState.yaw = LEVEL.playerStartYaw;
    camera.rotation.order = "YXZ";
    camera.rotation.set(0, LEVEL.playerStartYaw, 0);
  }, [camera]);

  // Keyboard handlers
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          inputState.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          inputState.back = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          inputState.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          inputState.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          inputState.sprint = true;
          break;
        case "KeyR":
          inputState.reload = true;
          break;
        case "Space":
          break;
        case "KeyQ":
        case "Digit1":
          useGameStore.getState().switchWeapon("machinegun");
          break;
        case "KeyE":
        case "Digit2":
          useGameStore.getState().switchWeapon("shotgun");
          break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          inputState.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          inputState.back = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          inputState.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          inputState.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          inputState.sprint = false;
          break;
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Mouse look (pointer lock)
  useEffect(() => {
    const dom = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      if (!locked.current) return;
      if (useGameStore.getState().phase !== "playing") return;
      const sens = 0.0022 * useGameStore.getState().settings.mouseSensitivity;
      playerState.yaw -= e.movementX * sens;
      playerState.pitch -= e.movementY * sens;
      playerState.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, playerState.pitch));
    };

    const onLockChange = () => {
      locked.current = document.pointerLockElement === dom;
      if (!locked.current) {
        // pointer lock lost -> pause (if was playing)
        const st = useGameStore.getState();
        if (st.phase === "playing") {
          st.setPhase("paused");
          // clear movement inputs
          inputState.forward = inputState.back = inputState.left = inputState.right = false;
          inputState.sprint = false;
          inputState.fire = false;
        }
      }
    };

    const requestLock = () => {
      if (useGameStore.getState().phase === "playing" && !locked.current) {
        dom.requestPointerLock();
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);
    dom.addEventListener("click", requestLock);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      dom.removeEventListener("click", requestLock);
    };
  }, [gl]);

  // When phase becomes "playing", request pointer lock
  useEffect(() => {
    if (phase === "playing") {
      const dom = gl.domElement;
      // small delay so React commits first
      const t = setTimeout(() => {
        if (document.pointerLockElement !== dom) {
          dom.requestPointerLock();
        }
      }, 50);
      return () => clearTimeout(t);
    }
    if (phase === "paused" || phase === "menu" || phase === "dead" || phase === "victory") {
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }, [phase, gl]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const st = useGameStore.getState();
    if (st.phase !== "playing") {
      // still update camera rotation so it stays correct
      camera.rotation.set(playerState.pitch, playerState.yaw, 0, "YXZ");
      return;
    }

    // Movement direction in camera space (yaw only)
    const yaw = playerState.yaw;
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const move = new THREE.Vector3();
    if (inputState.forward) move.add(forward);
    if (inputState.back) move.sub(forward);
    if (inputState.right) move.add(right);
    if (inputState.left) move.sub(right);

    const moving = move.lengthSq() > 0.0001;
    playerState.moving = moving;

    if (moving) {
      move.normalize();
      const speed = inputState.sprint ? SPRINT_SPEED : WALK_SPEED;
      // strafe a bit slower
      const isStrafe = !inputState.forward && !inputState.back && (inputState.left || inputState.right);
      const sp = isStrafe ? STRAFE_SPEED : speed;
      velocity.current.x = move.x * sp;
      velocity.current.z = move.z * sp;
    } else {
      velocity.current.x *= 0.6;
      velocity.current.z *= 0.6;
    }

    // Proposed new position
    const px = camera.position.x + velocity.current.x * dt;
    const pz = camera.position.z + velocity.current.z * dt;

    // Collision resolution
    const [rx, rz] = resolveCollision(px, pz, prevPos.current.x, prevPos.current.z, 0.35);

    camera.position.x = rx;
    camera.position.z = rz;
    camera.position.y = EYE_HEIGHT + Math.sin(performance.now() * 0.008) * (moving ? 0.025 : 0.005); // subtle head bob

    prevPos.current.set(rx, EYE_HEIGHT, rz);

    // Update shared state
    playerState.position.set(rx, EYE_HEIGHT, rz);

    // Apply look
    camera.rotation.set(playerState.pitch, playerState.yaw, 0, "YXZ");

    // Footsteps
    if (moving) {
      footstepTimer.current -= dt;
      if (footstepTimer.current <= 0) {
        playFootstep();
        footstepTimer.current = inputState.sprint ? 0.32 : 0.45;
      }
    } else {
      footstepTimer.current = 0;
    }
  });

  return null;
}
