import { test, expect } from "../fixtures";

// Run playground tests serially — the first load triggers Vite to compile
// Three.js / React Three Fiber bundles, which can take several seconds and
// causes parallel workers to race and time out.
test.describe.configure({ mode: "serial" });

test.describe("Playground", () => {
  test("page loads with canvas on desktop", async ({ playgroundPage }) => {
    await playgroundPage.goto();
    await expect(playgroundPage.canvas).toBeVisible();
  });

  test("walking toward Yiyang shows chat hint and Escape closes panel", async ({
    playgroundPage,
  }) => {
    // Yiyang at [-1.8, 0.75, 0]; player spawn at [0, 0.45, 3.5].
    // Diagonal NW walk (W + A): distance ≈ 3.94 units at 2.5 units/s.
    // Enter the 1.3-radius zone at ~1.1s, exit at ~2.1s.
    // Walk 1400ms — solidly inside the zone, not yet exited.
    await playgroundPage.goto();
    await playgroundPage.canvas.click();
    await playgroundPage.holdKeys(["KeyW", "KeyA"], 1400);
    await expect(playgroundPage.triggerHint).toContainText("Yiyang");
    await playgroundPage.pressActivate();
    await expect(playgroundPage.chatPanel).toBeVisible();
    await playgroundPage.pressEscape();
    await expect(playgroundPage.chatPanel).not.toBeVisible();
  });

  test("walking toward newspaper opens posts modal listing posts", async ({
    playgroundPage,
  }) => {
    // Newspaper at [2.2, 0, 1.2]; player spawn at [0, 0.45, 3.5].
    // Diagonal NE walk (W + D): dx ≈ 2.2, dz ≈ -2.3, distance ≈ 3.2;
    // ~1.3s to enter the 1.3 radius.
    await playgroundPage.goto();
    await playgroundPage.canvas.click();
    await playgroundPage.holdKeys(["KeyW", "KeyD"], 1500);
    await expect(playgroundPage.triggerHint).toContainText("文章");
    await playgroundPage.pressActivate();
    await expect(playgroundPage.postsModal).toBeVisible();
    await expect(
      playgroundPage.postsModal.locator("a[href^='/posts/']")
    ).not.toHaveCount(0);
  });

  test("chat panel shows unavailable banner in non-Chrome browsers", async ({
    playgroundPage,
    browserName,
  }) => {
    test.skip(
      browserName === "chromium",
      "Chromium may ship Prompt API; this test only asserts the fallback path"
    );
    await playgroundPage.goto();
    await playgroundPage.canvas.click();
    await playgroundPage.holdKeys(["KeyW", "KeyA"], 1800);
    await playgroundPage.pressActivate();
    await expect(playgroundPage.chatPanel).toBeVisible();
    await expect(playgroundPage.chatPanel).toContainText("Chrome 138+");
  });

  test("home page links to playground", async ({ homePage }) => {
    await homePage.goto();
    await expect(
      homePage.page.locator('a[href="/playground"]')
    ).toBeVisible();
  });

  test("mobile shows the desktop-recommended notice", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });
    const page = await context.newPage();
    await page.goto("/playground");
    await expect(page.locator('text="本页面建议使用桌面浏览器访问。"')).toBeVisible();
    await context.close();
  });
});
