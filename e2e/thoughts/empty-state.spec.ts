import { expect, test } from "@playwright/test";

test("shows only the empty state when no thoughts are published", async ({ page }) => {
  await page.goto("/thoughts/");
  await expect(page.getByRole("heading", { name: "Thoughts" })).toBeVisible();
  await expect(page.getByText("暂无碎碎念", { exact: true })).toBeVisible();
  await expect(page.getByText("一些尚未定论的想法", { exact: false })).toHaveCount(0);
  await expect(page.getByText("还没有发布的碎碎念", { exact: true })).toHaveCount(0);
});
