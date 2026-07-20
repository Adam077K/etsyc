---
role: database-engineer
task: kol-p4-schema
date: 2026-07-19
branch: feat/kol-p4-schema
tier: irreversible
qa_verdict: PENDING   # non-applied plan; QA-Lead review + Founder sign-off required before apply
applied: false
---

# Session — KOL Phase 4 / Workstream A: MVP data model (migration PLAN)

**Deliverable:** reviewed, NON-APPLIED SQL DDL + RLS plan for the full KOL MVP data model. Nothing executed (no psql / db push / apply). Founder applies manually after QA.

**What shipped**
- ADR-0001 (`adr/0001-kol-data-model.md`): the model + all 7 resolved OQs + the OQ-2 config↔table sync contract.
- 13 FK-ordered migration-plan files (`migrations-plan/01…13`), one group per file, each with purpose / FK-deps / rollback-notes header, CREATE TABLE/INDEX/POLICY, and `ENABLE ROW LEVEL SECURITY`.
- 31 tables total: 29 from the feature-tree `Data need` roster + `categories` + `product_categories` (OQ-6).

**Key decisions (see ADR)**
- D4 kept: `stores.config`/`store_versions.config` stay `jsonb`; `blocks` is a static catalog, not per-store instances (OQ-1).
- OQ-2: `videos`+`video_profiles` canonical & GIN-indexed; config `media.clips[]` mirror them; sync via one-txn upsert + Zod referential check.
- Money = integer minor units + 3-char currency. RLS on every table; buyer/seller/public split keyed on `profiles.role` (signup-trigger seeded).
- FK-order fixes: `orders.commission_id` FK and `threads.commission_id` FK added via ALTER in group 10 (forward/circular refs).

**Not done / handoffs**
- Nothing applied or merged (QA gate is structural — Irreversible tier: Full + 2-of-3 judge + Founder sign-off).
- `blocks` + `categories` need a platform seed step (public-read, service-role write) — not in these create-only files.
- backend-engineer: honor column-level RLS gaps (seller may update only `orders.status` / `reviews.maker_response`) + the OQ-2 sync contract.
- CTO/lead to append the DECISIONS.md breadcrumb (workers don't write DECISIONS.md).
