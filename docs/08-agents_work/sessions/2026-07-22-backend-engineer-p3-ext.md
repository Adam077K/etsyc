---
date: 2026-07-22
role: backend-engineer
unit: P3-EXT (store-config contract extension, Wave 3 T0a)
tier: full
branch: feat/p3-ext
qa_verdict: pending
---
Both v1.3 additive fields landed on `feat/p3-ext` (typecheck + lint + 589/589 tests green; `schemaVersion` stays `"1.3"`, no bump): `clips[].focalPoint {x,y}` OPTIONAL with a 0.5/0.5 **renderer** default (never parse-injected — deliberately unlike the required `images[].focalPoint`; do not harmonise), and `hero-video.props.statement` ≤ 48 chars min 1, maker-authored, D10: absent → NO hero line, no craft-line promotion, no store-name substitute, no render-time fallback.
Non-breaking proof: regression test parses both pre-amendment fixtures (sena + custom) unchanged AND asserts identical round-trip (`result.config` deep-equals input); fixtures untouched on this branch. Renderer: statement takes the single hero slot when authored (display-hero, weight 500, tracking -0.01em per screen-specs §3.2); `focalPoint` drives `object-position` on the FilmFrame `<video>` and every clip-poster state via `components/media/focal-point.ts`.
Scope discipline: Amendment B item 3 (AA ship-blocker) was already merged on `fix/aa-muted-alpha` — not touched; `lib/engine/*`, `lib/tagging/*`, `globals.css` not touched (FILM-LAYER owns the film mechanism; this unit only lands the static crop + statement render).
Decision for QA: when `statement` is absent the pre-existing maker-NAME hero line renders unchanged (an identity line is not words attributed to the maker; removing it is B3's world-type treatment, not this contract unit).
