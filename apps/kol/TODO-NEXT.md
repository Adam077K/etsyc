# KOL — Next-pass backlog

Deferred polish, logged rather than left as UI cruft. Pick up before/alongside
the next pages. Items below are the Discovery Feed backlog from the 2026-07-22 QA
gate (design-critic + impeccable-finish-reviewer) unless noted otherwise.

## Applied
- **[2026-07-22, arc 1] Liquid divider phase.** Gold blobs now run the inverted
  cy phase `[20, 27, 14, 20]` so the goo seam pinches/billows from frame one
  (design-critic polish) — done in `liquid.tsx`.

## Design / content
- **Olive values spread + surface the dead `values` data.** Every `Maker` carries
  a `values[]` array (e.g. "Woman-owned", "Natural dye") that nothing renders yet.
  Add an olive-ground "Shop by your values" spread (Faire pattern) and/or small
  value chips on tiles.
- **Full-bleed spreads.** QuoteSpread / StatSpread are rounded cards inside the
  grid. Consider breaking them full-bleed edge-to-edge for a stronger magazine
  "spread" feel.
- **Humans-in-frame for product-only tiles.** A few tiles (jewellery, some
  ceramics) are objects with no maker face. Kotn's "people lead every frame"
  wants a maker portrait paired in or swapped where possible.

## Motion / interaction
- **Rework the hover blurb reveal to transform/clip.** EditorialTile currently
  reveals the blurb via `grid-rows: 0fr → 1fr` + margin (layout-animated).
  Re-implement with `clip-path`/`transform` + opacity to stay off the layout
  thread. NOTE: protect the *look* — the serif ink-in + marigold underline wipe
  is the page's best-loved moment; only change the mechanism.

## Copy / IA / a11y polish
- **CTA copy/anchor mismatch.** Hero "How KOL works" links to `#feed`; either
  give it a real explainer target or rename it.
- **Sticky rail magic number.** Feed filter rail uses `top-[68px]` (the masthead
  height). Promote to a CSS var shared with the masthead so they can't drift.
- **Scroll cue as a real link.** The hero ↓ cue is decorative; make it a
  keyboard-navigable link to `#feed`.
