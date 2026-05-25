import { useFrame } from "@react-three/fiber";
import { useStore } from "jotai";
import { useRef } from "react";
import * as THREE from "three";
import { PLAYER_SPAWN, playerPosAtom } from "~/stores/playground";
import { useKeyboardMovement } from "./useKeyboardMovement";

/**
 * The player is a small chibi character — body, head, tuft of hair, scarf —
 * driven by a ref-and-useFrame loop so atom updates from `useKeyboardMovement`
 * don't trigger a React reconciliation every frame.
 */
export function Player() {
  useKeyboardMovement();
  const store = useStore();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const [x, y, z] = store.get(playerPosAtom);
    // The position atom centers on the old capsule's middle (y≈0.45). Anchor
    // the group at the ground beneath it so character offsets read clean.
    group.position.set(x, y - 0.45, z);
  });

  return (
    <group ref={groupRef} position={PLAYER_SPAWN}>
      {/* Body: chunkier torso in deep forest green so the character reads
          against the warm tile and matches the blog's accent color. */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.28, 0.3, 6, 16]} />
        <meshPhysicalMaterial
          color="#1f4a35"
          roughness={0.38}
          clearcoat={0.7}
          clearcoatRoughness={0.3}
          sheen={0.5}
          sheenColor="#dfece4"
        />
      </mesh>

      {/* Scarf: a thicker contrasting torus so the silhouette has a clear
          warm-cool break right at the neck. */}
      <mesh position={[0, 0.75, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.24, 0.07, 10, 20]} />
        <meshStandardMaterial color="#c44a36" roughness={0.55} />
      </mesh>

      {/* Head: cream-toned sphere, slightly oversized for the chibi proportion. */}
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.28, 20, 18]} />
        <meshStandardMaterial color="#f1d6b3" roughness={0.55} />
      </mesh>

      {/* Hair cap: a darker half-sphere on top, slightly forward. */}
      <mesh position={[0, 1.11, -0.03]} castShadow>
        <sphereGeometry
          args={[0.29, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]}
        />
        <meshStandardMaterial color="#2c1f15" roughness={0.7} />
      </mesh>

      {/* Front hair tuft for character — a tiny tilted sphere over the brow. */}
      <mesh position={[0.05, 1.12, 0.22]} rotation={[0.3, 0, -0.4]} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial color="#2c1f15" roughness={0.7} />
      </mesh>

      {/* Two tiny eye dots — flat black spheres flush against the face. */}
      {[
        [-0.1, 1.02, 0.25],
        [0.1, 1.02, 0.25],
      ].map(([ex, ey, ez], i) => (
        <mesh key={i} position={[ex, ey, ez]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color="#1a1410" roughness={0.4} />
        </mesh>
      ))}

      {/* Cheek dabs — soft warm rounds for that "cute" hit. */}
      {[
        [-0.16, 0.96, 0.22],
        [0.16, 0.96, 0.22],
      ].map(([ex, ey, ez], i) => (
        <mesh key={i} position={[ex, ey, ez]}>
          <sphereGeometry args={[0.036, 8, 8]} />
          <meshStandardMaterial color="#e89a8e" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}
