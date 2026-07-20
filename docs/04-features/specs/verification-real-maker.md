# Feature Spec — Verification: Real-Maker Badge (S9)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Verification — Real-Maker Badge |
| **Feature Slug** | verification-real-maker |
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
| **Reach** | 6 | 4 seed worlds + first cohort *(assumed, D12)*. Every maker who wants the trust badge verifies. |
| **Impact** | 3 | Massive. The Real-Maker badge is half of KOL's honest-trust promise (D7) and a publish precondition (S6c). |
| **Confidence** | 70% | *(est.)* Data contract + guard are locked (Part B S9); the anchor-verification mechanism has open questions. |
| **Effort** | 2.5 person-weeks | *(est., ask CTO)* Voice-anchored flow + service-role resolution + badge minting under the DB guard. |
| **RICE Score** | (6 × 3 × 0.70) ÷ 2.5 = **5.0** | Must-Have. |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** The Real-Maker badge is a locked trust layer (D7) and a hard publish precondition (S6). A store that claims a Real-Maker badge must have a resolved voice anchor, or the honest-trust promise breaks.

---

## Overview

A voice-anchored, real-human verification flow that mints the **Real-Maker** badge (D7). On success it sets the verification `verified`, resolves the `voice_anchor_clip_id` (→ `videos`), and mints the badge; until resolved it stays `pending` and **never claims verified** (store-config.schema §2.1). Writes `verifications` / `badges`. RLS: insert-request is FORCED `pending`; resolution is **service-role only**; the `badges_real_maker_guard` trigger requires a same-store `verifications.status='verified'` before a `real-maker` badge can be written; `real-maker` badges are service-role only. Renders via `trust-badge` (Real-Maker).

---

## Problem

KOL's entire trust thesis is honesty: **"trust must be honest — no claim we can't back"** and **"verified real human anchored by their own voice"** (concept-lock guardrails + D7). The founder deliberately kept 3rd-party physical verification on the roadmap *because* it can't be backed in v1. The Real-Maker badge, by contrast, is backable — it is anchored to the maker's own voice clip. The failure mode that would destroy trust: a store showing a **"verified"** badge whose anchor clip was never resolved, or a maker self-minting the badge. The data contract makes both structurally impossible — insert forced `pending`, resolution service-role only, and a DB guard that fires for *all* writers (including service role).

*(No user quotes — grounded in concept-lock guardrails + D7.)*

---

## Proposed Solution

A verification flow whose success is the only path to a minted Real-Maker badge, enforced at the database.

**UX Flow:**

1. Seller starts verification from the dashboard (S7). An insert to `verifications` is created — RLS FORCES `status='pending'` (the maker cannot self-verify).
2. The maker completes the voice-anchored flow (recording the anchor that ties the human to their own voice).
3. **Resolution is service-role only** (not client): on success, the service role sets `verifications.status='verified'`, sets `verified_at`, resolves `voice_anchor_clip_id` (→ `videos`), and mints the `real-maker` badge. The `badges_real_maker_guard` trigger (`enforce_real_maker_badge`) fires for all writers and requires a same-store `verifications.status='verified'` — so a `real-maker` badge cannot exist without a verified verification.
4. Until resolved, the badge renders `pending` (never a false "verified"; store-config.schema §2.1).
5. Result: an honestly-verified Real-Maker badge with a resolved voice anchor, satisfying the S6 publish precondition (c).

---

## User Stories

- As a **maker**, I want to verify I'm a real human anchored by my own voice so that buyers can trust my shop is genuinely mine.
- As a **buyer**, I want a Real-Maker badge to mean a resolved, backable claim — never a decoration — so that trust is honest.
- As **KOL**, I want it to be structurally impossible for a maker to self-verify or for a badge to exist without a resolved anchor so that no false claim can ship.

---

## Acceptance Criteria

**Happy Path**
- Given a maker starts verification, when the request is inserted, then `verifications.status` is FORCED `pending` (client cannot set it otherwise; Part B S9).
- Given the service role resolves a verification, when it succeeds, then `status='verified'`, `verified_at` is set, `voice_anchor_clip_id` resolves to a `videos` row, and a `real-maker` badge is minted.

