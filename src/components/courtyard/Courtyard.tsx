import { useAtomValue, useSetAtom } from "jotai";
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import {
  activeModalAtom,
  chatMessagesAtom,
  nearbyTriggerAtom,
  playerPosAtom,
  playerTargetAtom,
  PLAYER_SPAWN,
} from "~/stores/courtyard";
import { ChatPanel } from "./ChatPanel";
import { MobileNotice } from "./MobileNotice";
import { PostsModal } from "./PostsModal";
import { TriggerHint } from "./TriggerHint";

const Scene = lazy(() => import("./Scene"));

function SceneSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#e8dfd0]">
      <div className="font-mono text-meta text-text-secondary">Loading…</div>
    </div>
  );
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { errored: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { errored: false };
  }
  static getDerivedStateFromError() {
    return { errored: true };
  }
  render() {
    if (this.state.errored) return <SceneSkeleton />;
    return this.props.children;
  }
}

export function Courtyard() {
  const [mounted, setMounted] = useState(false);
  const activeModal = useAtomValue(activeModalAtom);
  const setPlayerPos = useSetAtom(playerPosAtom);
  const setPlayerTarget = useSetAtom(playerTargetAtom);
  const setNearby = useSetAtom(nearbyTriggerAtom);
  const setActiveModal = useSetAtom(activeModalAtom);
  const setChatMessages = useSetAtom(chatMessagesAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      setPlayerPos(PLAYER_SPAWN);
      setPlayerTarget(null);
      setNearby(null);
      setActiveModal(null);
      setChatMessages([]);
    };
  }, [setPlayerPos, setPlayerTarget, setNearby, setActiveModal, setChatMessages]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#dac7a8]">
      {mounted ? (
        <SceneErrorBoundary>
          <Suspense fallback={<SceneSkeleton />}>
            <Scene />
          </Suspense>
        </SceneErrorBoundary>
      ) : (
        <SceneSkeleton />
      )}

      <TriggerHint />
      <MobileNotice />

      {activeModal === "chat" && <ChatPanel />}
      {activeModal === "posts" && <PostsModal />}
    </div>
  );
}
