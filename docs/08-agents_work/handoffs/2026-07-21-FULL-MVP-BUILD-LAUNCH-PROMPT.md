# KOL — Full MVP Build Launch Prompt (paste-ready)
*From session `ceo-phase6` · 2026-07-21. Hands off the ACTUAL PRODUCT BUILD to the next CEO session. **Waves 0 AND 1 are DONE + merged to GitHub main @ `cba62ff`.** The backend is LIVE (31-table schema applied to Supabase, RLS on all 31, 9/9 security-validated) and the app has real auth + profiles. **Start at Wave 2 (video engine).** Build plan: [`../../03-system-design/KOL-phase6-build-plan.md`](../../03-system-design/KOL-phase6-build-plan.md).*

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
- Phases 0–5 DONE: 32 build-ready specs (40 MVP features), concept-lock D1–D16, AI-pipeline +
  video-engine specs, store-config v1.3.
- Wave 0 (render spine) DONE: P3 validator, P4 renderer (hero-persistence), P5 block library,
  P8 design rails. /preview renders the Sena (curated) + Noor (custom) worlds.
- Wave 1 DONE — the BACKEND IS LIVE and the app has real auth:
  * MIG-STAGE: supabase/ scaffold + 13 migrations staged + @supabase/ssr client layer.
  * MIG-APPLY (Irreversible, Founder-signed): 31-table schema APPLIED to the Supabase project
    (ref olwtcjzmohdhawdzlzqs), RLS on all 31, **9/9 security validation PASS** + independent
    adversary re-verify. A group-14 hardening migration was added (Supabase default-privileges
    pre-grant anon EXECUTE; revoke-from-public doesn't cover it → explicit revoke). REAL generated
    types at apps/kol/src/lib/supabase/database.types.ts.
  * P1 Auth (Irreversible, Founder-signed): email/OTP, role FORCED 'buyer' by handle_new_user
    trigger (live-verified), role-gated routing in proxy.ts (Next 16 middleware successor), sessions.
    QA caught + closed TWO open-redirect vectors (control-char + dot-segment) — the guard
    (parseSameOriginPath) re-validates its OUTPUT; do NOT weaken it.
  * P2 Account: profile CRUD, get_public_profile(uuid) no-enumeration lookup, buyer_signals
    server-only write path.
- KEYS ARE SET: apps/kol/.env.local (gitignored) holds the Founder's Supabase keys (anon,
  service_role, access token, db password). Workers that need the live DB copy it into their
  worktree: `cp /Users/adamks/VibeCoding/etsyc/apps/kol/.env.local apps/kol/.env.local` (never commit/print).
- NEW CONVENTION from Wave 1: default privileges grant NO implicit anon EXECUTE — any future
  anon-callable RPC needs its own explicit `grant execute ... to anon` (the get_public_profile pattern).

YOUR FIRST ACTION: START WAVE 2 (video engine). No keys/decisions needed from Adam for this wave.
   Have the CTO return a Wave-2 dispatch packet, then spawn workers:
   - P7 video-profile tagging (ai-engineer): manual (checkboxes + product picker + anti_repetition_key)
     + AI TagSuggestion (Haiku, confirm-before-publish, thankyou-only guardrail, 429/529 fallback,
     cost-log, tagging_accuracy eval ≥0.80 F1). Writes video_profiles. Full tier.
   - P6 video engine (backend-engineer): selectVideos(ctx)=antiRepetition(rank(eligible(ctx))),
     the 8-state query map, seeded jitter (NO Math.random), anti-repetition signed-cookie ring N=50,
     RulesRanker seam. **Split into 2 units** (6a eligibility+ranker+state-map; 6b anti-repetition
     ring + reshuffle + structural tests). Full tier. Reads video_profiles → untagged footage is
     invisible, so P7 tag-write contract lands first, then P6a+P6b run 2-way parallel.
   Serial edge: P7 → P6. AI features (P7) ship with eval + cost-log or they don't ship.
   (Also queue the P5/P8 blocks+categories SEED step — build-plan §1 Wave 1 tail, database-engineer,
   service-role write — it was deferred out of the Wave-1 packet; do it before Wave 3 needs catalog data.)

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
7. .claude/memory/DECISIONS.md (top = Wave-1 close, backend live) + LONG-TERM.md
8. Wave-1 session files (docs/08-agents_work/sessions/2026-07-21-*): the 9-point PASS report,
   the P1/P2 QA verdicts, and the exact schema/auth state you build on.

BUILD SEQUENCE (locked — full detail in the build plan):
- WAVE 1 — DONE ✅ (migration applied 9/9 · P1 auth · P2 profile — all merged to main @ cba62ff).
- WAVE 2 ← START HERE — P7 video-profile tagging (manual + AI Haiku, thankyou-only guardrail, eval ≥0.80 F1) →
  P6 video engine (selectVideos = antiRepetition(rank(eligible(ctx))), 8-state map, split into 2 units).
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

WAVE-1 FAST-FOLLOW QUEUE (from P1/P2 QA — pick up early in Wave 2, non-blocking):
- FIRST: account/page.tsx read-error falls through to empty-state form → a save could overwrite
  a real profile with blanks (needs a transient DB read error at load + user submitting) → frontend-engineer.
- AccountBar Profile link plain <a> → next/link; avatar URL .max(2048) checked pre-normalization → backend.
- P1 P3s: next-param length/UX bound, 2 redirect UX edges, case-sensitive route classify (mitigated
  by page re-check + RLS) → backend-engineer.

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

SKILLS + CONTEXT (how each agent gets the right expertise on demand): CLAUDE.md (auto-loaded every
session) documents the 147-skill library at .claude/skills/. Discovery = read .claude/skills/MANIFEST.json,
filter by tags, load 3-5 SKILL.md files per CEO/lead, 2-3 per worker — NEVER preload. For Wave 2:
ai-engineer + llm-app-patterns + prompt-engineering-patterns + llm-evaluation (P7 tagging), and
supabase-rls-conventions + postgresql + nodejs-backend-patterns (P6 engine). All product context is
in the READ-FIRST docs above; the KOL-video-engine-spec.md (adr/0003) is P6's contract.

RULES: worktrees for all code (off main, from main-repo root via git -C); conventional commits;
NO merge without QA-Lead PASS + Founder confirm; migrations/auth/billing = Full/Irreversible;
deferred hardening gaps N2/N3/N4/NEW-3 stay deferred (do NOT build); leave a session file +
DECISIONS breadcrumb per wave; store-config v1.3 + design-system v2 are source of truth — extend
the apps/kol scaffold, never fork. Name/trademark: "KOL" is a working name, "Etsyc" has live
trademark risk (DECISIONS 2026-07-14) — clear before any public/API use.

Start with Wave 2: have the CTO return the P7→P6 dispatch packet, then spawn workers. The backend
is live and the keys are set — no Founder decision is needed to begin Wave 2.
```
