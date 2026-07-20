# Feature Spec — Anti-Slop Auto-Critic (P9)

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Anti-Slop Auto-Critic |
| **Feature Slug** | anti-slop-auto-critic |
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
| **Reach** | 8 | Runs on every AI-drafted or edited seller shop — 4 seed worlds + first cohort *(assumed — low confidence on cohort size)*; the guarantee touches 100% of published `theme.kind:"custom"` worlds. |
| **Impact** | 3 | Massive. This is the load-bearing quality guarantee that lets D15 (full seller brand freedom) exist without slop. Without it, palette-capping returns. *(fact — per D15 reframe)* |
| **Confidence** | 80% | AA sub-gate is deterministic (certain); LLM coherence threshold calibration carries eval risk. *(est.)* |
| **Effort** | 3 person-weeks *(ask CTO)* | Deterministic AA gate + LLM critic + regen loop + `critic_accuracy` eval harness. |
| **RICE Score** | (8 × 3 × 0.80) ÷ 3 ≈ **6.4** | High — a load-bearing platform guarantee. |

**MoSCoW Classification:** Must Have.

**Why this priority?** D15 forbids palette-capping seller shops; the auto-critic is the guarantee that replaces the cap. No custom-theme shop can publish without it, so it gates the entire seller pipeline (S3→S6).

---

## Overview

The auto-critic is Stage 4 of the AI co-creation pipeline. It scores every AI-drafted or maker-edited seller shop and blocks below-bar work from publishing. It runs **two sub-gates in strict order**: (1) a deterministic WCAG-AA contrast **hard gate** computed from the palette (never an LLM), then (2) an LLM coherence/hierarchy/fit/slop score (Sonnet) that only runs after AA passes. It is the load-bearing anti-slop layer (D9 layer 2, reframed load-bearing by D15) that lets seller shops carry any colors and fonts while still guaranteeing company-grade output.

---

## Problem

D15 removed the palette cap for seller shops — makers get full brand freedom (any colors, fonts, vibe). That freedom is the whole point: *"No flattening. Every store must feel genuinely different"* (concept-lock guardrails). But freedom without a floor produces slop, and the founder's non-negotiable is equally hard: *"Never slop. Company-grade output is a hard floor, enforced structurally"* (concept-lock).

The tension resolves only if quality is held at the **output**, not the input. Per D15: *"palette-capping seller shops = the flattening the whole product exists to fight ... the load-bearing quality guarantee shifts to layer 2 (auto-critic) + layer 3 (maker approval)"* (concept-lock D15 note). The auto-critic is that layer 2. Its hardest job is to be strict about slop **without** over-rejecting unconventional-but-good work — because a critic that only likes safe designs is itself a flattening critic.

*(USER-INSIGHTS.md is empty — this is an internal team-seeded MVP per D12; the problem is grounded in the concept-lock guardrails and D15, not fabricated user quotes.)*

---

## Proposed Solution

A two-sub-gate pipeline stage, run after Design Derivation (S3) emits a store-config and after every co-edit (S4). Cited verbatim from `KOL-ai-pipeline-spec.md §6` — this spec does **not** redesign the critic, it specifies the product behavior and acceptance bar around the locked §6 contract.

**Sub-gate 1 — Deterministic WCAG-AA contrast (HARD GATE, computed, NOT LLM).** For every color-role pair that co-occurs in the rendered blocks, compute the WCAG 2.1 contrast ratio `(L_lighter + 0.05) / (L_darker + 0.05)` (relative luminance `L = 0.2126·R + 0.7152·G + 0.0722·B`, linearized from sRGB). Check the required pairs (§6.1 table). Any failing pair → AA FAIL.

**Sub-gate 2 — LLM coherence / hierarchy / fit (Sonnet, only after AA PASS).** Scores hierarchy, coherence, fit-to-brand, and slop-avoidance on the AA-passing config, producing a weighted `criticScore` (0–1).

**UX Flow (pipeline, not a buyer/seller screen):**

