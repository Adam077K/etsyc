---
role: design-lead
task: kol-dock-topleft
branch: feat/kol-dock-topleft
commit: bed8365
qa_verdict: PASS
tier: lite
---

## FREEZE BATCH — commit bed8365 (critic gate-7 PASS-with-notes + queued one-liner)

1. Checkout corner on route entry: anchor bottom-right origin in an isomorphic LAYOUT
   effect (before first paint) so a film arriving visibly top-left (expanded PiP / world)
   never paints over the "Checkout" H1. Verified from the earliest arrival frame.
2. TwoDots idea H2 cleared at xl (commit c1d81f0): xl top clearance moved to the whole
   left column so kicker + H2 + prose shift down as one; headline no longer under the dock.
3. Thank-you "Back to the feed" CTA: xl right-clearance on the card pulls it clear of the
   bottom-right dock (dock floats over the empty right of the olive panel).
4. Thank-you origin now reads dockAnchor("bottom-right") — film-geometry sole corner owner.
Gates: build OK · typecheck · detect · e2e 4/4. Critic notes (top-left = editorial folio;
product chip-over-breadcrumb = keep) acknowledged. Branch ready to freeze.

---

## RULING APPLIED (Option A) — commit 1fac1bd

Store (maker world + product + twodots) docks TOP-LEFT; checkout + thank-you keep the
pre-directive BOTTOM-RIGHT dock. Single-sourced via `DockCorner` + `dockAnchor` in
film-geometry; FilmIntent.dockCorner drives corner-aware crop direction in film-stage.
In-store gutters (xl only): world process left safe-lane (header + cards clear); twodots
IdeaSection prose top clearance. Product breadcrumb: film cue nudged below the breadcrumb.
Re-sweep 375/414/768/1440: checkout h1 + form clear at every width (wave-4 regression
resolved); world/twodots overlaps cleared at xl. Gates: build OK · typecheck · detect ·
e2e 4/4. Residual (matches main): thank-you "Back to the feed" CTA sits near the bottom-
right dock at full scroll; twodots hero h2 tail sits under the dock (out of ruling scope).

---


# Dock TOP-LEFT (Founder directive)

Moved the persistent FilmStage dock from bottom-right to top-left across all buyer routes.
Geometry only (transform/opacity/clip, uniform scale, one node, no remount). Dock clears the
KOL masthead via `--header-h` (never hardcoded, SSR-safe 72px fallback); portrait-phone crop
now trims OFF THE BOTTOM so the landscape card sits flush top-left.

Gates: typecheck clean · detect clean · film-continuity e2e 4/4.
Watch-points 1 (masthead clear), 2 (chip/cue reposition), 4 (twodots re-dock), 5 (e2e) MET.

Watch-point 3 (collision sweep) SURFACED REAL OCCLUSIONS — top-left dock lands over left-column
content on desktop. CRITICAL: checkout (h1 @1440; Address field + label @768/414/375 — regresses
the wave-4 "dock over address fields" P1). SHOULD-FIX: twodots IdeaSection prose (@1440),
world first process card (@1440). MINOR: product breadcrumb clip, thank-you "Order summary" label.
CLEAN: mobile world, mobile thank-you, product h1/price rail. Needs a Founder direction ruling —
reported to team-lead. Not merged.
