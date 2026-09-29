import { test, expect } from "../fixtures";
import { waitForStablePage } from "../helpers/hydration";
import { stabilizeForScreenshot } from "../helpers/screenshot";
import { waitForThemeTransition } from "../helpers/theme";

test.describe("Visual Regression", () => {
  test.describe("Homepage", () => {
    test("matches screenshot", async ({ homePage }) => {
      await homePage.goto();
      await waitForStablePage(homePage.page);
      await stabilizeForScreenshot(homePage.page);
      await expect(homePage.page).toHaveScreenshot("homepage.png");
    });

    test("matches screenshot in dark mode", async ({ homePage }) => {
      await homePage.goto();
      await homePage.darkThemeOption.click();
      await waitForThemeTransition(homePage.page);
      await waitForStablePage(homePage.page);
      await stabilizeForScreenshot(homePage.page);
      await expect(homePage.page).toHaveScreenshot("homepage-dark.png");
    });
  });

  test.describe("Posts Page", () => {
    test("matches screenshot", async ({ postsPage }) => {
      await postsPage.goto();
      await waitForStablePage(postsPage.page);
      await stabilizeForScreenshot(postsPage.page);
      await expect(postsPage.page).toHaveScreenshot("posts.png");
    });
  });

  test.describe("Post Detail", () => {
    test("matches screenshot", async ({ postDetailPage, postsPage }) => {
      await postsPage.goto();
      await postsPage.clickPost(0);
      await expect(postDetailPage.title).toBeVisible();
      await waitForStablePage(postDetailPage.page);
      await stabilizeForScreenshot(postDetailPage.page);
      await expect(postDetailPage.page).toHaveScreenshot("post-detail.png");
    });
  });

  test.describe("Links Page", () => {
    test("matches screenshot", async ({ linksPage }) => {
      await linksPage.goto();
      await waitForStablePage(linksPage.page);
      await stabilizeForScreenshot(linksPage.page);
      await expect(linksPage.page).toHaveScreenshot("links.png");
    });
  });
});
