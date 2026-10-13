import { test, expect } from "@playwright/test";
import { gotoHydrated } from "../helpers/hydration";

test("stream filtering, featured comparison and draft exclusion", async ({
  page,
}) => {
  await gotoHydrated(page, "/thoughts");
  await expect(page.locator(".thought-stream > li")).toHaveCount(5);
  await expect(page.getByText("不应公开的草稿")).toHaveCount(0);
  await page.getByRole("searchbox").fill("不存在的关键词");
  await expect(
    page.getByText("没有符合条件的记录", { exact: false })
  ).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await page.getByLabel("主题", { exact: true }).selectOption("写作");
  await expect(page.locator(".thought-stream > li")).toHaveCount(3);
  await page.reload();
  await expect(page.locator(".thought-stream > li")).toHaveCount(3);
  await page.locator(".thought-preview h2 a").first().click();
  await page.locator("#revision .thought-relations a").click();
  await expect(page).toHaveURL(/#response$/);
  await page.getByRole("link", { name: "← 返回时间流", exact: true }).click();
  await expect(page.locator(".thought-stream > li")).toHaveCount(3);
  await expect(page.getByLabel("主题", { exact: true })).toHaveValue("写作");
  await page.getByRole("link", { name: "精选对照", exact: true }).click();
  await expect(page.locator(".thought-preview")).toHaveCount(1);
  await page.getByRole("link", { name: "那时与现在 →", exact: true }).click();
  await expect(page.locator(".thought-comparison #question")).toBeVisible();
  await expect(page.locator(".thought-comparison #revision")).toBeVisible();
});

test("thread Markdown, forward links, deep reload and back navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await gotoHydrated(page, "/thoughts/writing#question");
  await expect(page.locator("#question strong")).toHaveText("先写下来");
  await page.locator("#question .thought-followups a").click();
  await expect(page).toHaveURL(/#response$/);
  await expect(page.locator("#response")).toHaveClass(/is-selected/);
  await expect(page.locator("#response .thought-body li")).toHaveCount(2);
  await page.reload();
  await expect(page.locator("#response")).toHaveClass(/is-selected/);
  await page.getByRole("link", { name: "下一条 →", exact: true }).click();
  await expect(page).toHaveURL(/#revision$/);
  await page.goBack();
  await expect(page).toHaveURL(/#response$/);
  await page.getByRole("link", { name: "那时与现在", exact: true }).click();
  await expect(page.locator(".thought-comparison #response")).toBeVisible();
  await expect(page.locator(".thought-comparison #question")).toBeVisible();
  expect(errors).toEqual([]);
});

test("unanswered questions and standalone notes remain valid", async ({
  page,
}) => {
  await gotoHydrated(page, "/thoughts/open-question?view=compare");
  await expect(
    page.getByText("这个问题仍然开着", { exact: false })
  ).toBeVisible();
  await gotoHydrated(page, "/thoughts/standalone");
  await expect(
    page.getByText("独立想法也可以完整地留在这里", { exact: false })
  ).toBeVisible();
});

test("mobile navigation: no overflow, Escape and link closes menu", async ({
  page,
}) => {
  for (const width of [320, 375, 390, 640, 768]) {
    await page.setViewportSize({ width, height: 850 });
    await gotoHydrated(page, "/thoughts");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    const toggle = page.getByRole("button", { name: "Navigation menu" });
    if (width < 640) {
      await expect(toggle).toBeVisible();
      await expect(
        page.getByRole("navigation", { name: "Main navigation" })
      ).toBeHidden();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(toggle).toBeFocused();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await toggle.click();
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Posts", exact: true })
        .click();
      await expect(page).toHaveURL(/\/posts\/?$/);
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    } else {
      await expect(toggle).toBeHidden();
      await expect(
        page.getByRole("navigation", { name: "Main navigation" })
      ).toBeVisible();
    }
  }
});

test("comparison and timeline fit mobile in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 });
  for (const theme of ["light", "dark"]) {
    for (const suffix of ["#revision", "?view=compare#response"]) {
      await gotoHydrated(page, "/thoughts/writing" + suffix);
      await page
        .getByRole("radio", {
          name: theme === "dark" ? "Dark theme" : "Light theme",
        })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    }
  }
});

test("prerendered timeline exists without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/thoughts/writing");
  await expect(page.locator(".thought-timeline > li")).toHaveCount(3);
  await expect(page.locator("#question strong")).toBeVisible();
  await context.close();
});
