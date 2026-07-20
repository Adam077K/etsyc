# Feature Spec — AI Store Draft (S3)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | AI Store Draft (JSON config) |
| **Feature Slug** | ai-store-draft |
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
| **Reach** | 6 | 4 seed worlds + first cohort *(assumed, D12)*. Every AI-built store is produced here. |
| **Impact** | 3 | Massive. This is the load-bearing D15 step — brand profile → *coherent custom design system* → schema-valid store-config. It is the whole "seller magic is provably real" promise (D3). |
| **Confidence** | 60% | *(est.)* Hardest reasoning step; quality carried by evals + the auto-critic gate. |
| **Effort** | 4 person-weeks | *(est., ask CTO)* Opus design derivation + block selection + copy generation + schema-valid emit with structural retry + eval + cost logging. |
| **RICE Score** | (6 × 3 × 0.60) ÷ 4 = **2.7** | Low RICE from high effort; strategically Must-Have. |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** It is the single hardest and most differentiating stage (ai-pipeline §5, the D15 load-bearing step). Without it, there is no AI-drafted store to co-edit or publish.

---

## Overview

Turns the extracted brand profile into a **coherent custom design system** (any colors, type, motion — *not* capped to the 5 KOL palettes, D15) and renders it into a **schema-valid store-config JSON** — blocks from the fixed catalog, exactly one `hero-video`, `theme.kind:"custom"`, copy in the maker's voice, and clip **references** to `videos.id` (D4: data, never raw code). Output is a `meta.status:"draft"` store-config that the renderer (P4) can display for co-edit.

Contract is LOCKED — this spec cites, it does not redesign: [`KOL-ai-pipeline-spec.md`](../../03-system-design/KOL-ai-pipeline-spec.md) §4–§5 (extraction → design derivation → emit), §9 (footage handoff), §10 (cost log); [`store-config.schema.md`](../../03-system-design/store-config.schema.md) v1.3.

---

## Problem

The founder's central bet is that a maker can talk for a few minutes and get a **genuinely custom, company-grade store — never slop, never flattened** (D3, D8, D9, D15). The concept-lock is emphatic: **"AI drafts the store as a JSON config — never raw code"** (seller journey step 3) and **"no flattening — every store must feel genuinely different"** (guardrails). D15 sharpens it: **"palette-capping a seller shop is the flattening the whole product exists to fight … the 5 palettes are starting points, not a cap."** The failure modes are: (1) emitting raw code instead of validated data (breaks D4, unsafe); (2) collapsing every maker to a safe house style (breaks D15 no-flattening); (3) hallucinating a design ungrounded in what the maker said.

