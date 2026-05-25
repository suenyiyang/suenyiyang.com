import { type ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { type Vec3 } from "~/stores/playground";

/**
 * The hanging sign texture. Reads "POSTS" in italic serif inside a double-rule
 * border so it matches the letterpress vibe of the blog's reading surface.
 */
function makeSignTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, "#fdf8ee");
  bg.addColorStop(1, "#f0e4cc");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = "#1a3a2a";
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 484, 228);
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, 456, 200);

  ctx.fillStyle = "#1a3a2a";
  ctx.font = "italic 700 96px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("POSTS", 256, 128);

  ctx.fillRect(80, 124, 60, 6);
  ctx.fillRect(372, 124, 60, 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Newspaper-paper top: stylized headline + columns so the rolled stack reads
 * as a real newspaper at a glance.
 */
function makePaperTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;

  ctx.fillStyle = "#f7eedb";
  ctx.fillRect(0, 0, 256, 256);

  // Masthead bar across the top.
  ctx.fillStyle = "#2a2418";
  ctx.fillRect(20, 16, 216, 4);
  ctx.font = "italic 800 28px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("THE DAILY", 128, 40);
  ctx.fillRect(20, 56, 216, 2);

  // Three text columns drawn as soft horizontal rules.
  ctx.fillStyle = "#5a4d36";
  for (let col = 0; col < 3; col++) {
    const x = 28 + col * 68;
    for (let row = 0; row < 14; row++) {
      const w = 50 - (row % 3) * 6;
      ctx.fillRect(x, 80 + row * 11, w, 2);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface NewspaperStandProps {
  basePosition: Vec3;
  onClick: () => void;
}

export function NewspaperStand({ basePosition, onClick }: NewspaperStandProps) {
  const [x, , z] = basePosition;
  const signTexture = useMemo(() => makeSignTexture(), []);
  const paperTexture = useMemo(() => makePaperTexture(), []);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  // Pitched roof angle. Two slanted boards form a tent above the counter.
  const ROOF_TILT = Math.PI / 5;

  return (
    <group position={[x, 0, z]} onClick={handleClick}>
      {/* Four slender legs supporting the counter — gives the kiosk a real
          piece-of-furniture feel rather than a featureless block. */}
      {[
        [-0.32, 0, -0.22],
        [0.32, 0, -0.22],
        [-0.32, 0, 0.22],
        [0.32, 0, 0.22],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.25, lz]} castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color="#6b3c1d" roughness={0.78} />
        </mesh>
      ))}

      {/* Counter body: a warm wooden block with a darker apron underneath. */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.16, 0.6]} />
        <meshStandardMaterial color="#5a3318" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.05, 0.66]} />
        <meshPhysicalMaterial
          color="#a37539"
          clearcoat={0.5}
          clearcoatRoughness={0.4}
          roughness={0.45}
          sheen={0.3}
          sheenColor="#e0b67a"
        />
      </mesh>

      {/* Three stacked newspapers, slightly offset. The top one gets the
          masthead texture so it's recognizable. */}
      <mesh position={[-0.22, 0.755, 0.05]} rotation={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.32, 0.04, 0.22]} />
        <meshStandardMaterial color="#ede1c4" roughness={0.85} />
      </mesh>
      <mesh position={[-0.2, 0.785, 0.08]} rotation={[0, -0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 0.035, 0.2]} />
        <meshStandardMaterial color="#f0e6cd" roughness={0.85} />
      </mesh>
      <mesh position={[-0.22, 0.815, 0.06]} rotation={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.04, 0.24]} />
        <meshStandardMaterial map={paperTexture} roughness={0.82} />
      </mesh>

      {/* A rolled tube of newspaper resting on the right side. */}
      <mesh
        position={[0.22, 0.77, -0.05]}
        rotation={[Math.PI / 2, 0, 0.6]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.05, 0.05, 0.32, 12]} />
        <meshStandardMaterial color="#f0e6cd" roughness={0.85} />
      </mesh>

      {/* Two roof beams holding up the pitched roof. */}
      {[-0.36, 0.36].map((bx, i) => (
        <mesh key={i} position={[bx, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.6, 0.06]} />
          <meshStandardMaterial color="#6b3c1d" roughness={0.78} />
        </mesh>
      ))}

      {/* Pitched roof: two angled boards meeting along a ridge. */}
      <mesh
        position={[0, 1.38, 0.18]}
        rotation={[ROOF_TILT, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.05, 0.05, 0.5]} />
        <meshStandardMaterial color="#7d2c1e" roughness={0.7} />
      </mesh>
      <mesh
        position={[0, 1.38, -0.18]}
        rotation={[-ROOF_TILT, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.05, 0.05, 0.5]} />
        <meshStandardMaterial color="#7d2c1e" roughness={0.7} />
      </mesh>
      {/* Ridge cap along the top of the roof. */}
      <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.07, 0.1]} />
        <meshStandardMaterial color="#5a1f15" roughness={0.7} />
      </mesh>
      {/* A tiny finial on each end of the ridge. */}
      {[-0.52, 0.52].map((fx, i) => (
        <mesh key={i} position={[fx, 1.62, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#3b1810" roughness={0.6} />
        </mesh>
      ))}

      {/* Hanging "POSTS" sign suspended under the roof's front eave. Two thin
          ropes connect it to the ridge so it reads as actually hung. */}
      {[-0.28, 0.28].map((sx, i) => (
        <mesh key={i} position={[sx, 1.32, 0.3]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.18, 6]} />
          <meshStandardMaterial color="#3b2818" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 1.18, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.32, 0.04]} />
        <meshStandardMaterial map={signTexture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
