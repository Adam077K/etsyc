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
  value chip. _Runtime-verified wave 4:_ mounted and rendered — `.bg-olive`
  measures `width 1440, left 0` on the live feed (full-bleed). A prior "not
  visible" audit was a false negative from a non-scrolled capture where the
  tiles/spreads `whileInView` (opacity-0) never animated in; scroll-through
  screenshot confirms it.
- **[wave 3, `4e176d2`] Full-bleed spreads.** QuoteSpread + StatSpread now break
  edge-to-edge (`-mx-5 sm:-mx-8`, no card) for the magazine "spread" feel.
  _Runtime-verified wave 4:_ `.bg-plum` and `.bg-clay` both measure `width 1440,
  left 0` on the live feed — genuinely edge-to-edge, not rounded cards.
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
- **Feed media enrichment (more clips/images).** _[wave 5, 2026-07-23] Deferred by
  ruling C._ Network egress is blocked (no stock downloads), every image in
  `public/media/` is already referenced (no unused assets), and the v1 archive
  seed videos have no license/provenance record so they cannot be CREDITS'd
  honestly. The only clean local option was derived crops of already-used images
  (cross-context déjà-vu risk the CREDITS ledger guards against) — judged not
  worth it for marginal density. Resolve with the Founder's own footage drop
  (per the "replace with KOL's own footage before launch" note in
  `public/media/CREDITS.md`) or a Founder-supplied licensed stock batch with
  source URLs → then a clean additive pass with full CREDITS rows.

## Motion / interaction
- _(Hover blurb reveal reworked to clip-path/transform — see Applied.)_

## Wave-4 QA-gate carry items (2026-07-23, critic PASS-with-notes)
- **World page mid-scroll dead zone (`/m/[slug]`, desktop).** At ~600px scroll the
  left column shows ~400px of empty ink between the hero subtitle and the body
  bio. The scroll cue is now visible on all viewports (wave 4), but the void
  itself remains. Options: pull the bio up, add a scroll-triggered pull-quote in
  the left column, or bridge with an anchored imagery element.
- **Seller workspace active-chip variant.** Buyer surfaces correctly use marigold
  active chips; sell/clips "All 9" (and possibly sell/orders, sell/messages)
  uses an ink-soft/dark fill. Either align seller chips to the marigold fill or
  document a deliberate seller-workspace chip variant in DESIGN.md (a
  seller-chip rationale exists in DECISIONS.md — reconcile the two).
- **Checkout mobile 375px: residual right-edge field clipping (10–15px).**
  Cosmetic remnant of the P1-A fix; not a blocker.

## Integration carry items (2026-07-24)
- **LiquidDivider still renders on journal-index + how-story.** The Founder's blob
  removal was scoped to home (`/`) + the feed only; `journal-index.tsx` and
  `how-story.tsx` still render `LiquidDivider` (defined in `liquid.tsx`). Left
  intentionally — post-pitch call on whether to strip it site-wide or keep it as
  a journal/how accent. No action now.
- **Make-reel first card image passes under the portrait dock.** The persistent
  corner film overlaps the leftmost reel card's *image* corner as the strip
  scrolls (copy clears). Confirmed HOLD by the critic delta-pass (imagery-under-
  fixed-film is the established behavior, narrower than the old landscape card).
  Reopen with a desktop reel left-inset only if the Founder reads it wrong.

## Copy / IA / a11y polish
- **[Etsy skin, a11y] Focus ring on bone grounds is under the 3:1 floor.** The
  `#FF7A3C` (Etsy Orange-bright) focus outline measures ~2.09:1 on bone (improved
  from ~1.61:1 with the old bright, still below the WCAG 3:1 non-text floor).
  On ink grounds it passes comfortably; only bone-ground focus states are affected.
  Fix: give `:focus-visible` a darker/denser ring token (or an ink outline) when
  the ground is bone. Non-blocking (finish-reviewer advisory).

## Perf
- **[deep world] Code-split TwoDotsWorld.** `src/components/twodots-world.tsx` is
  imported statically by the shared `/m/[slug]` route, so its bespoke weight ships
  in every maker world's chunk. Wrap it in `next/dynamic` (client component, no
  SSR concerns for the film driver) so only `/m/two-dots` loads it. Reviewer
  suggestion on feat/kol-sharon-world-deep; non-blocking.
