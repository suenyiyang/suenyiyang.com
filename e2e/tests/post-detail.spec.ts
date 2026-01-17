import { test, expect } from "../fixtures";

test.describe("Post Detail", () => {
  test("renders post content from posts list", async ({
    postsPage,
    postDetailPage,
    page,
  }) => {
    await postsPage.goto();
    const count = await postsPage.getPostCount();

    if (count > 0) {
      await postsPage.clickPost(0);
      await expect(page).toHaveURL(/\/posts\/.+/);
      await expect(postDetailPage.title).toBeVisible();
    }
  });

  test("post title is visible", async ({ postsPage, postDetailPage, page }) => {
    await postsPage.goto();
    const count = await postsPage.getPostCount();

    if (count > 0) {
      await postsPage.clickPost(0);
      await expect(postDetailPage.title).toBeVisible();
    }
  });

  test("images load successfully", async ({
    postsPage,
    postDetailPage,
    page,
  }) => {
    await postsPage.goto();
    const count = await postsPage.getPostCount();

    if (count > 0) {
      await postsPage.clickPost(0);
      await page.waitForLoadState("networkidle");

      const imageCount = await postDetailPage.getImageCount();
      if (imageCount > 0) {
        const allLoaded = await postDetailPage.allImagesLoaded();
        expect(allLoaded).toBe(true);
      }
    }
  });

  test("header remains visible on detail page", async ({
    postsPage,
    postDetailPage,
  }) => {
    await postsPage.goto();
    const count = await postsPage.getPostCount();

    if (count > 0) {
      await postsPage.clickPost(0);
      await expect(postDetailPage.header).toBeVisible();
    }
  });
});
