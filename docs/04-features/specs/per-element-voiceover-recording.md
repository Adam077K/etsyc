# Feature Spec — Per-Element Voiceover Recording (S5)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Per-Element Voiceover Recording (seller) |
| **Feature Slug** | per-element-voiceover-recording |
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
| **Reach** | 5 | 4 seed worlds + first cohort *(assumed, D12)*; optional/suggested, so not every maker uses it on every element. |
| **Impact** | 2 | Medium. A high-warmth personal touch ("hear her say it"), but optional (D10/D11) — the store works without it. |
| **Confidence** | 70% | *(est.)* Scope is locked full (D11); it is the seller surface of the P12 engine. |
| **Effort** | 1.5 person-weeks | *(est.)* In-editor recorder + upload + `voiceovers[]`/`media` writes + `elementRef` binding. Engine/playback owned by P12/B10. |
| **RICE Score** | (5 × 2 × 0.70) ÷ 1.5 = **4.7** | |

**MoSCoW Classification:** Should Have (this cycle)

**Why this priority?** D11 puts voiceover in MVP at full scope, and it is a signature personal-touch demo. But it is optional per element, so it ranks below the load-bearing draft/edit/publish stages.

---

## Overview

The seller surface of the P12 voiceover engine: in the co-edit editor, the maker records their **real voice** for a specific element (a block, a product, or a field), suggested and optional (D10/D11). Each recording writes a `voiceovers[]` entry bound by `elementRef` plus a `media` row; the buyer plays it via tap-to-hear (B10). Real voice only — no cloning — and independent of the product copy and the clip narration (the three voice layers never derive from each other, D10).

The P12 voiceover **engine** (record/playback contract, `voiceovers` binding model) is owned by Batch 1 / W1 — this spec **references** it and specifies only the seller recording UX + the data it writes. See [`store-config.schema.md`](../../03-system-design/store-config.schema.md) §2.5; D10/D11.

---

## Problem

Voice is one of the most human, trust-building signals a maker has — but the founder guardrail is explicit that **"voice is one element, not the whole"** and that trust must stay **honest** (concept-lock guardrails), which is why D10 uses **real seller-recorded voice, no cloning**. The concept-lock seller journey step 4 locks **"add optional per-element voiceovers,"** and D10 keeps the three voice layers (store video / store text / tap-to-hear) **independent** so text is free to be its own thing. The failure mode is either faking voice (cloning — dishonest) or coupling voiceover to the copy (which makes the copy sound like a transcript).

*(No user quotes — grounded in concept-lock guardrails + D10/D11.)*

---

## Proposed Solution

An in-editor recorder that captures a real-voice clip for a chosen element and binds it into the config.

**UX Flow:**

1. In the co-edit editor (S4), the maker sees a suggested "record a voiceover" affordance on eligible elements (a block, a product, a field).
2. The maker records their real voice in place (record-in-editor, D11).
3. On save, a `media` row is created and a `voiceovers[]` entry is written with `elementRef: { kind: "block"|"product"|"field", id, field }`, `src`, `durationMs`, optional `transcript` (a11y only, not the copy source), and a buyer-facing `label` ("Hear Sena on this glaze").
4. Result: the element is now tappable for buyers (B10 playback); the recording is optional and can be removed or re-recorded.

---

## User Stories

- As a **maker**, I want to record my real voice on a specific product or section so that buyers can hear me say it in my own words.
- As a **maker**, I want voiceovers to be optional and suggested, not required, so that I add them where they matter and skip the rest.
- As **KOL**, I want voiceovers to be the maker's real recording (never cloned) and independent of the written copy so that the "hear her say it" moment stays honest (D10).

---

## Acceptance Criteria

**Happy Path**
- Given the maker records a voiceover on an element, when they save, then a `media` row + a `voiceovers[]` entry are written with a valid `elementRef` and a buyer-facing `label`, bound to the correct element.
- Given a voiceover exists on an element, when the buyer views it (B10), then a tap-to-hear affordance plays the real recording.

**Real-voice / honesty guardrail (D10)**
- Given any voiceover, when it is saved, then its `src` is a maker-recorded clip — the feature offers no voice cloning or synthesis.
- Given a voiceover's optional `transcript`, when copy is generated (S3 §5.6), then the copy is NOT derived from the transcript (three voice layers independent, D10).

**Empty State**
- Given an element has no voiceover, when the editor renders it, then a suggest-record prompt is shown (optional, non-blocking), and the buyer surface (B10) simply hides the tap affordance (empty ≠ blank).

**Loading State**
- Given a recording is uploading, when it saves, then an upload/processing indicator shows (never a bare spinner); the editor stays usable.

**Error State**
- Given the recording upload fails, when it occurs, then a quiet inline error + retry appears and any prior recording on that element is retained (no lost recording).

