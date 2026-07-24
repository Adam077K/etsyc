# Long-Term Memory
*Cross-session facts: user preferences, recurring patterns, things every session should know. 100-line cap — compress quarterly.*

## User
- **Name:** Adam
- **Role:** Founder/CEO. Participant in Hudson Lab Ventures × Etsy program, Columbia, Jul 13–24 2026.
- **Communication preferences:** Direct, numbers first. **Low tolerance for long grilling/option trees — wants to move.** Prefers: document what we know → give me a concrete task → execute.
- **Working style:** "Build, test, lean startup as fast as I want once we have an idea." Build speed is the expectation, not the constraint.

## Project — what this repo IS
- **Name:** Etsyc — Adam's **workspace** for the HLV × Etsy program.
- **Purpose:** notebook · research · synthesis · content creation · planning · and eventually the product build.
- **NOT** (yet) a product codebase. It becomes one when an idea is chosen.
- **Repo:** https://github.com/Adam077K/etsyc · **Domain:** etsyc.com

## The Challenge (full brief: `docs/01-foundation/HLV-ETSY-CHALLENGE.md`)
- **Question:** "How will Gen Z find, believe in, and connect with the real people behind the things they love?"
- **Sponsor:** Dina Murphy, VP Product Management, **Buyer Experience**, Etsy.
- **Pitch:** Fri Jul 24, 2:15–4:30 pm, Northwest Corner 501, Columbia. Etsy panel judges.
- **Win condition Adam chose:** build a **real venture** — the pitch is a checkpoint, not the finish line. Wants users touching a working thing, Etsy as channel/partner, a wedge defensible past July.

## Program timeline — hard dates
| Day | Date | Phase |
|---|---|---|
| 1 | Mon Jul 13 | Shared context (Etsy opens challenge) |
| 2 | Tue Jul 14 | **Listening** |
| 3 | Wed Jul 15 | Reframing |
| 4 | Thu Jul 16 | **Solutioning + TEAM FORMATION (by vote)** |
| 5–6 | Jul 17–18 | Designing (lean blueprint) |
| 7–9 | Jul 20–22 | Prototyping + testing |
| 10 | **Fri Jul 24** | **Final pitches** |

