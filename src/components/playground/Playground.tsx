import { useAtomValue } from "jotai";
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { activeModalAtom } from "~/stores/playground";
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

export function Playground() {
  const [mounted, setMounted] = useState(false);
  const activeModal = useAtomValue(activeModalAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative w-full h-[min(80vh,720px)] rounded-lg overflow-hidden border border-[var(--reading-rule)] bg-[#dac7a8]">
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