**Edge Case**
- Given the maker re-records an element that already has a voiceover, when they save, then the new recording replaces the old binding cleanly (one active voiceover per `elementRef`).
- Given a voiceover binds to a `field` element, when the field is later removed in editing, then the dangling voiceover is handled (removed or orphaned-and-hidden) — never a broken tap affordance for buyers.

---

## UX / UI Notes

Surface: recording happens inside the **KOL co-edit tool chrome** (curated); the recorded voice plays inside the **seller's shop** (custom theme) via B10.

**Key Interactions:**
- Suggest-record affordance on eligible elements (block / product / field).
- Record → preview → save (with an editable buyer-facing `label`).
- Remove / re-record controls.

**Four states (also in ACs):**
- **Empty** — suggest-record prompt on elements without a voiceover; buyer surface hides the affordance.
- **Loading** — upload/processing indicator; editor usable.
- **Error** — upload failure → quiet inline error + retry; prior recording retained.
- **Success** — voiceover bound and buyer-tappable (B10).

**Edge Cases:**
- Text never waits on audio — the element's text renders immediately; the voiceover is additive (block-catalog §5 `voice-quote`).
- Reduced-motion → any waveform animation degrades to static.

---

## Technical Requirements

### Backend Changes
- Upload the recorded clip to Supabase storage; create a `media` row; write the `voiceovers[]` config entry with `elementRef`, `src`, `durationMs`, optional `transcript`, `label` (store-config.schema §2.5).
- Resolve `elementRef.id`/`field` against the rendered config (Part B P12: voiceovers bind to a block element by `element_id`/`element_field`).
- No LLM in S5 — no eval or cost-log obligation here (the engine and playback are P12/B10; recording is a media-write surface).

### Frontend Changes
- In-editor recorder component (record, preview, label, save, remove, re-record) surfaced on eligible elements; the four states.

### Database Changes
- Writes **`voiceovers`** (`store_id`, `element_kind voiceover_element_kind`, `element_id`, `element_field`) and **`media`** (Part B P12/S5). RLS `media_owner_all` / `videos_owner_all` `WITH CHECK` requires `store_id` null or caller-owned store (Part B S5 / P1-5). Data-need tables = **Irreversible tier**. Do NOT add columns.

### External Services
- Supabase storage / CDN for the audio asset. No third-party APIs; no cloning/synthesis service (real voice only, D10).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Recording upload completes within a few seconds; the editor never blocks on it. | Upload timing test |
| **Security** | Writes are own-store only (`WITH CHECK` store ownership, Part B S5); no PII in logs. | RLS test |
| **Accessibility** | Optional `transcript` supports a11y; buyer tap-to-hear (B10) has a text-only fallback; recorder controls keyboard-navigable. | axe-core + screen-reader |
| **Honesty** | No cloning/synthesis path exists; `src` is always a maker recording. | Code review + no synthesis dependency |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P12 voiceover engine (W1 — binding + playback contract) | Feature | Not Started | H — this is its seller surface |
| S4 co-edit editor (host surface) | Feature | Not Started | H |
| `voiceovers` / `media` tables | Data (Irreversible) | Not Started | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| B10 tap-to-hear (buyer playback) | frontend | Yes | Plays what S5 records |

---

## Out of Scope

- The voiceover engine / binding model / playback (P12 / W1) — referenced.
- Buyer-side playback UX (B10).
- Voice cloning or synthesis — explicitly forbidden (D10 real voice only).
- Copy generation (S3 §5.6) — independent layer (D10).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Dangling `elementRef` after the bound element is edited/removed | M | M | Resolve against rendered config; orphaned voiceovers hidden, never a broken buyer affordance |
| Upload failures lose a recording | L | M | Retain prior recording; retry; no destructive save on failure |
| Makers ignore an optional feature | M | L | Suggest-record prompts on high-value elements; keep it low-friction |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Sellers who record ≥ 1 voiceover | N/A | ≥ 50% (optional but valued) | 30 days |
| Broken buyer tap affordances (dangling refs) | N/A | 0 | Always |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | Record → bind → buyer tap works; 4 states pass | 2–3 days |
| Full Launch | All sellers | No dangling-ref bugs | — |

**Feature Flag** — `per-element-voiceover-enabled`? Yes. Owner: CTO.

**Rollback Plan** — Trigger: dangling-ref bug or upload failures. Decision maker: CTO. Steps: disable flag → recording hidden, existing voiceovers still play (B10) → no data loss. Data impact: `voiceovers`/`media` are additive; disabling recording does not remove existing rows.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Cleanup policy for orphaned voiceovers when a bound element is deleted — hard-delete vs. soft-orphan-and-hide? | CTO | Before build |
| 2 | Max recording length / file size limits per element (storage + a11y). | CPO + CTO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