1. S3 (or S4 edit) hands a store-config version to the critic.
2. **AA gate runs first.** On FAIL: attempt auto-repair (nudge the offending role's lightness toward the threshold, preserving hue and chroma). If repair clears all pairs → PASS with a `repaired` flag surfaced to the maker in co-edit (S4). If repair cannot clear it without a perceptible hue shift → regen (feed the specific failing pairs + measured ratios back to S3).
3. **Only after AA PASS**, the LLM coherence score runs. `criticScore ≥ 0.75` (launch-tunable) → pass.
4. On AA-fail-after-repair OR `criticScore < 0.75` → regen (targeted feedback only), max **3 iterations**.
5. After 3 iterations still below bar → stop, set `store_versions.status = 'in_review'` with a `needs_human_eye` flag, escalate to the maker in co-edit. **Never auto-publish below bar. Never loop past 3.**
6. On pass → persist `store_versions.critic_score`; the version can proceed to the human approval gate (P10/S6).

---

## User Stories

- As a **seller**, I want my shop's colors and fonts kept exactly as designed unless they are genuinely inaccessible, so my brand is never flattened to a safe house style.
- As a **buyer**, I want every maker's world to be legible and coherent, so shopping never feels like slop.
- As the **platform**, I want a structural guarantee that no below-bar or inaccessible shop can publish, so "never slop" and "trust must be honest" are enforced by computation and rubric, not hope.

---

## Acceptance Criteria

**Happy Path — AA pass then coherence pass**
- Given an AI-drafted `theme.kind:"custom"` config whose color pairs all clear the §6.1 thresholds, when the critic runs, then the AA gate PASSes, the LLM coherence score runs, and if `criticScore ≥ 0.75` the version persists `store_versions.critic_score` and becomes eligible for the human gate.

**AA gate is dispositive and computed**
- Given any config, when the critic runs, then the AA gate is computed deterministically (`(L_lighter+0.05)/(L_darker+0.05)`) and never delegated to an LLM, and a config that fails AA can **never** reach the LLM coherence score and can **never** publish.
- Given a palette where `ink` on `bg` = 4.4:1, when the AA gate runs, then that pair FAILs (below the 4.5:1 SC 1.4.3 normal-text threshold) and the version does not advance until repaired or regenerated.

**Auto-repair preserves the brand color**
- Given an AA FAIL on `border` on `surface` at 1.4:1 (a structural border needing ≥3:1 per SC 1.4.11), when auto-repair runs, then it nudges only the lightness of the offending role toward the threshold while preserving hue and chroma, re-checks, and on success PASSes with a `repaired` flag surfaced to the maker in co-edit (S4).

**Regen loop is bounded and never auto-publishes below bar**
- Given a config that still fails AA-after-repair or scores `criticScore < 0.75`, when the critic regenerates, then only the specific deficits (failing AA pairs with measured ratios; lowest-scoring coherence dimension with concrete fixes) are fed back to S3, and the loop runs at most **3 iterations**.
- Given 3 regen iterations have completed and the config is still below bar, when the loop stops, then `store_versions.status` is set to `'in_review'` with a `needs_human_eye` flag and the maker is escalated to in co-edit — the config is **never** auto-published and the loop **never** runs a 4th time.

**D15 canary — no over-rejection of unconventional-but-good work**
- Given a deliberately unconventional-but-good custom design (e.g. maximal folk, high-contrast brutalist) that is accessible and on-brand, when the critic scores it, then it is **not** rejected for being unconventional (`criticScore ≥ 0.75`); over-rejecting this is a D15-freedom regression and fails the `critic_accuracy` eval's false-positive check.

**Error State — LLM unavailable**
- Given the coherence-scoring model returns 429, when the critic calls it, then it retries with exponential backoff (250ms·2^n, jitter, max 5); on 529 it queues-and-notifies; on other errors it surfaces a typed error with no silent failure and no advance to publish (per ai-pipeline §10.2).

**Edge Case — AA gate accuracy is exact**
- Given known color-pair fixtures with pre-computed ratios, when the AA gate runs, then its accuracy is asserted at **1.0** (deterministic — any deviation is a bug), independent of the LLM score.

---

## UX / UI Notes

**Surface touched:** **Seller shops** (`theme.kind:"custom"`, D15). The critic is a **pipeline stage with no direct buyer- or seller-facing screen of its own** — its results surface inside the co-edit editor (S4, owned by W4) and the approve/publish gate (S6/P10). Anti-slop for shops is **not** palette-capping; it is this deterministic WCAG-AA gate + the auto-critic + maker approval. The AA gate **replaces** the old curated-palette cap (D9 layer 1 → D15 reframe).

**4-state:** *N/A as a rendered UI — this stage renders no buyer/seller UI of its own (S4 co-edit owns the surface that displays the `repaired` flag, the critic notes, and the `needs_human_eye` escalation, and defines empty/loading/error/success there).* The critic's own operational states are defined instead:

- **AA-fail → repair/regen:** the offending role's lightness is nudged (hue/chroma preserved); a `repaired` flag is passed to S4 for maker visibility.
- **Below-bar → escalate:** after 3 regens, `status='in_review'` + `needs_human_eye`; the maker sees the critic's concrete notes in S4 ("we couldn't get this fully there on our own — here's what to adjust with us").
- **Pass → persist:** `store_versions.critic_score` written; version advances to the human gate.

**Key Interactions (pipeline):**
- AA gate always runs first and is dispositive — no coherence score exists for an AA-failing config.
- Targeted regen feedback only (specific deficits), never "try again" — prevents thrashing.

**Edge Cases:**
- A beautiful, on-brand palette with one inaccessible hairline: the deterministic gate catches it and repair fixes only the hairline (worked example, ai-pipeline §5.3).
- Opus derivation falls back to Sonnet on 529: the result still passes this same gate — no lowered bar (ai-pipeline §2).

---

## Technical Requirements

### Backend Changes
- Auto-critic stage in the AI pipeline (`apps/kol/src/lib/agents/`) implementing `KOL-ai-pipeline-spec.md §6` verbatim: sub-gate 1 (deterministic AA), sub-gate 2 (`claude-sonnet-4-6` coherence with weights Hierarchy 0.30 / Coherence 0.35 / Fit-to-brand 0.25 / Slop-avoidance 0.10, §6.2), regen loop (max 3, §6.3).
- **AA gate is deterministic — no LLM.** Compute WCAG 2.1 ratios for the required pairs (§6.1 table). Auto-repair = lightness nudge in HSL/LCH preserving hue and chroma.
- Threshold `criticScore ≥ 0.75` as a launch-tunable constant (not a hardcoded magic number), calibrated against the §8c labelled slop set.
- Per-call cost logging on every LLM call (`event:"llm_call"`, ai-pipeline §10.1), with the optional `iteration` field for regen cost attribution.
- Error handling per ai-pipeline §10.2 (429 backoff, 529 fallback/queue, typed errors, no silent failure).

### Frontend Changes
- None owned here. The `repaired` flag, critic notes, and `needs_human_eye` escalation render in the **co-edit editor (S4, W4-owned)** and the **approve/publish screen (S6, W4-owned)** — cross-referenced, not duplicated.

### Database Changes
- **Data need (Irreversible tier — database-engineer before backend-engineer):** `store_versions(critic_score numeric(4,3) CHECK 0–1)` — per Part B §B4. The critic writes this column; a passing score from a passing AA gate is required before a `kind:"custom"` config's `meta.status` may leave `draft` (store-config §2.2). No new tables/columns beyond this row are proposed.

### External Services
- Anthropic Claude API (`claude-sonnet-4-6` for coherence; on Opus derivation 529, Sonnet fallback still passes this gate). Key from `process.env.ANTHROPIC_API_KEY` — never hardcoded.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Accessibility** | AA gate enforces WCAG 2.1 SC 1.4.3 (text ≥4.5:1 normal, ≥3:1 large) and SC 1.4.11 (non-text/structural ≥3:1) on every rendered block's token usage. | `critic_accuracy` eval asserts AA-gate accuracy = 1.0 against known color-pair fixtures. |
| **Security** | No user input sets `critic_score` client-side; it is written only by the pipeline. RLS/service-role write path (Part B §B0). | DB policy review; attempt client write → rejected. |
| **Performance** | AA gate is O(pairs) arithmetic, sub-millisecond; the LLM coherence call runs a handful of times per shop, not per request (ai-pipeline §2). | Benchmark AA gate; monitor `cost per published shop` + `regen iterations per shop` (ai-pipeline §10.1). |
| **Quality (load-bearing)** | `critic_accuracy` eval: precision + recall on the ≥20-config labelled slop set (half known-slop, half known-good incl. unconventional-but-good). False positives on the unconventional-but-good subset = the D15 canary. | `runEval('critic_accuracy', …)` in CI; fails CI if meanScore < threshold or an adversarial example regresses. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P3 store-config schema + validator (theme discriminated union; `meta.criticScore`) | Data / Feature | In Progress (Batch 1) | H |
| S3 AI store draft (emits the config the critic scores) | Feature | In Progress (Batch 3) | H |
| `store_versions.critic_score` migration | Data | Not Started (Irreversible) | H |
| Shared eval harness (`apps/kol/src/lib/agents/evals/`, ai-pipeline §8d) | Feature | Agreed 2026-07-20 | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| P10 human approval gate | backend-engineer | Yes | Publish precondition (a) = AA gate PASS on current version. |
| S6 section-approve-publish | frontend-engineer | Yes | Surfaces `repaired` flag + `needs_human_eye`. |
| S4 co-edit editor | frontend-engineer | Yes | Each edit re-triggers this critic on the changed section. |

---

## Out of Scope

- The human approval gate rules and data contract — owned by **P10** (this spec only produces the AA-PASS signal it consumes).
- The co-edit / publish UI that displays critic results — owned by **S4 / S6** (W4).
- Video tagging, ranking, and the AI-ranker seam — owned by **P6 / P7** (Workstream C).
- `atmosphere.texture` (paper/grain/wash) scoring — roadmap, no persistence target (ai-pipeline §5.1 MVP note).
- Curated-theme (`kind:"curated"`) anti-slop — those are enum-bounded (D9 layer 1); this critic is the guarantee for `kind:"custom"` only.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Critic over-rejects unconventional-but-good work (attacks D15 freedom) | M | H | The `critic_accuracy` eval's false-positive rate on the unconventional-but-good subset is the D15 canary; a critic that only likes safe designs fails the eval and cannot ship. |
| Threshold (0.75) mis-calibrated → ships slop or over-rejects | M | H | Launch-tunable constant calibrated against the §8c labelled set; not hardcoded; monitored via eval correlation with human designers. |
| Regen loop cost blowup | L | M | Hard max 3 iterations; per-iteration cost logged; `regen iterations per shop` monitored. |
| LLM coherence scorer flakiness/hallucinated rationale | M | M | Rationale/fixes are advisory (not auto-applied); AA gate (deterministic) is the dispositive floor; typed errors, no silent failure. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| AA-gate accuracy (deterministic) | N/A | 1.0 (exact) | At every CI run |
| `critic_accuracy` false-positive rate on unconventional-but-good subset (D15 canary) | N/A | ≤ 0.05 | Pre-launch eval gate |
| Below-bar auto-publishes | N/A | 0 (structural) | Ongoing |
| AA pass rate at first emit (derivation designs with headroom) | N/A | ≥ 0.80 | 30 days post seed-world publish |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (D12 teammates) | AA-gate accuracy = 1.0; `critic_accuracy` eval passes; no below-bar auto-publish | 1–2 days |
| Private Beta | First seller cohort | Correlation with human designer ratings acceptable; no D15 canary regression | 1 week |
| Full Launch | All seller shops | All prior stages pass | — |

**Feature Flag**
- Behind a feature flag? No — it is a structural publish precondition, not an optional feature. (The threshold constant is tunable at runtime.)

**Rollback Plan**
- Rollback trigger: systematic over-rejection of good work (D15 canary breach) OR AA-gate deviation from 1.0.
- Rollback decision maker: CTO.
- Rollback steps: tune threshold / patch the deterministic gate; the gate cannot be disabled without reintroducing the palette cap (forbidden by D15) — so mitigation is fix-forward, not disable.
- Data impact: `critic_score` is additive; no data loss on a code rollback.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Exact launch value of the `criticScore` pass threshold (spec says ≥0.75, tunable) — final calibration against the §8c labelled set. | ai-engineer + CTO | Before seed-world publish |
| 2 | Does auto-repair's "perceptible hue shift" boundary (repair vs. regen) need a numeric ΔE tolerance, or is the lightness-only nudge sufficient? | ai-engineer | Build |
| 3 | Where the `needs_human_eye` escalation surfaces exactly in S4 co-edit (coordinate copy + placement with W4). | CPO + frontend-engineer | Build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
