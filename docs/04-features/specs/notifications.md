# Notifications (B16 — proposed)

<!-- KOL page-spec pass · relationship re-entry engine · NOT the inbox (P15). One-way, system-generated, ephemeral, dismissible, read-only. May DEEP-LINK to a thread; never renders a reply affordance. Renders in KOL chrome (D15a). New `notifications` table = PROPOSED, requires database-engineer + a new migration at Irreversible tier; the 31-table ADR-0001 plan has NEVER BEEN APPLIED. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Notifications |
| **Feature Slug** | notifications |
| **Status** | Draft |
| **Author** | CPO (page-spec pass) |
| **Reviewers** | CPO + CTO + database-engineer (RLS/migration) + Design-Lead (voice/chrome) |
| **Created** | 2026-07-21 |
| **Last Updated** | 2026-07-21 |
| **Target Sprint** | Phase 6 — Build |

---

## Prioritization

> **Provenance note.** No direct D# in concept-lock. The feature originates from the founder's page list (route `/notifications`) and hangs off D2 (persistent account), D16-7 (relationship signals), and D6 (orders). It is the surface that operationalizes the relationship thesis after a first visit — the whole product exists to build a relationship, and a relationship needs a way for the maker to come back into view.

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 6 | Every signed-in buyer who ever follows a maker (B13) or places a commission (B14) or an order (B7) is a recipient (assumed — low confidence; basis "4 seed worlds + first cohort"). |
| **Impact** | 2 | Medium. It is not the buy-decision surface (B6) or the world (B3/B4); it is the *re-entry* surface — the reason a buyer comes back tomorrow. Mission-critical to relationship, secondary to conversion (est.). |
| **Confidence** | 55% | Data contract is PROPOSED, not locked; voice/attribution decision is load-bearing but untested with users (assumed — low confidence). No USER-INSIGHTS.md signal for this surface (empty). |
| **Effort** | 2 person-weeks | (est., ask CTO) New table + migration (Irreversible) + emitter hooks on follow/order/message/publish + list UI with grouping + retention job. |
| **RICE Score** | (6 × 2 × 0.55) ÷ 2 = **3.3** | Low-mid; below B6 and P15 but above cosmetic polish. Ship after the subsystems it depends on (P15 messaging, B13 follow/save, B7 order). |

**MoSCoW Classification:** Should Have (this cycle)

**Why this priority?** The concept-lock is emphatic that KOL is not a transaction — it is a relationship. Notifications are the surface that turns a one-time visit into a repeated one, on the maker's terms, without importing the urgency/deal chrome the founder deliberately rejected (D15/D15a). Ship *after* the tables it references exist (P15, B13, B7), *before* GA opens beyond the seed cohort.

---

## Overview

The Notifications page (`/notifications`) is the buyer's central surface for maker-originated updates — a new batch went up, a followed maker replied to your commission draft, your custom order shipped, a maker answered your public question. It renders inside **KOL chrome** (the FIXED design system, D15a — never a maker's theme). It is the **relationship re-entry engine**: the surface that brings a buyer back to a maker they already chose to care about. It is explicitly **not the inbox** (P15) — a distinction so consistently conflated that it earns its own section below.

---

## Problem

The founder's thesis is that shopping should be **"turned back into a relationship"** (concept-lock one-breath). A relationship does not survive on the strength of a single visit. Once a buyer has followed a maker (B13), placed a commission (B14), asked a public question (B12), or bought a piece (B7), there must be a surface that says *"here is what just happened in the small world of makers you already care about"* — otherwise the entire relationship dies at the checkout page.

Today (without this feature): a buyer who follows Sena on Tuesday has no way to know Sena fired a new batch on Friday. A buyer whose commission draft has a new revision has no idea unless they open the thread. A buyer whose order shipped is silent until Stripe emails them. The relationship the product exists to build has no re-entry point.

