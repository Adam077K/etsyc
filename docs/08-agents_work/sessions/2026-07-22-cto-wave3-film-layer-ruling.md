---
role: cto
task: wave3-film-layer-ruling
date: 2026-07-22
tier: n/a (architecture ruling — no code)
qa_verdict: n/a
amends: docs/08-agents_work/handoffs/2026-07-21-wave3-dispatch-packet.md
---

- **Ruled for Design-Lead against my own §2E.** Read `HeroStage.tsx` / `StoreWorld.tsx` / `stages.ts` / `hero-persistence.test.tsx` / `FilmFrame.tsx` directly. Both its claims hold.
- Cross-tree: `HeroStage` sits inside `StoreWorld`, scoped to one `config`. Wave-0 persistence is proven only within ONE mounted store tree. Real FEED is `newestPerStore()` — N sibling cards, N stores. React cannot relocate a host node across trees; `view-transition-name` morphs snapshots, so a `<video>` shows a frozen frame.
- Src mutation: `<video src>` change runs the media load algorithm → readyState reset + black/poster flash. My B4 instruction ("change the src, never remount") was not physically satisfiable. A/B buffers at `--dur-swap` 120 ms is correct.
- My error was quoting `HeroStage`'s doc comment ("ready for the cross-route shared-element morph") as shipped capability. It is a forward-looking note.
- **New unit FILM-LAYER** (frontend-engineer, Full, T0a, ~400–600 LOC) — one player at app root, rect registry, A/B buffers, edge table, owns the Wave-3 motion tokens. Gates B1b/B2/B3/B4/B5. Brief 14 in the packet.
- Retiered: B2 Lite→**Full** (owns the cross-tree edge), B3 Lite→**Full** (900 ms three-band choreography). B4 and B5 stay Lite and get *simpler* — the swap and the dock FLIP move into FILM-LAYER.
- Endorsed CPO's AC reframing ("film frame never unmounts, never a paused or black frame") — stricter than the old element-identity wording, which permitted the black flash. Retired the old wording from B2/B3 or a worker would test for a single `<video>` node and fail a correct build.
- Also added **P3-EXT** (Full, T0a) for Design-Lead's two required store-config fields + the AA ship-blocker; motion tokens moved to FILM-LAYER to kill a 4-way `globals.css` conflict.
