# KOL Phase-6 Build Wave Plan
*CTO · 2026-07-20 · session `ceo-phase5`. Paste-ready sequencing for the next build session. Honors the locked Phase-5 build order, the 4-tier QA gate (CLAUDE.md), and the deferred Founder-gated migration apply. This is the plan the next CEO/CTO executes — no code, no spawns.*

---

## 0. Ground rules carried into every wave

- **Worker types:** `Fable Design-Build` agents for feature/screen units (render + UI + client logic — Bash-capable, can worktree + commit). `database-engineer` / `backend-engineer` / `ai-engineer` for infra, RPCs, engine, AI/eval. **Never** `technical-writer` for build units (no Bash — Phase-5 learning).
- **One unit per worker.** Size each worker to exactly ONE feature or ONE screen. The ~19-tool-use turn cap truncates heavy batches; split anything larger (S4 editor, P6 engine → 2 units each).
- **Maker ≠ verifier.** The builder never QAs its own work. QA-Lead risk-tiers the diff, spawns reviewers, emits ONE `<verdict>PASS|BLOCK</verdict>`. CEO/CTO cannot override a BLOCK.
- **Worktree isolation** per worker (`.worktrees/<slug>`, `feat/<slug>`), branched from `main`. No shared worktrees.
- **RLS is the only boundary** (B0). Every DB-backed PR states this and never client-sets price/`buyer_id`/`role`/order `status`.

---

## 1. Build waves (dependency-ordered)

### Wave 0 — Render Spine (mock-fixture only, ZERO DB) — START IMMEDIATELY
The store-config contract + render layer. Builds entirely against the scaffold's mock fixtures and Zod — needs no Supabase, so it runs in full parallel with the Wave-1 migration-apply ask.

| Feature | Unit | Worker | Risk tier |
|---|---|---|---|
| **P3** Store-config Zod validator (v1.3 discriminated union on `theme.kind` + OQ-2 referential integrity: every `media.clips[].id`→owned `videos.id`, `product_links`→real products, exactly one `hero-video`) | 1 | backend-engineer | **Full** (load-bearing contract; treat invariants as Full multi-judge even though pure TS) |
| **P5** Block-library-as-code: 11 primitives × 4 states + per-block `props` Zod discriminated-union on `type` + block-ground `a\|b\|c\|null` AA constraint | 1 | Fable Design-Build | Lite |
| **P4** Store renderer hardening: hero-video persistence invariant (`layoutId="hero-video"` never unmounts/pauses across state transitions), both `theme.kind` paths, `--ease-kol` reveal, per-block + renderer-level 4 states | 1 | Fable Design-Build | Lite |
| **P8** Curated design rails: 5 palettes / 4 pairings / 4 motion / radius / density as enums (bound to `config`, NOT a table) — mostly scaffolded, complete + lock | 1 | Fable Design-Build | Lite |

**Why this order:** P3 is the contract every world binds to — it leads by ~half a step so P4/P5/P8 build against a frozen shape. The scaffold already provides `render-store.tsx`, `store-config/types.ts`, `theme/*`, 11 blocks, `/preview` — this wave *hardens to spec*, it does not start from zero.
**Parallelism:** P3 lands the schema first; then P4 + P5 + P8 run 3-way parallel.
**QA gate:** P3 = Full pipeline (code-reviewer + qa-engineer + semgrep + security-engineer on the referential-integrity + AA invariants). P4/P5/P8 = Lite. Playwright snapshot of `/preview` for both `theme.kind`.

### Wave 1 — Auth + Schema Apply (migration-apply becomes the critical path)
The first DB-backed wave. **Nothing here merges until the migration is applied to a real Supabase env** (see §2).

