# Events & Live Experiences (B19)

<!-- Page-spec pass. D16-8 tiered ROADMAP v1.1, NOT MVP. This spec exists so the surface is designed-for and the MVP does not paint itself into a corner. -->

---

> **NOT MVP — ROADMAP v1.1.** This feature implements **D16-8 (concept-lock: "Live Studio Sessions")**, which is explicitly tiered **post-MVP** because heavy real-time streaming infrastructure "doesn't gate the core recorded-video loop." The spec is written now for one reason only: to protect the MVP's forward-compat seams so a v1.1 live layer can be added without re-cutting the recorded-video engine, the `videos` schema, notifications, or the maker-world route tree. **Nothing in this spec ships in MVP.** The concept-lock guardrail against "auction/sales pressure" applies with double force here — see the Mission-Fit Risk section.

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Events & Live Experiences |
| **Feature Slug** | events-live-experiences |
| **Status** | Draft |
| **Author** | CPO (page-spec pass) |
| **Reviewers** | CPO + CTO + CBO + Research-Lead |
| **Created** | 2026-07-21 |
| **Last Updated** | 2026-07-21 |
| **Target Sprint** | v1.1 — post-MVP |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 3 | Live is opt-in per session per maker; only buyers online at the scheduled time attend. Reach much narrower than the always-on recorded feed. (assumed — low confidence; no live-attendance data at MVP) |
| **Impact** | 3 | Live is arguably the **purest** expression of D1's "meet the real maker" — unfakeable, real-time proof of a human hand. Massive potential impact when it does hit. (est. — mission fit is high; commercial impact unproven) |
| **Confidence** | 30% | Low. No customer interviews on live yet, no live infra chosen, no per-viewer-minute cost known. USER-INSIGHTS.md is empty. (fact) |
| **Effort** | 8–12 person-weeks minimum for a minimum-viable live surface (ingest + player + chat + moderation + recording). Full-fidelity likely 3–4× that. (est. — heavily depends on build-vs-buy; see Technical Requirements) |
| **RICE Score** | (3 × 3 × 0.30) ÷ 10 ≈ **0.27** | Deliberately low. RICE is not the reason to build it — D16-8's roadmap tier + the "meet the real maker" mission fit are. Included here so we can compare it honestly against v1.1 candidates. |

**MoSCoW Classification:** **Won't Have (this cycle)** — D16-8 lock.

**Why this priority?** Two-part answer. **Not now:** MVP proves the recorded-video loop (D5) with 4 seed maker worlds (D12); real-time infra doesn't gate that (D16-8). **But planned:** live is the mission's north-star surface for D1 — a buyer watching a maker work, unedited, in real time, is the ceiling of "meet the real maker." Deferring it is correct; not designing for it now would be a mistake because the MVP shape (video engine, `videos` table, notification types, route tree) could easily close doors that a v1.1 live add would have to rip back open.

---

## Overview

Events & Live Experiences is the maker's **live** surface: livestreams, live workshops, launches, studio tours, community moments, and real-time maker interaction. It lives at `/m/[maker]/live` inside the maker's own theme (D15 surface (b), full brand freedom). Buyers browse a schedule, RSVP, join a live session, watch a `<video>` element streaming in real time, participate in moderated chat, and — after the session ends — watch the recorded VOD, which flows back through the normal pre-recorded video pipeline (D5) so it can be selected by the engine on future page loads. This spec's job is not to ship live; it's to make sure MVP does not accidentally block it.

---

## Problem

The concept-lock is emphatic that KOL is "meet the real maker" (D1). Recorded video (D5) proves this most of the time — but a recording is, by definition, edited. A live stream is not. It is real-time, unfakeable proof that a human is on the other side of the screen. A workshop, a launch, a studio walk-through — these are the interactions makers already do on Instagram Live, TikTok Live, Twitch, and YouTube Live because their audiences want them, but they are forced onto surfaces that punish craft with algorithmic urgency, "-50% for the next 60 seconds," and dropshipper aesthetics. KOL's opportunity is to offer the same real-time proof-of-humanity **without** the urgency register (concept-lock guardrail: "no auction/sales pressure").