*(No user quotes — grounded in concept-lock + NARRATIVE's "color used bravely … whole worlds can color-block into vivid grounds" direction.)*

---

## Proposed Solution

A two-sub-step derivation (ai-pipeline §5) that reasons about the design before committing it to blocks, then emits a validated config.

**UX Flow:**

1. **Sub-step A — derive the custom design system** (`claude-opus-4-7`, the load-bearing step): from the brand profile, produce an intermediate `DesignSystem` object (7-role any-hex palette, type pairing from the hosted font catalog, motion preset, atmosphere). The 5 KOL palettes are passed as *starting-point exemplars, explicitly not an allowed-set* (ai-pipeline §5.1). Design with AA headroom on purpose so §6.1 verifies rather than repairs.
2. **Sub-step B — choose blocks + emit store-config**: select ordered blocks from the fixed catalog (exactly one `hero-video`), encode the `DesignSystem` as `theme.kind:"custom"`, reference `media.clips[].id = videos.id` (never inline `videoProfile`; ai-pipeline §5.2/§9), generate copy in the maker's voice (§5.6), set `products[]` from the brand profile, `voiceovers:[]` empty (S5 fills), `meta.status:"draft"`, `meta.criticScore:null`, `meta.approvedSections:[]`.
3. The emitted config is Zod-validated (P3); on validation failure it retries with the validator error fed back (**max 2 structural retries** before escalating; §5.2).
4. Result: a draft store-config, rendered by P4 on the co-edit review screen (S4). Any clip bound but not yet tagged in `video_profiles` is marked `pendingTag:true` and is engine-ineligible until P7 tags it (§9).

---

## User Stories

- As a **maker**, I want the AI to draft my whole store from my interview so that I get a finished, on-brand world without designing or coding anything.
- As a **maker with a specific vibe** ("cold, precise, industrial"), I want a design that actually reflects *my* colors and feel, not a generic template (D15 no-flattening).
- As **KOL**, I want the draft to be validated data (not code) so that it is safe, renderable by one renderer, and structurally sound (D4).
- As **KOL**, I want every design choice traceable to what the maker said so that we never fabricate a brand.

---

## Acceptance Criteria

**Happy Path**
- Given a completed brand profile, when derivation runs, then a `DesignSystem` with a 7-role any-hex palette (NOT drawn from the 5-palette enum) and a hosted-catalog font pairing is produced, grounded in the profile's `paletteSignals`/`sourceImagery` (`derivedFrom` trace present).
- Given the `DesignSystem`, when emit runs, then a Zod-valid store-config is produced with `theme.kind:"custom"`, exactly one `hero-video` block, ordered catalog blocks, `meta.status:"draft"`, `meta.criticScore:null`, `meta.approvedSections:[]`.
- Given clips are bound to blocks, when emit runs, then `media.clips[].id` values equal `videos.id` **references** owned by the same store — never an inline `videoProfile` authored by this stage (D5 / ADR OQ-2).

**Data-not-code guardrail (D4)**
- Given any derivation output, when emit runs, then the result is store-config JSON validated by the P3 Zod schema — the stage never emits raw code or a free-form document.

**No-flattening / D15 guardrail**
- Given two materially different brand profiles (e.g. earthy-warm vs. cold-industrial), when both are drafted, then their palettes/type/motion differ beyond the `distinctness` floor (ai-pipeline §8b) — neither collapses to a house style.
- Given a brand whose colors match none of the 5 KOL palettes, when derivation runs, then a custom palette is produced (the palette is never forced into the curated enum).

**Grounding / hallucination guardrail**
- Given the brand profile leaves aesthetic signals thin, when derivation runs, then it falls back to `moodWords` + `colorTemperature` rather than inventing unrelated colors; `derivedFrom` traces every role to a signal.

**Error / retry State**
- Given the emitted config fails Zod validation, when emit runs, then it retries with the validator error fed back, **max 2 structural retries**, then escalates rather than looping (§5.2).
- Given Opus returns 429/529, when derivation runs, then it falls back Opus→Sonnet with a quality flag (result still must pass §6 gate) and logs `outcome:"fallback"` (§10.2).

**Empty / draft-review State**
- Given the draft is emitted, when the co-edit review screen (P4) renders it, then the whole world is shown live; blocks with `pendingTag:true` clips render their loading/poster state and are engine-ineligible until P7 tags them (§9).

**Edge Case**
- Given a maker's footage is not yet tagged in `video_profiles` at draft time, when the `hero-video` is bound, then the binding is marked `pendingTag:true` and — hard rule — the store **cannot publish** with an untagged clip bound to `hero-video` (deferred to S6; §9).

---

## UX / UI Notes

Surface distinction: the **seller shop being drafted** = FULL brand freedom (`theme.kind:"custom"`, D15 — any colors/fonts/vibe). The **co-edit review chrome** around it = KOL curated tool chrome. The draft screen shows the shop rendered by P4 inside KOL chrome.

**Key Interactions:**
- This stage is mostly non-interactive (it runs, then the maker reviews in S4). The visible surface is the draft-review render.
- A transparency affordance: the `aiTransparency.disclosure` + `aiAssistedFields` (`copy`, `layout`, `palette`) are set honestly on the draft (§5.6) so the trust badge (P11) discloses where AI assisted.

**Four states (also in ACs):**
- **Empty** — before draft completes, the review screen shows a progress state (deriving your world) tied to the pipeline stage (empty ≠ blank).
- **Loading** — progressive block skeletons matched to the composed layout as the draft renders (P4).
- **Error** — validation-retry-exhausted or Opus outage → the maker sees "we couldn't finish drafting — try again / adjust with us," never a broken half-store.
- **Success** — the full draft world renders live for co-edit.

**Edge Cases:**
- `pendingTag` clips → block shows poster/loading, not an error; the world is still reviewable.
- Reduced-motion honored in the P4 render.

---

## Technical Requirements

### Backend Changes
- **Design derivation** — `claude-opus-4-7` (ai-pipeline §5.1, D15 load-bearing). Sonnet fallback on Opus 429/529 with a quality flag. The 5 palettes passed as exemplars, NOT an allowed-set. NEVER cap to the 5 palettes.
- **Block selection + emit** — produce Zod-valid store-config per store-config.schema v1.3 (§5.2): catalog blocks only (`hero-video · craft-story · product-showcase · product-detail · voice-quote · process-reel · reviews · trust-badge · thank-you · atmosphere · contact-cta`), exactly one `hero-video`, `theme.kind:"custom"` with the 7-role palette + `customPairing`, clip **references** (`media.clips[].id = videos.id`), copy from §5.6, `voiceovers:[]`, `meta.status:"draft"`. Structural retry max 2 on validation failure.
- **Copy generation** — `claude-sonnet-4-6`, maker's voice (`brand.voiceTone`/`adjectives`), independent of video narration and voiceovers (D10 three-layer independence).
- **Cost logging (mandatory)** — §10.1 shape per call, `feature` ∈ `design_derivation | copy_gen`; emit `iteration` for regen attribution, `store_id`/`trace_id` for per-shop cost.
- **Eval (mandatory, ship-blocking)** — `design_coherence` (§8b): AA-pass-rate at first emit ≥ 0.8, critic-vs-human correlation, and `distinctness` floor (the quantitative no-flattening check). Prompt-cache the block catalog + design-token vocabulary + brand-profile schema blocks.
- **Referential integrity at emit** — every `bindings.*` id resolves; `media.clips[].id` → an owned `videos.id` (the P3 validator owns this, DB cannot enforce ids in jsonb — Part B B0 / OQ-2).

### Frontend Changes
- The draft-review screen is the P4 render of the draft config (owned by P4/S4); this stage's frontend surface is the progress + error states while the draft is generated.

### Database Changes
- Writes **`stores(config jsonb)`** and **`store_versions(config, version, critic_score, status, approved_sections)`** (Part B S3). Config persist + `videos`/`video_profiles` upsert (if any) in **one transaction** (Part B B0). Data-need tables = **Irreversible tier**. Do NOT emit raw code into config; do NOT add schema keys — v1.3 is LOCKED.

### External Services
- Anthropic Claude API (Opus for derivation, Sonnet for copy), keyed via env. No hardcoded keys.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Derivation runs a handful of times per shop (not per request) — latency budget is generous but bounded; a full draft completes within a few minutes. | `latency_ms` logging + timed run |
| **Security** | Config written under the store owner's scope; keys from env; no PII in logs; emitted config is validated data only (no executable code). | RLS test + schema-validation test |
| **AI quality** | `design_coherence` eval passes in CI: AA-pass-at-first-emit ≥ 0.8, distinctness above floor. | `runEval` (§8d) |
| **Correctness** | 100% of emitted drafts are Zod-valid after ≤ 2 structural retries or are escalated (never a persisted invalid config). | Validation test suite |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| S2 extracted brand profile | Feature/Data | Not Started | H — no input without it |
| P3 store-config Zod schema + validator (referential integrity) | Feature | Not Started | H — cannot validate emit |
| P4 renderer (draft review) | Feature | Not Started | H — cannot show the draft |
| `stores` / `store_versions` tables | Data (Irreversible) | Not Started | H |
| Theme discriminated-union schema amendment (ai-pipeline §5.4 open_q #1) | Schema sign-off | Open | H — custom configs cannot validate until accepted |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| S4 co-edit | frontend | Yes | Edits the draft |
| P9 auto-critic | ai-engineer | Yes | Scores the draft |
| S6 approve/publish | frontend | Yes | Gates on the draft's approvals + AA |

---

## Out of Scope

- The auto-critic scoring itself (P9 / ai-pipeline §6) — S3 designs with AA headroom; P9 verifies.
- Video tagging (`video_profiles`) — P7, Workstream C; S3 only references `videos.id`.
- Voiceover recording (S5) — `voiceovers:[]` is empty at draft.
- Editing store-config.schema.md — owned by schema owner; this spec cites v1.3.
- Arbitrary uploaded font files (roadmap; MVP uses the hosted catalog, §5.5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Flattening — makers collapse to a house style | M | H | Prompt forbids a safe default; `distinctness` eval floor; critic fit-to-brand penalizes generic output |
| Emitting invalid config / raw code | L | H | Zod validation on emit; max-2 structural retry then escalate; data-only invariant |
| Custom theme cannot validate (schema amendment unresolved) | M | H | Escalated as open_q; blocker-if-rejected flagged; curated fallback is NOT acceptable (defeats D15) |
| Opus cost/availability | M | M | Runs per-shop not per-request; Sonnet fallback with quality flag; cost logged per shop |
| Ungrounded (hallucinated) design | M | M | `derivedFrom` trace required; thin-signal fallback to moodWords, not invention |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| AA pass rate at first emit | N/A | ≥ 0.8 (design with headroom) | Every eval run |
| Palette/type distinctness across distinct brands | N/A | Above the no-flattening floor | Every eval run |
| Draft validity (Zod-valid within ≤ 2 retries) | N/A | 100% (else escalated) | Every run |
| Maker "this feels like me" (qual, seed cohort) | N/A | ≥ 80% agree | 30 days post-seed |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | `design_coherence` passes; 4 distinct worlds render; no invalid configs persisted | 5–7 days |
| Private Beta | First seller cohort | Distinctness holds on real makers; no flattening reported | 1–2 weeks |
| Full Launch | All sellers | Metrics on target | — |

**Feature Flag** — `ai-store-draft-enabled`? Yes. Owner: CTO.

**Rollback Plan** — Trigger: distinctness regression, invalid configs persisted, or Opus outage. Decision maker: CTO. Steps: disable flag → sellers held at S2 with saved interviews → no broken drafts published. Data impact: draft `store_versions` are append-only snapshots; nothing published; backward-compatible.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Theme discriminated-union amendment (ai-pipeline §5.4 open_q #1) — until Design-Lead/database-engineer accept it, `theme.kind:"custom"` configs cannot validate. Blocker-if-rejected. | CTO + Design-Lead | Before build |
| 2 | Store-config.schema §2.3 inline `videoProfile` wording — confirm the emit is a pure `videos.id` reference (resolved in principle, ADR OQ-2; schema-doc wording alignment pending). | schema owner | Before build |
| 3 | Font freedom scope (§5.5) — confirm the hosted catalog is acceptable for MVP; arbitrary font upload is roadmap. | CPO + CTO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
