import { defineConfig, devices } from "@playwright/test";

/**
 * MINIMAL Playwright setup — exists so the design-critic can screenshot
 * /preview. One chromium project, local dev server. No CI wiring yet.
 *
 * KOL_E2E_PORT: with reuseExistingServer, a STALE server on :3000 (another
 * worktree, an old session) silently gets tested instead of this tree —
 * set a fresh port to guarantee the suite runs against the current code.
 */
const port = Number(process.env.KOL_E2E_PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1440, height: 900 },
    // Screenshots must capture settled states, not mid-transition frames —
    // the design system honors reduced motion with instant fades (§4).
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
