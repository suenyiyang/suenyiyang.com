import { Page } from "@playwright/test";

/**
 * Hide the page's two sources of per-run nondeterminism before a visual
 * screenshot.
 *
 * - The header theme switch: its line-md icons play SVG draw-in animations
 *   on load that Playwright's `animations: "disabled"` does not pause.
 *   `visibility` hides the icons but keeps the header layout.
 * - The Waline comments widget: it mounts after hydration and then renders a
 *   spinner, an empty state or a comment list depending on network timing,
 *   which changes the page height.
 *
 * This is a `page.addStyleTag` rather than the `stylePath` option of
 * `toHaveScreenshot`: that option resolves its path against the config's
 * `rootDir`, which is the test directory here, and an inline `style` object
 * is silently ignored by the matcher (only `page.screenshot` accepts it).
 */
export async function stabilizeForScreenshot(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      [role="radiogroup"][aria-label="Theme"] { visibility: hidden !important; }
      #comments { display: none !important; }
    `,
  });
}
