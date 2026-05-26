import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useStore } from "jotai";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { playerPosAtom, type Vec3 } from "~/stores/courtyard";

export interface YiyangAvatarProps {
  position: Vec3;
  onClick: () => void;
}

// Tone palette pulled from Yiyang's portrait: warm cream skin, soft pink
// cheeks, dark hoodie under a white outer jacket, and a fluffy black mop of
// curly hair. Keeping these as named constants makes it easy to tweak the
// whole character without hunting through the JSX.
const SKIN = "#f8d8b6";
const SKIN_SHADOW = "#e9b58a";
const HAIR = "#1d130d";
const HAIR_HIGHLIGHT = "#2d1f15";
const HOODIE_DARK = "#1f1812";
const JACKET = "#f3ecdc";
const JACKET_SHADOW = "#d9cfb7";
const PANTS = "#3a2c1c";
const CHEEK = "#f0a4a0";
const LIP = "#a25a40";
const GLASSES_FRAME = "#1a120b";

// Tiny anime-style curl: each entry is one fluffy black sphere placed in head
// coordinates. Together they form an organic mop instead of a perfect cap.
type Curl = {
  pos: [number, number, number];
  scale: number;
  rot?: [number, number, number];
};
const CURLS: Curl[] = [
  { pos: [0, 0.18, 0.02], scale: 0.26 },
  { pos: [-0.18, 0.16, 0.04], scale: 0.21, rot: [0, 0, 0.3] },
  { pos: [0.18, 0.16, 0.04], scale: 0.21, rot: [0, 0, -0.3] },
  { pos: [-0.05, 0.2, 0.18], scale: 0.18, rot: [0.2, -0.3, 0] },
  { pos: [0.08, 0.22, 0.14], scale: 0.16, rot: [0.3, 0.2, 0.1] },
  { pos: [-0.12, 0.22, -0.08], scale: 0.18 },
  { pos: [0.14, 0.22, -0.06], scale: 0.17 },
  { pos: [0, 0.25, -0.06], scale: 0.16 },
  { pos: [-0.22, 0.1, -0.1], scale: 0.14 },
  { pos: [0.22, 0.1, -0.1], scale: 0.14 },
];

/**
 * Yiyang — a seated 3D chibi character built from primitives. The proportions
 * (oversized head, tiny body, fluffy curl-mop, big round glasses) match the
 * cartoon portrait Yiyang uses elsewhere on the site so visitors recognize him
 * instantly. The body is anchored to the cushion mat and has a gentle idle bob
 * + slow head-tilt so he reads as alive, not propped up.
 *
 * `position` is the foot of the character on the ground — Y is ignored.
 */
// How fast Yiyang turns to track the visitor. Higher = snappier.
const TURN_RESPONSE = 6;
// Inside this radius (squared) the player is "at the cushion" — hold the
// previous facing so Yiyang doesn't whip back and forth on tiny jitters.
const TURN_DEADZONE_SQ = 0.2 * 0.2;
// Resting yaw when nobody's around — angled toward the south gate so a fresh
// visitor sees his front, not the back of his head.
const RESTING_YAW = 0.55;

