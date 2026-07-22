# Discovery Feed (B1)

<!-- Buyer core state machine · state FEED · KOL Phase 5 spec worker W2 -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Discovery Feed |
| **Feature Slug** | discovery-feed |
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
| **Reach** | 10 | Every buyer session starts here — the front door (assumed — low confidence; Reach = "4 seed worlds + first cohort"). |
| **Impact** | 3 | Massive — this is the identity screen; it decides whether KOL reads as "marketplace of humans" or "another grid" (fact, per NARRATIVE + concept-lock step 1). |
| **Confidence** | 80% | Engine contract + layout intent are locked; open confidence gap is real interaction data (est.). |
| **Effort** | (ask CTO) person-weeks | Depends on the P6 engine (upstream) being live; feed layout + reshuffle is net-new frontend (est.). |
| **RICE Score** | (R × I × C) ÷ E — compute once Effort set by CTO | Highest-priority buyer surface. |

**MoSCoW Classification:** Must Have

**Why this priority?** The feed is the entry state of the whole buyer state machine (`FEED → … → THANK_YOU`) and the single most identity-defining screen. Nothing else in the buyer journey is reachable without it.

---

## Overview

The Discovery Feed is the buyer's entry point (state `FEED`): a **magazine-style layout of real makers on film** — mixed-size video and image cards, never a uniform product grid — that reshuffles each visit. It is KOL's own product surface (curated chrome). Content is chosen by the unified video engine (P6, D5), which surfaces one fresh hero clip per store across makers, and it structurally never shows a thank-you or checkout clip. It implements the concept-lock buyer journey step 1 (D5, D1).

---

## Problem

KOL exists to turn shopping "from a transaction back into a relationship" (concept-lock, one-breath summary). The reference read is explicit about what to reject: TikTok Shop / Complex are "dense grids of tiny product cards … zero human story," and the corrected design direction says to "reject the transactional grid entirely" (NARRATIVE, §"the 'old' way to REJECT"). A conventional product grid would flatten every maker into interchangeable inventory — the exact failure the product is built against ("No flattening," concept-lock guardrails). Buyers arriving at KOL need to feel they are meeting people who make things, on film, at the very first screen — not scanning a catalogue.

> "few large, human-forward pieces; story first; no urgency chyrons, no deal-grid density" — NARRATIVE, corrected direction (TikTok/Complex as anti-pattern)

---

## Proposed Solution

A magazine feed composed of `hero-video` cards (feed variant), sized and arranged asymmetrically (mixed-size media, not a uniform grid), one card per store, ordered by the video engine. Each visit reshuffles via the engine's seeded jitter. Tapping a card advances to `GROWN` (B2).

**UX Flow:**

1. Buyer lands on the feed. The video engine returns a cross-maker set (one clip per store) for the `FEED` state.
2. Cards render in a magazine layout — mixed sizes, film-forward, real human faces leading each frame — with poster stills shown immediately and video autoplaying muted (sound off until opt-in).
3. Buyer scrolls; the feed is a scroll of makers, not a paginated grid of products.
4. Buyer taps a video card → transitions to `GROWN` (B2), the tapped clip growing to center while the feed continues around it.
5. On refresh / next visit, a new seeded shuffle reorders the feed (fresh each visit, reproducible within a session).

---

## User Stories

- As a buyer, I want to open KOL and immediately see real makers on film in a magazine layout, so that shopping feels like discovering people, not scanning a catalogue.
- As a buyer, I want the feed to look fresh each visit, so that I keep discovering makers I haven't met.
- As a buyer, I want to never be shown a maker's post-purchase thank-you or a checkout clip in discovery, so that the feed only ever advertises makers, never out-of-context moments.

---

## Acceptance Criteria

**Happy Path**
- Given published stores with `feed`-eligible clips, when the buyer opens the feed, then the video engine `FEED` preset returns a cross-maker set (`page_eligibility @> {feed}` ∧ `purpose && {intro, craft-story, atmosphere}`, `distinct on (store_id)` newest, **limit 18** — confirmed with Design-Lead 2026-07-21, closing OQ-2: 12 reads thin for a publication, 24 thins the anti-repetition pool across few stores; 18 = six three-slot spreads) and the feed renders one `hero-video` (feed / `full-bleed` variant) card per store.
- Given a returning buyer, when they refresh or start a new session, then the feed reshuffles via the engine's seeded jitter (`hash(sessionId, video_id)`, no `Math.random`) — same order within a session, new order on a new session.

