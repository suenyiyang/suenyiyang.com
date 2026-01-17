import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class LinksPage extends BasePage {
  readonly mainContent: Locator;
  readonly externalLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.mainContent = page.locator("main");
    this.externalLinks = page.locator('main a[target="_blank"]');
  }

  async goto(): Promise<void> {
    await super.goto("/links");
  }

  async getExternalLinkCount(): Promise<number> {
    return this.externalLinks.count();
  }

  getExternalLinkByText(text: string): Locator {
    return this.page.locator(`main a[target="_blank"]:has-text("${text}")`);
  }
}
