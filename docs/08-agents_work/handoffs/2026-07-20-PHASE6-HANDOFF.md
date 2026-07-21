# Handoff — KOL Phase 6 (Build) + the still-deferred migration apply
*From session `ceo-phase5` · 2026-07-20 · for a fresh session to pick up KOL and BUILD. Orchestration on **Opus**; all BUILD agents on **Fable 5** (`claude-fable-5`).*

## Your job
Phases 0–5 are **done and merged to `main`**. Phase 5 shipped **32 build-ready specs (40 MVP features)**, both chiefs **BUILD-READY**. Pick up KOL and do, in dependency order:
1. **(Founder-gated, Irreversible — arrange during Wave 0) Apply the data-model migration.** It is a reviewed PLAN — nothing has touched Supabase. Run the mandatory 9-point staging validation, then apply on Adam's sign-off. This becomes the critical path at the head of Wave 1.
2. **Phase 6 — build in `apps/kol/`**, dependency-ordered per the **[Phase-6 Build Wave Plan](../../03-system-design/KOL-phase6-build-plan.md)** (Waves 0→6), QA-gated per PR.

You are the CEO/orchestrator — plan, sequence, delegate, gate, sync GitHub. **Never implement.**

## Read first (do NOT re-derive — it's all written and merged)
1. **`docs/KOL-START-HERE.md`** — canonical entry point.
2. **`docs/01-foundation/KOL-v2-concept-lock.md`** — ground truth: 16 locked decisions (D1–D16).
3. **`docs/03-system-design/KOL-phase6-build-plan.md`** — **your build sequence** (waves, worker types, parallelism, risk tiers, migration gating, RICE effort, orchestration notes).
4. **`docs/04-features/specs/`** — the **32 build-ready specs** (one per feature; store-engine spine as one pack). Each Design-Build worker reads ONLY its feature's spec + the packet contract slice.
5. **`docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md`** — the CPO briefs (Part A) + CTO data-contract/risk map (Part B). Part B §B0 = the global RLS/contract rules every DB-backed PR restates.
6. **Contracts every builder cites:** `adr/0001-kol-data-model.md` (31-table schema PLAN + the "9-point staging validation") · `adr/0002` + `KOL-ai-pipeline-spec.md` (AI pipeline + evals/cost-log) · `adr/0003` + `KOL-video-engine-spec.md` (video engine + 8-state query map) · `store-config.schema.md` v1.3 (the D4 spine) · `docs/04-features/KOL-block-catalog.md`.
7. **`apps/kol/`** — the scaffolded shell (Next 16/React 19/strict TS/Tailwind, design-system-v2 tokens, 11 blocks × 4 states, `renderStore` for both `theme.kind`, Sena+Noor fixtures, `/preview`). **Shell only — no backend/auth/DB (mock fixtures).** Wave 0 hardens this to spec; it does NOT start from zero.
8. **`.claude/memory/DECISIONS.md`** (top = Phase-5 close) + **`LONG-TERM.md`**.

## State (as of GitHub `main` @ `c52fa08`, all synced & pushed)
- **Phases 0–5 done.** 32 specs / 40 MVP features merged. CPO + CTO **BUILD-READY** (0 P1 technical errors).
- **Risk tiers (CTO-authoritative):** P1/P3 Irreversible · P4/P5/P6/P7 Full · P8 Lite · P12 Full/Lite; B9 Lite. Every Data-need migration is independently Irreversible (database-engineer first).
- **Founder decisions (2026-07-20):** deferred hardening gaps N2/N3/N4/NEW-3 **accepted for seeded MVP** (post-launch, do NOT build in Phase 6 — each = a future Irreversible migration); B11 search scope **deferred to Phase-6 planning**.

## ⚠️ The item that is NOT done (Founder-gated, Irreversible)
**The 31-table migration is a PLAN — nothing has touched Supabase.** Per the build plan §2:
- **Wave 0 needs no DB** (P3 Zod + P4/P5/P8 render from mock fixtures) — start immediately.
- Wave 1+ needs the schema. A `database-engineer` can apply to a **local/throwaway Supabase** for scratch validation, but **merge + cross-worker integration of Wave 1+ is hard-blocked until Adam applies to a shared staging Supabase.**
- **Ask Adam at Wave-0 kickoff** (so it clears before Wave 1): (1) provision staging Supabase + keys/env; (2) approve the 9-point validation run; (3) on PASS → Founder-gated apply (Irreversible + sign-off) = the go-signal for Wave 1 merges.

## Build order (locked — the full wave plan has the detail)
`Wave 0` render spine (P3→P4/P5/P8, mock fixtures, START NOW) → `Wave 1` migration apply + P1 auth → P2 → `Wave 2` P7 tagging → P6 engine → `Wave 3` buyer core B1–B8 (+ S8 pulled forward for the price contract; B7 checkout = Stripe TEST-MODE) → `Wave 4` seller pipeline S1–S9 + publish gate (P9→P10→S9→S6) + **P15 messaging (before B12/B14)** → `Wave 5` buyer aux (B6+, B9, B12, B14, B13, P6+, B10, B11) → `Wave 6` polish. Serial edges (never parallelize across): migration→P1→P2, P7→P6, S8→B6→B7→B8, P9→P10→S9→S6.