export function YiyangAvatar({ position, onClick }: YiyangAvatarProps) {
  const [x, , z] = position;
  const store = useStore();

  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  // Target yaw the body is smoothly rotating toward.
  const targetYaw = useRef(RESTING_YAW);

  // Pre-build eye/iris geometries so we get the same sparkle without rebuilding
  // a sphere per mesh per frame.
  const eyeWhite = useMemo(() => new THREE.SphereGeometry(0.055, 16, 12), []);
  const eyePupil = useMemo(() => new THREE.SphereGeometry(0.034, 12, 10), []);
  const eyeShine = useMemo(() => new THREE.SphereGeometry(0.012, 8, 8), []);

  // Idle animation + visitor tracking. We compute the bearing from Yiyang to
  // the player every frame and ease the body's yaw toward it so he always
  // turns to face an approaching guest. atan2(dx, dz) puts +Z (the chibi's
  // natural forward) at yaw=0, matching the Player's heading convention.
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const body = bodyRef.current;
    if (body) {
      body.position.y = Math.sin(t * 1.1) * 0.018;

      const player = store.get(playerPosAtom);
      const dx = player[0] - x;
      const dz = player[2] - z;
      if (dx * dx + dz * dz > TURN_DEADZONE_SQ) {
        targetYaw.current = Math.atan2(dx, dz);
      }

      // Wrap the diff into [-π, π] so the short way around always wins.
      let diff = targetYaw.current - body.rotation.y;
      if (diff > Math.PI) diff -= Math.PI * 2;
      else if (diff < -Math.PI) diff += Math.PI * 2;
      const k = Math.min(1, delta * TURN_RESPONSE);
      body.rotation.y += diff * k;
    }
    if (headRef.current) {
      headRef.current.rotation.z = Math.sin(t * 0.6) * 0.04;
      headRef.current.rotation.y = Math.sin(t * 0.45) * 0.06;
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group
      ref={bodyRef}
      position={[x, 0, z]}
      rotation={[0, RESTING_YAW, 0]}
      onClick={handleClick}
    >
      {/* Crossed legs in dark trousers — two squashed capsules angled inward. */}
      <mesh position={[-0.2, 0.13, 0.1]} rotation={[0, 0.4, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.14, 0.24, 8, 16]} />
        <meshStandardMaterial color={PANTS} roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 0.13, 0.1]} rotation={[0, -0.4, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.14, 0.24, 8, 16]} />
        <meshStandardMaterial color={PANTS} roughness={0.7} />
      </mesh>
      {/* Foot caps so the crossed pose terminates cleanly. */}
      <mesh position={[0.3, 0.1, 0.24]} castShadow>
        <sphereGeometry args={[0.085, 12, 10]} />
        <meshStandardMaterial color="#2a1d10" roughness={0.7} />
      </mesh>
      <mesh position={[-0.3, 0.1, 0.24]} castShadow>
        <sphereGeometry args={[0.085, 12, 10]} />
        <meshStandardMaterial color="#2a1d10" roughness={0.7} />
      </mesh>

      {/* Torso: dark hoodie underneath, sitting flush against the body. */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 0.18, 8, 20]} />
        <meshStandardMaterial color={HOODIE_DARK} roughness={0.62} />
      </mesh>

      {/* White outer jacket: a slightly bigger half-capsule wrapping the back
          and sides, with an open V-front so the dark hoodie shows through. */}
      <mesh position={[-0.16, 0.43, 0.05]} rotation={[0, 0.25, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.2, 8, 16]} />
        <meshPhysicalMaterial
          color={JACKET}
          roughness={0.45}
          clearcoat={0.4}
          clearcoatRoughness={0.4}
          sheen={0.5}
          sheenColor={JACKET_SHADOW}
        />
      </mesh>
      <mesh position={[0.16, 0.43, 0.05]} rotation={[0, -0.25, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.2, 8, 16]} />
        <meshPhysicalMaterial
          color={JACKET}
          roughness={0.45}
          clearcoat={0.4}
          clearcoatRoughness={0.4}
          sheen={0.5}
          sheenColor={JACKET_SHADOW}
        />
      </mesh>

      {/* Hoodie cowl/collar peeking up behind the head. */}
      <mesh position={[0, 0.6, -0.16]} rotation={[0.5, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.07, 10, 22, Math.PI]} />
        <meshStandardMaterial color={HOODIE_DARK} roughness={0.6} />
      </mesh>

      {/* Arms folded in lap — short capsules angled inward, ending at the cup. */}
      <mesh position={[-0.24, 0.36, 0.2]} rotation={[0.45, 0.15, 0.85]} castShadow>
        <capsuleGeometry args={[0.085, 0.18, 8, 12]} />
        <meshStandardMaterial color={JACKET} roughness={0.5} />
      </mesh>
      <mesh position={[0.24, 0.36, 0.2]} rotation={[0.45, -0.15, -0.85]} castShadow>
        <capsuleGeometry args={[0.085, 0.18, 8, 12]} />
        <meshStandardMaterial color={JACKET} roughness={0.5} />
      </mesh>
      {/* Tiny skin-tone "hand" disks just before the cup. */}
      <mesh position={[-0.14, 0.36, 0.3]} castShadow>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.36, 0.3]} castShadow>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>

      {/* Teacup cradled in the lap. */}
      <mesh position={[0, 0.38, 0.32]} castShadow receiveShadow>
        <cylinderGeometry args={[0.085, 0.075, 0.11, 18]} />
        <meshStandardMaterial color="#f4ecd8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.44, 0.32]}>
        <cylinderGeometry args={[0.088, 0.088, 0.012, 18]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.6} />
      </mesh>
      {/* Tea inside the cup: a flat dark disc just below the rim. */}
      <mesh position={[0, 0.425, 0.32]}>
        <cylinderGeometry args={[0.07, 0.07, 0.005, 18]} />
        <meshStandardMaterial color="#5a3a18" roughness={0.4} />
      </mesh>
      {/* A whiff of steam — a soft cream sphere just above the cup. */}
      <mesh position={[0.02, 0.6, 0.32]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial
          color="#fbf3e0"
          transparent
          opacity={0.55}
          roughness={0.95}
        />
      </mesh>

      {/* HEAD GROUP — animated independently for the gentle head tilt. */}
      <group ref={headRef} position={[0, 0.78, 0]}>
        {/* Skull: a slightly squashed sphere so the chibi proportions read
            extra-cute (head ~= body width, slight chin taper). */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.34, 28, 22]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>

        {/* Tiny ears — sphere bumps on either side, just behind the glasses. */}
        <mesh position={[-0.32, -0.02, 0]} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.65} />
        </mesh>
        <mesh position={[0.32, -0.02, 0]} castShadow>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.65} />
        </mesh>

        {/* Fluffy curly mop: many overlapping black spheres on top + sides. */}
        {CURLS.map((c, i) => (
          <mesh
            key={i}
            position={c.pos}
            rotation={c.rot ?? [0, 0, 0]}
            castShadow
          >
            <sphereGeometry args={[c.scale, 14, 12]} />
            <meshStandardMaterial color={HAIR} roughness={0.7} />
          </mesh>
        ))}
        {/* Side-swept fringe over the brow — adds the avatar's signature curl. */}
        <mesh position={[-0.08, 0.14, 0.27]} rotation={[0.35, -0.3, -0.5]} castShadow>
          <sphereGeometry args={[0.14, 14, 12]} />
          <meshStandardMaterial color={HAIR_HIGHLIGHT} roughness={0.72} />
        </mesh>
        <mesh position={[0.12, 0.16, 0.24]} rotation={[0.3, 0.2, 0.55]} castShadow>
          <sphereGeometry args={[0.11, 12, 10]} />
          <meshStandardMaterial color={HAIR_HIGHLIGHT} roughness={0.72} />
        </mesh>

        {/* Eyes: a white globe + black pupil + tiny shine, giving the avatar's
            big-eyed anime sparkle instead of a flat dot. */}
        {[-0.12, 0.12].map((ex, i) => (
          <group key={`eye-${i}`} position={[ex, -0.02, 0.3]}>
            <mesh geometry={eyeWhite} position={[0, 0, 0]}>
              <meshStandardMaterial color="#fffdf8" roughness={0.4} />
            </mesh>
            <mesh geometry={eyePupil} position={[0, 0, 0.02]}>
              <meshStandardMaterial color="#1d120a" roughness={0.5} />
            </mesh>
            <mesh geometry={eyeShine} position={[0.012, 0.014, 0.045]}>
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* Round glasses: dark torus frames floating just off the face. */}
        {[-0.12, 0.12].map((ex, i) => (
          <mesh
            key={`frame-${i}`}
            position={[ex, -0.02, 0.34]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.082, 0.013, 10, 26]} />
            <meshStandardMaterial
              color={GLASSES_FRAME}
              roughness={0.35}
              metalness={0.25}
            />
          </mesh>
        ))}
        {/* Glasses bridge across the nose. */}
        <mesh position={[0, -0.02, 0.345]}>
          <boxGeometry args={[0.078, 0.013, 0.013]} />
          <meshStandardMaterial color={GLASSES_FRAME} roughness={0.35} metalness={0.25} />
        </mesh>
        {/* Temple arms running back along the head — tiny boxes at each side. */}
        {[-1, 1].map((sign) => (
          <mesh
            key={`temple-${sign}`}
            position={[sign * 0.21, -0.02, 0.22]}
            rotation={[0, sign * 0.5, 0]}
          >
            <boxGeometry args={[0.12, 0.013, 0.013]} />
            <meshStandardMaterial color={GLASSES_FRAME} roughness={0.35} metalness={0.25} />
          </mesh>
        ))}

        {/* Tiny nose nub for depth. */}
        <mesh position={[0, -0.1, 0.33]}>
          <sphereGeometry args={[0.022, 10, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>

        {/* Cheek blush dabs. */}
        {[-0.2, 0.2].map((ex, i) => (
          <mesh key={`cheek-${i}`} position={[ex, -0.13, 0.27]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color={CHEEK} roughness={0.75} />
          </mesh>
        ))}

        {/* Smile — a thin curved torus segment, plus a tiny mouth opening for
            the hint of teeth visible in the portrait. */}
        <mesh position={[0, -0.18, 0.31]}>
          <torusGeometry args={[0.045, 0.009, 8, 14, Math.PI]} />
          <meshStandardMaterial color={LIP} roughness={0.55} />
        </mesh>
        <mesh position={[0, -0.18, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.012, 16]} />
          <meshStandardMaterial color="#fffaf0" roughness={0.6} />
        </mesh>
      </group>

      {/* Invisible hit-box covering the whole character so picking the head
          or the cup still triggers the same click. Keeps the pointer cursor
          stable instead of flickering between sub-meshes. */}
      <mesh position={[0, 0.55, 0.08]} visible={false}>
        <boxGeometry args={[1.0, 1.4, 0.8]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
