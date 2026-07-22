---
role: backend-engineer
task: B1a — discovery-feed data layer + public-route enablement
date: 2026-07-22
branch: feat/b1a-feed-data
tier: full
status: PARTIAL — code complete, ENGINE_COOKIE_SECRET unprovisioned
---
/feed reclassified public (routes.ts + middleware; parseSameOriginPath untouched, both QA vectors re-proven). lib/feed/select.ts serves FEED via createEngineDeps only; one anon stores read joins maker identity (displayName/craft/place/avatar/focalPoint). Session id = proxy-minted `kol_sid` UUID cookie; ring cookie read-only in RSC (server.ts idiom). Live staging suite: 4 seed worlds one-card-each, thankyou structurally excluded, same-session order stable, unpublished clip invisible even to its signed-in seller. Gates: typecheck 0, lint 0, tests 648/648. Resume: provision ENGINE_COOKIE_SECRET, then the live route serves cards instead of the error state.
