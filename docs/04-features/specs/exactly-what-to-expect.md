# Feature Spec — Exactly What to Expect (P14)

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Exactly What to Expect (Required Structured Product Info) |
| **Feature Slug** | exactly-what-to-expect |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 5 — spec authoring (Batch 4, Trust & Anti-Slop) |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 8 | Required on every published product — 4 seed worlds + first cohort *(assumed — low confidence on cohort size)*; every buyer on every product page sees it. |
| **Impact** | 3 | Massive — it is the expectation-accuracy standard that prevents "not as described" disappointment and feeds the reviews' expectation-accuracy signal (B6+). *(fact — per D16-4)* |
| **Confidence** | 85% | Field set and the required-before-publish rule are locked (D16-4; Part B §B4). *(est.)* |
| **Effort** | 2 person-weeks *(ask CTO)* | Structured spec capture + required-field validation as a publish precondition + buyer render. |
| **RICE Score** | (8 × 3 × 0.85) ÷ 2 ≈ **10.2** | Very high. |

**MoSCoW Classification:** Must Have.

**Why this priority?** It is a *required* standard (D16-4) — a publish precondition — and it directly serves the honest-trust promise by setting accurate expectations before purchase. It also feeds the review expectation-accuracy loop (B6+).

---

## Overview

Exactly What to Expect is a **required structured product-info standard** (D16-4). Before a product can publish, the maker must complete a fixed set of fields — dimensions, materials, texture, handmade variation, production time, shipping, care, repairs, returns, and customization limits. The completed spec surfaces on the product page and feeds the reviews' expectation-accuracy signal (B6+), so buyers know exactly what they are getting and disappointment from mismatched expectations is structurally reduced.

---

## Problem

Handmade goods vary — that is their nature, and the honest way to sell them is to set expectations precisely, not to hide the variation. The anti-pattern KOL rejects is the transactional grid where *"23K sold"* clutter and discount urgency substitute for real product information (concept-lock NARRATIVE, TikTok/Complex "old way to reject").

D16-4 folds in *"Exactly What to Expect — required structured product-info standard (dimensions/materials/variation/production time/shipping/care/repairs/returns/customization limits)"* (concept-lock D16). The word **required** is load-bearing: this is not an optional nicety, it is a completeness standard enforced before publish. Combined with verified reviews' expectation-accuracy (D16-5, B6+), it closes the loop between what the maker promises and what the buyer received — the honest-trust guarantee at the product level.

*(USER-INSIGHTS.md is empty — grounded in concept-lock D16-4 and the honest-trust guardrail, not fabricated user quotes.)*

---

## Proposed Solution

A structured, required spec per product, validated for completeness as a publish precondition, surfaced on the product page and referenced by reviews' expectation-accuracy.

**The required fields (10 content fields, one row per product):** dimensions, materials, texture, handmade variation, production time, shipping, care, repairs, returns, customization limits.

**UX Flow:**

1. In product management (S8), the maker fills the structured "what to expect" fields for a product.
2. Completeness is validated: required fields must be present before the product's world can publish.
3. On the buyer's product page, the completed spec renders as a clear, structured section.
4. When a buyer later reviews the product, the review's expectation-accuracy (B6+) references this spec — did the piece match what was promised?
5. The buyer buys with accurate expectations; the loop feeds back through reviews.

**Publish precondition (product-level).** Required fields must be complete before the product ships in a published world. This composes with the store-version publish gate (P10/S6): see Open Question #1 for the exact composition point (product-save vs. store-publish vs. folded into the P10 gate).

---

## User Stories

- As a **seller**, I want a clear checklist of the product info buyers need, so I set accurate expectations and reduce "not as described" disputes.
- As a **buyer**, I want to know a piece's exact dimensions, materials, variation, production time, shipping, care, repairs, returns, and customization limits before I buy, so there are no surprises.
- As the **platform**, I want this info required before publish, so every published product sets honest expectations (D16-4).

