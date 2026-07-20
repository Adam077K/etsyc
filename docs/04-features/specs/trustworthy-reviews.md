# Trustworthy Reviews (B6+)

<!-- Phase-5 spec worker (W3). ENRICHES the B6 `reviews` block. W2 owns the product-page RENDER of reviews; this spec scopes to the REVIEW DATA MODEL + CAPTURE. Honest-trust rail: `verified` is a GENERATED column (order_item_id IS NOT NULL) — NEVER client-writable. Sellers may edit ONLY `maker_response`. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Trustworthy Reviews |
| **Feature Slug** | trustworthy-reviews |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 5 — spec authoring |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 6 | Every buyer reads reviews pre-purchase; every post-purchase buyer can write one (assumed — low confidence; basis "4 seed worlds + first cohort"). |
| **Impact** | 3 | Massive for trust — verified-purchase + expectation-accuracy is a core honest-trust pillar (D7/D16-5) (`est.`). |
| **Confidence** | 80% | `reviews`/`review_media` + guards + GENERATED `verified` fully locked (`fact`). |
| **Effort** | 2 person-weeks | Capture flow + media upload + `maker_response`; render is B6's (`est.`). |
| **RICE Score** | (6 × 3 × 0.8) ÷ 2 = **7.2** | |

**MoSCoW Classification:** Must Have — D16-5 folds trustworthy reviews into MVP; "trust must be honest" is a founder non-negotiable, and verified-purchase is the mechanism that keeps review trust honest.

**Why this priority?** D16-5 requires *"verified-purchase + photo/video + variation + expectation-accuracy + maker responses."* It directly serves the guardrail *"trust must be honest — no claim we can't back in v1"* (concept-lock). The `verified` flag is only trustworthy because it's DB-derived, never asserted.

---

## Overview

Enriches the reviews on a product with the data that makes them **trustworthy**: a DB-**generated** verified-purchase flag, photo/video review media, the exact product variation + customization context, an expectation-accuracy signal (did it match "exactly what to expect", P14), and maker responses. This spec owns the **review data model + capture path**; the **B6 product page owns the render** of the `reviews` block. The honesty guarantee: `verified` is a GENERATED column, sellers can edit only `maker_response`, and buyers can only review products they actually purchased.

---

## Problem

D16-5 folds in *"Trustworthy Reviews — verified-purchase + photo/video + variation + expectation-accuracy + maker responses."* The founder guardrail is blunt: *"Trust must be honest. No claim we can't back"* (concept-lock). Ordinary marketplace reviews are gameable — anyone can post, "verified" is often just a badge, and photos are cherry-picked studio shots (the NARRATIVE anti-pattern: *"star-rating + '23K sold' clutter, zero human story"*). For handmade goods where every piece varies, a buyer needs to know: was this from a real purchase, of *which* variation, and did it match what the maker said to expect? The pain, in the buyer's terms: *"I want to trust these reviews are from real buyers of the actual thing — with real photos, not staged ones"* (grounded in concept-lock honest-trust guardrail + D16-5; USER-INSIGHTS.md empty).

---

## Proposed Solution

Extend the review model so every review carries a DB-derived verified flag, optional photo/video media, the variation reviewed, an expectation-accuracy rating (tied to P14), and an optional maker response. Buyers capture reviews only against their own purchased line items; sellers can only respond.

**UX Flow:**

1. A buyer who purchased a product (has an `order_item`) writes a review: rating, body, the **variation** they received, an **expectation-accuracy** rating (vs P14 "exactly what to expect"), and optional **photo/video** media.
2. The DB **generates** `verified = (order_item_id IS NOT NULL)` — the buyer cannot set it; the review shows a verified-purchase mark only because a real line item backs it.
3. The maker can add a `maker_response` to a review (and edit only that) — never the buyer's rating/body/variation.
4. The enriched review (verified mark, media, variation, expectation-accuracy, maker reply) renders in the B6 `reviews` block (`list`/`rating-summary`/`featured-quote`).
5. Result: reviews a buyer can actually trust — provably from real purchases of a known variation, with honest media and maker voice.

---

## User Stories

