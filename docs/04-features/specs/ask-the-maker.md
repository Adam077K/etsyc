# Ask the Maker (B12)

<!-- Phase-5 spec worker (W3). Public per-product Q&A. REUSES the P15 messaging subsystem (W4, buyer-maker-messaging-drafts.md) — reference it, do NOT re-spec messaging. A `question` writes buyer_signals (feeds P6+ relationship ranking). Public questions/answers are SEPARATE tables from private threads/messages (OQ-5). -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Ask the Maker (Public Product Q&A) |
| **Feature Slug** | ask-the-maker |
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
| **Reach** | 5 | Buyers with a pre-purchase question on a product page + the buyers who read those answers (assumed — low confidence; basis "4 seed worlds + first cohort"). |
| **Impact** | 2 | Medium — reduces pre-purchase uncertainty + deepens the maker relationship; not a signature moment (`est.`). |
| **Confidence** | 75% | `questions`/`answers` tables + RLS locked; depends on P15 messaging landing first (`fact` on data, `est.` on sequencing). |
| **Effort** | 2 person-weeks | Public Q&A UI + writes, reusing P15 primitives (`est.`; `(ask CTO)` on the P15 build-order coupling). |
| **RICE Score** | (5 × 2 × 0.75) ÷ 2 = **3.75** | |

**MoSCoW Classification:** Should Have — D16-3 folds Ask-the-Maker into MVP and notes it *"reuses"* the messaging system; valuable trust/engagement, but gated behind P15.

**Why this priority?** D16-3 pairs Q&A with the messaging subsystem (D16-6). It turns a product page into a conversation with a real person — reinforcing "meet the human, trust them" — and its questions feed the relationship signal (P6+).

---

## Overview

A **public**, per-product Q&A: a buyer asks a question on a product page and the maker answers in text, audio, or video; the thread is publicly visible so future buyers benefit. It **reuses the P15 messaging subsystem** (message kinds, media handling) rather than re-specifying it, and writes to the **public** `questions` / `answers` tables — kept structurally separate from private `threads`/`messages` (OQ-5). Asking a question also emits a `question` relationship signal to `buyer_signals` (feeds P6+).

---

## Problem

D16-3 folds in *"Ask the Maker — public per-product Q&A, maker answers text/audio/video."* KOL's premise is turning shopping *"from a transaction back into a relationship"* by meeting the human (concept-lock). A buyer deciding on a handmade piece often has a specific question ("will this glaze be food-safe?", "can you make it taller?") that copy alone can't answer, and today has no honest, public way to ask the actual maker. The pain, in the buyer's terms: *"I have one question only the maker can answer, and I want to hear it from her — publicly, so I know it's real"* (grounded in concept-lock relationship framing + D16-3; USER-INSIGHTS.md empty).

---

## Proposed Solution

