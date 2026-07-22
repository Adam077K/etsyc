---
date: 2026-07-22
role: qa-lead
task: t0a-gate1 (KOL Wave 3, Gate 1)
tier: full
qa_verdict: BLOCK
baseline: main @ 383f06e
---

# QA-Lead — T0a Gate 1 verdict

**Overall: BLOCK — Gate 1 not cleared, T1 does not open in full.** Per-branch:
W2-WIRE **BLOCK** · FILM-LAYER **BLOCK** · P3-EXT **PASS** · SEED-W3 **PASS**.
**Partial merge authorized and required:** merge `feat/p3-ext` then `feat/seed-w3-worlds` to main NOW
(seed carries p3-ext ancestry — no rebase needed since P3-EXT merges unchanged). FILM-LAYER's fix cycle
depends on P3-EXT's `focalPoint` contract being on main. Fix cycle 1 of 2; re-review reads new diffs only.
All P1s independently verified by QA-Lead in code before ruling (locations cited inline).

## Adjudication — rear-buffer pause
**The architecture stands; the adversary's "BROKEN" is overruled as to the design and sustained as to one
reachable path.** Pausing the rear buffer at swapMs+80 behind an opaque playing front is unobservable and
correct — "never pause anything" is not required. But the mid-fade buffer-reuse path is real and I verified
it: `swapClip` picks `incoming = opposite-of-front` with no fade-in-flight guard, so a swap arriving during
the fade tail (B4 rail scrubbing) mutates the src of the still-visible fading-out buffer → media load
algorithm → visible black/frozen frame. That violates the unit's core AC. The FILM-LAYER reviewer's two
acceptance conditions are hereby made **binding**: reduced-motion collapses the 80ms margin to ~0, and
`visibilitychange` recovery resumes a paused front on tab return. All three fold into FILM-LAYER must-fix 4.

## MUST-FIX (strict — everything else rides)

**FILM-LAYER** (frontend-engineer, on `feat/film-layer` REBASED onto main after P3-EXT merges; the
FilmFrame.tsx conflict IS the focalPoint seam — resolve it as part of item 3):
1. **P1 same-slot FLIP zero delta** (`useFilmSlot.ts` claim() publishes before setActiveSlot measures;
   `publishRect` snaps the live slot). Make the claim path atomic: measure `first` → update slot rect →
   FLIP, with no intermediate snap; suppress rect-maintenance snap (incl. ResizeObserver publishes) while
   an edge transition is in flight, re-sync on transitionend. `data-film-edge` may only be written when the
   invert transform is non-identity — no false observable record. Regression test: SAME-slot edge with a
   changed rect asserts a non-zero invert transform (both existing FLIP tests use two slots — that gap is
   why 578 tests missed this).
2. **P1 z-order** — the z-40 fixed layer paints over the world-stage `h1` + craft line + `.kol-scrim`, a
   shipped Wave-0 visual guarantee, and pre-blocks B3's statement-over-film AC. Establish an explicit
   stacking contract (film below world-stage text/scrim) in globals.css tokens + a stacking-order test
   (jsdom can assert computed z-index/DOM order even though it cannot see paint).
3. **P1 focalPoint void** (qa + adversary, independent) — `FilmLayer.tsx` contains zero focalPoint/
   objectPosition handling and `swapClip(src, poster, captionsSrc)` cannot carry it, so CPO Ruling 3's
   protection never operates in production (every world mounts FilmLayerProvider → layer mode). Thread
   focalPoint through swapClip (or pass the clip object), apply objectPosition on BOTH buffers, forward
   from FilmFrame layer mode. Integration test: render via renderBlock WITH FilmLayerProvider, assert
   objectPosition on the visible buffer at a non-default focal point — the exact production path no test
   currently exercises.
4. **Pause conditions (binding per adjudication above):** (a) mid-fade reuse guard — a swap targeting a
   buffer still visible in a running cross-fade defers (latest-wins queue) until fade end; (b) reduced-
   motion margin ~0; (c) visibilitychange resume.

**W2-WIRE** (test-engineer on `feat/w2-wire-engine` — both fixes are test-layer):
5. **P1 F12 repeat** — `live-composition.test.ts:43-47` constructs the Supabase client in the describe
   body with `url ?? ""`; vitest executes describe bodies at collection even under `skipIf`, so keyless
   checkouts FAIL instead of skip (empirically reproduced by qa-engineer; pattern was flagged in Wave 2).
   Construct clients lazily (beforeAll or lazy getter). Do NOT touch main's 5 pre-existing instances here
   — they ride as G1-F11.
6. **P1 keyless invariant guard** — mutating `createEngineDeps` to hand `createAdminClient()` to
   `createEligible` fails zero keyless tests. Add a keyless unit test mocking `./anon` and `./admin`
   factories asserting eligible receives the ANON client and only the ranker receives service — mutation-
   sensitive to the admin swap. (Non-gating, fold while open: `.env.example` gains ENGINE_COOKIE_SECRET;
   `import "server-only"` in eligible.ts; min-length ≥32-byte secret guard.)