## Two open product decisions to get from Adam before their wave
1. **S9 voice-anchor verification mechanism** (before Wave 4b). Research done: **`docs/research/references/2026-07-20-voice-anchor-verification.md`**. Key unblock: **"voice-anchored" is build-not-buy** (self-serve liveness is face-only). Recommended MVP = **founder human-in-the-loop for the 4 seeds** (review a challenge-response clip → mint the badge manually) — fully honest, zero vendor, ships now, and S9 is NOT blocked. Scale path = native challenge-response + ~$0.015 face-liveness + manual review. Decision Adam owns: what the badge asserts ("live human + voice anchor" vs "legal identity").
2. **B11 search scope + delivery-requirements filter field** (before Wave 5). Adam deferred to Phase-6 planning: first-wave vs fast-follow, and the undefined delivery-filter source field.

## Build orchestration model (Fable) — Founder-specified, carry forward
All **build** agents run on **Fable 5**. Separate *making* from *verifying* — the maker never grades its own work:
- **Design-Build agent (Fable) — one agent does BOTH design + build** for a unit (feature/screen). **One unit per worker** (the ~19-tool-use turn cap truncates heavy batches — pre-split P6→2, S4→2). **Use Bash-capable worker types** (Fable Design-Build / database/backend/ai-engineer) — NOT `technical-writer` (no Bash; it can't worktree or commit — a Phase-5 learning). Isolated worktree off `main`; honor D1–D16, D9 anti-slop rails, D15 seller freedom; no placeholder UI, all 4 states, brand-compliant; atomic commits; structured JSON returns.
- **Independent QA/Test agents (Fable) — separate from the builder:** QA-Lead risk-tiers the diff, spawns the reviewer set (code-reviewer, qa-engineer, security-engineer + adversary-engineer on Full/Irreversible, design-critic for the D9 visual/brand gate), emits ONE PASS/BLOCK. **CEO/CTO cannot override BLOCK — only Adam.** Max 2 QA cycles/ticket.
- **Every DB-backed PR restates B0** (RLS is the only boundary; no client-set price/`buyer_id`/`role`/status) + cites its exact tables/RPCs. `qa-tier-floor.yml`: `*.sql`, auth, billing → Full/Irreversible min.
- **AI features ship with eval + cost-log or they don't ship** (P7, S2, S3, P9) — QA-Lead verifies both.

## Orchestration lessons from Phase 5 (worth repeating)
- **T2 dispatch-packet worked:** CPO+CTO returned a paste-ready packet → CEO spawned workers → CPO+CTO reviewed → surgical fix pass → merge. Chiefs are the expertise layer.
- **`technical-writer` has no Bash** — the CEO had to gather + commit its files. For build, confirm Bash in the worker's tool list before dispatch.
- **The ~19-tool-use turn cap truncates heavy batches** — W4 (10 files) stopped at 7 and was recovered by **resume-via-message** (SendMessage to the same agent). Size workers to one unit; on PARTIAL, resume rather than re-dispatch.
- **Load-bearing invariants must be structural tests, not prose:** thankyou-never-in-feed (positive FEED predicate), create_order server-side price binding, AA-gate-before-LLM-and-dispositive, private-messaging-separate-from-public-Q&A.

## Open threads (minor, non-blocking)
- **RICE effort** now estimated for the 14 spine/buyer-core features (build plan §3) — patch into the specs' RICE tables opportunistically; MoSCoW=Must already drives sequencing.
- v2 design system never *formally* re-signed after D15/D16 (Adam deferred) — treat as accepted.
- OQ-V3: video scoring weights are launch defaults, tuned post-launch against real `buyer_signals`.
- Name/trademark: "KOL" is a working name; "Etsyc" has live trademark risk (DECISIONS 2026-07-14). Clear before any public/API use.

## Suggested skills
- **Build (Fable):** `nextjs-app-router-patterns`, `frontend-design`, `tailwind-design-system`, `radix-ui-design-system`, `12-principles-of-animation`, `ui-typography`, `react-patterns`
- **Data/backend:** `supabase-rls-conventions`, `nextjs-supabase-auth`, `postgresql`, `nodejs-backend-patterns`
- **AI pipeline:** `ai-engineer`, `llm-app-patterns`, `prompt-engineering-patterns`, `llm-evaluation`, `agent-tool-builder`
- **Commerce:** `stripe-integration` (test-mode)
- **Process:** `using-git-worktrees`, `qa-gate-protocol`, `board-meeting-protocol` (any irreversible call)