- As a buyer, I want reviews to show they're from verified purchases so that I trust them.
- As a buyer, I want to see the exact variation reviewed and whether it matched expectations so that I know what I'll actually get.
- As a buyer, I want to leave photos/video of what I received so that future buyers see the real thing.
- As a maker, I want to respond to a review so that I can add context — without being able to alter the buyer's words.

---

## Acceptance Criteria

**Happy Path**
- Given a buyer with a purchased `order_item` for a product, when they submit a review, then a `reviews` row is written with rating, body, `variation`, `expectation_accuracy`, and `order_item_id` — and the DB **generates** `verified = (order_item_id IS NOT NULL) = true`.
- Given a review, when the buyer attaches photos/video, then `review_media(kind review_media_kind, src)` rows are written and associated.
- Given a review on their product, when the maker adds a response, then `maker_response` is written and shown beneath the review.
- Given enriched reviews, when the B6 `reviews` block renders (`list`/`rating-summary`/`featured-quote`), then verified marks, media, variation, expectation-accuracy, and maker responses display.

**Empty State**
- Given a product with no reviews, when the reviews block renders, then it shows "Be the first to review" — a warm invitation, not a void (empty-as-invitation).

**Loading State**
- Given reviews loading, when the block renders, then row skeletons (avatar + two text bars, aggregate as shimmer) matched to real layout appear.

**Error State**
- Given the reviews read fails, when the block renders, then cached reviews are served if available; else "Reviews are taking a moment" + retry — the block never collapses jarringly.

**Edge Case (honesty guards — load-bearing)**
- Given a buyer attempts to set `verified` directly, when they write/update a review, then it is impossible — `verified` is a **GENERATED column**, never client-writable (B2 §B6+).
- Given a buyer reviews a product they did **not** purchase (no matching line item), when they INSERT/UPDATE, then the `WITH CHECK` rejects it — the review's `product_id` must equal the line item's `product_id` **and** the line item must belong to the buyer (P1-3).
- Given a seller attempts to edit anything but `maker_response` (e.g. rating/body/variation/expectation_accuracy/product_id/buyer_id/order_item_id), when they write, then `reviews_seller_scope_guard`→`enforce_review_seller_scope` **rejects** it — sellers may edit **only** `maker_response` (DB-enforced, not app-side only — B0).

---

## UX / UI Notes

Surface touched: the **reviews render is inside the maker's world** (product page, B6 — world-styled, `reviews` block). The **review-capture form** (buyer, post-purchase) and the **maker-response composer** live in KOL curated chrome. This spec's UI ownership is the **capture + response** surfaces; B6 owns the block render.

**Key Interactions:**

- Buyer review form: rating · body · variation (from what they received) · expectation-accuracy (vs P14 spec) · optional photo/video upload.
- Maker response composer: reply text on their product's reviews (only `maker_response`).
- Render (B6): verified mark, media thumbnails, variation + expectation-accuracy, maker reply.

**Edge Cases:**

- No reviews → invitation (not a void).
- Review media fails to load → the review text/rating still render; media placeholder with `alt`.
- Buyer edits their own review → allowed within `WITH CHECK`; `verified` stays generated.

---

## Technical Requirements

> **Risk tier: Full** (auth, DB write with `WITH CHECK` integrity, seller-scope trigger, GENERATED column, media). Data-need = **Irreversible tier** (tables + trigger locked; DB before backend). Render is B6's (W2).

### Backend Changes

- Review capture over `reviews` (+ `review_media`) via the buyer JWT. `verified` is a **GENERATED** column (`order_item_id IS NOT NULL`) — the app never sets it.
- Buyer INSERT/UPDATE `WITH CHECK`: the review's `product_id` = the `order_item`'s `product_id` **and** the line item belongs to the buyer (P1-3). Buyers cannot review un-purchased products.
- Seller writes are constrained by `reviews_seller_scope_guard`→`enforce_review_seller_scope`: sellers may write **only** `maker_response`; edits to rating/body/variation/expectation_accuracy/product_id/buyer_id/order_item_id are rejected.
- `expectation_accuracy` ties to the P14 "exactly what to expect" spec (the buyer rates how well the product matched the declared expectations).

### Frontend Changes

