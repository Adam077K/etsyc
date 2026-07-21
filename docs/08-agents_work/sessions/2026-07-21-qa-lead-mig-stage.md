---
date: 2026-07-21
role: qa-lead
unit: MIG-STAGE
tier: full
verdict: PASS
branch: feat/kol-w1-mig-stage
merged: main @ 3b00e63
reviewers: [cr-migstage, sec-migstage, qalead-migstage (spot-verify), ceo (mechanical)]
---

# MIG-STAGE — Supabase scaffold + client layer — QA PASS (Full tier)

**Verdict:** PASS. Merged to main @ `3b00e63`, pushed to origin.

**What shipped:** `supabase/` project scaffold (config.toml, project_id olwtcjzmohdhawdzlzqs) · 13 migration SQL files staged FK-ordered + timestamp-prefixed (byte-identical to `docs/03-system-design/migrations-plan/`, CEO-verified) · `@supabase/ssr` + `supabase-js` deps · client layer `apps/kol/src/lib/supabase/` (browser `client.ts`, server `server.ts`, service-role `admin.ts` with real `server-only` guard, `middleware.ts` updateSession, `env.ts`, `database.types.ts` STUB). NO apply, NO live DB, NO keys.

**Coverage:** code-reviewer (SSR patterns, server-only boundary, env, stub, B0) PASS 0P1/0P2; security-engineer (service-role leak path, secret scan, static B0 read of the staged SQL — 31/31 RLS, 10/10 search_path pins, get_public_profile sole anon grant, service-role hatches test auth.role(), money server-side) PASS 0P1/0P2; QA-Lead spot-verified the load-bearing claims; CEO mechanical checks (byte-faithful migrations, no secrets, build+typecheck green).

**Deferred (all P3, with owners/gates):**
- sec#2 — service-role env accessor is a convention-only boundary (no leak today) → build-enforced via a `server-only` module → **CTO/backend-engineer, gated: must land BEFORE the first `createAdminClient` consumer merges.**
- sec#3 — create_order ignores inventory_status = **the Founder-accepted deferred N3 (2026-07-20); STAYS DEFERRED, do NOT fix in Wave 1.**
- sec#1 — config.toml project_id = real project-ref breadcrumb → devops → hygiene.
- sec#4 — weak local-dev auth defaults → devops → harden before any `supabase config push`.
- cr P3×2 — stale session-file claims (commit hash, .env.example provenance) → technical-writer → cleanup.

**Gate status:** MIG-STAGE is the last no-keys unit. MIG-APPLY / P1 / P2 remain key-gated (Adam: keys + validation route A/B + Founder apply sign-off).
