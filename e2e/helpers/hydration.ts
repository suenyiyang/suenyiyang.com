import { Page } from "@playwright/test";

/**
 * Wait until React has hydrated the page. Before that, SSR markup is visible
 * but no event listeners are attached, so clicks silently do nothing.
 * `src/root.tsx` sets `data-hydrated` on <html> once the initial tree's
 * effects have run.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForSelector("html[data-hydrated]", { state: "attached" });
}

/**
 * Navigate and wait for hydration. Uses "domcontentloaded" rather than the
 * default "load": posts embed YouTube / X iframes whose third-party resources
 * can hold the load event for a long time without affecting our own page.
 */
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForHydration(page);
}

/** Wait for hydration and for every webfont the page requested to load. */
export async function waitForStablePage(page: Page): Promise<void> {
  await waitForHydration(page);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}
