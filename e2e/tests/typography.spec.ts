import { test, expect } from "../fixtures";

test.describe("BackToTop", () => {
  test("hidden until 200px scroll, then visible; click scrolls to top", async ({
    page,
  }) => {
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

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
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

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
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

    const rail = page.locator(".post-toc-desktop");
    await expect(rail).toBeHidden();
  });
});

test.describe("Toc — mobile pill", () => {
  test("renders below 1280px, collapsed by default, toggles open", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/posts/understand-your-agents-better");
    await page.waitForLoadState("networkidle");

    const pill = page.locator(".post-toc-mobile");
    await expect(pill).toBeVisible();

    const list = pill.locator("ul").first();
    await expect(list).toBeHidden();

    await pill.getByRole("button", { name: /contents/i }).click();
    await expect(list).toBeVisible();
  });
});
