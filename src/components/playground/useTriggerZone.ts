import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { nearbyTriggerAtom, playerPosAtom, type Vec3 } from "~/stores/playground";

export interface TriggerZone {
  propId: string;
  position: Vec3;
  radius: number;
  label: string;
  onActivate: () => void;
}

/**
 * Distance is computed on the XZ plane only (Y is ignored — ground-plane game).
 */
function xzDistance(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Tracks the closest zone the player is currently inside.
 * When multiple registered zones are in range, the nearest wins.
 *
 * Pass a stable array of zones (memoize at the call site).
 */
export function useTriggerZones(zones: TriggerZone[]) {
  const playerPos = useAtomValue(playerPosAtom);
  const setNearby = useSetAtom(nearbyTriggerAtom);

  useEffect(() => {
    let best: TriggerZone | null = null;
    let bestDist = Infinity;
    for (const z of zones) {
      const d = xzDistance(playerPos, z.position);
      if (d < z.radius && d < bestDist) {
        best = z;
        bestDist = d;
      }
    }
    setNearby(best
      ? { propId: best.propId, label: best.label, onActivate: best.onActivate }
      : null);
  }, [playerPos, zones, setNearby]);
}

/**
 * Listens for E / Enter and invokes the currently-active trigger's onActivate.
 * Must be mounted somewhere in the Playground tree (Scene is a good place).
 */
export function useTriggerActivation() {
  const nearby = useAtomValue(nearbyTriggerAtom);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "e" && e.key !== "E" && e.key !== "Enter") return;
      if (!nearby) return;
      e.preventDefault();
      nearby.onActivate();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nearby]);
}
