import { type ThreeEvent } from "@react-three/fiber";
import { useStore } from "jotai";
import { useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  activeModalAtom,
  playerTargetAtom,
  PLAYER_SPAWN,
} from "~/stores/courtyard";
import { useIsDark } from "./useIsDark";

/**
 * Deterministic per-tile jitter so the courtyard reads as hand-laid stone
 * rather than a uniform repeat. Same seed every render keeps the look stable.
 */
function tileNoise(x: number, y: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

interface TilePalette {
  grout: string;
  tiles: string[];
  highlight: string;
  grain: string;
  base: string;
}

const LIGHT_TILES: TilePalette = {
  grout: "#c1a87f",
  // Toned down from the saturated cream of the v1 ground so it harmonizes
  // with the blog's #FDFCF9 paper background.
  tiles: ["#ecdcc1", "#e6d4b5", "#e8d8ba", "#ebd6b3"],
  highlight: "rgba(255, 247, 224, 0.16)",
  grain: "rgba(80, 50, 20, 0.07)",
  base: "#e7d4ae",
};

const DARK_TILES: TilePalette = {
  grout: "#1b1820",
  tiles: ["#2c2730", "#332b38", "#28232e", "#352d3a"],
  highlight: "rgba(220, 200, 240, 0.05)",
  grain: "rgba(0, 0, 0, 0.18)",
  base: "#2e2832",
};

function makeTileTexture(p: TilePalette): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = p.grout;
  ctx.fillRect(0, 0, size, size);

  const grid = 8;
  const cell = size / grid;
  const gap = 5;
  const radius = 8;

  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const px = x * cell + gap;
      const py = y * cell + gap;
      const w = cell - gap * 2;
      const h = cell - gap * 2;

      const n = tileNoise(x, y);
      ctx.fillStyle = p.tiles[Math.floor(n * p.tiles.length)];

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
      grad.addColorStop(0, p.highlight);
      grad.addColorStop(1, p.highlight.replace(/[\d.]+\)$/, "0)"));
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // A thin film of noise pulls everything together.
  const grainPasses = 1400;
  for (let i = 0; i < grainPasses; i++) {
    const gx = Math.random() * size;
    const gy = Math.random() * size;
    const alpha = Math.random() * 0.07;
    ctx.fillStyle = p.grain.replace(/[\d.]+\)$/, `${alpha})`);
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
  const isDark = useIsDark();
  const palette = isDark ? DARK_TILES : LIGHT_TILES;
  // Regenerate the canvas texture when the theme flips so the courtyard
  // doesn't stay daylight-cream on a dark page.
  const texture = useMemo(() => makeTileTexture(palette), [palette]);
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
        color={palette.base}
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  );
}
