import { expect, test } from "@playwright/test";
import { gotoHydrated } from "../helpers/hydration";

test("flattens thoughts with h1 anchors and a h1-only directory", async ({ page }) => {
  await gotoHydrated(page, "/thoughts");
  await expect(page.locator(".thought-entry")).toHaveCount(2);
  await expect(page.getByText("UNPUBLISHED_SECRET_FIXTURE")).toHaveCount(0);

  const directory = page.getByRole("navigation", { name: "目录" });
  await expect(directory.getByRole("link")).toHaveText(["一条很长的想法", "一条短想法"]);
  await expect(directory.getByRole("link", { name: "正文里的一级标记" })).toHaveCount(0);

  const longTitle = page.locator("#long-note > header h1");
  await expect(longTitle).toHaveText("一条很长的想法");
  await expect(page.locator("#long-note .post-body h2").first()).toHaveText("正文里的一级标记");
  await expect(page.locator("#long-note .post-body h3")).toHaveText("更小的标题");

  await directory.getByRole("link", { name: "一条短想法" }).click();
  await expect(page).toHaveURL(/#short-note$/);
  await expect(page.locator("#short-note")).toBeInViewport();
});

test("collapses long thoughts and expands the hash target", async ({ page }) => {
  await gotoHydrated(page, "/thoughts");
  const toggle = page.getByRole("button", { name: "展开" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#short-note button")).toHaveCount(0);

  await page.goto("/thoughts#long-note");
  await expect(page.getByRole("button", { name: "收起" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#long-note")).toBeInViewport();
});

test("keeps the flattened content without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/thoughts/");
  await expect(page.locator(".thought-entry > header h1")).toHaveCount(2);
  await expect(page.locator("#long-note")).toBeVisible();
  await context.close();
});
