import { useMemo } from "react";
import * as THREE from "three";

/**
 * Garden dressing: stone lantern, mossy shrub, scattered rocks, stepping
 * stones, and a small cushion mat. None of these are interactive — they fill
 * the negative space around the three triggers and give the courtyard the
 * lived-in feel of a Studio Ghibli front yard.
 */

interface RockSpec {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}

interface SteppingStone {
  position: [number, number, number];
  rotation: number;
  radius: number;
}

interface Shrub {
  position: [number, number, number];
  scale: number;
  tone: string;
}

const ROCKS: RockSpec[] = [
  // Cluster near the tree base for visual weight.
  {
    position: [-2.5, 0.15, -2.2],
    rotation: [0, 0.4, 0.1],
    scale: [0.35, 0.25, 0.3],
    color: "#a89d8d",
  },
  {
    position: [-2.2, 0.08, -2.5],
    rotation: [0.1, 1.2, 0],
    scale: [0.22, 0.17, 0.22],
    color: "#8c8170",
  },
  // A small accent near the back-right corner.
  {
    position: [3.3, 0.1, -3.0],
    rotation: [0, 0.7, 0],
    scale: [0.28, 0.2, 0.28],
    color: "#988c7c",
  },
  // A pair near the kiosk to anchor it.
  {
    position: [3.2, 0.08, 1.6],
    rotation: [0, 1.0, 0.15],
    scale: [0.22, 0.16, 0.22],
    color: "#9c9080",
  },
];

const SHRUBS: Shrub[] = [
  { position: [3.0, 0, -1.5], scale: 0.55, tone: "#6f9358" },
  { position: [-3.8, 0, 0.8], scale: 0.45, tone: "#7ba264" },
  { position: [3.6, 0, 2.6], scale: 0.4, tone: "#82a86c" },
];

const SOUTH_GATE_Z = 4.7;

/**
 * Stepping stones forming a soft S-curve from the gate (south side) into the
 * courtyard, then branching toward the kiosk and toward Yiyang. Coordinates
 * picked by hand so spacing feels natural at the orthographic zoom.
 */
const PATH: SteppingStone[] = [
  { position: [0.0, 0.022, SOUTH_GATE_Z - 0.4], rotation: 0.1, radius: 0.35 },
  { position: [0.3, 0.022, 3.4], rotation: -0.2, radius: 0.32 },
  { position: [0.6, 0.022, 2.6], rotation: 0.4, radius: 0.34 },
  { position: [0.9, 0.022, 1.9], rotation: -0.1, radius: 0.32 },
  // Branch toward kiosk.
  { position: [1.5, 0.022, 1.6], rotation: 0.3, radius: 0.3 },
  // Main line continuing left toward Yiyang.
  { position: [0.4, 0.022, 1.1], rotation: 0.2, radius: 0.32 },
  { position: [-0.3, 0.022, 0.6], rotation: -0.3, radius: 0.34 },
  { position: [-0.95, 0.022, 0.2], rotation: 0.15, radius: 0.32 },
];

