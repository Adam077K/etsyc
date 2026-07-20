# Feature Spec — Human Approval Gate (P10)

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Human Approval Gate |
| **Feature Slug** | human-approval-gate |
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
| **Reach** | 8 | Every seller shop passes through this gate before publish — 4 seed worlds + first cohort *(assumed — low confidence on cohort size)*; 100% of publishes are gated. |
| **Impact** | 3 | Massive — it is the mechanism that makes the maker the final author (D8/D10) and the last of the three anti-slop layers (D9 layer 3). It also carries the honest-trust and AA publish preconditions. *(fact)* |
| **Confidence** | 85% | Rules are locked in ai-pipeline §7; the only variability is edge behavior around re-critic-on-edit. *(est.)* |
| **Effort** | 2 person-weeks *(ask CTO)* | Publish-precondition RPC/guard + `approved_sections` state transitions + re-trigger-on-edit wiring. |
| **RICE Score** | (8 × 3 × 0.85) ÷ 2 ≈ **10.2** | Very high — gates all publishing. |

**MoSCoW Classification:** Must Have.

**Why this priority?** Nothing can publish without it, and it is the decision that keeps the maker the author. It is also where the AA gate (P9), the approved-sections contract, and the honest-trust anchor (P11) all compose into a single publish precondition.

---

## Overview

The human approval gate is Stage 5 of the AI co-creation pipeline — the point at which the **maker** approves their shop section by section and publishes. This spec owns the **gate rules and the data contract** (`store_versions.status`, `store_versions.approved_sections`), the publish precondition, and the re-review-on-edit behavior. It is D9 layer 3 (the human backstop that keeps AI as an assistant, never the author, per D8/D10).

> **Overlap boundary (do not duplicate):** **P10 (this spec) owns the gate rules + data contract.** **S6 (`section-approve-publish.md`, W4) owns the seller-facing screen** (the Approve controls, the publish button, the blocked-with-reason UI, and its four visual states). This spec cross-references S6; it does not re-specify the screen.

---

## Problem

The founder's first non-negotiable is: *"Never 'AI does it for you.' Every AI touchpoint is with the maker; they stay the creative author."* (concept-lock guardrails). The seller journey ends with *"Approve section-by-section → publish. Maker is the author throughout; AI takes the slack."* (concept-lock seller journey, step 5).

A shop can be AI-drafted (S3) and critic-passed (P9) and still not be something the maker is willing to put their name on. Approval must therefore be **granular** (section by section, not all-or-nothing) and it must stay **honest**: an approval that no longer reflects what will publish is a lie. So editing a section after approving it must revoke that approval and re-run the critic. The gate is also the single place the platform's hard guarantees converge — accessibility (AA PASS), completeness (all rendered blocks approved), and honest trust (any Real-Maker badge anchor resolved) — before anything goes live.

*(USER-INSIGHTS.md is empty — grounded in concept-lock D8/D9/D10 and the seller journey, not fabricated user quotes.)*

---

## Proposed Solution

A section-by-section approval model backed by `store_versions.approved_sections` (a `blockId[]` in jsonb) and a hard publish precondition enforced at the data layer. Rules are cited from `KOL-ai-pipeline-spec.md §7`.

**UX Flow (gate mechanics; the screen is S6):**

1. After P9 passes a version, the version sits at `status: 'in_review'` with `approved_sections: []`.
2. The maker approves a rendered block (in S6). Approving appends that block's `id` to `store_versions.approved_sections`.
3. A version with some-but-not-all rendered blocks approved stays `in_review` — **not publishable**.
4. When the maker publishes, the gate checks the hard precondition (below). If met, `status → 'published'` and `stores.published` flips true. If not, publish is blocked with the exact failing reason (surfaced by S6).
5. If the maker later **edits** any approved block (copy, tokens, media, order), that block's `id` is **removed** from `approved_sections` and the auto-critic (P9/§6) is **re-triggered** on the changed section (and on coherence, since a token change is global). The maker must re-approve.

**Publish precondition (hard — all three must hold, ai-pipeline §7):**
- **(a)** the deterministic AA gate (P9 §6.1) PASSes on the *current* version, AND
- **(b)** every *rendered* block's `id` is present in `approved_sections`, AND
- **(c)** any Real-Maker trust badge's `voiceAnchorClipId` is resolved (P11 / store-config §2.1 — no false claim).

Media-only clips not bound to a block (e.g. a `thankyou` clip) do **not** require approval; they surface via the video engine's `pageEligibility` (D5).

---

## User Stories

