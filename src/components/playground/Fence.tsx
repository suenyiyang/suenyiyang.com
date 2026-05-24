import { useMemo, useRef } from "react";
import * as THREE from "three";

interface PostTransform {
  position: [number, number, number];
  rotationY: number;
}

const PERIMETER = 4.7;
const SPACING = 0.5;
const OPENING_HALF = 1.0;

function buildPosts(): PostTransform[] {
  const posts: PostTransform[] = [];
  const start = -PERIMETER + SPACING / 2;
  const stepCount = Math.round((PERIMETER * 2) / SPACING);

  for (let i = 0; i < stepCount; i++) {
    const t = start + i * SPACING;
    posts.push({ position: [t, 0.3, -PERIMETER], rotationY: 0 });
    if (!(t > -OPENING_HALF && t < OPENING_HALF)) {
      posts.push({ position: [t, 0.3, PERIMETER], rotationY: 0 });
    }
    posts.push({ position: [-PERIMETER, 0.3, t], rotationY: Math.PI / 2 });
    posts.push({ position: [PERIMETER, 0.3, t], rotationY: Math.PI / 2 });
  }
  return posts;
}

export function Fence() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const posts = useMemo(() => buildPosts(), []);

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
    <instancedMesh ref={meshRef} args={[undefined, undefined, posts.length]}>
      <boxGeometry args={[0.1, 0.6, 0.4]} />
      <meshPhysicalMaterial
        color="#f6f1e8"
        roughness={0.4}
        clearcoat={1}
        clearcoatRoughness={0.2}
      />
    </instancedMesh>
  );
}