**Layout identity (hard gate — forbids a uniform grid; strengthened 2026-07-21, CPO Ruling 2)**
- Given the feed renders, when cards lay out, then the layout MUST be a mixed-size magazine composition (asymmetric, varied card sizes, media-forward) and MUST NOT be a uniform equal-cell product grid. An automated layout test MUST assert **both**: (a) rendered feed cards do not all share identical dimensions / a single repeating cell size, **and** (b) **no two vertically adjacent cards share a `getBoundingClientRect().top` within 24 px**. (b) is the assertion that actually catches a grid — (a) is passable by a grid with two cell sizes.
- Given the feed renders at `< 768`, when it is single-column, then card **aspect ratios vary** (the anti-grid identity is carried by height, not width) and assertion (a) still holds.
- **The anti-grid guarantee is carried by composition alone.** Video in cells does not satisfy it — TikTok Shop's row of five autoplaying clips is still unmistakably a grid. No implementation may cite "the cards have film in them" as a defence of an equal-cell layout.

**Film presence — the Focus Film model (amended 2026-07-21, CPO Ruling 2)**

The prior AC read "muted autoplaying film … renders across mixed-size cards" (plural), implying N simultaneous films. That is replaced. One shared Film Layer is what makes the film survive `FEED → GROWN` at all, and 18 concurrent decodes is the largest single threat to the 60 fps budget B1/B3/B4 all carry. What the buyer must feel is that **the feed is alive with people**, not that every tile is playing.

- Given the feed renders with eligible clips, when it is interactive, then the card nearest viewport centre is the **focus card** and the shared Film Layer positions over its rect and plays its clip with real human footage, muted.
- Given ≥ 2 cards intersect the viewport and their stores have eligible clips, when the feed is at rest at any scroll position, then **at least 2 cards are showing moving footage** — the focus card plus at least one neighbouring ambient loop (≤ 6 s, ≤ 480p, muted, no audio track, disposable elements — never the shared Film Layer). At N=1, or where neighbours have no eligible clip, this criterion is exempt. *A feed of one moving card among seventeen dead stills is a photo catalogue, which is the failure this criterion exists to prevent.*
- Given non-focus, non-ambient cards, when they render, then they show the clip's **poster still** cropped to the slot aspect using `media.clips[].focalPoint` — never a product photograph in place of the maker's film.
- Given the buyer scrolls, when the focus card changes, then the Film Layer FLIPs to the new rect with an in-frame cross-fade per the film-frame continuity contract, and **focus changes at most once per 400 ms** (debounced). A film that re-targets on every scroll tick is nausea, not life.
- Given the buyer taps a **non-focus** card, when the tap is handled, then the card is first promoted to focus (Film Layer FLIPs to it, ≤ 200 ms) and `grow` runs immediately after, reading to the buyer as one continuous motion.

**Structural exclusion (load-bearing test)**
- Given a store with both a `feed` clip and a `thankyou` clip, when the `FEED` selection runs for any buyer or seed, then the feed contains the `feed` clip and NEVER the `thankyou` (or `checkout`) clip. This is structural: `FEED` is a positive `page_eligibility @> {feed}` predicate and a `thankyou` clip is tagged `['thankyou']` only, so no code path can add it. A structural test asserting this MUST exist (video-engine-spec §2.1).
- Given the same store, when the feed renders, then exactly one card appears for that store (`distinct on (store_id)`), showing its newest `feed`-eligible clip.

**Empty**
- Given no published stores with `feed`-eligible clips exist yet, when the buyer opens the feed, then a warm "no makers yet" invitation renders (empty-as-invitation, never a blank void).

**Loading**
- Given the feed is fetching, when clips have not resolved, then poster stills render immediately with skeletons matched to the magazine card layout (no centered spinner, no layout shift when video resolves).

**Error**
- Given the feed request fails, when the engine or network errors, then the last cached feed is served with a quiet inline retry; the feed is never left blank.

