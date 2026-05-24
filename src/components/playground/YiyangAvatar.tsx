import { Billboard } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { Component, Suspense, type ReactNode } from "react";
import * as THREE from "three";
import { siteConfig } from "~/config";
import { type Vec3 } from "~/stores/playground";

export interface YiyangAvatarProps {
  position: Vec3;
  onClick: () => void;
}

function AvatarMesh({ position, onClick }: YiyangAvatarProps) {
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

/** Fallback silhouette when the avatar texture can't be loaded (e.g. CORS). */
function AvatarFallback({ position, onClick }: YiyangAvatarProps) {
  return (
    <Billboard position={position} onClick={onClick}>
      <mesh>
        <planeGeometry args={[1.0, 1.5]} />
        <meshBasicMaterial color="#a8b8c8" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </Billboard>
  );
}

class AvatarErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { errored: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { errored: false };
  }
  static getDerivedStateFromError() {
    return { errored: true };
  }
  render() {
    return this.state.errored ? this.props.fallback : this.props.children;
  }
}

export function YiyangAvatar({ position, onClick }: YiyangAvatarProps) {
  const fallback = <AvatarFallback position={position} onClick={onClick} />;
  return (
    <AvatarErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <AvatarMesh position={position} onClick={onClick} />
      </Suspense>
    </AvatarErrorBoundary>
  );
}
