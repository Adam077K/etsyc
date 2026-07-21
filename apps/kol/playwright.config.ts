import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright setup for the KOL prototype.
 *
 * The suite runs against an ALREADY-RUNNING dev server on :3210 — it never
 * starts or stops one (several agents share that server). Override with
 * PLAYWRIGHT_BASE_URL if you run it on another port.
 */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3210",
    viewport: { width: 1440, height: 900 },
    // Screenshots must capture settled states, not mid-transition frames —
    // the design system honors reduced motion with instant fades (§4).
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
