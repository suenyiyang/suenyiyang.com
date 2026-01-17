import { test, expect } from "../fixtures";

test.describe("Navigation", () => {
  test("logo navigates to home", async ({ homePage, page }) => {
    await homePage.goto("/posts");
    await homePage.navigateToHome();
    await expect(page).toHaveURL("/");
  });

  test("posts link navigates to posts page", async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.navigateToPosts();
    await expect(page).toHaveURL("/posts");
  });

  test("links link navigates to links page", async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.navigateToLinks();
    await expect(page).toHaveURL("/links");
  });

  test("GitHub link opens in new tab", async ({ homePage }) => {
    await homePage.goto();
    const githubLink = homePage.getNavLink("https://github.com/suenyiyang");
    await expect(githubLink).toHaveAttribute("target", "_blank");
  });

  test("back and forward navigation works", async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.navigateToPosts();
    await expect(page).toHaveURL("/posts");

    await page.goBack();
    await expect(page).toHaveURL("/");

    await page.goForward();
    await expect(page).toHaveURL("/posts");
  });
});
