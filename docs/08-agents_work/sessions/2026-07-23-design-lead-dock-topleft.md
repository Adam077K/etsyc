---
role: design-lead
task: kol-dock-topleft
branch: feat/kol-dock-topleft
commit: 21bf028
qa_verdict: PENDING
tier: lite
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
