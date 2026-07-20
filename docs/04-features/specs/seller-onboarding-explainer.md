# Feature Spec — Seller Onboarding Explainer (S1)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Seller Onboarding Explainer |
| **Feature Slug** | seller-onboarding-explainer |
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
| **Reach** | 6 | 4 seed maker worlds + first seller cohort *(assumed — low confidence; team-seeded MVP per D12)*. Every seller passes through this screen once, so reach = full seller top-of-funnel. |
| **Impact** | 2 | Medium. Sets the frame ("easy + limitless") that lifts interview completion, but does not itself produce a store. |
| **Confidence** | 70% | *(est.)* Concept-lock locks the step; conversion lift is assumed. |
| **Effort** | 0.75 person-weeks | *(est.)* Static video surface + CTA routing into S2. No LLM, no DB writes beyond a viewed-flag. `(ask CTO)` if a resume-progress state is wanted. |
| **RICE Score** | (6 × 2 × 0.70) ÷ 0.75 = **11.2** | Higher = higher priority |

**MoSCoW Classification:** Should Have (this cycle)

**Why this priority?** It is the seller pipeline's front door (concept-lock seller journey step 1) and cheap, but it produces no store on its own — the interview (S2) and draft (S3) are the Must-Haves. Ship it, but after the load-bearing AI stages.

---

## Overview

A video walk-through, shown once at the top of the seller pipeline, that explains the whole co-creation process (interview → AI draft → co-edit → approve → publish) and why it helps a small maker business (D8). It must feel *easy and limitless* — the emotional on-ramp before the maker records anything. It ends with a single CTA into the adaptive AI interview (S2).

---

## Problem

Makers arriving to build a store do not know what is about to happen, and "AI builds your store" reads as either intimidating (I'll lose control) or gimmicky (it'll be slop). The concept-lock is explicit that this step **"must feel easy + limitless"** (KOL-v2-concept-lock, seller journey step 1) and that the founder guardrail is **"never 'AI does it for you' — every AI touchpoint is with the maker; they stay the creative author."** Without a clear, warm framing of the loop up front, sellers drop before the interview, or arrive expecting the wrong thing.

*(USER-INSIGHTS.md is empty — this is a team-seeded MVP per D12; the problem is grounded in the concept-lock seller journey and founder guardrails, not fabricated quotes.)*

---

## Proposed Solution

A single, KOL-chrome onboarding screen that plays a produced explainer video and routes into S2.

**UX Flow:**

1. Seller lands on the onboarding screen (post-auth, role-gated to `seller`; role→`seller` is a service-role onboarding step per Part B B1, never client-set).
2. The explainer video plays (sound opt-in — poster + captions available; no autoplay audio). Copy alongside frames the loop in the maker's terms: "You talk, we take the design and marketing slack, you approve every section. You stay the author."
3. Seller reaches the end (or taps "I'm ready") and sees one primary CTA: **Start the interview**.
4. Result: seller advances to S2 with the frame set; the screen is not shown again on return (viewed-once).

---

## User Stories

- As a **new seller**, I want a short walk-through of how KOL builds my store so that I understand the process before I commit to recording.
- As a **cautious maker**, I want to see up front that I stay the author and approve every section so that "AI builds your store" does not scare me off.
- As a **returning seller**, I want to skip the explainer once I've seen it so that I go straight to the work.

---

## Acceptance Criteria

**Happy Path**
- Given an authenticated seller who has never completed onboarding, when they land on the onboarding screen, then the explainer video renders (poster-first, sound off until opt-in) and a single primary CTA "Start the interview" routes to S2.
- Given the seller finishes the video or taps the CTA, when they advance, then the onboarding-viewed flag is set and S2 loads.

**Empty State**
- Given no explainer video asset is configured for the environment, when the screen loads, then a text-and-still fallback conveys the same five-step loop and the CTA still routes to S2 (the interview is never blocked by a missing marketing asset).

**Loading State**
- Given the explainer video is still fetching, when the screen renders, then the poster frame shows immediately with a subtle skeleton shimmer (never a centered spinner) and the CTA is present and enabled; audio never loads until played.

**Error State**
- Given the video 404s or fails to decode, when the screen renders, then it falls back quietly to the poster + the text loop with a "Couldn't load this clip" inline note and a retry; the CTA into S2 remains usable.

