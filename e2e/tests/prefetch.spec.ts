import type { Page } from "@playwright/test";
import { test, expect } from "../fixtures";
import { gotoHydrated } from "../helpers/hydration";

// React 19 can hoist modulepreload links into <head>. Resolve the actual route
// module from the manifest instead of depending on the link's DOM position.
async function routeModule(page: Page, path: string): Promise<string> {
  return page.evaluate((pathname) => {
    const manifest = (window as unknown as {
      __reactRouterManifest: { routes: Record<string, { path?: string; module: string }> };
    }).__reactRouterManifest;
    const route = Object.values(manifest.routes).find(
      (entry) => entry.path?.replace(/^\/+|\/+$/g, "") === pathname.replace(/^\/+|\/+$/g, ""),
    );
    if (!route) throw new Error(`Route not found: ${pathname}`);
    return route.module;
  }, path);
}

function preload(page: Page, module: string) {
  return page.locator(`link[rel="modulepreload"][href=${JSON.stringify(module)}]`);
}
test.describe("Route prefetching", () => {
  test("navigation preloads the posts route before hover or click", async ({ homePage, page }) => {
    await gotoHydrated(page, "/links");

    const postsLink = page.locator('nav a[href="/posts"]');
    await expect(preload(page, await routeModule(page, "/posts"))).not.toHaveCount(0);
    await expect(page).toHaveURL("/links");

    await homePage.openNavigation();
    await postsLink.click();
    await expect(page.locator("main h1")).toHaveText("文章");
  });

  test("article routes preload only when their cards enter the viewport", async ({ page }) => {
    await gotoHydrated(page, "/posts");

    const cards = page.locator("main ol > li");
    const firstCard = cards.first();
    const lastCard = cards.last();
    const firstHref = await firstCard.locator("a").getAttribute("href");
    const articleLink = lastCard.locator("a");
    const href = await articleLink.getAttribute("href");
    const firstModule = await routeModule(page, firstHref!);
    const lastModule = await routeModule(page, href!);
    await firstCard.scrollIntoViewIfNeeded();
    await expect(preload(page, firstModule)).not.toHaveCount(0);
    await expect(lastCard).not.toBeInViewport();
    await expect(preload(page, lastModule)).toHaveCount(0);

    await lastCard.scrollIntoViewIfNeeded();
    await expect(preload(page, lastModule)).not.toHaveCount(0);
    await articleLink.click();
    await expect(page).toHaveURL(href!);
    await expect(page.locator("article .post-body")).toBeVisible();
  });
});
