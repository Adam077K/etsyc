# Feature Spec — Buyer↔Maker Messaging + Draft-Versioning (P15)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Buyer↔Maker Messaging + Draft-Versioning |
| **Feature Slug** | buyer-maker-messaging-drafts |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 6 — Seller pipeline build |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 6 | 4 seed worlds + first cohort *(assumed, D12)*. A shared subsystem — every commission (B14) and every private maker conversation flows through it. |
| **Impact** | 3 | Massive. It is a new *subsystem* two MVP features (B12 Ask-the-Maker, B14 Commission) depend on. Without it, neither ships. |
| **Confidence** | 65% | *(est.)* Data contract + guard locked (Part B P15); real-time delivery mechanism is an open question. |
| **Effort** | 4 person-weeks | *(est., ask CTO)* Threads + multi-kind messages + draft versioning + participants-only RLS + `threads_guard`. New subsystem. |
| **RICE Score** | (6 × 3 × 0.65) ÷ 4 = **2.9** | Strategically Must-Have — a dependency of B12 + B14. |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** D16-6 (full co-creation) and D16-3 (Ask-the-Maker) both fold into MVP, and both *reuse* this messaging + draft-versioning subsystem. It is a build-order gate: **P15 must land before B12/B14** (flagged for CTO).

---

## Overview

The private messaging + draft-versioning subsystem that powers full co-creation (D16-6) and Ask-the-Maker (D16-3): threads, messages (text/audio/video), and shared commission drafts with revisions/versioning. RLS is participants-only. Writes `threads` / `messages` / `commission_drafts`; `threads_guard` (`guard_thread`) enforces `buyer_id <> maker_id` and that the maker is a seller (+ store owner if `store_id` set). **Private threads/messages are a SEPARATE subsystem from public `questions`/`answers`** (OQ-5) — B12's public Q&A must never be one table with private messaging.

---

## Problem

D16 folds **full buyer↔maker co-creation** (D16-6) and **Ask-the-Maker** (D16-3) into the MVP, and the concept-lock explicitly calls out that these introduce **"a buyer↔maker messaging + draft-versioning system … a sizable new subsystem"** reused across features. The founder's relationship thesis — **"turning shopping from a transaction back into a relationship"** (concept-lock one-breath) — depends on makers and buyers actually talking, and on commissions being a real back-and-forth (brief → messaging → shared drafts → revisions → approve → make). The failure modes: (1) conflating private commission messaging with public product Q&A (a privacy leak — OQ-5); (2) building it twice because B12 and B14 each roll their own; (3) losing a message or a draft version in a commission negotiation. This subsystem exists so it is built **once**, privately, with versioned drafts.

*(No user quotes — grounded in concept-lock relationship thesis + D16-6/D16-3.)*

---

## Proposed Solution

One private, participants-only messaging + draft-versioning subsystem, consumed by B12 (public-read Q&A surface) and B14 (private commission).

**UX Flow:**

1. A thread is created between a buyer and a maker (guarded: `buyer_id <> maker_id`, maker must be a seller, + store owner if `store_id` is set).
2. Participants exchange **messages** of kind text / audio / video (RLS participants-only).
3. For a commission (B14), participants share **commission drafts** with revisions — each draft carries a `version`, `content`, `media_ids`, a `note`, and a `status` — so the negotiation is versioned, not overwritten.
4. B12 (Ask-the-Maker) reuses the messaging primitive but surfaces **public** Q&A via the SEPARATE `questions`/`answers` tables — never the private `threads`/`messages` (OQ-5).
5. Result: a single messaging + draft-versioning backbone that B12 and B14 build on without duplicating it.

---

## User Stories

- As a **buyer**, I want to message a maker privately about a commission so that we can shape a custom piece together.
- As a **buyer and maker**, we want shared drafts with revision history so that a commission is a versioned back-and-forth, not a lossy overwrite.
- As **KOL**, I want private messaging kept strictly separate from public Q&A so that a private conversation is never exposed as a public answer (OQ-5).
- As **KOL**, I want this built once as a subsystem so that B12 and B14 reuse it instead of reimplementing messaging twice.

---

## Acceptance Criteria

