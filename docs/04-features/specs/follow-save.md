# Follow & Save (B13)

<!-- Phase-5 spec worker (W3). Buyer follow/save. Writes follows/saves AND a buyer_signals row (follow=3.0, save=1.5) that feeds P6+ RELATIONSHIP ranking — per-buyer affinity, NOT global popularity. saves.subject_id is polymorphic with NO FK — app/Zod validates. buyer_signals inserts are service-role. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Follow & Save |
| **Feature Slug** | follow-save |
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
| **Reach** | 7 | Every signed-in buyer can follow makers / save products across every world (assumed — low confidence; basis "4 seed worlds + first cohort"). |
| **Impact** | 2 | Medium — low-friction relationship declaration that directly powers personalized ranking (P6+) (`est.`). |
| **Confidence** | 80% | `follows`/`saves` + `buyer_signals` fully locked; signal→weight map fixed in the engine spec (`fact`). |
| **Effort** | 1.5 person-weeks | Toggle UI (optimistic) + two write paths (`follows`/`saves` via RLS + service-role signal) (`est.`). |
| **RICE Score** | (7 × 2 × 0.8) ÷ 1.5 = **7.5** | |

**MoSCoW Classification:** Must Have — D16-7 folds relationship-based ranking into MVP and this is the *input*: follow/save are the explicit affinity signals P6+ ranks on. Without them the relationship term is near-empty.

**Why this priority?** D16-7 requires *"follow/save + purchase/question/project signals feed ranking."* Follow and save are the cheapest, most explicit signals; they feed P6+ so the feed becomes *yours*, not the crowd's.

---

## Overview

Signed-in buyers follow a maker and save a product or a whole world. Each action writes a durable `follows` / `saves` row **and** emits a weighted `buyer_signals` event (`follow` = 3.0, `save` = 1.5) that feeds the P6+ relationship term — **per-buyer affinity, never global popularity** (D16-7). `saves` is polymorphic over product|store with no element FK (app/Zod-validated). It enables a buyer to build an ongoing relationship with makers they care about, which the video engine then reflects in *their* feed.

---

## Problem

D16-7 folds in *"Relationship-Based Ranking — follow/save + purchase/question/project signals feed ranking."* KOL's whole thesis is shopping *"back into a relationship"* (concept-lock). But a relationship needs a way to *declare* it: today a buyer who loves a maker's world has no way to keep it, come back to it, or tell the system "more of her". The pain, in the buyer's terms: *"I found a maker I love — let me follow her and save this piece, and see more of her, not whatever's globally popular"* (grounded in concept-lock relationship framing + D16-7; USER-INSIGHTS.md empty). The load-bearing rail: these signals must drive **relationship**, not popularity — the engine spec §5.1 rejects global counts as *"the flattening the product exists to fight."*

---

## Proposed Solution

Follow affordances on maker surfaces and save affordances on products/worlds. Each toggles a `follows`/`saves` row (optimistically) and records a weighted relationship signal. A "saved" area lets buyers revisit.

**UX Flow:**

1. Buyer (signed in) taps **Follow** on a maker (in a world, on a card, or via `contact-cta`) → a `follows` row (unique buyer→maker) is written and a `follow` signal (weight 3.0) recorded.
2. Buyer taps **Save** on a product or a world → a `saves` row (polymorphic product|store, unique) is written and a `save` signal (weight 1.5) recorded.
3. The affordance reflects state optimistically; the buyer can revisit follows/saves from their account.
4. Result: the buyer's explicit affinities are captured and fed to P6+ so **their** feed leans toward makers **they** care about (relationship, not popularity).

---

## User Stories

- As a buyer, I want to follow a maker so that I keep a relationship with her and see more of her work.
- As a buyer, I want to save a product or a world so that I can come back to it later.
- As a buyer, I want my follows/saves to shape my feed toward makers I care about, not toward whatever is globally popular.

---

## Acceptance Criteria

