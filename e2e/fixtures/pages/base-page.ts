import { Locator, Page } from "@playwright/test";

export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly logo: Locator;
  readonly navContainer: Locator;
  readonly darkModeToggle: Locator;
  readonly sunIcon: Locator;
  readonly moonIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    // Site chrome <header> only — exclude the <header> inside <article> (post title block).
    this.header = page.locator("body > div > header");
    this.logo = page.locator('body > div > header a[aria-label="Home"]');
    this.navContainer = page.locator("body > div > header nav");
    this.darkModeToggle = page.locator('[aria-label="Toggle dark mode"]');
    this.sunIcon = page.locator(".icon-\\[line-md--sunny-loop\\]");
    this.moonIcon = page.locator(".icon-\\[line-md--moon-loop\\]");
  }

  async goto(path: string = "/"): Promise<void> {
    await this.page.goto(path);
  }

  async isDarkMode(): Promise<boolean> {
    return this.page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
  }

  async toggleDarkMode(): Promise<void> {
    await this.darkModeToggle.click();
  }

  async navigateToHome(): Promise<void> {
    await this.logo.click();
  }

  async navigateToPosts(): Promise<void> {
    await this.page.locator('body > div > header a[href="/posts"]').click();
  }

  getNavLink(href: string): Locator {
    return this.page.locator(`body > div > header a[href="${href}"]`);
  }

  getFooterLink(href: string): Locator {
    return this.page.locator(`footer a[href="${href}"]`);
  }
}