---

## Acceptance Criteria

**Happy Path — complete spec renders**
- Given a maker completes all required fields for a product, when the product page renders, then the structured "what to expect" section shows every field clearly.

**Required-before-publish (the "required" rule)**
- Given a product missing one or more required fields, when the maker attempts to publish the world containing it, then publish is blocked for that product's incomplete spec, with the missing fields identified (composition point per Open Question #1).
- Given all required fields are complete, when the maker publishes, then this precondition passes for that product.

**Empty State — seller must complete**
- Given a product with no spec yet, when the seller views product management, then the required fields are shown as to-complete (publish-blocking), not silently optional.

**Loading State**
- Given the spec is loading on the product page, when it renders, then it shows a skeleton matched to the field layout, never a spinner.

**Error State — validation inline**
- Given the maker enters an invalid value (e.g. empty required field on save), when they save, then the error is shown inline on the offending field, recoverable, without blocking the rest of the form.

**Feeds review expectation-accuracy**
- Given a published product with a complete spec, when a buyer submits a review, then the review's expectation-accuracy (B6+) can reference this spec's promises (the two features share the expectation-accuracy loop).

**Data contract**
- Given a completed spec, when it persists, then it writes exactly one `product_specs` row per product with fields `(product_id, dimensions, materials, texture, handmade_variation, production_time, shipping, care, repairs, returns, customization_limits)` — per Part B §B4.

---

## UX / UI Notes

**Surface touched:** captured in the seller's product management (S8) and rendered on **seller shops** (the buyer's product page within a `theme.kind:"custom"` world, D15). Anti-slop for shops remains AA gate + critic + approval (not a palette cap).

**4-state (mandatory — rendered UI surface):**
- **Empty:** seller must complete the required fields → shown as a to-complete checklist that is publish-blocking (empty ≠ blank; it is an actionable requirement, not a void).
- **Loading:** skeleton matched to the field layout; no spinner.
- **Error:** invalid/empty required field on save → inline error on the offending field, recoverable, non-blocking to the rest of the form.
- **Success:** full structured spec shown on the product page.

**Key Interactions:**
- The spec section on the product page is scannable (structured rows/labels), sits alongside description and reviews, and never competes with the film.
- Completeness state is visible to the maker in product management (which fields still block publish).

