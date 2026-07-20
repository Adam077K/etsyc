# Handoff — KOL Build Planning (Phase 4 →)
*From session `ceo-5` · 2026-07-19 · for a fresh session to start planning the creation/build. Runs on **Fable 5** (`claude-fable-5`).*

## Your job
Pick up KOL and **start planning the build** — Phase 4 onward in the master plan. You are the CEO/orchestrator; delegate to C-suite + workers, don't implement yourself. Everything conceptual is locked; your job is to turn locked decisions into build-ready specs, then execute.

## Read first (do NOT re-derive — it's all written)
1. **`docs/KOL-START-HERE.md`** — the canonical entry point (60-sec what-is-KOL + full reading path).
2. **`docs/01-foundation/KOL-v2-concept-lock.md`** — the ground truth: **16 locked decisions (D1–D16)**. Read all of them.
3. **`docs/03-system-design/KOL-MVP-master-plan.md`** — the phased plan (you're entering **Phase 4**).
4. **`docs/04-features/KOL-feature-tree.md`** — ~39 MVP features incl. the §1D Missing-Features Addendum (D16).
5. **`docs/03-system-design/KOL-design-system.md`** (v2) · **`store-config.schema.md`** · **`docs/research/references/NARRATIVE.md`** — design direction + the store-engine contract.
6. **`.claude/memory/DECISIONS.md`** + **`LONG-TERM.md`** — decision log + cross-session state.

## State (as of GitHub `main` @ commit `b454ab2`, all synced)
- **Phases 0–3 done:** concept lock · reference mining · feature map · design-system v2.
- **Design direction settled:** v2 (bold + warm + cinematic, from Faire/Kotn/Lusion/Cuberto). 5 palettes + 4 pairings + motion presets. **This is KOL's OWN product identity + shop starting points.**
- **D15 (critical):** seller shops get **FULL brand freedom** — the AI derives a coherent custom design system per shop; anti-slop is held by the **auto-critic + maker approval**, NOT a palette cap. → The AI pipeline + critic are now **load-bearing**.
- **D16:** 8 "final missing features" folded in — **7 MVP** (Two Shopping Modes/search, Proof of Product, Ask the Maker, Exactly What to Expect, enriched Reviews, **FULL Guided Co-Creation w/ messaging+drafts**, Relationship-Based Ranking) + **1 roadmap** (Live Studio Sessions). Adds two new subsystems: **buyer↔maker messaging+draft-versioning** and **search/browse**.

## The most consequential locks to honor (compact)
Desktop-first web (Next.js) · Supabase Auth buyers+sellers · store = **section/block library + per-maker JSON config, one renderer** (AI emits data, never code) · **unified rules+context video engine** (discovery+store+contextual narration) · KOL-owned **Stripe test-mode** checkout · Real-Maker + AI-Transparency badges · seller **co-creation loop** (interview→AI draft JSON→co-edit→approve) · **3-layer anti-slop** (constrained primitives + auto-critic + human gate) · seller shops = **full freedom, critic-guaranteed (D15)** · app lives in **`apps/kol/`** (not scaffolded yet).

## What to do next (Phase 4 — highest leverage)
Spawn (via CTO) parallel spec work — these are now the load-bearing pieces:
1. **Supabase data model** — all `Data need` tables from the feature tree, incl. new D16 tables: `threads`, `messages`, `commissions`, `commission_drafts`, `questions`, `answers`, `follows`, `saves`, `product_specs`, `product_provenance`, `review_media` (+ `verified`/`maker_response` on reviews). Migrations = **Irreversible tier** → database-engineer first, Founder sign-off.
2. **AI pipeline spec (load-bearing per D15):** interview → extraction → **brand input → coherent custom design system derivation** → store-config JSON → **auto-critic** (contrast/AA/hierarchy/coherence, auto-regen) → maker approval. Prompts, guardrails, models, evals, cost logging.
3. **Video engine spec** — eligibility + scoring + anti-repetition + video-profile tagging; AI-ranker upgrade slot.
Then **Phase 5** (per-feature specs → `docs/04-features/specs/`), then **Phase 6** (build in `apps/kol/`, dependency-ordered, QA-gated).

## Open threads (minor, non-blocking)
- v2 design system was never *formally* re-signed after the D15/D16 pivots — treat as accepted (KOL product identity + shop starting points) unless Founder reopens.
- Open Q from Design-Lead: add a **6th "cool-gallery" palette**? (low stakes now — sellers have full freedom anyway.)
- `lusion.mov` (motion reference) is local-only/git-ignored; agents can't watch video. If a specific motion beat matters, Founder must describe it to tune the `dimensional` motion preset.
- Founder wants the build agents/sessions to run on **Fable 5**.

## Build orchestration model (Fable) — Founder-specified
All agents run on **Fable 5** (`claude-fable-5`). The build separates *making* from *verifying* — the maker never grades its own work:

- **Design-Build agent (Fable) — one agent does BOTH design + build** for a unit of work (feature/screen). Unified on purpose so design intent isn't lost in a designer→coder handoff. Equip each with:
  - **Skills:** `frontend-design`, `nextjs-app-router-patterns`, `tailwind-design-system`, `radix-ui-design-system`, `12-principles-of-animation`, `ui-typography` (+ backend/AI skills when the unit needs them).
  - **Docs (must-read):** `KOL-START-HERE.md`, the relevant Phase-5 spec, `KOL-design-system.md` (v2), `store-config.schema.md`, `KOL-block-catalog.md`, and the reference screenshots in `docs/research/references/`.
  - **Tools:** Read/Write/Edit/Bash + Playwright (visual self-check) + Supabase (data) + Figma/Pencil (design) as needed.
  - **Identity:** `/color` + `/name design-build-[feature]`; isolated git worktree off `apps/kol/`.
  - **Guardrails ("diet"):** honor D1–D16; anti-slop rails (D9); seller-shop full freedom + critic (D15); **no placeholder UI**, all 4 states, brand-compliant; atomic commits; return structured JSON.
- **Independent QA / Test agents (Fable) — separate agents, never the builder.** They verify against the spec:
  - **test-engineer** (unit/integration/E2E via Playwright), **code-reviewer**, **security-engineer**, **adversary-engineer** (Full/Irreversible), **design-critic** (visual/brand quality = the D9 auto-critic in the loop).
  - Equip with QA skills (`qa-gate-protocol`, `testing-patterns`, `web-security-testing`, `wcag-audit-patterns`), read-access tools, and the spec + acceptance criteria to test against.
  - **QA-Lead (Fable)** risk-tiers the diff, runs the right reviewers, emits one **PASS/BLOCK**. CEO/CTO cannot override a BLOCK — only Founder can.
- **Orchestrator (this session, Fable):** plans, sequences, delegates, gates, syncs GitHub. Never implements.
- **GitHub discipline:** commit on branch, ff `main`, push. docs/planning = Trivial; migrations/auth/billing = Full/Irreversible → **QA-Lead PASS + Founder confirm before merge**.

## The prompt to launch the next session
A ready-to-paste launch prompt accompanies this handoff (see the CEO's message that delivered this file). It encodes: run on Fable 5 · read the docs above · start Phase 4 · use the Design-Build-vs-independent-QA model.

## Suggested skills to invoke
- **Planning:** `writing-plans`, `to-prd`, `product-manager-toolkit`, `api-design-principles`
- **Data/backend:** `supabase-rls-conventions`, `nextjs-supabase-auth`, `postgresql`, `nodejs-backend-patterns`, `database-design`
- **AI pipeline (load-bearing):** `ai-engineer`, `llm-app-patterns`, `prompt-engineering-patterns`, `llm-evaluation`, `agent-tool-builder`, `rag-engineer`
- **Frontend/design build:** `nextjs-app-router-patterns`, `frontend-design`, `tailwind-design-system`, `radix-ui-design-system`, `12-principles-of-animation`, `ui-typography`
- **Commerce:** `stripe-integration`
- **Process:** `using-git-worktrees`, `qa-gate-protocol`, `board-meeting-protocol` (for any irreversible call)
