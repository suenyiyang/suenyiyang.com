import { useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { PostList } from "~/components/PostList";
import { activeModalAtom } from "~/stores/courtyard";

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
        className="relative flex flex-col w-[min(640px,92vw)] max-h-[min(620px,88vh)] rounded-xl bg-[var(--reading-paper)] text-[var(--reading-text-primary)] shadow-[0_20px_60px_-15px_rgba(20,15,8,0.45)] border border-[var(--reading-rule)] outline-none overflow-hidden"
      >
        <header className="flex items-end justify-between gap-4 border-b border-[var(--reading-rule)] px-6 pt-5 pb-4">
          <div>
            <div className="font-mono text-eyebrow font-bold tracking-[0.18em] uppercase text-[var(--reading-text-muted)] mb-1">
              Newspaper Stand
            </div>
            <h2
              id="posts-modal-title"
              className="font-display italic text-h2 leading-none text-[var(--reading-text-primary)]"
            >
              Recent posts
            </h2>
          </div>
          <div className="flex items-center gap-3 pb-1">
            <Link
              to="/posts"
              className="font-mono text-meta text-[var(--reading-text-secondary)] hover:text-[var(--reading-text-primary)] transition-colors"
            >
              View all →
            </Link>
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="font-mono text-meta text-[var(--reading-text-muted)] hover:text-[var(--reading-text-primary)] transition-colors px-2 py-1 rounded -mr-2"
            >
              ✕
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto px-6 py-2">
          <PostList variant="default" limit={6} />
        </div>
      </div>
    </div>
  );
}
