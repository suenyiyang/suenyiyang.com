import { test, expect } from "../fixtures";
import { gotoHydrated } from "../helpers/hydration";

/**
 * WebMCP is a Chrome origin-trial API. Instead of depending on a flagged
 * browser, these tests install a spec-shaped `document.modelContext` recorder
 * before any page script runs. That verifies the parts we own: what gets
 * registered, what runs when an agent calls a tool, and that route-scoped tools
 * unregister on navigation.
 */

interface MockTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  execute: (input: Record<string, unknown>, options: unknown) => Promise<unknown>;
}

interface MockState {
  tools: Map<string, MockTool>;
  aborted: string[];
}

declare global {
  interface Window {
    __webmcp?: MockState;
  }
}

const GLOBAL_TOOL_NAMES = [
  "get_site_info",
  "search_content",
  "list_posts",
  "get_post",
  "list_thoughts",
  "get_thought",
  "list_tags",
  "get_current_page",
  "open_page",
];

function installMockModelContext() {
  const state: MockState = { tools: new Map(), aborted: [] };
  window.__webmcp = state;

  const context = {
    async registerTool(tool: MockTool, options?: { signal?: AbortSignal }) {
      state.tools.set(tool.name, tool);
      options?.signal?.addEventListener("abort", () => {
        state.tools.delete(tool.name);
        state.aborted.push(tool.name);
      });
    },
    async getTools() {
      return [...state.tools.values()];
    },
    async executeTool(tool: MockTool, input?: Record<string, unknown>) {
      return tool.execute(input ?? {}, { signal: new AbortController().signal });
    },
    addEventListener() {},
  };

  Object.defineProperty(document, "modelContext", {
    configurable: true,
    get: () => context,
  });
}

async function registeredTools(page: import("@playwright/test").Page) {
  return page.evaluate(() => [...(window.__webmcp?.tools.keys() ?? [])]);
}

async function callTool(
  page: import("@playwright/test").Page,
  name: string,
  input: Record<string, unknown> = {},
) {
  return page.evaluate(
    async ([toolName, toolInput]) => {
      const tool = window.__webmcp?.tools.get(toolName as string);
      if (!tool) throw new Error(`tool ${toolName} is not registered`);
      return tool.execute(toolInput as Record<string, unknown>, {
        signal: new AbortController().signal,
      });
    },
    [name, input] as const,
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(installMockModelContext);
});

test.describe("WebMCP tools", () => {
  test("registers the global tools plus the posts-page tool", async ({ page }) => {
    await gotoHydrated(page, "/posts");

    const names = await registeredTools(page);
    expect(names).toEqual(expect.arrayContaining(GLOBAL_TOOL_NAMES));
    expect(names).toContain("page_filter_posts_by_tag");

    // Every registration must look like a usable tool to an agent.
    const tools = await page.evaluate(() =>
      [...(window.__webmcp?.tools.values() ?? [])].map((tool) => ({
        name: tool.name,
        description: tool.description,
        schemaType: tool.inputSchema?.type,
      })),
    );
    for (const tool of tools) {
      expect(tool.description.length).toBeGreaterThan(20);
      expect(tool.schemaType).toBe("object");
    }
  });

  test("search_content reads the real content index", async ({ page }) => {
    await gotoHydrated(page, "/posts");

    const result = (await callTool(page, "search_content", {
      query: "agent",
      limit: 5,
    })) as { count: number; results: { path: string; url: string }[] };

    expect(result.count).toBeGreaterThan(0);
    expect(result.results[0]?.path).toMatch(/^\/(posts|thoughts)/);
    expect(result.results[0]?.url).toMatch(/^https:\/\/suenyiyang\.com/);
  });

  test("get_post returns markdown, not rendered HTML", async ({ page }) => {
    await gotoHydrated(page, "/posts");

    const post = (await callTool(page, "get_post", {
      path: "https://suenyiyang.com/posts/review-2025/",
    })) as { found: boolean; content: string; truncated: boolean };

    expect(post.found).toBe(true);
    expect(post.content.length).toBeGreaterThan(500);
    expect(post.content).toContain("## ");
    expect(post.content).not.toContain("<div");
    expect(post.truncated).toBe(false);
  });

  test("page_filter_posts_by_tag drives the visible list", async ({ page }) => {
    await gotoHydrated(page, "/posts");

    // Posts do not declare tags today, so the filter row and this tool stay
    // dormant until `tags:` appears in frontmatter. Derive the expectation from
    // the live index so the test keeps working once tags are added.
    const tags = (await callTool(page, "list_tags")) as { tags: string[] };
    const target = tags.tags[0];
    const before = await page.locator("main ol li a").count();

    const result = (await callTool(page, "page_filter_posts_by_tag", {
      tag: target ?? "AI",
    })) as { filter?: string; matchingPosts?: number; error?: string };

    if (!target) {
      expect(result.error).toBe("unknown_tag");
      expect(await page.locator("main ol li a").count()).toBe(before);
      return;
    }

    expect(result.filter).toBe(target);
    expect(result.matchingPosts).toBeGreaterThan(0);
    await expect
      .poll(async () => page.locator("main ol li a").count())
      .toBe(result.matchingPosts);
  });

  test("open_page navigates the SPA and unregisters page tools", async ({ page }) => {
    await gotoHydrated(page, "/posts");

    const result = (await callTool(page, "open_page", {
      path: "/thoughts",
    })) as { navigated: boolean; path: string };

    expect(result).toEqual({ navigated: true, path: "/thoughts" });
    await expect(page).toHaveURL("/thoughts");
    await expect
      .poll(async () => page.evaluate(() => window.__webmcp?.aborted ?? []))
      .toContain("page_filter_posts_by_tag");
    expect(await registeredTools(page)).not.toContain("page_filter_posts_by_tag");
  });

  test("open_page refuses external URLs", async ({ page }) => {
    await gotoHydrated(page, "/");

    const result = (await callTool(page, "open_page", {
      path: "https://example.com/phish",
    })) as { error?: string };

    expect(result.error).toBe("external_url");
    await expect(page).toHaveURL("/");
  });

  test("get_current_page describes the article being read", async ({ page }) => {
    await gotoHydrated(page, "/posts/review-2025");

    const context = (await callTool(page, "get_current_page")) as {
      path: string;
      title: string;
      headings: { text: string }[];
    };

    expect(context.path).toBe("/posts/review-2025");
    expect(context.title).toContain("2025");
    expect(context.headings.length).toBeGreaterThan(0);
  });
});
