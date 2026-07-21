import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e/ is Playwright's — vitest owns unit tests under src/ only.
    include: ["src/**/*.test.ts"],
  },
});
