# Order History (B9)

<!-- Phase-5 spec worker (W3). Buyer aux surface. Grounds Problem in concept-lock buyer journey step 8 + D2/D6 (USER-INSIGHTS.md is empty — no fabricated quotes). -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Order History |
| **Feature Slug** | order-history |
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
| **Reach** | 6 | Every buyer who completes a purchase (B7) returns here (assumed — low confidence; Reach basis = "4 seed worlds + first cohort"). |
| **Impact** | 2 | Medium — a post-purchase table, not a signature moment, but the account-persistence payoff of D2 (`est.`). |
| **Confidence** | 80% | Data model fully locked (`orders`/`order_items`, RLS read-own); low product ambiguity (`fact`). |
| **Effort** | 1 person-week | Read-only list + detail on locked tables (`est.`; mark `(ask CTO)` if RLS policy authoring is heavier than assumed). |
| **RICE Score** | (6 × 2 × 0.8) ÷ 1 = **9.6** | |

**MoSCoW Classification:** Must Have — D2 makes auth in-scope specifically so "orders [are] tied to accounts"; without a history surface that promise is invisible.

**Why this priority?** Auth (P1) and checkout (B7) exist to make orders persist and personalize (D2). Order history is the minimal surface that lets a buyer *see* that persistence. Low effort, closes the D2/D6 loop.

---

## Overview

A buyer-facing account surface that lists a buyer's past orders and opens a per-order detail view, each order tied to their authenticated account (D2). It reads the `orders` / `order_items` rows created by checkout (B7) and reached from the thank-you moment (B8). It enables a buyer to return, days later, and re-find what they bought from a maker — the persistence that justifies auth being in-scope at all.

---

## Problem

The concept-lock buyer journey ends: *"Post-purchase — personal thank-you video; order saved to account"* (concept-lock step 8). D2 reversed the earlier "skip auth" decision precisely so that *"orders [are] tied to accounts"* and the buyer profile becomes *"a real personalization signal"*. Without a place to view them, a saved order is invisible: the buyer has no way to confirm a purchase went through, recall which maker they bought from, or return to that maker's world. The pain, in the buyer's terms: *"I bought something beautiful from a real person — where did it go, and how do I find them again?"* (grounded in concept-lock step 8 + D2; USER-INSIGHTS.md empty, backfill at D13).

---

## Proposed Solution

A KOL-platform account area (curated chrome, not a maker world) with an orders list and an order detail view. Read-only over locked tables; no new order-mutation paths.

**UX Flow:**

1. Buyer, signed in (P1 session), opens their account → **Orders**.
2. The list renders their own orders newest-first — each row shows order date, the maker/store, an item thumbnail + line summary, total (formatted from integer minor units + currency), and status.
3. Buyer clicks an order → **order detail**: the full `order_items` breakdown (title, variation, quantity, unit price snapshot), order total, status, and a quiet link back into the maker's world (B3) to re-visit or re-order.
4. Result: the buyer can confirm, recall, and re-find every purchase tied to their account — the D2 persistence made visible.

---

## User Stories

- As a buyer, I want to see a list of everything I've ordered so that I can confirm my purchases went through and recall what I bought.
- As a buyer, I want to open one order and see exactly what was in it at the price I paid so that I have a durable record.
- As a buyer, I want a way back into the maker's world from an order so that I can re-visit or re-order from a maker I now have a relationship with.

---

## Acceptance Criteria

**Happy Path**
- Given a signed-in buyer with two paid orders, when they open Orders, then both orders render newest-first, each showing date, store, item summary, formatted total, and status — and **only their own** orders (RLS read-own).
- Given a buyer on the orders list, when they click an order, then the detail view shows every `order_items` row with title, variation, quantity, and the `unit_price_amount` **snapshot** (not the current product price), plus the order total and status.
- Given an order detail, when the buyer taps "Visit the maker", then they land in that store's world (B3 WORLD_OPEN) for the order's `store_id`.

**Empty State**
- Given a signed-in buyer who has never ordered, when they open Orders, then they see a warm invitation ("No orders yet — when you buy from a maker, it lives here") with a route back into the discovery feed (B1) — **empty ≠ blank**.

**Loading State**
- Given the orders query is in flight, when the page renders, then row skeletons matched to the real list layout appear (avatar/thumb circle + two text bars + a total shimmer), never a centered spinner.

**Error State**
- Given the orders query fails, when the page renders, then any cached orders are shown; otherwise a quiet inline "Your orders are taking a moment" with a retry — the account chrome around it stays usable, error never blocks the page.

**Edge Case (access boundary)**
- Given buyer A crafts a request for buyer B's order id, when it hits PostgREST with A's JWT, then RLS returns zero rows (read-own only) — the boundary is DB-enforced, never app-side only (B0).
- Given an anonymous (signed-out) visitor, when they navigate to Orders, then they are routed to sign-in (P1) — no order data is reachable without a session.

---

## UX / UI Notes

