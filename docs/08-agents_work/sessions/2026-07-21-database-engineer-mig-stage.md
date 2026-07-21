---
agent: database-engineer
session: db-mig-stage
task: MIG-STAGE — Supabase scaffold + 13 staged migrations + @supabase/ssr client layer
date: 2026-07-21
branch: feat/kol-w1-mig-stage
qa_verdict: pending
tier: full
---

- `supabase init` scaffold committed; `config.toml` project_id = `olwtcjzmohdhawdzlzqs`. NOTHING applied (no keys, no DB, no Docker) — MIG-APPLY owns apply + `gen types`.
- 13 migration files copied byte-faithfully (cmp-verified) from `docs/03-system-design/migrations-plan/` to `supabase/migrations/20260721000001_auth_profiles.sql` … `...13_search.sql`, FK order preserved lexically.
- Client layer at `apps/kol/src/lib/supabase/`: browser (`client.ts`), server (`server.ts`, async cookies adapter), service-role (`admin.ts`, `server-only` guarded), middleware `updateSession` (no role gating — P1), `database.types.ts` STUB, `env.ts` (missing env → clear runtime throw, build stays green).
- Server-only guard PROVEN: temporary client-component probe importing `admin.ts` failed the build ("'server-only' cannot be imported from a Client Component module"); probe removed.
- Deps added in apps/kol: `@supabase/supabase-js ^2.110.7`, `@supabase/ssr ^0.12.3`, `server-only ^0.0.1` (required for the mandated import-boundary guard).
- `apps/kol/.env.example` created (did not exist anywhere in history) with the three canonical var names; no values committed.
- `pnpm typecheck`, `pnpm build`, `pnpm lint` all GREEN unconfigured.
- B0 contract restated verbatim in the migrations commit body (ab4bfa0).
