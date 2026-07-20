# Tap-to-Hear Voiceover — Buyer Surface (B10)

<!-- Phase-5 spec worker (W3). Buyer PLAYBACK surface of the P12 voiceover engine. W1 (store-engine-spine.md §P12) owns the engine + seller recording; this spec scopes to buyer playback UX only — reference P12, do NOT re-spec it. -->

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Tap-to-Hear Voiceover (Buyer Playback) |
| **Feature Slug** | tap-to-hear-voiceover-buyer |
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
| **Reach** | 5 | Every buyer who reaches a maker world with recorded voiceovers (assumed — low confidence; basis "4 seed worlds + first cohort"; depends on sellers recording). |
| **Impact** | 2 | Medium — a distinctive "hear her say it" intimacy beat (D10), but optional and non-blocking (`est.`). |
| **Confidence** | 80% | Data + block fully locked (`voiceovers`/`media`, `voice-quote` block); engine owned by P12 (`fact`). |
| **Effort** | 0.5 person-week | Read + playback UI only; no recording, no engine (`est.`; `(ask CTO)` if audio player a11y is heavier). |
| **RICE Score** | (5 × 2 × 0.8) ÷ 0.5 = **16** | |

**MoSCoW Classification:** Should Have — D11 puts voiceover in scope as **Full** (seller record + buyer playback); the buyer half is what makes the personal touch felt, but it degrades silently to text so it never gates a world.

**Why this priority?** The seller-recording half (P12/S5) is the heavy lift; the buyer playback surface is cheap and completes D11's "both sides real". High RICE because low effort, distinctive payoff.

---

## Overview

The buyer-side playback affordance for seller-recorded voiceovers (D10/D11). Where a maker has recorded a real-voice voiceover bound to an element, the buyer sees a tap-to-hear affordance and, on tap, hears the maker's actual voice. It is optional, non-blocking, and degrades silently to text-only when audio is absent or fails. It renders the `voice-quote` block and reads `voiceovers[]` — it selects nothing and generates nothing.

---

## Problem

D10 defines three **independent** voice layers, one of which is *"tap-to-hear voiceovers (optional, seller-recorded real voice per element)"* — kept honest *"without cloning"*. The concept-lock buyer journey is about turning shopping *"from a transaction back into a relationship"* by meeting the human. Text alone doesn't let a buyer *hear* the maker. The pain, in the buyer's terms: *"I want to know there's a real person here — let me hear her actually say it, not read AI copy"* (grounded in concept-lock "meet the human, trust them" + D10; USER-INSIGHTS.md empty). The honesty rail: the voice must be the maker's own recording, never derived from the text copy or the clip narration (D10 — the three layers never derive from each other).

---

## Proposed Solution

A tap-to-hear affordance on any element with a bound voiceover, rendered via the `voice-quote` block (`audio-tap` / `text+waveform` variants) and on other blocks that carry a voiceover binding. Playback is buyer-initiated; text is always present first.

**UX Flow:**

1. A block renders with an associated `voiceovers[]` entry (e.g. `voice-quote` on a maker line, or a product with a bound voiceover). Text/label shows immediately.
2. Buyer sees a tap-to-hear affordance (a labelled pill from `voiceovers[].label`, e.g. "Hear Sena on this glaze") + optional slim waveform.
3. Buyer taps → the maker's real recording plays; the waveform fills on `--ease-kol`; sound is off until this opt-in tap (the hard tone line).
4. Result: the buyer hears the maker's own voice on that element — an intimate, honest moment — with text intact whether or not they tapped.

---

## User Stories

- As a buyer, I want to tap and hear the maker's real voice on a piece so that I feel a real person behind it, not machine copy.
- As a buyer, I want the text to be there regardless so that I never depend on audio to understand the product.
- As a buyer on a silent device or with audio off, I want the affordance to stay quiet until I choose it so that nothing autoplays sound at me.

---

## Acceptance Criteria

**Happy Path**
- Given a block with a bound `voiceovers[]` entry, when the block renders, then the text/label shows immediately and a tap-to-hear affordance labelled from `voiceovers[].label` is present.
- Given the affordance, when the buyer taps it, then the maker's real recording (`voiceovers[].src`) plays with a waveform animating on `--ease-kol`; audio loads only on this tap (sound off until opt-in).
- Given playback, when the buyer taps again / pauses, then playback stops cleanly; text remains untouched.

**Empty State**
- Given a block with **no** bound voiceover, when it renders, then the tap-to-hear affordance is **hidden entirely** (never an empty/disabled audio frame) — the text stands alone.

**Loading State**
- Given a tapped voiceover whose audio is still fetching, when it renders, then the waveform shows a skeleton shimmer while the **text shows immediately** (text never waits on audio).

**Error State**
- Given the audio fetch fails (404/decode), when the buyer tapped, then the block degrades to `text-only` — the tap affordance is removed with **no error chrome** (graceful, silent) — the world stays whole.

**Edge Case (independence + a11y)**
- Given a voiceover, a product `description`, and a clip narration on the same element, when they render, then the voiceover audio is the maker's recording and is **not** derived from the description or clip narration (D10 independence) — the three are distinct sources.
- Given reduced-motion, when a voiceover plays, then the waveform does not animate (static fill), audio still plays.

