import { test, expect } from "../fixtures";
import { gotoHydrated } from "../helpers/hydration";

test.describe("Reading type", () => {
  test("body copy and heading weights", async ({ page }) => {
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    // The reading surface is deliberately heavier than the 400/600 defaults.
    await expect(page.locator(".post-body p").first()).toHaveCSS(
      "font-weight",
      "500"
    );
    await expect(page.locator(".post-title").first()).toHaveCSS(
      "font-weight",
      "650"
    );
  });

  test("article summary renders in LXGW WenKai", async ({ page }) => {
    await gotoHydrated(page, "/posts/understand-your-agents-better");

    // Summaries step aside into the kai (楷体) face.
    const summary = page.locator(".post-summary").first();
    await expect(summary).toBeVisible();
    await expect(summary).toHaveCSS("font-family", /LXGW WenKai/);
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
