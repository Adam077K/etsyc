# Buyer Onboarding (B18 — proposed)

<!-- Buyer preference-setup FLOW at /welcome · post-signup entry from P1 auth · one-time · CPO page-spec pass 2026-07-21.
     NOTE: this feature has NO dedicated D# — it is drawn from the founder page list. The SELLER counterpart (S1 / D8 "onboarding explainer") is specced; there is no locked D# for the BUYER counterpart, so the spec is grounded in D5 (video engine cold-start), D16-7 (relationship signals), D2 (auth), and the KOL v2 concept-lock guardrails ("never AI does it for you", "no flattening", "the film always wins"). Load-bearing frame: cold-start-by-doing — buyer can skip entirely and still get a working feed. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Buyer Onboarding |
| **Feature Slug** | buyer-onboarding |
| **Status** | Draft |
| **Author** | CPO (page-spec pass) |
| **Reviewers** | CPO + CTO + Design-Lead |
| **Created** | 2026-07-21 |
| **Last Updated** | 2026-07-21 |
| **Target Sprint** | Phase 6 — Build |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 7 | Every signed-up buyer passes through it once (assumed — low confidence; Reach basis = "4 seed worlds + first cohort" per D12). Signed-in reach only; anon buyers never see it. |
| **Impact** | 2 | Medium. Onboarding seeds the `Relationship` term of the video engine (P6+, 0.30 in FEED) with a warm-start bias — real, but the engine reads revealed behavior as the primary signal (est.). It is NOT the identity screen (B1 is). |
| **Confidence** | 60% | (est.) Concept-lock has no D# for buyer onboarding — this spec derives from D5/D16-7/D2 and the founder page list. USER-INSIGHTS.md is empty; the *say/do gap* documented in `docs/research/interviews/FINAL-SUMMARY.md` §2.2 is direct evidence that stated preferences are unreliable → biases us toward a *minimum-viable* survey. |
| **Effort** | 1.5 person-weeks | (est.) Server-action-backed multi-step flow + resume + write-through to `profiles`/`buyer_signals` via server action or RPC (see §Technical). `(ask CTO)` — depends on whether any preference field requires new columns (Irreversible tier — database-engineer). |
| **RICE Score** | (7 × 2 × 0.60) ÷ 1.5 = **5.6** | Lower than the buy-decision surfaces (product-page 8+, feed 10+, ranking 7.9). Ship it, but AFTER B1 discovery feed and P6+ relationship ranking. |

**MoSCoW Classification:** Should Have (this cycle)

**Why this priority?** The founder page list names a buyer onboarding surface, and the `Relationship` term benefits from a warm-start seed. But the load-bearing anti-flattening argument (below) says the *feed* is the identity screen, not this — so onboarding must exist as a **skippable** flow that never gates B1. It ships after the surfaces that decide whether KOL feels like KOL at all.

---

## Overview

Buyer Onboarding is a one-time, multi-step **flow** shown once after signup at `/welcome` (KOL chrome — the fixed curated design system, D15a). It captures the minimum viable preference set — a small number of taste/values selections and an optional maker-interaction preference — and hands the buyer into B1 discovery feed with warm-start signals seeded. It is a **flow, not a page** — the buyer does not navigate back to `/welcome` in normal use; re-running preferences later lives in Settings (out of scope for this spec, cross-linked).

**Hard frame: cold-start-by-doing.** The signature KOL surface is a video-native discovery feed of real makers on film. A long form-based questionnaire before the buyer has seen a single maker is exactly the wrong first impression and directly contradicts "human-first, film-led" (design system §0.1). The onboarding therefore keeps the survey small, makes every step **skippable**, and guarantees a working feed for a buyer who skips entirely.

---

## Problem

A signed-up buyer arriving at KOL has no signals yet: `buyer_signals` is empty, the P6+ `Relationship` term resolves to `0`, and the feed leans on Business + Freshness only (engine spec §5.3 guard 1, relationship-based-ranking.md ACs). That is a *correct, deliberate* cold-start — not a broken state. So the question is not "what data do we need to make the feed work?" (the feed already works cold), but "what tiny bias can we set that respects the founder guardrails?"

The founder guardrails that fence this problem are explicit and painful:

