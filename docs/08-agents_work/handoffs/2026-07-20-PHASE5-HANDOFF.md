# Handoff — KOL Phase 5 (Per-Feature Specs) + the Phase-4 apply gate
*From session `ceo-6` · 2026-07-20 · for a fresh session to pick up KOL after Phase 4. Runs on **Fable 5** (`claude-fable-5`) for build; **Opus** for spec/synthesis if you prefer.*

## Your job
Phases 0–4 are **done and merged to `main`**, and **Phase 3 is now formally CLOSED** (design-critic gate run + PASS; design-system v2 reconciled; **`apps/kol` scaffolded** with the coded component shell). Pick up KOL and do **two things, in this order of dependency**:
1. **(Founder-gated, do first when Adam is ready) Apply the data-model migration** — it is a reviewed PLAN, not applied. Run the mandatory staging validation, then apply on Adam's sign-off.
2. **Phase 5 — per-feature spec packs.** Turn the 39-feature tree into build-ready specs in `docs/04-features/specs/`, each citing the now-locked schema + engine contracts. Then Phase 6 (build in `apps/kol/` — the shell is already scaffolded; you extend it).

You are the CEO/orchestrator — delegate to C-suite + workers, don't implement yourself.

## Read first (do NOT re-derive — it's all written and merged)
1. **`docs/KOL-START-HERE.md`** — canonical entry point (60-sec what-is-KOL + reading path).
2. **`docs/01-foundation/KOL-v2-concept-lock.md`** — ground truth: **16 locked decisions (D1–D16)**.
3. **`docs/03-system-design/KOL-MVP-master-plan.md`** — you're entering **Phase 5** (specs) → **Phase 6** (build).
4. **`docs/04-features/KOL-feature-tree.md`** — ~39 MVP features (§1A–1D). This is the index Phase 5 fills in.
5. **Phase-4 outputs (the contracts every Phase-5 spec cites):**
   - **`docs/03-system-design/adr/0001-kol-data-model.md`** + **`docs/03-system-design/migrations-plan/01..13_*.sql`** — the 31-table schema PLAN (non-applied), RLS, RPCs/triggers, and the **"Pre-apply staging validation (MANDATORY)"** + "Post-MVP hardening" sections.
   - **`docs/03-system-design/adr/0002-ai-co-creation-pipeline.md`** + **`docs/03-system-design/KOL-ai-pipeline-spec.md`** — the seller AI pipeline (interview→brand→custom design system→auto-critic→approval), 6 per-feature evals, cost logging.
   - **`docs/03-system-design/adr/0003-video-engine.md`** + **`docs/03-system-design/KOL-video-engine-spec.md`** — unified selection engine, tagging, ranker slot, relationship ranking; shared eval-harness contract (agreed with the AI pipeline).
   - **`docs/03-system-design/store-config.schema.md` (v1.3)** — the D4 spine. **`theme` is a `discriminatedUnion('kind',[curated|custom])`** (D15); curated enums are the **design-system v2** ids (`sunbaked·market-plum·cuberto-noir·orchard·bazaar` / `statement-grotesk·warm-serif·modern-mono-grotesk·character-maximal` / motion `hushed·fluid·liquid·dimensional`); optional maker-authored thank-you `message` field (D10); the `get_public_profile(uuid)` fn replaces the old profiles view.
   - **`apps/kol/`** — the scaffolded component shell: Next 16/React 19/strict TS/Tailwind; design-system-v2 tokens; **11 blocks × 4 states**; `renderStore` (both `theme.kind`); Sena (curated) + Noor (custom any-hex) fixtures; `/preview`. **Shell only — no backend/auth/DB yet (mock fixtures).** The per-palette AA-measured `--accent-cta` token is the concrete anti-slop AA gate.
6. **`.claude/memory/DECISIONS.md`** (top entry = 2026-07-20 Phase-3 closure) + **`LONG-TERM.md`**.

