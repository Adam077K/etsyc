import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // mirror tsconfig's "@/*" → "src/*" path alias
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // vitest runs in node, where the server-only guard's default export
      // throws by design (it protects client BUNDLES, not test processes).
      // Resolve it to the package's own react-server build (an empty
      // module) so lib/agents/llm.ts + lib/tagging/suggest.ts can load in
      // the eval/test rig without weakening the app's real boundary.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    // e2e/ is Playwright's — vitest owns unit tests under src/ only.
    // Component tests opt into jsdom per-file via `@vitest-environment`.
    // *.eval.ts are the LLM evals (agents/evals/) — they auto-skip without
    // the relevant API key, so a keyless CI run stays green and honest.
    include: ["src/**/*.test.{ts,tsx}", "src/**/*.eval.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
