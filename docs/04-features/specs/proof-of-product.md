# Feature Spec — Proof of Product (P13)

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Proof of Product (Maker-Declared Provenance) |
| **Feature Slug** | proof-of-product |
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
| **Reach** | 7 | Optional per-product surface — 4 seed worlds + first cohort *(assumed — low confidence on cohort size)*; reaches buyers on products where the maker declares provenance. |
| **Impact** | 2 | Medium-high — deepens trust with shown provenance (role, materials, process, media), but it is a supporting trust layer, not the identity anchor (P11). *(est.)* |
| **Confidence** | 80% | Data contract (`product_provenance`) is locked; the honest-framing constraint is unambiguous. *(est.)* |
| **Effort** | 2 person-weeks *(ask CTO)* | Provenance capture (seller) + surfacing (buyer) + media binding; no verification logic. |
| **RICE Score** | (7 × 2 × 0.80) ÷ 2 ≈ **5.6** | Solid — a trust deepener. |

**MoSCoW Classification:** Should Have.

**Why this priority?** It is one of the D16 folded-in features (D16-2) that makes trust concrete at the product level. It ships in MVP because "shown provenance" is a core differentiator vs. a faceless grid — but it is optional per product, so it ranks below the load-bearing gates (P9/P10) and the identity badge (P11).

---

## Overview

Proof of Product lets a maker **declare and show** the provenance of a piece — their role in making it, the materials, the process, the production location, any partners, and process media (photos/video of the making). It surfaces on the product and store surfaces as an honest, maker-authored record. It is explicitly **maker-declared, not third-party physically verified** — that framing is the honest-trust guard (D7): the platform never implies an inspection it did not perform.

---

## Problem

KOL exists to replace the faceless transactional grid with a felt human relationship — buyers *"meet the human, trust them, and buy"* (concept-lock). D16-2 folds in *"Proof of Product — maker-declared & shown provenance (role, materials, process, location, partners, process media); NOT 3rd-party physical verification (that stays roadmap per D7)"* (concept-lock D16).

The honesty tension is the whole design constraint. The founder is explicit: *"Trust must be honest. No claim we can't back (that's why 'product physically verified' is roadmap, not MVP)."* (concept-lock guardrails), and the roadmap list names *"Product physical-authenticity verification ('exactly as real life') — needs inspection ops"* as out of MVP. So Proof of Product must give buyers rich, believable provenance **without** ever implying the platform verified it. The provenance is the maker's declaration, shown with their own process media — credible because it is specific and shown, not because KOL stamped it.

*(USER-INSIGHTS.md is empty — grounded in concept-lock D16-2 and the D7 honesty guardrail, not fabricated user quotes.)*

---

## Proposed Solution

A per-product provenance record the maker fills in (declares) and shows, surfaced on the product/store. Framed everywhere as maker-declared.

**Provenance fields (maker-declared):** the maker's role in making it, materials, process, production location, partners, and process media (ids into `media`).

**UX Flow:**

1. In product management (S8), the maker optionally fills in a product's provenance: their role, materials, process, location, partners, and attaches process media.
2. The record persists to `product_provenance` for that product.
3. On the buyer's product page (and, where relevant, the store), the provenance surfaces in a provenance section, complemented by `process-reel` and `craft-story` blocks showing the making.
4. The framing is consistently "declared by the maker" — never "verified by KOL."
5. The buyer sees specific, shown provenance and trusts the piece because it is concrete, not because of a false verification stamp.

---

## User Stories

- As a **seller**, I want to show exactly how and where I made a piece — my role, materials, process, and footage of the making — so buyers see the real craft behind it.
- As a **buyer**, I want to see a piece's provenance and the making itself, so I can judge its authenticity honestly.
- As the **platform**, I want provenance framed as maker-declared, so we never imply an inspection we didn't do (D7 honesty).

---

## Acceptance Criteria

**Happy Path — declared provenance with process media**
- Given a maker fills a product's provenance (role, materials, process, location, partners) and attaches process media, when the product page renders, then the provenance section shows those fields plus the process media, framed as maker-declared.

**Honest framing — never implies 3rd-party verification**
- Given any provenance render, when it is shown to a buyer, then it is labeled as maker-declared and **never** presents language implying KOL physically verified the product (D7; concept-lock roadmap exclusion).

**Empty State — optional, omitted when unset**
- Given a product with no provenance declared, when the seller previews it, then the seller sees a prompt to add provenance; when a buyer views the live product, then the provenance section is omitted (empty ≠ blank — not a hollow "no provenance" frame).

**Loading State**
- Given provenance is loading, when the section renders, then it shows a skeleton matched to the real layout (text rows + media placeholders), never a centered spinner.

**Error State — media fails**
- Given a process-media asset fails to load, when the section renders, then the declared text provenance still renders alone (media failure degrades to text, quietly and inline; it never blocks the section).

**Edge Case — partial provenance**
- Given a maker declares only some fields (e.g. materials + process, no partners), when the section renders, then only the declared fields show; absent optional fields are simply omitted, not shown empty.

**Data contract**
- Given a provenance record, when it persists, then it writes `product_provenance(product_id, maker_role, materials, process, production_location, partners, process_media_ids uuid[])`; `process_media_ids` has no element FK and is validated app/Zod-side (Part B §B4).

---

## UX / UI Notes

