# Relationship-Based Ranking (P6+)

<!-- Phase-5 spec worker (W3). EXTENDS the P6 video-engine `Relationship` scoring term. W1 (store-engine-spine.md §P6) owns the engine pipeline; this spec scopes to per-buyer signal AGGREGATION + weights + decay only — reference the engine, do NOT redesign it. LOAD-BEARING: ACs FORBID any cross-buyer aggregate — per-buyer only; anon buyer → Relationship = 0. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Relationship-Based Ranking (the `Relationship` term) |
| **Feature Slug** | relationship-based-ranking |
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
| **Reach** | 7 | Every signed-in buyer's feed ranking is shaped by it (weight 0.30 in FEED) (assumed — low confidence; basis "4 seed worlds + first cohort"). |
| **Impact** | 3 | Massive — this is what makes the feed *yours*, the mechanism of "relationship not transaction" at the ranking layer (D16-7) (`est.`). |
| **Confidence** | 75% | Formula, weights, decay, guards fully specified in the engine spec §5; open weight-tuning (OQ-V3) lowers confidence slightly (`fact` on shape, `est.` on tuning). |
| **Effort** | 2 person-weeks | Per-buyer aggregation query + decay + squash + weights, wired into the P6 `RulesRanker` term (`est.`; `(ask CTO)` — implemented by the engine worker). |
| **RICE Score** | (7 × 3 × 0.75) ÷ 2 = **7.9** | |

**MoSCoW Classification:** Must Have — D16-7 folds relationship ranking into MVP as the seventh missing feature; it is the ranking-layer realization of KOL's entire "shopping as a relationship" thesis.

**Why this priority?** D16-7 requires signals to *"feed ranking"* as **relationship, not popularity**. Without this term the feed is business + freshness only — it can't reflect who a buyer actually cares about. It consumes the signals B13/B12/B14/B7 write.

---

## Overview

The `Relationship` scoring term of the P6 video engine (engine spec §5): per-buyer aggregation of `buyer_signals` toward a clip's maker/store/linked-product, mapped by signal type, decayed by recency, capped and squashed to `[0,1]`, and weighted into the score (0.30 in FEED). It is **per-buyer affinity, never global popularity** — the structural guard against the flattening KOL exists to fight (D16-7, D5). It is computed **server-side via the service role** because `buyer_signals` is RLS-private. This spec scopes the aggregation/weights/decay; the P6 engine (W1) owns the pipeline it plugs into.

---

## Problem

D16-7 folds in *"Relationship-Based Ranking — follow/save + purchase/question/project signals feed ranking."* The founder guardrail: *"No flattening. Every store must feel genuinely different"* (concept-lock), and D5 explicitly rejects a *"general-popularity recommender."* The engine spec §5.1 names the failure mode precisely: *"Popularity (rejected): count(\*) of signals toward a subject across all buyers → globally-loved makers dominate every feed → flattening (the thing KOL exists to fight)."* The pain, in the buyer's terms: *"show me more of the makers I've actually connected with — not whatever's popular with everyone else"* (grounded in concept-lock no-flattening guardrail + D16-7; USER-INSIGHTS.md empty). The chosen answer: affinity filtered to `ctx.buyerId` — *"A maker you follow ranks up for you; that same maker gets no ranking boost for a buyer who's never interacted."*

---

## Proposed Solution

Implement the `Relationship(clip, ctx)` term exactly as the engine spec §5 defines it: a per-buyer `buyer_signals` aggregation toward the clip's `owner_id`/`store_id`/linked products, mapped by signal-type weight, recency-decayed, visit-capped, and squashed to `[0,1]`. Wire it as the `w_relation` term in the `RulesRanker` (§3.2). Anonymous buyers get `Relationship = 0` (cold-start).

**Computation flow (server-side, service role):**

1. For a candidate clip and a signed-in buyer, query `buyer_signals` **`where buyer_id = ctx.buyerId`** toward this clip's `owner_id` (maker), `store_id`, or linked product ids — grouped by `signal_type`. **No cross-buyer rows are ever read.**
2. Map each signal type to its relationship weight (`commission` 5.0 · `purchase` 4.0 · `follow` 3.0 · `question` 2.0 · `save` 1.5 · `review` 1.5 · `visit` 1.0), multiplied by the row's `buyer_signals.weight`.
3. Apply recency decay `exp(-age_days / τ)`, τ ≈ 30d; cap `visit` contribution (~3 effective visits); sum to `rawAffinity`.
4. Squash `rawAffinity → [0,1]` (e.g. `x/(x+k)`); this is `Relationship(clip, ctx)`, weighted 0.30 in FEED (Business .30 / Situation .15 / Freshness .25 / Relationship .30).
5. Result: a per-buyer affinity that biases toward makers **this** buyer cares about, without ever monopolizing the feed or collapsing into popularity.

