# Feature Spec — Adaptive AI Interview (S2)

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Adaptive AI Interview |
| **Feature Slug** | adaptive-ai-interview |
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
| **Reach** | 6 | 4 seed worlds + first seller cohort *(assumed — low confidence, D12)*. Every store starts here — no interview, no draft. |
| **Impact** | 3 | Massive. The transcript this produces is the *sole* upstream input to extraction (§4) and thus to the entire design derivation. Garbage in → flat store out. |
| **Confidence** | 70% | *(est.)* Loop is locked (D8); follow-up quality is the open variable, covered by an eval. |
| **Effort** | 3 person-weeks | *(est., ask CTO)* Real-time film/voice capture + STT + two LLM features (Sonnet follow-up, Haiku beat-classifier) + extraction (Sonnet) + evals + cost logging. |
| **RICE Score** | (6 × 3 × 0.70) ÷ 3 = **4.2** | Lower RICE from high effort; strategically Must-Have regardless. |

**MoSCoW Classification:** Must Have (this cycle)

**Why this priority?** It is the first load-bearing AI stage of the co-creation loop (D8). Everything downstream (S3 draft, S4 edits, S6 publish) depends on the transcript + extracted brand profile it produces.

---

## Overview

An adaptive interview the maker completes by **film (preferred) or voice** that captures their story, craft, workshop, values, brand feel, personal details, and product stories (D8). It walks a fixed 7-beat sheet in order with **bounded** smart follow-ups, then extracts a typed brand profile from the transcript. The interviewer only *asks and reflects* — it never writes the maker's story for them (D10). Output: a timestamped transcript + a per-beat, hallucination-guarded brand profile that feeds S3.

Engine/pipeline contract is LOCKED — this spec cites, it does not redesign: [`KOL-ai-pipeline-spec.md`](../../03-system-design/KOL-ai-pipeline-spec.md) §3 (interview), §4 (extraction), §8e/§8g (evals), §10 (cost log).

---

## Problem

A maker's world can only feel genuinely *theirs* if the system understands the specific, sensory truth of who they are and what they make — real place-names, real materials, felt textures. The founder guardrails demand **"never 'AI does it for you' … they stay the creative author"** and **"no flattening — every store must feel genuinely different"** (concept-lock guardrails). The failure mode is twofold: (1) an interview that **"feels like a form"** — over-probing, robotic, and makers abandon it; (2) an interview that under-probes and hands vague, generic material to design, producing a flattened store. The concept-lock seller journey step 2 locks this as *"film (preferred) or voice. Adaptive: fixed story beats + smart follow-ups."*