There is a second, subtler failure mode this spec must actively fight: notifications are the surface **most at risk of importing the pattern the design system explicitly rejects** — urgency chrome, deal counters, streaks, red badges, manufactured FOMO. The corrected direction (design-system §0) *rejects* the "dense, urgent, transactional deal-grid" of TikTok Shop. Notifications imported from that world would be a category error — they would flatten the relationship into a notification stream, which is the opposite of the point.

**No direct user quotes** — USER-INSIGHTS.md is empty for this surface (assumed — low confidence; this section is grounded in the concept-lock relationship thesis + D16-7 relationship signals, not in interviews).

---

## Proposed Solution

A route `/notifications` rendering in KOL chrome (fixed design system), showing a reverse-chronological list of maker-attributed events the recipient has some relationship to. Each notification carries **the maker's name and face**, not a system label. Copy is written in a warm, factual, maker-voiced register — never system-voiced, never urgent, never streak-baiting. Repeated events from the same actor + type collapse. Notifications are read-only; tapping one **deep-links** to the underlying surface (thread, product, order). A notification NEVER renders a reply affordance — replies live in the inbox (P15).

**UX Flow:**

1. Server-side, a service-role emitter writes a `notifications` row when one of the enumerated relationship events occurs (see enum below). The client never writes to this table.
2. The buyer opens `/notifications` from the KOL chrome nav (bell affordance with an unobtrusive unread dot — no red count-badge, no streaks).
3. The page lists notifications reverse-chronologically, grouped by (`actor_maker_id`, `type`, day) so five product releases from Sena in an afternoon collapse into "Sena added 5 new pieces today" — one row, not five.
4. Each row leads with the maker's avatar + attributed voice ("Sena fired a new batch"), a short factual context line, and a relative timestamp. No urgency chrome. No CTAs beyond "open".
5. Tap → deep-link to the underlying surface (product page, thread in inbox, order-history entry, world). The notification is marked read on tap. There is a "mark all read" affordance at the top.
6. Read notifications visually settle (opacity/weight), remain in the list, and are pruned by the retention policy (below).

---

## The Notifications ↔ Inbox distinction (load-bearing)

This distinction is constantly and wrongly conflated in feature discussions. State it here; enforce it in Out of Scope and in ACs.

| Axis | Notifications (this spec, B16) | Inbox / Messages (P15 — `buyer-maker-messaging-drafts.md`) |
|---|---|---|
| **Direction** | One-way, system-emitted | Two-way, human-authored |
| **Author** | The platform (on behalf of a maker actor) | A real participant (buyer or maker) |
| **Persistence** | Ephemeral — pruned by retention policy | Persistent — messages/drafts are the record |
| **Repliable** | **No.** Read-only. Deep-links only. | **Yes.** Compose text/audio/video; drafts versioned. |
| **Data** | `notifications` (proposed here) | `threads` / `messages` / `commission_drafts` (P15, locked) |
| **Retention** | Bounded (see policy below) | Append-only, retained |
| **Emotional register** | "Here is what happened" — factual, warm, unhurried | Actual conversation — the maker's real voice |
| **RLS** | Read-own only; **service-role write only** | Participants-only; both sides can write |

A notification may **deep-link into a thread** (P15 inbox) — for example, "Sena replied to your commission draft" links to that thread. But the notification row itself renders **no compose field, no reply, no quick-reaction**. Replies happen inside the inbox surface, not on this page. This is a hard rule and an acceptance criterion.

---

## User Stories

- As a signed-in buyer who has followed a maker, I want to see when that maker adds new work, so that I can come back into her world and see it.
- As a buyer with an in-flight commission, I want to know when the maker replies or shares a new draft, so that the negotiation doesn't stall silently.
- As a buyer who bought a piece, I want to see when it ships and arrives, so that I don't have to hunt through email.
- As KOL, I want notifications to be **maker-attributed** (voiced as the maker, faced with the maker), so that the surface reinforces the relationship rather than replacing it with a system feed.
- As KOL, I want notifications to be **read-only** (no reply, no reaction), so that Notifications and Inbox stay structurally distinct and the inbox remains the single home for conversation.

