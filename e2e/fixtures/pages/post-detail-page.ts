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
      // Post images use loading="lazy"; scroll each into view so the fetch starts,
      // then wait for the actual load before checking naturalWidth.
      await img.scrollIntoViewIfNeeded();
      await img.evaluate((el: HTMLImageElement) => {
        if (el.complete && el.naturalWidth > 0) return;
        return new Promise<void>((resolve, reject) => {
          el.addEventListener("load", () => resolve(), { once: true });
          el.addEventListener("error", () => reject(new Error("img error")), { once: true });
        });
      });
      const naturalWidth = await img.evaluate(
        (el: HTMLImageElement) => el.naturalWidth
      );
      if (naturalWidth === 0) return false;
    }
    return true;
  }
}
