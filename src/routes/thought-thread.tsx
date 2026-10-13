import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router";
import {
  ThoughtLink as Link,
  thoughtsReturnPath,
} from "~/components/thoughts/ThoughtLink";
import { ThoughtNote } from "~/components/thoughts/ThoughtNote";
import { displayDate, stateLabel, threads } from "~/components/thoughts/model";
import { thoughtMeta } from "~/components/thoughts/metadata";
import { useHydrated } from "~/components/thoughts/useHydrated";

function findThread(pathname: string) {
  return threads.find(
    (thread) => thread.id === pathname.replace(/\/$/, "").split("/").at(-1)
  );
}
export const meta = ({ location }: { location: { pathname: string } }) => {
  const thread = findThread(location.pathname);
  return thoughtMeta(
    thread?.title ?? "Thoughts",
    "沿着同一个问题，看想法如何变化。",
    location.pathname.replace(/\/$/, "")
  );
};

export default function ThoughtThreadPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const thread = findThread(location.pathname);
  const hydrated = useHydrated();
  // IDs only contain ASCII slug characters; malformed external hashes must not crash.
  const selected = hydrated ? location.hash.slice(1) : "";
  const compare = hydrated && params.get("view") === "compare";
  const index = thread?.notes.findIndex((note) => note.id === selected) ?? -1;
  const currentIndex = index < 0 ? 0 : index;

  useEffect(() => {
    if (!selected) return;
    const element = document.getElementById(selected);
    if (element) {
      element.scrollIntoView({ block: "start" });
      element.focus({ preventScroll: true });
    }
  }, [selected, compare]);

  if (!thread)
    return (
      <>
        <h1>没有找到这条想法线</h1>
        <Link to="/thoughts">返回 Thoughts</Link>
      </>
    );
  const notes = thread.notes;
  const root = thread.root;
  const later = notes.slice(1);
  const now = later.find((note) => note.id === selected) ?? later.at(-1);
  const query = compare ? "?view=compare" : "";
  const linkTo = (id: string) => `/thoughts/${thread.id}${query}#${id}`;

  return (
    <section className="thought-thread-page">
      <Link
        to={thoughtsReturnPath(hydrated ? location.state : null)}
        className="thought-back"
      >
        ← 返回时间流
      </Link>
      <p className="thought-meta">
        {displayDate(root.date)}
        {notes.length > 1 && ` → ${displayDate(notes.at(-1)!.date)}`} ·{" "}
        {notes.length} 条记录 · {stateLabel(thread)}
      </p>
      <h1 className="thoughts-title">{thread.title}</h1>
      <p className="thoughts-lead">
        原文留在当时，后来的回应、补充与修正以新记录接上。
      </p>
      <nav className="thought-view-switch" aria-label="想法线浏览方式">
        <Link
          to={`/thoughts/${thread.id}${selected ? `#${selected}` : ""}`}
          aria-current={!compare ? "page" : undefined}
        >
          完整时间轴
        </Link>
        <Link
          to={`/thoughts/${thread.id}?view=compare${
            selected ? `#${selected}` : ""
          }`}
          aria-current={compare ? "page" : undefined}
        >
          那时与现在
        </Link>
      </nav>
      {compare ? (
        <>
          <nav className="thought-milestones" aria-label="选择对照节点">
            {notes.map((note) => (
              <Link
                key={note.id}
                to={linkTo(note.id)}
                aria-current={
                  (selected ? note.id === selected : note === now)
                    ? "step"
                    : undefined
                }
              >
                {displayDate(note.date)}
                <span>{note === root ? "最初" : note.title}</span>
              </Link>
            ))}
          </nav>
          <div className="thought-comparison">
            <div>
              <h2>那时 · Then</h2>
              <ThoughtNote note={root} selected={selected === root.id} />
            </div>
            <div>
              <h2>{now ? "后来 · Now" : "尚无后续"}</h2>
              {now ? (
                <ThoughtNote note={now} selected={selected === now.id} />
              ) : (
                <p className="thought-empty">
                  {root.kind === "question"
                    ? "这个问题仍然开着。没有回答也是一种有效状态，不需要替它补写结论。"
                    : "这是一条独立想法，暂时没有后续记录。"}
                </p>
              )}
            </div>
          </div>
          <p>
            <Link to={`/thoughts/${thread.id}${now ? `#${now.id}` : ""}`}>
              阅读中间的全部 {notes.length} 条记录 →
            </Link>
          </p>
        </>
      ) : (
        <>
          <nav className="thought-stepper" aria-label="逐条浏览想法线">
            {currentIndex > 0 ? (
              <Link to={linkTo(notes[currentIndex - 1].id)}>← 上一条</Link>
            ) : (
              <span>已是最早</span>
            )}
            <span>
              {currentIndex + 1} / {notes.length}
            </span>
            {currentIndex < notes.length - 1 ? (
              <Link to={linkTo(notes[currentIndex + 1].id)}>下一条 →</Link>
            ) : (
              <span>已是最新</span>
            )}
          </nav>
          <ol className="thought-timeline">
            {notes.map((note) => (
              <li key={note.id}>
                <ThoughtNote note={note} selected={selected === note.id} />
              </li>
            ))}
          </ol>
          {notes.length === 1 && (
            <p className="thought-empty">
              {root.kind === "question"
                ? "这个问题尚无回答，未来有了新想法会接在这里。"
                : "独立想法也可以完整地留在这里。"}
            </p>
          )}
        </>
      )}
    </section>
  );
}
