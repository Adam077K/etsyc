---
role: frontend-engineer
task: B4 — store scroll & interact (WORLD_BROWSE)
branch: feat/b4-store-scroll
qa_verdict: PENDING
tier: lite
---
Built the WORLD_BROWSE unit: headless BrowseSwapController (first-scroll stage advance; scoring-driven clip swaps via new `selectBrowseClip` server action — block-boundary midline trigger, 12 s floor, null → keep clip), product-click handoff to NARRATE_SHRINK via WorldInteractionContext (`data-selected-product`), reduced-motion static reels in FilmFrame's scroll-gated path. Film Layer consumed via `swapClip(clip)` only — no `<video>` touched, no `Math.random` in diff. Session identity SHARED with the feed: rebased onto feat/b1a-feed-data and imports `FEED_SESSION_COOKIE`/`resolveFeedSessionId` (lib/feed/session.ts) + `FEED_RING_COOKIE` (lib/feed/select.ts) — single source of truth, no redeclared literals; middleware mints `kol_sid` (B4 only reads/validates), B4's action is the ring's cross-state persistence path. Gates after rebase: typecheck 0 errors, lint 0, tests 655/655 (39 files — B1a's suite included).
