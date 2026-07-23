import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the continuous-film proof. Runs the built app on :3100 and
 * walks the buyer journey asserting the film element's identity persists across
 * every route seam. Not part of the default build; run with `pnpm e2e`.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 1440, height: 900 },
    trace: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    timeout: 120_000,
    reuseExistingServer: true,
  },
});