**MIG-TS** (database-engineer, NEW branch, **Irreversible, Founder sign-off** — second Irreversible
migration; T1 ENTRY GATE, not a T0a merge gate — precedent: Wave-2 MIG-CHECK ruling, "the harm needs a
read side" and the feed serves no traffic until B1):
7. **ONE migration, all 11 confirmed-exposed tables** (`videos, video_profiles, stores, store_versions,
   products, reviews, media, profiles, carts, commissions, threads`), **BEFORE trigger, not grant revoke**.
   One function `public.enforce_server_timestamps()` (match the shipped `guard_profile_role` idiom:
   `SET search_path=''`, schema-qualified) + 11 triggers `<table>_server_timestamps` BEFORE INSERT OR
   UPDATE: INSERT forces `NEW.created_at := now()`; UPDATE forces `NEW.created_at := OLD.created_at`;
   bypass ONLY `auth.role() = 'service_role'` (§B0 — never `uid IS NULL`). Why trigger: grant surgery
   needs table-revoke + per-column re-grant lists on 11 tables that silently break every future
   ADD COLUMN, and it rejects benign echo-back upserts that a trigger silently corrects. Why all 11:
   one Founder signature covers the whole confirmed exposure class; forcing server time cannot break a
   legitimate non-service write; re-opening Irreversible per-table later costs more. Pre-apply: assert
   zero rows with `created_at > now()`. Acceptance (live): authed INSERT dated 2099 stores ≈now(); authed
   UPDATE cannot alter created_at; service-role explicit created_at PRESERVED (seed regression — SEED-W3
   re-runs must stay idempotent). Closes adversary P1: cap at eligible.ts:48/200 is a membership gate and
   rank.ts:163 clamps future dates to permanent max freshness — verified.

## Merge-order ruling
1. `feat/p3-ext` → main (now). 2. `feat/seed-w3-worlds` → main (now; clean by ancestry). 3. FILM-LAYER
fix worker rebases onto main — gets focalPoint types, resolves the FilmFrame seam consciously under
re-review. 4. W2-WIRE fixes are engine-test-local — no ordering constraint vs 1-3; merges on re-cert.
5. MIG-TS applies to staging after Founder sign-off; merges post-apply+proof (C2 precedent).

## Maker-name divergence (`hero-video/index.tsx:114`)
**Does not block.** Two reviewers hold it correct for P3-EXT's scope and D10-defensible; the conflict is
design intent, on a surface B3 rewrites. It is a REQUIRED B3-brief input: CPO + Design-Lead issue a written
ruling (line removed vs statement-replaces-it) in DECISIONS.md BEFORE B3 dispatch. If unresolved at T1,
B3 alone is held — the other five T1 units are not.

## T1 entry conditions
- **E1:** FILM-LAYER re-certified (items 1-4, new diff read) — gates B1b, B2, B3, B4, B5.
- **E2:** W2-WIRE re-certified (items 5-6) — gates B1a, B2-B5, B8.
- **E3:** P3-EXT + SEED-W3 on main (cleared above).
- **E4:** MIG-TS Founder-signed + applied to staging + acceptance proof — gates **B1a dispatch** and any
  feed-serving surface at Gate 2. B2-B5/S8 may dispatch on E1+E2 alone (they don't read the exposed gate).
- **E5:** B3 additionally needs the maker-name ruling (above).
- Max 2 fix cycles; a third BLOCK on either branch escalates to CEO.

## RIDES-AS-FOLLOW-UP (ordered)
- G1-F1 park-without-pause — decoder runs all session while parked (frontend-engineer)
- G1-F2 cross-aspect FLIP distortion (4:5→16:9 smear) — P2 now, but it sits ON B2's flagship grow edge:
  re-examined at Gate 2 with B2; becomes P1 there if unaddressed (frontend-engineer)
- G1-F3 registerFilm adopt path (frontend-engineer)
- G1-F4 same-source cross-fade guard mutation-unpinned (test-engineer)
- G1-F5 createDefaultDeps/createEligible wrong-client reachability — locked signature stays (Wave-2
  contract); mitigate via doc + lint, not API removal (backend-engineer)
- G1-F6 seed config↔DB tag divergence test (test-engineer)
- G1-F7 OQ-2 guard checks existence only, never same-store ownership — required before S1 (Wave 4)
- G1-F11 F12 sweep: 5 pre-existing module-scope-client suites on main — required before CI wiring
  (test-engineer; carries Wave-2 F12)

## HELD / do not re-litigate
Thankyou invariant at all three layers ("best-defended invariant in the codebase") · no silent HMAC
fallback · statement never AI-fabricated, D10-defensible · focalPoint injection-proof (x*100 ToNumber) ·
server-only genuinely build-time · 36 SVGs + 20 MP4s clean · seed role-claim least-power · clip→store map
0 dangling/0 cross-store · four worlds genuinely differ (D15) · composition suite real, predicate-by-
predicate · AC split structurally enforced · edge table faithful · spring maths correct · anon-invisibility
at RLS · SCOPED_CANDIDATE_CAP not exploitable (`.eq(store_id)`).

## Panel record
adversary ADVERSARY-BLOCK · code-reviewer(FILM-LAYER) REVIEW-BLOCK · qa-engineer COVERAGE-BLOCK ·
code-reviewer(W2-WIRE/P3-EXT/SEED-W3) REVIEW-PASS · security-engineer SECURITY-PASS ×4. Panel spawned
out-of-band by CEO; QA-Lead adjudicated on evidence verified in code, not on reports. Reviewer-disagreement
rule (most-paranoid wins) applied to the pause path and resolved on the merits above.