The concept-lock does not yet contain a buyer-voice quote about live sessions; USER-INSIGHTS.md is empty (fact — checked 2026-07-21). We are **not** fabricating one. Research-Lead pass required before v1.1 scoping, to ground the problem in the buyers' and makers' own words. Problem statement therefore rests on the concept-lock's own D1 + D16-8 language and the observable competitor behaviour: makers already run live sessions elsewhere, and they hate the sales-pressure register those platforms impose.

> _No verified buyer quote yet — USER-INSIGHTS.md empty as of 2026-07-21. **BLOCK on v1.1 scope-lock until Research-Lead runs a live-appetite pass.**_

---

## Proposed Solution

A per-maker live surface with three phases: **Scheduled** (announced upcoming session with RSVP), **Live** (real-time video + moderated chat), **Recorded** (session ends, VOD flows into the normal `videos` pipeline). The surface renders in the maker's theme (D15 (b)) at `/m/[maker]/live`, so the maker's visual world contains the live moment. KOL chrome (D15 (a)) provides the video player controls, chat affordances, and the moderation surface — the fixed system elements — while the maker's world provides everything around them.

**UX Flow:**

1. Buyer, browsing a maker's world (B3 WORLD_OPEN), sees a schedule card ("Live workshop — Thursday 8pm") or a live badge on the maker's chrome ("LIVE now").
2. If **scheduled**, buyer taps → session detail page → RSVP (calendar add + optional notification opt-in — see forward-compat with `notifications` B16).
3. If **live**, buyer taps → the live player opens in the maker's world (theme intact), video streams, moderated chat rendered alongside. The maker (or a producer) is broadcasting.
4. Buyer can chat (moderated), tap-to-hear if the session includes narration overlays, and — critically — **browse products the maker mentions** without leaving the session. Products render as the maker calls them out; **no countdown, no scarcity, no "-50%"** (concept-lock guardrail; see Mission-Fit Risk).
5. Session ends → live surface transitions to **Recorded**. The VOD is written into the normal `videos` table with a distinguishing `source` marker so the recorded-video engine (D5) can subsequently select it for eligible surfaces (feed / product / narration).
6. Result: the buyer has met the real maker in real time, has any relevant recording available afterward, and never felt sold to.

---

## User Stories

- As a buyer, I want to know when a maker I like is going live so that I can show up and watch them make something in real time.
- As a buyer, I want to watch a live session inside the maker's own world so that the moment still feels like _their_ place, not a generic streaming site.
- As a buyer, I want to ask a question in a live chat and have it answered by the maker or a moderator so that live feels human, not chaotic.
- As a buyer, I want to catch up on a session I missed via the recording so that the live time slot doesn't gatekeep the content.
- As a maker, I want a live surface that doesn't push me toward countdowns, scarcity, or "-50% for the next 5 minutes" so that I can go live without violating the register I chose KOL for.
- As a maker, I want the recording to become part of my ordinary video library after the fact so that a great live moment keeps working for me for months.

---

## Acceptance Criteria

> **All ACs are v1.1. None ship in MVP.** ACs marked **[MVP-SEAM]** describe MVP-time constraints designed to keep the door open — those _do_ apply now.

**Happy Path — v1.1**
- Given a maker has scheduled a live session, when a buyer visits `/m/[maker]/live`, then the buyer sees the upcoming session's title, scheduled time in their local timezone, maker's short description, and a clear RSVP action.
- Given a session is currently live (`sessions.status = 'live'`), when a buyer opens the session, then the live video renders in a `<video>` element inside the maker's theme with playback controls, and the moderated chat renders alongside.
- Given a live session ends, when the maker transitions it to `ended`, then within a bounded window (est. ≤ 5 minutes) the VOD asset is registered as a row in `videos` with a `source = 'live_vod'` marker (or equivalent), eligible only for maker-page/library surfaces until the engine's eligibility filter opts it in explicitly.