## Day 3 (Jul 15) — IDEA LOCKED: "In the Making" (Proof-of-Batch)
- **Bet (locked, board PROCEED_WITH_CONDITIONS):** un-fakeable, discovery-time, near-zero-seller-effort **proof-of-human** — buyer watches timestamped, camera-signed moments of their item being made (Proof-of-Batch: "yours is #7 of 12"). Buyer-side (Dina Murphy's portfolio). Primitive on slide 1 = "Identity-Bound Commerce / Human Provenance Network." Full spec: `docs/01-foundation/realness-goal.md`; 9 locked decisions (D1–D9) + 4 test gates in `DECISIONS.md` + `docs/08-agents_work/2026-07-15-realness-board/`.
- **Interview corpus (7 recordings) corroborates the bet** — see `docs/research/interviews/FINAL-SUMMARY.md`.
- Earlier "discovery that becomes relationship" reframe (Miro `uXjVG1iySzI=`) fed into this and is now superseded by the locked bet. **"IST"** = Adam's tag for a friction that is also a build opportunity.

## Onboarding — read this first
- **`docs/KOL-START-HERE.md`** is the single canonical entry point for KOL. Any new session/agent reads it first: it has the 60-sec what-is-KOL, a tiered reading path (Tier 1 authoritative KOL-* docs → pitch → research → history), and a list of empty template files to IGNORE. Keep it current when major docs change.

## Day 5-6 (Jul 19) — PRODUCT EVOLVED: KOL v2 locked for the real MVP build
- The build target is no longer the "In the Making / Proof-of-Batch" pitch bet — that's now historical pitch framing. Current product = **KOL v2**: a **desktop-first, video-native marketplace** where buyers scroll a magazine feed of real makers on film → tap → the maker's personalized branded **world unfolds around a still-playing video** → meet the human → buy. Makers build their world via an AI **co-creation interview** (they stay the author; anti-slop is structural).
- **13 locked decisions (D1–D13):** `docs/01-foundation/KOL-v2-concept-lock.md`. **Auth is now IN scope** (Supabase) — reversed the earlier "skip auth." Master build plan: `docs/03-system-design/KOL-MVP-master-plan.md` (Phases 0–8).
- **MVP model:** competition = checkpoint on a production build (seeded with 4 teammate worlds), then cutover to real buyers+sellers. Every agent uses MCPs (Supabase, Playwright, Miro, Refero/Stitch/Pencil/Figma) on demand.

## Day 7 (Jul 20) — KOL Phase 5 COMPLETE (specs), Phases 0–4 done + Phase 3 closed
- **Phase 5 done:** 32 build-ready per-feature specs (40 MVP features) in `docs/04-features/specs/`, CPO+CTO BUILD-READY, merged to main. Dispatch packet: `docs/08-agents_work/handoffs/2026-07-20-phase5-dispatch-packet.md`. See DECISIONS.md top entry for risk tiers, Founder decisions, and the Phase-6 build order.
- **Next:** Phase 6 build in `apps/kol/` (Fable 5). **Handoff + launch prompt ready:** `docs/08-agents_work/handoffs/2026-07-20-PHASE6-HANDOFF.md` (+ `-LAUNCH-PROMPT.md`); build sequence in `docs/03-system-design/KOL-phase6-build-plan.md` (Waves 0–6). Start = Wave 0 render spine (P3→P4/P5/P8, mock fixtures, no DB) in parallel with the migration-apply ask.
- **P15 messaging must land before B12/B14.** Deferred hardening gaps N2/N3/N4/NEW-3 accepted for seeded MVP (post-launch, do NOT build). B11 search scope decided at Phase-6 planning.
- **S9 voice-anchor verification:** researched (`docs/research/references/2026-07-20-voice-anchor-verification.md`) — "voice-anchored" is build-not-buy; recommended MVP = **founder human-in-the-loop for the 4 seeds** (NOT a blocker). Adam decides what the badge asserts (live-human+anchor vs legal identity) before Wave 4b.
- **STILL DEFERRED (Founder-gated, Irreversible):** the 31-table migration is a reviewed PLAN — nothing applied to Supabase. Needs the 9-point staging validation + Adam's sign-off before apply.

## Day 9 (Jul 22) — FINAL PITCH plan locked (`ceo-5`)
- **Format:** Fri Jul 24, **7:00 on stage**, free-form (NOT the 74pt ISS template — that's a solutioning scaffold), **full venture deck**, 24 slides / 5 acts. Plan: `docs/05-marketing/HLV-FINAL-pitch-plan.md` + review artifact. Emotional-spine source stays `HLV-pitch-KOL-delivery.md`.
- **Production model:** fully produced, **zero shoot + zero live build**. All footage AI-generated (higgsfield) from **Sharon / Two Dots**' approved real photos + UGC; app UI = designed stills + motion; team assembles in **Canva/Pitch**.
- **Sharon / Two Dots** = a real Etsy small business, permission granted, our **first customer** and the deck's hero maker (the traction anchor no other team has).
- **Two guardrails (hard):** (1) generated clips are product experience, NEVER documentary proof of Sharon; (2) every number sourced on-slide (research-lead → `HLV-pitch-sourced-figures.md`).
- **⚑ POSITIONING (Founder, Jul 22):** KOL is pitched as a **FEATURE FOR ETSY, built into Etsy's site** — a trust layer that opens the human behind each listing → buyers come back → reverses Etsy's −9% habitual-buyer decline → more customers. Etsy = customer/partner, NOT competitor. Grid villain = Etsy today. Sharon = a real Etsy seller (native pilot). Ask = run the pilot inside Etsy. Money model = **rev-share/licensing on the incremental GMS KOL drives** (aligned incentive; resolves "feature-for-Etsy vs. take-a-cut" tension — Founder to confirm vs. SaaS-license / acqui-hire alts). Supersedes older "standalone Etsy-compatible marketplace" framing.
- **Sourced figures (`HLV-pitch-sourced-figures.md`):** GOLD = Etsy's own CEO Kruti Patel Goyal *"buyers come to Etsy... for who they buy it from"* + CMO Brad Minor "automated/impersonal" quote — Etsy stating our thesis. Etsy GMS $11.9B · 86.6M buyers · 5.6M sellers · take rate 24.2%→25.7% · habitual buyers −9% YoY. 4 traps removed (no "3×/yr", no "Keep Commerce Human" misattribution, Faire=15%+$10 not 25/15, anchor market on Etsy GMS not fuzzy handmade TAM).
- **Pitch v5 (Jul 23) — HLV MENTOR RESTRUCTURE (current direction).** A senior HLV person gave structural feedback (`New_Recording_46_eng.pdf`; breakdown `docs/05-marketing/HLV-mentor-feedback-structure.md`). His ideas OVERRIDE prior structure. **Biggest shift: STORY is the spine, not trust/verification** ("e-commerce for the age of storytelling"; "the foundation is the story itself, not the products"). New order: **maker-first (Sharon signs in, tells her story) → then named buyer "Noy" (new dad) discovers/buys/tells-forward → LTV.** Market reframe: storytelling disconnected from shopping (TikTok/IG tried & failed) → KOL owns the **top-right corner** (story × human-made) → **~$10.5B "missing sales" + 20–40% price loss** (printed as OUR labeled opportunity model, anchored on sourced Etsy $11.9B). Model: **platform fee + transaction fee + the tools**. Signal: side-venture (not A/B test), rich-story niche in Etsy, KOL seller page vs Etsy seller page on conversion/add-to-basket, LTV hypothesis. Vision at the very end. Built by Fable, all accuracy rails preserved. **FOUNDER CALLS (Jul 23, resolved):** name = **KOL** (written; said "Cole") · store = **Two Dots** · buyer = **a mother, "Maya"** (placeholder name) shopping for a handmade, values-aligned custom piece for her daughter's school event (replaced the "Noy/new dad" draft) · market hero = **sourced Etsy $11.9B GMS** ("trust the right number in the company data" — dropped the unsourced $10.5B); 20–40% price-loss kept as our labeled "real premium" estimate. **Still open:** 20–40% source pin · Instagram-failed citation · Sharon's assets · team roles · LTV target.
- **Pitch v2 (Jul 23) — five-judge board review applied.** Artifact = authoritative v2 (22 slides, was 24). Full review: `HLV-pitch-panel-verdict.md`. Key strategic changes: (1) **moat = the co-creation engine** (conversation→living world), NOT the clip-swap; (2) **frequency fix** — added return-loop beat + pilot = honest test of "do buyers come back"; (3) Act IV merged 7→5, Sharon carried through; (4) real math on money slide ($72/211/476M prize → KOL $32-42M/yr); (5) all headlines → fragments, "5 interviews" not "7". **⚑ TONE (Founder, hard rule): we pitch TO Etsy — never criticize Etsy; align with "Celebrate Being Human," never expose a gap; the grid = old listing format not Etsy's product; −9% = shared market headwind not indictment.**
- **Style:** Y.-reference (cream+near-black+editorial serif+one warm accent) pushed HUMAN — clay-terracotta accent, workshop light, 35mm grain.
- **Open (Founder):** the ask framing (partnership placeholder for now) · team names/roles · final KOL logo · Sharon's photos+brand colors (blocks all asset gen).

## Day 10 (Jul 23) — MVP UI COMPLETE, 3 waves merged (`ceo-6`)
- **Screens-only MVP rebuilt + shipped** (waves 0–3, all QA-gated, main @ 28f06ce): continuous film (ONE video element feed→thank-you, e2e-guarded), living interactions, 6 worlds/15 products, full seller workspace (/sell/home·orders·messages·clips), journal, /how. Locked design contract = `apps/kol/DESIGN.md`+`PRODUCT.md`.
- **Deploy:** kol-demo.vercel.app = wave-2 baseline; complete 36-page wave-3 build staged as Vercel preview. **Founder must run** `cd .worktrees/kol-deploy/apps/kol && npx vercel --prod` to promote (agent-blocked, correctly).
- **TwoDots (Sharon) real-footage world: COMPLETE, design-PASS, on origin/feat/kol-twodots — HELD from merge** pending Founder calls: workshop.jpg (background minor) approve/swap, Sharon surname/city+copy, written permission for public child-imagery use. Unblock: rebase-check→merge→redeploy. See memory `kol-twodots-held-branch`.
- **Full handoff for next session:** `docs/08-agents_work/handoffs/2026-07-23-KOL-SESSION-HANDOFF.md` (state, rules, playbook, reading list).

## Day 10 night (Jul 23, `ceo-6` cont.) — PITCH-EVE TRAIN: 10 branches frozen, 11 gates green, ONE blocker
- **Merged to main** (@ 64a9e6b, pushed): wave-4 design polish (marigold discipline, mobile film-dock crop, b53d1f5) + **Etsy brand re-skin** (token-value swap: Etsy Orange #F1641E, rust/fig/denim grounds, 038fe91). Preview live: kol-demo-l5r4corxh-…vercel.app.
- **FROZEN, gate-PASSED, UNMERGED — merge train order:** (1) feat/kol-sharon-journey [+ pending clearance commit] → (2) kol-sharon-world-deep → (3) kol-sharon-feed-film → (4) kol-dock-topleft → (5) kol-worlds-exclusive → (6) kol-feed-editorial → (7) kol-seller-polish → (8) kol-fixture-coherence → (9) kol-etsy-entry → (10) kol-feed-media. Worktrees under `.worktrees/`; session files per branch in docs/08-agents_work/sessions/.
- **THE ONE BLOCKER:** the TwoDots clearance record (CREDITS governance block + DECISIONS entry) is classifier-blocked for agents AND CEO — Founder must approve interactively (switch off auto mode, "retry the clearance edit"). Wording pre-agreed: Founder-directed publication under Sharon's on-record Day-9 permission, faceless-only, workshop.jpg held at internal-assets/ (out of bundle), face video never-ingest, written confirmation to be archived.
- **Integration notes at merge:** keep seller-polish's three-tone :focus-visible ring in globals.css (last-integrated must not clobber); maker-world.tsx inline dockedTarget → import dockTarget from film-geometry (one-liner, at worlds-exclusive rebase over dock branch); 3 top-left origin literals logged as latent-trap cleanup → TODO-NEXT; site-footer RM hydration warning = base debt → TODO-NEXT.
- **What the train contains:** /etsy entry page (Etsy-replica grid of our products + KOL tab — the demo's opening beat, noindexed, honesty footer) · Sharon IN PERSON as homepage cover (edge-bleed portrait panel, her 24s compliant talking-head cut) + feed lead + world/dock film · her bespoke world (film interlude bloom) · top-left store dock (checkout/thank-you stay bottom-right) · 5 template worlds film-led (make-reel, narration chips) · feed choreography + de-jargoned copy (Founder-authorized pass, all critic-ratified) · seller polish + 3-tone focus ring · fixture coherence (seller HQ = Lena, deliberate: "two makers, one platform").
- **Demo script notes:** start /etsy → KOL tab → after hero click a DIFFERENT maker tile first, enter Sharon via cover "Enter the world" (avoids triple-Sharon) → shop through to her thank-you. e2e test-1 now guards exactly this Sharon journey.
- **Founder one-liners still open:** Sharon's written OK (child imagery) to archive · caption-free video export request · "1–2 weeks" turnaround confirm (copy softened to "cut and stitched to order" pending) · licensed stock drop w/ URLs if more feed media wanted.
- **PITCH-DAY 04:30 UPDATE — train now 14 cars, ALL frozen, 15 gates green.** Added cars (each double-gated, in merge order after car 10): (11) kol-sell-firsttouch ("You're the cover story" mirror landing + workshop-desk home) → (12) kol-studio-arc (Draft→Yours studio, Opening-day publish; interview untouched) → (13) kol-capture-ritual (recording as ritual: viewfinder states, director's call sheet; history rebased clean of review PNGs) → (14) kol-sharon-sound (Sharon's AUDIBLE ~19s compliant cut — child-face zones + IG captions excluded, AAC kept; sound chip arms audio on the persistent stage → voice continues feed→world→product→checkout; e2e now 5/5). TWO FOUNDER GATES hold everything: (1) the clearance record (classifier requires interactive approval — Shift+Tab default mode, "retry the clearance edit"); (2) audio attestation on the new cut (Sharon/Debbie only, no child voices — else strip the AAC track, sound UX stays). TWO DOTS (2).mp4 source: kids-costume showcase (≥6 identifiable children) is the unusable footage — needs guardian permissions if ever wanted. Merge-train integration notes stand (three-tone ring survives, maker-world dockTarget one-liner, mixed bases: cars 5-6-14 stack A, 7-8-9-11-12-13 stack B off worlds-exclusive — resolve at train time).

## Live constraints
- **Idea is chosen** (KOL v2, see above). Gating items are now the **validation gates** (Day-4 cold-DM maker probe ≥60%, capture-rig, forced-choice, lapsed-buyer) and Adam's **D7 written pivot pre-commit (due Day 3)**. Not build capacity.
- Teams form by **vote on Day 4** — Adam does not control his team. Venture ambition vs. teammates optimizing for the pitch is an unresolved tension.
- Days 5–6 blueprint must state value to **buyer, seller, AND Etsy** — all three.

## Recurring patterns
<!-- Things the user has corrected you on more than once. -->
- Interrupted two AskUserQuestion grills in a row. **Don't stack option-tree questions.** Ask one thing in prose, or just do the work.

## Vendor lock-ins (accepted)
<!-- Each entry: vendor · why · review trigger date · export-path commitment -->
