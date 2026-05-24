import { useMemo } from "react";
import * as THREE from "three";
import { type Vec3 } from "~/stores/playground";

function makeSignTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 384;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fbf6ee";
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = "#2a1a1a";
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 488, 360);
  ctx.fillStyle = "#2a1a1a";
  ctx.font = "italic 700 96px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("POSTS", 256, 192);
  return new THREE.CanvasTexture(c);
}

export interface NewspaperStandProps {
  basePosition: Vec3;
  onClick: () => void;
}

export function NewspaperStand({ basePosition, onClick }: NewspaperStandProps) {
  const [x, , z] = basePosition;
  const signTexture = useMemo(() => makeSignTexture(), []);

  return (
    <group onClick={onClick}>
      <mesh position={[x, 0.4, z]}>
        <boxGeometry args={[0.6, 0.8, 0.5]} />
        <meshPhysicalMaterial color="#a87838" clearcoat={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[x, 1.3, z]} rotation={[0, Math.PI / 4, 0]}>
        <planeGeometry args={[0.8, 0.6]} />
        <meshStandardMaterial map={signTexture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