**Empty**
- Given a maker has never scheduled a session, when a buyer visits `/m/[maker]/live`, then a warm empty state renders inside the maker's theme ("No live sessions scheduled — follow to hear when something's coming") + a link back to the maker's world (B3). Empty ≠ blank.

**Loading**
- Given the schedule query is in flight, when the page renders, then a schedule-shaped skeleton renders (title bar + time bar + RSVP button placeholder), never a centered spinner.
- Given a live stream is loading, when the player mounts, then a poster frame + "connecting" text renders while the ingest URL negotiates; the surrounding chrome stays interactive.

**Error**
- Given the live stream drops, when the player loses connection, then a quiet "The stream paused — trying to reconnect" renders with an automatic retry (bounded), and the chat stays visible for context. Errors never blank the page.
- Given the VOD write-back fails, when the session ends, then the failure is captured (dead-letter queue or equivalent), the maker sees "Recording is being processed" rather than a broken UI, and the surface auto-recovers when the VOD lands.

**Moderation (mandatory — this feature invents the first live chat in KOL)**
- Given a buyer types a chat message, when it hits the moderation pipeline, then messages violating the moderation rules (see Non-Functional Requirements — Moderation) are blocked before display; the buyer sees a quiet reason ("your message wasn't sent") rather than a shame surface.
- Given a moderator or the maker takes action, when they remove a message, then it disappears for all viewers within a bounded time (est. ≤ 2s), and the removal is auditable.

**Mission-fit guardrails (concept-lock D16-8: "no auction/sales pressure")**
- Given a live session displays a product, when the product renders, then it renders in the standard product-card treatment (D15 (a) chrome tokens) — **no countdown timer, no "N left," no percentage-off badge, no "buy in the next X seconds"**. The design system tokens do not contain these primitives (fact, D15 (a) tokens); this AC pins that constraint at the feature layer.
- Given a chat message contains an urgency-style call ("buy now!!!" repeated caps / countdown emoji strings), when moderation runs, then the message is treated by the same policy as any other prohibited content — the register is a moderation concern, not a feature.

**[MVP-SEAM] Forward-compat constraints that DO apply now (see Forward-Compatible Seams below)**
- Given the MVP video engine is queried for FEED / PRODUCT / NARRATE surface videos, when the engine filters eligible rows from `videos`, then the filter is **closed** — only rows with a recorded `source` are eligible; the eligibility rule set is expressed as an explicit allow-list, not a "not-blocked" implicit list. This means a future `source = 'live_vod'` row cannot leak into a MVP surface accidentally.
- Given the MVP `videos` table is designed, when the schema is finalised, then live-session/event concepts are **NOT** stored in `videos`. Sessions live in their own table (`sessions`, PROPOSED v1.1) so that overloading `videos` with a "streamable now" flag does not happen.
- Given the MVP notifications feature (B16, proposed) is specified, when notification types are enumerated, then the type enum is defined as extensible (open enum / string discriminant + validated set), not as a closed union that would need a schema migration to add `session_starting` in v1.1.
- Given the MVP maker-world route tree is defined, when routes are laid down, then the maker's world reserves `/m/[maker]/live` as a **route that returns 404 today** but is not repurposed for anything else. This preserves the URL for v1.1 without requiring a redirect campaign.

**Edge cases**
- Given a buyer's session times out mid-stream, when their JWT expires, then playback continues to the end of the session (public live streams are readable without auth) but chat requires re-auth to post — the boundary is DB-enforced (RLS).
- Given a maker starts a session but never speaks / never streams a real feed, when moderation policy detects it, then the session can be ended by an admin without polluting the VOD library.
- Given a session's `store_id` is later unpublished, when a buyer opens the recorded VOD, then the recording still plays (it's the buyer/history's record) with a quiet note that the store is no longer live.

