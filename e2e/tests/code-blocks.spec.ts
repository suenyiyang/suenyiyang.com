import { test, expect } from "../fixtures";
import { gotoHydrated } from "../helpers/hydration";

const pseudocode = `当「有待处理的用户消息」时循环：
  1. 发送用户消息给 LLM
  2. 获取 LLM 输出
  3. 当「输出有 tool call」时循环：
     a. 执行 tool call，把结果发给 LLM
     b. 获取 LLM 输出，若有新的 tool call，继续循环；若没有，跳出当前循环`;

test.describe("Code block windows", () => {
  test("unknown language labels render as plain text in a themed window", async ({ page }) => {
    await gotoHydrated(page, "/posts/openclaw-deerflow-hermes-agent");

    const window = page.locator(".post-body .code-window");
    await expect(window).toHaveCount(1);
    await expect(window.locator(".code-window__chrome")).toHaveAttribute("aria-hidden", "true");
    await expect(window.locator(".code-window__dot")).toHaveCount(3);
    const pre = window.locator("pre.shiki");
    await expect(pre).toBeVisible();
    // Compare raw text to ensure whitespace and nested-loop indentation survive.
    expect(await pre.locator("code").textContent()).toBe(pseudocode);
    await expect(pre.locator("code")).toHaveCSS("white-space", "pre");
    const lightColor = await pre.evaluate((el) => getComputedStyle(el).color);
    const lightBackground = await window.evaluate((el) => getComputedStyle(el).backgroundColor);

    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect(pre).not.toHaveCSS("color", lightColor);
    await expect(window).not.toHaveCSS("background-color", lightBackground);
    expect(await pre.locator("code").textContent()).toBe(pseudocode);
  });

  test("unlabeled and supported-language blocks share the same window chrome", async ({ page }) => {
    await gotoHydrated(page, "/posts/refactor-blog-with-rr7-ssg");

    const blocks = page.locator(".post-body pre");
    expect(await blocks.count()).toBeGreaterThan(1);
    await expect(page.locator(".post-body pre:not(.shiki)")).toHaveCount(0);
    await expect(page.locator(".post-body .code-window")).toHaveCount(await blocks.count());
    const directoryTree = blocks.filter({ hasText: "├── pages/" });
    await expect(directoryTree).toHaveCount(1);
    await expect(directoryTree.locator("code")).toContainText("└── src/");
    // Supported languages must retain token highlighting, not fall back to text.
    expect(await blocks.first().locator('span[style*="--shiki-light"]').count()).toBeGreaterThan(1);
  });
});