- As a **seller**, I want to approve my shop one section at a time, so I stay the author and only publish what I actually endorse.
- As a **seller**, I want editing a section after approving it to reset that approval, so an approved section always reflects exactly what will go live.
- As the **platform**, I want publish blocked unless accessibility passes, every rendered section is approved, and every trust claim is anchored, so we never publish slop or a claim we can't back.

---

## Acceptance Criteria

**Happy Path — full approval then publish**
- Given a version at `status:'in_review'` where the maker has approved every rendered block, and the AA gate PASSes, and no unresolved Real-Maker anchor exists, when the maker publishes, then `status → 'published'`, `stores.published` becomes true, and the world goes live.

**Section-by-section approval appends to `approved_sections`**
- Given a rendered block with `id = "b_story"`, when the maker approves it, then `"b_story"` is appended to `store_versions.approved_sections`.

**Partial approval is not publishable**
- Given a version where some rendered blocks are approved and at least one is not, when the maker attempts to publish, then publish is blocked, the version remains `in_review`, and precondition (b) is reported as the failing reason.

**Publish precondition (a) — AA gate**
- Given a version where the current AA gate result is FAIL, when the maker attempts to publish, then publish is blocked with the AA failure as the reason, regardless of how many sections are approved.

**Publish precondition (c) — trust anchor**
- Given a shop carrying a Real-Maker badge whose `voiceAnchorClipId` is unresolved, when the maker attempts to publish, then publish is blocked (no false verified claim may go live), and the failing reason references the unresolved anchor (P11).

**Re-review on edit revokes approval and re-triggers the critic**
- Given an approved block `"b_hero"` in `approved_sections`, when the maker edits it (copy, token, media, or order), then `"b_hero"` is **removed** from `approved_sections`, the auto-critic (P9/§6) re-runs on the changed section and on coherence, and the block must be re-approved before it counts toward precondition (b).

**Edge Case — media-only clip needs no approval**
- Given a `thankyou` clip present in `media.clips[]` but bound to no block, when the publish precondition is evaluated, then that clip is not required in `approved_sections` (it surfaces via `pageEligibility`, D5) and does not block publish.

**Error State — concurrent edit during publish**
- Given a maker edits a section while a publish is in flight, when the publish precondition is re-evaluated at commit, then it evaluates against the current version state (the edit having revoked the affected approval), so a stale approval can never publish.

---

## UX / UI Notes

**Surface touched:** **Seller shops** (`theme.kind:"custom"`, D15) — the gate governs publishing of custom-theme worlds (and hand-built curated worlds alike). Anti-slop for shops is the AA gate + critic (P9) + this approval gate, never a palette cap.

**4-state:** *The rendered UI (empty / loading / error / success) is owned by S6 (`section-approve-publish.md`, W4) — this spec is the gate rules + data contract and renders no screen of its own.* The gate's **status states** are defined here and consumed by S6:

- **None approved:** `approved_sections: []`, `status: 'in_review'` → not publishable (S6 renders the "nothing approved yet" empty state).
- **Partial:** some rendered blocks approved → `status: 'in_review'`, not publishable (S6 shows which sections still need approval).
- **All approved + preconditions met:** publishable → publish flips `status: 'published'` / `stores.published` (S6 success state).
- **Publish blocked:** any precondition fails → S6 shows the exact failing reason (which precondition, which section/anchor).

**Key Interactions:**
- Approving a block is the only way to add it to `approved_sections`; editing a block is the only way to remove it (and it always re-triggers the critic).

**Edge Cases:**
- A token change is global, so re-critic on any edit re-scores coherence across the world, not just the edited block (ai-pipeline §7, Part B §B4).
- Adding a new block to a published draft leaves it unapproved → the version drops back to non-publishable until the new block is approved.

---

## Technical Requirements

### Backend Changes
- Publish transition enforced at the data layer (DB-enforced status transition, Part B §B0 — never app-side only). The transition to `'published'` must verify preconditions (a) AA PASS on the current version, (b) every rendered block `id ∈ approved_sections`, (c) any Real-Maker badge `voiceAnchorClipId` resolved.
- Approve action appends a `blockId` to `store_versions.approved_sections`; edit action removes the `blockId` and enqueues the P9/§6 re-critic on the changed section + coherence.
- Behavior cited from `KOL-ai-pipeline-spec.md §7`; do not redesign — implement the locked contract.

### Frontend Changes
- None owned here. The Approve controls, publish button, blocked-with-reason messaging, and all four visual states are **S6** (`section-approve-publish.md`, W4) — cross-referenced, not duplicated.

