import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "thoughts/empty-state.spec.ts",
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:4387" },
  webServer: {
    command: "pnpm build && node scripts/serve-thoughts-test.mjs",
    url: "http://127.0.0.1:4387",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
