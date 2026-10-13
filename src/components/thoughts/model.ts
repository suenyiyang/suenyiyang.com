import { thoughts } from "virtual:thoughts";
import type { Thought, ThoughtThread } from "~/types/thought";

export const relationLabels = {
  response: "回应",
  expansion: "补充",
  revision: "修正",
  practice: "个人验证",
};
export const notesById = new Map(thoughts.map((note) => [note.id, note]));
export const threads: ThoughtThread[] = [];
for (const note of thoughts) {
  const id = note.thread ?? note.id;
  let thread = threads.find((item) => item.id === id);
  if (!thread) {
    thread = {
      id,
      title: note.threadTitle ?? note.title,
      root: note,
      notes: [],
      featured: false,
    };
    threads.push(thread);
  }
  thread.notes.push(note);
  thread.featured ||= note.featured;
}
export const threadFor = (note: Thought) =>
  threads.find((thread) => thread.id === (note.thread ?? note.id))!;
export const followups = (note: Thought) =>
  thoughts.filter((item) =>
    item.relations.some((rel) => rel.target === note.id)
  );
export const noteUrl = (note: Thought) =>
  `/thoughts/${note.thread ?? note.id}#${note.id}`;
export const stateLabel = (thread: ThoughtThread) =>
  thread.notes.length > 1
    ? "已有后续"
    : thread.root.kind === "question"
    ? "尚无回答"
    : "独立想法";
export const displayDate = (date: string) => date.slice(0, 10);
