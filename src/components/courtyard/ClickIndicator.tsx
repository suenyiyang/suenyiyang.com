import { useFrame } from "@react-three/fiber";
import { useStore } from "jotai";
import { useRef } from "react";
import * as THREE from "three";
import { playerTargetAtom } from "~/stores/courtyard";

/**
 * A small ring that pulses at the click-to-move destination while the player
 * is walking there. Position/visibility are driven directly from the jotai
 * store inside `useFrame` so this component never re-renders.
 */
export function ClickIndicator() {
  const store = useStore();
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const material = materialRef.current;
    if (!group || !material) return;

    const target = store.get(playerTargetAtom);
    if (!target) {
      if (group.visible) group.visible = false;
      return;
    }

    if (!group.visible) group.visible = true;
    group.position.set(target[0], 0.02, target[2]);
    // Gentle pulse: scale + opacity oscillation.
    const pulse = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 6);
    group.scale.setScalar(pulse);
    material.opacity = 0.55 * pulse;
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.34, 48]} />
        <meshBasicMaterial
          ref={materialRef}
          color="#1a3a2a"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
