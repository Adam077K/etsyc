# Feature Spec — Co-Edit Visual Editor (S4)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Co-Edit Visual Editor |
| **Feature Slug** | co-edit-editor |
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
| **Reach** | 6 | 4 seed worlds + first cohort *(assumed, D12)*. Every seller co-edits their draft. |
| **Impact** | 3 | Massive. This is where "the maker stays the author" (D8/D10) is made real — and where the honesty guarantee (re-critic + un-approve on edit) lives. |
| **Confidence** | 65% | *(est.)* Loop is locked; editor UX breadth is the variable. |
| **Effort** | 4 person-weeks | *(est., ask CTO)* Visual editor: block swap/reorder, theme tweak within AA, re-record, plus the re-critic-on-edit + un-approve loop and `store_versions` writes. |
| **RICE Score** | (6 × 3 × 0.65) ÷ 4 = **2.9** | Strategically Must-Have. |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** The co-creation loop (D8) is not real without a maker-facing editor. The re-critic-on-edit / remove-from-approved loop is the honesty guarantee that keeps approvals meaningful.

---

## Overview

A visual editor where the maker reviews the AI draft and takes authorship: swap blocks and variants, tweak colors/fonts (curated or custom, within the AA gate), reorder sections, and re-record clips (D8/D9). Every edit **re-triggers the §6 auto-critic on the changed section** and **removes that section from `approved_sections`** — so an approved section always reflects what will publish (the honesty guarantee, ai-pipeline §7). Edits write new `store_versions`.

Contract is LOCKED — this spec cites, it does not redesign: [`KOL-ai-pipeline-spec.md`](../../03-system-design/KOL-ai-pipeline-spec.md) §7 (co-edit + human gate), §6 (critic re-trigger). Voiceover recording is S5 (the P12 seller surface) — referenced, not duplicated. The gate rules/data-contract are P10 — S6/P10 own the gate; S4 owns the editor.

---

## Problem

The founder guardrail is absolute: **"never 'AI does it for you' — every AI touchpoint is with the maker; they stay the creative author"** (concept-lock guardrails), and the seller journey step 4 locks **"maker reviews in a simple visual editor: swap blocks, tweak colors, re-record clips, add optional per-element voiceovers."** The subtle failure mode is dishonest approvals: a maker approves a section, then edits it, and the store publishes something they never actually approved. The pipeline spec closes this with a hard rule — **editing a block removes it from `approved_sections` and re-triggers the critic** (ai-pipeline §7). Without that, "approved" is a lie and the anti-slop gate leaks.

*(No user quotes — grounded in concept-lock guardrails + D8/D10.)*

---

## Proposed Solution

A live visual editor over the P4 render of the draft, with an edit → re-critic → un-approve loop on every change.

**UX Flow:**

1. Maker opens the draft (rendered live by P4) in the editor.
2. Maker makes an edit: swap a block or variant, tweak theme tokens (curated palette/pairing enums, or custom `roles`/`customPairing` within the AA gate), reorder blocks, or re-record a clip (S5 owns voiceover recording; referenced).
3. On each edit: the changed section is **re-scored by the §6 critic** (AA gate first, then coherence) and **removed from `approved_sections`**; a new `store_versions` row is written. Because a token change is global, coherence is re-scored across the world (ai-pipeline §7).
4. Maker sees the re-critic result (pass / repaired / below-bar with concrete fixes) and can re-approve the section (approval itself is S6/P10).
5. Result: an edited, re-critiqued, honestly un-approved set of sections; the store moves toward a publishable state only once every rendered block is (re-)approved and AA passes (S6).

---

## User Stories

- As a **maker**, I want to swap blocks, tweak my colors and fonts, and reorder sections so that the store becomes truly mine, not just the AI's first guess.
- As a **maker**, I want to re-record a clip in place so that the film matches what I want to say.
- As **KOL**, I want every edit to re-run the quality critic and un-approve the touched section so that "approved" always means "the maker approved exactly what will publish."
- As a **maker who tweaks a color**, I want to be told immediately if it fails accessibility so that I can fix it before publish (D15 AA gate, not a palette cap).

---

## Acceptance Criteria

