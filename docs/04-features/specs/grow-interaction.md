# Grow Interaction (B2)

<!-- Buyer core state machine · state GROWN · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Grow Interaction |
| **Feature Slug** | grow-interaction |
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
| **Reach** | 9 | Every buyer who engages a feed card passes through GROWN (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | The first beat of the signature "grow → unfold" continuity; establishes the persistent-video invariant buyers feel throughout (fact, concept-lock step 2). |
| **Confidence** | 80% | Engine GROWN preset locked; the shared-element continuity technique is defined by P4 `layoutId` (est.). |
| **Effort** | (ask CTO) person-weeks | Frontend transition + engine call; the shared-element persistence spans B2→B3 (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | High — gateway from feed to world. |

**MoSCoW Classification:** Must Have

**Why this priority?** GROWN is the transition state between the feed and the world; without it the signature continuity ("video never pauses across grow → unfold") cannot exist.

---

## Overview

Grow Interaction is the `GROWN` state: tapping a feed video grows it to a **center column that keeps playing** while the rest of the feed scrolls around it; tapping an image grows it into a "meet the person" moment. It is the first beat of the shared-element video continuity that runs through world-unfold (B3). The video engine `GROWN` preset pulls the tapped clip (usually the same `intro` clip promoted from the feed) plus that store's peers (D5).

---

## Problem

The concept-lock buyer journey step 2 is: "Tap a video → grows to a center column; scroll through other videos. (Tap an image → grows, learn the person behind it.)" The signature promise of KOL is that "the maker's world unfolds around the still-playing video" — which only lands if the video the buyer tapped **keeps playing without interruption** as it grows. A cut, pause, or reload here breaks the felt continuity that makes the later unfold feel like one physical, cinematic motion (NARRATIVE: "cinematic and physical — depth and fluidity, not flat fades"). Buyers need the tapped film to grow, not restart.

> "grows to a center column, keeps playing; feed scroll continues around it" — feature-tree §4, GROWN row

---

## Proposed Solution

On tap, the tapped feed clip becomes the center-column `hero-video` (`center-column` variant) and continues playing — the same media element, promoted, not remounted. The feed scrolls around it. The engine's `GROWN` preset supplies the grown clip and the store's peer clips for continued scrolling. A second tap advances to `WORLD_OPEN` (B3).

**UX Flow:**

1. Buyer taps a feed video card (from B1).
2. The tapped clip animates to a center column and **keeps playing without pause or reload** (shared-element continuity via `layoutId="hero-video"`, cite P4 hero persistence).
3. The surrounding feed continues to scroll around the centered video.
4. The engine `GROWN` preset resolves the store's peer clips (tapped clip's `store_id`) for context.
5. Tapping an image card instead grows it into a "meet the person" view. A second tap on the grown video → `WORLD_OPEN` (B3).

---

## User Stories

- As a buyer, I want the video I tap to smoothly grow to center and keep playing, so that the experience feels like one continuous cinematic motion, not a page reload.
- As a buyer, I want to keep scrolling other makers while one video is grown, so that I stay in discovery without losing my place.
- As a buyer, I want tapping an image to let me "meet the person," so that I connect with the human before the whole world opens.

---

## Acceptance Criteria

**Happy Path**
- Given a feed video card, when the buyer taps it, then the tapped clip grows to the `center-column` `hero-video` variant and continues playing.
- Given the tapped clip is grown, when the buyer scrolls, then the surrounding feed continues to scroll around the centered, still-playing video.
- Given the grown state, when the engine resolves the `GROWN` preset, then it returns the grown clip (usually the same feed `intro` clip promoted) plus the tapped store's peers (`page_eligibility @> {grown}` ∧ `purpose && {intro, craft-story}`, store scope = tapped clip's `store_id`).

**Film-frame continuity (load-bearing — amended 2026-07-21, CPO Ruling 1)**

The promise this protects is that **the maker's face never cuts away**. It is stated in terms of the *film frame*, not a single DOM node, because the spec independently requires clip swaps (B4 scoring swaps, B5 narration) and a single `<video>` cannot change `src` without pausing. The frame is the shared element; inside it, one or two video buffers may take turns.

- **Same-source transitions — true element persistence.** Given a clip is playing, when a transition occurs that does NOT change the clip source (`grow`, `ungrow`, `unfold`, `dock`, `undock`), then the SAME video element carries playback across it — it MUST NOT unmount, pause, re-source, or re-buffer. An automated test MUST assert element identity persists and `paused` never flips true across each of these transitions. **A cross-fade is not permitted here** — these transitions move the film, they do not change it.
- **Source-changing swaps — in-frame cross-fade.** Given an event that DOES change the clip source, when the swap runs, then it is an in-frame cross-fade at `--dur-swap` between two stacked video elements inside a Film Layer whose container node identity persists for the session. The incoming element MUST have reached `readyState >= 3` (`HAVE_FUTURE_DATA`) **and already be playing** before the cross-fade begins. At no sampled frame during or after the swap is the visible video element paused, and at no sampled frame is the frame blank or black.
- **Frame identity across the journey.** Given any path from `FEED` through `NARRATE_SHRINK`, when transitions and swaps occur, then the Film Layer container node identity persists unbroken (same node reference at journey entry and exit) and moving footage of the maker is continuously visible — no cut to background, no empty frame, no spinner in the frame.

*Implementation note (not binding): the approved mechanism is two stacked `<video>` elements (A/B) inside one persistent Film Layer, per `KOL-wave3-design-direction.md` §6.2. `--dur-swap: 120 ms` is provisional — it must be reviewed eyes-on against a real clip pair before B4 merges (see Open Question 2).*

**Image path**
- Given a feed image card, when the buyer taps it, then it grows into a "meet the person" view (not a video-narration state).