**Surface touched:** rendered on **seller shops** (the maker's product/store, `theme.kind:"custom"`, D15) and read by the buyer; captured in the seller's product management (S8). Anti-slop for shops remains AA gate + critic + approval (not a palette cap).

**Blocks:** a provenance section, complemented by `process-reel` (making-of footage, block-catalog §6) and `craft-story` (the making narrative, block-catalog §2). Process media binds ids into `media`.

**4-state (mandatory — rendered UI surface):**
- **Empty:** seller preview shows a prompt to add provenance (tied to the making); a live product with no provenance omits the section entirely (empty ≠ blank).
- **Loading:** skeleton matched to the real provenance layout (text rows + media placeholders); no spinner.
- **Error:** a process-media asset fails → declared text provenance renders alone; the failure is quiet and inline, never blocking.
- **Success:** provenance fields + process media shown, framed as maker-declared.

**Key Interactions:**
- Process media plays as `process-reel` (autoplays muted on scroll-in, per block-catalog §6) — the film always wins, so it never competes with the persistent hero.

**Edge Cases:**
- A maker declares provenance for one product but not another → only the declared product shows the section.
- Long partner lists / long process text → typeset within block length limits; media degrades to text on failure.

---

## Technical Requirements

### Backend Changes
- Provenance CRUD for the maker's own products (own-store, RLS-scoped; Part B §B0). No verification logic — this is a maker declaration, not an inspection.
- Framing/labeling enforced at the content layer so the surface always reads as maker-declared.

### Frontend Changes
- Provenance capture UI within product management (S8-adjacent; coordinate with W4 so it lives alongside product edit) and the buyer-facing provenance section render (all 4 states), plus `process-reel`/`craft-story` composition.

### Database Changes
- **Data need (Full tier — database-engineer before backend-engineer):** `product_provenance(product_id, maker_role, materials, process, production_location, partners, process_media_ids uuid[])` and `media` — per Part B §B4. **Maker-DECLARED only, NOT 3rd-party physical verification** (roadmap per D7). `process_media_ids` is `uuid[]` with no element FK — app/Zod validates referential integrity. No new tables/columns proposed.

### External Services
- None. No inspection service, no third-party verifier — that is roadmap (D7), and building one is explicitly out of scope.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Honesty (core)** | No provenance render may imply platform/3rd-party physical verification; all provenance is labeled maker-declared. | Content review + E2E snapshot of the render labels. |
| **Security** | A maker can only write provenance for products on their own store (RLS own-store). | RLS test: cross-store provenance write → rejected. |
| **Accessibility** | Provenance text meets AA within the world's theme (P9 AA gate); process media has captions/alt where applicable. | axe-core + screen-reader walkthrough. |
| **Resilience** | Media failure degrades to text; the section never blocks the rest of the world. | E2E with a broken media id → text renders alone. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| S8 product management (where provenance is captured) | Feature | In Progress (Batch 3) | M |
| P4 store renderer + `process-reel`/`craft-story` blocks | Feature | In Progress (Batch 1) | M |
| `product_provenance` table + `media` | Data | Not Started (Full) | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B6 product-page | frontend-engineer | Yes | Provenance section surfaces on the product page. |
| P11 trust badges | frontend-engineer | Yes | Complementary trust layer (identity vs. product provenance) — kept distinct. |

---

## Out of Scope

- **Third-party / physical product verification** ("exactly as real life") — **roadmap** per D7; needs inspection ops (concept-lock roadmap exclusion). This spec must not imply it.
- Maker-identity verification (Real-Maker badge) — owned by **S9 / P11** (a separate trust layer).
- The required structured product spec (dimensions, materials standard, etc.) — owned by **P14** (`exactly-what-to-expect.md`); provenance is narrative/shown, P14 is the required completeness standard.
- Reviews and verified-purchase — owned by **B6+** (`trustworthy-reviews.md`).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Copy accidentally implies KOL-verified provenance | M | H | Framing enforced as maker-declared in the content layer + content review; the honest-framing constraint is an explicit AC. |
| Makers skip provenance (adoption) | M | M | Optional but prompted in product management; process media reuses footage the maker already has. |
| Media referential integrity (uuid[] no FK) drift | M | M | App/Zod validation of `process_media_ids` against `media` (Part B §B4). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Renders implying 3rd-party verification | N/A | 0 (honesty) | Ongoing |
| Products with declared provenance | N/A | ≥ 50% of seed-world products *(assumed)* | Internal testing |
| Buyers who view the provenance section | N/A | ≥ 20% *(assumed — low confidence)* | 30 days post launch |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (D12) | All 4 states; maker-declared framing; media degrades to text | 1–2 days |
| Private Beta | First seller cohort | Provenance clarity validated; no false-verification language | 1 week |
| Full Launch | All shops | All prior stages pass | — |

**Feature Flag**
- Behind a feature flag? Yes — `proof-of-product-enabled` (it is optional and additive; can ship independently of the load-bearing gates).
- Flag owner: CPO.

**Rollback Plan**
- Rollback trigger: honest-framing breach discovered.
- Rollback decision maker: CTO.
- Rollback steps: disable the flag (the provenance section simply hides — no dependent surface breaks).
- Data impact: `product_provenance` is additive; no data loss on rollback.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Exact placement of the provenance capture UI — inside S8 product edit, or a distinct provenance tab? Coordinate with W4. | CPO + frontend-engineer | Build |
| 2 | Does provenance surface on the store level (not just per product), and if so how does it aggregate multiple products' provenance? | CPO | Build |
| 3 | Confirm the honest-framing label copy so it is unmistakably maker-declared (never "verified"). | CPO + Design-Lead | Build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