**No-false-claim guardrail (D7 / store-config.schema §2.1)**
- Given a verification is not yet resolved, when the `trust-badge` renders, then it shows `pending` — never "verified" — and the S6 publish precondition (c) blocks publish.
- Given no resolved `voice_anchor_clip_id`, when any writer attempts to mint a `real-maker` badge, then `badges_real_maker_guard` rejects it (requires same-store `verifications.status='verified'`; fires for ALL writers including service role).

**Authority guardrails (Part B S9)**
- Given a client (non-service-role) attempts to set `status='verified'` or change `voice_anchor_clip_id` after request, when it runs, then it is rejected — resolution and anchor changes are service-role only.
- Given a maker attempts to write a `real-maker` badge directly, when it runs, then it is rejected — makers may only write `ai-transparency` badges; `real-maker` is service-role only.

**Empty State**
- Given a maker who has not verified, when the verification surface renders, then it shows a "start verification" prompt and the badge renders `unverified` (empty ≠ blank; trust-badge always resolves to an honest state).

**Loading State**
- Given verification is in progress, when it runs, then a "verifying" state shows (never a bare spinner); the badge shows `pending`, not `verified`.

**Error State**
- Given the verification service is unreachable, when resolution is attempted, then the verification stays `pending` and the badge shows `pending` — it never claims verified on error (block-catalog §8).

**Edge Case (known-deferred N4)**
- Given a verification is later rejected after a badge was minted, when that happens, then the badge is **not auto-revoked** — this is known-deferred (N4). Do NOT build auto-revoke in this phase; cite it as known-deferred (adding it = new migration = Irreversible).

---

## UX / UI Notes

Surface: the verification flow runs in **KOL seller-tool chrome** (curated); the resulting badge renders in the **seller's shop** (custom theme, D15) via `trust-badge`.

**Key Interactions:**
- "Start verification" → voice-anchored flow → status feedback.
- Badge states surfaced honestly: `unverified` / `pending` / `verified` (with voice-anchor tap on verified; block-catalog §8).

**Four states (also in ACs):**
- **Empty** — "start verification" prompt; badge `unverified` (empty ≠ blank).
- **Loading** — "verifying" in progress; badge `pending`.
- **Error** — service unreachable → stays `pending`, never claims verified.
- **Success** — `verified` badge + resolved voice-anchor tap.

**Edge Cases:**
- Reduced-motion honored on any anchor-clip playback.
- The badge must never render "verified" from optimistic client state — it reflects the DB-resolved status only.

---

## Technical Requirements

### Backend Changes
- **Verification request** — insert to `verifications(store_id, maker_id, voice_anchor_clip_id → videos, status verification_status, verified_at)`; RLS read-own + insert-request FORCED `pending` (Part B S9).
- **Resolution** — SERVICE-ROLE only sets `status='verified'`, `verified_at`, resolves `voice_anchor_clip_id`, and mints the `real-maker` badge. Service-role check tests `auth.role()='service_role'` explicitly (never `auth.uid() IS NULL`; Part B B0/N1). Changing `voice_anchor_clip_id` after request = service-role only.
- **Badge guard** — `badges_real_maker_guard` → `enforce_real_maker_badge` fires for ALL writers (incl. service role) and requires a same-store `verifications.status='verified'`. Makers may write only `ai-transparency` badges (Part B S9/P11).
- **Known-deferred (N4):** a later-rejected verification does NOT auto-revoke a minted `real-maker` badge. Cite as known-deferred; do not build revocation.
- No LLM in S9 — no eval/cost-log obligation.

### Frontend Changes
- Verification route (role-gated `seller`, own-store, entered from S7): start-verification flow, voice-anchor step, honest status display; renders `trust-badge` states (`unverified`/`pending`/`verified`).

