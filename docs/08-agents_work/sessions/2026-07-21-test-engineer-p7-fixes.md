---
date: 2026-07-21
role: test-engineer
unit: P7 (video profile tagging) — QA must-fixes T1 + T2
branch: feat/p7-video-profile-tagging
tests: 464 passed / 17 files · typecheck 0 errors · lint clean
---

# P7 must-fixes — saveVideoProfile boundary test + eval opt-in

**T1:** `apps/kol/src/lib/tagging/__tests__/actions.test.ts` — 6 mocked-Supabase tests proving `saveVideoProfile` CALLS `videoProfileWriteSchema` before writing: thankyou+feed leak → field errors + upsert count 0; invalid videoId / null input / unauthenticated → no write; valid input → PARSED payload ("" → null transform) reaches upsert verbatim; DB error → friendly message. **Mutation-verified:** deleted the safeParse gate locally → 3 tests went red (leak reached upsert) → restored.

**T2:** `src/**/*.eval.ts` removed from default vitest `include`; new `vitest.eval.config.ts` (shares aliases/setup, evals only) + `pnpm eval` script. `vitest list` confirms: default = 17 files no evals, eval config = exactly `tagging-accuracy.eval.ts`. Eval itself untouched; server-only alias untouched.
