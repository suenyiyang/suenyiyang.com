import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: [
    "thoughts/*.spec.ts",
    "tests/navigation.spec.ts",
    "tests/responsive.spec.ts",
    "tests/dark-mode.spec.ts",
  ],
  fullyParallel: true,
  workers: 1,
  use: { baseURL: "http://127.0.0.1:4387", trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 12"] } },
  ],
  webServer: {
    command:
      "THOUGHTS_DIR=e2e/fixtures/thoughts pnpm build && node scripts/serve-thoughts-test.mjs",
    url: "http://127.0.0.1:4387",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
