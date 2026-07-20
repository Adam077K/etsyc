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

**Fix cycle 1 (QA-Lead BLOCK #1 → resolved on same branch)**
- Principle applied: RLS is the only boundary, so every column/transition restriction is now DB-ENFORCED (SECURITY DEFINER RPC / BEFORE trigger / definer view / service-role), not "app-side". Vulnerable comments removed. Full table in ADR "Security hardening" section.
- P1 (all 5): P1-1 order/item writes → `create_order`/`cancel_order`/`set_order_status` RPCs (amounts server-computed; tables SELECT-only). P1-2 verification/real-maker badge service-role-only + integrity trigger (D7 no false claim). P1-3 review order-item↔product match. P1-4 seller-scope trigger (maker_response only). P1-5 media/video cross-store WITH CHECK.
- P2 (all 8): role self-escalation guard + buyer-only signup seed; `public_profiles` view; `buyer_signals` weight not client-set + CHECK; thread/commission counterparty + status-transition triggers; store creation seller-gated; BEGIN/COMMIT + type/trigger idempotency guards; Q&A store/product match + body CHECK.
- P3: indexed `messages.media_id`/`answers.media_id`; `critic_score` 0–1 CHECK; `moddatetime` noted as backend follow-up.
- New objects: 9 SECURITY DEFINER functions, 6 triggers, 1 view. Lint: 31 tables == 31 ENABLE RLS, 54 policies (every table ≥1), 0 DROP/TRUNCATE outside rollback comments, 13/13 files BEGIN/COMMIT-balanced.

**Fix cycle 2 (QA-Lead PASS-WITH-REQUIRED-HARDENING → both required items closed)**
- NEW-1: removed the enumerable `public_profiles` view (owner-run, GRANTed anon, no WHERE → any anon could `SELECT *` the whole membership list). Replaced with id-keyed `get_public_profile(uuid)` SECURITY DEFINER fn — returns one KNOWN profile's {id, display_name, avatar_url, role}; no enumeration. REVOKE public + GRANT anon/authenticated.
- N1: replaced `auth.uid() IS NULL ⇒ trusted service role` with explicit `auth.role() = 'service_role'` in `guard_profile_role`, `enforce_review_seller_scope`, `guard_commission` (anon also has null uid; latent bypass closed). `enforce_real_maker_badge` already trusts no one.
- ADR-0001: filed the 4 P3 follow-ups (NEW-3 draft-status guard · NEW-4/N2 order from-state machine · N3 create_order inventory check · N4 badge auto-revoke) under "Post-MVP hardening", and added the mandated 9-point "Pre-apply staging validation (MANDATORY)" section.
- Object count now: **10 SECURITY DEFINER functions, 6 triggers, 0 views.**

**Not done / handoffs**
- Still NON-APPLIED / not merged (QA re-verify pending; Irreversible tier — Full + 2-of-3 judge + Founder sign-off).
- `blocks` + `categories` need a platform seed step (public-read, service-role write) — not in these create-only files.
- Server (service-role) flows backend-engineer must own: Stripe webhook → `orders.status='paid'`; verification resolution → verified/rejected; role → `seller` during onboarding (BEFORE store creation); `buyer_signals` emission with weights; `moddatetime` updated_at triggers.
- CTO/lead to append the DECISIONS.md breadcrumb (workers don't write DECISIONS.md).