**Edge Case**
- Given a seller who has already completed onboarding, when they navigate back to the onboarding route, then they are redirected forward to their current pipeline stage rather than re-shown the explainer.

---

## UX / UI Notes

Surface: **KOL's own product UI** (seller-tool chrome) → FIXED curated system (`theme.kind:"curated"` enums only; D15 shop freedom does NOT apply to tool chrome). The film-always-wins tone line applies: the explainer video leads; chrome frames it.

**Key Interactions:**
- Video plays muted; mute/caption controls only; sound off until opt-in.
- One primary accent CTA ("Start the interview"); no competing secondary actions.

**Four states (also in ACs):**
- **Empty** — no asset configured → text-and-still five-step loop; CTA still routes to S2 (empty ≠ blank).
- **Loading** — poster + skeleton shimmer matched to the video frame; CTA enabled.
- **Error** — poster fallback + quiet inline "Couldn't load this clip" + retry; interview reachable.
- **Success** — video plays with captions; CTA advances to S2.

**Edge Cases:**
- Reduced-motion → the video does not autoplay-scrub; static poster with an explicit play control.
- Mobile web (degraded target, D1) → single-column stack, video full-width, CTA pinned.

---

## Technical Requirements

### Backend Changes
- No LLM. No new API surface beyond reading a produced explainer asset (env/config, or a `videos` row per Part B S1 "static/`videos`").
- An onboarding-viewed flag on the seller's pipeline record so the screen shows once. `(ask CTO)` — prefer reusing an existing seller-pipeline status field; a new column would be Irreversible tier.

### Frontend Changes
- New seller onboarding route (role-gated `seller`), Server Component shell + a small client video component with poster-first loading, captions, mute toggle, and the four states.
- CTA routes to the S2 interview entry.

### Database Changes
- None required beyond the viewed flag (prefer reusing an existing pipeline-status field — do NOT invent a table). Any new column = Irreversible tier and must be escalated.

### External Services
- Supabase storage / CDN for the explainer asset only. No third-party APIs.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Poster visible < 1s; video starts within 2s on a normal connection; CTA interactive immediately (never gated on video load). | Playwright timing + Lighthouse |
| **Security** | Route is role-gated to `seller`; role is service-role-set, never client-set (Part B B1). No PII in logs. | Auth route test + review |
| **Accessibility** | Captions present (WebVTT); play/mute keyboard-navigable; reduced-motion honored; CTA has an accessible label. | axe-core + screen-reader walkthrough |
| **Scalability** | Static asset served from CDN; scales trivially. | n/a |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth + role→seller (Part B B1) | Feature/Data | Not Started | H — no seller context without it |
| Produced explainer asset (D12 team footage) | Content | Not Started | L — text fallback ships without it |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| S2 Adaptive AI interview | frontend/ai-engineer | Yes | CTA hands off to S2 |

---

## Out of Scope

- The interview itself (S2) and any recording.
- Any AI generation, cost-logging, or eval (there is no LLM in S1).
- Personalized/branched explainers per craft — one explainer for MVP.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Explainer asset not ready at build | M | L | Ship the text-and-still fallback; swap the asset in later |
| Seller skips and misses the framing | M | M | Keep the framing copy on-screen alongside the video, not only inside it |
| New viewed-flag column forces a migration | L | M | Reuse an existing pipeline-status field; escalate to CTO before adding a column |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Explainer → interview start rate | 0% | > 85% of sellers who view it start S2 | 30 days post-seed-cohort |
| Onboarding drop-off | N/A | < 10% leave before starting S2 | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | All 4 states pass; CTA routes to S2 | 1–2 days |
| Full Launch | All sellers | No P0 bugs | — |

**Feature Flag** — Behind `seller-onboarding-explainer-enabled`? Yes (low risk; flag mostly to swap the asset). Owner: CTO.

**Rollback Plan** — Trigger: video breaks the route. Decision maker: CTO. Steps: disable flag → text-only onboarding remains → the pipeline is never blocked. Data impact: none (no destructive migration; a reused status flag is backward-compatible).

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Does the onboarding-viewed state reuse an existing seller-pipeline status field, or does it need a new column (Irreversible tier)? | CTO | Before build |
| 2 | One explainer for all crafts in MVP, or a short craft-tailored variant at D13 real-user open? | CPO | Post-MVP |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
