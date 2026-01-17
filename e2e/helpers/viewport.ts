import { Page } from "@playwright/test";

export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

export async function setViewport(
  page: Page,
  viewport: ViewportName
): Promise<void> {
  await page.setViewportSize(VIEWPORTS[viewport]);
}
