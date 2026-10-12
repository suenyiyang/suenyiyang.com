import { FC, useEffect, useRef, useState } from "react";

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

interface TocProps {
  variant: "desktop" | "mobile";
}

const collectEntries = (): TocEntry[] => {
  const nodes = document.querySelectorAll<HTMLElement>(
    ".post-body h2, .post-body h3"
  );
  const entries: TocEntry[] = [];
  nodes.forEach((node) => {
    const id = node.id;
    if (!id) return;
    const text = node.textContent?.trim() ?? "";
    if (!text) return;
    entries.push({
      id,
      text,
      level: node.tagName === "H2" ? 2 : 3,
    });
  });
  return entries;
};

// Measure on interaction so font loading, resizing and expanding the mobile TOC
// are all accounted for. Only overflowing labels animate.
const measureOverflow = (link: HTMLAnchorElement) => {
  const label = link.querySelector<HTMLElement>(".toc-label");
  const text = link.querySelector<HTMLElement>(".toc-label-text");
  if (!label || !text) return;
  const distance = Math.max(0, text.scrollWidth - label.clientWidth);
  link.dataset.overflow = String(distance > 0);
  link.style.setProperty("--toc-scroll-distance", `${-distance}px`);
  link.style.setProperty("--toc-scroll-duration", `${Math.max(3, distance / 24) + 2}s`);
};

export const Toc: FC<TocProps> = ({ variant }) => {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Walk the post-body once after mount
  useEffect(() => {
    setEntries(collectEntries());
  }, []);

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (entries.length === 0) return;

    const nodes = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((node): node is HTMLElement => node !== null);

    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        // Pick the first heading whose top is within the viewport's top 30%
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    nodes.forEach((node) => observer.observe(node));
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  const list = (
    <ul className="toc-list m-0 list-none p-0">
      {entries.map((entry) => {
        const isActive = activeId === entry.id;
        const indent = entry.level === 3 ? "pl-[0.8rem]" : "pl-0";
        return (
          <li key={entry.id} className="m-0 p-0">
            <a
              href={`#${entry.id}`}
              title={entry.text}
              aria-current={isActive ? "location" : undefined}
              onMouseEnter={(event) => measureOverflow(event.currentTarget)}
              onFocus={(event) => measureOverflow(event.currentTarget)}
              className={`toc-link block py-1 font-serif text-meta leading-[1.7] no-underline transition-colors ${indent} ${
                isActive
                  ? "text-[var(--reading-accent)] font-bold border-l-2 border-[var(--reading-accent)] -ml-[0.6rem] pl-[0.5rem]"
                  : "text-text-secondary dark:text-text-secondary-dark hover:text-[var(--reading-accent)]"
              }`}
            >
              <span className="toc-label"><span className="toc-label-text">{entry.text}</span></span>
            </a>
          </li>
        );
      })}
    </ul>
  );

  if (variant === "desktop") {
    return (
      <aside className="post-toc-desktop" aria-label="Table of contents">
        <div className="toc-inner">
          <p className="mb-2 pb-2 border-b border-[var(--reading-rule)] font-serif text-eyebrow font-bold uppercase tracking-[0.18em] text-text-primary dark:text-text-primary-dark">
            Contents
          </p>
          {list}
        </div>
      </aside>
    );
  }

  // Mobile pill
  return (
    <details
      className="post-toc-mobile mb-6 rounded-lg border border-[var(--reading-rule)] bg-[var(--reading-code-bg)]/40"
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary
        role="button"
        className="flex items-center justify-between px-3 py-2 cursor-pointer list-none font-serif text-meta text-text-secondary dark:text-text-secondary-dark"
        aria-label="Contents"
      >
        <span className="font-bold uppercase tracking-[0.18em] text-text-primary dark:text-text-primary-dark text-eyebrow">
          Contents
        </span>
        <span aria-hidden>{open ? "▴" : "▾"}</span>
      </summary>
      <div className="px-3 pb-3 pt-1">{list}</div>
    </details>
  );
};
