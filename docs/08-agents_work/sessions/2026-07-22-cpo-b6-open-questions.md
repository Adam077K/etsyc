---
role: cpo
task: Rule on the five B6 open questions from CTO's dispatch packet
date: 2026-07-22
color: green
qa_verdict: n/a  # rulings, no code changes
tier: n/a
base_commit: 2abb982  # main
---

# CPO ruling — B6 open questions

## Context that shaped this pass

- Wave 3 T1 is merged; buyer spine runs feed → grow → world → browse → narrate,
  934 tests green. B6 is what closes the loop.
- **Correction to my prior ruling** (`2026-07-22-cpo-narrate-shrink-ac.md`):
  I wrote *"B5 shipped the mechanism; B6 supplies the trigger element."*
  Direct code inspection says otherwise. B5 shipped only the **contract**
  (`PRIMARY_CTA_MARKER`, `DOCK_BANDS`, `exclusionZoneFor`). The pill
  affordance itself has zero symbols in `FilmLayer.tsx`. The mechanism is
  unbuilt. That is the substance of OQ #4 and it changes scope, not intent.
- The invariant that binds every ruling below: **the film must never stop.**
  §5.1 governs the dock — *"a dock with a caption bar is a video player;
  a dock without one is the maker, still there."* B6 renders *around*
  that persistent film. It does not pause it, remount it, or portal
  chrome over it.

## OQ #1 — Cart storage — **RULING: (a) client-side, sessionStorage** (DISPATCH-CLEAR)

The product question is *what does "add to cart" promise?* For Wave 3 T2,
it promises "I have marked this to buy on this device, in this session,
without leaving the maker's world." That is the buyer-loop scope. It is
not "your cart follows you across devices" and it is not "we will email
you when you abandon it." Those are commerce-completeness features and
they belong to Wave 4+.

Three converging reasons for (a):

1. **Schema intent.** `carts` has no `cart_items` table. `create_order(store_id,
   items jsonb)` takes items directly. The schema was designed to treat
   cart as scratch space. Building `cart_items` now works against that
   intent for MVP-demo value we don't need.
2. **Risk tier discipline.** (b) upgrades the whole dispatch to
   Irreversible + Founder sign-off for a feature no MVP-demo buyer will
   test. Wrong scope for a Wave-3 close-the-loop unit.
3. **Reversibility.** (a) does not foreclose (b). When Wave 4+ adds
   cross-device carts or abandoned-cart recovery, the migration goes in
   with clear user demand and clear metrics. We ship the demo now; we
   earn the migration later.

**What (a) costs** — and what I am explicitly recording as future ACs, not
pulling forward:

- **Future AC (Wave 4+):** cart survives device switch (requires
  `cart_items` migration + auth-required cart persistence).
- **Future AC (Wave 4+):** abandoned-cart recovery emails (requires
  server-side cart state + Resend wiring).

Both go in `docs/BACKLOG.md` under "Wave 4+ commerce completeness" — do
not touch B6 or B7 scope.

**Dispatch impact:** U-B ships as Lite. Whole dispatch stays Lite
(with the U-C caveat below).

## OQ #2 — Post-add-to-cart behavior — **CONFIRM CTO: (c) toast + inline "N in cart" pill**

Confirming. The reasoning is exactly the film invariant: navigating to
`/cart` yanks the buyer out of the maker's world and severs the maker's
voice — the very sever we spent two waves engineering around. A toast
plus a persistent "N in cart" affordance on the product surface keeps
the maker's voice as a continuous companion through the "I am considering
buying" moment.

`/cart` route creation belongs to B7. Not B6.

**Design-Lead owns:** exact visual treatment of the toast (duration,
placement respecting the exclusion zone at ≥1024, position relative to
the dock at <768), the inline "N in cart" pill's typography and
iconography, and the interaction between the two when the toast is
already visible and the buyer taps again. Route through CTO's Design-Lead
inside U-D as the ATC unit lands.

