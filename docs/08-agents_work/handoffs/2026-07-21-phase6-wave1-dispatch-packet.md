# KOL Phase-6 Wave-1 Dispatch Packet
*CTO · session `cto-wave1-packet` · 2026-07-21. Paste-ready for the CEO to spawn Wave-1 workers. NO source code, NO spawns here — this is the plan. Honors the locked build order (KOL-phase6-build-plan §1 Wave 1 + §2), ADR-0001 (31-table model + 9-point validation), and Part B §B0 global contract rules.*

---

## 0. State of the world (verified this session)

- **Wave 0 is DONE + merged to `main` @ `d938aad`** — render spine (P3/P4/P5/P8), 4/4 QA PASS. `apps/kol` is Next 16 / React 19 / strict TS with `store-config`, renderer, 11 blocks, `/preview`, vitest + playwright wired.
- **ZERO backend exists.** Verified: no `apps/kol/supabase/` dir; `package.json` has **no** `@supabase/*` deps; no Supabase client layer; `.env.example` created (2026-07-21) but no `.env.local` and no keys set.
- **The 31-table migration is a reviewed PLAN.** 13 FK-ordered SQL files live at `docs/03-system-design/migrations-plan/` (`01_auth_profiles.sql` → `13_search.sql`). **Nothing has touched Supabase.** Apply is Founder-gated + Irreversible.
- **Main repo root** for all worktrees: `/Users/adamks/VibeCoding/etsyc` (currently `main @ d938aad`). Create every worktree with `git -C /Users/adamks/VibeCoding/etsyc worktree add ...`.

### CRITICAL ENVIRONMENT FACTS (gate the whole wave)
1. **The host has NO Docker runtime.** Local `supabase start` is **impossible** (verified). This forces the validation route to the **cloud** (throwaway preview branch or a disposable project), not a local scratch DB. This overrides KOL-phase6-build-plan §2's "local `supabase start`" wording — that path is dead on this host.
2. **Staging Supabase MCP is registered** (`project_ref=olwtcjzmohdhawdzlzqs`) but **not yet OAuth'd**; anon/service-role/access-token/db-password not yet set.
3. Because of (2), **MIG-APPLY, P1, and P2 are all key-gated.** Only **MIG-STAGE is startable now** (pure filesystem, no keys, no DB).

---

## 1. Sequencing & gating diagram

```
NOW (no keys needed)                    [Adam provisions keys + approves]        Founder sign-off
────────────────────                    ──────────────────────────────          ───────────────
  MIG-STAGE ──────────────┐
  (db-eng, filesystem)    │
                          ▼
        ┌─────────────────────────────────┐   PASS report   ┌──────────────────────┐
        │  MIG-APPLY                       │ ───────────────▶│  Founder apply to     │
        │  (db-eng, CLOUD throwaway branch │                 │  SHARED staging       │
        │   → 9-point validation)          │                 │  (Irreversible go-sig)│
        └─────────────────────────────────┘                 └──────────┬───────────┘
                                                                        ▼
                                                          P1 Auth (backend-eng) ── serial ──▶ P2 Account/Profile
                                                          (Irreversible)                       (Full)
```

- **MIG-STAGE runs now, in parallel with Adam clearing keys.** It hides latency exactly as §2 intends (do the filesystem prep while the provisioning ask clears).
- **Serial edge, never parallelize:** MIG-APPLY → P1 → P2. P1's `middleware.ts` + RLS anchor is the trust boundary every later read keys on; P2 CRUD binds to the applied `profiles`/`buyer_signals` tables.
- **Nothing in P1/P2 merges** until the Founder applies to shared staging (a cloud throwaway branch can validate but cannot integrate parallel branches or serve a deployed URL — build-plan §2).

---

## 2. UNIT MIG-STAGE — Supabase scaffold + client layer  ·  **STARTABLE NOW**

