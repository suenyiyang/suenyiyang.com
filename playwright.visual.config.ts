import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Exercise existing screenshot baselines against the production static build. */
export default defineConfig({
  ...base,
  workers: 1,
  globalSetup: undefined,
  testMatch: "visual.spec.ts",
  use: { ...base.use, baseURL: "http://127.0.0.1:4387" },
  webServer: {
    command: "pnpm build && node scripts/serve-thoughts-test.mjs",
    url: "http://127.0.0.1:4387",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
