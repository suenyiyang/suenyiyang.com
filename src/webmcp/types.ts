/** Types shared by the build-time content index, the tool handlers and the tests. */

export type ContentKind = "post" | "page" | "thought";

export interface ContentRecord {
  kind: ContentKind;
  /** Stable id: pathname for pages/posts, thought id for thoughts. */
  id: string;
  title: string;
  /** YYYY-MM-DD when known. */
  date?: string;
  description?: string;
  tags: string[];
  /** Site-relative pathname. Thoughts point at `/thoughts#<id>`. */
  path: string;
  /** Absolute URL, handy for citations. */
  url: string;
  /** Raw markdown body. */
  content: string;
}

export interface ToolAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
}

export interface ToolExecuteOptions {
  signal?: AbortSignal;
}

/**
 * Structural mirror of the WebMCP `ModelContextTool` shape. Kept local on
 * purpose: the spec still moves, so the app never depends on a global type
 * augmentation that could disappear in the next Chrome build.
 */
export interface WebMcpTool {
  /** 1-128 chars of ASCII alphanumerics, `_`, `-` or `.`; unique per document. */
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: ToolAnnotations;
  execute: (
    input: Record<string, unknown>,
    options: ToolExecuteOptions,
  ) => Promise<unknown>;
}

export interface PageContext {
  path: string;
  url: string;
  title: string;
  description?: string;
  headings: { level: number; text: string; id?: string }[];
  characters: number;
  excerpt: string;
}