A public Q&A section on the product page. Buyers ask; makers answer in text/audio/video (reusing P15's message-kind + media primitives); the thread is public-read. Asking writes a `question` and a relationship signal.

**UX Flow:**

1. Buyer on a product page (B6) opens the **Ask the Maker** section and reads existing public Q&A.
2. Buyer (signed in) submits a question (body 1–2000 chars) tied to that product + its store.
3. The maker answers from their dashboard in text, audio, or video (reusing P15 message kinds `text`/`audio`/`video` + `media`).
4. The question + answer render **publicly** on the product page for all future buyers; asking emits a `question` signal to `buyer_signals`.
5. Result: a public, honest, maker-authored answer that de-risks the purchase and strengthens the buyer↔maker relationship.

---

## User Stories

- As a buyer, I want to ask the maker a public question on a product so that I get an honest answer before buying.
- As a buyer, I want to read others' answered questions so that my uncertainty is resolved without asking.
- As a maker, I want to answer in text, audio, or video so that I can respond in the most personal, honest way.

---

## Acceptance Criteria

**Happy Path**
- Given a signed-in buyer on a published product page, when they submit a question (body 1–2000 chars), then a `questions` row is written with `product_id`, its `store_id`, and `buyer_id` bound to the caller — and it appears publicly in the Q&A section.
- Given a question, when the maker answers with text/audio/video, then an `answers` row (kind ∈ text/audio/video, optional `media_id`) is written and rendered publicly beneath the question.
- Given a buyer submits a question, when it is written, then a `question` relationship signal is recorded to `buyer_signals` (feeds P6+ per-buyer ranking, not popularity).

**Empty State**
- Given a product with no questions yet, when the Q&A section renders, then it shows a warm invitation — "No questions yet — ask the maker" — **empty ≠ blank**.

**Loading State**
- Given the Q&A is loading, when the section renders, then thread skeletons (question bar + answer bar) matched to the real layout appear, not a spinner.

**Error State**
- Given a question submission fails, when the buyer submits, then a quiet inline error + retry appears and the drafted question is **not lost**; the rest of the product page stays usable.

**Edge Case (integrity + separation)**
- Given a buyer crafts a question with a `store_id` that is **not** the product's store, or targeting an unpublished store, when it hits PostgREST, then the INSERT `WITH CHECK` rejects it (`store_id` must equal the product's store AND be published) — DB-enforced, not app-side only (B0).
- Given the public Q&A, when any read occurs, then it reads **only** `questions`/`answers` (public-read) and **never** the private `threads`/`messages` tables (OQ-5 — the two must never be one table).
- Given a question body outside 1–2000 chars, when submitted, then it is rejected at the DB `WITH CHECK` (P2-8 body bound).

---

## UX / UI Notes

Surface touched: rendered on the **product page inside the maker's world** (the maker's own-brand surface). The Q&A block styles from the world's tokens. The maker-answer composer lives in **KOL curated dashboard chrome** (seller side).

**Key Interactions:**

- Q&A section on the product page: list of public questions + answers (text/audio/video), and an ask-a-question composer for signed-in buyers.
- Maker answers from the dashboard, choosing message kind (text/audio/video) — reusing P15's composer primitives.

**Edge Cases:**

- No questions → warm invitation (not a void).
- Signed-out buyer taps "Ask" → routed to sign-in (P1); reading Q&A stays public (no auth needed to read).
- Audio/video answer fails to load → degrade to the answer's text (if present) or a quiet "media unavailable"; question/answer text never blocked.

---

## Technical Requirements

> **Risk tier: Full** (public write path, DB `WITH CHECK` integrity, auth, relationship-signal write, reuse of P15). Data-need = **Irreversible tier** (tables locked; DB before backend). **P15 must land before B12** (build-order OQ, below).

### Backend Changes

- Public Q&A over `questions` / `answers` (+ `media`), **reusing P15 messaging primitives** (message kinds `text`/`audio`/`video`, media handling) — do **not** re-implement messaging here.
- `questions` INSERT via buyer JWT with DB `WITH CHECK`: `store_id` = the product's store AND the store is published; `body` length 1–2000 (P2-8). `buyer_id` bound to the caller.
- On question insert, emit a `question` signal to `buyer_signals` — inserted via **service role** (B0: `buyer_signals` inserts are service-role only), never client-set. Weight per P6+ signal map (`question` = 2.0).
- Reads are public (anon-readable) for `questions`/`answers`; the private `threads`/`messages` (P15) are counterparty-only RLS and are **not** touched by this surface.

### Frontend Changes

- Product-page Q&A section (world-styled): public thread list + ask composer (buyer) + answer composer (maker dashboard, reuse P15).
- All-4-states: empty (invitation), loading (thread skeletons), error (retry, no lost draft), success (public thread).

### Database Changes

**Data need (Irreversible tier — DB before backend; tables locked, NO new objects):**

