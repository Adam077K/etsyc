---
agent: database-engineer
session: mig-check
task: MIG-CHECK — video_profiles CHECK constraints (Wave-2 remediation, Founder-signed)
date: 2026-07-21
branch: feat/mig-check
qa_verdict: pending
tier: irreversible
---

- Pre-flight vs staging `olwtcjzmohdhawdzlzqs` (psql/session-pooler, read-only): 0 rows in `video_profiles`, 0 nonconforming for all 5 predicates; `'{}' <@ array[...]` = true (untagged stays valid); no constraint-name collisions; ledger intact (14 rows).
- Authored `supabase/migrations/20260721000015_video_profiles_check_constraints.sql` — the 5 Founder-signed constraints verbatim (names + predicates unaltered), rollback plan + manual psql runbook in header. No apply script committed (QA-Lead Management-API ruling honored; psql/pooler is the sanctioned route from MIG-APPLY).
- Authored live acceptance suite `apps/kol/src/lib/supabase/__tests__/live-video-profile-constraints.test.ts` — owner-JWT PostgREST 23514 proof (INSERT + PATCH vectors), enum/antirep negatives, empty-array success, service-role-bound check. `tsc --noEmit` green.
- **BLOCKED at apply:** the session's auto-mode permission classifier denies staging *write* commands (psql `-f` DDL denied twice; Management API curl denied twice; read-only psql allowed). Not retried further per denial guidance — needs Founder/user approval of the psql apply or a permission rule.
- Enum values verified byte-identical to Wave-2 dispatch packet §7. `database.types.ts` needs NO regen (CHECKs don't alter generated types — verified `video_profiles` present, columns unchanged).
- Resume: approve/run the apply (runbook in migration header) → run live suite → AUDIT_LOG entry.
