import { useMemo, useRef } from "react";
import * as THREE from "three";

interface PostTransform {
  position: [number, number, number];
  rotationY: number;
}

interface RailSegment {
  /** Midpoint of the rail. */
  position: [number, number, number];
  /** Length along its local X (before rotation). */
  length: number;
  /** Rotation about the world Y axis. */
  rotationY: number;
}

const PERIMETER = 4.7;
const SPACING = 0.5;
const OPENING_HALF = 1.0;
const POST_HEIGHT = 0.6;
const RAIL_Y = 0.45;

function buildPosts(): PostTransform[] {
  const posts: PostTransform[] = [];
  const start = -PERIMETER + SPACING / 2;
  const stepCount = Math.round((PERIMETER * 2) / SPACING);

  for (let i = 0; i < stepCount; i++) {
    const t = start + i * SPACING;
    posts.push({ position: [t, POST_HEIGHT / 2, -PERIMETER], rotationY: 0 });
    if (!(t > -OPENING_HALF && t < OPENING_HALF)) {
      posts.push({ position: [t, POST_HEIGHT / 2, PERIMETER], rotationY: 0 });
    }
    posts.push({ position: [-PERIMETER, POST_HEIGHT / 2, t], rotationY: Math.PI / 2 });
    posts.push({ position: [PERIMETER, POST_HEIGHT / 2, t], rotationY: Math.PI / 2 });
  }
  return posts;
}

/**
 * Top rail segments — one continuous bar per side, with the +Z side split in
 * two so the gate stays open.
 */
function buildRails(): RailSegment[] {
  const full = PERIMETER * 2;
  return [
    // Back: full span along the -Z edge.
    { position: [0, RAIL_Y, -PERIMETER], length: full, rotationY: 0 },
    // Front: skip the opening in the middle of the +Z edge.
    {
      position: [(-PERIMETER + -OPENING_HALF) / 2, RAIL_Y, PERIMETER],
      length: PERIMETER - OPENING_HALF,
      rotationY: 0,
    },
    {
      position: [(PERIMETER + OPENING_HALF) / 2, RAIL_Y, PERIMETER],
      length: PERIMETER - OPENING_HALF,
      rotationY: 0,
    },
    // Left/right sides: rotate 90° so the box's long axis runs along Z.
    { position: [-PERIMETER, RAIL_Y, 0], length: full, rotationY: Math.PI / 2 },
    { position: [PERIMETER, RAIL_Y, 0], length: full, rotationY: Math.PI / 2 },
  ];
}

export function Fence() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const posts = useMemo(() => buildPosts(), []);
  const rails = useMemo(() => buildRails(), []);

  useMemo(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    posts.forEach((p, i) => {
      dummy.position.set(...p.position);
      dummy.rotation.set(0, p.rotationY, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [posts]);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, posts.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.12, POST_HEIGHT, 0.12]} />
        <meshPhysicalMaterial
          color="#f6f1e8"
          roughness={0.55}
          clearcoat={0.6}
          clearcoatRoughness={0.35}
        />
      </instancedMesh>

      {rails.map((rail, i) => (
        <mesh
          key={i}
          position={rail.position}
          rotation={[0, rail.rotationY, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[rail.length, 0.06, 0.08]} />
          <meshPhysicalMaterial
            color="#f0e9da"
            roughness={0.55}
            clearcoat={0.5}
            clearcoatRoughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
