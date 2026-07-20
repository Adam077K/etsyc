# Thank-You Moment (B8)

<!-- Buyer core state machine · state THANK_YOU · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Thank-You Moment |
| **Feature Slug** | thank-you-moment |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 5 — buyer-core specs |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 6 | Every buyer who completes a purchase sees the thank-you moment (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | The relationship close — a personal thank-you video turns a receipt into a human moment; it is the emotional payoff of the whole journey (fact, concept-lock step 8). |
| **Confidence** | 85% | Engine THANK_YOU preset + `thank-you` block + `props.message` honesty rule are locked (est.). |
| **Effort** | (ask CTO) person-weeks | Thank-you screen + engine clip select + maker-authored/neutral fallback (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | High — the emotional close of the buyer loop. |

**MoSCoW Classification:** Must Have

**Why this priority?** The thank-you moment is the final state of the buyer state machine and the emotional payoff that makes shopping "a relationship, not a transaction." It also confirms the order and links to history.

---

## Overview

The Thank-You Moment is the `THANK_YOU` state: after a purchase, the maker's **personal thank-you video** plays — the only state where a `thankyou` clip is eligible (D5). The order is saved to the account; the order summary sits quietly below, secondary to the human moment. If there is no clip, the fallback is the maker's own written `thank-you` block `props.message` — maker-authored only, **never an AI-fabricated quote** (D6, D5, D10).

---

## Problem

The concept-lock buyer journey step 8 is: "Post-purchase — personal **thank-you video**; order saved to account." This is the relationship close: not a transactional "Order confirmed" receipt, but the maker looking the buyer in the eye and thanking them. The honesty guardrail is load-bearing here: "Voice is … the maker's own words" (D10), and "Trust must be honest — no claim we can't back" (concept-lock guardrails). So when a maker has no thank-you clip, the fallback message must be the maker's **own** written words or a neutral platform fallback — never a fabricated quote put in the maker's mouth. Buyers need a warm, human close that is always honest.

> "Only place a thank-you clip is eligible." — feature-tree §4, THANK_YOU row

---

## Proposed Solution

On payment success (from B7), the engine `THANK_YOU` preset selects the maker's `thankyou` clip (eligible only in this state) and the `thank-you` block plays it (`video-message` variant). The order summary renders quietly below, secondary to the human moment. If no clip exists, the block falls back to `text+media`: the maker's own `props.message` if authored, else neutral platform copy — never a fabricated maker quote. Sound is opt-in. A quiet "view order" link ties to order history (B9).

**UX Flow:**

1. From CHECKOUT (B7) payment success, the buyer lands on the thank-you moment.
2. The engine `THANK_YOU` preset selects the maker's `thankyou` clip; the `thank-you` block plays it (`video-message`), sound opt-in.
3. The order summary renders quietly below, secondary to the human moment; the order is saved to the account.
4. If no clip exists, the `text+media` fallback shows the maker's own `props.message` (or neutral platform copy) with a still — never a fabricated quote.
5. A quiet "view order" link leads to order history (B9).

---

## User Stories

- As a buyer, I want a personal thank-you video from the maker after I buy, so that the purchase feels like a relationship, not a transaction.
- As a buyer, I want my order confirmed and saved to my account, so that I can find it later.
- As a buyer, when a maker has no thank-you video, I want an honest warm message — the maker's own words or a neutral note — so that nothing feels fake or put-on.

---

## Acceptance Criteria

**Happy Path**
- Given a completed order, when the thank-you moment renders (THANK_YOU), then the engine selects the maker's `thankyou` clip (`page_eligibility @> {thankyou}` ∧ `purpose @> {thankyou}`, store scope = `storeScope`, limit 1) and the `thank-you` block plays it (`video-message` variant), sound opt-in.
- Given the thank-you moment, when it renders, then the order summary renders quietly below (secondary to the human moment) and the order is saved to the account.

**Thankyou-only eligibility (structural)**
- Given a `thankyou` clip, when any buyer state other than THANK_YOU runs, then the clip is NOT eligible — it is tagged `page_eligibility:['thankyou']` only, so THANK_YOU is the ONLY state where it surfaces (structural, video-engine-spec §2; the mirror invariant of B1's feed exclusion).

**Message honesty (load-bearing — D10)**
- Given the maker has no `thankyou` clip, when the block falls back to `text+media`, then it shows the maker's own `thank-you` block `props.message` if the maker authored one — and if the maker authored NONE, it shows **neutral platform fallback copy**. The `props.message` MUST be maker-authored only; it MUST NEVER be AI-generated or a fabricated maker quote (store-config §2.6; D10). A test MUST assert no fabricated maker quote is ever rendered.

**Empty (never a bare receipt)**
- Given no `thankyou` clip and no authored message, when the moment renders, then the neutral `text+media` fallback renders (warm neutral copy + a still) — never a bare "Order confirmed" (block-catalog §9).

**Loading**
- Given the clip is buffering, when the moment loads, then the clip poster + shimmer render while the order summary renders immediately below (the confirmation never waits on the video).

**Error**
- Given the clip fails, when it plays, then the block falls back to `text+media`; the order confirmation is never blocked by media.

**Success**
- Given the clip resolves, when it plays, then the personal video plays (sound opt-in), the order is saved, and a quiet "view order" link leads to order history (B9).

---

## UX / UI Notes

Surface touched: the thank-you moment renders the maker's `thank-you` block (their theme/voice) with the order summary in curated chrome secondary below. The human moment leads; the receipt recedes.

**Key Interactions:**

- `thank-you` block: `video-message` (personal clip, centered) or `text+media` (fallback: warm message + still).
- Sound opt-in (sound off until opt-in — the hard tone line).
- Order summary quiet below; "view order" link to B9.
- Reveal on `--ease-kol`; reduced-motion → instant fade.

**Edge Cases:**

- **empty** — no clip + no authored message → neutral `text+media` fallback (never a bare receipt).
- **loading** — poster + shimmer; order summary immediate.
- **error** — clip fails → `text+media` fallback; confirmation never blocked.
- **success** — personal video plays (sound opt-in), order saved.
- **honesty edge** — maker authored no message → neutral platform copy, never a fabricated quote (D10).

---

## Technical Requirements

Risk tier: **Lite** (frontend thank-you surface + one engine read + read of the completed order; no new billing write here — the order write is B7). No new tables/RPCs.

### Backend Changes
- No new backend. Calls the video engine `selectVideos(ctx)` with `ctx.state = 'THANK_YOU'`, `storeScope = store_id`, `limit = 1` (video-engine-spec §2). Reads the completed order (`orders`, RLS read-own) for the summary.
- The `thankyou` clip is the ONLY clip with `page_eligibility:['thankyou']`, so it is structurally eligible only here (mirror of the feed exclusion; video-engine-spec §2).

### Frontend Changes
- `thank-you` block render (`video-message` / `text+media`). Fallback resolves the maker-authored `props.message` or neutral platform copy — never a fabricated quote.
- Order summary rendered quietly, secondary to the human moment.
- 4 states: empty (neutral fallback), loading (poster + shimmer + immediate summary), error (fallback), success (video plays).

### Database Changes
- None new. Reads: `orders` (RLS read-own), `videos` (THANK_YOU via engine). The optional maker-authored `thank-you` block `props.message` lives in `stores.config.blocks[]` (jsonb). Bound strictly to Part B §B2 B8 — no new schema. `props.message` never AI-generated (D10).

### External Services
- None (payment/webhook is B7).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Order summary renders immediately; the video never blocks confirmation. | Playwright — assert summary paints before clip. |
| **Security** | Order read is RLS read-own only; engine reads published clips. | Review + RLS test. |
| **Scalability** | Single order + single clip; trivially bounded. | N/A. |
| **Accessibility** | Sound opt-in; captions on the clip; reduced-motion honored; "view order" keyboard reachable. | axe-core + reduced-motion emulation. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| B7 Checkout (payment success enters here) | Feature | Spec (this batch) | H |
| P6 engine THANK_YOU preset | Engine | Spec locked (video-engine-spec §2) | M |
| P4/P5 `thank-you` block + store-config `props.message` | Feature | Spec locked (block-catalog §9; store-config §2.6) | M |
| P7 tagging (maker's `thankyou` clip tagged) | Feature | Not Started | M — falls back to message if untagged |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B9 Order history | frontend-engineer (W3) | Yes | "view order" links into history |

---

## Out of Scope

- The order write / payment (B7 owns it).
- Order history list + detail (B9).
- Any AI-generated thank-you copy — the message is maker-authored or neutral fallback only (D10; hard constraint).
- Buyer-time generation of a thank-you clip (engine selects only, D5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| A fabricated maker quote is rendered as the thank-you message | L | H | `props.message` maker-authored only; neutral fallback when absent; explicit honesty test (D10). |
| A `thankyou` clip leaks into another state | L | H | Structural `page_eligibility:['thankyou']`-only tagging; mirror of the feed exclusion. |
| Order confirmation blocked by a failing clip | L | M | Summary renders immediately; clip failure falls back to `text+media` (AC). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Thank-you clip play rate (where a clip exists) | N/A | ≥ 90% of those orders play the clip (est.) | 30 days |
| Fabricated-quote incidents | N/A | 0 (honesty test) | ongoing |
| Order-confirmation-blocked-by-media incidents | N/A | 0 | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; honesty + eligibility tests green | 1–2 days |
| **Private Beta** | First cohort | No P0; thank-you reads as a warm human moment | 1 week |
| **Full Launch** | All buyers | Passed | — |

**Feature Flag**
- Behind a feature flag? Yes (shared buyer-journey flow flag).
- Flag name: `buyer-world-flow-enabled`
- Flag owner: frontend-engineer

**Rollback Plan**
- Rollback trigger: honesty violation (fabricated quote) or confirmation-blocking defect.
- Rollback decision maker: CTO.
- Rollback steps: disable flag → neutral order-confirmation fallback remains → fix → re-enable.
- Data impact: none (read-only surface).

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Exact neutral platform fallback copy for makers with no clip and no authored message (must read warm + honest, not a quote). | CPO + Design-Lead | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker W2)_