---

## Acceptance Criteria

**Happy Path**
- Given a signed-in buyer with at least one emitted event, when they open `/notifications`, then a reverse-chronological list renders in KOL chrome with each row showing the maker's avatar, maker-attributed copy, factual context, and a relative timestamp.
- Given a notification row, when the buyer taps it, then they are deep-linked to the underlying surface (product / thread / order / world) and the row's `read_at` is set for that recipient.
- Given a `Mark all read` affordance, when the buyer taps it, then every unread notification for that recipient has `read_at` set in a single service-role RPC.

**Maker attribution / voice (load-bearing)**
- Given a notification of type `maker_new_product`, when it renders, then the copy is **maker-attributed and human-voiced** — the pattern is "{{maker.display_name}} added a new piece" or the maker's own voice line where present ("Sena fired a new batch"), **never** a system-voiced label like "New product available".
- Given a notification renders, when the recipient sees it, then the actor's avatar and name are present (`actor_maker_id` resolves to a real `profiles` row with `role='seller'`); a notification with an unresolvable actor is not rendered.

**Notifications ↔ Inbox separation (load-bearing)**
- Given any notification row, when it renders, then it exposes **no reply affordance, no quick-reaction, no compose field** — the only interactive affordance is "open" (deep-link) and, if unread, "mark read".
- Given a notification of type `commission_message_reply` or `commission_draft_new_version`, when the buyer taps it, then they deep-link into the P15 thread, and any reply/compose UI is rendered by the inbox surface (P15), not by this page.