---

## UX / UI Notes

Surface touched: this is **surface (b) — the maker's world** (D15). The page renders in the maker's theme; the player, chat pane, and product interstitials use fixed KOL chrome tokens (D15 (a)) so the register is guaranteed to stay honest.

**Key Interactions:**

- Schedule card in maker's world → session detail page → RSVP (calendar `.ics` download + opt-in notification, forward-compat with B16).
- Live badge on the maker's chrome ("LIVE now") appears in the maker's world when a session is active; tapping enters the live player without leaving the theme.
- Live player: `<video>` element with the usual accessible controls (play/pause, volume, captions if the ingest supports them, fullscreen). No auto-play-with-sound.
- Chat pane: real-time messages, moderation actions surfaced quietly, no vanity chrome (no "gift" animations, no "join VIP" upsells — deliberate).
- Product interstitial: when the maker calls out a product, a standard product card renders (D15 (a) chrome), tap → the standard product page (B6). No urgency chrome.
- Recording state: identical player, VOD source, chat frozen and rendered as a transcript.

**Edge Cases:**

- **empty** — warm invitation + link back into the maker's world (B3). Never blank.
- **loading** — schedule skeleton for the schedule query; player poster + "connecting" for the stream. No centered spinners.
- **error** — dropped stream → quiet reconnect banner + chat stays visible. VOD write-back failure → "recording is being processed" surface, self-heals.
- **success** — schedule renders; live plays; recording plays; chat works; moderation works.

---

## Technical Requirements

**Risk tier: Irreversible.** Live is a different infrastructure class from every other KOL surface (all others are pre-recorded and engine-selected — D5). Introducing ingest, transcode, CDN/edge delivery, real-time chat, presence, moderation, recording, and per-viewer-minute cost is a multi-vendor, multi-workflow decision. **New tables required** (`sessions`, `session_attendees`, `session_messages`) → database-engineer required, and the ADR-0001 31-table migration has never been applied (fact) — a v1.1 schema pass must reckon with that unapplied migration explicitly.

### Cost honesty (mandatory read)

**Live is not "add a second video player." It is a different cost curve.** Recorded video is served from a CDN with a one-time transcode cost and near-zero per-view cost. Live has continuous per-second cost across every one of these axes:

- **Ingest** — cost to receive a broadcaster's stream (RTMP/WHIP/SRT).
- **Transcode** — cost to re-encode into ABR ladders for different clients.
- **CDN / edge delivery** — cost per viewer-minute, scaling with concurrent viewers.
- **Real-time chat + presence** — cost per connected client, scaling with concurrency.
- **Moderation** — human and/or automated cost per message.
- **Recording + VOD storage** — cost of writing every second to durable storage.
- **Bandwidth egress overage** — cost when a maker unexpectedly draws a large audience.

**Candidate vendors (build-vs-buy) — UNVERIFIED. No pricing, SLA, or feature claim is asserted here.**

| Candidate | What it is (rough) | Verification required |
|---|---|---|
| **Mux** | Managed video + live SDK | Pricing, per-viewer-minute cost, live-VOD flow, moderation story — **all unverified**. Research-Lead + CBO pass required. |
| **LiveKit** | Real-time video/audio infra (self-hostable or cloud) | Pricing, self-host TCO, chat/presence primitives, moderation — **all unverified**. Research-Lead + CBO pass required. |
| **Cloudflare Stream (with Live)** | CDN + live | Pricing, live latency, VOD workflow — **all unverified**. Research-Lead + CBO pass required. |
| **Agora** | RTC platform | Pricing, live-broadcast pattern fit, moderation — **all unverified**. Research-Lead + CBO pass required. |
| **Self-host (nginx-rtmp / OvenMediaEngine / etc.)** | Full-control, full-ops | TCO across engineering + on-call, delivery cost at edge — **all unverified**. Research-Lead + CBO pass required. |