- **"No flattening. Every store must feel genuinely different"** (concept-lock guardrails) — flattening buyers into taste checkboxes ("boho / minimalist / maximalist") is the same failure mode we reject in a product grid, applied to people.
- **"The film always wins"** (design system §0.1, discovery-feed.md UX notes) — the first thing a new buyer sees should be a face, not a field.
- **Interview evidence — the say/do gap.** `docs/research/interviews/FINAL-SUMMARY.md` §2.2 is the direct evidence: *"4/4 buyers exalt local/unique; one recalls no recent local purchase, another (5+ yrs NYC) barely any. High professed value, low frequency. A business cannot be built on what people admire — only on what they do."* And §2.3: *"Price beats principle — on both sides. Values do not survive contact with a price tag."* Stated preferences from a form are the *least* reliable signal we can collect. Revealed behavior (which makers the buyer grows, follows, saves, buys) should dominate. Any onboarding that treats a survey as authoritative will build the wrong model of the buyer.
- **USER-INSIGHTS.md is empty** — no verbatim buyer language is available; this is a team-seeded MVP (D12). The problem is grounded in concept-lock + interview evidence + engine cold-start reality, not fabricated quotes.

Concrete pain if we build a *big* onboarding wrong: buyer arrives at KOL expecting to meet makers on film, is instead handed a Typeform, feels sold-to, defects before the feed. Concrete pain if we build *no* preference capture: the first `Relationship` boost has to wait for the buyer's first visit/follow/save — a small warm-start seed (respected as low-confidence, decayed fast) is better than nothing.

> "few large, human-forward pieces; story first; no urgency chyrons, no deal-grid density" — NARRATIVE, corrected direction (cited via `discovery-feed.md`)

---

## Proposed Solution

A **three-step, all-skippable flow** at `/welcome`, KOL curated chrome. Every step has a visible **Skip** and a visible **Skip all** on step 1. The flow captures the minimum viable set; every field is optional; a buyer who skips every step still lands on a working feed. Preferences translate into (a) small profile fields where columns exist, and (b) low-weight, time-decayed `buyer_signals` warm-start rows where a subject exists (see §Technical for the honest column-vs-write mapping).

**UX Flow:**

1. Post-signup, P1 auth redirects the buyer to `/welcome` **once** (idempotent: if `profiles.onboarding_completed_at` is not null, `/welcome` redirects forward to `/`). The screen opens with a full-bleed poster still of a real maker on film — **a face before a field** — and a single line: *"Meet a few makers first, or tell us a little about you."* Two primary options are equally weighted: **Start meeting makers** (routes to `/` = B1 feed, marks flow skipped) and **Continue** (advances to step 2).
2. **Step 1 — Taste & values** (skippable). A small, closed set of chip-multiselect options: 3–5 **vibe** chips (e.g. warm/handmade, modern/bold, botanical/alive, ornate/maximal, considered/quiet — mapped 1:1 to the 5 curated palettes as anchor vocabulary, design-system §2) and 3–5 **values** chips (e.g. small-batch, natural materials, local, women-led). Pick zero or many. A `Skip` link routes to step 3 (never blocks). No free-text.
3. **Step 2 — Maker interaction level** (skippable). A single 3-option select: *"How close do you want to get to makers?"* — options: **Just browse** (no messaging surfaces surfaced), **Say hi sometimes** (default; enables Ask-the-Maker / follow), **Commission things** (surfaces the guided-co-creation entry). Pick one or skip. This is a UI-preference field, NOT a permission gate — every buyer can always ask/follow/commission regardless of what they picked here; the choice tunes surfacing, not access.
4. **Step 3 — Budget & location** (skippable, honest as low-confidence). One 3-band budget select (**Under $50 / $50–$200 / $200+ / Skip**) and one location field (**Ship to: [country]**, prefilled from IP with a Skip). Copy above the fields honestly labels them: *"Rough guides — you can change these anytime, and we'll always show you makers outside these ranges too."* This is the guardrail against the say/do gap: we do not use these to *filter* the feed — only to gently bias the `Business`/`Freshness` scoring.
5. **Result screen.** A single "Meet your first makers" CTA that routes to `/` (B1 feed). The flow marks `profiles.onboarding_completed_at`. On next login the buyer lands directly in the feed; `/welcome` redirects forward.