**Recorded as B6 AC:**
- **AC-B6.CART-1:** After a successful add-to-cart, the buyer stays on
  `/w/[handle]/p/[productId]`. A toast confirms the add and dismisses
  automatically. An inline "N in cart" affordance appears on the product
  surface and persists across further adds. No navigation, no page reload,
  no film pause. Verified by Playwright.

## OQ #3 — Reviews block — **CONFIRM CTO: render with `entries={[]}`**

Confirming. The four-states mandate is not decorative this wave — it is
load-bearing. A fail-safe path that is never exercised in the built
product looks identical to a working feature, and we already paid the
cost of that lesson twice (seed worlds shipped in the wrong typeface
because the empty state was never rendered).

Render `ReviewsBlock entries={[]}`. The empty state must be a warm
invitation, not an apologetic "no reviews yet" — the block's existing
empty state should be visually inspected during U-A's Design-Lead pass
to confirm it reads as invitation, not absence. If it does not, that is
a `ReviewsBlock` polish task inside U-A's scope, not a new unit.

**Recorded on the existing AC-B6.DOCK-1** — the reviews block is one of
the "compound state" pieces that must be present and visible on
first paint.

## OQ #4 — Pill affordance ownership — **RULING: U-C stays in B6, additive-only** (DISPATCH-CLEAR)

This is the one that needed the most thought.

The correction changes the *scope* of the work, not its *placement*.
The affordance and the trigger form a paired mechanism — a pill without
a trigger is inert; a trigger without a pill has nothing to swap to.
They can only be tested end-to-end. A separate B5 fast-follow cycle
buys us a clean dispatch boundary and costs us a wave-cycle for a
mechanism that has no independent meaning. That is the wrong trade.

**Ruling: U-C ships inside B6.** With four load-bearing constraints:

1. **Additive-only to `FilmLayerApi`.** U-C extends the API with
   `setCollapseMode(mode: "dock" | "pill"): void`. It does **not**
   modify any existing method signature, does not remove any export,
   does not change any existing type. Existing consumers of
   `FilmLayerApi` compile unchanged.
2. **Non-pill paths byte-identical.** Every existing test in
   `FilmLayer.tsx`'s suite must remain byte-identical in outcome. If
   any pre-existing test needs to change, U-C is doing something
   wrong — return BLOCKED, do not "fix" the tests. The Wave-3-core
   file has been byte-identical across every branch all wave and that
   property is load-bearing (Gate-2 handoff line, canon-drift oracle
   rule).
3. **Counterparty-mounted tests.** Every U-C unit test that verifies
   the pill mechanism must mount both `FilmLayer` and a fake trigger
   element. Never construct the counterparty inside the test — that's
   the "matching identifiers, divergent semantics" lesson locked in
   DECISIONS 2026-07-22.
4. **QA-Lead may upgrade U-C to Full at their discretion.** The blast
   radius of Wave-3-core changes is theirs to judge. If they upgrade,
   only U-C moves — the rest of the dispatch stays Lite. Do not argue
   the tier back down.

I am also correcting my earlier AC list. `AC-B5.NARRATE-3` said B5
"exposes the exclusion-zone contract" — which is true and remains met.
But the accompanying prose *"B5 shipped the audio-only-pill collapse
mechanism ready to wire when B6's CTA lands"* was wrong. B5 shipped
the contract; B6's U-C builds the mechanism; B6's U-E wires the
trigger. Recording that correction in the decisions block below.

## OQ #5 — Trust badge — **CONFIRM CTO: keep inline chips**

Confirming. The existing inline chips in `product-detail` satisfy the
AC ("an inline compact trust-badge") and swapping to the `trust-badge`
block variant introduces duplicate-block-instance ambiguity for zero
buyer-visible gain. Simpler is better when the outcome is the same.

If a future wave wants to unify trust presentation across product
surfaces and world blocks, that is a design-system consolidation task
for Design-Lead, not a B6 scope decision.

## Summary — dispatch state after these rulings