## State (as of GitHub `main` @ commit `6e37803`, all synced & pushed)
- **Phases 0–4 done; Phase 3 formally CLOSED** (gate run + `apps/kol` scaffolded, QA-Lead PASS). Phase 4 shipped the two technical spines (data model + AI/video engine specs), all QA-passed.
- **Schema QA (Irreversible):** 2 BLOCK cycles → **PASS**. Cycle-1 closed 5 P1 write/trust-integrity holes (root cause: RLS is the only boundary — app-side column allow-lists are bypassable via direct PostgREST). Fix moved all enforcement DB-side (**10 SECURITY DEFINER fns, 6 triggers**). Cycle-2 closed an anon-enumerable user view + a null-uid service-role footgun. Cycle-3 PASS.
- **Phase-3 closure QA (Full):** the design gate caught a schema↔design-system **v2 enum drift** (schema still had rejected-v1 palette/pairing/motion names — would have hard-blocked every builder) → reconciled to **store-config v1.3**. Scaffold QA caught + fixed a library-wide **Tailwind alpha-modifier bug** (green build hid it; only code+visual review found it) and a **fabricated attributed maker quote** (D10). QA-Lead PASS. 7 P3 follow-ups tracked in `docs/08-agents_work/sessions/2026-07-20-qa-lead-kol-phase3-closure.md`.
- **D15 is expressible:** store-config theme union (curated | custom); anti-slop for seller shops is the **deterministic WCAG-AA gate + auto-critic + maker approval**, not a palette cap — now concrete as the `--accent-cta` AA-measured token in the scaffold.
- **B/C specs share one eval-harness contract** (dataset/metric/cost-log shapes agreed) — implement it once in `apps/kol/src/lib/agents/evals/` (placeholder dir already scaffolded).