```yaml
agent: database-engineer
goal: >
  Land the Supabase project scaffold, the 13 migration SQL files in FK order under
  supabase/migrations/, the @supabase/ssr client layer (browser + server + middleware
  session helper), and a typed Database stub — all wired to the .env.example var names.
  NO apply, NO live DB, NO validation-against-DB. Pure filesystem prep in a worktree.
linear_ticket: <CEO fills — Wave-1 parent sub-issue "MIG-STAGE">
worktree: git -C /Users/adamks/VibeCoding/etsyc worktree add \
          /Users/adamks/VibeCoding/etsyc/.worktrees/kol-w1-mig-stage -b feat/kol-w1-mig-stage
branch: feat/kol-w1-mig-stage
gate: NONE — no keys, no DB, no Docker needed. Start immediately.
risk_tier: Full            # defines the RLS trust boundary + the client layer; NOT downgradable
context_files:
  - docs/03-system-design/adr/0001-kol-data-model.md          # the model + OQ contracts + security hardening
  - docs/03-system-design/migrations-plan/                    # the 13 SQL files to copy, in order 01→13
  - apps/kol/.env.example                                     # EXACT env var names to wire the client to
  - docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md   # Part B §B0 — restate verbatim
  - apps/kol/package.json                                     # extend this workspace; do not scaffold a new app
constraints:
  - RESTATE B0 verbatim in the PR body: RLS is the ONLY boundary; 10 SECURITY DEFINER fns;
    6 triggers; service-role escape hatch tests auth.role()='service_role' (never auth.uid() IS NULL);
    money = integer minor units + char(3) currency; camelCase(config) ↔ snake_case(tables);
    OQ-2 video config↔table sync (validator-enforced).
  - `supabase init` for project scaffold (config.toml). project_id = olwtcjzmohdhawdzlzqs.
  - Copy the 13 SQL files into supabase/migrations/ with FK order PRESERVED via lexical
    timestamp prefixes (e.g. 20260721000001_auth_profiles.sql … 20260721000013_search.sql).
    Do NOT reorder, edit, or "fix" the SQL — MIG-APPLY validates it as-authored.
  - Add deps: @supabase/supabase-js + @supabase/ssr (latest stable, pnpm, in apps/kol). No other new deps without CTO approval.
  - Client layer per `nextjs-supabase-auth` conventions:
      * browser client (createBrowserClient, reads NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)
      * server client (createServerClient with cookies() adapter)
      * a service-role server client factory reading SUPABASE_SERVICE_ROLE_KEY — SERVER-ONLY,
        never importable from a "use client" module (enforce with import boundary / lint note).
      * middleware session helper (updateSession) — do NOT add role-gated routing yet (that is P1).
  - Typed Database stub: hand-write a minimal `src/lib/supabase/database.types.ts` placeholder
    (or a documented `supabase gen types` STUB) — real gen-types is post-apply (MIG-APPLY owns it).
  - TypeScript strict. Missing env at runtime → a CLEAR thrown error, NOT a build failure.
success_criteria:
  - `pnpm build` and `pnpm typecheck` are GREEN with the client compiled but unconfigured.
  - supabase/migrations/ holds all 13 files in FK order; `supabase migration list` (offline) parses them.
  - No key value is committed; only .env.example var NAMES are referenced.
  - Atomic conventional commits; branch pushed; no touch to main.
skills_to_load: [nextjs-supabase-auth, supabase-rls-conventions, supabase]
return_format: |
  { "unit":"MIG-STAGE", "status":"COMPLETE|PARTIAL|BLOCKED", "branch", "worktree",
    "files_changed":[...], "commits":[...], "deps_added":[...],
    "migration_files_staged":<int, expect 13>, "b0_restated":true,
    "decisions_made":[{key,value,reason}], "blockers":[] }
documentation: docs/08-agents_work/sessions/2026-07-21-database-engineer-mig-stage.md
```

---

## 3. UNIT MIG-APPLY — cloud validation + Founder-gated apply  ·  **GATED on keys**

