import { test, expect } from "../fixtures";
import { waitForThemeTransition } from "../helpers/theme";

test.describe("Links Page", () => {
  test("links page renders", async ({ linksPage }) => {
    await linksPage.goto();
    await expect(linksPage.mainContent).toBeVisible();
  });

  test("links page has correct URL", async ({ linksPage, page }) => {
    await linksPage.goto();
    await expect(page).toHaveURL("/links");
  });

  test("header is visible on links page", async ({ linksPage }) => {
    await linksPage.goto();
    await expect(linksPage.header).toBeVisible();
  });

  test("dark mode toggle works on links page", async ({ linksPage }) => {
    await linksPage.goto();
    const initialDarkMode = await linksPage.isDarkMode();
    await linksPage.toggleDarkMode();
    await waitForThemeTransition(linksPage.page);
    const afterToggle = await linksPage.isDarkMode();
    expect(afterToggle).not.toBe(initialDarkMode);
  });

  test("can navigate to home from links page", async ({ linksPage, page }) => {
    await linksPage.goto();
    await linksPage.navigateToHome();
    await expect(page).toHaveURL("/");
  });
});
