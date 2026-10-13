import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import type { Plugin } from "vite";

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens");
const timestamp = z.string().datetime({ offset: true });

export const thoughtSchema = z
  .object({
    id: slug,
    date: timestamp,
    title: z.string().trim().min(1).max(120),
    draft: z.boolean().default(false),
  })
  .strict();

export type ThoughtMetadata = {
  id: string;
  date: string;
  title: string;
  draft: boolean;
};

export type ThoughtFile = ThoughtMetadata & {
  file: string;
  content: string;
};

export function thoughtsDirectory() {
  return path.resolve(process.env.THOUGHTS_DIR ?? "thoughts");
}

export function readThoughts(directory = thoughtsDirectory()): ThoughtFile[] {
  const files: string[] = [];
  const scan = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (entry.isFile() && entry.name.endsWith(".md") && file.startsWith(path.resolve(directory) + path.sep)) files.push(file);
    }
  };
  scan(directory);

  const notes = files.sort().map((file) => {
    const parsed = matter(readFileSync(file, "utf8"));
    const result = thoughtSchema.safeParse(parsed.data);
    if (!result.success) {
      throw new Error(`${path.relative(directory, file)}: ${result.error.issues.map((issue) => issue.message).join("; ")}`);
    }
    if (!parsed.content.trim()) {
      throw new Error(`${path.relative(directory, file)}: empty thought body`);
    }
    return {
      ...(result.data as ThoughtMetadata),
      file,
      content: parsed.content.trim(),
    };
  });

  const ids = new Map<string, string>();
  for (const note of notes) {
    const previous = ids.get(note.id);
    if (previous) throw new Error(`Duplicate thought id "${note.id}" in ${previous} and ${path.relative(directory, note.file)}`);
    ids.set(note.id, path.relative(directory, note.file));
  }

  return notes
    .filter((note) => !note.draft)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.id.localeCompare(b.id));
}

/** Markdown bodies use the site MDX pipeline; this module only publishes metadata and file paths. */
export function thoughtsPlugin(): Plugin {
  const virtualId = "\0virtual:thoughts";
  return {
    name: "thoughts",
    resolveId(source) {
      if (source === "virtual:thoughts") return virtualId;
    },
    load(source) {
      if (source !== virtualId) return;
      const notes = readThoughts();
      for (const note of notes) this.addWatchFile(note.file);
      const imports = notes
        .map((note, index) => `import Body${index} from ${JSON.stringify(note.file)};`)
        .join("\n");
      const records = notes
        .map(({ file: _file, content: _content, ...note }, index) => `{...${JSON.stringify(note)}, Body: Body${index}}`)
        .join(",");
      return `${imports}\nexport const thoughts = [${records}];\n`;
    },
    configureServer(server) {
      const directory = thoughtsDirectory();
      server.watcher.add(directory);
      const refresh = (file: string) => {
        if (!file.startsWith(directory + path.sep) || !file.endsWith(".md")) return;
        const module = server.moduleGraph.getModuleById(virtualId);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", refresh).on("change", refresh).on("unlink", refresh);
    },
  };
}
