import { test, expect } from "../fixtures";

test.describe("Posts List", () => {
  test("displays posts", async ({ postsPage }) => {
    await postsPage.goto();
    const count = await postsPage.getPostCount();
    expect(count).toBeGreaterThan(0);
  });

  test("posts page has correct URL", async ({ postsPage, page }) => {
    await postsPage.goto();
    await expect(page).toHaveURL("/posts");
  });

  test("clicking a post navigates to detail page", async ({
    postsPage,
    page,
  }) => {
    await postsPage.goto();
    const count = await postsPage.getPostCount();

    if (count > 0) {
      await postsPage.clickPost(0);
      await expect(page).toHaveURL(/\/posts\/.+/);
    }
  });

  test("posts list is visible", async ({ postsPage }) => {
    await postsPage.goto();
    await expect(postsPage.postsList).toBeVisible();
  });
});
