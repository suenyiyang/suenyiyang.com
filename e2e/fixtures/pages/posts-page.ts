import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class PostsPage extends BasePage {
  readonly postsList: Locator;
  readonly postItems: Locator;

  constructor(page: Page) {
    super(page);
    this.postsList = page.locator("main");
    this.postItems = page.locator("main article, main a[href^='/posts/']");
  }

  async goto(): Promise<void> {
    await super.goto("/posts");
  }

  async getPostCount(): Promise<number> {
    return this.postItems.count();
  }

  async clickPost(index: number = 0): Promise<void> {
    await this.postItems.nth(index).click();
  }

  getPostByTitle(title: string): Locator {
    return this.page.locator(`main a:has-text("${title}")`);
  }
}
