# KOL Front-End Rebuild — Design Dispatch Brief
*CEO · session `ceo-6` · 2026-07-22 · Founder-directed pivot. This is the single source of truth for the clean-slate front-end rebuild.*

> **The pivot, in one line:** archive the 33k-LOC v1 build and rebuild the KOL front-end from scratch as **screens only** — a complete-feeling product UI — using **one design model with maximum creative freedom**, the **impeccable** skill as the craft engine, and the founder-curated reference set as the quality bar. Backend, database, and OAuth do **not** need to work; the screens do.

---

## Non-negotiables (Founder-set)
1. **Screens only.** No working backend / DB / auth. Mock all data. Every screen must *look and feel* like a finished, shippable product.
2. **One model, freedom-first.** A single design agent builds the pages. It is given the *page concept* and the *reference bar* — **no design system, no palette cap, no layout spec**. It invents the visual world. (Model: Founder to confirm — see Open Items.)
3. **References are the bar, not a template.** Chase the *quality and feeling* of the references; do not copy them.
4. **Stock images at the start** (Unsplash / Pexels source URLs). Real footage/photography comes later.

## Stack (best-in-class for complex, animated UI)
- **Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind**
- **Framer Motion** for motion (add GSAP only if a signature beat needs it)
- **Phosphor Icons** — `@phosphor-icons/react` — the icon system for the whole product *(Founder-set)*
- Mock data layer only (typed fixtures); no Supabase/Stripe wiring in this pass.

## Craft engine — the skill kit given to the design model
- **`impeccable` (v4.0.1, primary)** — award-winning design-director skillset. Run its setup (`node .claude/skills/impeccable/scripts/context.mjs`), `/impeccable init` to write PRODUCT.md + DESIGN.md, then use `craft`/`shape` for new surfaces and `audit`/`critique`/`polish` in the QA loop. Its anti-slop detectors + craft-floor are load-bearing here.
- **`emilkowal-animations`** — motion best-practices, loaded when choreographing the signature moments.
- Impeccable owns the taste direction; it *replaces* the earlier proposed kit (high-end-visual-design / design-taste-frontend / frontend-design) rather than stacking with it.

## The reference bar (founder-curated — `docs/research/references/`)
Authoritative read: **`docs/research/references/NARRATIVE.md`** and **`docs/02-competitive/KOL-reference-library.md`**. Corrected direction:

> **Warm + human (Faire / Kotn) melded with modern + cinematic (Lusion / Cuberto). Reject the transactional grid (TikTok Shop / Complex).**

| Ref | Screenshot | What to take |
|---|---|---|
| **Faire** | `faire.png` | Brave color-blocked sections, real founder portraits + quotes, marketplace-scale trust + humanity |
| **Kotn** | `kotn.png` | Huge, confident display type over full-bleed human photography; people lead every frame |
| **Lusion** | `lusion.mov` | Cinematic WebGL motion ceiling — fluid spatial transitions, real depth (the "world unfolds" / video-dock aspiration) |
| **Cuberto** | `cuberto.png` | Modern dark↔light, 3D objects, one memorable liquid/gooey signature interaction |
| **TikTok Shop / Complex** | `shop-tiktok.png`, `complex-shop.png` | **ANTI-PATTERN** — dense deal-grids, urgency chyrons, discount badges. KOL is the opposite. |

Direction (from NARRATIVE.md): **bold BIG statement type · warm-but-vivid color-blocking · cinematic/physical motion with a signature liquid/3D moment · video-forward, human-first, never a product grid.**

## Page concept list (concept only — the model designs each freely)
Derived from the locked buyer/seller journeys in `docs/01-foundation/KOL-v2-concept-lock.md`. No design constraints attached — each is *what the screen is for*, not how it looks.

**Buyer:** Discovery Feed (magazine, mixed-media, never a grid) · Expanded-video state · Maker World (unfolds around the playing video) · Product page · Checkout · Thank-you / order confirmation · Account (orders, follows, saves) · Search / Browse (maker-first results) · Sign-in.
**Seller:** Onboarding explainer · AI interview (film/voice) · Store editor (block co-edit) · Seller dashboard.

**Build page 1 first as the quality anchor: the Discovery Feed** (the product's soul). QA it hard, then continue. *(Founder may swap page-1 to the Maker World — see Open Items.)*

## QA gate (before rolling past page 1)
1. **`impeccable audit` + `impeccable critique`** on the built screen (deterministic detectors + craft critique).
2. **design-critic** subagent — taste/craft vs. the reference bar (Playwright screenshots).
3. **code-reviewer** subagent — React/TS/Tailwind quality, all 4 states, no placeholder UI.
Iterate until it clears the bar. Only then build the rest.

## Archive plan (git-safe, reversible)
`git mv apps/kol → .archive/kol-v1-2026-07-22/` on branch `ceo-6-…`. All 33k LOC + every feature branch stays in git history. New build starts at an empty `apps/kol/`. Strategy docs, the concept lock, and the reference library are **kept** — they feed the rebuild.

## Open items (Founder)
- [ ] **Model pick** — which single model is the design model (Opus 4.8 = strongest for taste/animation; Fable 5 = prior build pick). CEO recommends Opus 4.8.
- [ ] **Page-1 anchor** — Discovery Feed (recommended) or Maker World.

## Status
- [x] `impeccable` v4.0.1 installed (`.claude/skills/impeccable/` + 3 subagents) and registered in MANIFEST.
- [x] Phosphor Icons chosen as the icon system.
- [x] Reference set located + read (`docs/research/references/`, NARRATIVE.md, reference-library).
- [ ] Archive v1 + scaffold + build page 1 — **awaiting model pick to launch the design agent.**
