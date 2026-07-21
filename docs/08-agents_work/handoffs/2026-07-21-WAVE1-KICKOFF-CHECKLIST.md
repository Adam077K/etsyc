# Wave 1 Kickoff — Adam's checklist (the only human-gated steps)
*2026-07-21. Everything else is automated. These are the items that need Adam because they involve secrets, his Supabase login, or the Irreversible apply sign-off.*

## The 4 things only you can do

### 1. Get the keys (Supabase dashboard → paste into `.env.local`)
Copy `apps/kol/.env.example` → `apps/kol/.env.local` (gitignored), then fill from
https://supabase.com/dashboard/project/olwtcjzmohdhawdzlzqs :
- **Project Settings → API** → `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project Settings → API** → `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server secret — never expose)*
- **Account → Access Tokens** → new token → `SUPABASE_ACCESS_TOKEN` *(for the migration CLI)*
- **Project Settings → Database** → DB password → `SUPABASE_DB_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_PROJECT_REF` are pre-filled.

> I can't fill these myself — service-role keys are secrets I'm not allowed to handle in plaintext.
> You paste them once into `.env.local`; agents read them from there, never from chat.

### 2. Pick the migration-validation route (no Docker on this machine)
- **B — cloud throwaway (recommended, nothing to install):** I create a disposable Supabase preview
  branch/project, run the ADR-0001 9-point validation there, show you the PASS report.
- **A — local:** you install Docker Desktop (`brew install --cask docker` then open it), I validate on a
  local throwaway DB.
Reply "A" or "B".

### 3. Approve the Supabase MCP once (OAuth)
First time an agent uses the registered Supabase MCP, a one-time OAuth prompt appears — approve it so
agents can talk to the project. (Only needed if we go the MCP route vs. the CLI route.)

### 4. Sign off on the apply (Irreversible gate)
After the 9-point validation PASSes, I show you the report; you give one "apply" and I apply the
31-table schema to staging. That's the go-signal that unblocks all Wave-1 merges. Nothing touches
your real Supabase before this.

## What I'm doing automatically in parallel (no keys needed)
- ✅ `apps/kol/.env.example` scaffolded (the template above).
- ⏳ CTO Wave-1 dispatch packet (worker briefs: MIG-STAGE, MIG-APPLY, P1 auth, P2 profile).
- ⏳ MIG-STAGE worker (startable now, zero keys): `supabase init`, stage the 13 SQL files into
  `supabase/migrations/`, add `@supabase/*` deps, write the browser+server+middleware client layer,
  wire it to the env var names. Leaves everything ready so the apply is one command once you've done #1–#4.
- Then, the moment #1–#4 clear: MIG-APPLY (validate + apply) → P1 auth → P2 profile, QA-gated per PR.

## Sequence
`MIG-STAGE (now) ∥ [you: keys + route + OAuth]` → `MIG-APPLY (validate → you: sign off → apply)`
→ `P1 auth` → `P2 profile` → Wave 1 done → Wave 2.
