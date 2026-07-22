---
role: frontend-engineer
task: B4 — store scroll & interact (WORLD_BROWSE)
branch: feat/b4-store-scroll
qa_verdict: PENDING
tier: lite
---
Built the WORLD_BROWSE unit: headless BrowseSwapController (first-scroll stage advance; scoring-driven clip swaps via new `selectBrowseClip` server action — block-boundary midline trigger, 12 s floor, null → keep clip), product-click handoff to NARRATE_SHRINK via WorldInteractionContext (`data-selected-product`), reduced-motion static reels in FilmFrame's scroll-gated path. Film Layer consumed via `swapClip(clip)` only — no `<video>` touched, no `Math.random` in diff. Cookies `kol_session`/`kol_ring` proposed to B1a for convergence. Gates: typecheck 0 errors, lint 0, tests 637/637 (7 new).
