---
role: cpo
task: NARRATE_SHRINK narration-surface AC ruling
date: 2026-07-22
color: green
qa_verdict: n/a  # spec ruling, no code changes
tier: n/a
---

# CPO ruling — NARRATE_SHRINK narration surface

## The question

Design-critic could not pass NARRATE_SHRINK because "there is no visible product panel, product title, price, or CTA anywhere on the page." Two possible reads:
- (a) film-only — the film IS the narration; any product panel is B6's scope
- (b) film + panel — a product panel should render but doesn't

## The ruling: (a) film-only for the dock, and the product panel is B6's scope

NARRATE_SHRINK is a **two-unit compound state**:

1. **The docked film** — B5's scope. Film-only. Carries no type at all except captions. This is explicit in screen-specs §5.1: *"The dock carries no type at all except captions. Everything else — title, price, controls — lives in the product surface. A dock with a caption bar is a video player; a dock without one is the maker, still there."*

2. **The product surface** — **B6's scope**. Title, price, description, add-to-cart CTA, reviews. Renders around the docked film. This is what closes the buyer's loop.

The film is the narration; the maker's voice is what "narrates" the product. The dock is intentionally chrome-less so the maker stays a person and not a video player.

## Why the exclusion zone exists (answers half of the critic's sharpening)

The 340×200 exclusion zone at ≥1024 exists **exclusively to protect B6's CTA** — see screen-specs §5.3: *"This is a layout contract on B6 (product page), not a runtime collision check. Reserve the space; do not detect and dodge."* It is not reserving space for something B5 owes to render.

B5's `PRIMARY_CTA_MARKER = "data-primary-cta"` is the contract handle. B6 marks its primary CTA with that attribute; the layout reserves the zone; the dock never overlaps.

## Answering the dead-end objection directly

The critic is right that today, in the B4→B5 dryrun, tapping a product looks like a dead end — the film docks, narration swaps, nothing else changes. **That is because B6 hasn't been built yet.** It is not a B5 defect and not a spec gap.

NARRATE_SHRINK's promise is not "the film narrates and that's the whole interaction." Its promise is "the maker gets out of your reading path so you can read and buy the product **without losing the maker's voice**." The reading and the buying happen on B6's product surface. The maker's voice keeps playing in the dock.

Without B6, the interaction is genuinely a cul-de-sac. With B6, the loop closes:

- Buyer taps product → dock happens (B5) → narration swaps (B5) → product surface renders around the dock (B6) → buyer reads title/price/description (B6) → buyer taps add-to-cart (B6) → dock respects the exclusion zone (B5's contract, honored by B6's layout)

## Who owns what

**B5 owes** (all shipped per the brief):
- Film Layer FLIPs to corner rect at spec-locked geometry (§5.3)
- Narration clip swaps mid-flight via `useProductNarration` fallback chain
- Four non-blocking states, all indistinguishable from success per §5.4
- Exclusion-zone contract published via `dock-geometry.ts` (`DOCK_BANDS`, `exclusionZoneFor`)
- Primary-CTA marker contract published (`PRIMARY_CTA_MARKER = "data-primary-cta"`)
- Audio-only-pill collapse mechanism ready to wire when B6's CTA lands

**B6 owes** (upcoming wave):
- Product surface — title, price, description, add-to-cart CTA — rendering around the docked film
- Layout reserves the §5.3 exclusion zone at ≥1024 (340×200) and 768–1023 (260×155)
- Primary CTA marked with `data-primary-cta`
- On <768, the audio-only-pill collapse triggers when the CTA enters the viewport (`PRIMARY_CTA_MARKER` observer)

## The tablet concern

The critic flagged: at 768–1023, once B6's real body content exists, the dock may sit over non-reserved content until the exclusion zone is wired.

**This is exactly what the exclusion-zone contract is designed to prevent.** If B6 does not reserve the 260×155 zone at tablet, B6 has violated the contract — not B5. It does not change this ruling, but it does add a **hard AC to B6's spec** that must be gated by QA-Lead when B6 ships.

## Acceptance criteria to record

### B5 (this wave — already met, no change)

- AC-B5.NARRATE-1: On entering NARRATE_SHRINK, the persistent film FLIPs to the §5.3 corner rect for the current viewport band; the dock carries no type at all except captions.
- AC-B5.NARRATE-2: Narration for the tapped product is requested via `useProductNarration`; the engine's fallback chain (product-scoped → store-scoped → keep current clip) is honored; all three branches are visually indistinguishable to the buyer (no message, no different dock treatment).
- AC-B5.NARRATE-3: The exclusion zone contract (`DOCK_BANDS`, `PRIMARY_CTA_MARKER`) is exposed from `dock-geometry.ts` for B6's layout to consume.

### B6 (blocks B6 ship, does NOT block this wave)

- AC-B6.DOCK-1: The product surface renders around the docked film — title, price, description, and add-to-cart CTA are all present and interactive while the film continues playing in the dock.
- AC-B6.DOCK-2: At ≥1024, the product surface's layout reserves the 340×200 exclusion zone in the bottom-right corner; at 768–1023 the reservation is 260×155. Verified by an invariant test asserting no B6-owned content renders inside the zone.
- AC-B6.DOCK-3: The primary add-to-cart CTA carries `data-primary-cta`. Verified by unit test.
- AC-B6.DOCK-4: At <768, when an element bearing `data-primary-cta` enters the viewport, the dock collapses to the audio-only pill; the maker keeps narrating; the CTA is never occluded.

## Does this ruling change the answer

- **Blocks this wave?** No. B5 has done its job. The dryrun's "dead end" appearance is a B6-not-built artifact, not a B5 spec-compliance failure.
- **Design-critic can close the B5 gate** on this ruling, but should **not** be asked to sign off on the compound NARRATE_SHRINK + product-surface experience until B6 lands and honors the exclusion-zone contract.
- **Scope expansion?** None. The panel work goes into B6 where it already belongs.

## Decisions locked

- **`narrate_shrink_scope_v1`** — NARRATE_SHRINK's dock is film-only (captions only). The product surface (title, price, description, CTA) is B6's scope. The exclusion zone in §5.3 protects B6's CTA and reserves no space for anything B5 owes to render.
- **`b6_exclusion_zone_ac`** — B6's spec inherits a hard AC to reserve the §5.3 zone and mark its primary CTA with `data-primary-cta`. Gated by QA-Lead when B6 ships.

## Files read

- `docs/06-design/KOL-wave3-screen-specs.md` §5 (all)
- `docs/06-design/KOL-wave3-design-direction.md` §5 and §7
- `apps/kol/src/lib/renderer/useProductNarration.ts` (branch `integ/wave3-dryrun`)
- `apps/kol/src/lib/renderer/dock-geometry.ts` (branch `integ/wave3-dryrun`)

## Files written

- This session file only. No code changes.