```yaml
agent: database-engineer
goal: >
  Validate the 13-file migration bundle against a CLOUD throwaway env (no Docker on host),
  run the ADR-0001 9-point validation, emit a PASS report, then — on Founder sign-off only —
  apply to shared staging (olwtcjzmohdhawdzlzqs). Restate B0.
linear_ticket: <CEO fills — Wave-1 parent sub-issue "MIG-APPLY">
worktree: git -C /Users/adamks/VibeCoding/etsyc worktree add \
          /Users/adamks/VibeCoding/etsyc/.worktrees/kol-w1-mig-apply -b feat/kol-w1-mig-apply
branch: feat/kol-w1-mig-apply
gate: >
  (a) MIG-STAGE merged (supabase/migrations/ exists), AND
  (b) Adam has provisioned keys: SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD (+ project ref,
      already known) for the CLI route, OR OAuth'd the Supabase MCP for the MCP route, AND
  (c) Adam has approved running the 9-point validation on a THROWAWAY branch/project
      (NOT shared staging). The apply-to-shared-staging step is a SEPARATE Founder sign-off.
risk_tier: Irreversible    # applies DDL to a real Supabase env; Founder sign-off mandatory
context_files:
  - docs/03-system-design/adr/0001-kol-data-model.md          # §"Pre-apply staging validation" = the 9 points, verbatim
  - docs/03-system-design/migrations-plan/                    # the bundle under test
  - apps/kol/supabase/                                        # scaffold from MIG-STAGE (config.toml + migrations/)
  - apps/kol/.env.example                                     # SUPABASE_ACCESS_TOKEN / DB_PASSWORD / PROJECT_REF names
  - docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md   # §B0 restate
constraints:
  - RESTATE B0 verbatim in the PR + PASS report.
  - Validate on a DISPOSABLE target ONLY (a Supabase branch off the project, or a throwaway
    project) until the Founder signs off. NEVER run the first apply directly on shared staging.
  - Two routes — CEO/Adam pick based on what gets provisioned:
      * MCP route: OAuth the registered Supabase MCP → apply_migration per file 01→13 →
        run the 9 checks via MCP SQL. Preferred if MCP is authed (audit-logged, no local psql).
      * CLI route: `supabase link --project-ref olwtcjzmohdhawdzlzqs` (SUPABASE_ACCESS_TOKEN) →
        create a preview/throwaway branch → `supabase db push` (or psql via DATABASE_URL) →
        run the 9 checks as SQL. Use if MCP OAuth is not available.
  - After PASS: run `supabase gen types typescript` against the validated schema and REPLACE the
    MIG-STAGE database.types.ts stub with the generated types (commit on this branch).
  - The apply-to-SHARED-staging step executes ONLY after an explicit Founder "apply" instruction
    relayed by the CEO. Report PASS and STOP for sign-off before that step.
success_criteria:
  - All 13 groups apply cleanly in order on the throwaway target (no search_path/DDL/ordering errors).
  - All 9 validation points PASS (checklist §4 below) — report each as PASS/FAIL with evidence.
  - Generated database.types.ts committed, replacing the stub.
  - A PASS report posted for Founder sign-off BEFORE any shared-staging apply.
skills_to_load: [supabase-rls-conventions, postgresql, broken-authentication]
return_format: |
  { "unit":"MIG-APPLY", "status":"VALIDATED_PENDING_SIGNOFF|APPLIED|BLOCKED",
    "branch", "worktree", "validation_route":"mcp|cli", "groups_applied":"13/13",
    "nine_point":[{n:1..9, verdict:"PASS|FAIL", evidence}], "types_generated":true,
    "shared_staging_applied":false, "decisions_made":[...], "blockers":[] }
documentation: docs/08-agents_work/sessions/2026-07-21-database-engineer-mig-apply.md
```

### 4. The 9-point validation checklist (ADR-0001, verbatim — the MIG-APPLY PASS report fills each)

1. **Apply-run the full bundle (groups 01→13 in order)** on a throwaway staging DB — catches `search_path=''` typos, DDL/ordering errors, and any `create or replace` / `do`-guard issue static review misses.
2. **`pg_proc` audit** — every SECURITY DEFINER function has `proconfig` containing `search_path=` (empty) and **no** `EXECUTE` granted to `public`/`anon` except `get_public_profile` (anon + authenticated).
3. **Anon key → every definer *write* RPC returns `permission denied`** (`create_order` / `cancel_order` / `set_order_status`).
4. **Anon key → `get_public_profile(known_id)` returns only that row; there is NO call shape that returns never-posted buyers** (the NEW-1 enumeration gate).
5. **Buyer JWT → `create_order`**: client-supplied price is ignored (amount comes from `products`); `buyer_id` is bound to the caller; unpublished-store, cross-store item, and `quantity <= 0` are rejected.
6. **Buyer JWT → denied**: self-minting a badge, marking own review `verified`, and mutating another user's order all fail.
7. **Seller JWT → `set_order_status`**: succeeds only for the seller's own store and only for whitelisted target states.
8. **Triggers fire on the correct events** (insert vs update; role/transition guards raise as expected).
9. **View/function owner is a non-superuser role** (so definer semantics are the intended privilege boundary, and FORCE RLS considerations are understood).

---

## 5. UNIT P1 — Auth (email/OTP + role identity)  ·  **GATED on MIG-APPLY**

