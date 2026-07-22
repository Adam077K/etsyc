---
role: database-engineer
task: seed-blocks-catalog
tier: full
qa_verdict: pending
---
Seeded `public.blocks` on live staging (olwtcjzmohdhawdzlzqs): 31 (type,variant) rows across 11 types, derived from the shipped `StoreBlockSchema` union in `apps/kol/src/lib/store-config/schema.ts`. `allowed_states={empty,loading,error,success}` for all rows (states.test.ts asserts all 4 per block). Applied via new `scripts/seed-blocks.sh` (Management API; credentials never printed). Verified: count 31, distinct types 11, re-run digest identical f8376b494409f5069fcfef3d4e126007 (idempotent), anon read HTTP 200, anon write HTTP 401. `categories`/`product_categories` deliberately NOT seeded — no locked taxonomy exists; defers to B11 (Wave 5) per dispatch packet §1D. Rollback: scoped delete listed verbatim in seed header. Branch `feat/seed-blocks-catalog`; no schema object created, no policy changed.
