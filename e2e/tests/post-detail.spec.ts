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

  test("post title is visible", async ({ postsPage, postDetailPage }) => {
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
      await expect(page).toHaveURL(/\/posts\/.+/);
      await expect(postDetailPage.title).toBeVisible();

      // Not "networkidle": embedded YouTube / X players keep the network busy
      // indefinitely. allImagesLoaded() waits for each image itself.
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
