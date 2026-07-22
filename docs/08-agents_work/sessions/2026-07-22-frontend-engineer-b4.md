---
role: frontend-engineer
task: B4 — store scroll & interact (WORLD_BROWSE)
branch: feat/b4-store-scroll
qa_verdict: PENDING
tier: lite
---
Built the WORLD_BROWSE unit: headless BrowseSwapController (first-scroll stage advance; scoring-driven clip swaps via new `selectBrowseClip` server action — block-boundary midline trigger, 12 s floor, null → keep clip), product-click handoff to NARRATE_SHRINK via WorldInteractionContext (`data-selected-product`), reduced-motion static reels in FilmFrame's scroll-gated path. Film Layer consumed via `swapClip(clip)` only — no `<video>` touched, no `Math.random` in diff. Cookies converged with B1a: adopted `kol_sid`/`kol_ring` + identical attrs; middleware mints `kol_sid` (B4 only reads/validates), B4's action is the ring's cross-state persistence path. Gates: typecheck 0 errors, lint 0, tests 637/637 (7 new).
