# Feature Spec — Section-by-Section Approve → Publish (S6)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Section-by-Section Approve → Publish |
| **Feature Slug** | section-approve-publish |
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
| **Reach** | 6 | 4 seed worlds + first cohort *(assumed, D12)*. Every store must pass through approve → publish to go live. |
| **Impact** | 3 | Massive. This is the human gate (D9 layer 3) and the moment a store goes live — the last honesty + anti-slop checkpoint. |
| **Confidence** | 75% | *(est.)* Preconditions are locked hard (ai-pipeline §7). |
| **Effort** | 2.5 person-weeks | *(est., ask CTO)* Per-block approve UX + the hard four-part publish precondition enforcement + `stores.published` flip. |
| **RICE Score** | (6 × 3 × 0.75) ÷ 2.5 = **5.4** | Must-Have. |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** Nothing goes live without it, and it is the enforcement point for the anti-slop guarantee and the honest-trust rule. It is **Irreversible tier** — publishing flips a store live.

---

## Overview

The maker's final-author step (D8/D10): approve the store **section by section**, then publish. Approving a block appends its `blockId` to `store_versions.approved_sections`; partial approval sits in `in_review` (not publishable). Publish is gated by a **hard four-part precondition** and flips `stores.published`. This spec owns the **seller-facing screen**; the gate rules and data contract are P10 — cross-referenced, not duplicated.

Contract is LOCKED — this spec cites, it does not redesign: [`KOL-ai-pipeline-spec.md`](../../03-system-design/KOL-ai-pipeline-spec.md) §7 (human gate + publish precondition), §9 (footage/publish rule); [`store-config.schema.md`](../../03-system-design/store-config.schema.md) §2.1 (trust) / §2.7 (meta). P10 (`human-approval-gate`, W5) owns the gate rules/data; S6 owns the seller UX.

---

## Problem

The whole product rests on **"never slop … company-grade output is a hard floor, enforced structurally"** and **"trust must be honest — no claim we can't back"** (concept-lock guardrails). D9's layer 3 is the **human approval gate**, and the seller journey step 5 locks **"approve section-by-section → publish. Maker is the author throughout."** Two failure modes must be structurally impossible: (1) a store publishing sections the maker never approved (or approved before editing); (2) a store publishing a false trust claim (a Real-Maker badge whose voice anchor is unresolved) or an inaccessible design (AA fail). If publish is a soft check, both leak.

*(No user quotes — grounded in concept-lock guardrails + D9 layer 3.)*

---

## Proposed Solution

A per-block approve UX plus a hard, enumerated publish gate.

**UX Flow:**

1. In the review/editor, each rendered block shows an **Approve** control. Approving appends the `blockId` to `approved_sections`.
2. A version with some blocks approved and others not is `in_review` — **not publishable**.
3. When the maker attempts **Publish**, the system enforces a **hard four-part precondition** (all four must hold — ai-pipeline §7):
   - **(a)** the deterministic **WCAG-AA gate PASSes** on the current version (§6.1), AND
   - **(b)** **every rendered block's `id` is present in `approved_sections`**, AND
   - **(c)** any **Real-Maker trust badge's `voiceAnchorClipId` is resolved** (store-config.schema §2.1 — no false claim), AND
   - **(d)** the required `product_specs` completeness holds for **every product in the store** (D16-4; enforced via P14's product-completeness check — `exactly-what-to-expect.md` — folded into this publish gate). *Composition point (where P14's check is invoked inside the gate) is being finalized with P14/S8.*
4. Only when all four hold does publish flip `stores.published` to true. Media-only clips not bound to a block (e.g. `thankyou`) do **not** require approval — they surface via the engine's `pageEligibility` (Part B S6).
5. Additional hard rule: the store **cannot publish with an untagged clip bound to `hero-video`** (the persistent film must be real and eligible; ai-pipeline §9).
6. Result: a published, fully-approved, accessible, honest-trust store — or a blocked publish that names the exact unmet precondition.

---

## User Stories

- As a **maker**, I want to approve each section individually so that I control exactly what goes live.
- As a **maker**, I want a blocked publish to tell me precisely what's wrong (which section, AA fail, or unresolved verification) so that I can fix it.
- As **KOL**, I want publish to be structurally impossible unless every rendered block is approved, AA passes, and every trust claim resolves so that we never ship slop or a false claim.

