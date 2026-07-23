import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

/** Minimal lint gate: Next core-web-vitals rules, TS handled by `tsc`. */
export default defineConfig([
  ...nextVitals,
  {
    ignores: [".next/**", "node_modules/**", "test-results/**", "playwright-report/**"],
  },
]);
