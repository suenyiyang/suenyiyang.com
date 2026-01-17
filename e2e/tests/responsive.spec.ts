import { test, expect } from "../fixtures";
import { VIEWPORTS, setViewport } from "../helpers/viewport";

test.describe("Responsive Design", () => {
  test("header is visible on mobile", async ({ homePage, page }) => {
    await setViewport(page, "mobile");
    await homePage.goto();
    await expect(homePage.header).toBeVisible();
  });

  test("header is visible on tablet", async ({ homePage, page }) => {
    await setViewport(page, "tablet");
    await homePage.goto();
    await expect(homePage.header).toBeVisible();
  });

  test("header is visible on desktop", async ({ homePage, page }) => {
    await setViewport(page, "desktop");
    await homePage.goto();
    await expect(homePage.header).toBeVisible();
  });

  test("content is readable on mobile viewport", async ({
    homePage,
    page,
  }) => {
    await setViewport(page, "mobile");
    await homePage.goto();
    await expect(homePage.mainContent).toBeVisible();
  });

  test("navigation works on mobile", async ({ homePage, page }) => {
    await setViewport(page, "mobile");
    await homePage.goto();
    await homePage.navigateToPosts();
    await expect(page).toHaveURL("/posts");
  });

  test("posts page works on all viewports", async ({ postsPage, page }) => {
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(viewport);
      await postsPage.goto();
      await expect(postsPage.postsList).toBeVisible();
    }
  });

  test("dark mode toggle accessible on mobile", async ({ homePage, page }) => {
    await setViewport(page, "mobile");
    await homePage.goto();
    await expect(homePage.darkModeToggle).toBeVisible();
    await homePage.toggleDarkMode();
  });
});