function SteppingStones() {
  return (
    <group>
      {PATH.map((s, i) => (
        <mesh
          key={i}
          position={s.position}
          rotation={[-Math.PI / 2, 0, s.rotation]}
          receiveShadow
        >
          <circleGeometry args={[s.radius, 10]} />
          <meshStandardMaterial
            color="#d2c3a4"
            roughness={0.95}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Rocks() {
  return (
    <group>
      {ROCKS.map((r, i) => (
        <mesh
          key={i}
          position={r.position}
          rotation={r.rotation}
          scale={r.scale}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={r.color} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Shrubs() {
  return (
    <group>
      {SHRUBS.map((s, i) => (
        <group key={i} position={s.position}>
          {/* Three overlapping spheres make a chunky bush silhouette. */}
          <mesh position={[0, s.scale * 0.7, 0]} castShadow receiveShadow>
            <sphereGeometry args={[s.scale, 12, 10]} />
            <meshStandardMaterial color={s.tone} roughness={0.85} />
          </mesh>
          <mesh
            position={[s.scale * 0.55, s.scale * 0.55, 0]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[s.scale * 0.75, 10, 8]} />
            <meshStandardMaterial color={s.tone} roughness={0.85} />
          </mesh>
          <mesh
            position={[-s.scale * 0.45, s.scale * 0.55, s.scale * 0.2]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[s.scale * 0.7, 10, 8]} />
            <meshStandardMaterial color={s.tone} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Stone lantern (灯笼/石灯) — a classic courtyard accent. Pedestal, light
 * housing with paper window, roof, and a finial. Lit very softly from inside
 * so the paper windows glow.
 */
function StoneLantern({ position }: { position: [number, number, number] }) {
  const [x, , z] = position;
  return (
    <group position={[x, 0, z]}>
      {/* Square base */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.12, 0.4]} />
        <meshStandardMaterial color="#b8aa92" roughness={0.95} flatShading />
      </mesh>
      {/* Pedestal column */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.46, 10]} />
        <meshStandardMaterial color="#c8baa0" roughness={0.92} />
      </mesh>
      {/* Mid platform */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.06, 0.34]} />
        <meshStandardMaterial color="#b8aa92" roughness={0.95} flatShading />
      </mesh>
      {/* Light housing — slightly emissive cream so paper windows glow. */}
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.3, 0.28]} />
        <meshStandardMaterial
          color="#f5e6c0"
          emissive="#f0c878"
          emissiveIntensity={0.22}
          roughness={0.7}
        />
      </mesh>
      {/* Vertical bars on each face so the housing reads as paneled. */}
      {[
        { p: [0.14, 0.82, 0] as const, r: [0, 0, 0] as const },
        { p: [-0.14, 0.82, 0] as const, r: [0, 0, 0] as const },
        { p: [0, 0.82, 0.14] as const, r: [0, Math.PI / 2, 0] as const },
        { p: [0, 0.82, -0.14] as const, r: [0, Math.PI / 2, 0] as const },
      ].map((face, i) => (
        <group key={i} position={face.p} rotation={face.r}>
          <mesh position={[0, 0, 0.005]}>
            <boxGeometry args={[0.02, 0.3, 0.005]} />
            <meshStandardMaterial color="#5c4f3e" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <boxGeometry args={[0.28, 0.02, 0.005]} />
            <meshStandardMaterial color="#5c4f3e" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Cap above the housing */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.04, 0.36]} />
        <meshStandardMaterial color="#9e9080" roughness={0.92} flatShading />
      </mesh>
      {/* Pyramidal roof */}
      <mesh position={[0, 1.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.3, 0.18, 4]} />
        <meshStandardMaterial color="#5a3a28" roughness={0.7} flatShading />
      </mesh>
      {/* Finial */}
      <mesh position={[0, 1.24, 0]} castShadow>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#3b1810" roughness={0.6} />
      </mesh>
      {/* Soft warm point light so the housing actually casts a faint glow on
          nearby surfaces — barely noticeable in daylight but adds atmosphere. */}
      <pointLight
        position={[0, 0.82, 0]}
        intensity={0.4}
        distance={2.4}
        color="#ffd99a"
      />
    </group>
  );
}

interface CushionMatProps {
  position: [number, number, number];
  rotationY?: number;
}

/**
 * A small woven cushion mat that goes under the YiyangAvatar billboard so the
 * photo doesn't float on the tiles. The herringbone pattern is drawn into a
 * canvas so it reads clearly from the iso camera.
 */
function makeMatTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  // Deep tatami-cushion base — sits a couple shades darker than the tile so
  // the mat reads as a distinct surface, not a tonal blur.
  ctx.fillStyle = "#4a3826";
  ctx.fillRect(0, 0, 256, 256);
  // Woven straw panels.
  for (let row = 0; row < 4; row++) {
    const py = 18 + row * 58;
    ctx.fillStyle = row % 2 === 0 ? "#9a7846" : "#876539";
    ctx.fillRect(20, py, 216, 50);
    // Horizontal weave hatching.
    ctx.strokeStyle = "#5e4422";
    ctx.lineWidth = 2;
    for (let y = py + 6; y < py + 50; y += 8) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(236, y);
      ctx.stroke();
    }
    // Vertical seam separating panels.
    if (row < 3) {
      ctx.fillStyle = "#2e2114";
      ctx.fillRect(20, py + 54, 216, 4);
    }
  }
  // Dark binding around the edge.
  ctx.strokeStyle = "#1c140a";
  ctx.lineWidth = 12;
  ctx.strokeRect(6, 6, 244, 244);
  ctx.strokeStyle = "#352618";
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, 228, 228);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function CushionMat({ position, rotationY = 0 }: CushionMatProps) {
  const tex = useMemo(() => makeMatTexture(), []);
  const [x, , z] = position;
  return (
    <mesh
      position={[x, 0.025, z]}
      rotation={[-Math.PI / 2, 0, rotationY]}
      receiveShadow
    >
      <planeGeometry args={[1.9, 1.4]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
}

export function GardenProps() {
  return (
    <group>
      <SteppingStones />
      <Rocks />
      <Shrubs />
      <StoneLantern position={[3.2, 0, -2.4]} />
    </group>
  );
}
