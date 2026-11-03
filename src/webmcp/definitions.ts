/**
 * WebMCP tool definitions: JSON Schema + natural-language descriptions.
 * Dependencies are injected so the same definitions run in the browser and in
 * unit tests (with a fake index / navigator).
 */
import {
  getPost,
  getThought,
  listPosts,
  listTags,
  listThoughts,
  readNumber,
  readString,
  searchContent,
} from "./content";
import type { ContentRecord, PageContext, WebMcpTool } from "./types";
import { withoutTrailingSlash } from "../utils/trailingSlash";

export interface SiteInfo {
  title: string;
  description: string;
  url: string;
  author: string;
  socialLinks: { label: string; href: string }[];
  feeds: { rss: string; sitemap: string };
}

export interface ToolDeps {
  /** Lazily imports the build-time content index so it stays out of the page bundle. */
  loadIndex: () => Promise<ContentRecord[]>;
  /** SPA navigation; falls back to a full page load when the router is not mounted. */
  navigate: (path: string) => void;
  getPageContext: () => PageContext | null;
  site: SiteInfo;
}

export interface PostsPageDeps {
  loadIndex: () => Promise<ContentRecord[]>;
  setActiveTag: (tag: string | null) => void;
}

const READ_ONLY = { readOnlyHint: true } as const;

function asArgs(input: Record<string, unknown> | undefined): Record<string, unknown> {
  return input ?? {};
}

function invalidInput(message: string) {
  return { error: "invalid_input", message };
}

