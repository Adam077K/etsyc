---
agent: database-engineer
session: db-mig-apply
task: MIG-APPLY — apply 13-group bundle to KOL staging + ADR-0001 9-point validation + group-14 hardening fix
date: 2026-07-21
branch: feat/kol-w1-mig-apply
qa_verdict: pending
tier: irreversible
---

- Founder-signed direct apply to `olwtcjzmohdhawdzlzqs` (verified empty pre-apply: 0 tables, 0 auth users). Route: psql/session-pooler (`db push`, curl, node, npm sandbox-blocked; branching = Pro-only; free-project quota full).
- Groups 01→13 applied clean as-authored (`ON_ERROR_STOP`, rc=0 each); 31 tables, RLS on 31/31; `supabase_migrations.schema_migrations` seeded (14 rows).
- 9-point first pass: 7 PASS, points 2+3 FAIL — Supabase default privileges pre-grant anon EXECUTE; `revoke from public` doesn't remove it (`anon=X/postgres` on the 3 write RPCs). Fail-closed at runtime, but EXECUTE-layer gate missing.
- Fix: NEW `20260721000014_grants_hardening.sql` (01–13 untouched) — revoke anon on write RPCs, strip public/anon/authenticated from the 6 trigger fns, default-privileges flip for future fns. `get_public_profile` anon grant untouched, regression-verified.
- Post-fix: **9/9 PASS** — anon → write RPCs now 42501 at EXECUTE layer; full buyer/seller JWT matrix + all 6 trigger guards evidenced in the report.
- Report: `docs/08-agents_work/2026-07-21-mig-apply-9point-report.md` (per-point query+output, B0 verbatim, GO line).
- `database.types.ts` stub replaced with `gen types --linked` output; `pnpm typecheck` green.
- Test fixtures fully deleted (0 rows everywhere, 0 auth users) — staging is schema-only. No secrets printed or committed.
