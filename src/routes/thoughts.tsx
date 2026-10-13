import { useSearchParams } from "react-router";
import { ThoughtLink as Link } from "~/components/thoughts/ThoughtLink";
import { thoughts } from "virtual:thoughts";
import {
  displayDate,
  followups,
  notesById,
  noteUrl,
  relationLabels,
  stateLabel,
  threadFor,
  threads,
} from "~/components/thoughts/model";
import { thoughtMeta } from "~/components/thoughts/metadata";
import { useHydrated } from "~/components/thoughts/useHydrated";

export const meta = () =>
  thoughtMeta("Thoughts", "一些尚未定论的想法，以及后来的回应。", "/thoughts");

export default function ThoughtsPage() {
  const [params, setParams] = useSearchParams();
  const hydrated = useHydrated();
  const q = hydrated ? params.get("q") ?? "" : "";
  const tag = hydrated ? params.get("tag") ?? "" : "";
  const status = hydrated ? params.get("status") ?? "" : "";
  const view =
    hydrated && params.get("view") === "featured" ? "featured" : "stream";
  const update = (key: string, value: string) => {
    // Read the latest committed URL, not a render's stale parameters: rapid
    // clear/search/select interactions can happen before a transition renders.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const tags = [...new Set(thoughts.flatMap((note) => note.tags))];
  const matches = thoughts
    .filter((note) => {
      const thread = threadFor(note);
      return (
        (!q ||
          `${note.title} ${note.content} ${thread.title}`
            .toLowerCase()
            .includes(q.toLowerCase())) &&
        (!tag || note.tags.includes(tag)) &&
        (!status || stateLabel(thread) === status)
      );
    })
    .slice()
    .reverse();
  const featured = threads.filter(
    (thread) =>
      thread.featured && matches.some((note) => thread.notes.includes(note))
  );

  return (
    <section className="thoughts-page">
      <h1 className="thoughts-title">
        Thoughts <span>碎碎念</span>
      </h1>
      <p className="thoughts-lead">
        一些尚未定论的想法，以及后来的回应。原文留在当时，变化写在后来。
      </p>
      <nav className="thought-view-switch" aria-label="Thoughts 浏览方式">
        <Link
          to="/thoughts"
          aria-current={view === "stream" ? "page" : undefined}
        >
          时间流
        </Link>
        <Link
          to="/thoughts?view=featured"
          aria-current={view === "featured" ? "page" : undefined}
        >
          精选对照
        </Link>
      </nav>
      {thoughts.length === 0 ? (
        <div className="thought-empty">
          <h2>想法从这里开始</h2>
          <p>
            这里会记录短想法、还没回答的问题，以及多年后的回应。第一条记录尚未发布。
          </p>
        </div>
      ) : (
        <>
          <div className="thought-filters">
            <label htmlFor="thought-search">
              搜索
              <input
                id="thought-search"
                type="search"
                value={q}
                placeholder="搜索想法与问题"
                onChange={(event) => update("q", event.target.value)}
              />
            </label>
            <label htmlFor="thought-tag">
              主题
              <select
                id="thought-tag"
                aria-label="主题"
                value={tag}
                onChange={(event) => update("tag", event.target.value)}
              >
                <option value="">全部主题</option>
                {tags.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label htmlFor="thought-status">
              状态
              <select
                id="thought-status"
                aria-label="状态"
                value={status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="">全部状态</option>
                {["已有后续", "尚无回答", "独立想法"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="thought-result" role="status">
            {view === "featured"
              ? `${featured.length} 条精选想法线`
              : `${matches.length} 条记录`}
            {(q || tag || status) && (
              <button
                type="button"
                onClick={() =>
                  setParams(view === "featured" ? { view } : {}, {
                    replace: true,
                  })
                }
              >
                清除筛选
              </button>
            )}
          </p>
          {view === "featured" ? (
            <div>
              {featured.map((thread) => (
                <article className="thought-preview" key={thread.id}>
                  <p className="thought-meta">
                    {displayDate(thread.root.date)} →{" "}
                    {displayDate(thread.notes.at(-1)!.date)} ·{" "}
                    {stateLabel(thread)}
                  </p>
                  <h2>
                    <Link to={`/thoughts/${thread.id}?view=compare`}>
                      {thread.title}
                    </Link>
                  </h2>
                  <p>
                    {thread.root.title} → {thread.notes.at(-1)!.title}
                  </p>
                  <Link to={`/thoughts/${thread.id}?view=compare`}>
                    那时与现在 →
                  </Link>
                </article>
              ))}
              {!featured.length && (
                <p className="thought-empty">暂无符合条件的精选想法线。</p>
              )}
            </div>
          ) : (
            <ol className="thought-stream">
              {matches.map((note) => {
                const thread = threadFor(note);
                const next = followups(note);
                return (
                  <li key={note.id}>
                    <article className="thought-preview">
                      <p className="thought-meta">
                        <time dateTime={note.date}>
                          {displayDate(note.date)}
                        </time>
                        <span>{note.tags.join(" · ")}</span>
                        <span>{stateLabel(thread)}</span>
                      </p>
                      <h2>
                        <Link to={noteUrl(note)}>{note.title}</Link>
                      </h2>
                      <p className="thought-excerpt">
                        {note.content
                          .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
                          .replace(/[#*`_>]/g, "")
                          .slice(0, 240)}
                        {note.content.length > 240 ? "…" : ""}
                      </p>
                      <div className="thought-actions">
                        {note.relations.map((rel) => (
                          <Link
                            key={rel.target}
                            to={noteUrl(notesById.get(rel.target)!)}
                          >
                            {relationLabels[rel.type]} · 回看当时 ↖
                          </Link>
                        ))}
                        {next.length > 0 && (
                          <Link to={noteUrl(next[0])}>
                            后来的回应 · {next.length} →
                          </Link>
                        )}
                        <Link to={noteUrl(note)}>
                          查看
                          {thread.notes.length > 1
                            ? `想法线 · ${thread.notes.length} 条`
                            : "完整记录"}{" "}
                          →
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
          {view === "stream" && !matches.length && (
            <p className="thought-empty">
              没有符合条件的记录，请尝试其他关键词或清除筛选。
            </p>
          )}
        </>
      )}
    </section>
  );
}
