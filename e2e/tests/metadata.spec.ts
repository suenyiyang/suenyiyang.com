import { test, expect } from "../fixtures";
import { gotoHydrated } from "../helpers/hydration";

const POST = "/posts/understand-your-agents-better";

/**
 * What link unfurlers (Feishu, X, Slack, iMessage) read. They don't run JS,
 * so the tags have to survive into the prerendered HTML — `pnpm build` writes
 * one file per route, check `build/client/<route>/index.html`.
 */
test.describe("Link preview metadata", () => {
  test("a post exposes canonical, Open Graph and Twitter tags", async ({
    page,
  }) => {
    await gotoHydrated(page, POST);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://suenyiyang.com/posts/understand-your-agents-better/"
    );

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "article"
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      "https://suenyiyang.com/posts/understand-your-agents-better/"
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      / - Yiyang Suen$/
    );
    await expect(page.locator('meta[property="og:description"]')).not.toHaveAttribute(
      "content",
      ""
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      "https://suenyiyang.com/og.png"
    );
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      "content",
      "1200"
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image"
    );
  });

  test("the icons and card unfurlers fetch are served at stable paths", async ({
    request,
  }) => {
    const files: Array<[string, string]> = [
      ["/favicon.ico", "image/"],
      ["/favicon.svg", "image/svg+xml"],
      ["/apple-touch-icon.png", "image/png"],
      ["/icon-512.png", "image/png"],
      ["/og.png", "image/png"],
    ];

    for (const [file, contentType] of files) {
      const response = await request.get(file);
      expect(response.status(), file).toBe(200);
      expect(response.headers()["content-type"], file).toContain(contentType);
    }
  });
});
