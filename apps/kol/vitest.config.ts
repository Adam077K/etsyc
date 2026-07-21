import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // mirror tsconfig's "@/*" → "src/*" path alias
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // e2e/ is Playwright's — vitest owns unit tests under src/ only.
    include: ["src/**/*.test.ts"],
  },
});