| Object | Use | Status |
|---|---|---|
| `questions(product_id, store_id, buyer_id, body)` | public buyer questions; INSERT `WITH CHECK` store=product's store ∧ published; body 1–2000 | Locked (B2 §B12) |
| `answers(question_id, maker_id, kind message_kind, body, media_id)` | public maker answers (text/audio/video) | Locked (B2 §B12) |
| `media` | audio/video answer assets | Locked |
| `buyer_signals(subject_type, signal_type, weight)` | `question` signal (service-role insert) → P6+ | Locked (B2 §P6+) |

- Public `questions`/`answers` are **separate from** private `threads`/`messages` (OQ-5) — do not merge. Reuse P15 *primitives*, not its tables.

### External Services

- None (media via the platform's existing storage/CDN).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Q&A section loads P95 < 350ms for a product with ≤100 questions. | Read benchmark. |
| **Security** | Public-read scoped to published stores; `store_id`/`published`/`body`-length enforced by DB `WITH CHECK`; `buyer_id` bound to caller; signal write is service-role. | `WITH CHECK` rejection tests; cross-store + unpublished tests. |
| **Scalability** | Correct + paginated for a product with 1,000 questions. | Seed 1,000; verify pagination. |
| **Accessibility** | Composer + threads keyboard-navigable; audio/video answers have controls + captions where present; ARIA on the ask form. | axe-core + screen-reader. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P15 Messaging subsystem (message kinds, media) | Subsystem (W4) | Not Started | H — B12 reuses it; must land first |
| B6 Product page (host surface) | Feature (W2) | Not Started | H — no place to render Q&A |
| P2 `buyer_signals` write path | Feature (W1 spine) | Not Started | M — signal write needs it |
| P1 Auth (buyer identity for asks) | Feature (W1 spine) | Not Started | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| P6+ Relationship ranking | W1 (engine) / W3 (this batch) | Yes | consumes the `question` signal |

---

## Out of Scope

- The messaging subsystem itself (threads, drafts, versioning) — owned by P15 (W4); B12 reuses its primitives only.
- Private buyer↔maker DMs — that is P15's private `threads`/`messages`; Q&A here is strictly public.
- Moderation tooling / spam controls beyond the DB `WITH CHECK` constraints — noted for post-MVP.
- Commission flows — B14 owns guided co-creation.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Public Q&A and private messaging conflated into one table | L | H | AC + data-need pin `questions`/`answers` separate from `threads`/`messages` (OQ-5). |
| P15 not ready → B12 blocked | M | H | Build-order OQ surfaced to CTO; P15 sequenced first. |
| Buyer posts to a store that isn't the product's / unpublished | L | M | DB `WITH CHECK` rejects; not app-side only. |
| `buyer_signals` written client-side (trust boundary breach) | L | H | Signal insert is service-role only (B0). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Products with ≥1 answered public question | 0% | ≥ 30% of active products | 60 days post-launch |
| Question→answer response (maker) rate | — | ≥ 70% answered | 30 days |
| `question` signals feeding P6+ | 0 | tracked (non-zero) | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds | All 4 states + `WITH CHECK` tests + separation test pass | 2–3 days |
| Gradual Rollout | 10% → 100% | No P0; response-rate healthy | 1–2 weeks |
| Full Launch | All | P15 live; no P0 | — |

**Feature Flag** — Behind a flag? **Yes** — `ask-the-maker-enabled` (coupled to P15 availability). Flag owner: CTO.

**Rollback Plan** — Trigger: separation breach or spam abuse. Decision maker: CTO. Steps: disable `ask-the-maker-enabled` (product pages render without the Q&A section); tables are additive, no data loss.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Build-order (flagged to CTO):** P15 must land before B12 — confirm sequencing and which P15 primitives B12 imports vs re-renders. | CTO | pre-build |
| 2 | Whether the `question` signal fires on ask, on answer, or both, and its exact `subject_type` (product vs store vs maker). | CTO + CPO | pre-build |
| 3 | Moderation/abuse handling for public questions beyond `WITH CHECK` (deferred?). | CPO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
