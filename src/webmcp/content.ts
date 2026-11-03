/**
 * Pure tool logic. No DOM, no Vite virtual modules, no React — everything here
 * is a function of the content index so it can be unit tested in plain Node.
 */
import type { ContentKind, ContentRecord } from "./types";

/** Per-result cap. Agents have token budgets; long posts get truncated loudly. */
export const MAX_RESULT_CHARS = 8000;

const MAX_SEARCH_RESULTS = 20;
const MAX_LIST_RESULTS = 50;
const SNIPPET_BEFORE = 60;
const SNIPPET_AFTER = 100;

export type SearchKind = ContentKind | "all";

export interface SearchHit {
  kind: ContentKind;
  title: string;
  path: string;
  url: string;
  date?: string;
  description?: string;
  snippet: string;
  score: number;
}

export interface SearchResult {
  query: string;
  count: number;
  results: SearchHit[];
}

export interface PostSummary {
  title: string;
  path: string;
  url: string;
  date?: string;
  description?: string;
  tags: string[];
}

export function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function clamp(value: number | undefined, fallback: number, max: number): number {
  if (value === undefined) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}

/** Site-relative pathname from any of `/posts/x`, `posts/x/`, or a full URL. */
export function normalizePath(input: string): string {
  let value = input.trim();
  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname;
    } catch {
      // Not a parseable URL; fall through and treat it as a path.
    }
  }
  value = value.split("#")[0].split("?")[0];
  if (!value.startsWith("/")) value = `/${value}`;
  return value.replace(/\/+$/, "") || "/";
}

export function truncate(
  text: string,
  max = MAX_RESULT_CHARS,
): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: `${text.slice(0, max).trimEnd()}…`, truncated: true };
}

function normalizeKind(value: string): SearchKind {
  return value === "post" || value === "page" || value === "thought"
    ? value
    : "all";
}

function snippetFor(record: ContentRecord, terms: string[]): string {
  const text = record.content.replace(/\s+/g, " ").trim();
  const lower = text.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const index = lower.indexOf(term);
    if (index !== -1 && (at === -1 || index < at)) at = index;
  }
  if (at === -1) {
    return truncate(record.description || text, SNIPPET_BEFORE + SNIPPET_AFTER)
      .text;
  }
  const start = Math.max(0, at - SNIPPET_BEFORE);
  const end = Math.min(text.length, at + SNIPPET_AFTER);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/**
 * Keyword search over title / tags / description / body. Multi-word queries are
 * AND-ed; CJK works as plain substring matching, no tokenizer needed.
 */
export function searchContent(
  records: ContentRecord[],
  input: { query: string; kind?: string; limit?: number },
): SearchResult {
  const query = input.query.trim();
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { query, count: 0, results: [] };

  const kind = normalizeKind(input.kind ?? "all");
  const limit = clamp(input.limit, 8, MAX_SEARCH_RESULTS);

  const hits: SearchHit[] = [];
  for (const record of records) {
    if (kind !== "all" && record.kind !== kind) continue;

    const title = record.title.toLowerCase();
    const description = (record.description ?? "").toLowerCase();
    const tags = record.tags.join(" ").toLowerCase();
    const body = record.content.toLowerCase();

    let score = 0;
    let matchesAll = true;
    for (const term of terms) {
      let termScore = 0;
      if (title.includes(term)) termScore += 6;
      if (tags.includes(term)) termScore += 3;
      if (description.includes(term)) termScore += 2;
      if (body.includes(term)) termScore += 1;
      if (termScore === 0) {
        matchesAll = false;
        break;
      }
      score += termScore;
    }
    if (!matchesAll) continue;

    hits.push({
      kind: record.kind,
      title: record.title,
      path: record.path,
      url: record.url,
      date: record.date,
      description: record.description,
      snippet: snippetFor(record, terms),
      score,
    });
  }

  hits.sort(
    (a, b) => b.score - a.score || (b.date ?? "").localeCompare(a.date ?? ""),
  );

  return { query, count: hits.length, results: hits.slice(0, limit) };
}