### Database Changes
- Writes **`verifications`**, **`badges(kind badge_kind, verification_id, transparency_level, disclosure, ai_assisted_fields)`** (Part B S9). Data-need tables = **Irreversible tier**. Do NOT add columns. The verified→badge path is DB-enforced (RLS + trigger), not app-side only (Part B B0).

### External Services
- The voice-anchor verification mechanism provider is TBD (`ask CTO` — the anchor-matching mechanism is not fixed in the locked contract). Supabase storage for the anchor clip (a `videos` row).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Verification status reflects within seconds of resolution; the badge never shows a stale "verified". | Status-propagation test |
| **Security** | Insert forced `pending`; resolution + anchor changes service-role only (tests `service_role` explicitly, N1); `real-maker` badge service-role only; guard fires for all writers. | RLS + trigger tests |
| **Trust integrity** | A `real-maker` badge cannot exist without a same-store verified verification + resolved anchor — asserted by tests attempting to bypass. | Guard bypass test |
| **Accessibility** | Anchor-clip playback captioned; badge states screen-reader legible; verification flow keyboard-navigable. | axe-core + screen-reader |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth + role→seller | Feature/Data | Not Started | H |
| `verifications` / `badges` tables + `badges_real_maker_guard` | Data (Irreversible) | Not Started | H |
| `videos` (anchor clip) | Data | Not Started | H — anchor must resolve to a real clip |
| Service-role resolution path | Feature | Not Started | H — resolution cannot be client-side |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| S6 publish precondition (c) | frontend | Yes | Blocks publish unless anchor resolved |
| P11 trust-badges | frontend | Yes | Renders Real-Maker state |
| S7 dashboard | frontend | Yes | Shows verification status |

---

## Out of Scope

- 3rd-party physical product verification — explicitly roadmap (D7), NOT this feature.
- The AI-Transparency badge layer (P11) — maker-writable; S9 is Real-Maker only.
- Auto-revocation on later-rejected verification (known-deferred N4).
- The trust-badge render component internals (P11 / block-catalog §8) — S9 drives the state, P11 renders it.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| A false "verified" claim ships | L | H | Insert forced `pending`; guard requires verified verification + resolved anchor; badge reflects DB status only |
| Maker self-verifies or self-mints the badge | L | H | Resolution + `real-maker` badge are service-role only; guard fires for all writers; makers write only `ai-transparency` |
| Service-role check uses null-uid (anon slips through) | L | H | Test `auth.role()='service_role'` explicitly, never `auth.uid() IS NULL` (N1) |
| Rejected verification leaves a live badge | M | M | Known-deferred (N4) — document; manual revoke path for MVP if needed |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| False "verified" claims in production | N/A | 0 (structurally impossible) | Always |
| Self-mint / self-verify bypasses | N/A | 0 | Always |
| Sellers who complete verification before publish | N/A | > 80% of published stores wanting the badge | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | Insert-forced-pending, service-role resolution, guard, and no-false-claim all verified; 4 states pass | 3–5 days |
| Private Beta | First seller cohort | No bypasses; badges resolve honestly | 1–2 weeks |
| Full Launch | All sellers | Metrics on target | — |

**Feature Flag** — `verification-real-maker-enabled`? Yes. Owner: CTO.

**Rollback Plan** — Trigger: any bypass of the verified→badge guard. Decision maker: CTO + Founder (trust-critical). Steps: disable flag → no new verifications; existing verified badges remain (DB-backed) → no false claims created. Data impact: `verifications`/`badges` writes are guarded and additive; a migration touching the guard = Irreversible tier.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Voice-anchor verification mechanism — how is the "real human anchored by their own voice" actually validated (liveness, anchor-matching)? Not fixed in the locked contract. | CTO + Founder | Before build |
| 2 | Auto-revoke on later-rejected verification is known-deferred (N4) — is a manual service-role revoke path needed for MVP, or is the deferral acceptable as-is? | CTO | Before build |
| 3 | Re-verification / expiry — does a Real-Maker verification expire or need periodic re-anchoring? | CPO + CTO | Post-MVP |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
