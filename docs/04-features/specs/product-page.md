# Product Page (B6)

<!-- Buyer core state machine · state PRODUCT_PAGE · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Product Page |
| **Feature Slug** | product-page |
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
| **Reach** | 8 | Every buyer who decides on a piece sees the product page (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | The decision surface — where images, 3D, trust, reviews, and add-to-cart converge; conversion depends on it (fact, concept-lock step 6). |
| **Confidence** | 80% | Renderer + block-catalog `product-detail` locked; data reads from `products` only (est.). |
| **Effort** | (ask CTO) person-weeks | Deep product view + gallery/3D + inline trust/reviews + add-to-cart (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | High — the buy-decision surface. |

**MoSCoW Classification:** Must Have

**Why this priority?** The product page is where the buyer decides. It is the direct precursor to checkout (B7) in the buyer state machine.

---

## Overview

The Product Page is the `PRODUCT_PAGE` state: the deep single-product view — image gallery, optional 3D model, inline compact trust badge, reviews, and the one high-emphasis add-to-cart button — rendered while the corner video may narrate. Price is displayed from `products` only. It implements the concept-lock buyer journey step 6 (D4, D7).

---

## Problem

The concept-lock buyer journey step 6 lists what the buyer needs to decide: "Product page — images, description, 3D model (if available), **trust badge**, reviews, + seller-added interactions." The buyer has met the human (B2/B3) and been narrated to (B5); now they need concrete, honest information about the specific piece — and one clear way to buy it — without the page shifting or misleading them. Trust must be honest ("no claim we can't back in v1," concept-lock guardrails), so the trust badge only resolves to honest states, and the displayed price must be the maker's real price (never a client-passed value). Buyers need a complete, trustworthy, decisive product surface.

> "Images, 3D (opt), badge, reviews." — feature-tree §4, PRODUCT_PAGE row

---

## Proposed Solution

Render the `product-detail` block (image-gallery / 3d-viewer / video-led variant) for the clicked product: gallery with `focalPoint` crops, optional 3D via `model3dId` (falls back to gallery if null), inline compact `trust-badge` and `reviews` block, mono price, inventory truth, tap-to-hear voiceovers where present, and the single high-emphasis accent add-to-cart button. The corner video (B5) may narrate. Add-to-cart advances toward `CHECKOUT` (B7).

**UX Flow:**

1. From NARRATE_SHRINK (B5), the buyer lands on the product page for the clicked product.
2. The `product-detail` block renders: gallery (or 3D / video-led), mono price, inventory, description.
3. Inline compact `trust-badge` and the `reviews` block render; tap-to-hear voiceovers play where present.
4. The corner video may narrate (from B5).
5. Buyer taps add-to-cart (the one high-emphasis accent button) → toward `CHECKOUT` (B7).

---

## User Stories

- As a buyer, I want a complete product view — images, optional 3D, price, and description — so that I can decide on this specific piece with confidence.
- As a buyer, I want to see an honest trust badge and real reviews inline, so that I trust the maker before I buy.
- As a buyer, I want one clear way to add the piece to my cart, so that buying is obvious and unpressured.

---

## Acceptance Criteria

**Happy Path**
- Given a clicked product, when the product page renders (PRODUCT_PAGE), then the `product-detail` block renders (default `image-gallery`) with the product's images (`focalPoint` crops), mono price from `products` (`price_amount` + `currency`), inventory truth (`inventory_status` / `inventory_qty`), and the maker's description.
- Given the page renders, when trust + social proof render, then an inline compact `trust-badge` (`inline-compact` variant) and the `reviews` block render inline; tap-to-hear voiceovers play where present.
- Given a product with a matching corner narration, when the page is open, then the corner video (from B5) may narrate the product.

**Price honesty (display from `products` only)**
- Given the product page, when price is displayed, then it is read from `products` (`price_amount`, `char(3) currency`, integer minor units) and only used for display. The client MUST NOT set or pass an authoritative price — checkout re-reads price server-side (Part B §B0; B7 `create_order` reads prices server-side). No floats.

**3D fallback**
- Given the variant is `3d-viewer` and `model3d_id` is null, when the page renders, then it silently falls back to `image-gallery` (block-catalog §4) — never a broken 3D frame.

**Route guard (no empty product)**
- Given an invalid or missing product, when the route is hit, then the page is route-guarded — a `product-detail` always has a product; there is no blank empty state.

**Loading (no layout shift)**
- Given the product is fetching, when the page loads, then a gallery skeleton at the product `aspect` renders and the price + add-to-cart CTA area is reserved (no layout shift when they resolve; no spinner).

**Error**
- Given an image fails, when the gallery renders, then a per-image placeholder with visible `alt` text shows; if inventory is unresolved, add-to-cart is disabled with a reason.

**Success**
- Given all data resolves, when the page is interactive, then the full detail renders with a live add-to-cart; tapping it advances toward `CHECKOUT` (B7).

---

## UX / UI Notes

Surface touched: the product page renders inside **the maker's world** (their theme), but add-to-cart is the one high-emphasis accent button in the world (block-catalog §4). The corner film supports; it does not block the CTA.

**Key Interactions:**

- `product-detail` variants: `image-gallery` (default), `3d-viewer` (GLB via `model3dId`, orbit; falls back to gallery if null), `video-led` (narration clip is hero).
- Inline compact `trust-badge` (Real-Maker + AI-Transparency, always an honest state) + `reviews` block.
- Add-to-cart: tactile (`scale-[0.98]` on `:active`), the one high-emphasis accent button.
- Tap-to-hear voiceovers where present (B10 / P12 surface — reference only).
- Reveal on `--ease-kol`; reduced-motion → instant fade.

**Edge Cases:**

- **empty** — N/A (route guard: a product-detail always has a product; one-line reason retained rather than a fabricated empty state).
- **loading** — gallery skeleton at product aspect; CTA area reserved (no shift).
- **error** — per-image placeholder + `alt`; add-to-cart disabled if inventory unresolved.
- **success** — full detail + live add-to-cart.

---

## Technical Requirements

Risk tier: **Lite** (touches cart entry, reads product data; no auth/billing write here — the order write is B7). No new tables/RPCs in this feature.

### Backend Changes
- No new backend for display. Reads the product for render; the add-to-cart action populates a cart (`carts`, owned by B7's flow) — this spec covers the product surface and the add-to-cart entry only.
- The engine corner-narration selection is B5's (PRODUCT_PAGE preset also product-scoped, video-engine-spec §2.2 — cite, don't re-spec).

### Frontend Changes
- `product-detail` block render (image-gallery / 3d-viewer / video-led). 3D falls back to gallery when `model3d_id` null.
- Inline `trust-badge` (`inline-compact`) + `reviews` block render.
- Add-to-cart button (one high-emphasis accent) with disabled-with-reason when inventory unresolved.
- 4 states (empty N/A by route guard; loading, error, success).

### Database Changes
- None new. Reads: `products` (`price_amount`, `currency`, `inventory_status`, `inventory_qty`, `model3d_id`), `media`, `reviews`, `badges`, and surfaces provenance (`product_provenance`, P13) + specs (`product_specs`, P14) where present. Bound strictly to Part B §B2 / §B4 — no new schema. **Display price from `products` only** (Part B §B2 B6).

### External Services
- None (checkout/Stripe is B7).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Gallery skeleton at product aspect, CTA area reserved → zero CLS; 3D loads lazily. | Playwright + Lighthouse CLS. |
| **Security** | Price is display-only; the authoritative price is re-read server-side at order time (B7). Reviews/trust read published data under RLS. | Review + B7 integration test. |
| **Scalability** | Gallery + reviews paginate; product page works with many images/reviews. | Seed a product with many images/reviews. |
| **Accessibility** | Every image has `alt`; 3D has a gallery fallback; add-to-cart keyboard-operable; reduced-motion honored. | axe-core + screen-reader walkthrough. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B5 Contextual narration shrink (product click enters here) | Feature | Spec (this batch) | H |
| P4/P5 `product-detail`, `trust-badge`, `reviews` blocks | Feature | Spec locked (block-catalog §4/§7/§8) | H |
| S8 product management (`products` data: price, inventory, model3d) | Feature | Spec (Batch 3, W4) | H |
| B7 checkout (add-to-cart target) | Feature | Spec (this batch) | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B7 Checkout | frontend-engineer | Yes | Add-to-cart populates the cart consumed by checkout |
| B6+ Trustworthy reviews (enriched) | frontend-engineer (W3) | Yes | Enriches the `reviews` block; B6 owns page render only |

---

## Out of Scope

- **Enriched reviews (B6+, owned by W3)** — verified-purchase flag, photo/video review media, variation/expectation-accuracy, maker responses. **This spec references the `reviews` block only; it does NOT re-spec the review data model.** Cross-reference B6+ (`trustworthy-reviews.md`).
- The checkout flow and order write (B7).
- Tap-to-hear voiceover mechanics (B10 / P12 — referenced only).
- 3D model source (upload vs generate) — open question, optional per-product asset.
- Corner narration selection internals (B5 / P6).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Client-passed price trusted at checkout | L | H | Price is display-only; B7 `create_order` re-reads price server-side (Part B §B0). |
| Layout shift when price/CTA resolve | M | M | Reserved CTA area + skeleton at product aspect (AC). |
| 3D viewer breaks when model absent | M | M | Silent fallback to `image-gallery` (AC + block-catalog §4). |
| Trust badge makes an unbackable claim | L | H | Badge only resolves to honest states (verified/pending/unverified); D7. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Product page → add-to-cart | N/A | ≥ 20% of product-page views add to cart (assumed target — low confidence) | 30 days |
| CLS on product page | N/A | < 0.1 | ongoing |
| Broken-3D / broken-price incidents | N/A | 0 | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; CLS < 0.1; 3D fallback verified | 1–2 days |
| **Private Beta** | First cohort | No P0; page reads complete + trustworthy | 1 week |
| **Full Launch** | All buyers | Passed | — |

**Feature Flag**
- Behind a feature flag? Yes (shared buyer-journey flow flag).
- Flag name: `buyer-world-flow-enabled`
- Flag owner: frontend-engineer

**Rollback Plan**
- Rollback trigger: price/inventory display defect or CLS regression.
- Rollback decision maker: CTO.
- Rollback steps: disable flag → product view falls back to a minimal detail → fix → re-enable.
- Data impact: none (read-only surface; order write is B7).

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | 3D model source per product (upload vs generate) — concept-lock open question; treat as optional per-product asset. | CPO + CTO | pre-build |
| 2 | Exact inline ordering of trust-badge / reviews / provenance (P13) / specs (P14) on the page. | CPO + Design-Lead | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker W2)_
