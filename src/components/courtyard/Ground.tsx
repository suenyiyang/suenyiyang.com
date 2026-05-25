import { type ThreeEvent } from "@react-three/fiber";
import { useStore } from "jotai";
import { useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  activeModalAtom,
  playerTargetAtom,
  PLAYER_SPAWN,
} from "~/stores/courtyard";

/**
 * Deterministic per-tile jitter so the courtyard reads as hand-laid stone
 * rather than a uniform repeat. Same seed every render keeps the look stable.
 */
function tileNoise(x: number, y: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

function makeTileTexture(): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  // Grout / between-tile mortar — slightly darker and warmer than the tiles.
  ctx.fillStyle = "#bda079";
  ctx.fillRect(0, 0, size, size);

  const grid = 8;
  const cell = size / grid;
  const gap = 5;
  const radius = 8;

  // Two warm cream tones we'll mix per tile for organic variation.
  const tileColors = ["#ecd7b0", "#e4cda3", "#e8d3a8", "#ead2a4"];

  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const px = x * cell + gap;
      const py = y * cell + gap;
      const w = cell - gap * 2;
      const h = cell - gap * 2;

      const n = tileNoise(x, y);
      ctx.fillStyle = tileColors[Math.floor(n * tileColors.length)];

      ctx.beginPath();
      ctx.moveTo(px + radius, py);
      ctx.arcTo(px + w, py, px + w, py + h, radius);
      ctx.arcTo(px + w, py + h, px, py + h, radius);
      ctx.arcTo(px, py + h, px, py, radius);
      ctx.arcTo(px, py, px + w, py, radius);
      ctx.closePath();
      ctx.fill();

      // Soft inner highlight in the top-left corner of each tile suggests light
      // pooling on weathered stone — cheap depth without normal maps.
      const grad = ctx.createRadialGradient(
        px + w * 0.35,
        py + h * 0.35,
        2,
        px + w * 0.35,
        py + h * 0.35,
        Math.max(w, h) * 0.8
      );
      grad.addColorStop(0, "rgba(255, 245, 220, 0.18)");
      grad.addColorStop(1, "rgba(255, 245, 220, 0)");
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // A thin film of warm paper-grain noise pulls everything together.
  const grainPasses = 1400;
  for (let i = 0; i < grainPasses; i++) {
    const gx = Math.random() * size;
    const gy = Math.random() * size;
    const alpha = Math.random() * 0.07;
    ctx.fillStyle = `rgba(80, 50, 20, ${alpha})`;
    ctx.fillRect(gx, gy, 1, 1);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.anisotropy = 8;
  return tex;
}

export function Ground() {
  const texture = useMemo(() => makeTileTexture(), []);
  const store = useStore();

  // Left-click on the ground sets a walk target (LoL-style click-to-move).
  // Right-clicks (button !== 0) and clicks-while-a-modal-is-open are ignored.
  const onClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      if (event.button !== 0) return;
      if (store.get(activeModalAtom) !== null) return;
      event.stopPropagation();
      store.set(playerTargetAtom, [
        event.point.x,
        PLAYER_SPAWN[1],
        event.point.z,
      ]);
    },
    [store]
  );

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={onClick}
      receiveShadow
    >
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial
        map={texture}
        color="#e8d3a8"
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  );
}
