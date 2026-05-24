import { useFrame } from "@react-three/fiber";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { activeModalAtom, playerPosAtom, type Vec3 } from "~/stores/playground";

export const SPEED = 2.5;
export const BOUNDS_MIN_X = -4.5;
export const BOUNDS_MAX_X = 4.5;
export const BOUNDS_MIN_Z = -4.5;
export const BOUNDS_MAX_Z = 4.5;

const MOVE_KEYS = new Set([
  "w", "a", "s", "d",
  "W", "A", "S", "D",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
]);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function useKeyboardMovement() {
  const [, setPos] = useAtom(playerPosAtom);
  const activeModal = useAtomValue(activeModalAtom);
  const heldKeys = useRef<Set<string>>(new Set());
  const modalRef = useRef(activeModal);

  useEffect(() => {
    modalRef.current = activeModal;
    if (activeModal !== null) heldKeys.current.clear();
  }, [activeModal]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!MOVE_KEYS.has(e.key)) return;
      if (modalRef.current !== null) return;
      heldKeys.current.add(e.key);
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
  }, []);

  useFrame((_, delta) => {
    if (modalRef.current !== null) return;
    if (heldKeys.current.size === 0) return;

    const dir = new THREE.Vector3();
    const k = heldKeys.current;
    if (k.has("w") || k.has("W") || k.has("ArrowUp")) dir.z -= 1;
    if (k.has("s") || k.has("S") || k.has("ArrowDown")) dir.z += 1;
    if (k.has("a") || k.has("A") || k.has("ArrowLeft")) dir.x -= 1;
    if (k.has("d") || k.has("D") || k.has("ArrowRight")) dir.x += 1;
    if (dir.lengthSq() === 0) return;

    dir.normalize().multiplyScalar(SPEED * delta);
    setPos((prev): Vec3 => [
      clamp(prev[0] + dir.x, BOUNDS_MIN_X, BOUNDS_MAX_X),
      prev[1],
      clamp(prev[2] + dir.z, BOUNDS_MIN_Z, BOUNDS_MAX_Z),
    ]);
  });
}