| Unit | Ruling | Tier |
|---|---|---|
| U-A route + surface | Ships as planned; render `ReviewsBlock entries={[]}`; keep inline trust chips | **Lite** |
| U-B cart | Client-only sessionStorage per (a); Wave 4+ carries the DB migration | **Lite** |
| U-C pill affordance | Ships inside B6 with 4 constraints above | **Lite** (QA-Lead may upgrade) |
| U-D add-to-cart wire | Ships per CTO plan; post-add pattern is toast + inline pill; Design-Lead owns visual | **Lite** |
| U-E pill trigger | Ships as planned | **Lite** |
| U-F test suite | Ships as planned; ACs include the new AC-B6.CART-1 | n/a |
| ~U-G model3d_id~ | Do not include — separate dispatch cycle, S8 scope | Irreversible (not now) |

**Whole dispatch is dispatch-clear.** Both blocking OQs (#1, #4) have
decisive rulings.

## Full B6 AC list (post-ruling)

Superseding the four-item list in the prior session:

- **AC-B6.DOCK-1:** Product surface renders around the docked film —
  title, price, description, add-to-cart CTA, reviews block (empty state
  acceptable), inline trust chips — all present and interactive while the
  film continues playing.
- **AC-B6.DOCK-2:** ≥1024 reserves 340×200 exclusion zone bottom-right;
  768–1023 reserves 260×155. Invariant test asserts no B6-owned content
  intersects the zone.
- **AC-B6.DOCK-3:** Primary add-to-cart CTA carries `data-primary-cta`
  (imported from `dock-geometry.ts`, never hard-coded).
- **AC-B6.DOCK-4:** <768, when `data-primary-cta` enters the viewport,
  dock collapses to the audio-only pill; the video element's `paused`
  stays `false` across the transition; the CTA is never occluded.
- **AC-B6.CART-1** *(new — from OQ #2 ruling):* After a successful
  add-to-cart, the buyer stays on the product page. A toast confirms
  and auto-dismisses. An inline "N in cart" affordance appears and
  persists. No navigation, no reload, no film pause.

## Decisions locked

- **`b6_cart_storage_v1`** — Cart is client-only sessionStorage for
  Wave 3 T2. `cart_items` table and abandoned-cart recovery are Wave 4+
  and go in `docs/BACKLOG.md` as future ACs. Reversible: adding the
  migration later strictly extends this decision, does not overturn it.
- **`b6_post_add_ux_v1`** — Post-add-to-cart, buyer stays on page.
  Toast + inline "N in cart" pill. `/cart` route belongs to B7.
- **`b6_reviews_empty_state_v1`** — B6 renders `ReviewsBlock entries={[]}`
  so the empty state is exercised at first paint. Fail-safe paths must
  be visible or they are indistinguishable from working features.
- **`b6_pill_affordance_ownership_v1`** — Pill affordance (U-C) ships
  inside B6 dispatch, additive-only to `FilmLayerApi`, all existing
  FilmLayer tests byte-identical, counterparty-mounted tests, QA-Lead
  discretion to upgrade U-C to Full.
- **`b6_trust_badge_v1`** — Inline chips in `product-detail` are the
  trust-badge implementation for B6. Do not swap in the `trust-badge`
  block variant.
- **`ac_b5_narrate_3_correction`** — Prior wording *"B5 shipped the
  audio-only-pill collapse mechanism ready to wire when B6's CTA lands"*
  was wrong. B5 shipped the contract (`PRIMARY_CTA_MARKER`, `DOCK_BANDS`,
  `exclusionZoneFor`). The mechanism is built by B6's U-C; the trigger
  is wired by B6's U-E. AC-B5.NARRATE-3 (contract exposure) remains met;
  the prose promising a shipped mechanism is retracted.

## Files read

- `docs/08-agents_work/sessions/2026-07-22-cto-b6-plan.md`
- `docs/08-agents_work/sessions/2026-07-22-cpo-narrate-shrink-ac.md`

## Files written

- This session file only. No code, no spec edits — spec updates land
  when the dispatched work returns and the ACs are proven.
