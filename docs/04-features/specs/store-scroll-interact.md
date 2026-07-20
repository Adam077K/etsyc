# Store Scroll & Interact (B4)

<!-- Buyer core state machine · state WORLD_BROWSE · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Store Scroll & Interact |
| **Feature Slug** | store-scroll-interact |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 6 — Build |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 8 | Every buyer inside an open world browses it (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | This is the "shopkeeper guides you as you scroll" experience — the core in-world browsing that leads to a product (fact, concept-lock step 4). |
| **Confidence** | 80% | Renderer + engine WORLD_BROWSE preset locked; clip-swap scoring defined (est.). |
| **Effort** | (ask CTO) person-weeks | Scroll-driven interactivity across all blocks + engine clip swaps (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | High — the in-world dwell state. |

**MoSCoW Classification:** Must Have

**Why this priority?** WORLD_BROWSE is where the buyer spends time inside a maker's world and where the relationship deepens before a product is clicked. It is a required link in the buyer state machine.

---

## Overview

Store Scroll & Interact is the `WORLD_BROWSE` state: the buyer scrolls the open world and interacts with every block **while the persistent video keeps playing**. As the buyer scrolls, the engine may swap the persistent player to `process` / `atmosphere` clips (scoring-driven, anti-repetition holds), so the film stays contextual without looping (concept-lock step 4, D4).

---

## Problem

The concept-lock buyer journey step 4 is: "Scroll the store → interact with everything while the video keeps playing." The whole premise is that "the maker guides you like a real shopkeeper, products and story revealed as you scroll" (concept-lock one-breath summary). If interacting with the world paused or dropped the film, the shopkeeper would keep going silent every time the buyer touched something. And if the same clip looped for the entire browse, the world would feel static rather than alive. Buyers need a living world: everything interactive, the film continuous and contextually shifting.

> "Video persists; engine may swap to store-context clips (anti-repetition holds). Interact with all blocks live." — feature-tree §4, WORLD_BROWSE row

---

## Proposed Solution

The open world is fully interactive as the buyer scrolls — `product-showcase`, `craft-story`, `process-reel`, `atmosphere`, `contact-cta` and other blocks all respond live. The persistent `hero-video` keeps playing; the engine `WORLD_BROWSE` preset may swap the single-clip slot to `process` / `atmosphere` clips driven by scoring (never random), with anti-repetition ensuring no clip loops. Clicking a product advances to `NARRATE_SHRINK` (B5).

**UX Flow:**

1. From WORLD_OPEN (B3), the buyer scrolls the open world.
2. Every block interacts live (galleries, reels, quotes, CTAs) while the persistent video keeps playing.
3. As the buyer scrolls, the engine `WORLD_BROWSE` preset may swap the persistent player to a `process` / `atmosphere` clip — scoring-driven, with anti-repetition holding so nothing loops.
4. Buyer clicks a product / goes deeper → `NARRATE_SHRINK` (B5), the video shrinking to a corner.

---

## User Stories

- As a buyer, I want to scroll and interact with the whole world while the film keeps playing, so that the maker feels like a shopkeeper guiding me, never going silent.
- As a buyer, I want the film to shift to relevant behind-the-scenes / mood clips as I explore, so that the world feels alive rather than a single looping video.
- As a buyer, I want to click a product to go deeper, so that I can decide on a specific piece.

---

## Acceptance Criteria

**Happy Path**
- Given an open world (B3), when the buyer scrolls, then all blocks are interactive live and the persistent `hero-video` keeps playing without interruption.
- Given the buyer scrolls, when the engine resolves the `WORLD_BROWSE` preset, then it may swap the persistent player to a `process` / `atmosphere` clip (`page_eligibility @> {world}` ∧ `purpose && {process, atmosphere, craft-story}`, store scope = `storeScope`, limit 1..few).

**Scoring-driven swaps (not random)**
- Given the engine swaps the persistent clip, when a new clip is chosen, then the swap is scoring-driven (Business/Situation/Freshness weighted sum, video-engine-spec §3.2), NOT `Math.random` — and anti-repetition holds (dedupe on `anti_repetition_key`, fallback `video_id`) so the same clip does not loop within the session.

**Persistent video**
- Given the buyer interacts with any block, when the interaction occurs, then the persistent video is not paused or unmounted by the interaction (the film always wins, plays through browsing).

**Per-block states (loading / error / empty / success)**
- Given a block is fetching, when it enters view, then it shows a layout-matched skeleton (no spinner).
- Given a block fails, when it renders, then it degrades quietly + inline; the rest of the world stays usable.
- Given an optional block has no content, when the world renders live, then that block is omitted (empty ≠ blank).
- Given all blocks resolve, when the buyer scrolls, then the world is fully interactive with the persistent film playing.

---

## UX / UI Notes

Surface touched: **the rendered world = the seller's shop** → the maker's own theme (curated or custom, D15), not KOL curated chrome. The film always wins; no block chrome pulls focus from the persistent video.

**Key Interactions:**

- Scroll the world; every block responds live: `product-showcase` (rail/masonry/featured-single), `craft-story`, `process-reel` (autoplays muted on scroll-in, pauses on scroll-out), `atmosphere` (the only block permitted ambient motion), `contact-cta`.
- Persistent video swaps to `process` / `atmosphere` clips as the buyer scrolls (scoring-driven; anti-repetition holds).
- Click a product → `NARRATE_SHRINK` (B5).
- Reveal on `--ease-kol`; reduced-motion → instant fade; `process-reel` and `atmosphere` respect reduced-motion (static).
- Sound off until opt-in.

**Edge Cases:**

- **empty** — optional blocks with no content omitted; a sparse world still reads intentionally.
- **loading** — per-block layout-matched skeletons.
- **error** — a block fails, degrades quietly; world stays usable.
- **success** — fully interactive world with persistent, contextually swapping film.
- No eligible `process`/`atmosphere` clip to swap to → the persistent player simply keeps the current clip (engine graceful; no error).

---

## Technical Requirements

Risk tier: **Lite** (frontend interactivity + engine reads; no API/DB/auth writes, isolated feature). No new tables/RPCs.

### Backend Changes
- No new backend. Calls the video engine `selectVideos(ctx)` with `ctx.state = 'WORLD_BROWSE'`, `storeScope = store_id` (video-engine-spec §2.3). Swaps are scoring-driven; anti-repetition (stage 3) always runs after scoring.
- Engine never reads `blocks` / `stores.config`; renderer owns config. They meet at `videos.id` only.

### Frontend Changes
- Interactive rendering of the open world's blocks (all interact live during scroll).
- Persistent `hero-video` clip-swap handling driven by engine output; the element persists (no remount) across swaps within the world.
- Per-block 4 states.

### Database Changes
- None. Reads only: `stores`, `products` (via renderer), `videos` (WORLD_BROWSE via engine). Bound to Part B §B2 — no new schema.

### External Services
- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Scroll stays smooth (~60fps); `process-reel` pauses off-screen; clip swaps do not stall the persistent player. | Playwright scroll trace + Lighthouse. |
| **Security** | Renderer reads only published store config; engine reads published clips only. | Review. |
| **Scalability** | Single-store scope; block count bounded by catalog composition. | Seed a large world; verify scroll perf. |
| **Accessibility** | Reduced-motion → static reels/atmosphere; keyboard scroll + interaction; captions on persistent clip. | axe-core + reduced-motion emulation. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B3 World unfold (world is open, video persistent) | Feature | Spec (this batch) | H |
| P4 store renderer + persistent player | Feature | Spec locked | H |
| P5 block library (product-showcase, craft-story, process-reel, atmosphere, contact-cta) | Feature | Spec locked (block-catalog) | H |
| P6 engine WORLD_BROWSE preset + anti-repetition | Engine | Spec locked (video-engine-spec §2.3, §3) | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B5 Contextual narration shrink | frontend-engineer | Yes | Clicking a product enters NARRATE_SHRINK |

---

## Out of Scope

- The unfold transition (B3) and the shrink/narration (B5).
- The product page itself (B6).
- Engine scoring internals (P6 owns; this spec cites the WORLD_BROWSE preset).
- Buyer-time generation — engine selects only (D5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Clip swaps feel random / repetitive | M | M | Scoring-driven swaps + anti-repetition (AC + video-engine-spec §3). |
| Block interaction pauses the persistent video | L | H | Persistent player decoupled from block interaction; AC + test. |
| Heavy world tanks scroll performance | M | M | Off-screen reel pausing + progressive rendering + perf budget. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| WORLD_BROWSE → product click | N/A | ≥ 35% of browses click a product (assumed target — low confidence) | 30 days |
| Persistent-video pause defects on interaction | N/A | 0 | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; swap + anti-repetition verified | 1–2 days |
| **Private Beta** | First cohort | No P0; world feels alive, film continuous | 1 week |
| **Full Launch** | All buyers | Passed | — |

**Feature Flag**
- Behind a feature flag? Yes (shared buyer-journey flow flag).
- Flag name: `buyer-world-flow-enabled`
- Flag owner: frontend-engineer

**Rollback Plan**
- Rollback trigger: perf regression or persistent-player defect.
- Rollback decision maker: CTO.
- Rollback steps: disable flag → WORLD_OPEN static view remains → fix → re-enable.
- Data impact: none.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Scroll thresholds that trigger a clip swap (how far / which block sections) — tune with Design-Lead + ai-engineer. | CPO + ai-engineer | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker W2)_