**Happy Path**
- Given a buyer and a seller-maker, when a thread is created, then it is written to `threads(buyer_id, maker_id, store_id, commission_id, subject)` and both participants can exchange messages.
- Given a participant sends a message, when it is saved, then it is written to `messages(thread_id, sender_id, kind message_kind, body, media_id)` with kind ∈ text/audio/video.

**Draft versioning**
- Given a commission draft is shared, when a revision is made, then a new `commission_drafts` row with an incremented `version`, its `content`, `media_ids`, `note`, and `status` is written — prior versions are retained (versioned, not overwritten).

**Guard / authority (Part B P15)**
- Given a thread creation where `buyer_id = maker_id`, when attempted, then `threads_guard` (`guard_thread`) rejects it (`buyer_id <> maker_id`).
- Given a maker who is not a seller (or not the store owner when `store_id` is set), when a thread is created against them, then `threads_guard` rejects it.

**Privacy separation (OQ-5)**
- Given a private thread/message, when B12 renders public Q&A, then it reads the SEPARATE `questions`/`answers` tables — private `threads`/`messages` are never exposed publicly (participants-only RLS).

**Empty State**
- Given a thread with no messages, when it renders, then it shows a "no messages yet" prompt (empty ≠ blank).

**Loading State**
- Given a thread is loading, when it renders, then a thread skeleton shows (never a bare spinner).

**Error State**
- Given a message send fails, when it occurs, then a quiet inline error + retry appears and **no message is lost** (the drafted message is preserved for retry).

**Edge Case (known-deferred NEW-3)**
- Given a `commission_drafts.status` change, when it occurs, then note that `commission_drafts.status` is **not role-guarded yet** (NEW-3). Do NOT build the role guard in this phase; cite it as known-deferred (adding it = new migration = Irreversible).

---

## UX / UI Notes

