# World Unfold (B3)

<!-- Buyer core state machine · state WORLD_OPEN · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | World Unfold |
| **Feature Slug** | world-unfold |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 5 — buyer-core specs |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 8 | Every buyer who opens a world passes through the unfold (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | THE signature moment — "the maker's whole world animates open around the still-playing video"; it is what makes KOL feel like KOL (fact, concept-lock step 3). |
| **Confidence** | 75% | Engine WORLD_OPEN preset + P4 renderer are locked; the cinematic motion ceiling (Lusion) is a craft target with performance risk (est.). |
| **Effort** | (ask CTO) person-weeks | The hardest transition to get right — persistent player + progressive block reveal + custom per-maker theme (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | High — the identity moment. |

**MoSCoW Classification:** Must Have

**Why this priority?** The world-unfold is the product's signature transition. It is the reason the persistent-video invariant exists and the moment that differentiates KOL from every grid marketplace.

---

## Overview

World Unfold is the `WORLD_OPEN` state: on a second tap, the maker's entire branded world **animates open around the still-playing video** — blocks, tokens, atmosphere, all per-maker — while the same `hero-video` element (`layoutId="hero-video"`) continues playing without pause. It is the signature transition of the buyer journey (concept-lock step 3, D4 + D5). The engine `WORLD_OPEN` preset keeps the store's signature clip in the persistent single-clip player.

---

## Problem

The concept-lock one-breath summary defines KOL by this exact moment: tapping a maker "unfolds their whole personalized branded **world** *around* the still-playing video." If the world opened as a new page (a cut, a reload, a paused video), the magic collapses into an ordinary navigation. NARRATIVE sets the craft ceiling: Lusion's "cinematic WebGL, fluid spatial transitions, real 3D depth … liquid-smooth scroll," and instructs that "KOL's signature moments (the 'world unfolds,' the video dock, hero product reveals) should feel cinematic and physical — depth and fluidity, not flat fades." Buyers need the world to bloom around the video they are already watching — one continuous, physical motion.

> "the maker's world unfolds around the still-playing video with animation: their products, descriptions, images, other videos, colors, fonts, layout, atmosphere — all per-maker" — concept-lock, buyer journey step 3

---

## Proposed Solution

A second tap on the grown video triggers the world to animate open around the persistent `hero-video`. The renderer (P4) composes the maker's ordered `blocks[]` under the maker's theme (curated → token lookup; custom → CSS-prop apply), revealing blocks progressively on `--ease-kol` with atmosphere and `liquid`/`dimensional` motion where the theme specifies. The video never unmounts or pauses across the transition.

**UX Flow:**

1. Buyer taps the grown video a second time (from B2).
2. The maker's world animates open **around** the persistent, still-playing `hero-video` (`layoutId="hero-video"` persists from B2 — cite P4 hero persistence).
3. Blocks reveal progressively (media leads, then heading, then body, 70ms stagger, `--ease-kol`); the maker's tokens, atmosphere, and motion preset apply per-maker.
4. The engine `WORLD_OPEN` preset holds the store's signature clip in the single persistent player.
5. Buyer is now in the open world; scrolling advances to `WORLD_BROWSE` (B4).

---

## User Stories

- As a buyer, I want the maker's whole world to bloom open around the video I'm watching, so that discovering a shop feels cinematic and personal, not like clicking to a new page.
- As a buyer, I want each maker's world to look genuinely different — their colors, type, motion, atmosphere, so that no two shops feel the same.
- As a buyer on a reduced-motion setting, I want the world to appear without disorienting animation, so that I can use KOL comfortably.

---

## Acceptance Criteria

**Happy Path**
- Given a grown video (B2), when the buyer taps again, then the maker's world animates open around the persistent `hero-video` and the video keeps playing through the transition.
- Given the world opens, when it renders, then the P4 renderer composes the maker's ordered `blocks[]` under the maker's theme (curated → token lookup; custom → apply `customPalette.roles` / `customPairing` as CSS props) with the store's atmosphere and motion preset.
- Given the WORLD_OPEN state, when the engine resolves, then it keeps the store's signature clip in the persistent single-clip player (`page_eligibility @> {world}` ∧ `purpose && {intro, craft-story, atmosphere}`, store scope = `storeScope`, limit 1) — usually the same clip promoted from the feed, so the transition is seamless.

**Hero persistence (load-bearing)**
- Given the persistent video is playing, when the world unfolds, then the `hero-video` element MUST NOT unmount or pause — it is the SAME shared element carried from B2 (cite P4 `layoutId="hero-video"` persistence, the hardest renderer invariant). An automated test MUST assert element identity persists and playback is continuous across GROWN → WORLD_OPEN.

**No flattening**
- Given two different makers' worlds, when each unfolds, then they render with genuinely different layout, tokens, atmosphere, and motion (D15 "no flattening") — the world adopts the maker's `theme` (`kind:"curated"` or `kind:"custom"`), not KOL curated chrome.

**Reduced motion**
- Given the buyer has `prefers-reduced-motion`, when the world unfolds, then the animated unfold is replaced by an **instant fade** (no spatial/liquid motion), while the video still persists and plays.

**Loading**
- Given blocks are still fetching, when the world opens, then blocks reveal progressively with skeletons matched to each block's real layout (no spinner, no layout shift).

**Error**
- Given one block fails to load/render, when the world opens, then that block degrades gracefully (fails quiet + inline) and the world still opens and stays usable — a single failed block never blocks the unfold.

**Success**
- Given all blocks resolve, when the world is open, then the full per-maker world renders around the still-playing video; scrolling advances to `WORLD_BROWSE` (B4).

---

## UX / UI Notes

Surface touched: **the rendered world = the seller's shop** → FULL brand freedom (`theme.kind:"custom"` or curated starting point, D15). This is NOT KOL curated chrome — the world wears the maker's own design system. The KOL chrome (any persistent nav) recedes; the film always wins.

**Key Interactions:**

- Second tap on grown video → world animates open around the persistent video.
- Progressive block reveal on `--ease-kol` (media-leads-text, 70ms stagger, once per element).
- `liquid` / `dimensional` motion presets carry the cinematic-signature beat (design-system §4.5) where the theme specifies — the Lusion motion ceiling (NARRATIVE).
- Atmosphere blocks provide per-maker connective mood.
- Reduced-motion → instant fade.
- Sound off until opt-in; persistent video stays muted unless the buyer opts in.

**Edge Cases:**

- **loading** — progressive block reveal with layout-matched skeletons.
- **error** — a block fails, world still opens; failed block degrades quietly.
- **success** — full unfold around the persistent film.
- empty state N/A at the world level — a published world always has ≥1 block (`hero-video`); individual optional blocks that are empty are simply omitted from the live render (empty ≠ blank; block-catalog cross-cutting rules).

---

## Technical Requirements

Risk tier: **Lite** (frontend render + transition + one engine read; no API/DB/auth writes, isolated feature). No new tables/RPCs. Performance is the primary craft risk, not data risk.

### Backend Changes
- No new backend. Calls the video engine `selectVideos(ctx)` with `ctx.state = 'WORLD_OPEN'`, `storeScope = store_id`, `limit = 1` (video-engine-spec §2.3). Engine keeps the persistent single-clip slot.
- **Engine never reads `blocks` or `stores.config`** — the engine and the renderer meet only at `videos.id` (video-engine-spec §0.1; Part B §B2 B3 note). The renderer reads config; the engine reads the canonical tables.

### Frontend Changes
- The world-unfold animation opening the P4-rendered world around the persistent `hero-video` (`layoutId` shared from B2).
- P4 renderer composes ordered `blocks[]` under the maker's `theme` (reads `stores` / `store_versions` config; both `theme.kind` paths).
- Progressive block reveal; per-block 4 states; reduced-motion → instant fade.

### Database Changes
- None. Reads only: `stores`, `store_versions` (config, via renderer), `blocks` (static catalog, via renderer), `videos` (WORLD_OPEN via engine). Bound to Part B §B2 — no new schema.

### External Services
- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | The unfold + persistent video hold ~60fps on a mid-range desktop; progressive reveal avoids blocking; no re-buffer of the persistent video. | Playwright frame timing + Lighthouse. |
| **Security** | Renderer reads only published store config (RLS); engine reads published clips only. | Review. |
| **Scalability** | Single-store scope; block count bounded by catalog composition. | Seed a large world; verify progressive reveal. |
| **Accessibility** | Reduced-motion → instant fade; keyboard reachable; block reveals do not trap focus; captions available on the persistent clip. | axe-core + reduced-motion emulation. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B2 Grow interaction (persistent video enters here) | Feature | Spec (this batch) | H |
| P4 store renderer + `hero-video` `layoutId` persistence | Feature | Spec locked (block-catalog §1; store-config §2.2) | H — the hardest invariant |
| P5 block library (all 11 blocks, per-block states) | Feature | Spec locked (block-catalog) | H |
| P8 curated design rails / D15 custom-theme derivation | Feature | Spec locked | M |
| P6 engine WORLD_OPEN preset | Engine | Spec locked | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B4 Store scroll & interact | frontend-engineer | Yes | Scrolling the open world enters WORLD_BROWSE |

---

## Out of Scope

- Scrolling/interacting with the world (B4).
- Contextual narration shrink (B5).
- The renderer internals and theme derivation (P4 / P8 own them — this spec cites them).
- Buyer-time generation — engine selects only (D5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Persistent video pauses/remounts on unfold (breaks the signature) | M | H | P4 `layoutId` shared-element persistence; automated continuity test across GROWN→WORLD_OPEN. |
| Cinematic motion tanks performance | M | H | Performance budget + reduced-motion fallback; progressive reveal; degrade motion on low-power. |
| A block error blocks the whole unfold | L | H | Per-block error isolation; world opens regardless (AC). |
| Worlds feel same-y (flattening) | L | H | Per-maker theme applied (curated or custom); D15 no-flattening; design-critic gate upstream (P9). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| WORLD_OPEN → WORLD_BROWSE (scroll engagement) | N/A | ≥ 60% of unfolds scroll into the world (assumed target — low confidence) | 30 days |
| Persistent-video continuity defects | N/A | 0 (continuity test) | ongoing |
| Reduced-motion unfold errors | N/A | 0 | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; continuity + reduced-motion tests green; perf budget met | 2–3 days |
| **Private Beta** | First cohort | No P0; unfold reads as cinematic + distinct per maker | 1 week |
| **Full Launch** | All buyers | Passed | — |

**Feature Flag**
- Behind a feature flag? Yes (shared buyer-journey flow flag).
- Flag name: `buyer-world-flow-enabled`
- Flag owner: frontend-engineer

**Rollback Plan**
- Rollback trigger: continuity defect, perf regression, or block-isolation failure.
- Rollback decision maker: CTO.
- Rollback steps: disable flag → GROWN remains usable → fix → re-enable.
- Data impact: none.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Exact cinematic-signature beat target (the specific Lusion moment) — founder to describe; agents can't watch the clip (NARRATIVE note). | Design-Lead + Founder | pre-build |
| 2 | Performance budget threshold at which `liquid`/`dimensional` motion downgrades on lower-power desktops. | CTO + Design-Lead | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker W2)_
