# Feature Spec — Product Management (S8)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Product Management |
| **Feature Slug** | product-management |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 6 — Seller pipeline build |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 6 | 4 seed worlds + first cohort *(assumed, D12)*. Every seller manages products. |
| **Impact** | 3 | Massive. No products → no showcase, no product page, no checkout. The catalog is the thing being sold. |
| **Confidence** | 75% | *(est.)* CRUD over a locked table; price/currency contract is locked (Part B S8). |
| **Effort** | 2.5 person-weeks | *(est., ask CTO)* Product CRUD + image/3D upload + price (minor units + currency) + clip linking + inventory + badges + categories. |
| **RICE Score** | (6 × 3 × 0.75) ÷ 2.5 = **5.4** | Must-Have. |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** Products are the catalog the entire buyer journey (showcase → product page → checkout) renders and sells. Without product management there is nothing to buy (D4/D6).

---

## Overview

The seller surface for adding and editing products (D4/D6): title, description, images, optional 3D model (`model3d_id`, falls back to the gallery when null), price (**minor units + explicit currency**), linked narration clips, inventory, and badges. Writes `products` / `media` / `product_categories`. **Price lives in `products` only** and is read server-side at checkout — never client-passed (Part B S8/B7). Products render via the `product-showcase` and `product-detail` blocks.

---

## Problem

A maker's world is only a shop if it has real, well-described, priced products the buyer can trust and purchase. The concept-lock seller journey and feature-tree lock S8 as **"add/edit products: images, optional 3D, price, linked clips"** (D4, D6). The NARRATIVE is explicit that KOL rejects **"dense grids of tiny product cards … discount badges … 'X sold' clutter"** — products here are **few, large, human-forward pieces, story first**. Two failure modes matter: (1) a price that can be tampered with client-side (a security hole at checkout); (2) product data so thin the buyer can't know what they're getting (the "Exactly What to Expect" gap, P14). This spec owns the catalog write path; P14 owns the required structured spec.

