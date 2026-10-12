import { test, expect } from "../fixtures";
import { gotoHydrated } from "../helpers/hydration";

test.describe("Reading type", () => {
  test("body copy and heading weights", async ({ page }) => {
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    // Use WenKai's real regular/bold faces rather than synthetic weights.
    const body = page.locator(".post-body p").first();
    await expect(body).toHaveCSS("font-family", /^"LXGW WenKai"/);
    await expect(body).toHaveCSS("font-weight", "400");
    await expect(body).toHaveCSS("font-style", "normal");
    await expect(page.locator(".post-title").first()).toHaveCSS(
      "font-weight",
      "700"
    );
  });

  test("article summary is italic, distinct from the regular body", async ({ page }) => {
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    // WenKai is now the body face; summaries step aside with a slant.
    const summary = page.locator(".post-summary").first();
    await expect(summary).toBeVisible();
    await expect(summary).toHaveCSS("font-family", /^"LXGW WenKai"/);
    await expect(summary).toHaveCSS("font-style", "italic");
  });

  test("list excerpts are italic and code retains IBM Plex Mono", async ({ page }) => {
    await gotoHydrated(page, "/posts");
    const excerpt = page.locator(".post-summary").first();
    await expect(excerpt).toBeVisible();
    await expect(excerpt).toHaveCSS("font-style", "italic");

    await gotoHydrated(page, "/posts/understand-your-agents-better");
    await expect(page.locator(".post-body code").first()).toHaveCSS(
      "font-family",
      /^"IBM Plex Mono"/
    );
  });
});

test.describe("BackToTop", () => {
  test("hidden until 200px scroll, then visible; click scrolls to top", async ({
    page,
  }) => {
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    const button = page.getByRole("button", { name: /back to top/i });
    await expect(button).toBeHidden();

    await page.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
    await expect(button).toBeVisible();

    await button.click();
    await page.waitForFunction(() => window.scrollY < 50);
    await expect(button).toBeHidden();
  });
});

test.describe("Toc — desktop rail", () => {
  test("renders at ≥1280px with h2/h3 entries linked by id", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    const rail = page.locator(".post-toc-desktop");
    await expect(rail).toBeVisible();

    const links = rail.locator("a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    const firstHref = await links.first().getAttribute("href");
    expect(firstHref).toMatch(/^#/);
  });

  test("desktop rail hidden below 1280px", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    const rail = page.locator(".post-toc-desktop");
    await expect(rail).toBeHidden();
  });
});

test.describe("Toc — mobile pill", () => {
  test("renders below 1280px, collapsed by default, toggles open", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    const pill = page.locator(".post-toc-mobile");
    await expect(pill).toBeVisible();

    const list = pill.locator("ul").first();
    await expect(list).toBeHidden();

    await pill.getByRole("button", { name: /contents/i }).click();
    await expect(list).toBeVisible();
  });
});
