import { expect, Page } from "@playwright/test";

export async function isDarkMode(page: Page): Promise<boolean> {
  return page.evaluate(() =>
    document.documentElement.classList.contains("dark")
  );
}

export async function expectDarkMode(page: Page): Promise<void> {
  await expect(page.locator("html")).toHaveClass(/dark/);
}

export async function expectLightMode(page: Page): Promise<void> {
  await expect(page.locator("html")).not.toHaveClass(/dark/);
}

export async function getStoredTheme(
  page: Page
): Promise<"light" | "dark" | "auto" | null> {
  return page.evaluate(() => localStorage.getItem("color-scheme")) as Promise<
    "light" | "dark" | "auto" | null
  >;
}

export async function setStoredTheme(
  page: Page,
  theme: "light" | "dark" | "auto"
): Promise<void> {
  await page.evaluate((t) => localStorage.setItem("color-scheme", t), theme);
}

export async function clearStoredTheme(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.removeItem("color-scheme"));
}

export async function emulateColorScheme(
  page: Page,
  scheme: "dark" | "light"
): Promise<void> {
  await page.emulateMedia({ colorScheme: scheme });
}

export async function waitForThemeTransition(
  page: Page,
  previousIsDark?: boolean
): Promise<void> {
  if (previousIsDark !== undefined) {
    await page.waitForFunction(
      (prev) => document.documentElement.classList.contains("dark") !== prev,
      previousIsDark,
      { timeout: 2000 }
    );
    return;
  }
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute("data-theme-transition"),
    undefined,
    { timeout: 2000 }
  );
}
