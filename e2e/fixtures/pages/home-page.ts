import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class HomePage extends BasePage {
  readonly heading: Locator;
  readonly introText: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.locator("h1").first();
    this.introText = page.locator("main p").first();
    this.mainContent = page.locator("main");
  }

  async goto(): Promise<void> {
    await super.goto("/");
  }
}