**Loading**
- Given the grown clip is still buffering, when it grows, then the poster frame shows immediately with a skeleton shimmer over it (text/chrome never waits on the video; no spinner).

**Error**
- Given the grown clip fails to load (404/decode), when it grows, then it falls back to the clip `poster` with a quiet inline retry; the grown state stays usable.

**Success**
- Given the clip resolves, when grown, then it plays muted in the center column, the feed scrolls around it, and a second tap advances to `WORLD_OPEN` (B3).

---

## UX / UI Notes

Surface touched: **KOL's own product UI** (feed chrome around the grown video) → curated system. The grown video is the maker's film — the film always wins; chrome recedes.

**Key Interactions:**

- Tap feed video → grow to `center-column`, keep playing (shared element).
- Feed continues scrolling around the centered video.
- Tap image → grow "meet the person."
- Second tap on grown video → `WORLD_OPEN` (B3).
- Grow animates on `--ease-kol`; reduced-motion → instant fade (no motion sickness), video still persists.
- Sound off until opt-in; muted autoplay continues.

**Edge Cases:**

- **loading** — grown clip buffering over poster (skeleton shimmer, no spinner).
- **error** — fallback poster + quiet retry; state usable.
- **success** — centered, still-playing clip with feed scrolling around it.
- empty state N/A here — GROWN is only reachable from a real tapped clip that exists (note: no empty state; the feed guarantees a clip). Retained one-line reason instead of fabricating an empty state.

---

## Technical Requirements

Risk tier: **Lite** (frontend transition + one engine read; no API/DB/auth writes, isolated feature < 300 LOC). No new tables/RPCs.

### Backend Changes
- No new backend. Calls the video engine `selectVideos(ctx)` with `ctx.state = 'GROWN'`, `storeScope = tapped clip's store_id` (video-engine-spec §2). The grown clip is usually the same feed `intro` clip promoted — the engine returns it plus peers.

### Frontend Changes
- Grow transition on the `hero-video` element using the shared-element pattern (`layoutId="hero-video"`, P4). The element must persist — promoted, never remounted — so playback is continuous into B3.
- Center-column layout with the feed scrolling around it.
- Image-card grow path ("meet the person").
- 4 states: loading (poster + shimmer), error (poster + retry), success (centered play). Empty N/A (reason noted).

### Database Changes
- None. Reads only (via engine): `videos` (GROWN preset). Bound to Part B §B2 — no new schema.

### External Services
- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | The grow transition runs at 60fps; the video element is never remounted (no re-buffer). | Playwright trace + frame timing; assert element identity. |
| **Security** | No new data access beyond the GROWN engine read (published clips only). | Review. |
| **Scalability** | Peer resolution scoped to one `store_id` — bounded. | N/A (single-store scope). |
| **Accessibility** | Reduced-motion → instant fade while preserving playback continuity; keyboard-triggerable grow; captions available. | axe-core + reduced-motion emulation. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B1 Discovery feed | Feature | Spec (this batch) | H — GROWN entered from a feed tap |
| P4 `hero-video` shared-element persistence (`layoutId`) | Feature | Spec locked (block-catalog §1) | H — continuity depends on it |
| P6 engine GROWN preset | Engine | Spec locked (video-engine-spec §2) | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B3 World unfold | frontend-engineer | Yes | B3 continues the SAME persistent video across the unfold |

---

## Out of Scope

- The world-unfold animation and block reveal (B3 owns it).
- Contextual product narration (B5).
- Any change to the feed layout (B1).
- Buyer-time generation — engine selects only (D5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Video pauses/remounts on grow (breaks signature continuity) | M | H | Shared-element `layoutId` persistence; automated element-identity + non-pause test. |
| Reduced-motion users get a jarring jump | M | M | Instant fade under reduced-motion while keeping playback continuous. |
| Peer resolution empty for a lone store | L | L | Grown clip alone is valid; peers optional. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| GROWN → WORLD_OPEN progression | N/A | ≥ 50% of GROWN sessions proceed to unfold (assumed target — low confidence) | 30 days |
| Video-pause-on-transition defects | N/A | 0 (continuity test) | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; continuity test green | 1–2 days |
| **Private Beta** | First cohort | No P0; grow feels continuous | 1 week |
| **Full Launch** | All buyers | Passed | — |

**Feature Flag**
- Behind a feature flag? Yes (shared with the buyer-journey flow flag).
- Flag name: `buyer-world-flow-enabled`
- Flag owner: frontend-engineer

**Rollback Plan**
- Rollback trigger: continuity defect or transition jank.
- Rollback decision maker: CTO.
- Rollback steps: disable flag → feed remains usable (grow disabled) → fix → re-enable.
- Data impact: none.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Confirm the exact "meet the person" image-grow treatment with Design-Lead (distinct from video grow). | CPO + Design-Lead | pre-build |
| 2 | `--dur-swap: 120 ms` is provisional. The cross-fade must be reviewed eyes-on on a real clip pair (frame-by-frame capture) before B4 merges — a swap that reads as a cut fails the promise even with the AC green. | Design-Lead + QA-Lead | before B4 merge |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |
| 2026-07-21 | **AC amended (Ruling 1).** "Shared-element continuity" replaced by "Film-frame continuity" — the old AC (`paused` never flips true on a single `<video>`) was unsatisfiable alongside the spec's own clip-swap requirements. Split into same-source transitions (true element persistence, cross-fade forbidden) and source-changing swaps (in-frame cross-fade, incoming buffer playing before the fade). Added OQ-2 on `--dur-swap` eyes-on verification. | CPO |

---

_Last updated: 2026-07-21 | Updated by: CPO (Wave-3 AC rulings)_
