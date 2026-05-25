import { ContactShadows, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useSetAtom, useStore } from "jotai";
import { useCallback, useMemo } from "react";
import * as THREE from "three";
import {
  activeModalAtom,
  PLAYER_SPAWN,
  playerPosAtom,
  playerTargetAtom,
  type Vec3,
} from "~/stores/courtyard";
import { ClickIndicator } from "./ClickIndicator";
import { Fence } from "./Fence";
import { Ground } from "./Ground";
import { NewspaperStand } from "./NewspaperStand";
import { Player } from "./Player";
import { CushionMat, GardenProps } from "./SceneProps";
import { Tree } from "./Tree";
import { useTriggerActivation, useTriggerZones, type TriggerZone } from "./useTriggerZone";
import { YiyangAvatar } from "./YiyangAvatar";

const YIYANG_POS: [number, number, number] = [-1.8, 0, 0];
const NEWSPAPER_POS: [number, number, number] = [2.2, 0, 1.2];
const TREE_POS: [number, number, number] = [-3.2, 0, -3];
const TRIGGER_RADIUS = 1.3;

function SceneContents() {
  const setActiveModal = useSetAtom(activeModalAtom);
  const store = useStore();

  const zones = useMemo<TriggerZone[]>(
    () => [
      {
        propId: "yiyang",
        position: YIYANG_POS,
        radius: TRIGGER_RADIUS,
        label: "[E] 与 Yiyang 聊聊",
        onActivate: () => setActiveModal("chat"),
      },
      {
        propId: "newspaper",
        position: NEWSPAPER_POS,
        radius: TRIGGER_RADIUS,
        label: "[E] 翻阅最近文章",
        onActivate: () => setActiveModal("posts"),
      },
    ],
    [setActiveModal]
  );

  useTriggerZones(zones);
  useTriggerActivation();

  // Clicking a prop only activates when the player is already inside the
  // trigger zone — otherwise we steer the player toward it so they have to
  // physically walk over before the modal opens.
  const handlePropClick = useCallback(
    (position: Vec3, activate: () => void) => {
      const player = store.get(playerPosAtom);
      const dx = player[0] - position[0];
      const dz = player[2] - position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= TRIGGER_RADIUS) {
        activate();
        return;
      }
      // Stop just inside the zone so the player arrives "near" the prop.
      const stopAt = TRIGGER_RADIUS * 0.7;
      const ux = dx / dist;
      const uz = dz / dist;
      store.set(playerTargetAtom, [
        position[0] + ux * stopAt,
        PLAYER_SPAWN[1],
        position[2] + uz * stopAt,
      ]);
    },
    [store]
  );

  return (
    <>
      <color attach="background" args={["#ead9b9"]} />
      <fog attach="fog" args={["#ead9b9", 14, 28]} />

      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={60}
        near={0.1}
        far={100}
        onUpdate={(self) => self.lookAt(0, 0, 0)}
      />

      {/* Sky ↔ ground bounce gives every surface a warm-over-cool gradient. */}
      <hemisphereLight args={["#fff1d6", "#9c8458", 0.55]} />

      {/* Key light: warm sun, casts the courtyard's primary shadow. */}
      <directionalLight
        color="#ffe6c2"
        intensity={1.25}
        position={[6, 9, 4]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={25}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />

      {/* Cool fill from the opposite side adds dimensionality without flattening shadows. */}
      <directionalLight color="#b8c8d8" intensity={0.35} position={[-5, 4, -3]} />

      <ContactShadows
        position={[0, 0.012, 0]}
        opacity={0.32}
        scale={12}
        blur={2.8}
        far={4}
        resolution={512}
        color="#3a2a18"
      />

      <Ground />
      <ClickIndicator />
      <Fence />
      <GardenProps />
      <Tree position={TREE_POS} />
      <CushionMat position={[YIYANG_POS[0], 0, YIYANG_POS[2]]} rotationY={0.1} />
      <YiyangAvatar
        position={YIYANG_POS}
        onClick={() => handlePropClick(YIYANG_POS, () => setActiveModal("chat"))}
      />
      <NewspaperStand
        basePosition={NEWSPAPER_POS}
        onClick={() => handlePropClick(NEWSPAPER_POS, () => setActiveModal("posts"))}
      />
      <Player />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows="percentage"
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      role="application"
      aria-label="交互式小院子，使用 WASD 或方向键移动，按 E 触发交互"
    >
      <SceneContents />
    </Canvas>
  );
}
