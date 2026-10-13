import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { Plugin } from "vite";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const timestamp = z.string().datetime({ offset: true });
export const thoughtSchema = z
  .object({
    id: slug,
    date: timestamp,
    title: z.string().min(1).max(120),
    thread: slug.optional(),
    threadTitle: z.string().min(1).max(120).optional(),
    kind: z.enum(["question", "thought"]).default("thought"),
    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    relations: z
      .array(
        z
          .object({
            type: z.enum(["response", "expansion", "revision", "practice"]),
            target: slug,
          })
          .strict()
      )
      .default([]),
    source: z
      .object({
        platform: z.literal("x"),
        url: z
          .string()
          .url()
          .refine(
            (value) =>
              /^https:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[A-Za-z0-9_]+\/status\/\d+\/?$/.test(
                value
              ),
            "Expected a public X post URL"
          ),
        archivedAt: timestamp.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

// Explicit output contract: the Node project emits declarations without strictNullChecks,
// which otherwise makes Zod's inferred object fields optional for the strict app project.
export type ThoughtMetadata = {
  id: string;
  date: string;
  title: string;
  thread?: string;
  threadTitle?: string;
  kind: "question" | "thought";
  tags: string[];
  draft: boolean;
  featured: boolean;
  relations: {
    type: "response" | "expansion" | "revision" | "practice";
    target: string;
  }[];
  source?: { platform: "x"; url: string; archivedAt?: string };
};
export type ThoughtFile = ThoughtMetadata & { file: string; content: string };

export function readThoughts(
  directory = path.resolve(process.env.THOUGHTS_DIR ?? "thoughts")
): ThoughtFile[] {
  const files: string[] = [];
  const scan = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (entry.name.endsWith(".md")) files.push(file);
    }
  };
  scan(directory);
  const notes = files.sort().map((file) => {
    const parsed = matter(readFileSync(file, "utf8"));
    const result = thoughtSchema.safeParse(parsed.data);
    if (!result.success) throw new Error(`${file}: ${result.error.message}`);
    if (!parsed.content.trim()) throw new Error(`${file}: empty thought body`);
    return {
      ...(result.data as ThoughtMetadata),
      file,
      content: parsed.content.trim(),
    };
  });
  validateThoughts(notes);
  return notes
    .filter((note) => !note.draft)
    .sort(
      (a, b) =>
        Date.parse(a.date) - Date.parse(b.date) || a.id.localeCompare(b.id)
    );
}

export function validateThoughts(notes: ThoughtFile[]) {
  const ids = new Map<string, ThoughtFile>();
  for (const note of notes) {
    if (ids.has(note.id)) throw new Error(`Duplicate thought ID: ${note.id}`);
    ids.set(note.id, note);
  }
  const roots = new Map<string, ThoughtFile>();
  for (const note of notes) {
    const tid = note.thread ?? note.id;
    if (!note.relations.length) {
      if (roots.has(tid))
        throw new Error(`Thread ${tid} must have exactly one root`);
      roots.set(tid, note);
    }
    const targets = new Set<string>();
    for (const rel of note.relations) {
      const target = ids.get(rel.target);
      if (!target)
        throw new Error(`${note.id}: unknown relation target ${rel.target}`);
      if (targets.has(rel.target))
        throw new Error(`${note.id}: repeated relation target ${rel.target}`);
      targets.add(rel.target);
      if ((target.thread ?? target.id) !== tid)
        throw new Error(
          `${note.id}: relations must stay within the same thread`
        );
      if (Date.parse(target.date) >= Date.parse(note.date))
        throw new Error(
          `${note.id}: relations must point to strictly earlier notes`
        );
      if (!note.draft && target.draft)
        throw new Error(
          `${note.id}: published note points to draft ${target.id}`
        );
    }
    if (note.relations.length && note.threadTitle)
      throw new Error(`${note.id}: only a thread root sets threadTitle`);
  }
  for (const note of notes) {
    const root = roots.get(note.thread ?? note.id);
    if (!root) throw new Error(`${note.id}: missing thread root`);
    if (!note.draft && root.draft)
      throw new Error(`${note.id}: published thread root is a draft`);
  }
}

/** Markdown bodies use the site's existing MDX/remark pipeline; metadata is checked at build time. */
export function thoughtsPlugin(): Plugin {
  const id = "\0virtual:thoughts";
  return {
    name: "thoughts",
    resolveId(source) {
      if (source === "virtual:thoughts") return id;
    },
    load(source) {
      if (source !== id) return;
      const notes = readThoughts();
      for (const note of notes) this.addWatchFile(note.file);
      return (
        notes
          .map(
            (note, index) =>
              `import Body${index} from ${JSON.stringify(note.file)};`
          )
          .join("\n") +
        `\nexport const thoughts = [${notes
          .map(
            ({ file: _file, ...note }, index) =>
              `{...${JSON.stringify(note)}, Body: Body${index}}`
          )
          .join(",")}];`
      );
    },
    configureServer(server) {
      const directory = path.resolve(process.env.THOUGHTS_DIR ?? "thoughts");
      server.watcher.add(directory);
      const refresh = (file: string) => {
        if (!file.startsWith(directory + path.sep) || !file.endsWith(".md"))
          return;
        const module = server.moduleGraph.getModuleById(id);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher
        .on("add", refresh)
        .on("change", refresh)
        .on("unlink", refresh);
    },
  };
}