Surface: messaging renders in **KOL curated chrome** (both buyer and seller sides use KOL tool chrome; the shop's custom theme does not apply to the messaging UI).

**Key Interactions:**
- Thread list + thread view; compose text/audio/video message.
- Commission-draft panel with version history (each version viewable; revisions additive).

**Four states (also in ACs):**
- **Empty** — "no messages yet" prompt (empty ≠ blank).
- **Loading** — thread skeleton; message list resolves progressively.
- **Error** — send failure → quiet inline error + retry; drafted message preserved (no lost message).
- **Success** — thread with messages + draft versions.

**Edge Cases:**
- Audio/video messages: playback captioned where possible; text alternative available.
- Reduced-motion honored.
- Private vs. public: the UI must make it unmistakable that a private thread (B14) is not a public answer (B12).

---

## Technical Requirements

### Backend Changes
- **Threads/messages/drafts** — write `threads`, `messages` (kind text/audio/video), `commission_drafts` (versioned). Participants-only RLS (counterparty-only). No LLM in P15 core — no eval/cost-log obligation (message *composition* assistance, if ever added, would be a separate feature with its own eval).
- **Guard** — `threads_guard` → `guard_thread`: CHECK `buyer_id <> maker_id`, maker must be a seller (+ store owner if `store_id` set); SECURITY DEFINER, `SET search_path=''`, schema-qualified (Part B B0/P15).
- **Privacy separation** — private `threads`/`messages` are a SEPARATE subsystem from public `questions`/`answers` (OQ-5); B12 reads the public tables, B14 uses the private threads.
- **Known-deferred (NEW-3):** `commission_drafts.status` is not role-guarded yet — cite as known-deferred; do not build the guard.
- **Real-time delivery** — the delivery mechanism (Supabase Realtime vs. poll) is an open question (`ask CTO`).

### Frontend Changes
- Messaging UI (thread list, thread view, multi-kind compose) + commission-draft version panel; the four states. Consumed by B12 (public Q&A surface) and B14 (commission flow) — this spec owns the subsystem, those own their surfaces.

### Database Changes
- Writes **`threads(buyer_id, maker_id, store_id, commission_id, subject)`**, **`messages(thread_id, sender_id, kind message_kind, body, media_id)`**, **`commission_drafts(version, content, media_ids, note, status)`** (Part B P15). Data-need tables = **Irreversible tier** (database-engineer before backend-engineer). Do NOT add columns. Do NOT merge private messaging with public `questions`/`answers` (OQ-5).

### External Services
- Supabase (DB + storage for audio/video message media; possibly Realtime for delivery — `ask CTO`). No third-party messaging provider.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Messages send/appear within a conversational window; draft version load < 1s. | Interaction timing |
| **Security** | Participants-only RLS (the only boundary, Part B B0); `threads_guard` enforces buyer≠maker + seller/store-owner; private threads never readable by non-participants; no PII in logs. | RLS + guard tests |
| **Data integrity** | No message or draft version is lost on send failure; draft revisions are append-only (versioned). | Failure-injection test |
| **Accessibility** | Compose + thread keyboard-navigable; audio/video messages have text alternatives; version history screen-reader legible. | axe-core + screen-reader |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth (buyer + seller identities) | Feature/Data | Not Started | H |
| `threads` / `messages` / `commission_drafts` tables + `threads_guard` | Data (Irreversible) | Not Started | H |
| `media` (audio/video message media) | Data | Not Started | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B12 Ask-the-Maker | frontend | Yes | Reuses messaging; public Q&A via SEPARATE `questions`/`answers` |
| B14 Guided Co-Creation / Commission | frontend | Yes | Uses private threads + versioned drafts + `orders.commission_id` |

---

## Out of Scope

- The public Q&A surface + `questions`/`answers` tables (B12) — SEPARATE subsystem (OQ-5); P15 is private messaging only.
- The commission brief/approve→order flow (B14) — consumes P15; not owned here.
- The `commission_drafts.status` role guard (known-deferred NEW-3).
- Any AI message drafting/assistance (not in scope; would be a separate eval-bearing feature).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Private messaging conflated with public Q&A (privacy leak) | M | H | SEPARATE tables (OQ-5); participants-only RLS; asserted by test that B12 cannot read `threads`/`messages` |
| B12/B14 build messaging twice | M | M | P15 lands FIRST as a shared subsystem (build-order flagged for CTO) |
| Lost message/draft on failure | M | M | Preserve drafted message on send failure; drafts append-only versioned |
| `commission_drafts.status` unguarded misuse | M | M | Known-deferred (NEW-3) — document; add role guard post-MVP (Irreversible) |
| Real-time delivery mechanism undecided | M | M | Poll fallback acceptable for MVP; Realtime an open question for CTO |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Private-thread leakage into public Q&A | N/A | 0 | Always |
| Lost messages / draft versions | N/A | 0 | Always |
| Commissions using versioned drafts (of B14 commissions) | N/A | > 80% use ≥ 2 draft versions | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (D12) | Threads/messages/drafts work; guard + participants-only RLS verified; privacy separation asserted; 4 states pass | 5–7 days |
| Private Beta | First cohort (with B12/B14) | No leakage; no lost messages; drafts versioned | 1–2 weeks |
| Full Launch | All users | Metrics on target | — |

**Feature Flag** — `buyer-maker-messaging-enabled`? Yes. Owner: CTO. **Irreversible tier — new subsystem + tables; Founder sign-off per CLAUDE.md for the migration.**

**Rollback Plan** — Trigger: privacy leak or lost-message bug. Decision maker: CTO + Founder (Irreversible). Steps: disable flag → messaging paused; B12/B14 gated behind the same flag (they depend on P15) → no leaked or lost data. Data impact: `threads`/`messages`/`commission_drafts` are append-only; a migration = Irreversible tier; backward-compatible.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Build order — P15 must land BEFORE B12 and B14** (both depend on this subsystem). Confirm sequencing so B12/B14 are not scheduled ahead of P15. | CTO | Before build (blocks B12/B14) |
| 2 | Real-time delivery mechanism — Supabase Realtime vs. poll for MVP? | CTO | Before build |
| 3 | `commission_drafts.status` role guard is known-deferred (NEW-3) — confirm the deferral is acceptable for MVP or schedule the guard (Irreversible). | CTO | Before build |
| 4 | Audio/video message size/length limits + storage/moderation policy. | CPO + CTO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
