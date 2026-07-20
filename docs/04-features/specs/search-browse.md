# Search & Browse (B11)

<!-- Phase-5 spec worker (W3). New buyer subsystem. Anti-flattening guard: results show makers-on-film and OPEN THE MAKER'S WORLD, never a flat product grid. No dedicated search table — tsvector+GIN+pg_trgm on stores/products + categories. Flag search-index infra as an Open Question for CTO. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Search & Browse (Second Shopping Mode) |
| **Feature Slug** | search-browse |
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
| **Reach** | 7 | Any buyer with intent ("I want a stoneware mug") who won't only browse the feed (assumed — low confidence; basis "4 seed worlds + first cohort"). |
| **Impact** | 2 | Medium — enables directed discovery, but the discovery feed (B1) stays the default surface (`est.`). |
| **Confidence** | 60% | Search-index infra is an **open question** for CTO (no dedicated table; `tsvector`/GIN/`pg_trgm` approach un-benchmarked at this scale) — confidence deliberately lower (`assumed — low confidence`). |
| **Effort** | 3 person-weeks | New subsystem: index setup, ranking, filters, categories, maker-first results render (`est.` — `(ask CTO)` on the index tuning). |
| **RICE Score** | (7 × 2 × 0.6) ÷ 3 = **2.8** | |

**MoSCoW Classification:** Should Have — D16-1 folds "Two Shopping Modes" into MVP, but *"the default stays the discovery feed"*; search is the second mode, not the primary one.

**Why this priority?** D16-1 is explicit that search must exist **and** must not become a flat grid. It is a sizeable new subsystem (concept-lock note on D16) with the highest un-knowns of the batch — hence lower RICE and an infra open question surfaced to CTO.

---

## Overview

A second shopping mode: search by keyword, browse categories, and filter (including delivery requirements) — where **results are makers-on-film that open the maker's world, never a flat product grid** (D16-1). It reuses the discovery-feed card language (B1) and the world-unfold path (B3); the default surface remains the discovery feed. There is **no dedicated search table**: it queries `stores` / `products` via generated `tsvector` + GIN + `pg_trgm` fuzzy matching, with categories via a `categories` / `product_categories` join.

---

## Problem

D16-1 folds in *"Two Shopping Modes — add search/categories/filters/delivery, but results show makers-on-film and open the maker's world, never a flat grid (default stays the discovery feed)."* The whole product exists to reject *"the transactional grid entirely (TikTok/Complex)"* (NARRATIVE) — a *"grid of stuff"* with *"zero human story"*. A buyer with specific intent still needs to *find* things; the risk is that adding search re-introduces exactly the flattened grid KOL is built against. The pain, in the buyer's terms: *"I know I want a hand-thrown mug — let me find the maker, not scroll a wall of identical thumbnails"* (grounded in NARRATIVE anti-grid + D16-1; USER-INSIGHTS.md empty).

---

## Proposed Solution

A search + browse surface whose results are **maker-first cards** (the B1 `hero-video` feed language) that, on tap, follow the B3 world-unfold path — never a product grid. Keyword search hits maker + product text; categories and filters (materials, delivery requirements) narrow the maker set.

**UX Flow:**

1. Buyer opens search/browse (a mode alongside the default feed) and types a query or picks a category/filter (including delivery requirements).
2. The system matches **makers** (`profiles`/`stores`) and their products via full-text (`tsvector`+GIN) with `pg_trgm` fuzzy fallback on handle/title; categories narrow via `categories`/`product_categories`.
3. Results render as **makers-on-film cards** (reuse B1 feed cards), one per matching maker — not a product grid.
4. Buyer taps a result → the maker's world unfolds (reuse B3 WORLD_OPEN), landing them in the world, scoped to the product if the match was product-specific.
5. Result: directed discovery that still delivers a buyer into a human's world, never a flat catalogue.

---

## User Stories

- As a buyer with intent, I want to search for a craft or item so that I can find the right maker quickly.
- As a buyer, I want category and delivery filters so that I only see makers who can actually serve me.
- As a buyer, I want results that open a maker's world so that even directed shopping feels like meeting a person, not scanning a grid.

