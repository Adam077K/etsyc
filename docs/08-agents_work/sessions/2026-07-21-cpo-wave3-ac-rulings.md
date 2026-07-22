---
role: cpo
task: wave3-ac-rulings
date: 2026-07-21
qa_verdict: N/A (spec-only; no code changed)
tier: n/a
---

# CPO — Wave-3 AC rulings

Adjudicated three Design-Lead findings that required amending binding ACs in shipped specs. No code touched; spec + schema-doc + catalog text only.

- **Ruling 1 APPROVE-WITH-CHANGES** — "Film-frame continuity" replaces B2's unsatisfiable single-`<video>` AC. Split into same-source transitions (element persistence, cross-fade **forbidden**) and source-changing swaps (in-frame cross-fade, incoming buffer at `readyState >= 3` and already playing). The split is the change I added; without it the cross-fade becomes an escape hatch on `grow`/`unfold`.
- **Ruling 2 APPROVE** — Focus Film adopted in B1. Strengthens the anti-grid gate: it never touched layout, so the guarantee moves onto composition (adjacent-`top`-within-24px assertion). Added a motion floor: ≥2 cards in motion whenever ≥2 are in view.
- **Ruling 3 APPROVE-WITH-CHANGES** — `clips[].focalPoint` (optional, unlike required `images[].focalPoint`) and `hero-video.props.statement?` (≤48 chars, no render-time fallback). Both non-breaking; `schemaVersion` stays `"1.3"` (it is a `z.literal`). Added the D10 authoring/render line: AI *suggestion with maker approval* permitted, AI *render-time fabrication* banned.
- **Not verified visually.** Filed two eyes-on gates rather than approving on inference: `--dur-swap` frame-by-frame before B4 merge (B2 OQ-2); feed design-critic at N=4/N=18 before B1 merge (B1 OQ-3).
- **impact-stat:** agreed — Wave 6, `craft-story` sub-slot, catalog stays at 11, maker-declared only.

**Files edited:** `docs/04-features/specs/discovery-feed.md` · `grow-interaction.md` · `world-unfold.md` · `docs/03-system-design/store-config.schema.md` · `docs/04-features/KOL-block-catalog.md` · `.claude/memory/DECISIONS.md`.
