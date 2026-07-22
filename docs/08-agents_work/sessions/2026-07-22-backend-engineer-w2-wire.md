---
role: backend-engineer · task: W2-WIRE · date: 2026-07-22 · tier: full
branch: feat/w2-wire-engine · status: COMPLETE (awaiting QA-Lead)
---
Shipped the engine composition root in 5 commits: `createAnonClient()` (anon key, no cookie adapter — closes the unpublished-clip leak), `lib/engine/index.ts` with locked `createDefaultDeps` seam + `createEngineDeps` app entry (throws `EngineSecretMissingError`, no fallback), and F3: FEED bounded to `FEED_CANDIDATE_CAP=300` newest-tagged with server-side order, scoped states capped at 100 — guarantee is now "one newest eligible clip per store, among the 300 most recently tagged clips."
New suites: `composition.test.ts` (real pipeline, zero vi.mock, all 4 QA-named tests) and `live-composition.test.ts` (staging via createEngineDeps, incl. "anon client cannot see an unpublished store's clips", cleanup-verified).
Gates: typecheck 0 errors · lint clean · 586/586 tests (live suites ran against staging). ENGINE_COOKIE_SECRET still absent from .env.local — tests inject a literal secret; provisioning remains open for B1a.
