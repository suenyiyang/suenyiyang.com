import { Fragment, useEffect, useId, useState } from "react";
import { thoughts } from "virtual:thoughts";
import { thoughtMeta } from "~/components/thoughts/metadata";

const COLLAPSE_AT = 288;

export const meta = () =>
  thoughtMeta("Thoughts", "一些尚未定论的想法，平铺在同一页。", "/thoughts");

function displayDate(date: string) {
  return date.slice(0, 10).replace(/-/g, ".");
}

export default function ThoughtsPage() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [overflowing, setOverflowing] = useState<Record<string, boolean>>({});
  const baseId = useId();

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash || !thoughts.some((thought) => thought.id === hash)) return;
    setExpanded((current) => ({ ...current, [hash]: true }));
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const thought of thoughts) {
      const body = document.getElementById(`${thought.id}-body`);
      next[thought.id] = (body?.scrollHeight ?? 0) > COLLAPSE_AT + 24;
    }
    setOverflowing(next);
  }, []);

  return (
    <div className="thoughts-page">
      <header className="thoughts-intro">
        <h1>Thoughts</h1>
        <p>一些尚未定论的想法。每篇都有固定链接，过长的内容可以展开。</p>
      </header>

      {thoughts.length > 1 && (
        <nav className="thoughts-toc" aria-label="目录">
          <p>目录</p>
          <ol>
            {thoughts.map((thought) => (
              <li key={thought.id}>
                <a href={`#${thought.id}`}>{thought.title}</a>
                <time dateTime={thought.date}>{displayDate(thought.date)}</time>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {thoughts.length === 0 ? (
        <p className="thoughts-empty">还没有发布的碎碎念。</p>
      ) : (
        thoughts.map((thought) => {
          const open = expanded[thought.id] === true;
          const canCollapse = overflowing[thought.id] === true;
          const panelId = `${baseId}-${thought.id}`;
          const Body = thought.Body;
          const headings = Object.fromEntries([1, 2, 3, 4, 5, 6].map((level) => [`h${level}`, `h${Math.min(level + 1, 6)}`]));
          return (
            <article key={thought.id} id={thought.id} className="thought-entry">
              <header>
                <time dateTime={thought.date}>{displayDate(thought.date)}</time>
                <h1>
                  <a href={`#${thought.id}`}>{thought.title}</a>
                </h1>
              </header>
              <div
                id={panelId}
                className={`thought-body${open || !canCollapse ? "" : " is-collapsed"}`}
              >
                <div id={`${thought.id}-body`} className="post-body">
                  <Body components={{ wrapper: Fragment, ...headings }} />
                </div>
              </div>
              {canCollapse && (
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() =>
                    setExpanded((current) => ({ ...current, [thought.id]: !open }))
                  }
                >
                  {open ? "收起" : "展开"}
                </button>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
