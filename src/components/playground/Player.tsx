import { useAtomValue } from "jotai";
import { playerPosAtom } from "~/stores/playground";
import { useKeyboardMovement } from "./useKeyboardMovement";

export function Player() {
  useKeyboardMovement();
  const pos = useAtomValue(playerPosAtom);
  return (
    <mesh position={pos}>
      <capsuleGeometry args={[0.25, 0.4, 4, 8]} />
      <meshPhysicalMaterial color="#b8d8c8" roughness={0.3} clearcoat={1} />
    </mesh>
  );
}