**Success**
- Given clips resolve, when the feed is interactive, then the composition renders as a mixed-size magazine spread of real makers, the focus card plays muted film with a real human face, neighbouring cards read alive per the Focus Film criteria, and tapping any card transitions to `GROWN` (B2).

**Small-N composition (closes design-direction OQ-4)**
- Given the seed period returns N = 1, 2, 3, or 4 cards (`distinct on (store_id)`), when the feed renders, then the composition terminates on a complete spread and **never on an orphan half-spread** (N=1 → a single `WIDE`; N=2 → S1; N=3 → S1+S2; N=4 → S1+S3; ≥5 → S1→S2→S3 cycling, promoting a would-be orphan to `WIDE`). A test MUST cover N = 1–4. The masthead count is live and honest — at N=4 it reads "Four people who make things"; a fabricated count is a trust failure in a product whose premise is honesty.

---

## UX / UI Notes

Surface touched: **KOL's own product UI** → FIXED curated system (`theme.kind:"curated"` chrome only; the feed chrome does not adopt any seller's custom theme). The maker's film is the content; the chrome never competes with it ("the film always wins").

**Key Interactions:**

- Magazine layout: mixed-size cards, real faces leading, film-forward (Faire/Kotn warmth + Kotn-scale confident type over imagery, per NARRATIVE). No urgency chyrons, discount badges, or star-clutter (reject TikTok/Complex).
- Tap a video card → `GROWN` (B2). Tap an image card → grow "meet the person" (B2 image path).
- Autoplay muted; sound off until opt-in (the hard tone line); captions available.
- Reveal on `--ease-kol` (70ms stagger, media-leads-text), reduced-motion → instant fade.

**Edge Cases:**

- **empty** — no eligible makers → warm "no makers yet" invite, never a blank grid.
- **loading** — poster stills + skeletons matched to card layout; no spinner.
- **error** — cached feed + quiet retry; never blank.
- **success** — live mixed feed of makers on film.
- A store with only a `thankyou` clip contributes no feed card (its clip is not feed-eligible) — correct, not an error.

---

## Technical Requirements

Risk tier: **Full** (reads `buyer_signals` behind the RLS trust boundary via the engine; ≥300 LOC feed surface + engine integration). Sequencing: the P6 engine `FEED` preset and the `videos`/`video_profiles` tables (Irreversible-tier migrations, database-engineer) must exist before this frontend.

### Backend Changes
- No new tables, RPCs, or columns. This feature is a **reader** via the P6 engine only.
- Calls the video engine `selectVideos(ctx)` with `ctx.state = 'FEED'`, `storeScope = null` (cross-maker), `limit` 12–24 (video-engine-spec §2, §2.1). The engine composes `antiRepetition(rank(eligible(ctx)))`.
- The `Relationship` term is computed server-side only, service-role, inside the engine (`buyer_signals` is RLS-private; anon buyer → `Relationship = 0`, cold-start leans Business + Freshness). Never read `buyer_signals` from the browser (B0 trust boundary; video-engine-spec §5.4).

### Frontend Changes
- New feed route (KOL curated chrome). Renders the engine's `Selection` as a magazine layout of `hero-video` feed cards.
- All 4 states: empty (warm invite), loading (poster + skeletons), error (cached + retry), success (live feed).
- Seeded reshuffle handled by the engine per session; frontend requests a fresh selection per visit.

### Database Changes
- None. Reads only (via engine): `videos`, `video_profiles`, `stores`, `buyer_signals` (service-role, engine-internal). Bound strictly to Part B §B2 / video-engine-spec §0 — no new schema.

