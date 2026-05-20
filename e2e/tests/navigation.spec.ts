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

  test("about link navigates to about page", async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.getNavLink("/about").click();
    await expect(page).toHaveURL("/about");
  });

  test("GitHub link in footer opens in new tab", async ({ homePage }) => {
    await homePage.goto();
    const githubLink = homePage.getFooterLink("https://github.com/suenyiyang");
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
