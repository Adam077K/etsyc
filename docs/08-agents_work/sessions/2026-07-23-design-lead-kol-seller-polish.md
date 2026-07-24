---
role: design-lead
task: kol-seller-polish
date: 2026-07-23
branch: feat/kol-seller-polish
base: feat/kol-worlds-exclusive
qa_verdict: PENDING (2-reviewer gate follows)
tier: lite
gates: { build: PASS, film-continuity-e2e: 4/4, detect: "[]", console-errors: 0, scripted-contrast: PASS }
---

# Design-Lead — KOL seller-side polish + a11y focus ring

Skills read first: impeccable context.mjs (detect baseline []), web-design-guidelines, MANIFEST scan.

## Shipped (5 files, 2 commits, all in-territory)
1. **Ground-aware three-tone focus ring** (globals.css). Lone marigold ring was
   2.09:1 on bone (< WCAG 3:1). A single colour can't clear 3:1 vs both ink and
   bone, so ink->marigold->ink: an ink layer (14.45:1 vs bone) always meets the
   ground. Transparent outline kept for forced-colors. Ratios script-verified.
   Documented in DECISIONS + DESIGN.
2. **Seller chip variant documented** in DESIGN.md — sell-clips/sell-messages
   already use the bone active-fill; reconciled DESIGN with the DECISIONS
   rationale (bone = tool-state, marigold reserved for maker CTAs).
3. **Press physicality** on seller-workspace cards (sell-home need-rows +
   quick-actions were colour-only) and sell-orders stage-status radios.
4. **Copy fix** (sell-orders): deduped co-maker sentence — "Sharon makes the
   rest", not "Sharon, Sharon makes the rest".

## Honest flags (out of territory)
- sell-orders order KOL-2607-4413: headline "Glaze & pack the Salt-Fired Carafe"
  but the bag holds Butterfly Wings + Cat Tote (both Sharon's) -> "making 0 of 2".
  Root cause is fixture data (lib/fixtures/sell-orders.ts + commerce bag), not a
  seller-surface bug. Flag for the fixtures owner.

## Verify
build PASS · film-continuity 4/4 · detect [] · 0 console errors · contrast script
PASS on both grounds · before/after screenshots captured at 1440 + 375 · reduced
motion neutralizes press scale + film-drift.