---

## UX / UI Notes

Surface touched: rendered **inside maker worlds** — the maker's own brand surface (`theme.kind:"curated"` or `"custom"`), so this affordance styles from the world's tokens, not KOL chrome. Anti-slop for the world is the AA gate + critic + approval (P9/P10), not palette-capping (D15).

**Key Interactions:**

- `voice-quote` block variants: `audio-tap` (quote + tap-to-hear) and `text+waveform` (quote + slim waveform that fills on play). Waveform in `--accent` at low opacity; on a colored block-ground it recolors to `--on-block-*`.
- Tap-to-hear pill can also sit beside a `craft-story` heading or a `product-detail`/`product-showcase` product (per that block's optional `voiceoverIds` binding).

**Edge Cases:**

- No voiceover → affordance hidden (empty ≠ blank).
- Audio unsupported / autoplay-blocked → affordance still requires a tap; nothing autoplays (aligns with the platform "sound off until opt-in" rule).
- Multiple voiceovers on one screen → only one plays at a time; tapping a second stops the first.

---

## Technical Requirements

> **Risk tier: Lite** (buyer read + playback only — no API/DB write, no auth-gated mutation). No new migration; the engine and recording paths belong to P12/S5.

### Backend Changes

- None new. Reads resolved `voiceovers[]` (config, referentially validated by P3) and their `media` rows. This spec adds no RPC, no engine, no selection logic (P12 owns the model; the video engine P6 is unrelated — voiceovers are not engine-selected clips).

### Frontend Changes

- Render the `voice-quote` block (`audio-tap` / `text+waveform`) plus the tap-to-hear pill on blocks carrying a `voiceoverIds` binding.
- Buyer-initiated `<audio>` playback; waveform fill on `--ease-kol`; single-active-player coordination.
- All-4-states: empty (affordance hidden), loading (waveform shimmer, text immediate), error (silent degrade to text), success (real voice plays).

### Database Changes

**Data need (read-only; NO new objects):**

| Object | Use | Status |
|---|---|---|
| `voiceovers(store_id, element_kind, element_id, element_field)` | resolve which element has a recording | Locked (P12 / B2 §B10) |
| `media` | the audio asset | Locked |

- Bind strictly to `voiceovers` + `media` (B2 §B10). Do **not** invent playback state tables or a "plays" counter.

### External Services

- None.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Text + affordance render with the block (no audio prefetch); audio begins < 500ms after tap on a warm CDN. | Playback benchmark. |
| **Security** | No PII; audio served from the store's own media (public-read for published stores). | Media access review. |
| **Accessibility** | Audio has a visible label; `transcript` (if present on the voiceover) is exposed; player is keyboard-operable; reduced-motion disables waveform animation. | Screen-reader + keyboard walkthrough; axe-core. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P12 Voiceover engine (recording + `voiceovers[]` write) | Feature (W1 spine) | Not Started | H — nothing to play back |
| S5 Per-element recording (seller records) | Feature (W4) | Not Started | H — no content without it |
| P4 Store renderer (block render + tokens) | Feature (W1 spine) | Not Started | M |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| Product-detail render (B6) | W2 | No | product-detail renders tap-to-hear where present |

---

## Out of Scope

- Seller recording UX, waveform capture, `voiceovers[]` write path — owned by P12 / S5 (reference only).
- Voice cloning / synthetic voice of any kind — explicitly forbidden (D10, "no cloning").
- Deriving the audio from product copy or clip narration — the three voice layers are independent (D10).
- Transcript generation — `transcript` is an optional a11y field the seller supplies; not produced here.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Audio autoplays / plays with sound before opt-in | L | H | AC pins "audio loads only on tap"; platform "sound off until opt-in" rule enforced. |
| Buyer thinks the voice is AI/derived | L | M | Real-voice-only rail (D10); trust-badge (P11) discloses AI assistance elsewhere, keeping voice honest. |
| Broken audio breaks the block layout | L | M | Silent degrade to text-only, no error chrome (AC). |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Tap-to-hear engagement where an affordance is present | 0% | ≥ 25% of buyers who see one | 30 days post-launch |
| Audio-error-visible-to-buyer rate | — | ~0% (silent degrade) | ongoing |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (with real recordings) | All 4 states pass; silent-degrade verified | 1–2 days |
| Full Launch | All buyers | No P0; a11y pass | — |

**Feature Flag** — Behind a flag? No (degrades to text by design). If gated, `tap-to-hear-enabled`.

**Rollback Plan** — Trigger: audio-security or autoplay regression. Decision maker: CTO. Steps: hide the affordance (world still renders text); no data migration, no data loss.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Single-active-player coordination across multiple blocks — global vs per-block audio context. | Design-Lead + CTO | pre-build |
| 2 | Should a bound voiceover with a missing `media` row be treated as empty (hide) or error (silent degrade)? (Lean: hide, matching empty-state.) | CTO | pre-build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft (Phase-5 W3) | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