---

## Acceptance Criteria

**Happy Path**
- Given a maker approves a block, when they click Approve, then its `blockId` is appended to `store_versions.approved_sections`.
- Given all four publish preconditions hold, when the maker clicks Publish, then `stores.published` flips to true and the store is live.

**Publish precondition — all four enumerated (hard gate)**
- Given the AA gate does NOT pass on the current version, when the maker attempts Publish, then publish is blocked with the reason "accessibility check failed" and the failing pair(s) surfaced (precondition a).
- Given any rendered block's `id` is missing from `approved_sections`, when the maker attempts Publish, then publish is blocked naming the un-approved section(s) (precondition b).
- Given a Real-Maker badge whose `voiceAnchorClipId` is unresolved, when the maker attempts Publish, then publish is blocked with "verification not resolved" — the store never publishes a false verified claim (precondition c; store-config.schema §2.1).
- Given all four hold simultaneously, when the maker clicks Publish, then and only then does `stores.published` flip (all four are required together).

**Partial-approve / not-publishable**
- Given some blocks approved and others not, when the version is inspected, then `status` is `in_review` and Publish is disabled.

**Untagged hero clip guard**
- Given an untagged clip is bound to `hero-video`, when the maker attempts Publish, then publish is blocked (the persistent film must be tagged/eligible; ai-pipeline §9), regardless of approvals.

**Media-only clip exemption**
- Given a `thankyou` clip bound to no block, when Publish runs, then it does NOT require approval (it surfaces via engine `pageEligibility`; Part B S6).

**Empty State**
- Given nothing is approved yet, when the approve screen renders, then it shows the un-approved blocks with Approve controls (empty ≠ blank — a clear "0 of N approved" state), Publish disabled.

**Loading State**
- Given a publish is in flight, when it runs, then a publishing indicator shows (never a bare spinner); the maker cannot double-submit.

**Error State**
- Given publish fails a precondition, when it is attempted, then the exact unmet precondition is named inline and recoverable (which section / AA pair / verification) — never a generic "publish failed."

**Edge Case**
- Given a maker edits a previously-approved block (via S4), when they return to S6, then that block is no longer in `approved_sections` (S4 removed it) and must be re-approved before publish (the honesty loop).

---

## UX / UI Notes

Surface: the **shop being approved** = custom theme (D15); the **approve/publish chrome** = KOL curated tool chrome. S6 is the seller screen; P10 owns the underlying gate rules/data — this screen renders and enforces them, it does not redefine them.

**Key Interactions:**
- Per-block Approve control; a running "X of N sections approved" summary.
- A Publish button that is disabled until all four preconditions hold, with an always-visible checklist of the four preconditions and their current pass/fail.
- Blocked-publish messaging names the exact unmet precondition and links to the offending section / AA pair / verification.

**Four states (also in ACs):**
- **Empty** — nothing approved; "0 of N approved"; Publish disabled (empty ≠ blank).
- **Loading** — publishing in flight; no double-submit.
- **Error** — publish blocked with the exact unmet precondition named inline and recoverable.
- **Success** — all four preconditions pass → `stores.published` true → live.

**Edge Cases:**
- Re-approval required after an S4 edit — make the "this section was edited, re-approve it" state obvious.
- Reduced-motion honored.

---

## Technical Requirements

### Backend Changes
- **Ownership boundary** — S6 **invokes the P10-owned publish RPC/guard and renders its result**; it does not re-implement the transition. **P10 owns the DB-enforced publish-transition implementation** (the guarded RPC that checks the publish preconditions); **S6 owns the seller-facing screen and its states** (see P10, `human-approval-gate.md`). Do not describe the guard's internals here — cross-reference P10.
- **Publish precondition enforcement (server-side, hard — P10-owned, invoked by S6)** — publish is a guarded transition that verifies all four: (a) AA gate PASS on the current version (deterministic §6.1), (b) every rendered block id ∈ `approved_sections`, (c) every Real-Maker badge `voiceAnchorClipId` resolved, (d) required `product_specs` completeness for every product (P14 product-completeness check, D16-4 — composition point being finalized with P14/S8). Plus the untagged-hero-clip guard (§9). RLS is the only boundary — status transitions are DB-enforced, never app-side only (Part B B0).
- **Approve action** — append `blockId` to `store_versions.approved_sections` (own-store only).
- **Publish** — flip `stores.published` once the gate passes.
- No LLM in S6 itself (the AA gate is deterministic; the coherence critic is P9). No new eval/cost-log obligation here.

