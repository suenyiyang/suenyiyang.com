import { useFrame } from "@react-three/fiber";
import { useAtomValue, useStore } from "jotai";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  activeModalAtom,
  playerPosAtom,
  playerTargetAtom,
  type Vec3,
} from "~/stores/playground";

export const SPEED = 2.5;
export const BOUNDS_MIN_X = -4.5;
export const BOUNDS_MAX_X = 4.5;
export const BOUNDS_MIN_Z = -4.5;
export const BOUNDS_MAX_Z = 4.5;
const ARRIVE_EPSILON = 0.05;

const MOVE_KEYS = new Set([
  "w", "a", "s", "d",
  "W", "A", "S", "D",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Drives player movement in two modes that compose cleanly:
 *
 *   1. **Keyboard** — WASD/Arrow keys held while no modal is open. Highest
 *      priority; any keypress cancels an in-progress click-walk.
 *   2. **Click-to-move** — `playerTargetAtom` set (by `Ground.onClick`). The
 *      player walks in a straight line until within `ARRIVE_EPSILON`.
 *
 * Reads/writes go through the jotai store directly (not `useAtomValue`) so
 * the per-frame updates don't re-render any React subtree.
 */
export function useKeyboardMovement() {
  const store = useStore();
  const activeModal = useAtomValue(activeModalAtom);
  const heldKeys = useRef<Set<string>>(new Set());
  const modalRef = useRef(activeModal);

  useEffect(() => {
    modalRef.current = activeModal;
    if (activeModal !== null) {
      heldKeys.current.clear();
      store.set(playerTargetAtom, null);
    }
  }, [activeModal, store]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!MOVE_KEYS.has(e.key)) return;
      if (modalRef.current !== null) return;
      heldKeys.current.add(e.key);
      // Keyboard input wins — drop any pending click target.
      store.set(playerTargetAtom, null);
    };
    const up = (e: KeyboardEvent) => {
      heldKeys.current.delete(e.key);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [store]);

  useFrame((_, delta) => {
    if (modalRef.current !== null) return;

    const k = heldKeys.current;
    if (k.size > 0) {
      const dir = new THREE.Vector3();
      if (k.has("w") || k.has("W") || k.has("ArrowUp")) dir.z -= 1;
      if (k.has("s") || k.has("S") || k.has("ArrowDown")) dir.z += 1;
      if (k.has("a") || k.has("A") || k.has("ArrowLeft")) dir.x -= 1;
      if (k.has("d") || k.has("D") || k.has("ArrowRight")) dir.x += 1;
      if (dir.lengthSq() === 0) return;

      dir.normalize().multiplyScalar(SPEED * delta);
      const prev = store.get(playerPosAtom);
      store.set(playerPosAtom, [
        clamp(prev[0] + dir.x, BOUNDS_MIN_X, BOUNDS_MAX_X),
        prev[1],
        clamp(prev[2] + dir.z, BOUNDS_MIN_Z, BOUNDS_MAX_Z),
      ] as Vec3);
      return;
    }

    const target = store.get(playerTargetAtom);
    if (!target) return;

    const pos = store.get(playerPosAtom);
    const dx = target[0] - pos[0];
    const dz = target[2] - pos[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < ARRIVE_EPSILON) {
      store.set(playerTargetAtom, null);
      return;
    }

    const step = SPEED * delta;
    if (step >= dist) {
      store.set(playerPosAtom, [
        clamp(target[0], BOUNDS_MIN_X, BOUNDS_MAX_X),
        pos[1],
        clamp(target[2], BOUNDS_MIN_Z, BOUNDS_MAX_Z),
      ] as Vec3);
      store.set(playerTargetAtom, null);
      return;
    }

    const fx = dx / dist;
    const fz = dz / dist;
    store.set(playerPosAtom, [
      clamp(pos[0] + fx * step, BOUNDS_MIN_X, BOUNDS_MAX_X),
      pos[1],
      clamp(pos[2] + fz * step, BOUNDS_MIN_Z, BOUNDS_MAX_Z),
    ] as Vec3);
  });
}
