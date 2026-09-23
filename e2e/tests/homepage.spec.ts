import { test, expect } from "../fixtures";

test.describe("Homepage", () => {
  test("has a page heading for screen readers", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.heading).toHaveText("Yiyang Suen");
  });

  test("opens straight on the post list", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.postLinks.first()).toBeVisible();
  });

  test("has visible header", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.header).toBeVisible();
  });

  test("logo is visible in header", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.logo).toBeVisible();
  });

  test("dark mode toggle is present", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.darkModeToggle).toBeVisible();
  });
});
