# KOL — Post-Pitch Handoff (2026-07-25)
*State of the product after the HLV × Etsy pitch (Fri Jul 24, Columbia). Read this + `docs/KOL-START-HERE.md` before any new KOL work.*

---

## Where everything is

- **Production:** https://kol-demo.vercel.app = `main @ 22e0551` (42 static pages). Promote is Founder-run: `cd .worktrees/kol-deploy/apps/kol && npx vercel --prod`. Preview URLs are behind Vercel SSO (team-only); production is public.
- **main tip at close:** `f3ba42a` (docs). All product work through the face-forward hotfix is merged and pushed.
- **What shipped (Jul 23–24, "the train"):** 14 QA-gated branches + Founder live-walkthrough directives, assembled on `feat/kol-integration`, merged as `65c74a7`, clearance `968fd3d`, hotfix `22e0551`. Fifteen 2-reviewer gates + a gate-16 delta pass; every verdict in the session files (`docs/08-agents_work/sessions/2026-07-2{3,4}-*`).
- **The experience:** `/etsy` (Etsy-replica entry, noindexed, honesty footer) → discovery feed (Sharon leads, audible via the sound chip — audio rides the persistent FilmStage through the whole journey) → her bespoke world (film interlude, make arc, wall, commissions) → product → checkout → thank-you. Seller side: `/sell` mirror landing → interview (keep-listed) → studio (Draft→Yours) → publish ("Opening day") → home (workshop desk) → orders → clips/capture ritual. Store dock = vertical portrait card top-left; checkout/thank-you = landscape face-band bottom-right.

## Governance state (authoritative: `apps/kol/CREDITS.md`)

- Two Dots public demo clearance was recorded BY THE FOUNDER personally (commit `968fd3d`, Founder-executed script — agents and CEO were classifier-blocked, correctly). Faceless framing only; `workshop.jpg` held at `apps/kol/internal-assets/` (outside the deploy bundle); the little-girl-face video was never ingested and remains never-ingest.
- **STILL OPEN (Founder):** (1) archive Sharon's written confirmation covering the children's faceless imagery; (2) the discovery cut's AUDIO row is still "pending Founder confirmation" — Sharon/Debbie narration per captions; if a child is ever heard, strip the AAC track (one command, sound UX survives); (3) `workshop.jpg` original stays internal unless Sharon explicitly OKs that image; (4) the TWO DOTS (2).mp4 kids-costume showcase (≥6 identifiable children) is unusable without guardian permissions — the footage to ask Sharon about if the costume showcase is ever wanted.

## Open items / backlog

- `apps/kol/TODO-NEXT.md` is the live backlog (dead-zone, seller-chip doc reconciliation, focus-ring override doc, LiquidDivider on journal//how (Founder call), make-reel image-under-dock HOLD, next/dynamic split for TwoDotsWorld, per-maker filmFocal generalization, site-footer RM hydration warning).
- Founder asset asks (post-pitch): Sharon's caption-free video export (the felt-costume-to-camera tail belongs on her world hero); "1–2 weeks" turnaround confirm (copy softened to "cut and stitched to order"); licensed stock batch w/ source URLs if feed density is wanted.
- Product future: the real build (Supabase auth, DB migration plan — still Founder-gated) per `docs/03-system-design/KOL-MVP-master-plan.md`.

## How this team runs (proven playbook)

CEO orchestrates only; design-lead builders (opus) in worktrees off origin/main with hard territory maps; every branch gets a 2-reviewer gate (design-critic + impeccable-finish-reviewer) with consolidated fix batches and focused re-verifies; CEO adjudicates reviewer splits and copy honesty (no fabricated metrics/claims — ever); merge trains assemble on an integration branch with pre-agreed conflict rules; the classifier gates child-imagery/legal assertions to the Founder's own hand — never route around it. Messages cross constantly: always re-point agents at inbox msg IDs.