| Feature | Unit | Worker | Risk tier |
|---|---|---|---|
| **Migration apply + 9-point staging validation** (ADR-0001) | 1 | database-engineer | **Irreversible** |
| **P1** Auth: email/OTP, `profiles.role` (forced `buyer` via `handle_new_user`), `guard_profile_role`, session persistence, RLS anchor, role-gated routing | 1 | backend-engineer | **Irreversible** (auth + `middleware.ts` + RLS trust boundary) |
| **P2** Account & Profile: profile CRUD, `get_public_profile(uuid)` RPC (id-keyed, no enumeration), `buyer_signals` read-own/service-role-write path | 1 | backend-engineer | **Full** |
| **P5/P8 seed rows**: `blocks` catalog + `categories` (service-role write, outside create-only migrations) | 1 | database-engineer | Full (seed step) |

**Why this order:** locked — P1 auth is the first DB feature; RLS keyed on `profiles.role` is the trust boundary for every later engine/order/message read. Migration apply gates all of it.
**Parallelism:** serial head — migration apply MUST land first (blocks everything). Then P1 → P2. Seed step parallel with P2.
**QA gate:** migration + P1 = **Irreversible** → Full reviewers + security-engineer + `adversary-engineer` + 2-of-3 multi-judge + **Founder sign-off**. The 9-point validation IS the pre-apply gate. P2 = Full.

### Wave 2 — Video Engine + Tagging
| Feature | Unit | Worker | Risk tier |
|---|---|---|---|
| **P7** Video-profile tagging: manual (checkboxes + product picker + `anti_repetition_key`) + AI `TagSuggestion` (Haiku, confirm-before-publish, thankyou-only guardrail, 429/529 fallback, cost-log, `tagging_accuracy` eval ≥0.80 F1) | 1 | ai-engineer | **Full** |
| **P6** Video engine: `selectVideos(ctx)=antiRepetition(rank(eligible(ctx)))`, 8-state query map, seeded jitter (no `Math.random`), anti-repetition signed-cookie key ring N=50, `RulesRanker` seam. **Split into 2 units:** (6a) eligibility+ranker+state-map; (6b) anti-repetition ring + reshuffle + structural tests | 2 | backend-engineer | **Full** |

**Why this order:** locked — P7 tagging writes `video_profiles`; P6 reads them (untagged footage = invisible to engine). Needs applied schema.
**Parallelism:** P7 tag-write contract lands first; P6a + P6b then run 2-way parallel against seeded/tagged fixtures.
**QA gate:** Full. **Mandatory structural test: `thankyou` clip can NEVER appear in FEED.** Eval harness verified.

### Wave 3 — Buyer Core Journey (B1–B8) + product provider
**3a — engine-driven render screens (5-way parallel):** B1 discovery-feed (magazine layout, FEED query, **AC forbids uniform grid**) [Full] · B2 grow-interaction (video never pauses) [Lite] · B3 world-unfold (signature moment, hero persistence, reduced-motion→instant fade) [Lite] · B4 store-scroll-interact [Lite] · B5 contextual-narration-shrink (dangling→graceful fallback) [Lite]. All Fable Design-Build.

**3b — commerce path (serial, needs products + orders):** S8 product-management (price minor units + currency = server-side source of truth — **pulled forward** for locked `S8→B6/B7`) [Full] → B6 product-page [Lite] → B7 checkout (`create_order`, prices server-side, **Stripe TEST-MODE**, no double-charge) [Full/Irreversible] → B8 thank-you (THANK_YOU clip; maker-authored `props.message`, never AI-fabricated) [Lite].

**Parallelism:** 3a = 5 parallel; 3b = serial. **QA gate:** B7 = Full + security-engineer + adversary-engineer + Codex (billing). B1 = Full. Rest Lite. Playwright E2E on the full spine.

