import { Locator, Page } from "@playwright/test";
import { BasePage } from "./base-page";

export class PostDetailPage extends BasePage {
  readonly title: Locator;
  readonly content: Locator;
  readonly images: Locator;
  readonly article: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator("h1").first();
    this.content = page.locator("article, main .prose");
    this.images = page.locator("article img, main .prose img");
    this.article = page.locator("article, main .prose");
  }

  async goto(slug: string): Promise<void> {
    await super.goto(`/posts/${slug}`);
  }

  async getImageCount(): Promise<number> {
    return this.images.count();
  }

  async allImagesLoaded(): Promise<boolean> {
    const images = await this.images.all();
    for (const img of images) {
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      );
      if (naturalWidth === 0) return false;
    }
    return true;
  }
}
