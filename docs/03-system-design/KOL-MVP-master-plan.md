# KOL MVP — Master Build Plan
*Authored 2026-07-19 · session `ceo-5` · CEO. The end-to-end plan the agent team runs to take KOL from locked concept → company-grade, production-ready MVP. Consumes [`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md) as ground truth.*

> **Deliverable of this plan:** a working, both-sides, production-grade KOL — seeded for the competition proof-of-concept, then cutover to real buyers + sellers. Built by orchestrated agent teams, each with the right skills, MCPs, specs, and QA gates.

---

## Operating principles for the whole build
- **Spec before code.** No build agent starts a feature without a full spec (Phase 5). Ambiguity is resolved upward, never guessed downward.
- **One renderer, one schema.** The store-config JSON schema (D4) and the video-engine contract (D5) are the two spines; everything conforms to them.
- **Reference-driven craft.** Every screen/section is built against annotated big-company references (Phase 1) as VIBE, not copy.
- **QA gate is sacred.** Risk-tier every PR; no merge without QA-Lead PASS + Founder confirm. DB migrations / auth / billing / agent-defs = Full/Irreversible.
- **Worktrees + atomic commits.** Every code worker in an isolated worktree branched from `origin/main`.
- **MCP-equipped agents.** Supabase (DB/RLS), Playwright (visual verify), Miro (reference boards + IA maps), Refero/Stitch/Pencil (design refs + generation), Figma (design system) — loaded on demand per task.

---

## The phases

### Phase 0 — Concept Lock ✅ (this session)
- **Goal:** get the *current* product out of Adam's head, resolve every branch of the design tree.
- **Output:** [`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md) — 13 locked decisions, buyer + seller journeys, guardrails, out-of-scope, open questions.
- **Gate:** ✅ Founder-confirmed via grill.

### Phase 1 — Reference & Inspiration Mining
- **Goal:** build a curated, annotated reference library so craft is company-grade and non-generic. *(Founder emphasized this twice — large-company inspiration is required, not optional.)*
- **Activities:** collect + screenshot + annotate references per surface, tagged with "what to steal":
  - **Feed / discovery (magazine, mixed-media):** Cosmos, Are.na, Pinterest, Behance, TikTok, Instagram Reels, Dwell/Kinfolk editorial.
  - **Immersive brand worlds / storytelling:** Apple product pages, Aesop, Bottega Veneta, Gucci, Nike SNKRS, Airbnb, Igloo/Active Theory award sites.
  - **Video commerce:** TikTok Shop, Whatnot, ShopShops, live-selling flows.
  - **Craft / motion / editorial polish:** Linear, Stripe, Vercel, Family, NYT/Bloomberg immersive features.
  - **Creator/store builders (for the seller side):** Cargo, Squarespace, Universe, Framer.
- **Agents / tools:** Research-Lead → researchers; `researcher` + Refero MCP (`refero_search_screens/flows/styles`), Playwright (screenshots), Miro (reference board), WebFetch/WebSearch. Skills: `frontend-design`, `high-end-visual-design`, `stitch-design-taste`.
- **Deliverable:** `docs/02-competitive/KOL-reference-library.md` + a Miro reference board + a screenshot set per surface, each annotated (what to steal / what to avoid).
- **Gate:** Design-Lead + Founder sign off on the visual direction before any UI is built.

### Phase 2 — Experience Architecture & Feature/Section Map
- **Goal:** decompose the whole product into features, sections, screens, and the two journeys — nothing invented at build time.
- **Activities:** information architecture; screen inventory; the buyer "world-unfolds" **interaction state machine** (feed → grow → unfold → scroll → shrink→narrate → product → checkout → thank-you); seller pipeline flow; map every feature to a surface + a data need + an MCP.
- **Agents / tools:** CPO + Design-Lead; Miro (IA + flow diagrams), `product-manager-toolkit`, `brainstorming` skills.
- **Deliverable:** `docs/04-features/KOL-feature-tree.md` (feature list + section catalog + screen map + interaction state machines). This is the index the spec pack (Phase 5) fills in.
- **Gate:** CPO + CEO review; every locked decision (D1–D13) traceable to features here.

### Phase 3 — Design System & Store-Engine Foundations
- **Goal:** the visual + structural rails that make D4 (block library) and D9 (anti-slop) real.
- **Activities:** design tokens; **curated palette + font + motion sets** (the anti-slop rails); the **block/section catalog** (hero-video, craft-story, product-showcase, voice-quote, process-reel, product-detail, reviews, thank-you…), each with variants + states; motion language; the **store-config JSON schema** (the contract every world conforms to); component skeletons in code.
- **Agents / tools:** Design-Lead → product-designer + frontend-engineer; Figma MCP (design system), Pencil/Stitch (generation), Playwright (visual QA), `tailwind-design-system`, `radix-ui-design-system`, `core-components`, `12-principles-of-animation`, `ui-typography`.
- **Deliverable:** design system + `docs/03-system-design/store-config.schema.md` + block catalog spec + coded component library shell.
- **Gate:** design-critic loop until company-grade bar met; QA-Lead PASS.