**Resumability.** If the buyer closes the tab between steps, revisiting `/welcome` resumes at the last un-completed step (from `profiles.onboarding_step` — a small integer, see §Technical). Skip-all from step 1 sets `onboarding_completed_at = now()` and no partial write happens.

**Re-run from Settings.** Not this spec. A "Preferences" area under `/settings` (Account & Profile, P2) re-exposes the same fields at any time. This flow's job is the *first* touch only.

---

## User Stories

- As a **new buyer**, I want the first thing I see after signup to be a real maker on film, not a form, so that KOL reads as a marketplace of humans from the first frame.
- As a **new buyer**, I want to skip every step and still get a working feed, so that I never feel gated by a survey.
- As a **new buyer**, I want to give a few soft hints about vibe, budget, and how close I want to get to makers, so that my first-visit feed leans slightly toward what I already care about — without being locked into it.
- As a **returning buyer**, I want `/welcome` to redirect forward once I've completed it, so that I never see the flow twice.
- As an **anonymous visitor**, I want the site to work with no personalization at all, so that I don't have to sign up to browse (`/welcome` is signed-in only; anon lands on `/`).

---

## Acceptance Criteria

**Happy Path**

- Given a buyer who just completed P1 signup, when the post-auth redirect fires, then they land on `/welcome` step 1 (`onboarding_completed_at IS NULL`, `onboarding_step = 1`); the screen renders with the face-before-field poster and a single-line prompt.
- Given the buyer selects any number of chips on step 1 and taps Continue, when the server action runs, then a `profiles` update writes the selections (see §Technical for column mapping) and `onboarding_step` advances.
- Given the buyer completes all three steps and taps "Meet your first makers", when the server action runs, then `profiles.onboarding_completed_at = now()` is set and the client routes to `/` (B1 feed).

**Skip semantics (load-bearing — cold-start-by-doing)**

- Given a buyer on step 1, when they tap **Skip all**, then `profiles.onboarding_completed_at = now()` is set with all preference fields null, the client routes to `/`, and **the feed renders normally** — poster stills, muted autoplay, mixed-size magazine layout — via the FEED preset of the video engine (video-engine-spec §2.1). No blank/empty state. This is the hard guarantee: a skipping buyer's first visit is functionally identical to any other anonymous/signed-in visit whose `Relationship` term is `0`.
- Given a buyer who skipped all steps, when the engine scores their feed, then `Relationship = 0` (no seeded signals were written) and the ranker leans on `Business + Freshness` (engine spec §5.3 guard 1, mirrored in `relationship-based-ranking.md` ACs "Cold-start"). This is the correct behavior, not a degraded one.
- Given a buyer who skipped step 2 and step 3, when they land on the feed, then step 1 taste chips (if any were selected) still translate to warm-start seeds; skipping a step must never silently drop the earlier step's data.

**Resumability**

- Given a buyer who abandoned the flow mid-way (`onboarding_completed_at IS NULL`, `onboarding_step = 2`), when they revisit `/welcome`, then the flow resumes at step 2 with step 1's saved selections still selected; a "Back" link on every step > 1 allows editing.
- Given a buyer who has completed the flow (`onboarding_completed_at IS NOT NULL`), when they hit `/welcome`, then the route redirects forward to `/` (never re-shows the flow); re-running preferences lives at `/settings` (P2, out of scope here).

**Anti-flattening (structural — must exist as a test)**

- Given any set of selected chips on step 1, when the flow completes, then **no field written to `profiles` or `buyer_signals` can hard-filter the feed** — every preference is a *scoring bias only*. A test MUST assert that after any onboarding completion, a scoring pass over the same clip pool with `Relationship + preference bias` never *drops* a candidate that unbiased scoring would include (preferences reorder; they never exclude). This is the anti-flattening invariant applied to onboarding: we bias, we do not filter (mirrors D16-7 "affinity biases but never monopolizes").

**Say/do honesty (from the interview evidence)**

