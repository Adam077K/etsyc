---
role: backend-engineer
task: p6a-eligibility-ranker
branch: feat/p6a-eligible-rank
tier: full
qa_verdict: PENDING
---
P6a shipped: `engine/types.ts` (byte-identical §4.1 contract, sha 40fb1dd6), `eligible.ts` (8-state GIN query map, positive FEED predicate, dangling-link fallback), `rank.ts` (RulesRanker, §3.2 weights verbatim, FNV-1a seeded jitter, service-role per-buyer Relationship term with visit-cap/decay/squash).
Tests: 30 unit + 10 live vs staging incl. mandated "FEED never returns a thankyou clip" — 40/40 green; typecheck + lint clean.
Not built (by contract): anti-repetition/cookie-ring/select-videos (P6b), engine/index.ts (W2-WIRE post-merge).
