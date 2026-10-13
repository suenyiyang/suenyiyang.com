import { test, expect } from "@playwright/test";

test.describe("Table of contents", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/posts/understand-your-agents-better");
    await expect(page.locator(".post-toc-desktop .toc-link").first()).toBeVisible();
  });

  test("clears the header and uses WenKai and the accent in both themes", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 700));
    const toc = page.locator(".toc-inner");
    await expect.poll(async () => {
      const top = (await toc.boundingBox())!.y;
      const header = await page.locator("header.sticky").boundingBox();
      return top - (header!.y + header!.height);
    }).toBeGreaterThanOrEqual(15);
    await expect(toc).toHaveCSS("font-family", /LXGW WenKai/);
    const link = page.locator(".post-toc-desktop .toc-link").first();
    await link.click();
    const active = page.locator('.post-toc-desktop [aria-current="location"]');
    await expect(active).toBeVisible();
    for (const dark of [false, true]) {
      await page.evaluate((enabled) => document.documentElement.classList.toggle("dark", enabled), dark);
      await expect(active).toHaveCSS("color", "rgb(2, 122, 255)");
      await expect(active).toHaveCSS("border-left-color", "rgb(2, 122, 255)");
    }
  });

  test("pans only overflowing labels and respects reduced motion", async ({ page }) => {
    // Use a deterministic long label to exercise overflow independently of copy edits.
    const target = page.locator(".post-toc-desktop .toc-link").first();
    await target.locator(".toc-label-text").evaluate((text) => {
      text.textContent = "这是一个很长的目录标题，用来验证悬停时能够慢慢来回滚动并看到完整内容";
    });
    await target.hover();
    await expect(target).toHaveAttribute("data-overflow", "true");
    const text = target.locator(".toc-label-text");
    await expect(text).toHaveCSS("animation-name", "toc-pan");
    await expect(text).toHaveCSS("animation-direction", "alternate");
    await page.mouse.move(1400, 0);
    await expect(text).toHaveCSS("animation-name", "none");
    await target.focus();
    await expect(text).toHaveCSS("animation-name", "toc-pan");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(text).toHaveCSS("animation-name", "none");
    await expect(target.locator(".toc-label")).toHaveCSS("white-space", "normal");
  });
});