- Given a buyer selects "Under $50" on step 3, when they visit the feed, then the feed still includes makers whose products span all budget bands (the budget is a scoring bias with weight ≤ 0.10, not a filter). Copy above the field states this explicitly. Justification: `docs/research/interviews/FINAL-SUMMARY.md` §2.2/2.3 — stated preferences are unreliable; revealed behavior dominates.
- Given a buyer selects a set of vibe chips on step 1, when they follow/save a maker on a subsequent visit whose world contradicts those chips, then the resulting `buyer_signals` follow/save row is written **at full weight (unchanged by onboarding priors)** — the D16-7 signal writers do not consult onboarding. Revealed behavior overrides stated preference by construction. Test: seed onboarding with vibe=`quiet`, follow a `maximal` maker, assert the `follows` row is written with the standard signal weight.

**Auth + data trust boundary**

- Given `/welcome` is hit by an unauthenticated visitor, when the route resolves, then it redirects to `/login` (P1); `/welcome` is signed-in only.
- Given a preference write, when the server action executes, then `profiles` updates run under the buyer's own JWT (RLS: `profiles_self_update`); any write to `buyer_signals` runs **service-role only** via a server action or SECURITY DEFINER RPC — because `buyer_signals` is `RLS = read-own only`, service-role-write (ADR-0001 P2-4). The browser MUST NOT insert into `buyer_signals` directly. A network trace test asserts no direct browser → `buyer_signals` POST.
- Given a client passes an unexpected preference key (arbitrary JSON), when the server action runs, then it is Zod-rejected before touching the DB. No client-passed field can raise a buyer's `profiles.role` beyond `'buyer'` (ADR-0001 P2-1/2 already blocks this at the DB level — this spec relies on that guarantee, does not re-implement it).

**Empty**

- Given the buyer opens step 1 with zero chips available (should not happen — chips are a static curated list, but guarded), when the step renders, then the primary CTA is **Skip** and there is no broken empty grid.
- Given a buyer has `profiles.onboarding_completed_at IS NOT NULL` but zero preference fields set (skipped all), when they visit the feed, then the feed renders normally (see "Skip semantics" AC above).

**Loading**

- Given the flow is fetching (step transition), when the server action is in-flight, then the current step's Continue button enters a busy state (button-scoped, not a page spinner); no layout shift when the next step renders. Progress dots (step 1 · 2 · 3) are reserved from first paint.
- Given the location field is prefilling from IP, when detection is pending, then the field shows a subtle skeleton at the input's aspect and remains editable the moment it resolves (or after 800ms — never blocks).

**Error**