export function createGlobalTools(deps: ToolDeps): WebMcpTool[] {
  return [
    {
      name: "get_site_info",
      title: "Get site info",
      description:
        "Describe this website: who writes it, what it covers, its canonical URL, social profiles and feed endpoints. Call this first when you need context about the site rather than its content.",
      inputSchema: { type: "object", properties: {} },
      annotations: READ_ONLY,
      execute: async () => ({
        title: deps.site.title,
        description: deps.site.description,
        url: deps.site.url,
        author: deps.site.author,
        languages: ["zh-CN", "en"],
        topics: [
          "frontend engineering",
          "AI agents and LLM tooling",
          "design and typography",
          "personal notes and yearly reviews",
        ],
        socialLinks: deps.site.socialLinks,
        feeds: deps.site.feeds,
        guides: {
          about: `${deps.site.url}/about`,
          posts: `${deps.site.url}/posts`,
          thoughts: `${deps.site.url}/thoughts`,
        },
      }),
    },
    {
      name: "search_content",
      title: "Search posts, pages and thoughts",
      description:
        "Search every post, standalone page and thought on this blog by keyword. Matches titles, tags, descriptions and body text; multiple words are AND-ed and Chinese works as plain substring matching. Returns ranked results with a canonical URL and a snippet — use it before get_post.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Keywords to look for. Examples: 'agent', 'Claude Code', '年终总结'.",
          },
          kind: {
            type: "string",
            enum: ["all", "post", "page", "thought"],
            description:
              "Restrict to long-form posts, standalone pages, or short thoughts. Defaults to all.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            description: "Maximum number of results. Defaults to 8.",
          },
        },
        required: ["query"],
      },
      annotations: READ_ONLY,
      execute: async (rawInput) => {
        const input = asArgs(rawInput);
        const query = readString(input.query);
        if (!query) return invalidInput("`query` is required.");
        const index = await deps.loadIndex();
        return searchContent(index, {
          query,
          kind: readString(input.kind) || undefined,
          limit: readNumber(input.limit),
        });
      },
    },
    {
      name: "list_posts",
      title: "List posts",
      description:
        "List long-form posts, newest first, with their canonical URLs, dates, descriptions and tags. Filter by tag or year when the user asks for a topic or a time range.",
      inputSchema: {
        type: "object",
        properties: {
          tag: {
            type: "string",
            description: "Exact tag to filter by, case-insensitive (e.g. 'AI').",
          },
          year: {
            type: "string",
            description: "Four-digit year such as '2026'.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            description: "Maximum number of posts. Defaults to 20.",
          },
        },
      },
      annotations: READ_ONLY,
      execute: async (rawInput) => {
        const input = asArgs(rawInput);
        const index = await deps.loadIndex();
        return listPosts(index, {
          tag: readString(input.tag) || undefined,
          year: readString(input.year) || undefined,
          limit: readNumber(input.limit),
        });
      },
    },
    {
      name: "get_post",
      title: "Get post markdown",
      description:
        "Return the full markdown body of a post or standalone page, plus its metadata and canonical URL. Prefer this over scraping the rendered HTML: the markdown keeps code blocks and image paths intact. Use a path from search_content or list_posts.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Site path or absolute URL, e.g. '/posts/review-2025' or 'https://suenyiyang.com/posts/review-2025'.",
          },
        },
        required: ["path"],
      },
      annotations: READ_ONLY,
      execute: async (rawInput) => {
        const input = asArgs(rawInput);
        const path = readString(input.path);
        if (!path) return invalidInput("`path` is required.");
        const index = await deps.loadIndex();
        return getPost(index, { path });
      },
    },
    {
      name: "list_thoughts",
      title: "List thoughts",
      description:
        "List short, dated thoughts (the /thoughts feed), newest first, including their full text. Use this for recent opinions and quick notes that are not full posts.",
      inputSchema: {
        type: "object",
        properties: {
          since: {
            type: "string",
            description: "Only thoughts on or after this date, 'YYYY-MM-DD'.",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            description: "Maximum number of thoughts. Defaults to 20.",
          },
        },
      },
      annotations: READ_ONLY,
      execute: async (rawInput) => {
        const input = asArgs(rawInput);
        const index = await deps.loadIndex();
        return listThoughts(index, {
          since: readString(input.since) || undefined,
          limit: readNumber(input.limit),
        });
      },
    },
    {
      name: "get_thought",
      title: "Get one thought",
      description:
        "Return a single thought by id (the `id` field from list_thoughts).",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Thought id, e.g. 'hello-agents'.",
          },
        },
        required: ["id"],
      },
      annotations: READ_ONLY,
      execute: async (rawInput) => {
        const input = asArgs(rawInput);
        const id = readString(input.id);
        if (!id) return invalidInput("`id` is required.");
        const index = await deps.loadIndex();
        return getThought(index, { id });
      },
    },
    {
      name: "list_tags",
      title: "List tags",
      description:
        "List every tag used by the posts, alphabetically. Useful before filtering with list_posts or the on-page tag filter.",
      inputSchema: { type: "object", properties: {} },
      annotations: READ_ONLY,
      execute: async () => {
        const index = await deps.loadIndex();
        return { tags: listTags(index) };
      },
    },
    {
      name: "get_current_page",
      title: "Get current page context",
      description:
        "Describe the page the user is currently looking at: path, title, headings, excerpt and length. Use this to answer 'what am I reading?' or to decide which section to jump to.",
      inputSchema: { type: "object", properties: {} },
      annotations: READ_ONLY,
      execute: async () => {
        const context = deps.getPageContext();
        if (!context) {
          return { error: "no_document", message: "No page is available." };
        }
        return context;
      },
    },
    {
      name: "open_page",
      title: "Open a page",
      description:
        "Navigate the site to an internal path such as '/posts', '/thoughts' or '/posts/review-2025'. Only same-site paths are accepted. Use this after telling the user where you are taking them.",
      inputSchema: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Site-relative path starting with '/', or a full URL on this site.",
          },
        },
        required: ["path"],
      },
      annotations: { readOnlyHint: false },
      execute: async (rawInput) => {
        const input = asArgs(rawInput);
        const requested = readString(input.path);
        if (!requested) return invalidInput("`path` is required.");

        let path = requested;
        try {
          const url = new URL(requested, deps.site.url);
          if (url.origin !== new URL(deps.site.url).origin) {
            return {
              error: "external_url",
              message: "open_page only navigates within this site.",
              allowedOrigin: deps.site.url,
            };
          }
          path = withoutTrailingSlash(`${url.pathname}${url.hash}`);
        } catch {
          return invalidInput("`path` is not a valid URL or path.");
        }

        deps.navigate(path);
        return { navigated: true, path };
      },
    },
  ];
}

export function createPostsPageTools(deps: PostsPageDeps): WebMcpTool[] {
  return [
    {
      name: "page_filter_posts_by_tag",
      title: "Filter posts by tag",
      description:
        "Apply the tag filter on the posts page, exactly like clicking a tag chip. Pass null or an empty string to clear the filter. Use list_tags first to discover valid tags.",
      inputSchema: {
        type: "object",
        properties: {
          tag: {
            type: "string",
            description: "Tag to filter by. Omit or pass an empty string to show all posts.",
          },
        },
      },
      annotations: { readOnlyHint: false },
      execute: async (rawInput) => {
        const input = asArgs(rawInput);
        const requested = readString(input.tag);
        const index = await deps.loadIndex();

        if (!requested) {
          deps.setActiveTag(null);
          return { filter: null, matchingPosts: listPosts(index).count };
        }

        const tag = listTags(index).find(
          (candidate) => candidate.toLowerCase() === requested.toLowerCase(),
        );
        if (!tag) {
          return {
            error: "unknown_tag",
            requested,
            available: listTags(index),
          };
        }

        deps.setActiveTag(tag);
        return { filter: tag, matchingPosts: listPosts(index, { tag }).count };
      },
    },
  ];
}
