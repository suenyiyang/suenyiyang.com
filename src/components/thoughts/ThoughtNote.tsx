import { Fragment } from "react";
import { ThoughtLink as Link } from "./ThoughtLink";
import type { Thought } from "~/types/thought";
import {
  displayDate,
  followups,
  notesById,
  noteUrl,
  relationLabels,
} from "./model";

export function ThoughtNote({
  note,
  selected = false,
}: {
  note: Thought;
  selected?: boolean;
}) {
  const next = followups(note);
  const Body = note.Body;
  return (
    <article
      id={note.id}
      className={`thought-note${selected ? " is-selected" : ""}`}
      tabIndex={-1}
      aria-label={note.title}
    >
      <div className="thought-meta">
        <time dateTime={note.date}>{displayDate(note.date)}</time>
        <a href={`#${note.id}`} aria-label={`${note.title}的固定链接`}>
          #{note.id}
        </a>
        {selected && <span>当前</span>}
      </div>
      <h3>{note.title}</h3>
      {note.relations.length > 0 && (
        <ul className="thought-relations">
          {note.relations.map((rel) => {
            const target = notesById.get(rel.target)!;
            return (
              <li key={rel.target}>
                {relationLabels[rel.type]} ·{" "}
                <Link to={noteUrl(target)}>
                  回看当时 · {displayDate(target.date)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="post-body thought-body">
        <Body components={{ wrapper: Fragment, h1: "h2" }} />
      </div>
      {note.relations.some((rel) => rel.type === "practice") && (
        <p className="thought-caveat">个人实践记录，不代表普遍成立的结论。</p>
      )}
      {note.source && (
        <p className="thought-source">
          <a href={note.source.url} target="_blank" rel="noopener noreferrer">
            查看 X 原帖 ↗
          </a>
          {note.source.archivedAt && (
            <span> · 收录于 {displayDate(note.source.archivedAt)}</span>
          )}
          <br />
          正文保存在本站，查看来源不会影响阅读。
        </p>
      )}
      {next.length > 0 && (
        <div className="thought-followups">
          <p>后来有了回应</p>
          <ul>
            {next.map((item) => (
              <li key={item.id}>
                <Link to={noteUrl(item)}>
                  {displayDate(item.date)} · {item.title}
                </Link>
                <span>
                  {" "}
                  ·{" "}
                  {item.relations
                    .filter((rel) => rel.target === note.id)
                    .map((rel) => relationLabels[rel.type])
                    .join(" / ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