**No urgency / no manufactured FOMO (load-bearing)**
- Given any notification, when it renders, then it **must not** include: a red count badge, a countdown timer, a streak counter, a "last chance" label, a scarcity indicator, an unread-tally displayed as a hero number, or any chrome that imports urgency. The design-system §0 rejects the "dense, urgent, transactional deal-grid" — this surface must obey it.
- Given the KOL nav bell, when there are unread notifications, then it shows an **unobtrusive presence dot** (a small marker in the palette's `--accent`), not a numeric red badge.

**Grouping / collapse**
- Given N ≥ 2 events from the same `actor_maker_id` with the same `type` on the same calendar day (recipient timezone), when the list renders, then they collapse into a single row ("Sena added 5 new pieces today") that deep-links to the aggregate surface (the maker's world / the products) — the underlying rows remain in the DB and remain individually markable via the group tap.

**RLS + write boundary**
- Given any client (buyer or maker), when it attempts to write directly to `notifications`, then the write is rejected — inserts and updates to the `notifications` table are **service-role only**. Read is **own-rows only** (recipient = `auth.uid()`).
- Given a client attempts to read a notification whose `recipient_id` is not `auth.uid()`, when the query runs, then RLS returns zero rows (no leakage across recipients).

**Retention / pruning**
- Given a notification older than the retention window (default: 90 days from `created_at`, OR 30 days from `read_at` if read, whichever is later — assumed default), when the retention job runs, then the row is deleted; the underlying entity (product, thread, order) is untouched.

**Empty**
- Given a signed-in buyer with zero notifications (first-run — this is common, not rare), when they open `/notifications`, then a **designed empty state** renders in KOL chrome: a warm invitation ("Nothing yet — follow a maker or place a commission and this is where you'll see them come back to you"), a route back to the discovery feed, and a route to their follows/saves (B13). **Empty is not blank.**

**Loading**
- Given the list is fetching, when the page loads, then a list skeleton renders (rows sized to real notification height, with avatar circle + two text lines skeletoned) — no spinner, no layout shift when data resolves.

**Error**
- Given the fetch fails, when the page loads, then a quiet inline error with a retry affordance renders — no toast, no urgency chrome, no red banner. If a single notification's actor cannot be resolved, that row is silently dropped and the rest of the list renders.

**Success**
- Given all data resolves, when the page is interactive, then unread rows are visually distinct (weight/opacity), grouped collapses are labelled, "mark all read" is live, and deep-links open the correct surfaces.

**Edge — deleted / unpublished referent**
- Given a notification points at a product that has been deleted or a store that has been unpublished, when it renders, then the row is either dropped from the list (recommended — assumed) or renders in a degraded state with the deep-link disabled and a one-line "no longer available" — never a broken tap that lands on a 404.

**Edge — signed-out**
- Given a signed-out visitor, when they navigate to `/notifications`, then they are routed to sign-in (P1); the page is never rendered for an anonymous session (RLS makes it empty anyway; the route guard is UX).

---

## UX / UI Notes

Surface: renders in **KOL chrome** — the FIXED design system (D15a). No maker theme, no per-world tokens. This is the platform frame, and it stays consistent across all recipients.

**Key Interactions:**

- Nav bell (top KOL chrome): shows an unobtrusive presence dot when there are unread notifications. **Not** a red count badge.
- Row: avatar (maker's real face, per D12) · maker-attributed copy line · short factual context (product title / thread subject / order id last-4) · relative timestamp · unread affordance (weight or a small palette-`--accent` dot on the row) · no reply, no reaction, no compose.
- Tap row → deep-link + set `read_at` for that recipient (single RPC).
- "Mark all read" (top of list) — service-role RPC that batches the update.
- Group collapse — auto-groups by (`actor_maker_id`, `type`, day-in-recipient-tz); expandable inline (assumed default: NOT expandable in v1 — the group deep-links to the aggregate surface).
- Motion: reveal on `--ease-kol`, `--dur-enter`; reduced-motion → instant fade (design-system §1.5).
- Voice test (design gate): if the copy for a row would be legible on a system-only page (Amazon, Etsy, TikTok Shop), rewrite it in the maker's voice.

**Edge Cases:**

- **empty** — designed, warm, common (first-run) — routes back to the feed and to follows/saves.
- **loading** — skeleton rows at real height; no CLS.
- **error** — quiet inline error + retry; drop unresolvable rows silently.
- **success** — reverse-chronological list, grouped, unread-visible, deep-linkable.
- **signed-out** — routed to sign-in.
- **stale referent (deleted product / unpublished world)** — row dropped or degraded, never a broken tap.
- **cross-timezone grouping** — group by recipient timezone (recipient's clock is the truth here).
- **reduced-motion** — instant fade on reveal; no drift, no ambient motion.

---

## Technical Requirements

> **Risk tier: Irreversible.** New table + migration + new RLS policies + a signup-independent service-role write path. Per CLAUDE.md, Irreversible tier requires Full review + 2-of-3 multi-judge + Founder sign-off.
>
> **Migration reality check:** the 31-table plan from ADR-0001 has **NEVER BEEN APPLIED** in production (ADR-0001 §Status = Proposed; §Implementation Checklist "Deciders notified" unchecked; ADR §Pre-apply staging validation not run). Adding `notifications` cannot piggyback on that plan — this spec requires **a new migration**, sequenced *after* the ADR-0001 base plan is applied (or as a group appended to it if the plan is still being applied when this ships). database-engineer must plan the sequence explicitly; do not ship this before the tables it references (`profiles`, `threads`, `orders`, `products`, `follows`, `commissions`, `questions`) exist.

### Backend Changes

- **Emitters (service-role, server-side only):** on each of the enumerated events below, insert a `notifications` row. The buyer's JWT NEVER writes this table.
  - `follow` on B13 → recipient = the maker (assumed — low confidence; may be filtered so a maker isn't spammed on follow — see Open Questions).
  - Maker publishes a new product (S8) or a new store version (S6) → recipients = every follower of the maker.
  - New message in a P15 thread → recipient = the counterparty of the sender.
  - New commission draft version in a P15 thread → recipient = the counterparty of the draft author.
  - `orders.status` transitions to `paid` / `fulfilled` / `shipped` / `delivered` / `refunded` → recipient = the order's buyer (and a mirrored notification to the seller for the seller-relevant transitions — assumed default; ask CTO).
  - Maker answers a public Q&A (`answers`) on a question the buyer asked → recipient = the buyer.
- **Read RPC:** `mark_notification_read(id)` (SECURITY DEFINER, verifies `recipient_id = auth.uid()`, sets `read_at = now()`).
- **Batch read RPC:** `mark_all_notifications_read()` (SECURITY DEFINER, updates all rows with `recipient_id = auth.uid()` and `read_at IS NULL`).
- **Retention job:** an Inngest (or cron) worker that deletes rows older than the retention window on a daily cadence.
- **Email/push:** **out of scope** (see Out of Scope). In-app only for MVP.
- **No LLM in this feature** — copy is templated with maker-attributed variables. If maker-voiced lines are added later (e.g., a maker sets their own "new batch" line), that stays a `text` field owned by the maker in a separate feature — no runtime generation, no eval obligation here.

### Frontend Changes

- Route `/notifications` — Server Component reads via RLS (own-rows only); Client Component renders the list with grouping + optimistic mark-as-read.
- KOL chrome bell: presence-dot indicator (query the count of unread server-side; render as a dot only — no numeric badge).
- 4 states (empty designed, loading skeletoned, error quiet, success).
- Zero placeholder UI; zero stubbed rows.

### Database Changes

**PROPOSED (not locked; requires database-engineer to author the migration + author RLS policies + append to the migration plan). NEW MIGRATION at Irreversible tier.**

- **New table `notifications`** — proposed columns (database-engineer to finalize types + naming):
  - `id uuid pk default gen_random_uuid()`
  - `recipient_id uuid not null references profiles(id) on delete cascade`
  - `type notification_type not null` — enum (see below)
  - `actor_maker_id uuid null references profiles(id) on delete set null` — the maker whose voice/face this speaks in; nullable only for system-neutral types (e.g., an order status set by the platform), but the vast majority are maker-attributed
  - `subject_type notification_subject not null` — enum of `product | store | thread | commission | order | question | answer` (aligned with existing `subject_type` enums in ADR-0001 where possible; ask database-engineer for reuse vs new type)
  - `subject_id uuid not null` — polymorphic (no DB FK, per ADR-0001 §Consequences on polymorphic columns; app/Zod validates)
  - `body_key text not null` — the copy template key (e.g., `maker_new_product`, `commission_draft_new_version`) — the frontend maps this to a maker-attributed copy string; no free-text body is stored
  - `body_vars jsonb null` — small variable bag (`product_title`, `count` for grouping, `order_last4`) — never PII beyond what's already visible on the linked surface
  - `read_at timestamptz null`
  - `created_at timestamptz not null default now()`
  - Index: `(recipient_id, created_at desc)` for the list read; partial index `(recipient_id) where read_at is null` for the unread-dot; `(actor_maker_id, type, created_at)` for retention/grouping analytics.
- **New enum `notification_type`** — proposed initial set (finalize with CTO before build):
  - `maker_new_product`
  - `maker_new_store_version` (a followed maker republished their world)
  - `commission_message_reply` (new message in an in-flight commission thread)
  - `commission_draft_new_version` (new draft version in an in-flight commission thread)
  - `order_status_paid`
  - `order_status_fulfilled`
  - `order_status_shipped`
  - `order_status_delivered`
  - `order_status_refunded`
  - `qa_answer_posted` (a maker answered your public question)
- **RLS (strict; the whole reason this is Irreversible):**
  - `alter table notifications enable row level security;`
  - **SELECT policy:** `recipient_id = auth.uid()`. No exceptions. A client cannot read another user's notifications by any query shape.
  - **INSERT policy:** service-role only (`auth.role() = 'service_role'`) — **never** `auth.uid() IS NULL` (ADR-0001 §N1 explicitly warns against the null idiom; anon has a null uid).
  - **UPDATE policy:** `recipient_id = auth.uid()` AND the only mutable column is `read_at` (enforced by a `BEFORE UPDATE` trigger — column-level RLS is not native to Postgres, ADR-0001 §Consequences).
  - **DELETE policy:** service-role only (retention job).
- **Referenced tables (must exist first):** `profiles`, `follows`, `stores`, `products`, `threads`, `messages`, `commission_drafts`, `commissions`, `orders`, `questions`, `answers`. All are in ADR-0001; none are applied yet.
- **Do NOT** add per-notification comment fields, per-notification reply fields, or per-notification reaction fields. Any of those would collapse the Notifications↔Inbox distinction.

### External Services

- None for MVP. **Email/push is explicitly out of scope** (see Out of Scope).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | List fetch P95 < 300ms for a recipient with up to 500 unread rows; unread-dot query P95 < 80ms (partial index). Skeleton rendered at real notification height (zero CLS). | Seed 500 rows; Playwright + Lighthouse CLS. |
| **Security** | RLS SELECT own-rows only; INSERT/DELETE service-role only; UPDATE own-rows + column-restricted to `read_at` via trigger. `auth.role() = 'service_role'` used (never `auth.uid() IS NULL` — ADR-0001 §N1). No PII in `body_vars` beyond what's already on the linked surface. | RLS matrix test (buyer/seller/anon/service); trigger test on column-scope. |
| **Scalability** | Correct with 10k rows per recipient; retention job prunes older rows without blocking user reads. | Seed 10k; run retention; measure. |
| **Accessibility** | Rows are semantic list items with real anchors (deep-links are `<a href>`s, not click-only divs); presence dot has a text alternative (`aria-label="unread notifications"`); "mark read" is a real button with pressed-state; keyboard navigable; reduced-motion honored on reveal. | axe-core + keyboard walkthrough + reduced-motion snapshot. |
| **Copy quality** | Every copy string is maker-attributed and human-voiced. A copy string that reads as system-voiced ("New product available") fails review. | Design-Lead review of the copy set before flag enable. |
| **No-urgency chrome (design gate)** | No red numeric badge, no countdown, no streak, no scarcity, no "last chance" — anywhere on this surface or the nav bell. | Design-critic audit before flag enable. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth (recipient identity via `auth.uid()`) | Feature | Not Started | H — no RLS anchor without it |
| P2 `profiles` (recipient + actor lookups) | Data | Not Started (ADR-0001 not applied) | H |
| ADR-0001 base migration applied (`profiles`, `follows`, `stores`, `products`, `threads`, `messages`, `commissions`, `commission_drafts`, `orders`, `questions`, `answers`) | Data (Irreversible) | Not Applied | H — this feature cannot ship until these exist |
| A new migration adding the `notifications` table + enum + RLS + trigger (this spec) | Data (Irreversible) | Not Started | H |
| B7 Checkout (order status transitions emit) | Feature | Spec (Phase 5) | M — order notifications lag if late |
| B13 Follow & Save (a follow is what triggers "maker_new_product" recipients) | Feature | Spec (Phase 5) | M — notifications have no recipients without follows |
| P15 Messaging + Draft-Versioning (thread + draft events emit) | Feature | Spec (Phase 5) | M — commission notifications lag if late |
| B12 Ask the Maker (Q&A answer events emit) | Feature | Spec (Phase 5) | L |
| S6/S8 Publish + Product management (publish/create events emit) | Feature | Spec (Phase 5) | M |
| KOL design-system chrome (D15a) + nav | Feature | Locked | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| P6+ Relationship ranking | ai-engineer / W1 | No | Read receipts (a buyer who opens a maker's notification and taps through) *could* be a relationship signal in a later pass; not in this feature. |
| A future email/push channel | CTO | No | Explicitly out of scope for MVP; the `notifications` table is the source of truth a future channel would fan out from. |

---

## Out of Scope

- **Email notifications.** Explicitly not in this feature. In-app only for MVP. A future email channel would read from `notifications` server-side and fan out; that is a separate spec.
- **Push notifications** (web push, native push). Same — out of scope; in-app only.
- **Any reply / reaction / compose affordance on a notification row.** Replies live in the inbox (P15). Deep-linking to a thread is allowed; rendering a compose field on a notification is not. This is the Notifications↔Inbox boundary and it is load-bearing.
- **Streaks, counts, badges, or manufactured urgency chrome** — a red count badge on the nav bell, a "you have N unread" hero number, a streak counter, a countdown, "last chance", "hurry", scarcity indicators, or any pattern imported from the deal-grid the design system explicitly rejects (§0).
- **Social-feed reactions** (like/favourite/emoji on a notification) — not a social network; not a like machine.
- **Ranking/prioritization within notifications** — reverse-chronological, grouped by (actor, type, day). No AI-ranked notification feed in MVP.
- **Marketing / cross-promotional notifications** (KOL-authored "new maker joined!", "we launched a feature", "check out this trending world"). This is a maker-to-buyer relationship surface, not a platform-to-user marketing surface. If a platform-side broadcast surface is ever needed, it lives elsewhere.
- **User-configurable notification preferences (mute a maker, mute a type, per-channel toggles).** Not in v1 — assume sensible defaults. Add later, spec it separately.
- **Deletion by the recipient.** Read-only in v1; retention prunes. Recipient-initiated delete is a later feature (open question).
- **Read receipts back to the maker** ("Sena knows you opened her notification"). Explicitly no — that is not a relationship, it is surveillance.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Notifications and Inbox conflated in build (reply UI leaks onto a notification row) | M | H | Load-bearing AC forbids compose/reply on the notification row; design-critic gate before flag enable; test asserts absence of `<textarea>`, `<button>` with compose intent, and `role="form"` on the notifications page. |
| Urgency chrome imported (red badges, streaks, countdowns) | M | H | Load-bearing AC forbids urgency chrome; design-critic and Design-Lead gate before flag enable; automated snapshot compares the nav bell against the "presence dot only" reference. |
| System-voiced copy replaces maker-attributed copy under time pressure | M | H | Copy review gate; every `body_key` must map to a maker-attributed template; a system-voiced string is a review block. |
| A client writes to `notifications` directly (trust boundary breach) | L | H | RLS INSERT/UPDATE (partial)/DELETE service-role only; `auth.role() = 'service_role'` explicitly (not `auth.uid() IS NULL`, ADR-0001 §N1). |
| Cross-recipient leak (buyer A sees buyer B's rows) | L | H | RLS SELECT restricted to `recipient_id = auth.uid()`; matrix test. |
| A deleted / unpublished referent produces broken deep-links | M | M | Row dropped or degraded in render (AC); never a live tap to a 404. |
| Retention deletes a row the recipient still wanted to see | L | M | Default retention is generous (90d unread or 30d after read). Configurable; log deletes for audit. |
| The migration ships before ADR-0001's base tables exist | M | H | Sequence explicitly: base migration first, then this. database-engineer owns the sequencing note. |
| Recipient gets spammed on a chatty maker's release day | M | M | Grouping/collapse by (actor, type, day) — five events become one row. |
| Recipient timezone drift causes odd grouping | L | L | Group by recipient timezone (recipient's clock is the truth). |

---

## Success Metrics

> Emphatically NOT engagement metrics (open rate, time-in-page, streak length). Notifications are a *re-entry* surface — success is the buyer returning to the *maker*, not to this page.

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Signed-in buyers who visit `/notifications` and then deep-link into a maker world / product / thread | 0% | ≥ 50% of visitors deep-link on a session where they open notifications | 30 days post-launch |
| Notifications that are visibly system-voiced ("New product available" style) in production | N/A | 0 (design-critic gate) | Always |
| Reply/compose affordances rendered on the notifications page | N/A | 0 | Always |
| Red-count-badge / streak / urgency chrome instances | N/A | 0 | Always |
| P95 list fetch latency for a recipient with ≤500 unread rows | N/A | < 300ms | Ongoing |
| Recipient-facing broken deep-links (row led to 404) | N/A | 0 | Ongoing |

---

## Rollout Plan

> Irreversible tier — new table + migration + RLS + service-role write path. Founder sign-off required per CLAUDE.md.

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Migration validation** | Staging DB only | ADR-0001 §Pre-apply staging validation completed; this migration applied cleanly on top; RLS matrix test PASS (buyer/seller/anon/service); trigger test on column-scope PASS | 1–2 days |
| **Internal Testing** | 4 seed accounts (D12) | 4 states + maker-attributed voice + no-urgency-chrome + no-reply-on-row + deep-link + retention job all verified | 3–5 days |
| **Private Beta** | First cohort | No P0; no system-voiced copy in production; no urgency chrome; deep-links land correctly | 1–2 weeks |
| **Full Launch** | All signed-in buyers | Metrics on target; design-critic gate held | — |

**Feature Flag**
- Behind a feature flag? **Yes** — `notifications-enabled` (nav bell and route both hidden when off).
- Flag owner: CTO.
- The bell affordance in KOL chrome respects the flag (removed when off — no dead affordance).

**Rollback Plan**
- Rollback trigger: RLS leak, system-voiced copy shipped, urgency chrome shipped, or a reply/compose affordance shipped on a notification row.
- Rollback decision maker: CTO + Founder (Irreversible per CLAUDE.md).
- Rollback steps: disable `notifications-enabled` (bell + route hidden); emitters continue writing rows (harmless — nothing reads them); fix; re-enable. If the migration itself is faulty, the rollback is more invasive — the `notifications` table drop is destructive to rows already written; sequence carefully (database-engineer owns the rollback SQL and it must be reviewed before the forward migration is applied).
- Data impact: additive table; disabling the flag does not delete data.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Sequencing** — the ADR-0001 base 31-table migration has never been applied. Confirm this feature's migration is sequenced AFTER the base plan (recommended) rather than folded in. | database-engineer + CTO | Before Phase 6 build |
| 2 | **Follow-side notification** — when buyer A follows maker M, does M receive a notification ("A new follower")? Concern: makers get spammed on release days; a maker who publishes to 500 followers doesn't want 500 rows on her side. Default proposed: **no notification on follow**; revisit with maker input. | CPO + CCO | Before build |
| 3 | **Order-status notifications: buyer + seller?** Default proposed: buyer gets all status transitions; seller gets `paid` and `refunded` only (the two seller-actionable states). Confirm with CBO for finance-impact edge cases. | CPO + CBO | Before build |
| 4 | **Retention window** — default proposed 90 days from `created_at` OR 30 days from `read_at` (whichever later). Confirm this is generous enough for a slow-relationship product (a buyer may come back monthly, not weekly). | CPO + Design-Lead | Before build |
| 5 | **Grouping expandability** — v1 default: groups are not expandable inline; the group tap deep-links to the aggregate surface. Confirm we accept this simplification, or invest in inline expand. | CPO + Design-Lead | Before build |
| 6 | **Recipient-initiated delete / archive** — do we allow a buyer to dismiss a single notification in v1? Default proposed: **no** (read-only + retention). Confirm. | CPO | Before build |
| 7 | **Maker-authored "voice line"** — some notification types (`maker_new_product`) could take a maker-set line ("Sena fired a new batch") instead of the templated maker-attributed default. Is this in scope for v1 or deferred? Default proposed: **deferred**; ship templated maker-attributed default first, add maker-set voice lines as a small later feature. | CPO + Design-Lead | Post-v1 |
| 8 | **Signal to P6+?** — should the act of opening a maker's notification and deep-linking through emit a `buyer_signals` row (a relationship signal)? Default proposed: **no** in v1 to avoid coupling; revisit once P6+ is live and we can measure. | CPO + ai-engineer | Post-v1 |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-21 | Initial draft (page-spec pass; B16 proposed; new `notifications` table proposed; Irreversible tier; Notifications↔Inbox distinction stated and defended) | CPO (page-spec pass) |

---

_Last updated: 2026-07-21 | Updated by: CPO (page-spec pass)_
