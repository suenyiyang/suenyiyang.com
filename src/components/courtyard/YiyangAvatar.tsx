import { type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { type Vec3 } from "~/stores/courtyard";

export interface YiyangAvatarProps {
  position: Vec3;
  onClick: () => void;
}

/**
 * A seated chibi version of Yiyang that lives on the cushion mat. Built from
 * primitives (no external texture) so it stays consistent with the rest of
 * the cartoon scene and never falls back to a flat untextured plane.
 *
 * `position` is the foot of the character on the ground — Y is ignored and
 * each sub-mesh anchors to ground-relative offsets.
 */
export function YiyangAvatar({ position, onClick }: YiyangAvatarProps) {
  const [x, , z] = position;
  // Face roughly toward the gate / kiosk so a visitor approaching from the
  // path makes eye contact.
  const facing = 0.6;

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group position={[x, 0, z]} rotation={[0, facing, 0]} onClick={handleClick}>
      {/* Crossed legs: two squashed cylinders forming a wide base on the mat. */}
      <mesh position={[-0.18, 0.12, 0.08]} rotation={[0, 0.35, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.13, 0.22, 6, 12]} />
        <meshStandardMaterial color="#5c4a36" roughness={0.7} />
      </mesh>
      <mesh position={[0.18, 0.12, 0.08]} rotation={[0, -0.35, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.13, 0.22, 6, 12]} />
        <meshStandardMaterial color="#5c4a36" roughness={0.7} />
      </mesh>
      {/* Foot caps so the crossed-legs read terminates cleanly. */}
      <mesh position={[0.26, 0.1, 0.22]} castShadow>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#3a2c1c" roughness={0.7} />
      </mesh>
      <mesh position={[-0.26, 0.1, 0.22]} castShadow>
        <sphereGeometry args={[0.08, 10, 8]} />
        <meshStandardMaterial color="#3a2c1c" roughness={0.7} />
      </mesh>

      {/* Torso — warm terracotta hoodie. Distinct from Player's forest green. */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.28, 0.18, 6, 16]} />
        <meshPhysicalMaterial
          color="#c8753a"
          roughness={0.45}
          clearcoat={0.6}
          clearcoatRoughness={0.35}
          sheen={0.4}
          sheenColor="#f0d2a8"
        />
      </mesh>

      {/* Arms folded in lap — short capsules angled inward, ending at a teacup. */}
      <mesh position={[-0.22, 0.36, 0.18]} rotation={[0.4, 0.2, 0.8]} castShadow>
        <capsuleGeometry args={[0.08, 0.18, 6, 10]} />
        <meshStandardMaterial color="#c8753a" roughness={0.5} />
      </mesh>
      <mesh position={[0.22, 0.36, 0.18]} rotation={[0.4, -0.2, -0.8]} castShadow>
        <capsuleGeometry args={[0.08, 0.18, 6, 10]} />
        <meshStandardMaterial color="#c8753a" roughness={0.5} />
      </mesh>

      {/* Teacup cradled in the lap — a tiny cylinder with a darker rim. */}
      <mesh position={[0, 0.38, 0.28]} castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.07, 0.1, 14]} />
        <meshStandardMaterial color="#f4ecd8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.435, 0.28]}>
        <cylinderGeometry args={[0.082, 0.082, 0.012, 14]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.6} />
      </mesh>
      {/* A whiff of steam — a soft cream sphere just above the cup. */}
      <mesh position={[0, 0.55, 0.28]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#fbf3e0"
          transparent
          opacity={0.55}
          roughness={0.95}
        />
      </mesh>

      {/* Head: cream sphere, same family as Player but a touch warmer. */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 22, 18]} />
        <meshStandardMaterial color="#f3d6ad" roughness={0.55} />
      </mesh>

      {/* Hair cap — short crop, slightly forward fringe. */}
      <mesh position={[0, 0.84, -0.02]} castShadow>
        <sphereGeometry
          args={[0.31, 22, 16, 0, Math.PI * 2, 0, Math.PI / 1.9]}
        />
        <meshStandardMaterial color="#221812" roughness={0.7} />
      </mesh>
      {/* Side-swept fringe over the brow. */}
      <mesh position={[-0.07, 0.88, 0.22]} rotation={[0.35, -0.3, -0.5]} castShadow>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshStandardMaterial color="#221812" roughness={0.7} />
      </mesh>

      {/* Round glasses — two thin tori float just off the face. The frames
          read clearly at the iso zoom and instantly differentiate Yiyang
          from the Player. */}
      {[-0.11, 0.11].map((ex, i) => (
        <mesh
          key={`frame-${i}`}
          position={[ex, 0.74, 0.27]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.065, 0.012, 8, 18]} />
          <meshStandardMaterial color="#2a1f15" roughness={0.4} metalness={0.2} />
        </mesh>
      ))}
      {/* Bridge connecting the lenses. */}
      <mesh position={[0, 0.74, 0.28]}>
        <boxGeometry args={[0.07, 0.012, 0.012]} />
        <meshStandardMaterial color="#2a1f15" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Eye dots peeking through the frames. */}
      {[
        [-0.11, 0.74, 0.29],
        [0.11, 0.74, 0.29],
      ].map(([ex, ey, ez], i) => (
        <mesh key={`eye-${i}`} position={[ex, ey, ez]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#1a1410" roughness={0.4} />
        </mesh>
      ))}

      {/* Cheek warmth — a hint of color to match the cup of tea. */}
      {[
        [-0.18, 0.66, 0.24],
        [0.18, 0.66, 0.24],
      ].map(([ex, ey, ez], i) => (
        <mesh key={`cheek-${i}`} position={[ex, ey, ez]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#e89a8e" roughness={0.7} />
        </mesh>
      ))}

      {/* Soft smile — a thin curved torus segment under the nose line. */}
      <mesh
        position={[0, 0.65, 0.27]}
        rotation={[0, 0, 0]}
      >
        <torusGeometry args={[0.04, 0.008, 6, 10, Math.PI]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.6} />
      </mesh>

      {/* Invisible hit-box covering the whole character so picking the head
          or the cup still triggers the same click. Keeps the pointer cursor
          stable instead of flickering between sub-meshes. */}
      <mesh position={[0, 0.55, 0.08]} visible={false}>
        <boxGeometry args={[0.9, 1.2, 0.7]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
