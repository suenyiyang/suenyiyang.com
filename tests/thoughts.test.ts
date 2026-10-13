import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  readThoughts,
  thoughtSchema,
  validateThoughts,
  type ThoughtFile,
} from "../config/thoughts";

const root: ThoughtFile = {
  id: "root",
  date: "2024-01-01T12:00:00+08:00",
  title: "Root",
  thread: "question",
  kind: "question",
  tags: [],
  draft: false,
  featured: false,
  relations: [],
  file: "root.md",
  content: "Body",
};
const reply: ThoughtFile = {
  ...root,
  id: "reply",
  date: "2026-01-01T12:00:00+08:00",
  relations: [{ type: "response", target: "root" }],
};
test("valid reply, branching, multiple targets and standalone", () => {
  validateThoughts([
    root,
    reply,
    {
      ...reply,
      id: "branch",
      date: "2026-02-01T12:00:00+08:00",
      relations: [
        { type: "revision", target: "reply" },
        { type: "expansion", target: "root" },
      ],
    },
    { ...root, id: "standalone", thread: undefined },
  ]);
});
for (const [name, notes, message] of [
  ["duplicate id", [root, root], /Duplicate/],
  [
    "missing target",
    [root, { ...reply, relations: [{ type: "response", target: "missing" }] }],
    /unknown/,
  ],
  [
    "self reference",
    [{ ...root, relations: [{ type: "response", target: "root" }] }],
    /earlier/,
  ],
  [
    "future target",
    [root, { ...reply, date: "2023-01-01T12:00:00Z" }],
    /earlier/,
  ],
  [
    "same instant",
    [root, { ...reply, date: "2024-01-01T04:00:00Z" }],
    /earlier/,
  ],
  ["cross thread", [root, { ...reply, thread: "other" }], /same thread/],
  ["draft target", [{ ...root, draft: true }, reply], /draft/],
  [
    "duplicate target",
    [
      root,
      {
        ...reply,
        relations: [
          { type: "response", target: "root" },
          { type: "revision", target: "root" },
        ],
      },
    ],
    /repeated/,
  ],
  ["multiple roots", [root, { ...root, id: "second" }], /exactly one root/],
  [
    "thread title on reply",
    [root, { ...reply, threadTitle: "Rename" }],
    /only a thread root/,
  ],
] satisfies [string, ThoughtFile[], RegExp][])
  test(name, () => assert.throws(() => validateThoughts([...notes]), message));
test("strict schema catches misspellings, date format, malformed source and identifiers", () => {
  for (const data of [
    { ...root, id: "Bad ID" },
    { ...root, date: "2024-01-01" },
    { ...root, date: new Date() },
    { ...root, relation: [] },
    { ...root, source: { platform: "x", url: "https://example.com/post" } },
  ]) {
    const { file: _file, content: _content, ...metadata } = data;
    assert.equal(thoughtSchema.safeParse(metadata).success, false);
  }
});
test("recursive markdown, ordering, draft omission and invalid files", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "thoughts-test-"));
  try {
    mkdirSync(path.join(dir, "2024"));
    writeFileSync(
      path.join(dir, "2024", "root.md"),
      '---\nid: root\ndate: "2024-01-01T12:00:00+08:00"\ntitle: Root\n---\nFirst paragraph.'
    );
    writeFileSync(
      path.join(dir, "draft.md"),
      '---\nid: draft\ndate: "2026-01-01T12:00:00+08:00"\ntitle: Draft\ndraft: true\n---\nNever bundled.'
    );
    assert.deepEqual(
      readThoughts(dir).map((note) => note.id),
      ["root"]
    );
    writeFileSync(
      path.join(dir, "bad.md"),
      '---\nid: empty\ndate: "2026-01-01T12:00:00+08:00"\ntitle: Empty\n---\n'
    );
    assert.throws(() => readThoughts(dir), /empty thought body/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
