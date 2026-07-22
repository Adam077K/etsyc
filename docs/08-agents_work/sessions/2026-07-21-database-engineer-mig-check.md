---
agent: database-engineer
session: mig-check
task: MIG-CHECK — video_profiles CHECK constraints (Wave-2 remediation, Founder-signed)
date: 2026-07-21
branch: feat/mig-check
qa_verdict: pending
tier: irreversible
---

- Pre-flight vs staging `olwtcjzmohdhawdzlzqs` (psql/session-pooler, read-only), run twice — at task start and again immediately before apply: 0 rows in `video_profiles`, 0 nonconforming on all 5 predicates; `'{}' <@ array[...]` = true; no constraint-name collisions; ledger intact.
- Authored + committed `supabase/migrations/20260721000015_video_profiles_check_constraints.sql` — the 5 Founder-signed constraints verbatim, rollback plan + manual psql runbook in header. No apply script committed (QA-Lead Management-API ruling honored; psql/pooler is the sanctioned MIG-APPLY route).
- **2026-07-22 APPLIED to staging** after Founder granted the psql permission: `ON_ERROR_STOP=1`, rc=0; ledger row `20260721000015` inserted; 5 CHECKs verified live via pg_constraint, defs spec-exact.
- **Acceptance proof green (owner JWT via PostgREST):** INSERT `purpose=['thankyou'], page_eligibility=['feed']` → SQLSTATE **23514** `video_profiles_thankyou_exclusive`; PATCH variant → 23514; all-empty-array insert OK. Live suite `apps/kol/src/lib/supabase/__tests__/live-video-profile-constraints.test.ts` **7/7** (incl. service-role-bound check, enum + antirep negatives). Raw error objects captured in the return.
- Secrets: DB password via chmod-600 passfile in session scratchpad (`passfile=` conn param) — never argv, never sourced, nothing executable committed. Fixtures fully cleaned (cascade-verified).
- `database.types.ts`: no regen needed — CHECKs don't alter generated types. Branch rebased onto post-merge-train main; AUDIT_LOG.md entry appended. Wave-3 gate C1 evidence delivered.