Surface touched: **KOL's own product UI** (buyer account area) → FIXED curated system, `theme.kind:"curated"` enums only. This is NOT a maker world, so the 11 store blocks do not apply here (see Open Questions #1); it uses KOL platform chrome.

**Key Interactions:**

- Orders list: newest-first rows, each a click target into detail. Totals in mono/tabular figures, formatted from `subtotal_amount` + `currency`.
- Order detail: line-item table (title · variation · qty · unit price snapshot), order total, status chip, "Visit the maker" link into B3.

**Edge Cases:**

- No orders → warm invitation + link to B1 (not a void).
- Order whose store was later unpublished → the order still renders (it's the buyer's record); the "Visit the maker" link degrades to disabled with a quiet note if the world is no longer live.
- Slow connection → skeletons matched to list layout; the total/status area is reserved so nothing shifts on resolve.

---

## Technical Requirements

> **Risk tier: Lite** (CTO-authoritative — read-own over already-locked RLS, no new DB object, <300 LOC; the read-own boundary is the trust surface but this feature adds no schema). Data-need table below = **Irreversible** if any RLS policy or column is added; here the tables and policies are **already locked** (B7/B0), so this feature adds none — database-engineer confirms the read-own policies exist before backend-engineer wires the reads.

### Backend Changes

- Read-only server fetch of `orders` (own rows) with joined `order_items` for the signed-in buyer. No new RPC; no mutation. Order creation stays in `create_order` (B7); `'paid'` status is set only by the Stripe webhook via service role (B0) — this feature never writes.
- All access is via the buyer's JWT against RLS-protected `orders` / `order_items` (SELECT-only RLS per B7). No service-role read here — a buyer reads only their own rows.

### Frontend Changes

- New account page: Orders list (Server Component read) + order detail route. Curated chrome only.
- All-4-states: empty (invitation), loading (row skeletons), error (cached/retry), success (list + detail).

### Database Changes

**Data need (Irreversible tier — DB before backend; NO new objects in this feature):**

| Object | Use | Status |
|---|---|---|
| `orders(subtotal_amount, currency, status order_status, store_id, buyer_id, commission_id, stripe_payment_intent_id)` | list + detail source | Locked (B7) — read-own RLS |
| `order_items(quantity, unit_price_amount snapshot, variation, product_id)` | detail line items | Locked (B7) — read via order |

- Bind strictly to the above rows (B2 §B9 / §B7). Do **not** invent an order-history table, view, or column.

### External Services

- None. (Stripe is B7's concern; this feature only reads the resulting rows.)

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Orders list P95 < 300ms for a buyer with ≤100 orders. | Seeded read benchmark. |
| **Security** | RLS read-own enforced at the DB; no cross-buyer read path; no PII in logs. | Cross-buyer JWT test (buyer A cannot read buyer B); RLS policy review. |
| **Scalability** | Correct + paginated for a buyer with 1,000 orders. | Seed 1,000 orders; verify pagination + no full-table scan. |
| **Accessibility** | List + detail keyboard-navigable; status chips have text labels (not color-only); totals have currency in accessible text. | axe-core + screen-reader walkthrough. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth (session + RLS anchor) | Feature | Not Started (W1 spec) | H — no read-own boundary without it |
| B7 Checkout (`orders`/`order_items` creation) | Feature | Not Started (W2 spec) | H — nothing to list |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| Seller dashboard order view (S7) | W4 | No | Seller sees orders *received*; distinct surface, same tables |

---

## Out of Scope

- Order mutation (cancel/refund/re-order) — `cancel_order`/`set_order_status` are seller/service flows (S7, B0), not this buyer surface.
- Inventory or fulfilment tracking / shipping status beyond the `orders.status` value — no logistics integration in MVP.
- Re-order-in-one-click — the "Visit the maker" link is the re-purchase path in v1.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RLS misconfiguration leaks cross-buyer orders | L | H | Cross-buyer JWT test in the required suite; DB before backend (Irreversible tier discipline). |
| Displaying current price instead of the paid snapshot | M | M | AC pins detail to `unit_price_amount` snapshot on `order_items`, never a live product read. |
| Buyer confused by an order to a now-unpublished store | L | L | Order still renders; "Visit the maker" degrades gracefully. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Buyers who open Orders at least once post-purchase | 0% | ≥ 50% of buyers with an order | 30 days post-launch |
| Cross-buyer read incidents | — | 0 | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed teammate accounts | All ACs pass; cross-buyer read test green | 1–2 days |
| Full Launch | All buyers | RLS verified; no P0 | — |

**Feature Flag** — Behind a flag? No (read-only surface, low blast radius). If gated, `order-history-enabled`.

**Rollback Plan** — Trigger: any cross-buyer read observed. Decision maker: CTO. Steps: disable the account route; RLS is unchanged (read-only feature, no data migration, no data loss on rollback).

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | The brief's "`list`" is **not** one of the 11 catalog blocks (those are maker-world primitives). Confirm order-history renders in KOL curated **platform chrome**, not a store block. | CPO + Design-Lead | pre-build |
| 2 | Pagination strategy + default page size for high-order buyers (cursor vs offset). | CTO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