### Wave 4 — Seller Pipeline + Trust Gate + Messaging
**4a — pipeline (parallel):** S1 onboarding [Lite] · S2 AI interview (7 beats, Haiku+Sonnet, hallucination-guarded, evals+cost-log) [Full] · S3 AI store-draft (**Opus** design derivation, D15 no-cap, schema-valid custom config, clip references, retry×2, `design_coherence` eval) [Full] · S4 co-edit editor (**split 2 units:** swap/reorder/theme + re-record/**re-critic-on-edit removes block from `approved_sections`**) [Full] · S5 voiceover recording [Full] · S7 seller-dashboard (`set_order_status` whitelisted targets) [Full] · P12 voiceover engine [Full/Lite].

**4b — publish gate (serial, locked `P9→S6/P10`, `S9→S6(c)/P11`):** P9 anti-slop auto-critic (2 sub-gates strict order: deterministic WCAG-AA HARD GATE → Sonnet coherence ≥0.75; regen×3→`in_review`; `critic_accuracy` eval, D15 canary) [Full] → P10 human-approval gate (owns `approved_sections` RPC + rules) [Irreversible] → S9 verification-real-maker (mints badge only on resolved `voiceAnchorClipId`, service-role) [Full] → S6 section-approve-publish (invokes P10; **hard preconditions: AA-PASS ∧ all rendered blocks approved ∧ Real-Maker anchor resolved ∧ P14 `product_specs` complete**) [Irreversible]. P11 trust-badges [Full] · P13 proof-of-product (maker-declared, NOT 3rd-party) · P14 exactly-what-to-expect (11 required fields, publish-blocking) fold in [Full].

**4c — messaging (parallel with 4a, locked BEFORE B12/B14):** P15 buyer-maker messaging + drafts (`threads`/`messages`/`commission_drafts`, `guard_thread`, RLS counterparty-only, SEPARATE from public `questions`/`answers`) [Full/Irreversible].

**Parallelism:** 4a ≈ 6–7 parallel; 4b strictly serial; 4c parallel with 4a. **QA gate:** S6/P10 = **Irreversible** (Founder sign-off). P15 = Full/Irreversible. Every AI stage = eval + cost-log verified by QA-Lead.

### Wave 5 — Buyer Aux + Relationship Ranking + Reviews (gated on B7 or P15)
B6+ trustworthy-reviews (`verified` GENERATED col, `review_media`) [Full, after B7] · B9 order-history [Lite, after B7] · B12 ask-the-maker (**reuses P15**, writes `buyer_signals`) [Full, after P15] · B14 guided co-creation commission (guided brief→**P15**→drafts→approve→`orders.commission_id`) [Full, after P15] · B13 follow-save (`buyer_signals` follow=3.0/save=1.5) [Full, after P2] · P6+ relationship-based-ranking (per-buyer aggregation, recency decay τ≈30d, anon→0, **AC forbids cross-buyer aggregate**) [Full, after P6/B13] · B10 tap-to-hear (buyer surface of P12) [Lite] · **B11 search-browse — SCOPE DEFERRED by Adam** (resolve first-wave-vs-fast-follow + the delivery-requirements filter field before build) [Full].

**Parallelism:** high — mostly independent leaves.

### Wave 6 — Polish Pass
Motion, micro-interactions, craft density, spacing/type against the reference folders (VIBE, not copy). `design-polisher` in a BUILD→`design-critic`→polish loop. Lite per screen. After each world is functionally green; does not block Wave 5.

---

## 2. Migration-apply gating (the critical sequencing question)

**The 31-table migration is a reviewed PLAN. Nothing has touched Supabase. Apply is a separate, deferred, Founder-gated step.**

- **NO real Supabase (mock fixtures / pure TS) — start now:** Wave 0 entirely. P3 (Zod), P4/P5/P8 (render from JSON fixtures via `/preview`). Zero DB dependency.
- **LOCAL / throwaway-branch Supabase (engineer-applied scratch, NOT the Founder apply):** the moment auth/tables are needed (Wave 1+), a `database-engineer` applies the bundle to a local `supabase start` DB or throwaway branch and runs the 9-point validation. Workers build+test against this ephemeral env.
- **Hard-blocked until the Founder applies to SHARED staging Supabase:** merge + cross-worker integration of Wave 1+, and the deployed-staging deliverable. A local scratch DB cannot integrate parallel branches or serve a deployed URL.

**Earliest point migration-apply becomes THE critical path:** the head of Wave 1. Wave 0 hides the latency; schedule the apply to complete *during* Wave 0.

**Ask Adam at Wave-0 kickoff (so it clears before Wave 1):**
1. Provision a KOL **staging Supabase** project/branch + service-role + anon keys + env vars for CI and workers.
2. Approve the **9-point validation** run on a throwaway branch (apply groups 01→13, `pg_proc` search-path audit, anon-key write-RPC denial, `get_public_profile` enumeration gate, buyer/seller JWT RLS matrix, trigger-fire checks, non-superuser owner). Returns PASS report or the failing item.
3. On PASS → **Founder-gated apply to shared staging** (Irreversible, Founder sign-off) — the go-signal that unblocks Wave 1 merges.
4. Confirm **known-deferred gaps (N2/N3/N4/NEW-3) stay deferred** (accepted 2026-07-20) — do NOT build in Phase 6; each is a future Irreversible migration.

---

## 3. RICE effort estimates (person-weeks, all `(est.)`)
Assumptions: one agent-loop = one unit; person-week excludes QA-Lead round-trips; scaffold discounts P4/P5/P8.

| Feature | Effort (pw) | Feature | Effort (pw) |
|---|---|---|---|
| P1 Auth | 1.5 | B1 Discovery feed | 1.5 |
| P2 Account & Profile | 1.0 | B2 Grow-interaction | 0.5 |
| P3 Store-config validator | 1.5 | B3 World-unfold | 1.0 |
| P4 Store renderer | 1.5 | B4 Store-scroll-interact | 0.5 |
| P5 Block library | 1.0 | B5 Contextual-narration-shrink | 0.5 |
| P6 Video engine | 2.5 | B6 Product-page | 1.0 |
| P7 Video-profile tagging | 1.5 | B7 Checkout | 2.0 |
| P8 Curated design rails | 0.5 | B8 Thank-you-moment | 0.5 |
| P12 Voiceover engine | 1.5 | | |

*Spine (P1–P8,P12): ~12.5 pw · Buyer-core (B1–B8): ~8.0 pw. Sequencing driven by MoSCoW=Must; these let RICE rank the Wave-5 fast-follow leaves.*

---

## 4. Worker-orchestration notes (Phase-5 learnings)
1. **Bash-capable worker types for all build units** — `technical-writer` has no Bash (can't worktree/commit). Build → Fable Design-Build (screens) or database/backend/ai-engineer (infra). Confirm Bash before dispatch.
2. **One feature/screen per worker** — the ~19-tool-use turn cap truncated heavy batches in Phase 5 (W4 needed resume-via-message). Pre-split: P6→2, S4→2, P13+P14→2. On PARTIAL, resume-via-message the same agent.
3. **Separate maker from verifier — always.** After a wave's workers return + branches verified, spawn QA-Lead independently. It risk-tiers, spawns reviewers, emits ONE verdict. **CEO/CTO cannot override BLOCK.** Max 2 QA cycles/ticket.
4. **Parallel within a wave, serial across dependency edges.** Big parallel fans: W0 (3), 3a (5), 4a (6–7). Serial edges (never parallelize across): migration→P1→P2, P7→P6, S8→B6→B7→B8, P9→P10→S9→S6.
5. **Every DB-backed PR restates B0** + cites exact tables/RPCs. QA-Lead re-checks `qa-tier-floor.yml` (`*.sql`, auth, billing → Full/Irreversible min).
6. **AI features ship with eval + cost-log or they don't ship** — P7, S2, S3, P9. QA-Lead verifies both before PASS.
7. **Two open product decisions gate their features — get from Adam before their wave:** (a) **S9 voice-anchor mechanism** — resolve before Wave 4b (see `docs/research/references/2026-07-20-voice-anchor-verification.md`; recommended MVP = founder human-in-the-loop for the 4 seeds). (b) **B11 search scope + delivery-filter field** — resolve before Wave 5.

*Locked-order compliance: P1→P3→P5→P4 ✓ · P7→P6→B1–B8 ✓ · P15 before B12/B14 ✓ · P9→S6/P10 ✓ · S9→S6(c)/P11 ✓ · B7→B6+/B9 ✓ · S8→B6/B7 ✓. Every Data-need migration = Irreversible, database-engineer first, behind the deferred Founder apply.*
