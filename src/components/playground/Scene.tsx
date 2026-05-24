import { ContactShadows, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useSetAtom } from "jotai";
import { useMemo } from "react";
import { activeModalAtom } from "~/stores/playground";
import { Fence } from "./Fence";
import { Ground } from "./Ground";
import { NewspaperStand } from "./NewspaperStand";
import { Player } from "./Player";
import { Tree } from "./Tree";
import { useTriggerActivation, useTriggerZones, type TriggerZone } from "./useTriggerZone";
import { YiyangAvatar } from "./YiyangAvatar";

const YIYANG_POS: [number, number, number] = [-1.8, 0.75, 0];
const NEWSPAPER_POS: [number, number, number] = [2.2, 0, 1.2];
const TREE_POS: [number, number, number] = [-3.2, 0, -3];

function SceneContents() {
  const setActiveModal = useSetAtom(activeModalAtom);

  const zones = useMemo<TriggerZone[]>(
    () => [
      {
        propId: "yiyang",
        position: YIYANG_POS,
        radius: 1.3,
        label: "[E] 与 Yiyang 聊聊",
        onActivate: () => setActiveModal("chat"),
      },
      {
        propId: "newspaper",
        position: NEWSPAPER_POS,
        radius: 1.3,
        label: "[E] 翻阅最近文章",
        onActivate: () => setActiveModal("posts"),
      },
    ],
    [setActiveModal]
  );

  useTriggerZones(zones);
  useTriggerActivation();

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[10, 10, 10]}
        zoom={60}
        near={0.1}
        far={100}
        onUpdate={(self) => self.lookAt(0, 0, 0)}
      />
      <ambientLight color="#a8c4d4" intensity={0.4} />
      <directionalLight color="#ffe8c8" intensity={1.1} position={[5, 8, 5]} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={11}
        blur={2.5}
        far={4}
      />
      <Ground />
      <Fence />
      <Tree position={TREE_POS} />
      <YiyangAvatar
        position={YIYANG_POS}
        onClick={() => setActiveModal("chat")}
      />
      <NewspaperStand
        basePosition={NEWSPAPER_POS}
        onClick={() => setActiveModal("posts")}
      />
      <Player />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas dpr={[1, 2]} gl={{ antialias: true }}>
      <SceneContents />
    </Canvas>
  );
}
