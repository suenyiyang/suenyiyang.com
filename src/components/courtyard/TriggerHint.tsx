import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { nearbyTriggerAtom } from "~/stores/courtyard";

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

/**
 * Coarse-pointer devices (phones, tablets) don't have a keyboard handy, so
 * the `[E]` chip becomes confusing. We swap the chip for a `Tap` glyph and
 * let the player activate by tapping the prop a second time.
 */
function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none) and (pointer: coarse)");
    setIsTouch(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsTouch(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isTouch;
}

export function TriggerHint() {
  const nearby = useAtomValue(nearbyTriggerAtom);
  const reduce = usePrefersReducedMotion();
  const isTouch = useIsTouch();

  // Split the "[E] label" pattern so we can render the key as a chip.
  const match = nearby?.label.match(/^\[(.+?)\]\s*(.+)$/);
  const keyHint = isTouch ? "点按" : match?.[1];
  const text = match?.[2] ?? nearby?.label ?? "";

  return (
    <div
      aria-hidden={!nearby}
      className={`pointer-events-none absolute bottom-8 left-1/2 w-max max-w-[calc(100vw-2rem)] ${
        reduce ? "" : "transition-all duration-200"
      }`}
      style={{
        opacity: nearby ? 1 : 0,
        transform: nearby
          ? "translate(-50%, 0)"
          : "translate(-50%, 4px)",
      }}
    >
      <div className="flex items-center gap-2.5 whitespace-nowrap border border-[var(--reading-rule)] bg-[var(--reading-paper)]/95 backdrop-blur-sm text-[var(--reading-text-primary)] px-4 py-2 rounded-full shadow-[0_6px_20px_-8px_rgba(20,15,8,0.4)]">
        {keyHint ? (
          isTouch ? (
            <span className="font-mono text-meta font-medium px-2 py-0.5 rounded-full border border-[var(--reading-rule)] bg-[var(--reading-code-bg)] text-[var(--reading-text-primary)]">
              {keyHint}
            </span>
          ) : (
            <kbd className="font-mono text-meta font-medium px-1.5 py-0.5 rounded border border-[var(--reading-rule)] bg-[var(--reading-code-bg)] text-[var(--reading-text-primary)]">
              {keyHint}
            </kbd>
          )
        ) : null}
        <span className="font-mono text-meta text-[var(--reading-text-primary)]">{text}</span>
      </div>
    </div>
  );
}