**Edge Cases:**
- A field that is genuinely N/A for a product (e.g. no customization offered) still requires an explicit honest value (e.g. "No customization") rather than being left blank — so the buyer sees a definitive answer, not an omission. (Confirm the exact "N/A allowed vs. explicit" rule in Open Question #2.)
- Very long care/returns text → typeset within layout limits, expandable if needed.

---

## Technical Requirements

### Backend Changes
- Structured spec CRUD for the maker's own products (own-store, RLS-scoped; Part B §B0 — Full tier on write).
- **Completeness validation as a publish precondition** — required fields must be present before the product ships in a published world. Coordinate the enforcement point with the store-version publish gate (P10/S6) — see Open Question #1. Enforced at the data layer, not app-side only (Part B §B0).
- Buyer render is read-only (Lite tier).

### Frontend Changes
- Structured spec capture UI within product management (S8-adjacent; coordinate with W4) with inline validation, and the buyer-facing product-page spec section (all 4 states).

### Database Changes
- **Data need (Full tier on write / Lite on read — database-engineer before backend-engineer):** `product_specs(product_id, dimensions, materials, texture, handmade_variation, production_time, shipping, care, repairs, returns, customization_limits)` — per Part B §B4. Required structured standard (D16-4); 10 content fields; **one row per product.** No new tables/columns proposed.

### External Services
- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Completeness (core)** | No product may publish with an incomplete required spec (D16-4). | E2E: incomplete spec → publish blocked; complete → passes. |
| **Security** | A maker can only write specs for products on their own store; completeness is DB-enforced, not app-side only. | RLS + precondition test: cross-store write rejected; app-side bypass rejected. |
| **Accessibility** | Spec fields/labels meet AA within the world's theme (P9 AA gate); the section is keyboard navigable and screen-reader legible. | axe-core + screen-reader walkthrough. |
| **Consistency** | The spec's field semantics align with the reviews' expectation-accuracy reference (B6+). | Cross-check field mapping with B6+ during build. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| S8 product management (where the spec is captured) | Feature | In Progress (Batch 3) | M |
| P10 / S6 publish gate (composition point for the required-before-publish rule) | Feature | In Progress (Batch 4/3) | H |
| B6 product-page (where the spec renders) | Feature | In Progress (Batch 2) | M |
| `product_specs` table | Data | Not Started (Full) | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B6+ trustworthy-reviews (expectation-accuracy) | frontend-engineer | Yes | Review expectation-accuracy references this spec. |
| P10 / S6 publish gate | backend-engineer | Yes | Product-level completeness composes with the store publish precondition (OQ#1). |

---

## Out of Scope

- Narrative provenance (role/materials/process/media) — owned by **P13** (`proof-of-product.md`); P14 is the *required structured completeness standard*, P13 is *shown provenance*.
- The reviews feature and verified-purchase — owned by **B6+** (`trustworthy-reviews.md`); P14 only supplies the promised-spec side of the expectation-accuracy loop.
- The store-version publish gate mechanics — owned by **P10 / S6**; P14 contributes a product-level precondition that composes with it (OQ#1).
- Pricing/inventory — owned by **S8** (`product-management.md`).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Required-before-publish enforced app-side only (bypassable) | L | H | DB-enforced completeness precondition (Part B §B0); coordinate the exact gate point with P10/S6 (OQ#1). |
| Maker friction from required fields → abandonment | M | M | Fields reuse info makers already know; inline validation; the standard is a trust differentiator worth the friction (D16-4). |
| Composition ambiguity with the store publish gate | M | M | OQ#1 — resolve where product completeness is enforced relative to P10's store-version gate before build. |
| Field semantics drift from B6+ expectation-accuracy | M | M | Cross-check the field mapping with B6+ at build. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Published products with incomplete required specs | N/A | 0 (structural) | Ongoing |
| "Not as described" review sentiment (expectation mismatch) | N/A | Trending down vs. first cohort | 60 days post launch |
| Products publishing with a complete spec on first attempt | N/A | ≥ 70% *(assumed)* | Internal testing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (D12) | Required-before-publish enforced; all 4 states; feeds B6+ | 1–2 days |
| Private Beta | First seller cohort | Field completeness workable for real makers; no publish bypass | 1 week |
| Full Launch | All products | All prior stages pass | — |

**Feature Flag**
- Behind a feature flag? No — it is a required publish standard (D16-4); making it optional would defeat its purpose. (The buyer-render section can degrade gracefully, but the required-before-publish rule is not flagged off.)

**Rollback Plan**
- Rollback trigger: a publish path bypasses the completeness precondition.
- Rollback decision maker: CTO.
- Rollback steps: fail-closed on publish (blocking an incomplete-spec publish is the safe state); patch the precondition; re-enable.
- Data impact: `product_specs` is additive; no data loss on code rollback.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Composition point:** is the required-before-publish rule enforced at product save, at product publish, or folded into P10's store-version publish gate (which today checks AA + approved_sections + trust anchor, not product_specs completeness)? P10 owns the store gate; product_specs is product-scoped — resolve the exact enforcement seam. | CTO + CPO | Before build |
| 2 | For a genuinely N/A field (e.g. no customization offered), is an explicit honest value required, or is a structured "N/A" allowed? Confirm the completeness rule. | CPO | Build |
| 3 | Exact field-semantics mapping between `product_specs` and B6+ review expectation-accuracy — align so the loop references the same promises. | CPO + frontend-engineer | Build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