*(No user quotes — grounded in feature-tree S8 + NARRATIVE's rejection of the transactional grid.)*

---

## Proposed Solution

A product CRUD surface (entered from the dashboard, S7) that writes the locked `products`/`media`/`product_categories` shape.

**UX Flow:**

1. Seller opens product management (own-store, from S7) and adds a product or edits an existing one.
2. Seller sets: title, description (maker's own copy, AI-assist OK ≠ transcript, D10), ordered images, optional 3D model (`model3d_id`), **price** as an integer amount in **minor units + an explicit `currency`** (default GBP), linked narration clips (`narrationClipTags` → `videos.id`), inventory (`in-stock | made-to-order | sold-out`, optional qty), badges (`one-of-a-kind | made-to-order | limited`), and category assignment.
3. On save, the product is written to `products` (+ `media`, `product_categories`); it appears live in the world via `product-showcase` and gets a `product-detail` page.
4. Result: a real, priced, richly-described product the buyer journey can render and checkout can sell — with the price read server-side at checkout, never from the client.

---

## User Stories

- As a **seller**, I want to add a product with images, a price, and a description so that buyers can see and buy it.
- As a **seller**, I want to attach an optional 3D model so that buyers can inspect the piece — and have it gracefully fall back to the gallery if I don't.
- As a **seller**, I want to link a narration clip to a product so that the contextual video plays the right story on its page.
- As **KOL**, I want the price stored once in `products` and read server-side at checkout so that no client can tamper with what a buyer pays.

---

## Acceptance Criteria

**Happy Path**
- Given a seller adds a product, when they save with title, ≥ 1 image, and a price (minor units + currency), then a `products` row + `media` rows are written and the product renders in `product-showcase`.
- Given a product has linked narration clips, when its `product-detail` page renders, then the linked clip is available to the video engine for `product-narration` (NARRATE_SHRINK / PRODUCT_PAGE).

**Price / money contract (Part B S8/B7)**
- Given a price is set, when it is stored, then it is an **integer amount in minor units** with an **explicit `char(3)` currency** (default GBP) — never a float.
- Given a product is purchased, when checkout runs, then the price is read **server-side from `products`** (via `create_order`, prices read server-side) — a client-passed price is never trusted (Part B B0/B7).

**Optional 3D fallback**
- Given `model3d_id` is null and a viewer expects 3D, when the `product-detail` renders, then it silently falls back to the `image-gallery` variant (block-catalog §4).

**Empty State**
- Given a seller with no products, when product management loads, then it shows "add your first piece" with a clear CTA (empty ≠ blank; block-catalog §3 seller view).

**Loading State**
- Given a save or image/3D upload is in flight, when it runs, then a matched skeleton/progress indicator shows (never a bare spinner); the form stays usable.

**Error State**
- Given a validation failure (missing title, invalid price, no image), when the seller saves, then inline field errors appear and nothing is written until valid.
- Given an image/3D upload fails, when it occurs, then a quiet inline error + retry appears and prior media is retained.

**Edge Case**
- Given inventory is `sold-out`, when the product renders, then add-to-cart reflects unavailability (block-catalog §4: add-to-cart disabled if inventory unresolved/unavailable).
- Given a product's linked clip is later deleted, when the page renders, then narration falls back gracefully (no broken binding; the video engine returns no match → keeps the persistent clip).

---

## UX / UI Notes

Surface: product management runs in **KOL seller-tool chrome** (curated); the products themselves render in the **seller's custom shop** (D15) via `product-showcase`/`product-detail`.

**Key Interactions:**
- Product form: title, description, image uploader (ordered, `focalPoint`), optional 3D uploader, price (amount + currency), inventory, badges, narration-clip picker, category picker.
- List of existing products with edit/delete.

**Four states (also in ACs):**
- **Empty** — "add your first piece" CTA (empty ≠ blank).
- **Loading** — save/upload progress matched to the form; form usable.
- **Error** — inline validation + upload retry; media retained.
- **Success** — product live in the world (`product-showcase`) with its own `product-detail` page.

**Edge Cases:**
- No generic 3-column card grid — showcase uses `rail`/`masonry`/`featured-single` (block-catalog §3; NARRATIVE anti-grid).
- Price shown in mono/tabular figures on render.
- Mobile web → single-column form.

---

## Technical Requirements

### Backend Changes
- Product CRUD writing `products(title, description, materials, price_amount, currency, inventory_status, inventory_qty, model3d_id, badges)`, `media`, `product_categories` (Part B S8). Own-store only (RLS).
- **Price:** integer `price_amount` (minor units) + `currency char(3)` default GBP — no floats (Part B B0). Price lives in `products` ONLY; checkout's `create_order` reads it server-side (Part B B7) — never accept a client-set price.
- Link narration clips via `narrationClipTags` → `videos.id` references (store-config.schema §2.4).
- **Known-deferred:** `create_order` has **no inventory check yet** (N3). Do NOT build inventory enforcement at checkout in this phase; cite it as known-deferred (adding it = new migration = Irreversible). S8 still stores inventory status/qty for display.
- No LLM in S8 (product description may be AI-assisted upstream via S3 §5.6, but S8 is a CRUD surface) — no eval/cost-log obligation here.

### Frontend Changes
- Product management route (role-gated `seller`, own-store): product list + form (images, optional 3D, price+currency, inventory, badges, narration-clip picker, categories), the four states.

### Database Changes
- Writes **`products`**, **`media`**, **`product_categories`** (Part B S8). Data-need tables = **Irreversible tier** (database-engineer before backend-engineer). Do NOT add columns; do NOT store price anywhere but `products`.

### External Services
- Supabase storage / CDN for images and optional GLB 3D models. No third-party APIs.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Product save < 1s (excluding large media upload, which streams with progress). | Interaction timing |
| **Security** | Own-store CRUD via RLS; price stored in minor units in `products` and read server-side at checkout (never client-passed, Part B B0/B7); no PII in logs. | RLS test + checkout price-source test |
| **Scalability** | Works with a realistic per-store catalog (dozens–hundreds of products) without list degradation. | Seeded load test |
| **Accessibility** | Form fields labelled; image `alt` required (never empty, store-config.schema §2.3); 3D viewer has a gallery fallback; keyboard-navigable. | axe-core + screen-reader |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth + role→seller | Feature/Data | Not Started | H |
| S7 dashboard (entry point) | Feature | Not Started | M |
| `products` / `media` / `product_categories` tables | Data (Irreversible) | Not Started | H |
| P6 video engine (narration-clip references) | Feature | Not Started | M — clip linking |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B6 product page | frontend | Yes | Renders product-detail |
| B7 checkout | backend | Yes | Reads price server-side from `products` |
| P14 exactly-what-to-expect | frontend | Yes | Required specs attach per product |

---

## Out of Scope

- The required structured product spec (P14 `product_specs`) — separate feature; product management stores catalog fields, P14 owns the required-completeness standard.
- Provenance (P13 `product_provenance`).
- Checkout / order creation (B7) — S8 only stores the price; checkout reads it.
- Inventory enforcement at checkout (known-deferred N3).
- 3D model generation (upload-only for MVP; generation is an open question per concept-lock).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Client-tamperable price at checkout | L | H | Price stored in `products` only, read server-side by `create_order` (Part B B7); never accept a client price |
| Float/rounding errors in money | L | H | Integer minor units + explicit currency, no floats (Part B B0) |
| Oversell (no inventory check at checkout) | M | M | Known-deferred (N3) — document, don't paper over; display inventory status now |
| Product data too thin for buyer trust | M | M | P14 required-spec completeness gates publish; S8 captures the catalog fields |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Sellers who add ≥ 1 product | N/A | 100% of published stores | Always |
| Price-tampering incidents at checkout | N/A | 0 (server-side read) | Always |
| Products with ≥ 1 image + valid price | N/A | 100% (validation-enforced) | Always |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | CRUD works; price stored minor-units + read server-side; 3D fallback; 4 states pass | 3–5 days |
| Private Beta | First seller cohort | Real catalogs render in showcase/detail; no price tampering | 1–2 weeks |
| Full Launch | All sellers | Metrics on target | — |

**Feature Flag** — `product-management-enabled`? Yes. Owner: CTO.

**Rollback Plan** — Trigger: price-source or media-write bug. Decision maker: CTO. Steps: disable flag → existing products keep rendering/selling (price already in `products`) → new edits paused. Data impact: `products`/`media` writes are additive; no destructive migration.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | 3D model source — upload-only for MVP (open concept-lock question) or allow generation later? | CPO + CTO | Post-MVP |
| 2 | Inventory enforcement at checkout is known-deferred (N3) — confirm display-only inventory is acceptable for MVP. | CTO | Before build |
| 3 | Multi-currency — is default GBP + explicit currency per product enough for MVP, or is per-store currency config needed? | CBO + CTO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
