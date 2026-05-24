import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { PostList } from "~/components/PostList";
import { activeModalAtom } from "~/stores/playground";

export function PostsModal() {
  const setActiveModal = useSetAtom(activeModalAtom);
  const close = () => setActiveModal(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previousFocus.current?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="posts-modal-title"
      className="absolute inset-0 z-20 flex items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={close}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-[min(600px,90vw)] max-h-[min(560px,85vh)] overflow-auto rounded-lg bg-[var(--reading-paper)] text-[var(--reading-text-primary)] shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-[var(--reading-rule)] px-5 py-3">
          <h2 id="posts-modal-title" className="font-mono text-eyebrow font-bold tracking-[0.18em] uppercase">
            Recent posts
          </h2>
          <Link to="/posts" className="font-mono text-meta text-text-secondary hover:text-text-primary">
            View all &rarr;
          </Link>
        </div>
        <div className="p-5">
          <PostList variant="default" />
        </div>
      </div>
    </div>
  );
}