**No vendor is chosen in this spec.** **No pricing is stated in this spec.** Any number that appears in a live-infra decision must be sourced by Research-Lead with URL + date + confidence, then costed by CBO. This is a v1.1 gate.

### Backend Changes

- New Server Actions / RPCs for: create session, publish/unpublish schedule, transition session state (`scheduled` → `live` → `ended`), RSVP, chat message write (moderation-gated), moderator remove.
- Signed ingest URL vending for the broadcaster (maker or their producer) — must not leak.
- Signed playback URL vending for viewers (if the vendor supports it).
- VOD write-back job: on `ended`, fetch the recording asset, write a row into `videos` with `source = 'live_vod'`, tag it so the recorded-video engine's eligibility filter does **not** pick it up until an explicit v1.1 policy row allows it.
- All writes under RLS; broadcaster-scoped policies for maker actions; buyer-scoped policies for RSVP/chat.

### Frontend Changes

- New route `/m/[maker]/live` in the maker's theme (D15 (b)).
- Schedule / detail / player / chat / product-interstitial components.
- 4 states everywhere (empty, loading, error, success).
- Reduced-motion honored on any live transitions.

### Database Changes

**PROPOSED — v1.1 only. No MVP-time schema changes for this feature.** All three tables must be authored by database-engineer at **Irreversible** risk tier. ADR-0001's 31-table plan **has never been applied** (fact); this feature's schema pass must be integrated with that plan, not sneak past it.

| Object | Purpose | Status |
|---|---|---|
| `sessions` | One row per live session — `id`, `store_id`, `title`, `description`, `scheduled_at`, `started_at`, `ended_at`, `status` (`scheduled` / `live` / `ended` / `cancelled`), `vod_video_id` (FK → `videos.id`, nullable until VOD lands) | **PROPOSED — v1.1.** Requires database-engineer @ Irreversible. |
| `session_attendees` | RSVP + presence record — `session_id`, `buyer_id`, `rsvp_at`, `joined_at`, `left_at` | **PROPOSED — v1.1.** Requires database-engineer @ Irreversible. |
| `session_messages` | Moderated chat log — `session_id`, `author_id`, `body`, `created_at`, `moderation_state`, `removed_by`, `removed_at` | **PROPOSED — v1.1.** Requires database-engineer @ Irreversible. Moderation state is a first-class column, not an afterthought. |

- `videos` gains a `source` marker (an existing column extended, not a new table) so recorded-live can be distinguished from originally-recorded — **but the enum must be introduced with `live_vod` explicitly disallowed by the engine's eligibility filter until v1.1 policy opens it.** The MVP change: seed the eligibility filter as a **closed allow-list**. That's a [MVP-SEAM] item.

### External Services