**Happy Path**
- Given a draft in the editor, when the maker swaps a block variant, then the change renders live (P4) and a new `store_versions` row is written.
- Given the maker tweaks a theme token, when the change applies, then it re-renders the whole world (tokens are global) and the coherence critic re-scores (§6/§7).

**Re-critic + un-approve loop (the honesty guarantee)**
- Given a section is in `approved_sections`, when the maker edits that section (copy, tokens, media, or order), then its `blockId` is **removed from `approved_sections`** and the §6 critic re-runs on the changed section (ai-pipeline §7).
- Given the maker changes a global token, when it applies, then coherence is re-scored across the world (not only the one block) because a token change is global (ai-pipeline §7 / Part B P10).

**AA-within-edit (D15 gate, not a cap)**
- Given the maker sets a custom color pair that fails WCAG-AA, when the edit applies, then the deterministic AA gate (§6.1) flags it — auto-repair by lightness nudge preserving hue where possible, else surfaces the specific failing pair with its measured ratio — and the section cannot be re-approved until AA passes.
- Given a curated theme, when the maker picks palette/pairing, then only the curated enums are offered (`sunbaked|market-plum|cuberto-noir|orchard|bazaar`, etc.); custom themes allow any hex within the AA gate (D15).

**Empty State**
- Given a block is unfilled (e.g. no products yet), when the editor renders it, then a ghost prompt tied to the feeding interview beat is shown (empty ≠ blank; block-catalog §2/§3 seller-view prompts), not a blank frame.

**Loading State**
- Given a re-critic is in flight after an edit, when it runs, then a skeleton/in-progress indicator matched to the section shows (never a bare spinner); the rest of the world stays interactive.

**Error State**
- Given a save (`store_versions` write) fails, when the maker edits, then a quiet inline error + retry appears and the edit is not lost.
- Given a re-record upload fails, when it occurs, then the prior clip is retained and a retry is offered (S5 owns the recorder; error surfaced here).

**Edge Case**
- Given the maker reorders blocks, when order changes, then `blockId`s stay stable (order changes, ids do not) so approvals/critic scores pin to the section, not the position (store-config.schema invariant).
- Given a maker deletes the only `hero-video`, when they attempt it, then the editor prevents it (exactly one `hero-video` per world is a schema invariant).

---

## UX / UI Notes

Surface distinction: the **shop being edited** = FULL brand freedom (`theme.kind:"custom"`, D15). The **editor chrome** = KOL curated tool chrome. The editor is a control layer over the live P4 render.

**Key Interactions:**
- Block library panel: swap block / variant, reorder (drag), delete (except the mandatory `hero-video`).
- Theme panel: curated enums for curated themes; custom `roles`/`customPairing` pickers for custom themes, each validated against the AA gate on change.
- Re-record affordance per clip (S5) and per-element voiceover recording (S5).
- Every edit shows the re-critic result and clears the section's approved state visibly.

**Four states (also in ACs):**
- **Empty** — ghost prompts per unfilled block, tied to the interview beat that feeds it (empty ≠ blank).
- **Loading** — re-critic in flight → section skeleton; world stays usable.
- **Error** — save/upload failure → quiet inline error + retry; edit preserved.
- **Success** — edit applied, world re-rendered, section re-critiqued and un-approved (ready to re-approve in S6).

**Edge Cases:**
- Reduced-motion honored in the P4 render.
- Token change ripples globally → make the "this un-approved several sections" consequence visible so the maker isn't surprised.

---

## Technical Requirements

### Backend Changes
- **Re-critic trigger** — every edit invokes the §6 auto-critic (P9): deterministic AA gate first, then LLM coherence on the changed section (and global coherence on token changes). Cost-logged (§10.1, `feature:"critic_coherence"`, `iteration` for regen) — S4 is a critic-trigger surface, so the AI eval + cost-log obligations apply via P9.
- **Un-approve on edit** — editing a `blockId` removes it from `store_versions.approved_sections` atomically with the edit (ai-pipeline §7; Part B P10).
- **Versioning** — each logical edit writes a `store_versions` row (config snapshot, incremented version).
- **Manual video tagging** — the editor also supports manual tagging into `video_profiles` (Part B S4), the P7 manual path.

