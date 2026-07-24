---
role: design-lead
task: kol-worlds-exclusive
date: 2026-07-23
branch: feat/kol-worlds-exclusive
base: feat/kol-sharon-feed-film (1df2fe5)
tier: full
qa_verdict: SELF-PASS (design-critic + finish-reviewer gate pending)
---

# Maker worlds → exclusive, film-led experiences

Evolved the SHARED maker-world template (five synthetic worlds; bespoke Two Dots untouched) from stacked sections into a film-led journey, generalizing Two Dots' mechanism via additive fixture data.

- **Film-led narration:** corner-docked film narrates a contextual label per beat (`world.filmNarration`, authored in each maker's register), re-presented as sections enter view.
- **Signature interactive moment:** process grid → draggable **make-reel** (momentum drag + arrow keys + progress rail); each active frame narrates its own `filmLabel`. Kills the "regular website" 3-up card grid.
- **Cinematic rhythm-break:** full-bleed film **interlude** blooms the persistent film behind a line pulled verbatim from each maker's own story, then re-docks (guarded event bus).
- **Movement:** restrained scroll parallax on story + studio imagery, staggered story entrance. Transform/opacity only, reduced-motion safe, WCAG-AA preserved. No new binaries; no faces fabricated.

Gates: TS-strict build PASS · film-continuity e2e 4/4 · impeccable detect [] · zero console errors across all 6 worlds · before/after screenshots odd-clay + indigo-ash (+ grain-groove, risograph) at 1440 & 375.
Files: `apps/kol/src/components/maker-world.tsx`, `apps/kol/src/lib/fixtures/worlds.ts`.
