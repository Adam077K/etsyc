# Feature Spec — Seller Dashboard (S7)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Seller Dashboard |
| **Feature Slug** | seller-dashboard |
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
| **Reach** | 6 | 4 seed worlds + first cohort *(assumed, D12)*. Every seller uses the dashboard to run their shop. |
| **Impact** | 2 | Medium. Operational hub — makes the shop manageable but is not itself the differentiating magic. |
| **Confidence** | 75% | *(est.)* Standard CRUD/read surface over locked tables. |
| **Effort** | 2 person-weeks | *(est., ask CTO)* Own-store reads (store/products/orders/verification) + navigation into S8/S6/S9. |
| **RICE Score** | (6 × 2 × 0.75) ÷ 2 = **4.5** | |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** Once a store publishes and takes orders, the seller needs a home to manage it (D2/D6/D7). Without it, sellers can't see orders or verification status.

---

## Overview

The seller's operational hub (D2/D6/D7): manage the store, products, orders received, and verification status, all scoped to the seller's own shop by RLS. It is the navigation spine into product management (S8), the co-edit/approve flow (S4/S6), and verification (S9).

---

## Problem

Once a maker's world is live and taking real orders (D6 Stripe test-mode), they need a single place to see what's happening and act on it — orders to fulfil, products to edit, verification to complete. The feature-tree locks the seller dashboard as **"manage store, products, orders received, verification status"** (S7, D2/D6/D7). Without it, the seller pipeline ends at publish with no way to operate the shop, and orders have no home.

*(No user quotes — grounded in feature-tree S7 + D2/D6/D7.)*

---

## Proposed Solution

An own-store dashboard with widgets for store status, products, orders, and verification, each linking into its management surface.

**UX Flow:**

1. Seller opens the dashboard (role-gated `seller`, own-store via RLS).
2. Widgets render: store status (draft/in_review/published, links to S4/S6), products (count + quick-add into S8), orders received (`orders`, links to detail + status actions), verification status (`verifications`, links to S9).
3. Seller acts: edit the store (S4), manage products (S8), advance an order's status (via `set_order_status`), or start/check verification (S9).
4. Result: the seller runs their whole shop from one place.

---

## User Stories

- As a **seller**, I want one dashboard showing my store status, products, orders, and verification so that I can run my shop without hunting across screens.
- As a **seller**, I want to see and act on orders received so that I can fulfil them.
- As a **seller**, I want to see my verification status so that I know whether my Real-Maker badge is live.

---

## Acceptance Criteria

**Happy Path**
- Given an authenticated seller, when they open the dashboard, then they see their own store status, product summary, orders received, and verification status — scoped to their shop only (RLS own-store).
- Given an order received, when the seller opens it, then they can view detail and advance status via `set_order_status` (seller → whitelisted target states on own store; Part B S7).

**Isolation / RLS**
- Given a seller, when the dashboard loads, then no other seller's store, products, orders, or verification data is visible (own-store RLS is the only boundary; Part B B0).

**Empty State**
- Given a seller with no products or orders yet, when the dashboard loads, then each widget shows a guiding prompt ("add your first piece" → S8; "no orders yet") rather than a blank panel (empty ≠ blank).

**Loading State**
- Given widgets are fetching, when the dashboard renders, then each shows a skeleton matched to its layout (never a page-level spinner); widgets resolve independently.

**Error State**
- Given a widget's data fails to load, when it occurs, then that widget shows cached data or a quiet inline retry, and the rest of the dashboard stays usable (one failing widget never blanks the page).

**Edge Case**
- Given a store still in `draft`/`in_review`, when the dashboard loads, then the store widget links back into co-edit/approve (S4/S6) rather than implying it is live.

---

## UX / UI Notes

Surface: **KOL's own product UI** (seller-tool chrome) → FIXED curated system (`theme.kind:"curated"`). Not the seller's custom shop theme — the dashboard is KOL tool chrome.

**Key Interactions:**
- Widget grid: store status, products, orders, verification — each a link into its surface.
- Order rows link to detail + status action.

