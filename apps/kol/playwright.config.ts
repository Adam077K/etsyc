import { defineConfig, devices } from "@playwright/test";

/**
 * MINIMAL Playwright setup — exists so the design-critic can screenshot
 * /preview. One chromium project, local dev server. No CI wiring yet.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    // Screenshots must capture settled states, not mid-transition frames —
    // the design system honors reduced motion with instant fades (§4).
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
