---
date: 2026-07-22
role: frontend-engineer
task: film-layer-fix (KOL Wave 3, gate-1 fix cycle 1)
branch: feat/film-layer
tier: full
qa_verdict: PENDING (re-review of new diffs)
---

Rebased onto main fce4517 (FilmFrame.tsx conflict = the focalPoint seam; resolved by keeping both imports, then threading focalPoint through the layer as fix 3). Closed all four gate-1 must-fixes in two commits (7b6a54b source, f2e297c tests): (1) atomic same-slot claims — rect rides setActiveSlot, mid-flight rect maintenance defers to transitionend, `data-film-edge` only beside a non-identity transform; (2) stacking contract in globals.css — `--z-film-bed 30 < --z-film-chrome 35 < --z-film 40`, `.kol-hero-stage` lifts chrome, claimed slot is a transparent window (poster returns when docked via `filmAway`); (3) `swapClip(clip)` carries focalPoint into BOTH buffers + poster underlay, integration-tested with FilmLayerProvider mounted; (4) mid-fade swaps defer latest-wins, rear release keys on computed fade duration with fire-time front/pending re-check, visibilitychange resumes veto-safely. Same-source guard now mutation-pinned. Gates: typecheck 0, lint 0, 610/610 tests (599 baseline + 11 new). Mutations verified red→green on fixes 1, 1b (identity gate), 3, and the fold-in. B1b/B2/B3/B4/B5 layer against the stacking contract; C-suite should breadcrumb it to DECISIONS.md (workers don't write there).
