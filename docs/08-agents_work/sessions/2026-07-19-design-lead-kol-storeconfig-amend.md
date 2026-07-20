---
role: design-lead
task: kol-storeconfig-amend
date: 2026-07-19
branch: feat/kol-storeconfig-amend
tier: docs-only
qa_verdict: PENDING (joins Phase-4 merge set for QA-Lead)
---

# Design-Lead — store-config schema amendments (Phase 4)

Docs-only. Applied two Phase-4-surfaced amendments to `docs/03-system-design/store-config.schema.md` — both faithful expressions of already-locked decisions (D15, ADR-0001 OQ-2), not new design.

## Amendment #1 — §2.2 `theme` → discriminated union on `kind` (D15 resolution)
- Replaced the fixed-enum `theme` with a Zod `discriminatedUnion('kind', [Curated, Custom])`.
  - `kind:"curated"` — the existing enum shape, UNCHANGED. KOL's own UI, hand-built worlds, seller starting points. Remains the D9-layer-1 enforcement point.
  - `kind:"custom"` — NEW. Seller-shop full brand freedom (D15): any-hex 7-role `customPalette` + `customPairing` from hosted font catalog + motion/radius/density.
- Scoped the §1 curated-enum invariant to `kind:"curated"` ONLY. For `kind:"custom"` the accessibility/anti-slop guarantee is the deterministic WCAG-AA contrast gate + auto-critic + maker approval (D9 layers 2–3) — the guarantee moves from input enum to output gate (`meta.criticScore` must pass before `status` leaves `draft`).
- Field names/shape mirror `KOL-ai-pipeline-spec.md` §5.4 EXACTLY (the emit-target). No discrepancy found between the pipeline's emit and the contract.
- Updated: intro "What this is" paragraph, top-level shape comment, §1 invariant bullet, §2.2 block + prose, and the §3 worked example (`theme` now tagged `kind:"curated"`).

## Amendment #2 — §2.3 `videoProfile` source-of-truth note (ADR-0001 OQ-2)
- Added a note: the inline `videoProfile` block is a config-side mirror for authoring/reference only; the `video_profiles` table is canonical and queryable (GIN-indexed), and the video engine ignores the inline copy. Cross-references ADR-0001 OQ-2 and `KOL-video-engine-spec.md`.

## Version
- Bumped `schemaVersion` illustrative + worked-example value to `1.1`; added a Changelog line documenting both amendments.

## Scope discipline
- Edited ONLY `store-config.schema.md`. No code, no migrations, no block-catalog changes. Not merged — joins the Phase-4 merge set for QA-Lead.