### Database Changes
- **Data need (Irreversible tier — database-engineer before backend-engineer):** `store_versions(status store_version_status, approved_sections jsonb = blockId[])` — per Part B §B4. `approved_sections` is a `blockId[]`. No new tables/columns proposed beyond this locked row.
- Editing a block removes it from `approved_sections` and re-triggers §6 (token change is global → re-scores coherence) — Part B §B4.

### External Services
- None directly. The re-critic it triggers uses the Claude API via P9 (out of scope here).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Security** | The `'published'` transition and `approved_sections` writes are DB-enforced against the caller's own store (RLS + status-transition guard, Part B §B0). No client may flip `status` or set `approved_sections` for a store it does not own. | RLS/guard review; attempt cross-store publish → rejected. |
| **Correctness** | An approved section always reflects exactly what will publish (edit ⇒ revoke ⇒ re-critic). No stale approval can reach `'published'`. | E2E: approve → edit → attempt publish → blocked until re-approve. |
| **Accessibility** | Publish is impossible unless the deterministic AA gate PASSes on the current version (precondition a). | E2E with an AA-failing version → publish blocked. |
| **Honesty** | Publish is impossible with an unresolved Real-Maker anchor (precondition c). | E2E with unresolved `voiceAnchorClipId` → publish blocked. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P9 auto-critic (AA-PASS signal for precondition a; re-critic on edit) | Feature | In Progress (Batch 4) | H |
| P3 store-config schema (`meta.status`, `meta.approvedSections`) | Data | In Progress (Batch 1) | H |
| P11 trust badges (resolved `voiceAnchorClipId` for precondition c) | Feature | In Progress (Batch 4) | M |
| `store_versions(status, approved_sections)` migration | Data | Not Started (Irreversible) | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| S6 section-approve-publish (the screen) | frontend-engineer | Yes | Consumes these gate rules + status states; must not re-implement them. |
| Buyer store renderer (P4) | frontend-engineer | Yes | Only `published` versions render live. |

---

## Out of Scope

- The seller-facing approve/publish **screen** and its four visual states — owned by **S6** (W4).
- The critic scoring itself — owned by **P9** (this spec only consumes its AA-PASS signal and triggers its re-run).
- Trust-badge resolution logic — owned by **P11** (this spec only consumes the resolved-anchor precondition).
- The video engine's `pageEligibility` selection of media-only clips — owned by **P6** (D5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stale approval publishes something the maker later edited | M | H | Edit always removes the block from `approved_sections`; precondition re-evaluated at commit against current state. |
| Publish precondition enforced app-side only (bypassable) | L | H | DB-enforced status transition + RLS (Part B §B0); never app-side only. |
| Re-critic-on-edit thrash annoys makers | M | M | Re-critic is targeted (changed section + coherence); most edits pass immediately; UX copy owned by S6. |
| Ambiguity over what counts as a "rendered" block for precondition (b) | M | M | Open question below — media-only clips excluded (D5); confirm the exact rendered-block set with S6/P4. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Publishes that bypass a precondition (a/b/c) | N/A | 0 (structural) | Ongoing |
| Stale-approval publishes | N/A | 0 | Ongoing |
| Makers reaching publish without escalation | N/A | ≥ 80% of seed-world attempts | Internal testing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (D12) | All three preconditions enforced; edit revokes approval + re-critics; no bypass | 1–2 days |
| Private Beta | First seller cohort | No stale-approval publishes; blocked-reason clarity validated with real makers | 1 week |
| Full Launch | All sellers | All prior stages pass | — |

**Feature Flag**
- Behind a feature flag? No — it is the publish mechanism itself, a structural precondition (mirrors P9).

**Rollback Plan**
- Rollback trigger: a publish path that bypasses a precondition is discovered.
- Rollback decision maker: CTO (Irreversible tier — migration touches `store_versions`).
- Rollback steps: block the publish transition (fail-closed — publishing off is safe; publishing slop is not); patch the guard; re-enable.
- Data impact: `approved_sections` and `status` are additive/reversible column values; no data loss on code rollback.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Exact definition of the "rendered block" set for precondition (b) — confirm which block types render (and thus require approval) vs. media-only clips (excluded, D5). Coordinate with S6/P4. | CPO + frontend-engineer | Build |
| 2 | Does reordering blocks (no content change) count as an "edit" that revokes approval, or only content/token/media edits? ai-pipeline §7 lists "order" as an edit — confirm intended UX with S6. | CPO | Build |
| 3 | On re-critic-after-edit, if the new critic result is a `needs_human_eye` escalation, does the whole version drop to `in_review` or only the edited section? Confirm with P9. | CTO | Build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