### External Services
- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Poster stills paint fast; feed cards autoplay muted without blocking scroll. Skeletons match final layout (no CLS). | Playwright + Lighthouse CLS/LCP check. |
| **Security** | `buyer_signals` never reaches the browser; engine reads it service-role server-side only. Feed query limited to published stores by RLS `video_profiles_public_read_published`. | Review + network trace assertion. |
| **Scalability** | `distinct on (store_id)` + GIN-served eligibility scales across many stores; one card per store keeps the pool bounded. | Seed N stores; verify one card each. |
| **Accessibility** | Every card's media has poster + captions; autoplay muted; reduced-motion → instant fade; keyboard-navigable cards. | axe-core + reduced-motion emulation. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P6 video engine (`selectVideos`, FEED preset) | Engine | Spec locked (video-engine-spec) | H — feed cannot select without it |
| `videos` / `video_profiles` / `buyer_signals` tables (migration group 03/12) | Data | Not Started (Irreversible tier) | H |
| P7 video-profile tagging (footage must be tagged to be eligible) | Feature | Not Started | H — untagged footage is invisible to the engine |
| P4 store renderer / `hero-video` block (feed variant) | Feature | Spec locked (block-catalog §1) | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B2 Grow interaction | frontend-engineer | Yes | Tapping a feed card enters `GROWN` |
| B11 Search & browse | frontend-engineer | Yes | Search results reuse feed cards, never a grid |

---

## Out of Scope

- The grow/unfold transition itself (B2 / B3 own it).
- Any per-maker custom theme in the feed chrome — feed is curated KOL chrome only.
- Search, categories, filters (B11 — separate subsystem).
- Relationship-ranking internals (P6+ owns the `Relationship` term; the feed only consumes engine output).
- Any buyer-time video generation — the engine selects real footage, never generates (D5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Feed accidentally renders as a uniform grid (identity failure) | M | H | Hard-gate AC + automated layout test forbidding equal-cell grids; NARRATIVE cited in review. |
| A thank-you/checkout clip leaks into the feed | L | H | Structural positive-predicate design + mandatory structural test (video-engine-spec §2.1). |
| Engine not ready → feed cannot populate | M | H | Feature-flag the feed; poster/empty states degrade gracefully; sequence engine first. |
| Cold-start (anon) feed feels random | M | M | Business + Freshness terms carry anon feed; reshuffle keeps it fresh (accepted trade-off, ADR-0003). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Feed → GROWN tap-through | N/A | ≥ 40% of feed sessions tap at least one maker (assumed target — low confidence) | 30 days post-launch |
| Uniform-grid regressions | N/A | 0 (layout test blocks merge) | ongoing |
| Thank-you/checkout clip in feed | N/A | 0 (structural test) | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| **Internal Testing** | Team (4 seed worlds) | All ACs pass; structural + layout tests green | 1–2 days |
| **Private Beta** | First cohort | No P0; feed reads as "makers, not grid" qualitatively | 1 week |
| **Full Launch** | All buyers | Rollout stages passed | — |

**Feature Flag**
- Behind a feature flag? Yes
- Flag name: `feed-discovery-enabled`
- Flag owner: CTO / frontend-engineer

**Rollback Plan**
- Rollback trigger: engine selection errors, grid regression, or clip-leak detected.
- Rollback decision maker: CTO.
- Rollback steps: disable flag → serve cached/empty state → fix → re-enable.
- Data impact: none (read-only feature; no migrations).

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Scoring weights (feed `w_relation` vs `w_freshness`) are launch defaults, TBD post-launch on real data (OQ-V3). | ai-engineer | post-launch |
| 2 | ~~Confirm the exact 12–24 feed limit and per-viewport card count with Design-Lead.~~ **CLOSED 2026-07-21 — limit 18**, composition per `KOL-wave3-screen-specs.md` §1.1. | CPO + Design-Lead | done |
| 3 | The Focus Film model is approved on reasoning, not on eyes-on evidence (Design-Lead could not run `/preview`). Before B1 merges, a design-critic pass MUST confirm the feed reads **alive with people** rather than as a photo catalogue at N=4 and N=18. If it does not, the ambient-loop count is the dial to turn — not the Focus Film model. | Design-Lead + QA-Lead | before B1 merge |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |
| 2026-07-21 | **AC amended (Ruling 2).** "Muted autoplaying film … across mixed-size cards" replaced by the Focus Film model (one shared Film Layer + ≥1 ambient neighbour + focalPoint-cropped poster stills). Layout-identity gate strengthened with the adjacent-`top` assertion and an explicit "video does not rescue a grid" clause. Small-N composition AC added (closes design-direction OQ-4). Engine limit fixed at 18 (closes OQ-2). New OQ-3: eyes-on design-critic confirmation before B1 merge. | CPO |

---

_Last updated: 2026-07-21 | Updated by: CPO (Wave-3 AC rulings)_
