import { test, expect } from "../fixtures";

test.describe("Visual Regression", () => {
  test.describe("Homepage", () => {
    test("matches screenshot", async ({ homePage }) => {
      await homePage.goto();
      await expect(homePage.page).toHaveScreenshot("homepage.png");
    });

    test("matches screenshot in dark mode", async ({ homePage }) => {
      await homePage.goto();
      await homePage.darkModeToggle.click();
      await expect(homePage.page).toHaveScreenshot("homepage-dark.png");
    });
  });

  test.describe("Posts Page", () => {
    test("matches screenshot", async ({ postsPage }) => {
      await postsPage.goto();
      await expect(postsPage.page).toHaveScreenshot("posts.png");
    });
  });

  test.describe("Post Detail", () => {
    test("matches screenshot", async ({ postDetailPage, postsPage }) => {
      await postsPage.goto();
      await postsPage.clickPost(0);
      await expect(postDetailPage.page).toHaveScreenshot("post-detail.png");
    });
  });

  test.describe("Links Page", () => {
    test("matches screenshot", async ({ linksPage }) => {
      await linksPage.goto();
      await expect(linksPage.page).toHaveScreenshot("links.png");
    });
  });
});
