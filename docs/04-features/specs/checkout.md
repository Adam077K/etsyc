# Checkout (B7)

<!-- Buyer core state machine · state CHECKOUT · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Checkout |
| **Feature Slug** | checkout |
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
| **Reach** | 6 | Every buyer who purchases passes through checkout (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | The end-to-end proof that KOL is a real product — cart → pay → real order → thank-you → history (fact, concept-lock step 7, D6). |
| **Confidence** | 80% | `create_order` RPC contract + Stripe test-mode are locked in Part B (est.). |
| **Effort** | (ask CTO) person-weeks | Cart + review + Stripe test-mode payment + real order write via SECURITY DEFINER RPC (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | High — closes the buyer loop. |

**MoSCoW Classification:** Must Have

**Why this priority?** Checkout is the state that turns browsing into a real, account-tied order. It gates the thank-you moment (B8) and order history (B9), and is one of the two Full-minimum surfaces (with auth).

---

## Overview

Checkout is the `CHECKOUT` state: cart → review price/reviews → pay, writing a **real order row** to Supabase. It is KOL-owned and runs on **Stripe test-mode only** — real orders, no real money (D6). The video is minimized/paused; focus is on price + reviews + pay. The order is created via the `create_order` SECURITY DEFINER RPC, which binds `buyer_id` and reads prices server-side. Payment success advances to `THANK_YOU` (B8).

> ⚠️ **STRIPE TEST-MODE ONLY.** This flow creates real `orders` / `order_items` rows in Supabase but takes **NO real money** — Stripe runs in test mode (D6). This is stated loudly and is a hard constraint of the MVP. No production Stripe keys, no real charges.

---

## Problem

The concept-lock buyer journey step 7 is: "Checkout — price, reviews, pay (KOL-owned)." D6 locks the decision: "KOL-owned, Stripe test-mode, real orders in Supabase … Full end-to-end experience (cart→pay→thank-you→history); real product that works; no real money." The buyer needs a checkout that behaves like a real store — reviews the exact items and prices, pays, and gets a real, account-tied order — without any risk of a real charge during the seeded MVP. Trust and correctness are paramount: the price paid must be the maker's real price (bound server-side, never client-set), and a failed or declined payment must never double-charge or corrupt an order.

> "KOL-owned, Stripe test-mode." — feature-tree §4, CHECKOUT row

---

## Proposed Solution

A KOL-owned cart → review → pay flow. The buyer reviews cart items (mini `product-showcase`) with prices, then pays via Stripe test-mode. The order is created by calling `create_order(store_id, items jsonb)` — a SECURITY DEFINER RPC that FORCES status `'pending'`, binds `buyer_id` to the caller, and reads unit prices server-side from `products`. `orders.status = 'paid'` is set ONLY by the Stripe webhook via the service role. The video is minimized/paused. Payment success advances to `THANK_YOU` (B8).

**UX Flow:**

1. From add-to-cart (B6), the buyer opens the cart (curated KOL chrome; video minimized/paused).
2. The buyer reviews items and prices (mini `product-showcase`), tied to their account.
3. The buyer pays via Stripe **test-mode**.
4. On payment, `create_order` writes a real `orders` + `order_items` row (status forced `'pending'`, `buyer_id` bound server-side, prices read server-side); the Stripe webhook later flips `status` to `'paid'` via the service role.
5. Payment success → `THANK_YOU` (B8); the order is saved to the account (visible in B9 order history).

---

## User Stories

- As a buyer, I want to review my cart and prices and pay, so that I can actually buy the piece I chose.
- As a buyer, I want my order tied to my account, so that I can see it later in my order history.
- As a buyer, I want a failed or declined payment to fail cleanly with no double-charge, so that I can retry without fear.

---

## Acceptance Criteria

**Happy Path**
- Given items in the cart, when the buyer opens checkout, then the cart renders (mini `product-showcase`, curated chrome) with prices and the video minimized/paused.
- Given the buyer pays (Stripe test-mode), when payment is initiated, then `create_order(store_id, items jsonb)` creates a real `orders` row and `order_items` (each with a `unit_price_amount` snapshot read server-side from `products`), status FORCED `'pending'`, `buyer_id` bound to the caller.
- Given payment succeeds, when the Stripe webhook fires, then `orders.status` is set to `'paid'` ONLY by the webhook via the service role; the buyer advances to `THANK_YOU` (B8).

**Stripe test-mode (hard constraint)**
- Given any checkout, when payment runs, then Stripe is in **test-mode**: a real order row is written but NO real money is taken (D6). No production Stripe keys are used.

**Server-side binding (security — RLS is the only boundary)**
- Given the client submits an order, when `create_order` runs, then prices are READ SERVER-SIDE from `products` (never a client-passed price), status is FORCED `'pending'` (never client-set), and `buyer_id` is bound to the caller (never client-set). The RPC rejects an unpublished store, a cross-store item, or `quantity <= 0`. `orders` / `order_items` are SELECT-only under RLS (Part B §B0 / §B2 B7).

**Empty cart**
- Given an empty cart, when the buyer opens checkout, then a "nothing here yet" state renders with a path back to the world (never a broken empty checkout).

**Loading**
- Given payment is processing, when the buyer pays, then a processing state renders (no spinner-only screen; clear progress).

**Error (no double-charge)**
- Given a declined or failed payment, when it errors, then an inline, recoverable error renders with a retry — and NO double-charge / no duplicate paid order is created (the webhook is the only path to `'paid'`).

**Success**
- Given the order is created and paid, when payment completes, then the buyer advances to `THANK_YOU` (B8) and the order is saved to their account.

---

## UX / UI Notes

Surface touched: **KOL's own product UI** (checkout is KOL-owned) → FIXED curated system (`theme.kind:"curated"` chrome). The maker's world recedes; the video is minimized/paused so focus is on price + reviews + pay.

**Key Interactions:**

- Cart review with mini `product-showcase` and mono prices.
- Pay via Stripe test-mode.
- Video minimized/paused during checkout.
- Curated chrome, low-urgency (no deal-grid pressure; reject the TikTok/Complex urgency register per NARRATIVE).

**Edge Cases:**

- **empty** — empty cart → "nothing here yet" + back to world.
- **loading** — processing state during payment.
- **error** — declined/failed payment → inline + retry, no double-charge.
- **success** — order created + paid → THANK_YOU.
- Back-transition: CHECKOUT → PRODUCT_PAGE on cancel (feature-tree §4 back-transitions); the video re-expands.

---

## Technical Requirements

Risk tier: **Full / Irreversible** — this is a **billing flow** with a new SECURITY DEFINER RPC and Stripe integration (Part B §A2 conv 8: checkout = Full minimum; risk-tier legend: billing flow = Irreversible). Sequencing: `carts` / `orders` / `order_items` migrations (Irreversible, database-engineer) and the `create_order` RPC + trigger set land before this frontend.

### Backend Changes
- **RPC `create_order(store_id, items jsonb)`** — SECURITY DEFINER, `SET search_path=''`, schema-qualified; `REVOKE EXECUTE FROM public` + `GRANT EXECUTE TO authenticated` (Part B §B0). Reads unit prices server-side from `products`; FORCES status `'pending'`; binds `buyer_id` to caller; rejects unpublished store / cross-store item / `quantity <= 0`.
- `orders.status = 'paid'` set ONLY by the Stripe webhook via the **service role** (service-role check tests `auth.role() = 'service_role'`, never `auth.uid() IS NULL` — Part B §B0, N1). `orders` / `order_items` are SELECT-only under RLS for buyers.
- Money is integer minor units + `char(3) currency` (default GBP) — no floats (Part B §B0).

### Frontend Changes
- Cart → review → pay flow in KOL curated chrome; video minimized/paused.
- Stripe test-mode payment integration (client + webhook handler).
- 4 states: empty cart, processing (loading), declined/failed (error, no double-charge), success → THANK_YOU.

### Database Changes
- Uses `carts(status cart_status)`, `orders(subtotal_amount, currency, status order_status, stripe_payment_intent_id, commission_id)`, `order_items(quantity, unit_price_amount snapshot, variation)`, `products`. Bound strictly to Part B §B2 B7 — no invented tables/columns. Migrations are database-engineer's; this spec cites them.

### External Services
- **Stripe (test-mode only)** — payment intent + webhook. No production keys. The webhook is the only writer of `orders.status = 'paid'` (service role).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Order creation + payment confirmation complete within a reasonable interactive budget; processing state is clear. | Integration test with Stripe test-mode. |
| **Security** | Prices, status, and `buyer_id` are ALL DB-enforced server-side; no client-set price/status/buyer_id; `'paid'` only via webhook service role; RLS is the only boundary. | Security review + RPC/trigger tests (attempt client-set price/status → reject). |
| **Scalability** | `create_order` handles multi-item carts atomically; webhook idempotent (no double-`paid`). | Concurrent/duplicate webhook test. |
| **Accessibility** | Payment form keyboard-navigable, labeled; errors announced inline; no time-pressure UI. | axe-core + screen-reader walkthrough. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth (order tied to account, RLS) | Feature | Spec (Batch 1, W1) | H |
| `carts` / `orders` / `order_items` migrations + `create_order` RPC | Data / RPC | Not Started (Irreversible) | H |
| B6 Product page (add-to-cart populates cart) | Feature | Spec (this batch) | H |
| Stripe test-mode account + webhook | External | Not Started | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B8 Thank-you moment | frontend-engineer | Yes | Payment success advances to THANK_YOU |
| B9 Order history | frontend-engineer (W3) | Yes | Orders written here appear in history |
| B14 Guided co-creation (commission → order) | frontend-engineer (W3) | Yes | Approval creates an order via `orders.commission_id` |

---

## Out of Scope

- Real-money payment (Stripe production) — MVP is test-mode only (D6).
- **Inventory check at order time** — `create_order` has **NO inventory check yet (known-deferred N3, ADR-0001)**; do NOT build it in this phase (adding it = new migration = Irreversible tier). Cited, not implemented.
- Order status transition matrix — `set_order_status` whitelists target states but has **no from-state matrix yet (known-deferred N2 / NEW-4)**; owned by S7. Cited, not implemented.
- The thank-you moment content (B8) and order history list (B9).
- Refunds / cancellations beyond `cancel_order` existence (not specced here).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Client-set price / status / buyer_id | L | H | `create_order` SECURITY DEFINER binds all three server-side; `'paid'` only via webhook; RLS SELECT-only (Part B §B0). |
| Double-charge / duplicate paid order | L | H | Webhook is the single `'paid'` writer + idempotent on `stripe_payment_intent_id`; declined payment writes nothing paid. |
| Accidental real charge | L | H | Stripe test-mode only; no production keys; environment guard + review gate. |
| Oversell (no inventory check) | M | M | Known-deferred N3 — accepted for MVP; documented, not silently ignored. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Checkout completion (cart → paid order) | N/A | ≥ 60% of checkouts complete (assumed target — low confidence) | 30 days |
| Double-charge / duplicate-paid incidents | N/A | 0 | ongoing |
| Real-money charges | N/A | 0 (test-mode only) | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; RPC/trigger security tests green; test-mode confirmed | 2–3 days |
| **Private Beta** | First cohort | No P0; no double-charge; orders tie to accounts | 1 week |
| **Full Launch** | All buyers (test-mode) | Passed; QA-Lead Full/Irreversible gate PASS | — |

**Feature Flag**
- Behind a feature flag? Yes
- Flag name: `checkout-enabled`
- Flag owner: CTO

**Rollback Plan**
- Rollback trigger: any double-charge, an order-integrity defect, or a payment-state inconsistency.
- Rollback decision maker: CTO + Founder (Irreversible tier).
- Rollback steps: disable flag → cart preserved, payment blocked → fix → re-enable.
- Data impact: migrations are additive; no destructive rollback of order rows. Rollback is forward-compatible (leave written orders intact).

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Webhook idempotency key strategy on `stripe_payment_intent_id` (confirm with CTO). | CTO | pre-build |
| 2 | Multi-store cart handling — `create_order` is per-`store_id`; confirm whether a single cart may span stores or is store-scoped. | CPO + CTO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker W2)_
