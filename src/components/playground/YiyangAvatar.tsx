import { Billboard } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { siteConfig } from "~/config";
import { type Vec3 } from "~/stores/playground";

export interface YiyangAvatarProps {
  position: Vec3;
  onClick: () => void;
}

export function YiyangAvatar({ position, onClick }: YiyangAvatarProps) {
  const texture = useLoader(
    THREE.TextureLoader,
    siteConfig.about?.avatar ?? ""
  );
  return (
    <Billboard position={position} onClick={onClick}>
      <mesh>
        <planeGeometry args={[1.0, 1.5]} />
        <meshBasicMaterial
          map={texture as THREE.Texture}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Billboard>
  );
}