```yaml
agent: backend-engineer
goal: >
  Email/OTP auth with profiles.role forced 'buyer' at signup, session persistence,
  the RLS anchor, and role-gated routing in middleware.ts. This is the trust boundary
  every later engine/order/message read keys on.
linear_ticket: <CEO fills — Wave-1 parent sub-issue "P1-auth">
worktree: git -C /Users/adamks/VibeCoding/etsyc worktree add \
          /Users/adamks/VibeCoding/etsyc/.worktrees/kol-w1-p1-auth -b feat/kol-w1-p1-auth
branch: feat/kol-w1-p1-auth
gate: MIG-APPLY applied to shared staging (Founder-signed) + keys in CI/worker env.
risk_tier: Irreversible    # auth + middleware.ts + RLS trust boundary
context_files:
  - docs/04-features/specs/store-engine-spine.md              # READ ONLY the "## P1 — Auth" section (lines 43-192)
  - docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md  # §B0 + §B1 P1 row (restate verbatim)
  - apps/kol/src/lib/supabase/                                # the client layer from MIG-STAGE
  - docs/03-system-design/adr/0001-kol-data-model.md          # security hardening P2-1/2: handle_new_user + guard_profile_role
constraints:
  - RESTATE B0. RLS is the ONLY boundary. The app MUST NOT set profiles.role from client
    metadata or set handle at signup — role is FORCED 'buyer' by handle_new_user (DB trigger),
    upgrade to 'seller' is a service-role onboarding step only, guard_profile_role blocks client changes.
  - Env var names: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
  - All 4 states (spec §A2.3): empty=logged-out; loading=OTP verifying; error=bad/expired code
    inline + resend; success=session + role-correct landing.
  - Zod on all inputs (email, OTP). middleware.ts role-gated routing; do not leak buyer/seller
    routes across the boundary. Do NOT re-implement the handle_new_user/guard_profile_role triggers
    (they ship in migration 01) — verify they exist, build the app flow on top.
  - TypeScript strict. Extend the apps/kol scaffold; no new deps without CTO approval.
success_criteria:
  - Email/OTP sign-in works against applied staging; a new signup lands in profiles with role='buyer'.
  - A client attempt to set role at signup is a no-op (trigger wins) — covered by a test.
  - Session persists across reload; middleware routes by role; RLS lets a user read only own rows.
  - `pnpm build` + typecheck green; auth flow tests pass.
skills_to_load: [nextjs-supabase-auth, auth-implementation-patterns, broken-authentication]
return_format: |
  { "unit":"P1", "status", "branch", "worktree", "files_changed":[...], "commits":[...],
    "role_forced_buyer_verified":true, "middleware_role_gated":true,
    "decisions_made":[...], "blockers":[] }
documentation: docs/08-agents_work/sessions/2026-07-21-backend-engineer-p1-auth.md
```

---

## 6. UNIT P2 — Account & Profile  ·  **GATED on P1**

```yaml
agent: backend-engineer
goal: >
  Profile CRUD, the get_public_profile(uuid) id-keyed RPC (no enumeration), and the
  buyer_signals read-own / service-role-write path that P6+/B13 depend on.
linear_ticket: <CEO fills — Wave-1 parent sub-issue "P2-account">
worktree: git -C /Users/adamks/VibeCoding/etsyc worktree add \
          /Users/adamks/VibeCoding/etsyc/.worktrees/kol-w1-p2-account -b feat/kol-w1-p2-account
branch: feat/kol-w1-p2-account
gate: P1 merged (auth + session + RLS anchor live on applied staging).
risk_tier: Full
context_files:
  - docs/04-features/specs/store-engine-spine.md              # READ ONLY the "## P2 — Account & Profile" section (lines 193-332)
  - docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md  # §B0 + §B1 P2 row (restate verbatim)
  - apps/kol/src/lib/supabase/                                # client layer
  - docs/03-system-design/adr/0001-kol-data-model.md          # OQ-4 buyer_signals shape; NEW-1 get_public_profile
constraints:
  - RESTATE B0. App MUST NOT SELECT * on profiles cross-user (base-table PII `bio` is RLS-gated);
    cross-user display reads go ONLY through get_public_profile(uuid) — id-keyed, returns EXACTLY
    ONE row for a KNOWN id, never a set (no enumeration). Do NOT reintroduce a public_profiles view.
  - buyer_signals: read-own-only for the buyer; inserts are SERVICE-ROLE only (the engine writes them,
    not the client). Do NOT add a client write path. weight CHECK 0–100 is DB-side defence-in-depth.
  - Note (deferred, ADR): profiles.updated_at has no moddatetime trigger yet — CRUD updates won't
    auto-touch updated_at. Set it explicitly in the update path if the UI needs it; do NOT add the
    trigger here (that's a future migration = Irreversible).
  - Zod on all inputs. All 4 states: empty=new-profile prompts; loading=save; error=validation
    inline; success=saved. TypeScript strict; extend the scaffold; no new deps without CTO approval.
success_criteria:
  - Buyer can read + update own profile; cannot SELECT another user's bio directly.
  - get_public_profile(known_id) returns one row; no call shape enumerates users — covered by a test.
  - buyer_signals read-own works; a client insert attempt is denied (test).
  - `pnpm build` + typecheck green; tests pass.
skills_to_load: [nextjs-supabase-auth, supabase-rls-conventions, postgresql]
return_format: |
  { "unit":"P2", "status", "branch", "worktree", "files_changed":[...], "commits":[...],
    "enumeration_gate_tested":true, "buyer_signals_client_write_denied":true,
    "decisions_made":[...], "blockers":[] }
documentation: docs/08-agents_work/sessions/2026-07-21-backend-engineer-p2-account.md
```

