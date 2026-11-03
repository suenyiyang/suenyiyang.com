import { test, expect } from "../fixtures";
import { gotoHydrated } from "../helpers/hydration";

/**
 * No mock here: Playwright's Chromium ships no WebMCP, so this exercises the
 * real fallback path — idle-time dynamic import of the polyfill chunk, tool
 * registration on `document.modelContext`, and execution through the same API
 * an agent would use.
 */
test.describe("WebMCP polyfill", () => {
  test("installs document.modelContext and serves the real content index", async ({
    page,
  }) => {
    await gotoHydrated(page, "/posts");

    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Boolean((document as unknown as { modelContext?: unknown }).modelContext),
          ),
        { timeout: 15_000 },
      )
      .toBe(true);

    const tools = await page.evaluate(async () => {
      const context = (
        document as unknown as {
          modelContext: { getTools: () => Promise<{ name: string }[]> };
        }
      ).modelContext;
      return (await context.getTools()).map((tool) => tool.name);
    });

    expect(tools).toEqual(expect.arrayContaining(["search_content", "get_post"]));
    expect(tools).toContain("page_filter_posts_by_tag");

    const output = await page.evaluate(async () => {
      const context = (
        document as unknown as {
          modelContext: {
            getTools: () => Promise<
              { name: string }[]
            >;
            executeTool: (tool: unknown, input: object) => Promise<unknown>;
          };
        }
      ).modelContext;
      const tool = (await context.getTools()).find(
        (candidate) => candidate.name === "search_content",
      );
      return context.executeTool(tool, { query: "agent", limit: 3 });
    });

    // The spec serialises tool output for the agent; either a JSON string or an
    // object is valid, so normalise before asserting on the payload.
    const payload =
      typeof output === "string" ? output : JSON.stringify(output ?? "");
    expect(payload).toContain("results");
  });
});
