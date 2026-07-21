import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // mirror tsconfig "@/*" → "./src/*" for tests importing app modules
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // e2e/ is Playwright's — vitest owns unit tests under src/ only.
    include: ["src/**/*.test.ts"],
  },
});