### Phase 4 — Data Model & AI/Video Engine Specs
- **Goal:** the technical spines fully specified before build.
- **Activities:**
  - **Supabase schema:** makers, buyers, stores (→ JSON config), blocks, products, media, **videos + video-profiles** (tags/purpose/page-eligibility/product-links), **voiceovers**, orders, verification/badges. RLS policies. Auth flows (buyer + seller). *(Irreversible tier — migrations.)*
  - **AI co-creation pipeline spec (D8/D9):** interview beat-sheet + adaptive follow-up framework; extraction schema (brand profile); generation → store-config JSON; the **auto-critic** (contrast/hierarchy/coherence scoring + regen); prompts, guardrails, model choices, evals/tests; cost logging.
  - **Video engine spec (D5):** eligibility filter + scoring signals + anti-repetition; the video-profile tagging pipeline; the AI-ranker upgrade slot.
- **Agents / tools:** CTO + database-engineer + ai-engineer; Supabase MCP, `supabase-rls-conventions`, `nextjs-supabase-auth`, `postgresql`, `ai-engineer`, `llm-app-patterns`, `prompt-engineering-patterns`, `llm-evaluation`, `agent-tool-builder`.
- **Deliverable:** `docs/03-system-design/adr/` entries + schema migration plan + AI pipeline spec + video engine spec.
- **Gate:** security-engineer + QA-Lead review on schema/RLS/auth; Founder sign-off on the Irreversible migration.

### Phase 5 — Per-Feature Full Specs
- **Goal:** turn the feature tree (Phase 2) into build-ready spec packs — the "full spec for each feature and each section" step.
- **Activities:** for each feature/section: user story, acceptance criteria, all 4 states (empty/loading/error/success), data contracts (against Phase 4 schema), references (Phase 1), the block/tokens it uses (Phase 3), required MCPs + skills, and its risk tier.
- **Agents / tools:** CPO + leads; `to-prd`, `writing-plans`, `api-design-principles`.
- **Deliverable:** `docs/04-features/specs/*.md` — one spec per feature, each independently grabbable by a build agent.
- **Gate:** CPO + CTO sign each spec "build-ready."

### Phase 6 — Build Team Launch & Execution
- **Goal:** build the working product in dependency order.
- **Build order (dependency-sequenced):**
  1. Foundations: Next.js app, Supabase auth (buyer+seller), schema migrations, design-system shell.
  2. Store renderer (JSON config → world) + block library.
  3. Video engine (eligibility+scoring+anti-repeat) + video-profile pipeline.
  4. Buyer journey: discovery feed → grow → unfold → scroll → shrink→narrate → product page.
  5. Checkout (Stripe test) → orders → thank-you video → order history.
  6. Seller pipeline: onboarding → AI interview → draft JSON → co-edit editor → voiceover recording → approve/publish.
  7. Anti-slop auto-critic + guardrails; trust badges (Real-Maker + AI-Transparency).
  8. Polish pass (motion, micro-interactions, craft density) against references.
- **Agents / tools:** CTO orchestrates; frontend-engineer, backend-engineer, database-engineer, ai-engineer, product-designer, design-polisher in parallel worktrees; QA-Lead + code-reviewer + security-engineer + test-engineer + design-critic as out-of-band validators; Playwright for E2E; all relevant skills on demand.
- **Deliverable:** deployed, working KOL (staging).
- **Gate:** risk-tiered QA on every PR; QA-Lead PASS + Founder confirm before each merge to main.

### Phase 7 — Seed, Dogfood & Demo Prep (Pre-MVP / Proof-of-Concept)
- **Goal:** the competition-ready proof-of-concept.
- **Activities:** produce the 4 teammate worlds (3 pre-built via pipeline + hand-polish to pixel-perfect; 1 rehearsed to build **live** in the demo); tag all footage into video-profiles; record key voiceovers; write + rehearse the demo script; dogfood to confirm the stories land as impact + connection + trust.
- **Agents / tools:** CMO (demo narrative), Design-Lead (polish), the team (as makers). Playwright for demo dry-runs.
- **Deliverable:** seeded staging environment + demo script + live-pipeline rehearsal.
- **Gate:** full dry-run passes; Founder sign-off.

### Phase 8 — Real-User Cutover (Final MVP)
- **Goal:** open both sides to real buyers + sellers.
- **Activities:** clear or archive-for-proof the teammate demo content (per D13); production hardening; onboard first real maker(s) end-to-end; open buyer signups; monitoring + support loop.
- **Agents / tools:** CTO + devops-engineer (prod deploy, staging-first, rollback plan), CCO (onboarding/support), security-engineer (pre-prod audit).
- **Deliverable:** production KOL live, real users on both sides.
- **Gate:** security PASS; Founder go-live confirm.

---

## Phase dependency map
```
P0 Concept Lock ✅
      │
      ├──> P1 References ─────────┐
      │                          ▼
      └──> P2 Feature Map ──> P3 Design System + Store Engine ──┐
                    │                                           ▼
                    └──────────> P4 Data + AI/Video Specs ──> P5 Per-Feature Specs
                                                                   │
                                                                   ▼
                                                        P6 Build (dependency-ordered)
                                                                   │
                                                                   ▼
                                                        P7 Seed + Demo (Pre-MVP)
                                                                   │
                                                                   ▼
                                                        P8 Real-User Cutover (Final MVP)
```
P1 and P2 can run in parallel immediately. P3 needs P1+P2. P4 needs P2. P5 needs P3+P4. Build (P6) is gated on P5.

## Immediate next step
Kick off **Phase 1 (References)** and **Phase 2 (Feature Map)** in parallel — both are unblocked now. Everything else waits on their outputs.