- Given a server-action write fails (network or 5xx), when the buyer taps Continue, then an inline error appears **below the CTA** ("Couldn't save — try again"), the CTA re-enables, and no partial state is written (each step's write is a single transaction). The buyer can always **Skip** past a broken step and continue to the feed.
- Given the IP-based location prefill fails, when step 3 renders, then the location field is empty and editable; no error toast — the field is optional.

**Success**

- Given all data resolves and the buyer completes the flow, when they tap "Meet your first makers", then `/` (B1 feed) renders as its normal `success` state (mixed-size magazine, poster-first, muted autoplay); the corner/hero video is a real maker on film within 1s (the "face before field → face in feed" continuity).

---

## UX / UI Notes

Surface touched: **KOL's own product UI** → FIXED curated design system (`theme.kind:"curated"` chrome only; D15a). No seller theme applies to the onboarding chrome. The film-always-wins tone line holds: step 1's face-before-field poster is the emotional anchor, not decorative.

**Key Interactions:**

- Step 1 hero: a poster still from a real seed-world maker (D12) fills the top half; the single-line prompt sits over it in the palette's `--on-media` token with the scrim treatment (design-system §1.1). No autoplay audio; a subtle looping muted clip is optional if a suitable seed clip exists, otherwise a still — the tone is *invitation*, not *TikTok*.
- Chips are pill-shaped (`--radius-pill`), tap-selects, `--dur-tap 120ms` scale-`[0.98]` on `:active` (design-system §1.5). Multi-select with a visible count at the CTA ("Continue with 2 selected · Skip").
- Progress dots at the top (`1 · 2 · 3`), reserved height, current step highlighted; tapping a past step navigates back (edit-in-place).
- CTA hierarchy per step: **one primary accent** (Continue / Meet your first makers) + **one text-link secondary** (Skip). Never two equal-weight CTAs except on step-1 where "Start meeting makers" and "Continue" ARE deliberately balanced (that is the load-bearing skip-first frame).
- Reveal on `--ease-kol`, 70ms stagger, media-leads-text. Reduced-motion → instant fade.
- Mobile web (degraded target per D1) → single column, chips wrap, CTA pinned bottom, poster shrinks to a thumbnail band.

**Edge Cases (4 states — all present):**

- **empty** — no chips defined (misconfig only, should not ship) → the whole flow is skippable; step-1 CTA reads "Skip all", routes to `/`. Never a blank void.
- **loading** — button-scoped busy state on Continue during the server-action write; skeletons on the location prefill; **never** a full-page spinner (the film always wins, and a spinner over a face defeats it).
- **error** — inline "Couldn't save — try again" below CTA, plus a visible **Skip** that always routes forward. The feed is never blocked by an onboarding error.
- **success** — the step's saved state renders (chips shown selected on return), the next step or `/` loads.

Anti-patterns explicitly forbidden here (each is the failure mode of a *bad* onboarding, cited so a reviewer catches drift):
- Multi-page corporate signup wizard (looks like a Typeform → violates human-first frame).
- Full-page loading spinner between steps (kills the "face wins" frame).
- Any hard "You must pick at least one" validation (breaks the skip-all guarantee).
- Any progress-completion nag ("Complete your profile to unlock…") — flattens the buyer into a completion score; concept-lock rejects it.

---

## Technical Requirements

Risk tier: **Full** (writes to `profiles`, writes to `buyer_signals` via service-role server action, touches the auth post-signup redirect, ≥ 300 LOC across route + flow + server actions). Sequencing: P1 auth (post-signup redirect target) must land first; the P6/P6+ engine must be live before the warm-start `buyer_signals` seeds do anything useful (safe to ship onboarding before those — the writes are additive, and if the engine isn't there, the seeds simply sit in the table).

### Backend Changes

- **New route:** `/welcome` (signed-in guard; unauth → `/login`; if `profiles.onboarding_completed_at IS NOT NULL` → 302 `/`). Server Component shell + client step components.
- **Server actions (Next.js Server Actions, Zod-validated):**
  - `saveOnboardingStep(step: 1|2|3, payload: OnboardingStepPayload)` — updates `profiles` for the current buyer under their own JWT (RLS `profiles_self_update`). Advances `profiles.onboarding_step`. Zod schema is a closed union; unknown keys are rejected.
  - `completeOnboarding(payload: FullOnboardingPayload)` — final step; sets `profiles.onboarding_completed_at = now()`; if any warm-start signals are derivable (rare — see below), invokes a SECURITY DEFINER RPC `seed_buyer_signals(rows jsonb)` under the **service role** (browser cannot call this directly).
  - `skipOnboardingAll()` — sets `profiles.onboarding_completed_at = now()`, no preference writes, redirects `/`.
- **New RPC (if seeded signals are written this cycle):** `seed_buyer_signals(rows jsonb)` — SECURITY DEFINER, `set search_path = ''`, `REVOKE EXECUTE FROM public`, `GRANT EXECUTE TO authenticated`. Inserts into `buyer_signals` with `weight ≤ 0.5` (well below the CHECK 0–100 cap) and forces `buyer_id = auth.uid()` inside the function body — the JSONB `rows` argument may not carry a `buyer_id`. `(ask CTO)` on whether to defer seeded signals to a later cycle and ship this feature preference-fields-only for MVP.
- No changes to auth (P1 owns the post-signup redirect target choice; onboarding just registers `/welcome` as that target).

### Frontend Changes

- New `/welcome` page (Server Component shell). Three client step components (`Step1Taste`, `Step2Interaction`, `Step3BudgetLocation`), a shared `ProgressDots` component, and a shared `StepFooter` with primary CTA + Skip link.
- All 4 states (see UX / UI Notes). The primary interactive states (Continue busy, Skip always-available) are button-scoped, not page-scoped.
- Uses the fixed curated design system tokens only (D15a) — no per-shop theme code path.
- Client never inserts to `buyer_signals`; all preference writes go through the server actions.

### Database Changes

**Data need — HONEST split of what exists vs what would need to be added:**

| Field / write | Backing column | Status | Tier if added |
|---|---|---|---|
| `onboarding_completed_at timestamptz` | **PROPOSED — not in ADR-0001** | Not present | **Irreversible** — schema addition, database-engineer worker |
| `onboarding_step smallint` (0–3) | **PROPOSED — not in ADR-0001** | Not present | **Irreversible** — same as above |
| Vibe/values selections (chips) | **PROPOSED — not in ADR-0001**; likely `profiles.preferences jsonb` (a small, closed-schema blob) | Not present | **Irreversible** — same as above |
| Maker interaction level (browse / hi / commission) | **PROPOSED — not in ADR-0001**; same `profiles.preferences jsonb` blob | Not present | **Irreversible** — same as above |
| Budget band (Under $50 / $50–$200 / $200+) | **PROPOSED — not in ADR-0001**; same `profiles.preferences jsonb` blob | Not present | **Irreversible** — same as above |
| Ship-to country | Likely `profiles.ship_to_country char(2)` — **PROPOSED**, not confirmed in ADR-0001 | Not present | **Irreversible** — same |
| Warm-start signals (if written) | `buyer_signals` (EXISTS, ADR-0001 §0.3) — read-own, service-role-write (P2-4). No schema change. | **Exists** | — |

**Flags for the CTO / database-engineer sequence:**

1. **ADR-0001 has NEVER BEEN APPLIED** — this is stated in the ADR itself (Status: Proposed, "Non-applied plan"). Any new column additions here must join the same not-yet-applied migration bundle, not sit as an orphan add-on. Escalate to CTO before database-engineer starts.
2. Every proposed field above is a **new column on `profiles`** → **Irreversible tier** per CLAUDE.md and per the KOL feature-tree build-order note ("DB migrations for all Data need tables above are Irreversible tier — database-engineer before backend-engineer").
3. The **preferred approach** is to fold all preference fields into a single `profiles.preferences jsonb` blob validated by a Zod contract at the server-action seam (parallel to the D4 `stores.config` jsonb approach) — this reduces migration surface to 3 columns (`preferences jsonb`, `onboarding_step smallint`, `onboarding_completed_at timestamptz`) instead of 4–6 columns. `(ask CTO / database-engineer)` — the alternative (typed columns per field) trades migration surface for query ergonomics; onboarding does not query these back with SQL predicates in MVP, so jsonb is likely the right call.
4. RLS: `profiles.preferences` is read-own + update-own (extends existing `profiles_self_update`); no new policy surface unless a public-read subset is wanted (it is not — preferences are private).
5. Writing to `buyer_signals` from onboarding is **not required for the flow to ship** — the engine cold-start already handles a `Relationship = 0` buyer correctly. If we defer warm-start seeds to a later cycle, this feature ships preference-fields-only and the `seed_buyer_signals` RPC is deferred. **Recommended default: defer seeded signals to a follow-up cycle** — honors the say/do-gap guard by letting revealed behavior write the first signals, and drops one Irreversible-tier surface from this cycle.

### External Services

- None. No third-party integrations. IP-based country prefill uses Vercel Edge geo headers if available; otherwise the field is empty (never blocks).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Poster still paints < 1s; every step transition < 300ms server round-trip on staging; **CTA is always interactive** (never gated on optional data loading); zero CLS across step transitions. | Playwright timing + Lighthouse CLS. |
| **Security** | `/welcome` is auth-gated; server actions run under buyer JWT for `profiles`; any `buyer_signals` write goes through the SECURITY DEFINER RPC under service role (never browser). Zod rejects unknown keys. Cannot elevate `profiles.role` (ADR-0001 P2-1/2 guarantees this DB-side). | Route auth test + network trace assertion + Zod unit test + attempt-to-elevate role test. |
| **Scalability** | Trivial — flow is per-buyer, at most one visit per buyer's lifetime; server actions are stateless writes. | n/a beyond a simple insert-under-load smoke test. |
| **Accessibility** | Chips keyboard-navigable (arrow keys within a chip group, space to toggle); CTA and Skip both keyboard-reachable with visible focus rings; poster has `alt` describing the maker on film; reduced-motion → instant reveals, no parallax; captions available if the poster is a muted looping clip. | axe-core + screen-reader walkthrough + reduced-motion emulation. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Buyer + Seller Auth (post-signup redirect target = `/welcome`) | Feature | Not Started | H — no signed-in buyer without it |
| `profiles.preferences` / `onboarding_step` / `onboarding_completed_at` columns (**PROPOSED — Irreversible tier**, database-engineer) | Data | **Not present in ADR-0001; ADR itself not yet applied** | H — no flow persistence without them |
| `seed_buyer_signals` RPC (SECURITY DEFINER, service-role) | Backend | Not Started (deferrable — see §Technical) | L if deferred; M if included this cycle |
| P6 video engine (FEED preset) — the feed the buyer lands on after skip/complete | Engine | Not Started | H for the skip guarantee (needs to render a working feed); mitigated by cold-start already working per engine spec §5.3 |
| KOL curated design system tokens (D15a) | Design | Locked (design-system §1–§4) | L |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B1 Discovery Feed (the landing after complete/skip) | frontend-engineer | Yes | Skip guarantee: feed MUST render for a skipping buyer via cold-start path (already an AC of `discovery-feed.md`). |
| P6+ Relationship-Based Ranking | ai-engineer | Yes | Consumes any warm-start `buyer_signals` seeds; low-weight and decayed → does not distort ranking. If seeds deferred, no dependency this cycle. |
| P2 Account & Profile (Settings → Preferences re-run) | frontend-engineer | Yes (out of scope here) | Later cycle re-exposes the same fields; the schema this spec proposes is the shared one. |

---

## Out of Scope

- **Re-running preferences later.** The Settings → Preferences page (P2 surface) is a separate feature. This spec is the **first-touch flow only**.
- **A "complete your profile" nag on the feed** — explicitly forbidden (concept-lock flattening guardrail; see UX anti-patterns above).
- **ML/embedding-based taste modeling.** MVP is rules only; the `LlmReranker` upgrade slot (engine §4) may later consume revealed signals, not stated preferences.
- **Any hard filter on the feed based on onboarding preferences** — preferences bias scoring; they never exclude candidates (see the anti-flattening AC).
- **Cross-device resume of a partial flow** — resume is buyer-scoped (via `profiles.onboarding_step`), which does work across devices, but there is no session-scoped resume beyond that. If a buyer completes on one device, `/welcome` redirects forward on all devices.
- **A/B tests of onboarding length** — not this cycle; ship the minimum-viable form first per the say/do-gap frame.
- **Onboarding for anonymous buyers** — anon buyers never see `/welcome`; they get the cold-start feed directly.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Onboarding grows into a long form-based questionnaire (identity failure — feels like a Typeform, not KOL) | M | H | Hard-cap 3 steps in the spec; every step skippable; step 1 CTA is "Start meeting makers" balanced against "Continue" — the skip-first frame is load-bearing. Reviewer must reject any PR that adds a mandatory field. |
| Skipping buyer lands on a blank feed (skip guarantee breaks) | L | H | Structural AC + regression test: after any onboarding completion/skip, the feed's cold-start path (`Relationship = 0`, lean Business + Freshness) renders. Cross-references `discovery-feed.md` cold-start AC. |
| Preferences are treated as filters somewhere in the ranker (flattening leak) | M | H | Anti-flattening AC + scoring test asserting preferences never *drop* a candidate (only reorder). Named guardrail: "we bias, we do not filter." |
| Stated preferences dominate revealed behavior (say/do gap) | M | M | Warm-start signal weights capped at 0.5; recency decay τ ≈ 30d (engine §5.3) fades them within ~1 month; behavioral signals write at full weight (unchanged). Interview evidence cited above. |
| Client passes crafted payload to elevate `profiles.role` | L | H | Zod rejection at server-action seam; DB-side `guard_profile_role` trigger (ADR-0001 P2-1/2) is the second wall. |
| Direct browser insert to `buyer_signals` | L | H | ADR-0001 P2-4 makes `buyer_signals` service-role-write; the seed RPC is SECURITY DEFINER. Network trace test enforces no browser POST. |
| ADR-0001 not applied yet; onboarding schema adds are Irreversible tier | H | M | Escalate to CTO to fold `preferences jsonb`, `onboarding_step`, `onboarding_completed_at` into the same not-yet-applied migration bundle; do not stand up a separate migration path. |
| Engine cold-start feels random to a first-time buyer | M | M | Accepted trade-off (ADR-0003 discovery feed); Freshness + reshuffle keeps it lively; the *skip* is a valid path by design. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Onboarding skip rate (step 1 → `Skip all`) | N/A | Any non-zero rate is HEALTHY; a target of ≤ 30% (est. — low confidence) indicates the flow reads as inviting. A skip rate ≥ 60% is a signal the flow is friction, not value — reduce further. | 30 days post-first-cohort |
| Onboarding completion rate (all 3 steps) | N/A | ≥ 40% of signed-up buyers complete all 3 steps (assumed — low confidence). We DO NOT target 90% — over-completion signals coercive UX. | 30 days |
| Time-to-first-face on `/welcome` step 1 | N/A | < 1.5s (real maker poster visible) | ongoing |
| Feed load failure rate for skipping buyers | 0% | 0% (the skip guarantee is structural) | ongoing |
| Buyers whose first follow/save contradicts their onboarding vibe chips | N/A | Any non-zero rate is EXPECTED per the say/do gap — this metric exists to verify revealed behavior is written at full weight, not suppressed by priors. | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed buyer accounts, D12) | All 4 states pass; skip-all reaches a working feed; resume works; no CLS between steps | 1–2 days |
| **Private Beta** | First real buyer cohort | ≤ 60% skip rate; no P0 bugs; no reports of "felt like a form" | 1 week |
| **Full Launch** | All new buyers | Rollout stages passed | — |

**Feature Flag**
- Behind a feature flag? Yes.
- Flag name: `buyer-onboarding-flow-enabled`
- Flag owner: frontend-engineer / CTO
- Flag-off behavior: post-signup redirect goes directly to `/` (B1 feed). This is a safe fallback — the feed already handles cold-start correctly.

**Rollback Plan**
- Rollback trigger: skip rate < 5% and completion < 10% (signals coercive/broken UX); OR any `buyer_signals` write path failure; OR any leak of preferences into hard-filter behavior on the feed.
- Rollback decision maker: CTO.
- Rollback steps: disable `buyer-onboarding-flow-enabled` → post-signup redirect goes to `/` → no data loss (already-written `profiles.preferences` rows remain, harmless).
- Data impact: none destructive. If we later change the `preferences` schema, it is a jsonb blob and can be migrated in place with a backfill.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Do we ship warm-start `buyer_signals` seeds this cycle, or defer them to a follow-up (recommended default)? Deferring drops one Irreversible-tier surface and honors the say/do-gap frame more strictly. | CPO + CTO + ai-engineer | Before build |
| 2 | Column layout on `profiles`: single `preferences jsonb` blob (recommended, mirrors D4) vs typed columns per field. Trade-off is migration surface vs SQL query ergonomics; we do not query these back with SQL predicates in MVP. | CTO + database-engineer | Before build |
| 3 | Does the post-signup redirect land on `/welcome` immediately, or does the buyer first see the feed for ~5s and then get a soft "want to tell us a bit about you?" tap? The spec assumes immediate; a soft variant would push face-first even harder. Test-once decision. | CPO + Design-Lead | Before build |
| 4 | Whether step 1 uses a static poster or a muted looping seed-world clip. Depends on whether a suitable seed clip exists (D12 shot list). | Design-Lead | Before build |
| 5 | Vibe chip vocabulary — mapping 1:1 to the 5 curated palettes (design-system §2) is the current proposal; needs Design-Lead sign-off on the *words* (palette names are not buyer-facing). | CPO + Design-Lead | Before build |
| 6 | Location prefill via Vercel Edge geo headers — always available, or region-restricted? If not reliably available, the field simply ships empty. | CTO / devops-engineer | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-21 | Initial draft — cold-start-by-doing framing, 3-step skippable flow, honest column additions flagged Irreversible, warm-start seeds deferrable | CPO (page-spec pass) |

---

_Last updated: 2026-07-21 | Updated by: CPO (page-spec pass)_
