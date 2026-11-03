import assert from "node:assert/strict";
import test from "node:test";
import {
  getPost,
  getThought,
  listPosts,
  listTags,
  listThoughts,
  normalizePath,
  searchContent,
  truncate,
} from "../src/webmcp/content";
import {
  createGlobalTools,
  createPostsPageTools,
  type SiteInfo,
} from "../src/webmcp/definitions";
import type { ContentRecord, WebMcpTool } from "../src/webmcp/types";

const records: ContentRecord[] = [
  {
    kind: "post",
    id: "/posts/review-2025",
    title: "2025 年终总结",
    date: "2025-12-31",
    description: "回顾 AI 行业快速发展的奇幻一年",
    tags: ["年度总结", "AI"],
    path: "/posts/review-2025",
    url: "https://suenyiyang.com/posts/review-2025",
    content: "2023 年 6 月大学毕业。有了 AI，熟悉任何技术的成本都变低了。",
  },
  {
    kind: "post",
    id: "/posts/my-setup-for-using-agents",
    title: "My setup for using agents",
    date: "2026-03-01",
    description: "Tools I use to run coding agents",
    tags: ["AI", "Tooling"],
    path: "/posts/my-setup-for-using-agents",
    url: "https://suenyiyang.com/posts/my-setup-for-using-agents",
    content: "Claude Code, Codex and MCP servers.",
  },
  {
    kind: "page",
    id: "/about",
    title: "关于",
    tags: [],
    path: "/about",
    url: "https://suenyiyang.com/about",
    content: "I build things with AI agents.",
  },
  {
    kind: "thought",
    id: "draft-idea",
    title: "一个想法",
    date: "2026-01-02",
    tags: [],
    path: "/thoughts#draft-idea",
    url: "https://suenyiyang.com/thoughts#draft-idea",
    content: "写下来才算想清楚。",
  },
];

const site: SiteInfo = {
  title: "Yiyang Suen",
  description: "Personal blog",
  url: "https://suenyiyang.com",
  author: "Yiyang Suen",
  socialLinks: [{ label: "GitHub", href: "https://github.com/suenyiyang" }],
  feeds: {
    rss: "https://suenyiyang.com/rss.xml",
    sitemap: "https://suenyiyang.com/sitemap.xml",
  },
};

function buildGlobalTools(overrides: {
  navigate?: (path: string) => void;
  setActiveTag?: (tag: string | null) => void;
} = {}): WebMcpTool[] {
  return createGlobalTools({
    loadIndex: async () => records,
    navigate: overrides.navigate ?? (() => {}),
    getPageContext: () => null,
    site,
  });
}

async function run(
  tools: WebMcpTool[],
  name: string,
  input: Record<string, unknown> = {},
): Promise<unknown> {
  const tool = tools.find((candidate) => candidate.name === name);
  assert.ok(tool, `tool ${name} is missing`);
  return tool.execute(input, {});
}

test("normalizePath accepts paths, trailing slashes and absolute URLs", () => {
  assert.equal(normalizePath("/posts/review-2025/"), "/posts/review-2025");
  assert.equal(normalizePath("posts/review-2025"), "/posts/review-2025");
  assert.equal(
    normalizePath("https://suenyiyang.com/posts/review-2025?ref=x#top"),
    "/posts/review-2025",
  );
  assert.equal(normalizePath("/"), "/");
});

test("truncate is loud about cutting content", () => {
  assert.deepEqual(truncate("short", 10), { text: "short", truncated: false });
  const cut = truncate("abcdefghij", 4);
  assert.equal(cut.truncated, true);
  assert.equal(cut.text, "abcd…");
});

test("search ranks title matches above body matches", () => {
  const result = searchContent(records, { query: "AI" });
  assert.ok(result.count >= 3);
  // Both posts have the AI tag; the title of the page has no match.
  assert.deepEqual(
    result.results.slice(0, 2).map((hit) => hit.kind),
    ["post", "post"],
  );
  assert.ok(result.results.every((hit) => hit.url.startsWith("https://")));
});

test("search matches Chinese substrings and ANDs multiple words", () => {
  const chinese = searchContent(records, { query: "年终总结" });
  assert.equal(chinese.results[0]?.path, "/posts/review-2025");

  const both = searchContent(records, { query: "agent tooling" });
  assert.equal(both.count, 1);
  assert.equal(both.results[0]?.path, "/posts/my-setup-for-using-agents");

  assert.equal(searchContent(records, { query: "nothing-here" }).count, 0);
  assert.equal(searchContent(records, { query: "   " }).count, 0);
});

test("search honours kind filter and limit", () => {
  const thoughtsOnly = searchContent(records, { query: "想法", kind: "thought" });
  assert.equal(thoughtsOnly.count, 1);

  const limited = searchContent(records, { query: "ai", limit: 1 });
  assert.equal(limited.results.length, 1);
  assert.equal(limited.count, 3);
});

