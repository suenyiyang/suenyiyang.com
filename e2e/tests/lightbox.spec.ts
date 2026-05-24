import { test, expect } from "../fixtures";

const POST_URL = "/posts/review-2025/";

test.describe("Lightbox", () => {
  test("opens when clicking a post image", async ({ page }) => {
    await page.goto(POST_URL);
    const firstFigure = page.locator("article figure[data-zoomable]").first();
    await firstFigure.scrollIntoViewIfNeeded();
    await firstFigure.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Source line should mention the post — exact title varies by locale, just check the prefix.
    await expect(page.locator(".lightbox-source")).toContainText("From");
  });

  test("Escape closes the lightbox", async ({ page }) => {
    await page.goto(POST_URL);
    const firstFigure = page.locator("article figure[data-zoomable]").first();
    await firstFigure.scrollIntoViewIfNeeded();
    await firstFigure.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator(".lightbox-backdrop")).toHaveCount(0);
  });

  test("arrow keys navigate between images, wrapping at ends", async ({ page }) => {
    await page.goto(POST_URL);
    const figures = page.locator("article figure[data-zoomable]");
    const count = await figures.count();
    test.skip(count < 2, "post needs multiple images for this test");

    await figures.first().scrollIntoViewIfNeeded();
    await figures.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const modalImg = page.locator(".lightbox-card img").first();
    const firstSrc = await modalImg.getAttribute("src");

    await page.keyboard.press("ArrowRight");
    await expect(modalImg).not.toHaveAttribute("src", firstSrc ?? "");

    await page.keyboard.press("ArrowLeft");
    await expect(modalImg).toHaveAttribute("src", firstSrc ?? "");

    // Wrap to last by stepping back from first.
    await page.keyboard.press("ArrowLeft");
    await expect(modalImg).not.toHaveAttribute("src", firstSrc ?? "");
  });

  test("backdrop click closes; card click does not", async ({ page }) => {
    await page.goto(POST_URL);
    const firstFigure = page.locator("article figure[data-zoomable]").first();
    await firstFigure.scrollIntoViewIfNeeded();
    await firstFigure.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Click inside the card — modal stays open.
    await page.locator(".lightbox-card").click();
    await expect(dialog).toBeVisible();

    // Click the backdrop at a known corner — modal closes.
    await dialog.click({ position: { x: 10, y: 10 } });
    await expect(page.locator(".lightbox-backdrop")).toHaveCount(0);
  });

  test("lightbox is not mounted on non-post pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".lightbox-backdrop")).toHaveCount(0);
  });
});
