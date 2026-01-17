import { test, expect } from "../fixtures";

test.describe("Homepage", () => {
  test("displays heading", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.heading).toBeVisible();
  });

  test("displays intro text", async ({ homePage }) => {
    await homePage.goto();
    await expect(homePage.introText).toBeVisible();
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
