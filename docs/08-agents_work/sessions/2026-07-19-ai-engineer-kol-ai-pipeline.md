---
role: ai-engineer
task: KOL AI co-creation pipeline spec (Phase 4, Workstream B)
date: 2026-07-19
tier: full
qa_verdict: PENDING
branch: feat/kol-p4-ai-pipeline
---

# Session Log: ai-engineer — KOL AI Co-Creation Pipeline Spec

**Date:** 2026-07-19
**Lead:** ai-engineer (worker; spawned by team-lead/CTO for Workstream B)
**Task:** AI co-creation pipeline spec — interview → extraction → design derivation → auto-critic → human gate (D8/D9/D15)
**Duration:** ~1 session
**Status:** Complete (docs only; not merged — QA gate is structural)

---

## What Was Done

- Wrote **ADR-0002** (`docs/03-system-design/adr/0002-ai-co-creation-pipeline.md`): the five-stage pipeline, the D15 reframe (quality moves from input-constraint to output-verification), five real alternatives, consequences.
- Wrote the **full pipeline spec** (`docs/03-system-design/KOL-ai-pipeline-spec.md`), in the mandated order: (1) interview — fixed 7-beat sheet + bounded adaptive follow-ups + film/voice single-transcript handling + typed **brand-profile** extraction schema; (2) **D15 load-bearing step** — brand profile → coherent custom design system (any colors, not capped) → schema-valid store-config, with a worked custom-palette→theme mapping; (3) **auto-critic** — deterministic WCAG-AA hard gate (4.5:1 normal / 3:1 large / 3:1 non-text) BEFORE the LLM coherence score, bounded regen (max 3, escalate-to-human); (4) section-by-section human approval gate; (5) prompts/guardrails/model routing/evals/cost logging per LLM feature.
- Specified **3 eval datasets** (extraction quality, design coherence, critic accuracy w/ labelled slop set for precision+recall) and proposed a **shared eval-harness + cost-log schema** for convergence with Workstream C.
- Cited the locked Workstream-A data contract verbatim (`interviews`/`interview_answers`, `store_versions(critic_score,status,approved_sections)`, `videos`/`video_profiles` owned by C); did NOT redesign any table.
- Wrote the schema-freedom tension as a clearly-marked **"Proposed store-config schema amendment"** (§5.4) for schema-owner sign-off — did NOT edit `store-config.schema.md`.

## Files Changed

| File | Change |
|------|--------|
| `docs/03-system-design/adr/0002-ai-co-creation-pipeline.md` | New ADR (Proposed) |
| `docs/03-system-design/KOL-ai-pipeline-spec.md` | New full spec |
| `docs/08-agents_work/sessions/2026-07-19-ai-engineer-kol-ai-pipeline.md` | This session file |

## Decisions Made

- **theme discriminated union (curated | custom):** the only representation that satisfies D15 without editing the schema doc. §2.2 enum invariant scoped to `kind:"curated"`; accessibility for `kind:"custom"` guaranteed by the deterministic AA gate, not the enum. **Needs schema-owner sign-off (open_q #1).**
- **Deterministic AA contrast is a HARD gate before any LLM score** — computation, not taste, guarantees accessibility once palette-capping is gone (D15). Regen feeds back only specific failing pairs + measured ratios.
- **Model routing:** Opus 4.7 for design derivation only (load-bearing coherence, few calls/shop; justified), Sonnet 4.6 for interview/extraction/copy/critic-coherence, Haiku for the cheap per-beat stopping classifier.
- Custom fonts resolve against a broad hosted catalog ("any font" in practice); arbitrary font-file upload = roadmap.

## What's Next

1. Schema owner (Design-Lead / database-engineer) reviews the §5.4 `theme` amendment; if accepted, backend implements the Zod discriminated union + renderer dual-path.
2. Workstream C agrees (or counters) the shared eval-harness + cost-log schema (§8d, §10.1) and resolves the inline-`videoProfile`-vs-reference question (§9).
3. QA-Lead risk-tiers (spec touches no code → docs, but the pipeline it specifies is Full/Irreversible when built); this spec is the contract implementers build against.

## Blockers / Open Questions

1. **Schema amendment (§5.4)** — blocker-if-rejected: seller-shop configs cannot validate without the custom `theme` shape.
2. **Shared eval harness (§8d)** — needs Workstream C agreement.
3. **Inline `videoProfile` vs. reference (§9)** — resolve with C + schema owner.
4. **Font-upload scope** — confirm hosted-catalog-only is acceptable for MVP.

---

_Session by: ai-engineer | Date: 2026-07-19_
