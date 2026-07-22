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
    // *.eval.ts (the LLM evals under agents/evals/) are deliberately NOT in
    // the default include: once ANTHROPIC_API_KEY exists in .env.local they
    // make live LLM calls, and `pnpm test` must stay fast, free, and
    // deterministic. Run evals explicitly via `pnpm eval`
    // (vitest.eval.config.ts).
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
