import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { nearbyTriggerAtom } from "~/stores/playground";

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduce;
}

export function TriggerHint() {
  const nearby = useAtomValue(nearbyTriggerAtom);
  const reduce = usePrefersReducedMotion();
  return (
    <div
      aria-hidden={!nearby}
      className={`pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 ${
        reduce ? "" : "transition-opacity duration-150"
      }`}
      style={{ opacity: nearby ? 1 : 0 }}
    >
      <div className="font-mono text-meta border border-[var(--reading-rule)] bg-[var(--reading-paper)] text-[var(--reading-text-primary)] px-4 py-2 rounded-full shadow-sm">
        {nearby?.label}
      </div>
    </div>
  );
}