### Frontend Changes
- Editor route (role-gated `seller`, own-store): block library panel, theme panel with AA-validated custom pickers, drag-reorder, re-record hooks (S5), live P4 render, the four states, and visible re-critic/un-approve feedback.

### Database Changes
- Writes **`stores`**, **`store_versions(status, approved_sections)`**, reads **`blocks`** (static catalog), writes **`video_profiles`** (manual tagging) (Part B S4). Data-need tables = **Irreversible tier**. Do NOT add columns; `approved_sections` is a `blockId[]` jsonb (Part B P10).

### External Services
- Anthropic Claude API via the P9 critic (Sonnet coherence). AA gate is deterministic (no LLM). Supabase storage for re-recorded clips (via S5).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Edits render live within a few hundred ms; re-critic runs async without blocking further edits. | Playwright interaction timing |
| **Security** | Editor is own-store only (RLS); custom theme edits validated against AA server-side (not app-side only, Part B B0); keys from env. | RLS + AA gate test |
| **Data integrity** | Every edit either writes a valid `store_versions` row and un-approves the touched section, or fails cleanly with the edit preserved. | Transaction test |
| **Accessibility** | Editor controls keyboard-navigable; the maker-facing AA warning is itself accessible; the edited shop is AA-gated. | axe-core + gate test |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| S3 AI store draft | Feature/Data | Not Started | H — nothing to edit |
| P4 renderer (live render) | Feature | Not Started | H |
| P9 auto-critic (re-critic on edit) | Feature | Not Started | H — honesty loop breaks |
| P10 gate rules/data (`approved_sections`) | Feature/Data | Not Started | H |
| S5 voiceover recording | Feature | Not Started | M — re-record depends on it |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| S6 approve/publish | frontend | Yes | Consumes `approved_sections` |
| P9 / P10 | ai-engineer | Yes | Re-scores on every edit |

---

## Out of Scope

- The critic algorithm itself (P9 / ai-pipeline §6) — S4 triggers it.
- The approval/publish action and its preconditions (S6 / P10) — S4 un-approves on edit; S6 approves and publishes.
- Voiceover recording internals (S5 / P12) — referenced.
- Product CRUD (S8) — the editor edits store composition; product management is its own surface.
- Adding new block *types* — the catalog of 11 is fixed (D9 layer 1).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Approvals go stale (edit without un-approving) | M | H | Un-approve on edit is atomic with the write; asserted by test; it is the honesty guarantee |
| Custom color edit breaks accessibility silently | M | H | Deterministic AA gate on every theme edit; auto-repair or block re-approval until AA passes |
| Global token change surprises the maker (mass un-approve) | M | M | Make the ripple visible before/after the change |
| Editor complexity balloons scope | M | M | Constrain to swap/variant/reorder/re-record/theme-tweak; no new block types |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Stores edited before publish | N/A | > 80% of sellers make ≥ 1 edit (authorship is real) | 30 days |
| Stale-approval incidents (published block never re-approved after edit) | N/A | 0 | Always |
| AA failures caught in-editor vs. at publish | N/A | Majority caught in-editor | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | Re-critic + un-approve loop verified; AA-on-edit works; 4 states pass | 5–7 days |
| Private Beta | First seller cohort | No stale approvals; edits feel authorial | 1–2 weeks |
| Full Launch | All sellers | Metrics on target | — |

**Feature Flag** — `co-edit-editor-enabled`? Yes. Owner: CTO.

**Rollback Plan** — Trigger: stale-approval bug or AA gate bypass in the editor. Decision maker: CTO. Steps: disable flag → sellers can view but not edit drafts → no dishonest publishes. Data impact: `store_versions` are append-only snapshots; rollback to a prior version is non-destructive.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Re-critic cost per edit — should rapid successive edits debounce the coherence re-score to bound Sonnet cost (AA gate stays synchronous)? | CTO + ai-engineer | Before build |
| 2 | Manual `video_profiles` tagging UX in the editor vs. P7's tagging surface — where does the seam sit so we don't build it twice? | CPO + Workstream C | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