---

## User Stories

- As a buyer, I want makers I've followed/bought from/commissioned to rank higher in *my* feed so that it reflects my relationships.
- As a buyer, I want fresh discovery preserved so that my feed never ossifies around old favorites.
- As an anonymous visitor, I want a sensible feed with no personalization so that cold-start still works (relationship = 0, lean on business + freshness).

---

## Acceptance Criteria

> This is a **backend scoring term**, not a UI surface — ACs are behavioral over the engine, not visual. The "states" this term must handle (per §A3): anon→Relationship=0; no-signals→business/freshness lean; signals-present→per-buyer affinity; decay-over-time→old affinity fades.

**Happy Path**
- Given a signed-in buyer with a `follow` signal toward maker M, when the engine scores a clip owned by M for that buyer, then `Relationship > 0` and the clip ranks up **for that buyer** (per-buyer affinity, engine §5.2).
- Given the same clip scored for a **different** buyer with no signals toward M, when the engine scores it, then that clip gets **no** relationship boost (`Relationship = 0`) — affinity is not shared.
- Given a buyer with multiple signal types toward M, when aggregated, then each maps by its weight (`commission` 5.0 … `visit` 1.0) × `buyer_signals.weight`, decayed and squashed to `[0,1]`.

**Cold-start**
- Given an **anonymous** buyer (`buyerId = null`), when any clip is scored, then `Relationship = 0` and the feed leans on Business + Freshness (engine §5.3 guard 1).

**Recency / saturation edge cases**
- Given a buyer whose only signal toward M is a year old, when scored, then recency decay (`exp(-age_days/τ)`, τ≈30d) makes its contribution near-zero — old affinity fades, discovery preserved.
- Given a buyer with many `visit` signals toward M, when aggregated, then `visit` is capped (~3 effective visits) and the whole `rawAffinity` is squashed — relationship **biases but never monopolizes** the feed (engine §5.3 guard 3).

**Edge Case (load-bearing — FORBID cross-buyer aggregate)**
- Given **any** scoring call, when `Relationship` is computed, then the query is **always** `where buyer_id = ctx.buyerId` — **no global `count(*)` across buyers, no cross-buyer aggregate, no popularity term is ever read into the score** (engine §5.1; this is the load-bearing structural guard).
- Given `buyer_signals` is RLS-private, when the term is computed, then it runs **server-side with the service role only** — never in the browser, and a future `LlmReranker` receives only the already-aggregated scalar, never raw signal rows (engine §5.4 trust boundary).
- Given narration states (NARRATE_SHRINK / PRODUCT_PAGE), when scored, then `w_relation = 0` (product fit must win) — relationship is deliberately excluded there (engine §3.2 weights).

---

## UX / UI Notes

**Deleted — not applicable (with reason):** P6+ is a server-side scoring term inside the video engine; it renders no UI of its own. Its effect is *observed* through the discovery feed (B1) and the persistent player (B3/B4), whose 4-states those specs own. The all-4-states convention therefore does not apply to a headless ranking term; the behavioral "states" (anon / no-signal / signal-present / decayed) are covered in Acceptance Criteria above per the §A3 note ("4-state: n/a — note reason").

---

## Technical Requirements