## ⚠️ The Phase-4 item that is NOT done (Founder-gated, Irreversible)
**The migration is a PLAN — nothing has touched Supabase.** Before it is applied:
- **Run the mandatory 9-point staging validation** in `adr/0001-kol-data-model.md` — apply-run the full bundle on a scratch staging branch (catches `search_path=''` typos static review can't), then probe with an **anon key + buyer JWT + seller JWT + service role**. The two load-bearing runtime checks: (a) anon `get_public_profile` returns only the one requested row, never a set; (b) `create_order` ignores client prices / binds `buyer_id` / rejects unpublished+cross-store+qty≤0.
- **Then apply on Adam's explicit sign-off.** QA-Lead PASS = readiness, NOT apply authorization. This needs Supabase MCP/access, which the Phase-4 workers did not have.
- **4 P3 tech-debt follow-ups** are documented in ADR-0001 "Post-MVP hardening" (commission_drafts status guard; set_order_status from-state machine; create_order inventory check; badge revoke on later-rejected verification) — schedule, don't block.

## What to do next — Phase 5 (per-feature full specs)
Spawn (via CPO + CTO) parallel spec work — one build-ready spec per feature/section into **`docs/04-features/specs/*.md`**. Each spec must contain: user story · acceptance criteria · **all 4 states (empty/loading/error/success)** · data contract (against the Phase-4 schema tables) · references (Phase-1 library + `docs/research/references/`) · the block/tokens it uses (store-config v1.1) · required MCPs + skills · risk tier. Suggested batching by subsystem:
- **Store engine & renderer** (P3/P4/P5 + block catalog) — the JSON-config→world renderer; the two spines.
- **Buyer journey** (B1–B14 + the 8-state machine): discovery feed → grow → world-unfold → scroll → shrink→narrate → product → checkout (Stripe test) → thank-you; + search/browse (B11), Ask-the-Maker (B12), follow/save (B13), commissions (B14), enriched reviews.
- **Seller pipeline** (S1–S9 + P15 messaging/drafts): onboarding → AI interview → draft JSON → co-edit → voiceover → approve/publish; buyer↔maker messaging + draft-versioning.
- **Trust & anti-slop** (P9/P10/P11/P13/P14): auto-critic, approval gate, badges, provenance, "exactly what to expect."
**Gate:** CPO + CTO sign each spec "build-ready" before Phase 6.

Then **Phase 6** — build in `apps/kol/` (not scaffolded yet), dependency-ordered (foundations → store renderer → video engine → buyer journey → checkout → seller pipeline → anti-slop → polish), QA-gated per PR.

## Build orchestration model (Fable) — Founder-specified, carry forward
All **build** agents run on **Fable 5**. Separate *making* from *verifying* — the maker never grades its own work:
- **Design-Build agent (Fable) — one agent does BOTH design + build** for a unit (feature/screen). Skills: `frontend-design`, `nextjs-app-router-patterns`, `tailwind-design-system`, `radix-ui-design-system`, `12-principles-of-animation`, `ui-typography` (+ backend/AI skills as the unit needs). Docs: `KOL-START-HERE.md`, the relevant Phase-5 spec, `store-config.schema.md` v1.1, `KOL-block-catalog.md`, the reference screenshots in `docs/research/references/`. Tools: Read/Write/Edit/Bash + Playwright + Supabase + Figma/Pencil. Identity `/color`+`/name design-build-[feature]`; isolated worktree off `apps/kol/`. Guardrails: honor D1–D16; D9 anti-slop rails; D15 seller-shop freedom + critic; **no placeholder UI, all 4 states, brand-compliant**; atomic commits; structured JSON returns.
- **Independent QA/Test agents (Fable) — separate from the builder:** test-engineer, code-reviewer, security-engineer, adversary-engineer (Full/Irreversible), design-critic (the D9 visual/brand critic). **QA-Lead risk-tiers, runs reviewers, emits one PASS/BLOCK. CEO/CTO cannot override BLOCK — only Adam.**
- **Orchestrator (your session):** plan, sequence, delegate, gate, sync GitHub. Never implement.
- **GitHub discipline:** commit on branch, ff `main`, push. Docs/planning = Trivial; migrations/auth/billing = Full/Irreversible → QA-Lead PASS + Founder confirm before merge.

## Orchestration lessons from Phase 4 (worth repeating)
- **Schema-first paid off** — the two engine specs cited real locked tables, not invented ones.
- **The T2 dispatch-packet model worked:** CTO returns a paste-ready worker brief → CEO spawns the worker → validators out-of-band → QA-Lead consolidates one verdict. Chiefs are the expertise layer.
- **Independent adversary review earns its keep** — it caught the anon-enumeration view the security reviewer had rated "acceptable." On Irreversible tier, run adversary + let QA-Lead adjudicate splits (most-paranoid-wins).
- **"Enforced app-side" is a vulnerability, not a design** — in this stack RLS is the only boundary; DB-enforce every column/transition rule.

## Open threads (minor, non-blocking)
- v2 design system was never *formally* re-signed after D15/D16 (Adam deferred) — treat as accepted (KOL product identity + shop starting points).
- 6th "cool-gallery" palette — deferred, low stakes (sellers have full freedom via `kind:"custom"`).
- OQ-V3: video scoring weights are launch defaults, tuned post-launch against real `buyer_signals`.
- MVP fonts = a hosted catalog ("any font" in practice); arbitrary font-file upload = roadmap.
- Name/trademark: "KOL" is a working name; "Etsyc" has live trademark risk (DECISIONS.md 2026-07-14). Clear before any public/API use.

## Suggested skills to invoke
- **Planning:** `writing-plans`, `to-prd`, `product-manager-toolkit`, `api-design-principles`
- **Build (Fable):** `nextjs-app-router-patterns`, `frontend-design`, `tailwind-design-system`, `radix-ui-design-system`, `12-principles-of-animation`, `ui-typography`
- **Data/backend:** `supabase-rls-conventions`, `nextjs-supabase-auth`, `postgresql`, `nodejs-backend-patterns`
- **AI pipeline (load-bearing):** `ai-engineer`, `llm-app-patterns`, `prompt-engineering-patterns`, `llm-evaluation`, `agent-tool-builder`
- **Commerce:** `stripe-integration`
- **Process:** `using-git-worktrees`, `qa-gate-protocol`, `board-meeting-protocol` (for any irreversible call)
