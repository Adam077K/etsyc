---
role: design-lead
task: kol-design-reconcile (Phase-3 design-critic gate — reconcile schema to design-system v2)
date: 2026-07-20
branch: feat/kol-design-reconcile
task_type: DESIGN_SYSTEM
tier: full
qa_verdict: PENDING (joins Phase-3-closure set for QA-Lead)
---

# Design-Lead — reconcile store-config + block catalog to design-system v2

Docs-only. design-system **v2** is the founder-confirmed authoritative direction; the other two docs synced TO it.

## P1 (blocked the design gate) — DONE
- **P1-a** store-config §2.2 `kind:"curated"` enums → v2: `paletteId` = `sunbaked|market-plum|cuberto-noir|orchard|bazaar` (was v1 `atelier-chalk|studio-paper|nocturne|…`); `fontPairingId` = `statement-grotesk|warm-serif|modern-mono-grotesk|character-maximal` (was `editorial-warm|gallery-grotesque|contrast-editorial|…`). §3 worked example re-themed (Sena's stoneware → `sunbaked`/`statement-grotesk`).
- **P1-b** `motionPreset` enum → v2 4-value `hushed|fluid|liquid|dimensional` (was 3-value `still|calm|lively`); `liquid`/`dimensional` carry the founder cinematic signature. Comment maps to MOTION_INTENSITY 3/5/7/8. Applied to both union arms (curated + custom). §3 example motionPreset → `fluid`.
- schemaVersion 1.1 → **1.2** + changelog line. Verified: no v1 palette/pairing/motion-preset name survives in store-config.schema.md (the only `calm` left is the unrelated `videoProfile.mood` enum + the intentional changelog "was" reference).
- Cross-doc: store-config.schema and KOL-design-system now name the **same** 5 palettes / 4 pairings / 4 motion presets (verified by grep).

## P2 — DONE
- **P2-a** (block catalog) `blockGround?: "a"|"b"|"c"|null` prop added to `craft-story`, `voice-quote`, `contact-cta`; `atmosphere` gains a `block-ground` variant + prop. `voice-quote`+`atmosphere` accept all 3 grounds (display/no type); `craft-story`+`contact-cta` carry body/UI copy → dark grounds only (midtone `--block-c` rejected). Cross-cutting note ties them to the Faire section-on-a-color-block move so P4 can build the core brave-color identity.
- **P2-b** (design-system) added optional `--accent-3` to the token contract; split `bazaar`'s three-way accent into `--accent`(vermilion)/`--accent-2`(teal)/`--accent-3`(gold). Every declared color now has a slot.
- **P2-c** (design-system) pairing↔palette declared **bound** (recommended default), not a free 5×4 cross-product. §5 combination-space reworded to honest axes: palette(5, each w/ bound pairing) × motion(4) × radius(3) × density(2) × block-grounds × block order.
- **P2-d** (design-system) replaced blanket "meets AA" with honest per-combo levels. Two **midtone grounds are large-text-only** (3:1): `sunbaked --block-c` (#4C93A8 + cream ≈ 3.1:1) and `cuberto-noir --block-c` (#3D6CE0 + paper ≈ 4.4:1) — computed, restricted to display type. Body copy on colored sections uses dark grounds. §2 + §5 AA rows made honest.

## P3 — done where cheap
- P3-b: threaded "for curated worlds / seller shops bring their own brand" into §2 (palettes don't read as a seller cap).
- P3-c: noted an impact-stat primitive as deferred (block catalog cross-cutting).
- P3-a (brighten sunbaked): skipped — optional taste, ripple risk not worth it this pass.

## Contrast math (for QA re-verify)
Cream `#FBF3E8` L≈0.904. `sunbaked --block-c` #4C93A8 L≈0.252 → 3.16:1. `cuberto-noir --block-c` #3D6CE0 L≈0.171 + paper `#F5F5FF` → 4.44:1. `sunbaked --block-a`#B8452A→4.87:1, `--block-b`#5F6B33→5.25:1 (both pass body). All other block-grounds pair with dark ink and clear 4.5:1. QA-Lead must re-verify at build.

## ⚠️ Out-of-scope follow-up REQUIRED (surfaced, not fixed)
`docs/03-system-design/KOL-ai-pipeline-spec.md` (owned by ai-engineer, NOT in my edit scope) still carries the **old** enums at lines 172, 238, 287, 305 (`paletteId` v1), 307 (`fontPairingId` v1), 308, 325 (`motionPreset` 3-value), 339. store-config §2.2 states its `theme` shape "mirrors ai-pipeline-spec §5.4 **exactly**" — that claim is now violated. **ai-pipeline-spec §5.4/§5-examples must be synced to v2** (`sunbaked|…`, `statement-grotesk|…`, `hushed|fluid|liquid|dimensional`) by the ai-engineer or a follow-up, or the two docs contradict. Flagged to team-lead.

## Commits
- `docs(schema): reconcile store-config curated enums + motion presets to design-system v2 (P1)`
- `docs(design): add --accent-3 slot, honest block-ground AA levels, bind pairing↔palette (P2-b/c/d)`
- `docs(design): expose block-grounds as a blockGround prop on 4 blocks (P2-a)`

Do NOT merge — joins Phase-3-closure set for QA-Lead.
