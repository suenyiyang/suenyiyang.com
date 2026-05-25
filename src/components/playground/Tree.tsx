import { useMemo } from "react";
import * as THREE from "three";
import { type Vec3 } from "~/stores/playground";

/**
 * Stylized plum-blossom tree: a curving warm trunk with a couple of branches
 * supporting a cloud of overlapping foliage spheres in soft pink + cream.
 * Chunky low-poly silhouette tuned to read as a specific cartoon tree at the
 * scene's orthographic zoom, not an abstract cone stack.
 */

interface FoliagePuff {
  position: [number, number, number];
  radius: number;
  color: string;
}

interface Branch {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  radius: number;
}

interface Petal {
  position: [number, number, number];
  rotation: number;
  scale: number;
  color: string;
}

const FOLIAGE_PUFFS: FoliagePuff[] = [
  { position: [0, 1.95, 0], radius: 0.78, color: "#f6d3dc" },
  { position: [-0.55, 1.75, 0.1], radius: 0.55, color: "#eebac6" },
  { position: [0.55, 1.7, -0.05], radius: 0.6, color: "#f3c4d0" },
  { position: [0.15, 2.35, 0.15], radius: 0.5, color: "#fae0e6" },
  { position: [-0.25, 2.15, -0.4], radius: 0.45, color: "#e8aebc" },
  { position: [0.4, 2.05, 0.45], radius: 0.42, color: "#fce4ea" },
  { position: [-0.1, 1.55, -0.5], radius: 0.4, color: "#d99fae" },
  { position: [0.7, 2.25, -0.25], radius: 0.38, color: "#f1bcc7" },
];

const BRANCHES: Branch[] = [
  // Main lean above the trunk – continues the trunk's curve outward.
  { position: [0.08, 1.25, 0], rotation: [0, 0, -0.4], length: 0.55, radius: 0.07 },
  // Smaller branch reaching the opposite direction for asymmetry.
  { position: [-0.18, 1.15, 0.1], rotation: [0.15, 0, 0.55], length: 0.42, radius: 0.055 },
  // Short stub toward the front so the canopy doesn't float.
  { position: [0.05, 1.45, 0.25], rotation: [-0.5, 0, -0.1], length: 0.35, radius: 0.05 },
];

function buildPetals(): Petal[] {
  // Deterministic pseudo-random scatter on the ground around the trunk so the
  // tree feels lived-in. Stable across renders thanks to a seeded sequence.
  const out: Petal[] = [];
  let seed = 17;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const palette = ["#f3c4d0", "#eebac6", "#fae0e6", "#d99fae"];
  for (let i = 0; i < 22; i++) {
    const angle = next() * Math.PI * 2;
    // Cluster near the trunk; a few stray further out.
    const radius = 0.6 + next() * 1.4;
    out.push({
      position: [Math.cos(angle) * radius, 0.014, Math.sin(angle) * radius],
      rotation: next() * Math.PI,
      scale: 0.07 + next() * 0.05,
      color: palette[Math.floor(next() * palette.length)],
    });
  }
  return out;
}

export function Tree({ position }: { position: Vec3 }) {
  const [x, , z] = position;
  const petals = useMemo(() => buildPetals(), []);

  return (
    <group position={[x, 0, z]}>
      {/* Trunk: two slightly offset segments fake a hand-curved silhouette
          better than a single straight cylinder. */}
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0.08]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.8, 12]} />
        <meshStandardMaterial color="#6b4a2a" roughness={0.92} />
      </mesh>
      <mesh position={[0.06, 1.0, 0]} rotation={[0, 0, -0.14]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.5, 12]} />
        <meshStandardMaterial color="#7a5530" roughness={0.9} />
      </mesh>

      {/* Branches reach outward to anchor the canopy puffs. */}
      {BRANCHES.map((b, i) => (
        <mesh
          key={i}
          position={b.position}
          rotation={b.rotation}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[b.radius * 0.55, b.radius, b.length, 8]} />
          <meshStandardMaterial color="#7a5530" roughness={0.92} />
        </mesh>
      ))}

      {/* Canopy: 8 overlapping spheres in graded pinks read as one blossom
          cloud while preserving cartoon volume. */}
      {FOLIAGE_PUFFS.map((puff, i) => (
        <mesh key={i} position={puff.position} castShadow receiveShadow>
          <sphereGeometry args={[puff.radius, 14, 12]} />
          <meshStandardMaterial color={puff.color} roughness={0.78} />
        </mesh>
      ))}

      {/* A scattering of fallen petals on the ground, drawn as thin discs
          oriented flat. Cheap, deterministic, and grounds the tree. */}
      {petals.map((p, i) => (
        <mesh
          key={i}
          position={p.position}
          rotation={[-Math.PI / 2, 0, p.rotation]}
          receiveShadow
        >
          <circleGeometry args={[p.scale, 6]} />
          <meshStandardMaterial
            color={p.color}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
