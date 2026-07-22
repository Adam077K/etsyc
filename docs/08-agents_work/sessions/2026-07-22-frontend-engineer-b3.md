---
role: frontend-engineer · task: B3 world unfold · date: 2026-07-22 · tier: full
branch: feat/b3-world-unfold · status: COMPLETE (awaiting QA-Lead + E5 eyes-on sign-off)
---
Shipped the unfold in 4 commits: E5 hero identity line (statement → name leads the caption beneath; absent → nameplate unchanged; `/preview?statement=off` toggle; flipped the pre-E5 assertion), §3.3 choreography (three bands on `--ease-cinematic`, 900 ms hard cap, 70 ms nearest-to-film waves with ~1.3× parallax, atmosphere breathes out 340–900, reverse = 702 ms derived, zero new tokens), deep-linkable `/w/[handle]` with the engine WORLD_OPEN read (pin via `videos.id`; any engine failure opens the world unpinned — never blocks the film), and the GROWN→WORLD_OPEN same-source persistence suite (Film Layer node identity, front buffer untouched, pause never called; mutation-verified red/green).
No-flattening verified live against **hollowgrain** (curated/light, fluid, Fraunces, r16) and **isoldeglass** (custom/dark, liquid, sharp r0) — different layout, tokens, atmosphere, motion. Reduced motion live-probed: `delay 0s, duration 1e-05s, transform none`, film playing.
Eyes-on: both hero variants captured at 1440 under real themes (screenshots in session scratchpad `b3-shots/`); seed media are poster gradients, not live footage — motion itself still needs the D12 clips.
Gates: typecheck 0 · lint clean · 640/640 (630 on main + 10 new).
