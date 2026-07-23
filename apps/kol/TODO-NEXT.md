# KOL — Next-pass backlog

Deferred polish, logged rather than left as UI cruft. Pick up before/alongside
the next pages. Items below are the Discovery Feed backlog from the 2026-07-22 QA
gate (design-critic + impeccable-finish-reviewer) unless noted otherwise.

## Applied
- **[2026-07-22, arc 1] Liquid divider phase.** Gold blobs now run the inverted
  cy phase `[20, 27, 14, 20]` so the goo seam pinches/billows from frame one
  (design-critic polish) — done in `liquid.tsx`.
- **[2026-07-23, cleanup] Sticky rail magic number.** Promoted to the
  `--header-h` CSS var on `:root`; feed + browse sticky rails and the sign-in
  pane now share one source of truth (globals.css).
- **[2026-07-23, cleanup] Scroll cue as a real link.** The hero ↓ cue is now a
  keyboard-navigable `<a href="#feed">` with a focus ring (hero-spread.tsx).
- **[wave 2] CTA copy/anchor mismatch.** Hero "How KOL works" now links to the
  real `/how` explainer (hero-spread.tsx).
- **[wave 3, `4e176d2`] Olive values spread + surface the dead `values` data.**
  Shipped as `values-spread.tsx` (olive "Shop by your values" spread wired into
  the feed at index 6, drives a real value filter); object tiles also carry a
  value chip.
- **[wave 3, `4e176d2`] Full-bleed spreads.** QuoteSpread + StatSpread now break
  edge-to-edge (`-mx-5 sm:-mx-8`, no card) for the magazine "spread" feel.
- **[wave 3, `4e176d2`] Hover blurb reveal → transform/clip.** EditorialTile now
  reveals the blurb via `clip-path` + `transform` + opacity (absolutely
  positioned, off the layout thread); the serif ink-in + marigold underline wipe
  are preserved. Verified visually in wave 4.
- **[wave 4, `2379f58`] Collapsed film-cue collision @375–430px.** The persistent
  "Now playing" cue clipped the product H1 tail on phones; it now shrinks to a
  round play control below `sm` (labelled pill unchanged at `sm+`).

## Design / content
- **Humans-in-frame for product-only tiles.** A few tiles (jewellery, some
  ceramics) are ObjectTiles with no maker face. Kotn's "people lead every frame"
  wants a maker portrait paired in or swapped where possible.
  _Wave 4 note — deliberately still open._ Cannot be solved honestly with the
  current `public/media/` assets: the only human/hands stills
  (`clay-wheel.jpg`, `woodwork.jpg`, `maker-*.jpg`, `sabine.jpg`, `amara.jpg`)
  are already the identity of *other, specific* synthetic makers, so reusing one
  on a different maker's object tile would misattribute a face (dishonest per the
  labelled-fixture rule). And the ObjectTile "product on a color field" is a
  design-locked beat, so structurally pairing in a second portrait changes the
  system rather than its execution. Resolve with real per-maker footage/portraits
  when they arrive, or a from-scratch dual-frame ObjectTile variant — not by
  borrowing another maker's face.

## Motion / interaction
- _(Hover blurb reveal reworked to clip-path/transform — see Applied.)_

## Copy / IA / a11y polish
- _(All prior items in this section applied — see Applied above.)_
