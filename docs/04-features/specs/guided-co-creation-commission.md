# Guided Co-Creation / Commission (B14)

<!-- Phase-5 spec worker (W3). FULL commissioning flow. Built on the P15 messaging + draft-versioning subsystem (W4, buyer-maker-messaging-drafts.md) — reference heavily, do NOT re-spec messaging/drafts. Commission relationship signal weight 5.0 (deepest). Known-deferred NEW-3: commission_drafts.status is NOT role-guarded yet. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Guided Buyer–Maker Co-Creation (Commission) |
| **Feature Slug** | guided-co-creation-commission |
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
| **Reach** | 4 | A minority of buyers commission bespoke work, but it's the deepest relationship + highest-value order (assumed — low confidence; basis "4 seed worlds + first cohort"). |
| **Impact** | 3 | Massive — the fullest expression of "shopping as a relationship": a buyer and maker create something together (`est.`). |
| **Confidence** | 65% | Data model locked, but sits on P15 (must land first) and carries a known-deferred guard gap (NEW-3) (`est.`). |
| **Effort** | 4 person-weeks | Guided brief + commission lifecycle + draft review, reusing P15 primitives (`est.`; `(ask CTO)` on P15 coupling + status-guard). |
| **RICE Score** | (4 × 3 × 0.65) ÷ 4 = **1.95** | |

**MoSCoW Classification:** Should Have — D16-6 folds **full** co-creation into MVP (brief → messaging → drafts → revisions → approve → make); it is the flagship relationship feature but the heaviest and P15-gated.

**Why this priority?** D16-6 is the decision that *"brings a messaging + draft-versioning system into MVP."* Commission is the deepest relationship signal (5.0, engine §5.2) and the strongest proof of KOL's thesis — but it is expensive and depends on P15.

---

## Overview

A **full** commissioning flow: a buyer starts a guided brief (recipient, occasion, meaning, preferences), then buyer and maker message back and forth, share versioned drafts with revisions, and on approval the commission becomes a real custom order. It is **built on the P15 messaging + draft-versioning subsystem** (reused, not re-specified) and writes `commissions` / `commission_drafts`, linking the approved result to `orders.commission_id`. Commission emits the strongest relationship signal (weight 5.0) to P6+.

---

## Problem

D16-6 folds in *"Guided Buyer–Maker Co-Creation — FULL commissioning: brief → buyer↔maker messaging → shared drafts → revisions → approve → make."* KOL's premise is turning shopping *"from a transaction back into a relationship"* and letting the buyer *"meet the human"* (concept-lock). Commissioning is where that relationship is deepest — but a buyer today has no guided, trustworthy way to co-create a bespoke piece with a maker (no structured brief, no shared drafts, no path from "let's make this" to a real order). The pain, in the buyer's terms: *"I want her to make me something specific and meaningful — and I want to work it out with her, see drafts, and know it'll become a real order"* (grounded in concept-lock relationship framing + D16-6; USER-INSIGHTS.md empty).

---

## Proposed Solution

A guided brief that seeds a commission, a buyer↔maker conversation (P15 messaging), shared versioned drafts with revisions (P15 draft-versioning), and an approve→order step. The commission lifecycle is DB-guarded (buyer-initiated, buyer≠maker, maker must be a seller).

**UX Flow:**

1. Buyer opens **Start a commission** on a maker/product and fills a **guided brief** (recipient, occasion, meaning, preferences) → a `commissions` row (buyer-initiated) with a linked `thread` is created.
2. Buyer and maker message back and forth (**reuse P15** `threads`/`messages`, text/audio/video).
3. Maker shares **versioned drafts** (`commission_drafts`: version, content, media, note); buyer requests revisions; new draft versions accrue (**reuse P15 draft-versioning**).
4. Buyer **approves** a draft → a custom `orders` row is created with `orders.commission_id` set (nullable FK); a `commission` relationship signal (weight 5.0) is recorded.
5. Result: a bespoke piece co-created with the maker, turned into a real order, and the deepest relationship signal in the system.

---

## User Stories

- As a buyer, I want a guided brief so that I can express what I want made and why it matters without knowing craft jargon.
- As a buyer, I want to message the maker and see draft revisions so that we shape the piece together.
- As a buyer, I want to approve a final draft and have it become a real order so that co-creation ends in a purchase, not a dead thread.
- As a maker, I want to share versioned drafts and respond to revisions so that I stay the author while collaborating.

---

## Acceptance Criteria