### Frontend Changes
- Approve/publish screen (role-gated `seller`, own-store): per-block Approve controls, the four-precondition checklist, blocked-publish reasons, the four states.

### Database Changes
- Writes **`store_versions(status store_version_status, approved_sections jsonb)`** and **`stores(published)`** (Part B S6). Data-need tables = **Irreversible tier** (database-engineer before backend-engineer). `approved_sections` is a `blockId[]`. Do NOT add columns.

### External Services
- None. (Verification resolution that feeds precondition (c) is S9, service-role; S6 only reads the resolved status.)

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Approve is instant; publish precondition check completes within ~1s. | Interaction timing |
| **Security** | Publish/approve are own-store only; the four-part precondition is DB-enforced, not app-side only (Part B B0); no false published state possible. | RLS + gate test |
| **Correctness** | Publish is impossible unless all four preconditions hold and no untagged hero clip is bound — asserted by tests for each failing precondition. | Test suite per precondition |
| **Accessibility** | The gate itself enforces the shop's AA; the approve UI is keyboard-navigable and the blocked reasons are screen-reader legible. | axe-core + gate test |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P10 human-approval-gate (rules/data) | Feature/Data | Not Started | H — S6 enforces P10's contract |
| P9 auto-critic AA gate | Feature | Not Started | H — precondition (a) |
| S9 verification (resolved `voiceAnchorClipId`) | Feature/Data | Not Started | H — precondition (c) |
| S4 co-edit (`approved_sections` writes + un-approve on edit) | Feature | Not Started | H |
| `store_versions` / `stores.published` | Data (Irreversible) | Not Started | H |
| P7 video tagging (hero clip tagged) | Feature | Not Started | M — untagged-hero guard |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| Buyer journey (B1–B8) | frontend | Yes | Only published stores are discoverable |
| S7 dashboard | frontend | Yes | Shows published status |

---

## Out of Scope

- The gate rules/data model itself (P10) — S6 renders + enforces; cross-reference, do not duplicate.
- The critic algorithm (P9).
- The verification flow (S9) — S6 only reads the resolved verified/pending status.
- Editing sections (S4).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| A precondition enforced app-side only (bypassable) | M | H | All four preconditions DB-enforced (Part B B0); RLS is the only boundary; tested per precondition |
| A store publishes a false verified claim | L | H | Precondition (c) blocks publish unless `voiceAnchorClipId` resolved (store-config.schema §2.1) |
| Stale approval slips through after an edit | M | H | S4 un-approves on edit; S6 re-checks every rendered block id ∈ `approved_sections` at publish |
| Blocked publish is confusing (generic error) | M | M | Name the exact unmet precondition + link to the offending section/pair/verification |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Publishes that bypassed a precondition | N/A | 0 (structurally impossible) | Always |
| False verified claims published | N/A | 0 | Always |
| Seller publish success rate (of those who reach S6 with a complete store) | N/A | > 90% publish without confusion | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | Each precondition blocks correctly; all-four-pass publishes; untagged-hero guard works | 3–5 days |
| Private Beta | First seller cohort | No bypasses; blocked reasons are clear | 1–2 weeks |
| Full Launch | All sellers | Metrics on target | — |

**Feature Flag** — `section-approve-publish-enabled`? Yes. Owner: CTO. **Irreversible tier — Founder sign-off required per CLAUDE.md (publish flips a store live; touches status transitions).**

**Rollback Plan** — Trigger: any precondition bypass discovered. Decision maker: CTO + Founder (Irreversible). Steps: disable publish flag → stores stay in `in_review` → no unsafe publishes. Data impact: `stores.published` flip is reversible (unpublish); `store_versions` are append-only. A migration touching the publish transition = Irreversible tier.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Unpublish flow — once live, can a maker unpublish, and does that revert `stores.published` cleanly? Not specified in the locked contract. | CTO | Before build |
| 2 | "Rendered block" definition for precondition (b) — confirm it excludes conditionally-omitted empty optional blocks so they don't falsely block publish. | ai-engineer + CTO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