function toSummary(record: ContentRecord): PostSummary {
  return {
    title: record.title,
    path: record.path,
    url: record.url,
    date: record.date,
    description: record.description,
    tags: record.tags,
  };
}

export function listPosts(
  records: ContentRecord[],
  input: { tag?: string; year?: string | number; limit?: number } = {},
): { count: number; posts: PostSummary[] } {
  const tag = readString(input.tag).toLowerCase();
  const year = readString(input.year);
  const limit = clamp(readNumber(input.limit), 20, MAX_LIST_RESULTS);

  const posts = records
    .filter((record) => record.kind === "post")
    .filter(
      (record) => !tag || record.tags.some((item) => item.toLowerCase() === tag),
    )
    .filter((record) => !year || (record.date ?? "").startsWith(year))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return { count: posts.length, posts: posts.slice(0, limit).map(toSummary) };
}

export type GetContentResult =
  | {
      found: true;
      title: string;
      path: string;
      url: string;
      date?: string;
      description?: string;
      tags: string[];
      content: string;
      truncated: boolean;
    }
  | {
      found: false;
      error: "not_found";
      requested: string;
      hint: string;
      available: string[];
    };

/** Full markdown body for a post or a standalone page (`/about`, `/links`…). */
export function getPost(
  records: ContentRecord[],
  input: { path: string },
): GetContentResult {
  const requested = normalizePath(input.path);
  const record = records.find(
    (item) => item.kind !== "thought" && normalizePath(item.path) === requested,
  );

  if (!record) {
    return {
      found: false,
      error: "not_found",
      requested,
      hint: "Use search_content or list_posts to find a valid path.",
      available: records
        .filter((item) => item.kind !== "thought")
        .map((item) => item.path)
        .slice(0, MAX_LIST_RESULTS),
    };
  }

  const body = truncate(record.content);
  return {
    found: true,
    title: record.title,
    path: record.path,
    url: record.url,
    date: record.date,
    description: record.description,
    tags: record.tags,
    content: body.text,
    truncated: body.truncated,
  };
}

export function listThoughts(
  records: ContentRecord[],
  input: { since?: string; limit?: number } = {},
): {
  count: number;
  thoughts: {
    id: string;
    title: string;
    date?: string;
    url: string;
    content: string;
    truncated: boolean;
  }[];
} {
  const since = readString(input.since);
  const limit = clamp(readNumber(input.limit), 20, MAX_LIST_RESULTS);

  const thoughts = records
    .filter((record) => record.kind === "thought")
    .filter((record) => !since || (record.date ?? "") >= since)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return {
    count: thoughts.length,
    thoughts: thoughts.slice(0, limit).map((record) => {
      const body = truncate(record.content, 2000);
      return {
        id: record.id,
        title: record.title,
        date: record.date,
        url: record.url,
        content: body.text,
        truncated: body.truncated,
      };
    }),
  };
}

export function getThought(
  records: ContentRecord[],
  input: { id: string },
):
  | {
      found: true;
      id: string;
      title: string;
      date?: string;
      url: string;
      content: string;
      truncated: boolean;
    }
  | { found: false; error: "not_found"; requested: string; available: string[] } {
  const id = readString(input.id).replace(/^#/, "");
  const record = records.find(
    (item) => item.kind === "thought" && item.id === id,
  );

  if (!record) {
    return {
      found: false,
      error: "not_found",
      requested: id,
      available: records
        .filter((item) => item.kind === "thought")
        .map((item) => item.id)
        .slice(0, MAX_LIST_RESULTS),
    };
  }

  const body = truncate(record.content);
  return {
    found: true,
    id: record.id,
    title: record.title,
    date: record.date,
    url: record.url,
    content: body.text,
    truncated: body.truncated,
  };
}

/** Distinct tags across posts, alphabetical, for tag-filter discovery. */
export function listTags(records: ContentRecord[]): string[] {
  const tags = new Set<string>();
  for (const record of records) {
    if (record.kind !== "post") continue;
    for (const tag of record.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}