**Happy Path**
- Given a signed-in buyer, when they follow a maker, then a `follows(buyer_id, maker_id)` row is written (unique buyer→maker) and a `buyer_signals` row `signal_type='follow'`, weight 3.0, is recorded via service role.
- Given a signed-in buyer, when they save a product or world, then a `saves(buyer_id, subject_type, subject_id)` row is written (unique, polymorphic product|store) and a `save` signal (weight 1.5) is recorded via service role.
- Given a following/saving buyer, when they open their account's saved area, then their follows and saves are listed.
- Given a followed maker, when P6+ scores that buyer's feed, then the follow contributes to the **per-buyer** `Relationship` term (not a global count) (feeds P6+ §5).

**Empty State**
- Given a buyer with no follows/saves, when they open the saved area, then a warm "Nothing saved yet — follow a maker or save a piece you love" invitation with a route to the feed — **empty ≠ blank**.

**Loading State**
- Given a follow/save tap, when it is in flight, then the toggle updates **optimistically** (immediate visual state) while the write completes.

**Error State**
- Given the follow/save write fails, when the optimistic toggle was applied, then it **reverts** to the prior state with a quiet inline retry — no phantom follow/save.

**Edge Case (integrity + trust boundary)**
- Given a duplicate follow (same buyer→maker) or duplicate save (same buyer+subject), when written, then the unique constraint makes it idempotent (no duplicate rows).
- Given a `saves` write, when `subject_type='product'`/`'store'`, then the app/Zod validates `subject_id` resolves to a real product/store — there is **no DB FK** on the polymorphic `subject_id` (B2 §B13), so validation is the app's job.
- Given any client, when it attempts to write `buyer_signals` directly, then it is rejected — `buyer_signals` inserts are **service-role only** (B0); the signal is mirrored server-side from the follow/save action, never client-set.
- Given a buyer un-follows/un-saves, when they toggle off, then the `follows`/`saves` row is removed; **the historical `buyer_signals` event is not retro-deleted** (signals are an event log the engine decays by recency — see Open Questions #1).

---

## UX / UI Notes

Surface touched: **both** — follow/save affordances render **inside maker worlds** (world-styled, e.g. on `contact-cta`) and the **saved area** is **KOL curated account chrome**. The affordance never competes with the film (the film always wins).

**Key Interactions:**

- Follow toggle on maker surfaces (world header, feed card, `contact-cta` block).
- Save toggle on products (`product-detail`/`product-showcase`) and on a world.
- Saved area (account chrome): lists follows + saves, each linking back into the world (B3).

**Edge Cases:**

- Signed-out tap → routed to sign-in (P1); no follow/save without a session.
- Rapid double-tap → idempotent via unique constraint; UI debounces.
- Saved world later unpublished → the save persists (buyer's record); the link degrades gracefully.

---

## Technical Requirements

> **Risk tier: Full** (auth-gated writes across two tables + a service-role `buyer_signals` mirror = the relationship-ranking trust boundary). Data-need = **Irreversible tier** (tables locked; DB before backend).

### Backend Changes

- Follow/unfollow: write/delete `follows(buyer_id, maker_id)` via the buyer's JWT (RLS own-rows); unique buyer→maker.
- Save/unsave: write/delete `saves(buyer_id, subject_type save_subject, subject_id)`; unique; polymorphic (product|store) — **app/Zod validates `subject_id`** (no DB FK, B2 §B13).
- On each follow/save, a **service-role** server action inserts the mirrored `buyer_signals` row (`follow` 3.0 / `save` 1.5) — client never writes `buyer_signals` (B0). These are **relationship** signals consumed per-buyer by P6+; **never** aggregated into a global count.

### Frontend Changes

- Optimistic follow/save toggles on world + card + `contact-cta` surfaces; revert-on-error.
- Saved account area (curated chrome) listing follows/saves with back-links to worlds.
- All-4-states: empty (invitation), loading (optimistic toggle), error (revert+retry), success (reflected state).

### Database Changes

**Data need (Irreversible tier — DB before backend; tables locked, NO new objects):**

| Object | Use | Status |
|---|---|---|
| `follows(buyer_id, maker_id)` — unique buyer→maker | follow relation | Locked (B2 §B13) |
| `saves(buyer_id, subject_type save_subject, subject_id)` — unique, polymorphic (product\|store), **no FK on subject_id** | saved products/worlds | Locked (B2 §B13) |
| `buyer_signals(subject_type, signal_type, weight)` — `follow`=3.0, `save`=1.5, **service-role insert** | P6+ relationship signal | Locked (B2 §P6+; weights per engine §5.2) |

- Do **not** invent a "popularity" or "follower count" surface — relationship ranking is per-buyer (P6+), and this feature does not expose global counts.

### External Services

- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Follow/save toggle feels instant (optimistic); write confirms P95 < 250ms. | Toggle benchmark. |
| **Security** | `follows`/`saves` RLS own-rows; `buyer_signals` insert service-role only; polymorphic `subject_id` app-validated. | RLS + service-role tests; invalid-`subject_id` rejection test. |
| **Scalability** | Correct for a buyer with 1,000 saves; the P6+ read stays per-buyer indexed. | Seed 1,000 saves; verify indexed read. |
| **Accessibility** | Toggles are labelled buttons with pressed-state ARIA; saved area keyboard-navigable. | axe-core + keyboard walkthrough. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth (buyer identity) | Feature (W1 spine) | Not Started | H |
| P2 `buyer_signals` write path (service role) | Feature (W1 spine) | Not Started | H — no signal mirror without it |
| P6+ Relationship ranking (consumer) | Feature (this batch) | Not Started | M — signals accrue even if ranking lags |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| P6+ Relationship term | W1 (engine) / W3 | Yes | consumes `follow`/`save` signals |
| B14 Commission (relationship deepening) | W3 | No | shares the `buyer_signals` write contract |

---

## Out of Scope

- Global follower counts / "trending makers" / any popularity surface — explicitly rejected (D16-7 relationship-not-popularity).
- The relationship scoring math itself — owned by P6+ (this feature only writes the signals).
- Notifications on new maker content to followers — post-MVP.
- Retro-deleting `buyer_signals` on unfollow/unsave — signals are an event log decayed by recency (P6+ §5.3), not deleted here (see OQ #1).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Signal used as global popularity (flattening) | L | H | AC + Out-of-Scope forbid global counts; P6+ enforces per-buyer. |
| Client writes `buyer_signals` directly (trust breach) | L | H | Service-role-only insert (B0); mirrored server-side from the action. |
| Polymorphic `subject_id` points at a non-existent row | M | M | App/Zod validation (no DB FK, B2 §B13). |
| Optimistic toggle leaves phantom state on failure | M | M | Revert-on-error AC. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Signed-in buyers who follow ≥1 maker | 0% | ≥ 35% | 30 days post-launch |
| Follow/save signals feeding P6+ | 0 | tracked (non-zero) | ongoing |
| Optimistic-toggle error-revert rate | — | < 1% | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed accounts | All 4 states + service-role signal test + idempotency test pass | 1–2 days |
| Gradual Rollout | 10% → 100% | No P0; signal write healthy | 1 week |
| Full Launch | All buyers | No P0 | — |

**Feature Flag** — Behind a flag? **Yes** — `follow-save-enabled` (so the `buyer_signals` write path can be validated before GA). Flag owner: CTO.

**Rollback Plan** — Trigger: signal-write trust-boundary issue. Decision maker: CTO. Steps: disable `follow-save-enabled` (worlds render without toggles); `follows`/`saves`/`buyer_signals` are additive tables, no data loss; P6+ simply sees fewer signals.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | On unfollow/unsave, is the historical `buyer_signals` event left to decay (recommended, per engine §5.3) or is a counter-signal written? Confirm. | CTO + ai-engineer | pre-build |
| 2 | Does a save target `subject_type='product'` also emit a product-scoped signal, or only store/maker-scoped? (Affects P6+ product affinity.) | CTO + CPO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