- Buyer review-capture form (curated chrome): rating, body, variation, expectation-accuracy, photo/video upload → `review_media`.
- Maker-response composer (dashboard chrome).
- All-4-states handled by the **B6 render** (empty invitation, loading skeletons, error cached/retry, success verified reviews) — this spec supplies the capture path that populates them.

### Database Changes

**Data need (Irreversible tier — DB before backend; tables + trigger locked, NO new objects):**

| Object | Use | Status |
|---|---|---|
| `reviews(verified GENERATED = order_item_id IS NOT NULL, maker_response, expectation_accuracy, variation, product_id, buyer_id, order_item_id)` | enriched review; buyer `WITH CHECK` = own purchased line item; seller may edit only `maker_response` | Locked (B2 §B6+) |
| `review_media(kind review_media_kind, src)` | photo/video review media | Locked (B2 §B6+) |
| `reviews_seller_scope_guard`→`enforce_review_seller_scope` | rejects seller edits beyond `maker_response` | Locked (B0) |

- `verified` is **GENERATED, never client-writable**. Do **not** add a `verified` write path or a self-verify flag.

### External Services

- Media storage/CDN for `review_media` (platform's existing storage).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Reviews read (with media refs) P95 < 350ms for ≤100 reviews. | Read benchmark. |
| **Security** | `verified` GENERATED (non-writable); buyer `WITH CHECK` = own line item; seller-scope trigger; no client-set verified/rating-by-seller. | GENERATED-column write-rejection test; un-purchased-review rejection; seller-scope rejection. |
| **Scalability** | Correct + paginated for a product with 1,000 reviews + media. | Seed 1,000 reviews. |
| **Accessibility** | Review form + media uploads keyboard-operable; media has `alt`/captions; verified mark has a text label (not color-only). | axe-core + screen-reader. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B6 Product page (`reviews` block render) | Feature (W2) | Not Started | H — enriched data has no render surface |
| B7 Checkout (`order_items` — the verified basis) | Feature (W2) | Not Started | H — no verified purchases without it |
| P14 Exactly-what-to-expect (expectation-accuracy basis) | Feature (W5) | Not Started | M — expectation-accuracy references it |
| P1 Auth (buyer identity) | Feature (W1 spine) | Not Started | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B6 render | W2 | Yes | consumes the enriched review fields |
| P14 feedback loop | W5 | No | expectation-accuracy feeds "what to expect" accuracy |

---

## Out of Scope

- The B6 product-page render of the `reviews` block — owned by B6 (W2); this spec scopes to data model + capture.
- Review moderation / dispute resolution beyond the DB guards — post-MVP.
- 3rd-party physical product verification — roadmap per D7 (P13 is maker-declared, not verified).
- Incentivized/solicited review campaigns — not in MVP.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `verified` faked (dishonest trust) | L | H | GENERATED column, never client-writable; verified only if a real line item backs it. |
| Seller edits a buyer's rating/body | L | H | `enforce_review_seller_scope` rejects; seller writes only `maker_response`. |
| Buyer reviews a product they didn't buy | M | M | `WITH CHECK` requires own purchased line item. |
| Review media abuse | L | M | Media constrained to `review_media_kind`; moderation deferred (noted). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Reviews that are verified-purchase | — | ~100% of new reviews (structural) | ongoing |
| Reviews with photo/video media | 0% | ≥ 30% | 60 days post-launch |
| Maker response rate on reviews | — | ≥ 50% | 60 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (with real orders) | GENERATED-column + seller-scope + un-purchased tests pass | 2–3 days |
| Gradual Rollout | 10% → 100% | No P0; verified flag correct | 1 week |
| Full Launch | All | No P0 | — |

**Feature Flag** — Behind a flag? **Yes** — `trustworthy-reviews-enabled` (capture path). Flag owner: CTO.

**Rollback Plan** — Trigger: verified-flag or seller-scope breach. Decision maker: CTO. Steps: disable the capture form (B6 renders existing reviews); tables additive, `verified` GENERATED, no data loss.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | `expectation_accuracy` scale + exact tie to P14 fields (which spec fields it rates against). | CPO + CTO | pre-build |
| 2 | `variation` capture — free text vs a structured link to the purchased `order_items.variation`. | CTO | pre-build |
| 3 | Review-media moderation posture for MVP (deferred?). | CPO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
