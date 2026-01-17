import { test, expect } from "../fixtures";
import {
  expectDarkMode,
  expectLightMode,
  getStoredTheme,
  emulateColorScheme,
  waitForThemeTransition,
} from "../helpers/theme";

test.describe("Dark Mode", () => {
  test("toggle switches between dark and light mode", async ({ homePage }) => {
    await homePage.goto();

    const initialDarkMode = await homePage.isDarkMode();

    await homePage.toggleDarkMode();
    await waitForThemeTransition(homePage.page);

    const afterToggle = await homePage.isDarkMode();
    expect(afterToggle).not.toBe(initialDarkMode);
  });

  test("theme persists in localStorage", async ({ homePage }) => {
    await homePage.goto();

    await homePage.toggleDarkMode();
    await waitForThemeTransition(homePage.page);

    const theme = await getStoredTheme(homePage.page);
    expect(theme).not.toBeNull();
  });

  test("theme persists after page reload", async ({ homePage, page }) => {
    await homePage.goto();

    await homePage.toggleDarkMode();
    await waitForThemeTransition(page);
    const afterToggle = await homePage.isDarkMode();

    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    const afterReload = await homePage.isDarkMode();
    expect(afterReload).toBe(afterToggle);
  });

  test("theme maintains across navigation", async ({ homePage, page }) => {
    await homePage.goto();

    await homePage.toggleDarkMode();
    await waitForThemeTransition(page);
    const afterToggle = await homePage.isDarkMode();

    await homePage.navigateToPosts();
    await expect(page).toHaveURL("/posts");

    const afterNav = await homePage.isDarkMode();
    expect(afterNav).toBe(afterToggle);
  });

  test("respects system preference when no stored theme", async ({
    homePage,
    page,
  }) => {
    // Emulate dark color scheme before navigation
    await emulateColorScheme(page, "dark");
    await homePage.goto();

    // Clear any stored theme after page load
    await page.evaluate(() => localStorage.removeItem("color-scheme"));
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    await expectDarkMode(page);
  });

  test("shows correct icon based on mode", async ({ homePage }) => {
    await homePage.goto();

    const isDark = await homePage.isDarkMode();

    if (isDark) {
      await expect(homePage.sunIcon).toBeVisible();
    } else {
      await expect(homePage.moonIcon).toBeVisible();
    }
  });
});