---

## Acceptance Criteria

**Happy Path**
- Given a keyword query, when the buyer submits it, then matching **makers** appear as makers-on-film cards (B1 language), ranked by full-text relevance, **one card per maker** — and **no uniform product grid is rendered** (the anti-flattening guard).
- Given a result card, when the buyer taps it, then the maker's world unfolds via the B3 WORLD_OPEN path (scoped to the matched product where the match was product-specific).
- Given a category or delivery filter, when applied, then results narrow to makers matching via `categories`/`product_categories` and the delivery predicate.
- Given a mis-typed query (e.g. "stonware"), when submitted, then `pg_trgm` fuzzy matching still surfaces the intended makers.

**Empty State**
- Given a query with no matches, when results render, then the buyer sees "No makers match yet" with **suggested makers** (fall back to the discovery feed) — **empty ≠ blank**, never a dead end.

**Loading State**
- Given a query in flight, when results render, then maker-card skeletons matched to the feed card layout appear (poster + text bars), never a centered spinner.

**Error State**
- Given the search query fails, when results render, then a quiet inline "Search is taking a moment" + retry appears, and the default discovery feed remains reachable — the failure never blocks browsing.

**Edge Case (anti-flattening — load-bearing)**
- Given **any** result set (1, 50, or 0 makers), when it renders, then it uses maker-first cards that open worlds — there is **no code path that renders a flat product grid** (mirrors the B1 "AC must forbid a uniform product grid" guard).
- Given results include an unpublished store, when matched, then it is excluded (only published stores are searchable — RLS/index scoped to published).

---

## UX / UI Notes

Surface touched: **KOL's own product UI** (the search/browse chrome) → FIXED curated system (`theme.kind:"curated"`). The result cards reuse B1's `hero-video` feed variant (maker-on-film); tapping enters the maker's own-brand world (B3). The film always wins even in results — cards lead with the maker's poster/clip, not a product thumbnail wall.

**Key Interactions:**

- Search input + category chips + filter panel (materials, delivery requirements).
- Results: maker-first cards (reuse B1); tap → B3 world-unfold. Default view (no query) = the discovery feed.

**Edge Cases:**

- No results → suggested makers (feed fallback), not a void.
- Very broad query → cap + relevance-rank; still one card per maker (no per-product explosion into a grid).
- Slow index → skeletons matched to feed cards; the default feed stays available.

---

## Technical Requirements

> **Risk tier: Full** (new subsystem, DB read surface, index infra). The **index/infra approach is an Open Question for CTO** (below) — do not treat the `tsvector`/GIN/`pg_trgm` shape as settled scale-tested; it is the confirmed *data approach* (B2 §B11) but its tuning is open. Any new index migration = **Irreversible tier** (DB before backend).

### Backend Changes

- Full-text search over `stores` (name/craft/bio) and `products` (title/description/materials) via a generated `tsvector` + GIN index; `pg_trgm` fuzzy match on `handle`/`title`. Category browse via `categories(slug, name, parent_id)` + `product_categories`.
- Results resolve to **makers** (`profiles`/`stores`); the tap-through reuses the B3 world-open path and, where matched to a product, the B5 product-scoped entry — **not** a new render path.
- No engine change: the video engine (P6) is not the search ranker; search ranks by text relevance, then hands the maker to the existing world path.

### Frontend Changes

- Search/browse surface (curated chrome): input, category chips, filter panel, maker-first result cards (reuse B1).
- All-4-states: empty (suggested makers), loading (feed-card skeletons), error (retry + feed fallback), success (maker-first results).

### Database Changes

**Data need (Irreversible tier — DB before backend; NO dedicated search table — B5 gap flag):**