**Happy Path**
- Given a signed-in buyer on a maker surface, when they submit a guided brief, then a `commissions(brief, status, thread_id, store_id)` row is created **buyer-initiated** with a linked P15 `thread`.
- Given an open commission, when buyer and maker message, then the exchange uses the **P15** `threads`/`messages` (text/audio/video) — not a re-implemented messaging path.
- Given a maker, when they share a draft, then a `commission_drafts(version, content, media_ids, note, status)` row is written with an incremented `version`; revisions add new versions (P15 draft-versioning).
- Given a buyer, when they approve a draft, then a custom `orders` row is created with `orders.commission_id` set (nullable FK), and a `commission` signal (weight 5.0) is recorded to `buyer_signals` (service role) → P6+.

**Empty State**
- Given a maker surface with no commission started, when the buyer views it, then a "Start a commission" prompt invites the guided brief — **empty ≠ blank**.

**Loading State**
- Given drafts/messages syncing, when the commission view renders, then thread + draft skeletons matched to the real layout appear (not a spinner).

**Error State**
- Given a message or draft write fails, when attempted, then a quiet inline error + retry appears and **no message/draft is lost** (P15 guarantee); the commission stays intact.

**Edge Case (lifecycle guards)**
- Given a commission INSERT, when `buyer_id == maker_id`, or the maker is **not a seller** (or not the store owner when `store_id` is set), then `commissions_guard`→`guard_commission` **rejects** it (DB-enforced, not app-side only — B0).
- Given a status transition, when attempted, then it is role-scoped per `guard_commission` (buyer-initiated lifecycle).
- Given `commission_drafts.status` writes, then note the **known-deferred NEW-3** gap: `commission_drafts.status` is **not role-guarded yet** (B5 known-deferred) — cite as known-deferred, do NOT add a guard migration in this phase (that would be a new Irreversible migration).
- Given approval, when the order is created, then price/`status` follow the checkout server-side rules (B7 patterns) — no client-set price or status on the resulting order.

---

## UX / UI Notes

Surface touched: **both** — the commission conversation + guided-brief UI live in a mix of the **maker's world** (entry point on a product/maker surface) and **KOL curated chrome** (the brief form, the commission workspace). Reuses P15's message + draft composers.

**Key Interactions:**

- Guided brief form: recipient · occasion · meaning · preferences (structured fields feeding `commissions.brief`).
- Commission workspace: P15 thread (text/audio/video) + versioned draft cards (content, media, note, version) with a revision request + an approve action.
- Approve → creates the custom order (checkout-adjacent, B7 order rules).

**Edge Cases:**

- Signed-out start → routed to sign-in (P1).
- Buyer tries to commission their own store → rejected by `guard_commission` (buyer≠maker).
- Maker isn't a seller / not the store owner → rejected by `guard_commission`.
- Draft media fails → text/note renders; media retryable (P15 no-lost-message rule).

---

## Technical Requirements

> **Risk tier: Full** (auth, DB-guarded lifecycle, order creation, service-role signal, P15 reuse). Data-need = **Irreversible tier** (tables + `guard_commission` trigger locked; DB before backend). **P15 must land before B14** (build-order OQ). **Known-deferred NEW-3** cited below.

### Backend Changes

- Commission lifecycle over `commissions` + `commission_drafts`, **reusing P15** `threads`/`messages` + draft-versioning primitives — do **not** re-implement messaging or draft versioning.
- `commissions` INSERT is buyer-initiated; `commissions_guard`→`guard_commission` enforces `buyer_id <> maker_id`, maker must be a seller (+ store owner when `store_id` set), and role-scoped status transitions.
- Approval creates a custom `orders` row with `orders.commission_id` (nullable FK, ALTER group 10) — order price/`status` set server-side per B7 (`create_order` rules; `'paid'` only via Stripe webhook, service role).
- Commission action emits a `commission` signal (weight 5.0) to `buyer_signals` via **service role** (B0) → P6+.
- **Known-deferred (do NOT build):** `commission_drafts.status` is **not role-guarded** (NEW-3, B5) — adding the guard is a new migration = Irreversible tier, out of this phase.

### Frontend Changes

- Guided brief form (curated chrome); commission workspace (P15 thread + versioned draft cards + revision/approve).
- All-4-states: empty (start-a-commission prompt), loading (draft/thread skeletons), error (retry, no lost message/draft), success (approved custom order).

### Database Changes

