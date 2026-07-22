---
role: frontend-engineer · task: b5-narration-shrink (KOL Wave 3, T1) · date: 2026-07-22 · tier: lite
branch: feat/b5-narration-shrink · status: COMPLETE (awaiting QA-Lead)
---
Rect-only unit, as amended: the dock FLIP stays FILM-LAYER's — B5 replaced ONLY the corner-rect computation in `HeroStage.stageSlotSpec` with the §5.3 exclusion-zone geometry (`dock-geometry.ts`: 320×180 ≥1440 / 280×158 ≥1024 / 240×135 ≥768 bottom-right · 200×112 bottom-centre <768; zones 340×200 / 260×155; <768 CTA rule = pill-collapse contract, `PRIMARY_CTA_MARKER` fixed for B6). Inset is 16px (`--space-2`): §5.1's --space-3 breaks the binding §5.3 zones (320+24=344>340) — invariant test pins dock+inset ⊆ zone.
Fallback chain built as the PRIMARY path (P7 dark): `selectNarration` server action (first engine consumer — mints `kol_sid`, fixes ring cookie name `kol_film_ring` in `lib/narration/cookies.ts`, binding on B1/B6) + `useProductNarration` in StoreWorld. Engine owns the chain; empty/error → persistent clip plays on, §5.4-indistinguishable; ONE quiet auto-retry; stale results generation-guarded so a late clip never overwrites an undocked film. `data-narration` attr = QA hook.
Required proof test green: no-match keeps the SAME front video element, same src, zero pause calls, docked at the §5.3 rect, no error text. Plus success cross-fade, retry-then-fallback, stale-after-undock, null-productId pass-through; geometry table + boundary suite.
Gates: typecheck 0 · lint clean · 659/659 (29 new across 3 files). No new deps; FilmLayer.tsx / hero-persistence.ts / lib/engine untouched.
