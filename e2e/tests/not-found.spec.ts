import { expect, test } from "@playwright/test";

/**
 * Two paths reach this page and they must look the same:
 * - /404, the prerendered page that Cloudflare serves for unmatched paths
 *   (`not_found_handling = "404-page"`), and
 * - any unknown path in the running app, which React Router turns into a 404
 *   through the root ErrorBoundary.
 */
test.describe("Not found", () => {
  test("prerendered /404 shows the stamp", async ({ page }) => {
    await page.goto("/404");

    await expect(page.locator("h1")).toHaveText("页面不存在");
    await expect(page.locator(".not-found-seal")).toBeVisible();
    await expect(page).toHaveTitle("404 - Yiyang Suen");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  });

  test("unknown path renders the same page through the error boundary", async ({ page }) => {
    await page.goto("/this-path-does-not-exist");

    await expect(page.locator(".not-found-seal")).toBeVisible();
    await expect(page.locator("h1")).toHaveText("页面不存在");
    await expect(page).toHaveTitle("404 - Yiyang Suen");
  });

  test("the stamp is the way home", async ({ page }) => {
    await page.goto("/404");

    await page.getByRole("link", { name: "回到首页" }).click();
    await expect(page).toHaveURL("/");
  });

  test("header still works from the dead end", async ({ page }) => {
    await page.goto("/404");

    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  });
});
