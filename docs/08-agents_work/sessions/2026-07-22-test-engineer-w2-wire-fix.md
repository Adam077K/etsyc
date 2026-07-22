---
role: test-engineer · task: w2-wire-fix (gate-1 must-fixes 5+6) · date: 2026-07-22 · tier: full
branch: feat/w2-wire-engine · status: COMPLETE (awaiting QA-Lead re-cert)
---
Fix 5 (F12 repeat): live-composition fixture client now built in `beforeAll` — proven empirically: keyless run BEFORE = FAIL `supabaseUrl is required`, AFTER = `3 skipped`; keyed = 3 passed live. The 5 pre-existing module-scope-client suites on main (`live-eligibility`, `live-account-boundary`, `live-trust-boundary`, `live-tagging-boundary`, `live-video-profile-constraints`) were NOT touched — they ride as G1-F11.
Fix 6: new keyless `engine-deps-wiring.test.ts` mocks only the two supabase factories; asserts anon output serves eligibility and admin output reaches the ranker ONLY. Mutation-verified with 3 mutants (admin→eligible, discarded-anon, full crossover) — all red, crossover caught by the from-log path assertion itself; wiring restored byte-identical (empty diff), test green.
Fold-ins: `import "server-only"` in eligible.ts · `EngineSecretTooShortError` — createEngineDeps enforces ≥32 secret bytes (TextEncoder byte length) · ENGINE_COOKIE_SECRET added to .env.example with `openssl rand -base64 48` hint. TEST_SECRET in composition.test.ts bumped 31→44 bytes to clear the new floor.
Gates: typecheck 0 errors · lint clean · 588/588 (was 586; +2 new tests; live suites ran against staging).
