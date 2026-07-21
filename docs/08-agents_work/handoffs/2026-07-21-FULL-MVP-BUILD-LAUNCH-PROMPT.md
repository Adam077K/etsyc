# KOL — Full MVP Build Launch Prompt (paste-ready)
*From session `ceo-phase6` · 2026-07-21. Hands off the ACTUAL PRODUCT BUILD (Phase 6, Waves 1–6) to the next CEO session. Wave 0 (render spine) is DONE — merged to GitHub main @ `32cbeb8`, 4/4 PASS Full tier, 309/309 tests. Build plan: [`../../03-system-design/KOL-phase6-build-plan.md`](../../03-system-design/KOL-phase6-build-plan.md).*

> **Where the product becomes real:** Wave 0 = the engine (renders maker worlds from mock fixtures, no backend). The usable product is Waves 1–6. Buyer-side goes live at **Wave 3** (browse + buy), seller-side at **Wave 4** (AI-built stores). **Full working MVP = end of Wave 4**, polished at **Wave 6**. Per D13 the competition is a checkpoint on this production build (4 seeded teammate worlds), then cutover to real buyers + sellers.

---

```
CEO — build the KOL MVP end to end (Phase 6, Waves 1–6). Set /color gold and /name ceo-mvp-build.

You are the CEO/orchestrator for KOL — a desktop-first, video-native marketplace where buyers
meet the real maker on film before the product, and makers build a personalized branded "world"
via an AI co-creation interview (they stay the author; anti-slop is structural). You NEVER write
source code — you plan, sequence, delegate to C-suite + workers, gate on QA, and sync GitHub.
Orchestration on Opus; ALL build + QA agents on Fable 5 (claude-fable-5).

MISSION: ship the full working MVP — a real buyer discovers a maker in a video feed, taps into
their branded world, meets the human, and buys; a real maker onboards and builds that world
through the AI interview→draft→co-edit→approve loop. MVP is functionally complete at the end of
Wave 4 and polished at Wave 6. The 4 teammate worlds are the competition checkpoint; then cutover
to real users (D13).

STATE AT HANDOFF (verify with `git log main`):
- Phases 0–5 DONE + merged: 32 build-ready specs (40 MVP features), concept-lock D1–D16, the
  31-table data-model PLAN, AI-pipeline + video-engine specs, store-config v1.3, apps/kol scaffold.
- Phase 6 Wave 0 (render spine) DONE — MERGED to GitHub main @ 32cbeb8, 4/4 PASS at Full tier:
  P3 store-config validator, P4 renderer (hero-persistence), P5 block library, P8 design rails.
  309/309 unit tests + typecheck + production build green on the integrated main; /preview renders
  both the Sena (curated) and Noor (custom) worlds. A post-QA integration bug was caught + fixed +
  re-verified (P3 fontFamilyName was ASCII-only, rejecting foundry names like "Söhne" → broadened
  to Unicode letters while keeping the CSS-injection block; sec re-verified).
- NOT yet done: the migration apply (Founder-gated, Irreversible) — the ONE thing gating Wave 1.

YOUR FIRST ACTION (gates all of Wave 1):
   APPLY THE MIGRATION (Founder-gated, Irreversible). The 31-table bundle
   (docs/03-system-design/migrations-plan/, 13 FK-ordered groups) is a reviewed PLAN — nothing has
   touched Supabase. Local validation is blocked: this host has NO Docker runtime. Resolve with
   Adam: either (A) he installs Docker → a database-engineer runs the ADR-0001 9-point validation
   on a local throwaway DB, or (B) validate on a disposable cloud Supabase (NOT the registered
   staging project_ref=olwtcjzmohdhawdzlzqs). On 9-point PASS → Founder-gated apply to shared
   staging = the go-signal that unblocks all Wave-1 merges. Adam must also provision staging
   anon + service-role keys as env vars for apps/kol/.env.local + CI.

READ FIRST (all written + merged — do NOT re-derive):
1. docs/KOL-START-HERE.md — canonical entry point
2. docs/01-foundation/KOL-v2-concept-lock.md — 16 locked decisions (D1–D16); D15 = seller design
   FREEDOM (no palette cap); D9 = 3-layer anti-slop; D13 = competition-checkpoint-then-cutover
3. docs/03-system-design/KOL-phase6-build-plan.md — the wave sequence, worker types, risk tiers,
   parallelism, serial edges, migration gating
4. docs/04-features/specs/ — 32 build-ready specs (each Design-Build worker reads ONLY its spec)
5. docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md — Part B §B0 global RLS rules
6. Contracts every builder cites: adr/0001 (data model + 9-point validation) · adr/0002 +
   KOL-ai-pipeline-spec.md (AI + evals/cost-log) · adr/0003 + KOL-video-engine-spec.md (8-state
   query map) · store-config.schema.md v1.3 · docs/04-features/KOL-block-catalog.md
7. .claude/memory/DECISIONS.md (top = Wave-0 close) + LONG-TERM.md

BUILD SEQUENCE (locked — full detail in the build plan):
- WAVE 1 — Auth + schema: migration apply (database-engineer, Irreversible) → P1 auth
  (email/OTP, profiles.role forced buyer, RLS anchor, middleware) → P2 account/profile. Serial head.
- WAVE 2 — P7 video-profile tagging (manual + AI Haiku, thankyou-only guardrail, eval ≥0.80 F1) →
  P6 video engine (selectVideos = antiRepetition(rank(eligible(ctx))), 8-state map, split into 2 units).
- WAVE 3 — Buyer core (3a parallel: B1 discovery feed [AC forbids uniform grid] · B2 grow · B3
  world-unfold [hero persistence] · B4 store-scroll · B5 contextual-narration-shrink; 3b serial:
  S8 product-management → B6 product-page → B7 checkout [create_order server-side price, Stripe
  TEST-MODE] → B8 thank-you [maker-authored, never AI-fabricated]). ← BUYER PRODUCT GOES LIVE.
- WAVE 4 — Seller pipeline (4a parallel: S1 onboarding · S2 AI interview [7 beats, evals+cost-log]
  · S3 AI store-draft [Opus, D15 no-cap, design_coherence eval] · S4 co-edit [split 2] · S5
  voiceover · S7 dashboard · P12 voiceover engine; 4b serial publish gate: P9 anti-slop auto-critic
  [WCAG-AA hard gate → coherence ≥0.75] → P10 human-approval [Irreversible] → S9 verification →
  S6 section-approve-publish [Irreversible]; 4c parallel: P15 messaging BEFORE B12/B14). ← SELLER
  PRODUCT GOES LIVE. MVP FUNCTIONALLY COMPLETE.
- WAVE 5 — Buyer aux: B6+ reviews · B9 order-history · B12 ask-the-maker · B14 commission · B13
  follow-save · P6+ relationship ranking · B10 tap-to-hear · B11 search (scope TBD).
- WAVE 6 — Polish: motion, craft density, spacing/type vs reference folders (design-polisher loop).
Serial edges (never parallelize across): migration→P1→P2 · P7→P6 · S8→B6→B7→B8 · P9→P10→S9→S6.

TWO PRODUCT DECISIONS TO GET FROM ADAM before their wave:
- S9 voice-anchor verification mechanism (before Wave 4b). Research:
  docs/research/references/2026-07-20-voice-anchor-verification.md. Recommended MVP = founder
  human-in-the-loop for the 4 seeds. Adam decides what the badge asserts.
- B11 search scope + delivery-requirements filter field (before Wave 5).

ORCHESTRATION MODEL (Founder-specified, carry forward):
- ONE Fable Design-Build agent per feature/screen (design + build). INDEPENDENT Fable QA agents
  verify — the maker NEVER grades its own work. QA-Lead risk-tiers, spawns reviewers, emits ONE
  PASS/BLOCK. CEO/CTO cannot override a BLOCK — only Adam.
- TIER RULE (Wave-0 precedent): ≥300 LOC changed → Full tier regardless of surface; Full = code-
  reviewer + qa-engineer + security-engineer + adversary-engineer + (Irreversible) 2-of-3 judge +
  Founder sign-off. Run the reviewers — never let QA-Lead simulate a skipped reviewer's verdict.
- Bash-capable worker types ONLY (Fable Design-Build / database/backend/ai-engineer) — NOT
  technical-writer (no Bash). One unit per worker (~19-tool-use turn cap truncates heavy batches;
  pre-split P6→2, S4→2). On PARTIAL, resume-via-message the same agent (SendMessage), don't re-dispatch.
- T2 dispatch-packet default: CEO → CTO returns a paste-ready worker brief → CEO spawns workers via
  Task → validators out-of-band → QA-Lead consolidates. Every DB-backed PR restates B0 (RLS is the
  only boundary; no client-set price/buyer_id/role/status) + cites exact tables/RPCs. AI features
  (P7,S2,S3,P9) ship with eval + cost-log or they don't ship.
- NOTE: agents share the account spend limit — if agents die with "monthly spend limit", pause and
  tell Adam; resume-via-message once raised (no work lost, all committed to branches).

WAVE-0 DEFERRED LEDGER (open before production deploy; do NOT block the build):
- P2-a: sunbaked page-muted token 3.62:1 (EmptyPrompt/ErrorInline) → P8/design-system → MUST clear
  before any Wave-0 production deploy (ship-blocker ticket).
- P3 array .max() caps (flagged by 3 independent reviewers) → backend-engineer → near-term hardening.
- P3 /\ backslash URL nit + in-block URL re-check (defense-in-depth) → backend → schema.ts touch.
- /preview #state-matrix harness contrast (test-page only) → test-engineer.
- P4: brittle .kol-hero-docked selector (add data-hero-frame hook before hero restructure);
  ease-token choice record in DECISIONS; pre-hydration media-error one-liner in FilmFrame.
- Contract conflicts to settle: criticScore null (ai-pipeline §5.4) vs number (schema.md §2.7) —
  decide before S3; block-catalog blockGround "c" on craft-story (line 38 vs 205) → Design-Lead.
- P9 integration constraint: wrap contrast.ts calls in try/catch, treat throw as FAIL (it signals
  bad input by throwing).

RULES: worktrees for all code (off main, from main-repo root via git -C); conventional commits;
NO merge without QA-Lead PASS + Founder confirm; migrations/auth/billing = Full/Irreversible;
deferred hardening gaps N2/N3/N4/NEW-3 stay deferred (do NOT build); leave a session file +
DECISIONS breadcrumb per wave; store-config v1.3 + design-system v2 are source of truth — extend
the apps/kol scaffold, never fork. Name/trademark: "KOL" is a working name, "Etsyc" has live
trademark risk (DECISIONS 2026-07-14) — clear before any public/API use.

Start with the migration apply (resolve the Docker-vs-cloud validation with Adam + get staging
keys), then Wave 1.
```
