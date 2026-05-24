import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class PlaygroundPage extends BasePage {
  readonly canvas: Locator;
  readonly triggerHint: Locator;
  readonly postsModal: Locator;
  readonly chatPanel: Locator;
  readonly mobileNotice: Locator;

  constructor(page: Page) {
    super(page);
    this.canvas = page.locator("main canvas");
    this.triggerHint = page.locator('main [class*="rounded-full"]').first();
    this.postsModal = page.locator('[role="dialog"][aria-labelledby="posts-modal-title"]');
    this.chatPanel = page.locator('[role="dialog"][aria-labelledby="chat-panel-title"]');
    this.mobileNotice = page.locator('main >> text="本页面建议使用桌面浏览器访问。"');
  }

  async goto(): Promise<void> {
    await super.goto("/playground");
    await this.page.waitForLoadState("networkidle");
    // Scene is lazily loaded and rendered by React Three Fiber client-side.
    // Vite compiles Three.js + R3F bundles lazily on first request, which can
    // take 20–40 s. Wait up to 45 s for the canvas to appear.
    await this.page.waitForSelector("main canvas", { timeout: 45000 });
    // Give the WebGL render loop 1.5 s to stabilize before tests interact with
    // the scene (keyboard events, trigger-zone polling, etc.).
    await this.page.waitForTimeout(1500);
  }

  async holdKey(key: string, ms: number) {
    await this.page.keyboard.down(key);
    await this.page.waitForTimeout(ms);
    await this.page.keyboard.up(key);
  }

  /** Hold multiple keys simultaneously for ms milliseconds (diagonal walks). */
  async holdKeys(keys: string[], ms: number) {
    for (const k of keys) await this.page.keyboard.down(k);
    await this.page.waitForTimeout(ms);
    for (const k of keys) await this.page.keyboard.up(k);
  }

  async pressActivate() {
    await this.page.keyboard.press("KeyE");
  }

  async pressEscape() {
    await this.page.keyboard.press("Escape");
  }
}
