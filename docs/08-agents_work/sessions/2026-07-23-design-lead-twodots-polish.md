---
role: design-lead
task: twodots-governance-and-design-polish
date: 2026-07-23
qa_verdict: PASS (code review + design verdict) — merge HELD on Founder clearance
tier: full
branch: feat/kol-twodots (LOCAL only — never pushed)
governance: INTERNAL-ONLY — children's imagery; merge + deploy blocked pending Founder written permission
---

# Design-Lead — Two Dots governance fixes + design-verdict polish

First real-footage maker world (Sharon's children's-costume studio). This pass
closed the code-review governance findings and the design-verdict polish items,
then rebased onto the wave-3 continuous-film architecture.

## Landed
- **P1 (governance):** `devil-back.jpg` re-cropped to faceless (top 28% removed;
  strips a partial side profile). Visually confirmed faceless on the Little Devil
  card — the earlier full-face render was a Next 16 Turbopack image-cache artifact
  (`.next/dev/cache/images/`), not the disk file.
- **P2:** `quilt.jpg` wired into the Little Devil gallery (was shipped-unreferenced).
- **Accent → clay** (CEO-approved): stage-red theatrical register for a costume
  world; plum stays sole to Grain & Groove. Verified: voice close on clay ground
  (rgb 180,70,42), product kicker + thumb ring in clay.
- **Hero entry frame:** added fixture-driven `Maker.filmSeed`; Two Dots seeds the
  hero clip to 0:06 (hand-on-felt) so the full-bleed hero opens on action, not the
  empty white centre band the portrait clip crops to at 0:00. Seeds once on the
  persistent film node's first mount via `<MakerFilm initialTime>` — never fights
  the feed→world currentTime carry.
- **A11y:** product gallery thumbnails `min-h/w-[44px]` (WCAG 2.5.5 tap target).
- **CREDITS:** per-image governance fallback plan so each Founder decision is one
  word (workshop.jpg SWAP→materials.jpg/felt.jpg; devil-back.jpg upgrade path).

## Rebase
Rebased 4→5 commits onto origin/main (0e99da6, wave-3 continuous film + interactions
+ seller workspace). One conflict (product-page.tsx gallery button) resolved by
keeping wave-3's `press` class + injecting the 44px min. Fixtures ride the new
FilmStage architecture unchanged; film docks to a corner PiP on scroll (verified).

## Floor
tsc clean · eslint clean · next build clean (41/41 static) · in-browser verify on
desktop + mobile (390px). Screenshots in `apps/kol/__screens__/twodots/` (gitignored).

## Held for Founder (decision list)
1. workshop.jpg — approve or swap (fallback pre-staged in CREDITS)
2. Sharon's surname/city + copy review
3. Written permission for public use of children's imagery (gates merge + deploy)
