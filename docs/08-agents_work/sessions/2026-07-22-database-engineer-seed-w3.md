---
role: database-engineer
task: seed-w3
tier: full
qa_verdict: pending
---
Seeded 4 published maker worlds + 1 unpublished RLS probe on staging (`5eed` uuid prefix): 5 profiles, 5 stores, 20 videos, 20 video_profiles, 16 media, 12 products, 12 specs. All 5 configs pass StoreConfigSchema.parse (generation + DB read-back). Idempotence proven: 2nd run `INSERT 0 0` everywhere, checksum identical (421a2986…). Anon (SET ROLE anon): sees exactly 4 published stores, probe invisible, all writes rejected. Feed predicate → 4 intros, 0 thankyou leaks; 0 vocabulary violations. Placeholder film is committed public-domain content (`apps/kol/public/seed/`), swap = URL change. Rollback: `delete from auth.users where id in (the five 5eed0001-* ids)` — cascades everything. Branch `feat/seed-w3-worlds` (stacked on `feat/p3-ext`); gates: typecheck ✓ lint ✓ 594 tests ✓.