test("listPosts filters by tag and year, newest first", () => {
  const all = listPosts(records);
  assert.equal(all.count, 2);
  assert.equal(all.posts[0]?.date, "2026-03-01");

  const ai = listPosts(records, { tag: "ai" });
  assert.equal(ai.count, 2);

  const byYear = listPosts(records, { year: "2025" });
  assert.equal(byYear.count, 1);
  assert.equal(byYear.posts[0]?.path, "/posts/review-2025");
});

test("getPost resolves a post by URL or path and explains misses", () => {
  const byUrl = getPost(records, {
    path: "https://suenyiyang.com/posts/review-2025/",
  });
  assert.equal(byUrl.found, true);
  if (byUrl.found) {
    assert.equal(byUrl.title, "2025 年终总结");
    assert.equal(byUrl.truncated, false);
    assert.ok(byUrl.content.includes("大学毕业"));
  }

  const missing = getPost(records, { path: "/posts/nope" });
  assert.equal(missing.found, false);
  if (!missing.found) {
    assert.equal(missing.error, "not_found");
    assert.ok(missing.available.includes("/posts/review-2025"));
  }
});

test("thought tools return the feed and single items", () => {
  const list = listThoughts(records);
  assert.equal(list.count, 1);
  assert.equal(list.thoughts[0]?.id, "draft-idea");

  const single = getThought(records, { id: "draft-idea" });
  assert.equal(single.found, true);

  const missing = getThought(records, { id: "nope" });
  assert.equal(missing.found, false);
});

test("listTags is deduped and alphabetical", () => {
  assert.deepEqual(listTags(records), ["AI", "Tooling", "年度总结"]);
});

test("tool schemas stay registrable", () => {
  const tools = [
    ...buildGlobalTools(),
    ...createPostsPageTools({
      loadIndex: async () => records,
      setActiveTag: () => {},
    }),
  ];

  const names = tools.map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length);

  for (const tool of tools) {
    assert.match(tool.name, /^[a-z][a-z0-9_]*$/, `${tool.name} has a bad name`);
    assert.ok(
      tool.description.length >= 20,
      `${tool.name} needs a real description`,
    );

    const schema = tool.inputSchema as {
      type?: string;
      properties?: Record<string, unknown>;
      required?: string[];
    };
    assert.equal(schema.type, "object", `${tool.name} inputSchema must be an object`);
    for (const key of schema.required ?? []) {
      assert.ok(
        schema.properties && key in schema.properties,
        `${tool.name} requires unknown property "${key}"`,
      );
    }
  }

  const readOnlyExceptions = new Set(["open_page", "page_filter_posts_by_tag"]);
  for (const tool of tools) {
    if (readOnlyExceptions.has(tool.name)) continue;
    assert.equal(
      tool.annotations?.readOnlyHint,
      true,
      `${tool.name} must be marked read-only`,
    );
    assert.notEqual(tool.annotations?.consequentialHint, true);
  }
});

test("get_site_info exposes canonical links and feeds", async () => {
  const info = (await run(buildGlobalTools(), "get_site_info")) as {
    url: string;
    feeds: { rss: string };
    guides: { posts: string };
  };
  assert.equal(info.url, "https://suenyiyang.com");
  assert.equal(info.feeds.rss, "https://suenyiyang.com/rss.xml");
  assert.equal(info.guides.posts, "https://suenyiyang.com/posts");
});

test("open_page only navigates inside the site", async () => {
  const visited: string[] = [];
  const tools = buildGlobalTools({ navigate: (path) => visited.push(path) });

  const external = (await run(tools, "open_page", {
    path: "https://example.com/phish",
  })) as { error?: string };
  assert.equal(external.error, "external_url");
  assert.deepEqual(visited, []);

  const internal = (await run(tools, "open_page", { path: "/posts/" })) as {
    navigated: boolean;
    path: string;
  };
  assert.equal(internal.navigated, true);
  assert.equal(internal.path, "/posts");
  assert.deepEqual(visited, ["/posts"]);
});

test("tools return structured errors instead of throwing", async () => {
  const tools = buildGlobalTools();
  const noQuery = (await run(tools, "search_content", {})) as { error?: string };
  assert.equal(noQuery.error, "invalid_input");

  const noPage = (await run(tools, "get_current_page")) as { error?: string };
  assert.equal(noPage.error, "no_document");
});

test("page filter drives the store and canonicalises tags", async () => {
  const applied: (string | null)[] = [];
  const tools = createPostsPageTools({
    loadIndex: async () => records,
    setActiveTag: (tag) => applied.push(tag),
  });

  const ok = (await run(tools, "page_filter_posts_by_tag", { tag: "tooling" })) as {
    filter: string;
    matchingPosts: number;
  };
  assert.equal(ok.filter, "Tooling");
  assert.equal(ok.matchingPosts, 1);

  const unknown = (await run(tools, "page_filter_posts_by_tag", {
    tag: "nope",
  })) as { error?: string; available?: string[] };
  assert.equal(unknown.error, "unknown_tag");
  assert.ok(unknown.available?.includes("Tooling"));

  await run(tools, "page_filter_posts_by_tag", {});
  assert.deepEqual(applied, ["Tooling", null]);
});