---

## 7. QA plan per unit (spawn QA-Lead after each unit's workers return + branches verified)

| Unit | Risk tier | QA-Lead pipeline (per CLAUDE.md 4-tier gate) |
|---|---|---|
| **MIG-STAGE** | Full | code-reviewer + qa-engineer + semgrep + **security-engineer** + craft-reviewer + Codex CLI second opinion. Focus: client-layer import boundary (service-role key never reachable from client), the 13 files copied byte-faithfully in FK order, no key committed. |
| **MIG-APPLY** | **Irreversible** | Full pipeline + security-engineer + **adversary-engineer** + **2-of-3 multi-judge** + **Founder sign-off**. The 9-point validation IS the pre-apply gate — QA-Lead confirms every point is PASS with evidence before endorsing the Founder apply. QA cannot PASS a shared-staging apply that ran before sign-off. |
| **P1 Auth** | **Irreversible** | Full + security-engineer + adversary-engineer + 2-of-3 multi-judge + **Founder sign-off**. Adversary focus: role-forcing bypass (can a crafted signup payload set role='seller'?), session fixation, middleware route leakage across the buyer/seller boundary. |
| **P2 Account** | Full | code-reviewer + qa-engineer + semgrep + security-engineer + craft-reviewer + Codex second opinion. Focus: the get_public_profile enumeration gate + no client buyer_signals write + no cross-user PII SELECT. |

Rules carried in: maker ≠ verifier (the builder never QAs its own diff); QA-Lead may UPGRADE a tier, never downgrade; CEO/CTO cannot override a BLOCK; max 2 QA cycles per unit. Every DB-backed PR restates B0 and QA-Lead re-checks `qa-tier-floor.yml` (`*.sql`, auth → Full/Irreversible floor).

---

## 8. Gaps / flags for the CEO

1. **No-Docker overrides build-plan §2.** KOL-phase6-build-plan §2 offers a "local `supabase start`" scratch path; that is impossible on this host. Validation MUST be cloud (throwaway branch or disposable project). This packet routes MIG-APPLY accordingly — no plan edit needed, but the CEO should not re-suggest the local path.
2. **Three of four units are key-blocked.** MIG-APPLY / P1 / P2 cannot start until Adam provisions keys (CLI: `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD`; or OAuth the Supabase MCP) AND approves the throwaway-branch validation. This is the exact "ask Adam at Wave-0 kickoff" list from build-plan §2 — surface it now so it clears during MIG-STAGE.
3. **`supabase gen types` needs a live schema → post-apply.** MIG-STAGE ships only a hand-written `database.types.ts` stub; MIG-APPLY replaces it with real generated types after the 9-point PASS. P1/P2 consume the generated types, so a MIG-APPLY delay blocks type-accuracy in P1/P2 (they can start against the stub but must re-typecheck after types land).
4. **P5/P8 seed step is a Wave-1 unit NOT in this packet.** Build-plan §1 Wave 1 lists a 4th unit — `blocks` catalog + `categories` seed rows (database-engineer, Full, service-role write, outside create-only migrations). The dispatch brief scoped this packet to MIG-STAGE/MIG-APPLY/P1/P2 only. Flagging so the CEO can dispatch the seed step separately (it gates on MIG-APPLY, parallel with P2). Not included here per scope.
5. **ADR-0001 is still `Status: Proposed`, not Accepted;** its checklist item "Entry added to `.claude/memory/DECISIONS.md`" is unchecked. A lead (CTO) should append the ADR decision to DECISIONS.md and flip status to Accepted at/after the Founder apply — governance, not a blocker.
6. **Known-deferred hardening stays deferred** (accepted 2026-07-20): N2/N3/N4/NEW-3 (`set_order_status` from-state matrix, `create_order` inventory check, real-maker auto-revoke, `commission_drafts` role guard). Do NOT build in Wave 1; each is a future Irreversible migration. Restated so no worker "helpfully" adds them.
7. **P1/P2 share one spec file.** Both live in `store-engine-spine.md` as `## P1` (lines 43-192) and `## P2` (lines 193-332). Each worker reads ONLY its section — briefs above pin the line ranges to keep context tight.