> **Risk tier: Full** (reads RLS-private `buyer_signals` via service role — the ranking trust boundary; touches the engine's scoring). Data-need = read-only over a locked table (the engine adds **no** columns — engine spec §0). Implemented by the P6 engine worker; this spec is the contract.

### Backend Changes

- Implement `Relationship(clip, ctx)` as specified in engine spec §5.3, wired as the `w_relation` term of the `RulesRanker` (§3.2) — **do not redesign the pipeline** (W1 owns `selectVideos` = `antiRepetition(rank(eligible(ctx)))`).
- Per-buyer aggregation query (engine §5.1): `select signal_type, count(*), sum(weight), max(created_at) from buyer_signals where buyer_id = $buyerId and ((subject_type='maker' and subject_id=$ownerId) or (subject_type='store' and subject_id=$storeId) or (subject_type='product' and subject_id = any($linkedProductIds))) group by signal_type`.
- Signal→weight map, recency decay (τ≈30d), `visit` cap, saturating squash — exactly engine §5.2/§5.3.
- **Service-role only** read of `buyer_signals` (RLS-private); computed inside `selectVideos` server-side, never browser-side (engine §5.4). Anonymous → `Relationship = 0` (no query).

### Frontend Changes

- None — headless scoring term (see UX/UI Notes).

### Database Changes

**Data need (read-only; NO new objects — the engine adds no columns, engine §0):**

| Object | Use | Status |
|---|---|---|
| `buyer_signals(buyer_id, subject_type signal_subject, subject_id, signal_type signal_type, weight CHECK 0–100, created_at)` | per-buyer affinity aggregation (service-role read) | Locked (engine §0.3 / B2 §P6+) |

- The signals themselves are **written** by B13 (follow/save), B12 (question), B14 (commission), B7 (purchase), B6+ (review), P2 (visit) — all service-role inserts (B0). This spec only **reads/aggregates** them. Do **not** invent an aggregate/rollup table or a popularity counter.

### External Services

- None (a future `LlmReranker` upgrade is out of scope; engine §4 owns that seam).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Relationship aggregation adds < 50ms to a scoring pass at seed-cohort signal volume; composite-indexed `(buyer_id, subject_type, subject_id, signal_type)`. | Scoring benchmark; verify index usage. |
| **Security** | `buyer_signals` read via service role only; never browser-side; no raw signal rows leave the server; **no cross-buyer read path exists**. | Service-role-only test; cross-buyer-aggregate absence assertion. |
| **Scalability** | Correct + bounded for a buyer with 10K signals (cap + decay keep it stable). | Seed 10K signals; verify per-buyer scope + latency. |
| **Accessibility** | n/a — headless term, no UI. | — |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P6 Video engine (`RulesRanker`, `selectVideos`) | Engine (W1 spine) | Not Started | H — this term plugs into it |
| P2 `buyer_signals` write path + visit signal | Feature (W1 spine) | Not Started | H — no signals to aggregate |
| B13 follow/save · B12 question · B14 commission · B7 purchase · B6+ review (signal writers) | Features | Not Started | M — term works with whatever signals exist |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B1 Discovery feed ranking | W2 | Yes | 0.30 of FEED score is this term |
| B3/B4 Persistent player ranking | W2 | No | lower relationship weight (0.10) |

---

## Out of Scope

- The engine pipeline, eligibility, anti-repetition, and the `Ranker` seam — owned by P6 (W1); this spec is only the `Relationship` term.
- **Any global popularity / trending / cross-buyer aggregate** — explicitly forbidden (D16-7, engine §5.1); the whole point is per-buyer.
- Writing `buyer_signals` — owned by the signal-writing features (B13/B12/B14/B7/B6+/P2).
- ML/embedding relationship modeling — the `LlmReranker` upgrade slot (engine §4) is out of scope; it would consume the aggregated scalar, not replace this term.
- Weight tuning to real data — OQ-V3 (engine), post-launch.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Term drifts into popularity (global counts) | L | H | Load-bearing AC forbids any cross-buyer aggregate; query pinned to `where buyer_id = ctx.buyerId`; absence-of-global-count test. |
| `buyer_signals` read client-side (PII/trust breach) | L | H | Service-role-only read inside `selectVideos` (engine §5.4). |
| Relationship monopolizes the feed (kills discovery) | M | M | `visit` cap + recency decay (τ≈30d) + saturating squash (engine §5.3 guards). |
| Launch weights wrong (feed too affinity-heavy / too flat) | M | M | Weights are config not architecture; OQ-V3 tunes post-launch against real data. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Signed-in buyers whose feed reflects their follows/purchases (vs anon feed) | — | measurable per-buyer divergence | 30 days post-launch |
| Cross-buyer aggregate reads | — | 0 (structural) | ongoing |
| Feed diversity (new-maker exposure retained) | — | not degraded vs pre-relationship baseline | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed buyers with seeded signals | Per-buyer affinity + anon=0 + no-global-count tests pass | 2–3 days |
| Gradual Rollout | 10% → 100% (weight ramp) | Feed diversity retained; latency target met | 1–2 weeks |
| Full Launch | All | No P0; weights within tuning band | — |

**Feature Flag** — Behind a flag? **Yes** — the `w_relation` weight is config (`SCORING_WEIGHTS`); it can be ramped from 0 → 0.30 to validate without a code change (engine §3.2). Flag owner: ai-engineer / CTO.

**Rollback Plan** — Trigger: feed collapse toward a few makers, latency regression, or any cross-buyer read. Decision maker: CTO / ai-engineer. Steps: set `w_relation = 0` in `SCORING_WEIGHTS` (feed falls back to business + freshness); read-only over `buyer_signals`, no data migration, no data loss.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | **Scoring weights (engine OQ-V3):** launch defaults (FEED Relationship 0.30) are un-tuned; calibrate `w_relation` vs `w_freshness` against real interaction data. | ai-engineer (post-launch) | post-launch |
| 2 | Exact `squash` constant `k` and the `visit` effective-cap value — engine §5.3 gives forms, not final constants. | ai-engineer | pre-build |
| 3 | Confirm `subject_type='product'` affinity flows to relationship for clips whose `product_links` include that product (per §5.1 query). | CTO + ai-engineer | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
