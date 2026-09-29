import { Locator, Page } from "@playwright/test";
import { gotoHydrated } from "../../helpers/hydration";

export class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly logo: Locator;
  readonly navContainer: Locator;
  /** The light / system / dark radio group in the header. */
  readonly darkModeToggle: Locator;
  readonly lightThemeOption: Locator;
  readonly systemThemeOption: Locator;
  readonly darkThemeOption: Locator;

  constructor(page: Page) {
    this.page = page;
    // Site chrome <header> only — exclude the <header> inside <article> (post title block).
    this.header = page.locator("body > div > header");
    this.logo = page.locator('body > div > header a[aria-label="Home"]');
    this.navContainer = page.locator("body > div > header nav");
    this.darkModeToggle = page.getByRole("radiogroup", { name: "Theme" });
    this.lightThemeOption = this.darkModeToggle.getByRole("radio", { name: "Light theme" });
    this.systemThemeOption = this.darkModeToggle.getByRole("radio", { name: "System theme" });
    this.darkThemeOption = this.darkModeToggle.getByRole("radio", { name: "Dark theme" });
  }

  async goto(path: string = "/"): Promise<void> {
    await gotoHydrated(this.page, path);
  }

  async isDarkMode(): Promise<boolean> {
    return this.page.evaluate(() =>
      document.documentElement.classList.contains("dark")
    );
  }

  /** Switch to whichever explicit theme is the opposite of the current one. */
  async toggleDarkMode(): Promise<void> {
    const option = (await this.isDarkMode())
      ? this.lightThemeOption
      : this.darkThemeOption;
    await option.click();
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