| Object | Use | Status |
|---|---|---|
| `stores(name, craft, bio)` — generated `tsvector` + GIN | maker full-text | Locked table; **index un-tuned (OQ)** |
| `products(title, description, materials)` — generated `tsvector` + GIN | product full-text | Locked table; **index un-tuned (OQ)** |
| `pg_trgm` fuzzy on `handle` / `title` | typo-tolerant match | Approach confirmed (B2 §B11) |
| `categories(slug, name, parent_id)`, `product_categories` | category browse | Locked |

- **Do NOT invent a `search_index` table** (B5 gap flag #2 — "no dedicated table"). "makers" = `profiles`/`stores`.

### External Services

- None in MVP. (No external search service; explicitly kept in-DB per B2 §B11.)

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Search P95 < 400ms at the seed-cohort corpus size; **infra approach benchmarked before GA** (OQ). | k6 / query benchmark on seeded corpus. |
| **Security** | Only published stores are searchable; RLS/index scoped to published; no draft leakage. | Draft-store exclusion test. |
| **Scalability** | Relevance + latency hold as the corpus grows past the seed cohort (revisit index/infra if not). | Load test with scaled corpus. |
| **Accessibility** | Search input labelled; filters keyboard-operable; result cards have accessible maker names (not image-only). | axe-core + keyboard walkthrough. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B1 Discovery feed (card language reused for results) | Feature (W2) | Not Started | H — results have no card to reuse |
| B3 World-unfold (result tap-through) | Feature (W2) | Not Started | H — results have nowhere to go |
| `categories`/`product_categories` seeding | Data | Not Started | M — category browse empty without seed |
| Search index infra decision | CTO | **Open** | H — subsystem shape depends on it |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| Product management taxonomy (S8) | W4 | No | products must carry categories to be browsable |

---

## Out of Scope

- A flat product-grid results view — explicitly forbidden (D16-1 anti-flattening; this is the whole point).
- ML / semantic / embedding search — MVP is keyword + fuzzy + category; the video engine's AI-ranker slot (P6 §4) is a separate, later concern.
- A dedicated external search service (Algolia/Elastic) — kept in-DB for MVP (B2 §B11).
- Personalized search ranking by `buyer_signals` — relationship ranking is the video engine's job (P6+), not search.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Search regresses into a flat product grid (kills the brand) | M | H | Load-bearing AC forbids any grid render path; results are maker-first cards reusing B1. |
| In-DB `tsvector`/`pg_trgm` doesn't scale past seed cohort | M | M | Benchmark before GA; index/infra is a flagged CTO OQ; approach swappable without changing the maker-first result contract. |
| Category taxonomy missing / thin at launch | M | M | Category browse falls back to keyword + feed suggestions; seed categories with S8. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Search sessions that end in a world-open | 0% | ≥ 40% of search sessions | 30 days post-launch |
| Zero-result searches shown a suggested-maker fallback | — | 100% (no dead ends) | ongoing |
| Grid-render incidents | — | 0 | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds + seeded categories | All 4 states pass; no-grid guard green; index benchmarked | 2–3 days |
| Gradual Rollout | 10% → 100% | Latency + relevance targets met | 1–2 weeks |
| Full Launch | All buyers | No P0; infra decision closed | — |

**Feature Flag** — Behind a flag? **Yes** — `search-browse-enabled` (new subsystem; keep the feed default reachable independently). Flag owner: CTO.

**Rollback Plan** — Trigger: latency SLA missed or a grid-render regression. Decision maker: CTO. Steps: disable `search-browse-enabled` → the discovery feed (B1) remains the default surface untouched. Index migrations are additive (backwards-compatible); dropping the index on rollback loses no store/product data.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Search-index infra (flagged to CTO):** confirm the `tsvector`+GIN+`pg_trgm` in-DB approach is scale-appropriate for the target corpus, and whether a dedicated index-refresh job (Inngest) is needed vs generated columns. No dedicated search table (B5). | CTO | pre-build |
| 2 | Relevance ranking weights across maker text vs product text vs category match — and how a product match scopes the world-open entry (B3 vs B5). | CTO + CPO | pre-build |
| 3 | Delivery-requirement filter source — which field/table backs "delivery reqs" (not enumerated in B2 §B11). | CTO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
