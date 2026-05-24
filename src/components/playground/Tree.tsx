import { type Vec3 } from "~/stores/playground";

export function Tree({ position }: { position: Vec3 }) {
  const [x, , z] = position;
  return (
    <group>
      <mesh position={[x, 0.3, z]}>
        <cylinderGeometry args={[0.12, 0.15, 0.6, 8]} />
        <meshStandardMaterial color="#6b4f2a" roughness={0.85} />
      </mesh>
      <mesh position={[x, 1.5, z]}>
        <coneGeometry args={[0.9, 1.8, 8]} />
        <meshStandardMaterial color="#7ea96a" roughness={0.7} />
      </mesh>
    </group>
  );
}
