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

  // Split the "[E] label" pattern so we can render the key as a chip.
  const match = nearby?.label.match(/^\[(.+?)\]\s*(.+)$/);
  const keyHint = match?.[1];
  const text = match?.[2] ?? nearby?.label ?? "";

  return (
    <div
      aria-hidden={!nearby}
      className={`pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 ${
        reduce ? "" : "transition-all duration-200"
      }`}
      style={{
        opacity: nearby ? 1 : 0,
        transform: nearby
          ? "translate(-50%, 0)"
          : "translate(-50%, 4px)",
      }}
    >
      <div className="flex items-center gap-2.5 border border-[var(--reading-rule)] bg-[var(--reading-paper)]/95 backdrop-blur-sm text-[var(--reading-text-primary)] px-4 py-2 rounded-full shadow-[0_6px_20px_-8px_rgba(20,15,8,0.4)]">
        {keyHint ? (
          <kbd className="font-mono text-meta font-medium px-1.5 py-0.5 rounded border border-[var(--reading-rule)] bg-[#f4efe3] text-[var(--reading-text-primary)]">
            {keyHint}
          </kbd>
        ) : null}
        <span className="font-mono text-meta text-[var(--reading-text-primary)]">{text}</span>
      </div>
    </div>
  );
}
