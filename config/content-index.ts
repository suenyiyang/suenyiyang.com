import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { Plugin } from "vite";
import { SITE_URL, routeFromFile, walkMdx } from "./seo-files";
import { readThoughts } from "./thoughts";
import { absolutePageUrl, withoutTrailingSlash } from "../src/utils/trailingSlash";
import type { ContentRecord } from "../src/webmcp/types";

/**
 * Build-time plain-text index for the WebMCP tools.
 *
 * Deliberately separate from `content-collections/generated`: that module
 * carries MDX-compiled components and is already statically imported by the
 * posts routes. This one is only reachable through a dynamic import inside a
 * tool's `execute`, so readers who never talk to an agent download nothing.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagesDir = path.join(root, "pages");

const PUBLIC_ID = "virtual:content-index";
const VIRTUAL_ID = "\0virtual:content-index";

function firstHeading(content: string): string | undefined {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function toDay(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return undefined;
}

function splitTags(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

/** Drop MDX-only syntax so agents get prose, not component scaffolding. */
export function stripMdx(content: string): string {
  return content
    .replace(/^\s*(?:import|export)\s.*$/gm, "")
    .replace(/^\s*<\/?[A-Z][\w.]*(?:\s[^>]*)?\/?>\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildContentIndex(): ContentRecord[] {
  const records: ContentRecord[] = [];

  for (const file of walkMdx(pagesDir)) {
    const { data, content } = matter(fs.readFileSync(file, "utf8"));
    const pathname = withoutTrailingSlash(routeFromFile(file));
    const isPost = /^\/posts\/[^/]+$/.test(pathname);
    const description =
      typeof data.description === "string" ? data.description.trim() : "";

    records.push({
      kind: isPost ? "post" : "page",
      id: pathname,
      title:
        (typeof data.title === "string" && data.title.trim()) ||
        firstHeading(content) ||
        pathname,
      date: toDay(data.date),
      description: description || undefined,
      tags: splitTags(data.tags),
      path: pathname,
      url: absolutePageUrl(SITE_URL, pathname),
      content: stripMdx(content),
    });
  }

  for (const thought of readThoughts()) {
    records.push({
      kind: "thought",
      id: thought.id,
      title: thought.title,
      date: thought.date.slice(0, 10),
      tags: [],
      path: `/thoughts#${thought.id}`,
      url: `${SITE_URL}/thoughts#${thought.id}`,
      content: thought.content,
    });
  }

  return records;
}

export function contentIndexPlugin(): Plugin {
  return {
    name: "content-index",
    resolveId(source) {
      return source === PUBLIC_ID ? VIRTUAL_ID : null;
    },
    load(id) {
      if (id !== VIRTUAL_ID) return null;

      for (const file of walkMdx(pagesDir)) this.addWatchFile(file);
      for (const thought of readThoughts()) this.addWatchFile(thought.file);

      const json = JSON.stringify(buildContentIndex())
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
      return `export const contentIndex = ${json};`;
    },
    configureServer(server) {
      const invalidate = (file: string) => {
        if (!/\.(md|mdx)$/i.test(file)) return;
        const module = server.moduleGraph.getModuleById(VIRTUAL_ID);
        if (module) server.moduleGraph.invalidateModule(module);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", invalidate).on("change", invalidate).on("unlink", invalidate);
    },
  };
}