- **Live infra vendor** — TBD, unpicked, unpriced (see cost-honesty table above).
- **Moderation** — automated (candidate: OpenAI moderation, Perspective API, vendor-native) and/or human review pipeline. **All candidates unverified**; Research-Lead + CBO pass required.
- **Push / email notifications** — via B16 (`notifications`, proposed) — this feature reuses that primitive rather than inventing a live-specific notification system.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|---|---|---|
| **Performance** | Live glass-to-glass latency ≤ 5s (typical), acceptable ≤ 10s. Chat message delivery < 1s at 500 concurrent viewers per session (est. — not yet load-tested; contingent on vendor). | Vendor benchmark + Playwright + synthetic load test at v1.1 build. |
| **Reliability** | Session-drop recovery within 30s. VOD write-back guaranteed via dead-letter queue; no silent VOD loss. (est.) | Chaos test: kill the ingest mid-stream and verify recovery + VOD persists. |
| **Security** | Signed ingest/playback URLs, short-lived. RLS on all `sessions` / `session_attendees` / `session_messages`. Broadcaster boundary DB-enforced. | Cross-buyer + cross-maker RLS tests; ingest-URL leak test; adversary-engineer pass at Irreversible. |
| **Moderation (mandatory)** | Every chat message runs through a moderation policy (automated first-pass; human escalation queue). Prohibited: hate/harassment, sexual content, personal-info dumps, spam, and — **specific to KOL's register** — urgency/scarcity/sales-pressure phrasing (e.g., "buy now in 10 seconds!!!", countdown emoji spam, "-N% for you only"). Policy is a shipped artifact reviewed by CCO. Removed messages are auditable. | Policy review + moderation-pipeline unit tests + adversary-engineer red-team pass at Irreversible. |
| **Scalability** | Correct behavior for up to (est.) 2,000 concurrent viewers per session in v1.1 launch; horizontal ceiling documented, not aspirational. | Vendor load test + Etsyc-side observability. |
| **Accessibility** | Player has captions when the ingest provides them (or a manual caption input surface). Chat is keyboard-navigable. All controls have accessible labels. Reduced-motion honored on all live transitions. | axe-core + screen-reader walkthrough on the v1.1 build. |
| **Cost observability** | Per-session cost breakdown captured (ingest minutes, viewer-minutes, chat messages, storage) so CBO can build a per-session unit economics report. | Cost dashboard in analytics. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| MVP video engine eligibility filter is **closed allow-list** (not implicit) | [MVP-SEAM] | Spec item — must land in D5 build | H — the whole "recorded VOD flowing back into the engine" story depends on this filter being clean |
| MVP `videos` table does **not** overload live/session concepts | [MVP-SEAM] | Spec item — must land in schema author pass | H — retro-splitting a table is expensive |
| B16 Notifications (proposed) exposes an **extensible** type enum | [MVP-SEAM] | Spec (`docs/04-features/specs/notifications.md`) | M — could be worked around, but painful |
| `/m/[maker]/live` route **reserved** (returns 404, not repurposed) | [MVP-SEAM] | Spec item — must land in route tree | L — cheap to preserve |
| P1 Auth (session + RLS anchor) | Feature | Not Started (MVP W1 spec) | H — no chat/RSVP boundary without it |
| B3 WORLD_OPEN (maker world route + theme render) | Feature | Draft | H — live surface renders inside the world |
| Vendor selection (live infra + moderation) | External | **NOT STARTED** — Research-Lead + CBO pass required before v1.1 scope-lock | H — every downstream decision blocks on this |
| ADR-0001 31-table migration application | Infra | **Never applied** (fact) | H — schema pass for `sessions`/`session_attendees`/`session_messages` must be reconciled with the unapplied migration, not sneak past it |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---|---|---|---|
| Recorded video engine (D5) | frontend / backend | Yes (implicit — via MVP-SEAM) | Live VOD becomes an engine-eligible row on session end; engine must handle new `source` value |
| Notifications (B16) | frontend / backend | Yes | Live start/end events publish through B16's transport |
| Order / commerce (B7) | backend | No | Products called out live still use the standard product page / cart / order flow. Live is not a separate commerce path. |
| Maker dashboard (S7-family) | design-lead + frontend | No | Sellers need a "schedule a session / go live / review moderation" surface — separate v1.1 spec |
| Trust surfaces (B6+ reviews) | frontend | No | A great live moment is trust-generating; may feed the trust badge story in a future pass |

---

## Out of Scope

**First — the entire feature is out of scope for MVP.** Restate: **NOT MVP. ROADMAP v1.1.** D16-8 lock. The only MVP-time work this spec authorises is the four [MVP-SEAM] constraints in Acceptance Criteria + Dependencies. Everything else waits.

**Additionally out of scope even at v1.1 (unless separately re-scoped):**

