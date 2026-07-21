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

## Live constraints
- **Idea is chosen** (KOL v2, see above). Gating items are now the **validation gates** (Day-4 cold-DM maker probe ≥60%, capture-rig, forced-choice, lapsed-buyer) and Adam's **D7 written pivot pre-commit (due Day 3)**. Not build capacity.
- Teams form by **vote on Day 4** — Adam does not control his team. Venture ambition vs. teammates optimizing for the pitch is an unresolved tension.
- Days 5–6 blueprint must state value to **buyer, seller, AND Etsy** — all three.

## Recurring patterns
<!-- Things the user has corrected you on more than once. -->
- Interrupted two AskUserQuestion grills in a row. **Don't stack option-tree questions.** Ask one thing in prose, or just do the work.

## Vendor lock-ins (accepted)
<!-- Each entry: vendor · why · review trigger date · export-path commitment -->
