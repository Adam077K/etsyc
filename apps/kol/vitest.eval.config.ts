import { defineConfig } from "vitest/config";

import baseConfig from "./vitest.config";

/**
 * LLM eval config — run with `pnpm eval`, never as part of `pnpm test`.
 * Evals make live API calls (with structural retries on long timeouts) and
 * sit right at the 0.80 F1 ship gate, so they are opt-in by design: the
 * default suite stays deterministic and free. Everything except `include`
 * (the "@" / server-only aliases, setup files) is shared with the base
 * config. Evals still auto-skip when the relevant API key is absent.
 *
 * NOTE: not mergeConfig — it concatenates arrays, which would re-add the
 * base `include` and pull unit tests into the eval run.
 */
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ["src/**/*.eval.ts"],
  },
});