**Four states (also in ACs):**
- **Empty** — per-widget guiding prompts (no products / no orders / not verified) with CTAs (empty ≠ blank).
- **Loading** — per-widget skeletons; widgets resolve independently.
- **Error** — per-widget cached/retry; page stays usable.
- **Success** — live dashboard with current store/products/orders/verification.

**Edge Cases:**
- A store in draft → widgets steer toward completing publish (S6), not operating a live shop.
- Mobile web → widgets stack single-column.

---

## Technical Requirements

### Backend Changes
- Own-store reads of `stores`, `products`, `orders`, `verifications` (Part B S7). Order status changes via the `set_order_status(id, status)` SECURITY DEFINER RPC (seller → whitelisted target states on own store).
- **Known-deferred:** `set_order_status` whitelists TARGET states but has **no from-state matrix yet** (N2/NEW-4). Do NOT build the from-state matrix in this phase; cite it as known-deferred (adding it = new migration = Irreversible).
- No LLM — no eval/cost-log obligation.

### Frontend Changes
- Dashboard route (role-gated `seller`): widget grid (store status, products, orders, verification), order detail + status action, links into S8/S4/S6/S9, the four states.

### Database Changes
- Reads **`stores`**, **`products`**, **`orders`**, **`verifications`** (Part B S7). Writes only via `set_order_status` RPC (no direct order-status write). Data-need tables = **Irreversible tier**. Do NOT add columns.

### External Services
- None directly (order/payment data originates from B7 checkout + the Stripe webhook, which sets `orders.status='paid'` via service role; the dashboard only reads it).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Dashboard interactive < 1.5s; widgets load independently and progressively. | Lighthouse + Playwright |
| **Security** | Own-store only via RLS (the only boundary); order status changes only via `set_order_status` (never a client-set status, Part B B0); no cross-seller leakage. | RLS test + review |
| **Scalability** | Order/product lists paginate and stay responsive with a realistic catalog + order history. | Seeded load test |
| **Accessibility** | Widgets and order actions keyboard-navigable; status changes announced. | axe-core + screen-reader |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth + role→seller | Feature/Data | Not Started | H |
| B7 checkout / `orders` (order data source) | Feature/Data | Not Started | H — no orders to show |
| S9 verification / `verifications` | Feature/Data | Not Started | M — verification widget |
| `set_order_status` RPC | Feature | Not Started | H — order actions |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| S8 product management | frontend | Yes | Entered from the dashboard |
| S9 verification | frontend | Yes | Status shown + entered here |

---

## Out of Scope

- Product CRUD internals (S8).
- The co-edit/approve/publish flow (S4/S6).
- The verification flow internals (S9).
- Analytics/reporting beyond basic order/product counts (roadmap).
- Building the `set_order_status` from-state matrix (known-deferred N2/NEW-4).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Cross-seller data leakage | L | H | RLS own-store as the only boundary; tested |
| Order status changed to an invalid target (no from-state matrix) | M | M | `set_order_status` whitelists targets; from-state matrix is known-deferred — document the gap, don't paper over it |
| One failing widget blanks the dashboard | M | M | Widgets load + fail independently |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Sellers who manage an order from the dashboard | N/A | > 90% of sellers with orders | 30 days |
| Cross-seller leakage incidents | N/A | 0 | Always |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | Own-store isolation verified; order status action works; 4 states pass | 2–3 days |
| Full Launch | All sellers | No leakage; metrics on target | — |

**Feature Flag** — `seller-dashboard-enabled`? Yes. Owner: CTO.

**Rollback Plan** — Trigger: leakage or order-status bug. Decision maker: CTO. Steps: disable flag → sellers lose the hub but published stores keep taking orders → no data loss. Data impact: read-only surface + guarded status RPC; no destructive migration.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Order-status from-state matrix is known-deferred (N2/NEW-4) — confirm the whitelisted target states are safe enough for MVP without a from-state guard. | CTO | Before build |
| 2 | What order/verification notifications (email via Resend?) does the seller need, or is the dashboard poll-only for MVP? | CPO + CTO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
