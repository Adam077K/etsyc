# Contextual Narration Shrink (B5)

<!-- Buyer core state machine · state NARRATE_SHRINK · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Contextual Narration Shrink |
| **Feature Slug** | contextual-narration-shrink |
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
| **Reach** | 7 | Every buyer who goes deeper on a product passes through the shrink (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | The "shopkeeper leans in and tells you about this piece" moment — contextual narration is a signature differentiator (fact, concept-lock step 5). |
| **Confidence** | 80% | Engine NARRATE_SHRINK preset + fallback rules locked (est.). |
| **Effort** | (ask CTO) person-weeks | Corner-dock shrink transition + product-scoped engine query with fallback (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | High — contextual narration beat. |

**MoSCoW Classification:** Must Have

**Why this priority?** NARRATE_SHRINK is the state that makes the video contextual — the maker narrating the exact piece the buyer is looking at. It bridges browsing (B4) to the product page (B6).

---

## Overview

Contextual Narration Shrink is the `NARRATE_SHRINK` state: when the buyer clicks a product / goes deeper, the persistent video **shrinks to a corner dock** (`320×180`) and the engine plays the *right* narration clip for that product. If no product-narration clip matches, it falls back gracefully — never an error, never buyer-time generation (concept-lock step 5, D5).

---

## Problem

The concept-lock buyer journey step 5 is: "Click a product / go deeper → the leading video **shrinks to a corner** and the video engine plays the *right* clip for what the buyer is now looking at (contextual narration)." This is the moment the shopkeeper leans in and tells you about the specific piece — "she's showing me" intimacy (block-catalog references ShopShops). Two failure modes must be avoided: (1) a jarring loss of the film when the buyer focuses on a product, and (2) an error or dead state when a maker simply hasn't recorded narration for that piece. Since `product_links` has no DB foreign key, a stale link must degrade gracefully, not throw. Buyers need the film to follow them, contextually — and to never break when a clip is missing.

> "Contextual selection, no buyer-time generation." — feature-tree §4, NARRATE_SHRINK row

---

## Proposed Solution

On clicking a product, the persistent `hero-video` animates to a `corner-shrunk` dock (`320×180`, `--radius-md`, `--shadow-raised`). The engine `NARRATE_SHRINK` preset selects a `product-narration` clip tied to that product (`product_links @> {productId}`). If none matches (dangling or absent link → zero rows), it falls back per the engine's rule: drop the `product_links` predicate for any product-narration clip in the store; if still none, keep the currently-playing persistent clip. No error, ever. Landing on the product surface advances to `PRODUCT_PAGE` (B6).

**UX Flow:**

1. From WORLD_BROWSE (B4), the buyer clicks a product / goes deeper.
2. The persistent video shrinks to a corner dock (`320×180`), still playing.
3. The engine `NARRATE_SHRINK` preset plays the right `product-narration` clip for that product (`product_links @> {productId}`).
4. If no clip matches, the dock keeps the persistent clip playing (graceful fallback) — no error, no gap.
5. The product surface renders; the buyer advances to `PRODUCT_PAGE` (B6).

---

## User Stories

- As a buyer, I want the film to shrink to a corner and narrate the exact piece I'm looking at, so that it feels like the maker is telling me about this specific thing.
- As a buyer, when a maker hasn't recorded narration for a piece, I want the film to just keep playing quietly, so that nothing breaks or feels broken.
- As a buyer, I want the corner dock to stay out of the way while I read the product, so that the film supports rather than blocks my decision.

---

## Acceptance Criteria

**Happy Path**
- Given the buyer clicks a product, when the shrink triggers, then the persistent video animates to the `hero-video` `corner-shrunk` variant (`320×180`, `--radius-md`, `--shadow-raised`) and keeps playing.
- Given a product with a matching narration clip, when the `NARRATE_SHRINK` preset resolves, then the engine plays the product-narration clip (`page_eligibility @> {product}` ∧ `purpose @> {product-narration}`, store scope = `storeScope`, `product_links @> {productId}`, limit 1).

**Graceful fallback (dangling / absent product_links — never an error)**
- Given the clicked product has no clip whose `product_links` contains its id (dangling id, stale id, or none tagged), when the query returns zero rows, then the engine falls back — first to any `product-narration` clip in the store, and if still empty, **keeps the currently-playing persistent world clip** in the corner dock. It MUST NOT error, show a broken state, or generate a clip at buyer time (D5 — no buyer-time generation; `product_links` has no DB FK so a stale id simply yields zero rows, video-engine-spec §0.3 / §2.2).
- Given the fallback runs, when the dock renders, then narration is simply absent (the persistent clip plays on) — the buyer never sees an error.

**No buyer-time generation**
- Given any product state, when narration is selected, then the engine SELECTS from already-tagged real footage only — it never generates a clip in response to the buyer (D5).

**Loading**
- Given the narration clip is buffering, when the dock appears, then the clip poster shows in the dock immediately with a skeleton shimmer (no spinner; text/product content never waits on the dock video).

**Error**
- Given the narration clip 404s/decode-fails, when it plays, then the dock falls back to the clip `poster` (or keeps the persistent clip) with a quiet inline retry — never a blocking error.

**Success**
- Given a matching clip resolves, when the dock plays, then the corner clip narrates the product; the product surface (B6) renders around it.

---

## UX / UI Notes

Surface touched: the corner dock lives over **the rendered world** (maker's theme) but the dock frame itself uses shared render tokens (`--radius-md`, `--shadow-raised`). The film always wins but is deliberately docked out of the reading path.

**Key Interactions:**

- Click product → persistent video shrinks to `corner-shrunk` dock (`320×180`).
- Engine plays product-scoped narration; graceful fallback if none.
- Dock stays out of the way of the product content (B6).
- Shrink animates on `--ease-kol`; reduced-motion → instant fade; video persists.
- Sound off until opt-in; muted unless the buyer opts in.

**Edge Cases:**

- **empty / no match** — no product-narration clip → fallback keeps the persistent clip; narration absent, never an error (the load-bearing gotcha).
- **loading** — dock poster + shimmer.
- **error** — clip fails → poster / persistent clip + quiet retry.
- **success** — corner clip narrates the product.

---

## Technical Requirements

Risk tier: **Lite** (frontend shrink transition + one engine read with fallback; no API/DB/auth writes). No new tables/RPCs.

### Backend Changes
- No new backend. Calls the video engine `selectVideos(ctx)` with `ctx.state = 'NARRATE_SHRINK'`, `storeScope = store_id`, `productId = <clicked>`, `limit = 1` (video-engine-spec §2, §2.2). The engine owns the fallback chain (drop `product_links` predicate → keep persistent clip).
- `product_links` is `uuid[]` with **no element-level FK** — a stale id yields zero rows and the fallback runs. The engine never errors on a dangling product link (video-engine-spec §0.3).

### Frontend Changes
- Corner-dock shrink transition on the persistent `hero-video` (`corner-shrunk` variant; element persists — no remount).
- Renders narration when present, keeps the persistent clip when absent.
- 4 states: loading (dock poster + shimmer), error (poster + retry), no-match fallback (persistent clip continues), success (product narration plays).

### Database Changes
- None. Reads only (via engine): `videos`, `video_profiles` (NARRATE_SHRINK preset). Bound to Part B §B2 — no new schema.

### External Services
- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | The shrink runs ~60fps; the corner clip does not stall product content rendering. | Playwright frame timing. |
| **Security** | Engine reads only published clips; no browser access to `buyer_signals`. | Review. |
| **Scalability** | Product-scoped query GIN-served on `product_links`; bounded to one product. | Seed products with/without narration; verify fallback. |
| **Accessibility** | Reduced-motion → instant fade; dock has captions; corner dock does not trap focus or cover the CTA. | axe-core + reduced-motion emulation. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B4 Store scroll & interact (product click enters here) | Feature | Spec (this batch) | H |
| P6 engine NARRATE_SHRINK preset + fallback chain | Engine | Spec locked (video-engine-spec §2.2) | H |
| P4 `hero-video` `corner-shrunk` variant | Feature | Spec locked (block-catalog §1) | M |
| P7 tagging (`product-narration` clips tied via `product_links`) | Feature | Not Started | M — untagged products just fall back |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B6 Product page | frontend-engineer | Yes | The product page renders around the corner dock |

---

## Out of Scope

- The product page content itself (B6 owns it; this spec covers the shrink + narration selection).
- Tap-to-hear per-element voiceovers (B10 / P12 — separate voice layer).
- Any buyer-time video generation (explicitly forbidden, D5).
- Engine scoring internals (P6 owns).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dangling `product_links` throws / shows broken state | M | H | Engine returns zero rows → graceful fallback chain; AC + test for no-match path. |
| Buyer expects narration on every product | M | L | Fallback keeps film playing; narration is a bonus, not a promise. |
| Corner dock covers the add-to-cart CTA | L | M | Dock placement avoids the CTA reserved area (coordinate with B6). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Narration-match rate on products with tagged clips | N/A | ≥ 95% of tagged products play their clip (est.) | 30 days |
| No-match error incidents | N/A | 0 (fallback, never error) | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; fallback path verified (dangling id → no error) | 1–2 days |
| **Private Beta** | First cohort | No P0; narration contextual, fallback silent | 1 week |
| **Full Launch** | All buyers | Passed | — |

**Feature Flag**
- Behind a feature flag? Yes (shared buyer-journey flow flag).
- Flag name: `buyer-world-flow-enabled`
- Flag owner: frontend-engineer

**Rollback Plan**
- Rollback trigger: shrink defect or fallback failure (any error surfaced).
- Rollback decision maker: CTO.
- Rollback steps: disable flag → product opens without dock narration → fix → re-enable.
- Data impact: none.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Confirm corner-dock placement relative to the B6 add-to-cart CTA reserved zone. | CPO + Design-Lead | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker W2)_