- **Countdown / scarcity / auction / "-N% for next X minutes" mechanics** — explicitly out (concept-lock guardrail, D16-8). Design tokens do not contain these primitives (D15 (a)); no live surface may reintroduce them.
- **Buyer-time video generation** — D5 lock: no buyer-time generation. Live is broadcast, not generated.
- **Tipping / gifting / VIP tiers** — the sales-pressure register those mechanics carry is antithetical to concept-lock. Explicitly out at v1.1.
- **Multi-guest broadcasting (co-hosts)** — v1.2+ if ever.
- **Live shopping cart with "carted while watching" upsell chrome** — the buyer uses the standard product page and cart (B6/B7). No live-specific commerce surface.
- **A live-tab in KOL's global chrome** — live lives inside each maker's world; there is no KOL-wide "live directory" in v1.1. (Reason: pushes the register toward the Twitch/TikTok-Live pattern we are avoiding.)
- **Session recording _editing_ tools** — the VOD is the raw recording; editing is a maker's own concern (external tools) at v1.1.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Mission drift into sales-pressure register** (the biggest risk) | H | H | Design tokens (D15 (a)) do not contain urgency primitives, and the moderation policy prohibits urgency phrasing in chat. The concept-lock guardrail is codified in ACs, not implicit. CCO reviews the moderation policy before v1.1 launch. |
| Live infra cost blows up unit economics (per-viewer-minute × unexpected audience) | M | H | Research-Lead + CBO pass on vendor selection **before** any code is written. Per-session cost observability shipped with the feature (see NFRs). Fallback: cap concurrent viewers per session at v1.1 launch. |
| Moderation cannot keep up in real time, and toxic content reaches viewers | M | H | Automated first-pass moderation is table-stakes at v1.1. Human escalation queue with SLA. Kill-switch for a session by admin. Adversary-engineer red-team on the moderation pipeline before launch. |
| VOD write-back fails silently; a great live moment is lost | M | M | Dead-letter queue; explicit "recording is being processed" UI; ops alert on VOD-write failure. |
| Live VOD leaks into recorded-video engine surfaces (feed/product/narration) prematurely | M | M | **[MVP-SEAM]:** the engine's eligibility filter is a **closed allow-list**, not implicit — so `source = 'live_vod'` is inert until v1.1 policy explicitly permits it. |
| MVP-time schema decisions overload `videos` and force a v1.1 rewrite | M | H | **[MVP-SEAM]:** sessions live in their own tables. `videos` does not gain a "streamable now" flag. |
| Vendor lock-in — picking a live vendor now that we cannot leave | L (v1.1) | H | v1.1 vendor pass must include exit cost + portability of ingest URL / player embed / VOD assets in the CBO evaluation. |
| Regulatory / content liability (DMCA, hate-speech statutes, minor protection) | M | H | Legal review during v1.1 vendor pass; moderation policy authored to a defensible standard; take-down workflow in place before launch. |

---

## Success Metrics