*(No user quotes — USER-INSIGHTS.md empty; grounded in concept-lock + NARRATIVE's "real human faces lead every surface" direction.)*

---

## Proposed Solution

A conversational capture surface that runs the fixed beat-sheet with a bounded follow-up policy and hands a clean, grounded brand profile to S3.

**UX Flow:**

1. Maker chooses **film** (preferred) or **voice**; both produce the *same* artifact — a timestamped transcript (STT for voice; STT + optional visual frames for film). The follow-up logic is transcript-source-agnostic (ai-pipeline §3).
2. The interviewer asks the first beat's opening question (7 fixed beats in order: story/origin → craft → workshop → values → brand-feel → personal → product-stories; ai-pipeline §3.1).
3. Per beat, after the opening answer, a bounded follow-up policy decides whether to probe: probe only if a required field is unfilled or the answer is vague; ask the highest-value missing field, one at a time, **max 3 follow-ups per beat** (ai-pipeline §3.2). A cheap Haiku classifier scores each answer `filled | vague | done` to drive the budget.
4. When all 7 beats are satisfied, the transcript + per-beat spans hand to **extraction** (Sonnet), which produces a typed brand profile — every fact grounded in a transcript `sourceSpan`; any field the transcript does not support is `null`, never invented (ai-pipeline §4).
5. Result: `interviews` + `interview_answers` rows persisted, `interview_answers.extracted` filled, brand profile snapshotted into the first `store_versions` draft's provenance → S3 draft.

---

## User Stories

- As a **maker**, I want to answer a few natural questions on film or by voice so that I don't have to fill in forms or write my own store copy.
- As a **maker**, I want the interview to feel like a curious shopkeeper, not an interrogation, so that I finish it and enjoy it.
- As a **maker who names specific materials and places**, I want those exact details captured accurately so that my store feels like *mine*, not a template.
- As **KOL**, I want every extracted fact traceable to something the maker actually said so that we never put words in a maker's mouth (D10).

---

## Acceptance Criteria

**Happy Path**
- Given a maker starts the interview, when they choose film or voice, then the same timestamped-transcript artifact is produced and beat B1 (story/origin) is asked first.
- Given all required fields for a beat are filled at "specific" confidence, when the maker finishes answering, then the interview **advances** to the next beat without a needless follow-up (over-probe guard).
- Given all 7 beats are satisfied, when the interview completes, then extraction runs and produces a typed brand profile persisted to `interview_answers.extracted`, with every non-null fact carrying a transcript `sourceSpan`.

**Bounded-probe / "feels like a form" guard**
- Given a beat has already spent 3 follow-ups, when the maker answers again, then the interview **advances** regardless (budget adherence — never a 4th probe on one beat; ai-pipeline §3.2).
- Given a maker signals done ("that's about it"), when the classifier returns `done`, then the beat advances even if optional fields remain.

**Extraction hallucination guardrail**
- Given the transcript does not support a brand-profile field, when extraction runs, then that field is `null` — never invented (measured by the `extraction_prf` eval's hallucinationRate, target 0; ai-pipeline §4/§8a).
- Given an adversarial "make me sound premium" answer, when extraction runs, then it extracts only stated facts and does not inflate.

**Empty State**
- Given the maker has answered nothing yet, when the interview screen renders, then the first beat's opening prompt shows (empty ≠ blank — a guiding prompt tied to the beat), with the record affordance ready.

**Loading State**
- Given a film/voice answer is being transcribed, when processing runs, then a skeleton/processing indicator matched to the transcript layout shows (never a bare spinner), and the maker is not blocked from reviewing prior beats.

**Error State**
- Given recording or transcription fails (device error, STT 5xx), when it occurs, then a quiet inline error + retry appears; the maker's captured audio/video is not lost and no beat is silently skipped.
- Given the follow-up or classifier LLM returns 429/529, when it occurs, then error handling per ai-pipeline §10.2 applies (backoff/retry, then typed error) and the interview degrades to advancing on the fixed beat rather than blocking.

**Edge Case**
- Given a maker declines the personal-details beat (B6), when they skip it, then pronouns/personal fields are left `null` (asked, never inferred — ai-pipeline §3.1) and the interview still completes.
- Given a film answer where the maker holds up a product (B7), when a follow-up is generated, then it may reference the held item as a prompt hint (`visualNotes`), not a separate code path.

---

## UX / UI Notes

Surface: **KOL's own product UI** (seller-tool chrome) → curated system; the maker's *film* is the star, chrome recedes (film-always-wins).

**Key Interactions:**
- Film/voice toggle at the start; identical follow-up logic either way.
- One question on screen at a time; the maker records; the next question appears after processing.
- A visible beat-progress indicator (7 beats) so the maker sees how much remains — reinforces "easy + bounded," not open-ended.
- Sound off until opt-in on any playback review.

**Four states (also in ACs):**
- **Empty** — first beat prompt shown (guiding, tied to the beat); record affordance ready.
- **Loading** — STT/processing skeleton matched to the transcript layout; prior beats reviewable.
- **Error** — recording/transcription failure → quiet inline error + retry, captured media preserved.
- **Success** — all 7 beats captured → extraction → advance to S3 draft.

**Edge Cases:**
- Reduced-motion → no scrubbing animations; static frames.
- The over-probe failure ("feels like a form") is the primary UX risk — the max-3/beat budget and the `advance-when-satisfied` rule are the guardrails; the beat-progress indicator makes the boundedness felt.

---

## Technical Requirements

### Backend Changes
- **Interview follow-up generation** — `claude-sonnet-4-6` (ai-pipeline §2/§3.2). Bounded policy: probe only on unfilled-required or vague; max 3/beat.
- **Beat-satisfied classifier** — `claude-haiku-4-5`, 3-class `filled | vague | done` (ai-pipeline §3.2/§8g).
- **Extraction** — `claude-sonnet-4-6`, structured output validated against the brand-profile schema (ai-pipeline §4.1); every fact requires a `sourceSpan`; unsupported → `null`.
- **STT** for voice (and optional visual frames for film) → timestamped transcript. `(ask CTO)` on the STT provider choice — not specified in the locked contract.
- **Cost logging (mandatory, every LLM call)** — emit the §10.1 shape: `{ event:"llm_call", feature, model, input_tokens, output_tokens, cost_usd, latency_ms, ts }`. `feature` ∈ `interview_followup | beat_classifier | extraction`; emit optional `trace_id`, `store_id`, `outcome` for per-shop attribution.
- **Evals (mandatory, ship-blocking)** — `interview_followup_quality` (action accuracy, field-targeting, over-probe rate, budget adherence; ai-pipeline §8e), `beat_classifier_accuracy` (per-class P/R/F1, minimize `vague→filled`; §8g), `extraction_prf` (field P/R/F1 + hallucinationRate target 0; §8a). Shared harness in `apps/kol/src/lib/agents/evals/` (§8d). Prompt-cache the stable beat-sheet + brand-profile schema blocks.
- **Error handling** per §10.2: 429 → backoff+retry; 529 → fallback/queue; other → typed error, no silent failure.

### Frontend Changes
- Interview route (role-gated `seller`): film/voice capture component, beat-progress indicator, one-question-at-a-time flow, review of prior beats, the four states.

### Database Changes
- Writes **`interviews(mode interview_mode, status interview_status)`**, **`interview_answers(beat_key, question, answer_text, media_id, ordinal)`**, **`media`** (Part B S2). All Data-need tables = **Irreversible tier** (database-engineer before backend-engineer). Do NOT add columns beyond these — escalate if the extraction snapshot needs a store beyond `interview_answers.extracted` + the first `store_versions` provenance.

### External Services
- Anthropic Claude API (Sonnet + Haiku), keyed via `process.env.ANTHROPIC_API_KEY` (never hardcoded). STT provider TBD (`ask CTO`).

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Performance** | Follow-up decision returns within a conversational window (target < 3s P95); STT does not block review of prior beats. | Latency logging (`latency_ms`) + load test |
| **Security** | Route role-gated `seller`; recordings written under caller-owned scope (Part B S5 `media_owner_all` `WITH CHECK`); no transcript PII in logs; API keys from env. | RLS test + security review |
| **AI quality** | All three evals pass their thresholds in CI before deploy (hallucinationRate = 0; over-probe rate low; `vague→filled` minimized). | `runEval` in CI (§8d) |
| **Accessibility** | Captions on any playback; keyboard-operable record controls; text prompts screen-reader legible. | axe-core + screen-reader |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| P1 Auth + role→seller | Feature/Data | Not Started | H |
| `interviews` / `interview_answers` / `media` tables | Data (Irreversible) | Not Started | H — no persistence without them |
| Anthropic API + STT provider | External | Partial | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| S3 AI store draft | ai-engineer | Yes | Consumes the extracted brand profile |
| S1 explainer | frontend | Yes | Hands off into this screen |

---

## Out of Scope

- Design derivation and store-config emission (S3).
- Video tagging / `video_profiles` authoring (P7, Workstream C) — this stage does not tag footage.
- Editing the brand-profile schema (owned by ai-engineer / schema owner) — this spec cites it.
- Free-form open-ended conversation beyond the bounded beat-sheet.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Over-probing → "feels like a form" → abandonment | M | H | Max 3 follow-ups/beat (asserted); advance-when-satisfied; beat-progress indicator; `over-probe rate` eval metric gates ship |
| Extraction hallucination (words in the maker's mouth) | M | H | Every fact requires a `sourceSpan`; unsupported → `null`; hallucinationRate eval target 0 |
| STT accuracy on accents / non-English place-names | M | M | Eval covers non-English place-names; captured media preserved for re-transcription |
| LLM latency breaks the conversational feel | M | M | Haiku for the cheap stopping check; prompt-caching; latency logging |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| Interview completion rate (all 7 beats) | 0% | > 80% of sellers who start | 30 days post-seed |
| Extraction hallucination rate | N/A | 0 (unsupported facts left null) | Every eval run |
| Over-probe rate (probes when should advance) | N/A | Below eval threshold | Every eval run |
| Median follow-ups per beat | N/A | ≤ 1.5 (bounded, not exhausting) | 30 days |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed makers (D12) | All evals pass; 4 states pass; full 7-beat run produces a grounded profile | 3–5 days |
| Private Beta | First seller cohort | Completion > 70%; no hallucinations found | 1–2 weeks |
| Full Launch | All sellers | Metrics on target | — |

**Feature Flag** — `adaptive-ai-interview-enabled`? Yes. Owner: CTO.

**Rollback Plan** — Trigger: eval regression, hallucination found in production, or STT outage. Decision maker: CTO. Steps: disable flag → sellers held at S1 with a "come back soon" message → no partial/broken stores created. Data impact: interview rows are append-only and backward-compatible; no destructive migration.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Which STT provider (accuracy on accents/non-English place-names, latency, cost)? Not fixed in the locked contract. | CTO | Before build |
| 2 | Where does the consolidated brand-profile object persist — only `interview_answers.extracted` + `store_versions` provenance, or is a dedicated snapshot column needed (would be a migration, Irreversible)? | CTO | Before build |
| 3 | Film `visualNotes` (visual frames extraction may cite) — MVP scope for frame capture, or defer to voice/STT-only first? | ai-engineer + CPO | Before build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