**Data need (Irreversible tier — DB before backend; tables + trigger locked, NO new objects):**

| Object | Use | Status |
|---|---|---|
| `commissions(brief, status commission_status, thread_id, store_id)` + `commissions_guard`→`guard_commission` | commission lifecycle | Locked (B2 §B14) |
| `commission_drafts(version, content, media_ids, note, status commission_draft_status)` | versioned drafts | Locked; **`status` NOT role-guarded — NEW-3 known-deferred** |
| `threads` / `messages` (P15) | buyer↔maker conversation | Locked (reuse P15) |
| `orders(commission_id)` — nullable FK | approved custom order | Locked (B2 §B14 / §B7) |
| `buyer_signals` — `commission`=5.0, service-role insert | deepest relationship signal → P6+ | Locked (engine §5.2) |

- Reuse P15 *tables* for the conversation + drafts; add **no** new messaging tables.

### External Services

- Stripe (test-mode) for the resulting custom order — reuses B7's flow; no new integration here.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Commission workspace loads P95 < 400ms; draft version writes feel immediate. | Read/write benchmark. |
| **Security** | `guard_commission` enforces buyer≠maker + seller/owner + role-scoped transitions; order price/status server-side; signal service-role. | `guard_commission` rejection tests; order-price-binding test. |
| **Scalability** | Correct for a commission with many draft versions + a long thread. | Seed long thread + N drafts. |
| **Accessibility** | Brief form + workspace keyboard-navigable; draft version history is screen-reader legible; media has controls/captions. | axe-core + screen-reader. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P15 Messaging + draft-versioning | Subsystem (W4) | Not Started | H — B14 is built on it; must land first |
| B7 Checkout (`orders`, price/status server-side) | Feature (W2) | Not Started | H — approval creates a custom order |
| P1 Auth + role (seller check) | Feature (W1 spine) | Not Started | H — `guard_commission` needs roles |
| P2 `buyer_signals` write path | Feature (W1 spine) | Not Started | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| P6+ Relationship ranking | W1 / W3 | Yes | consumes the `commission` signal (5.0) |
| S7 Seller dashboard | W4 | No | maker manages commissions received |

---

## Out of Scope

- The messaging + draft-versioning subsystem itself — owned by P15 (W4); B14 reuses it.
- A `commission_drafts.status` role-guard — **known-deferred (NEW-3)**; not built this phase.
- Inventory reservation for commissioned pieces — `create_order` has no inventory check yet (N3, known-deferred).
- Automated pricing/quoting of bespoke work — the maker sets the price in the resulting order (B7/S8 rules).
- Milestone/escrow payments — single custom order in MVP.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| P15 not ready → B14 blocked | M | H | Build-order OQ to CTO; P15 sequenced first. |
| `commission_drafts.status` not role-guarded abused | M | M | Cited as known-deferred (NEW-3); app-layer soft-check + flag; DB guard is a later Irreversible migration. |
| Client-set order price/status on approval | L | H | Order created via B7 server-side rules (`create_order`); no client price/status. |
| Buyer commissions own store / non-seller | L | M | `guard_commission` rejects (buyer≠maker, seller/owner). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Started commissions that reach an approved order | 0% | ≥ 25% | 90 days post-launch |
| `commission` signals feeding P6+ | 0 | tracked (non-zero) | ongoing |
| Lost-message/draft incidents | — | 0 (P15 guarantee) | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (buyer+maker pairs) | All 4 states + `guard_commission` tests + approve→order test pass | 3–4 days |
| Private Beta | Hand-picked buyer/maker pairs | No P0; approve→order works end-to-end | 1–2 weeks |
| Full Launch | All | P15 live; no P0 | — |

**Feature Flag** — Behind a flag? **Yes** — `commission-enabled` (coupled to P15). Flag owner: CTO.

**Rollback Plan** — Trigger: `guard_commission` bypass or order-creation error. Decision maker: CTO. Steps: disable `commission-enabled` (maker surfaces render without the commission entry); tables are additive, no data loss; approved orders already created remain valid.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Build-order (flagged to CTO):** P15 must land before B14 — confirm which P15 draft-versioning primitives B14 reuses vs extends. | CTO | pre-build |
| 2 | Whether `commission_drafts.status` gets an app-layer soft-guard in MVP given NEW-3 is DB-deferred. | CTO + CPO | pre-build |
| 3 | How the approved-commission order price is set (maker-quoted in-thread → order) and where it's validated server-side. | CTO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
