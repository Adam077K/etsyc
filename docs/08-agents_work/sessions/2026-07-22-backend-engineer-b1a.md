---
role: backend-engineer
task: B1a — discovery-feed data layer + public-route enablement
date: 2026-07-22
branch: feat/b1a-feed-data
tier: full
status: COMPLETE — secret provisioned, live route verified end to end
---
/feed reclassified public (routes.ts + middleware; parseSameOriginPath untouched, both QA vectors re-proven). lib/feed/select.ts serves FEED via createEngineDeps only; one anon stores read joins maker identity (displayName/craft/place/avatar/focalPoint). Session id = proxy-minted `kol_sid` UUID cookie; ring cookie read-only in RSC (server.ts idiom). Live staging suite: 4 seed worlds one-card-each, thankyou structurally excluded, same-session order stable, unpublished clip invisible even to its signed-in seller. With ENGINE_COOKIE_SECRET provisioned the real route serves 200 + 4 maker cards (all four seed worlds), same-sid order stable, tampered kol_ring fails closed, fresh session reshuffles. Gates: typecheck 0, lint 0, tests 648/648.