**All targets v1.1 — not measurable in MVP.**

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Live-session attendance (avg concurrent viewers per session) | 0 | ≥ 20 per session for 4 seed makers (assumed target — low confidence, no baseline) | 60 days post v1.1 launch |
| Session recording-view rate (VOD views ÷ live viewers) | 0 | ≥ 2× (each session's VOD watched more than its live audience) | 90 days post v1.1 launch |
| Moderation-caught prohibited messages (as % of all chat messages) | N/A | Trend down over time; measured, not zero | ongoing |
| **Mission-fit health signal:** number of live sessions using urgency/scarcity phrasing | 0 | **0** (hard target — this is a guardrail, not a KPI) | ongoing |
| Per-session unit economics (revenue-attributable minus cost) | N/A | Positive by 90 days post launch (CBO to model at v1.1 vendor pass) | 90 days |
| Cross-buyer / cross-maker read incidents | 0 | 0 | ongoing |

---

## Rollout Plan

**Reminder: this feature does not roll out in MVP.** The rollout plan below is the v1.1 shape; MVP-time work is limited to the [MVP-SEAM] items in Dependencies + Acceptance Criteria.

**MVP-time work (this cycle)**

| Stage | Audience | Criteria | Duration |
|---|---|---|---|
| **Seam preservation** | Internal (CTO + database-engineer + frontend-engineer at MVP schema / route / engine time) | Video engine eligibility filter is closed allow-list; `videos` schema does not overload live; B16 notification enum is extensible; `/m/[maker]/live` returns 404 and is unclaimed | Concurrent with MVP build |

**v1.1 rollout stages (post-MVP)**

| Stage | Audience | Criteria to Advance | Duration |
|---|---|---|---|
| Vendor selection | Research-Lead + CBO + CTO | Vendor picked with sourced pricing + SLA + exit cost; moderation vendor picked; per-session cost model signed off by CBO | 2–3 weeks |
| Schema pass | database-engineer @ Irreversible | `sessions` / `session_attendees` / `session_messages` authored, reconciled with unapplied ADR-0001 migration, RLS policies reviewed, cross-buyer/maker tests green | 1–2 weeks |
| Internal alpha | 1 seed maker, 1 test session, team-only viewers | End-to-end live + VOD flow works; moderation catches red-team prompts | 1 week |
| Private beta | 4 seed makers | No P0 incidents; moderation SLA met; no urgency-register violations reported | 2–4 weeks |
| Gradual rollout | 10% → 50% → 100% of makers | Per-session unit economics positive-trending; concurrent-viewer scale target met | 4–6 weeks |
| Full launch | All makers | Passed | — |

**Feature Flag**
- Behind a feature flag? **Yes.** Flag name: `live-experiences-enabled`. Default OFF in MVP. Never toggled on in MVP.
- Flag owner: CTO at v1.1.

**Rollback Plan**
- Rollback trigger: any of — moderation failure incident (toxic content reaching viewers), per-session cost exceeds CBO ceiling, mission-fit signal fires (urgency-register violation surfaces publicly), cross-tenant RLS read.
- Rollback decision maker: CTO for infra failures; CCO + CPO jointly for mission-fit violations.
- Rollback steps: disable `live-experiences-enabled`; the maker world falls back to hiding the live surface; scheduled sessions display "temporarily unavailable"; VODs already in `videos` stay accessible (they are just normal videos at that point).
- Data impact: no VOD data lost on rollback; `sessions`/`session_attendees`/`session_messages` rows persist for audit.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Which live infra vendor? (Mux / LiveKit / Cloudflare Stream / Agora / self-host) — pricing, SLA, VOD flow, moderation integration, exit cost all UNSOURCED. | Research-Lead + CBO | pre-v1.1 |
| 2 | Which moderation vendor / policy? Automated first-pass + human escalation, or vendor-native? What is the SLA on toxic-content removal? | Research-Lead + CCO + CBO | pre-v1.1 |
| 3 | How does live interact with the `videos` engine at v1.1 — does the recorded VOD flow into FEED, or is it maker-page-only? (Recommendation: maker-page-only until explicit v1.1+ policy opens FEED eligibility.) | CPO + CTO | pre-v1.1 |
| 4 | Live's Reach/Impact confidence is 30% because USER-INSIGHTS.md is empty. Research-Lead pass required to ground the problem in buyer + maker voice. | Research-Lead | pre-v1.1 scope-lock |
| 5 | Should the MVP maker-world chrome (D15 (a)) render a "coming: live" placeholder in a maker's world, or nothing? (Recommendation: nothing — do not tease a v1.1 surface.) | CPO + Design-Lead | pre-MVP ship |
| 6 | Does the schema pass for `sessions` / `session_attendees` / `session_messages` require ADR-0001 to be applied first, or can it be a follow-on migration? | database-engineer + CTO | pre-v1.1 |
| 7 | Legal review scope (DMCA, minor protection, hate-speech statutes) — what is our defensible bar? | CBO + external counsel | pre-v1.1 launch |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-21 | Initial draft — page-spec pass. Framed as NOT MVP / D16-8. Cost-honesty + moderation + mission-fit + [MVP-SEAM] sections emphasised. | CPO (page-spec pass) |

---

_Last updated: 2026-07-21 | Updated by: CPO (page-spec pass)_
