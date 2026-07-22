# KOL — Wave 3 Gate-2 Handoff (paste-ready)

*From session `ceo-1-1784669503` · 2026-07-22. **Wave 2 and Wave 3 T0a are DONE and merged to `main`.** Wave 3 T1 is **built (7/7) but UNMERGED — Gate 2 is mid-flight with two active BLOCKs.** Start by finishing Gate 2.*

---

## 🛑 SESSION ENDED ON A MONTHLY SPEND LIMIT — READ THIS FIRST

Five workers were killed mid-flight by `You've hit your monthly spend limit`. **Raise the limit before continuing — nothing below can proceed without workers.** Four of the five committed before dying. Salvage:

| Branch | Head | What actually landed | What's missing |
|---|---|---|---|
| `test/live-suite-collection-fix` | `963851c` | ✅ **COMPLETE + independently verified.** See the CI-defect section below | nothing — ready to merge |
| `test/film-interleave` | `4e1a262` | ✅ **The integration branch already exists.** B1b + B2 + B4 + B5 merged into one tree (5,745 insertions) — the merged composition the coverage auditor said "exists on no branch" | B3 + S8 not merged in; **based on main BEFORE `46f93c4`** so it must be rebased; no interleaving tests written yet |
| `feat/b1b-gate2-fix` | `0610fec` | B1b **rebased onto `feat/b1a-feed-data` head** — the merge-order defect is FIXED | **all R2/R3 design work.** It died right after the rebase. Treat as "B1b, correctly based" and nothing more |
| `test/b2-gate2-coverage` | `ae303c7` | 3 of 4 brief items: `releaseSlot` dispose fix, token-drift fix (`resolveEdgeMs`/`edge-table`), and the 305-line GROWN server-boundary suite | **the load-bearing one** — the fake epsilon test + a real FilmLayer wiring test + the 3 mutation verifications |
| `test/b4-browse-boundary` | `2ef539e` | 243-line WORLD_BROWSE server-boundary suite | direct audit of `lib/browse/world-interaction.ts` |
| *b3-gate2-fix* | — | ❌ **NOTHING. No branch, no commits.** | **everything** — and B3 holds the only P1 blocking a design gate |

**The critical loss is B3.** The invisible-statement P1 (maker's first line at 1.04:1) is entirely unfixed. Re-dispatch it first; the brief is in "THE BLOCKING FINDINGS" plus the source mechanism below.

### Source mechanism for B3's P1 — derived by code review, use it
`components/blocks/hero-video/index.tsx:109-112`. The chrome block is `absolute inset-x-0 bottom-0` with **no height budget**, and the h1 sizes off container *width* only (`min(var(--fs-display-hero), 10cqi)`). So wrapped lines grow **upward**. The frame is `overflow-hidden` at `:85` — meaning what the first line escapes is **the scrim's finite bottom gradient band, not the frame box**. It lands on un-scrimmed film. That is exactly the measured 1.04:1.

The `sunbaked` caption at 3.78:1 is the **same defect class** (`text-on-media` past the gradient's reach) — a statement-only fix leaves it live and looks like a pass.

Two directions: line-clamp the statement, **and/or** make the scrim track the chrome block's real height. The second is more durable — the `≤48-char` budget already failed once (44 chars → 3 lines).

### Repo hygiene
`git worktree list` shows ~60 worktrees and `git branch` ~110 branches, including 17 stale `.claude/worktrees/agent-*` and dozens of dead `ceo-*` branches. Worth a prune; it makes `git branch` output unreadable during merge work.

---

## STATE AT HANDOFF

**`main` @ `ba4b581`** · 36 test files · **630 tests green** · typecheck + lint clean · pushed to `origin/main`.

**Live DB** (Supabase ref `olwtcjzmohdhawdzlzqs`): 31 tables · RLS on all 31 · **16 migrations applied** · 4 published seed maker worlds · 20 videos · 20 tagged `video_profiles` · 12 products · 1 deliberately-unpublished RLS probe store.

### Shipped and merged
| Wave | What |
|---|---|
| **Wave 2** | Video engine (`selectVideos = antiRepetition(rank(eligible(ctx)))`, 8-state map, seeded FNV-1a jitter, HMAC anti-repetition ring), P7 tagging (ships **dark**), blocks catalog seed, Wave-1 fast-follows, WCAG AA fix |
| **MIG-CHECK** | 5 CHECK constraints on `video_profiles` — enum vocab, thankyou-exclusive, `anti_repetition_key` format. `23514` proof green |
| **MIG-TS** | `enforce_server_timestamps()` BEFORE INSERT/UPDATE on **11 tables**. Forged `created_at` → `now()`; service-role preserved |
| **Wave 3 T0a** | P3-EXT (`clips[].focalPoint`, `hero-video.props.statement`), SEED-W3 (4 maker worlds), W2-WIRE (anon client factory, `createEngineDeps`, bounded FEED query), FILM-LAYER (app-root player, A/B buffers, cross-tree handoff) |

### Built but UNMERGED — all 7 T1 units
| Unit | Branch @ head | Tests |
|---|---|---|
| B1a feed data + `/feed` anon | `feat/b1a-feed-data` @ `763522c` | 648 |
| B1b magazine layout | `feat/b1b-magazine` @ `1bb9c57` | 683 + e2e 10 |
| B2 grow (+ G1-F2 fix) | `feat/b2-grow` @ `a96721c` | 667 |
| B3 world unfold (+ E5) | `feat/b3-world-unfold` @ `58a0a5f` | 658 |
| B4 store scroll | `feat/b4-store-scroll` @ `2ef7d54` | 655 |
| B5 narration dock | `feat/b5-narration-shrink` @ `8b537a2` | 679 |
| S8 product management | `feat/s8-product-mgmt` @ `1f0c754` | 696 (1 skip) |

**The buyer spine exists in branches:** load `/feed` → see 4 real makers → tap → world unfolds around a still-playing film → scroll it → product narration docks to the corner. `/feed` returns HTTP 200 with 4 cards, verified live.

---

## ⛔ START HERE — GATE 2 IS NOT FINISHED

**Do not merge T1 until Gate 2 clears.** Two BLOCKs are active and three reviewers had not reported when this session ended.

### Reviewer status — ALL SIX NOW REPORTED
| Reviewer | Verdict |
|---|---|
| adversary (`adv-gate2`) | 🔴 BLOCK → B5's two P2s **fixed** in `8b537a2`, since **verified fixed** by code review |
| code-review feed (`cr-feed`) | ✅ **PASS** — 0 P1 |
| design-critic (`critic-gate2`) | 🔴 **BLOCK both gates** — 13 findings; all 3 direction-level ones now ruled on |
| coverage (`qa-cov-gate2`) | 🔴 **COVERAGE-BLOCK** — 1 P1 (the interleaving void), 6 P2 |
| code-review film (`cr-film-consumers`) | 🔴 **REVIEW-BLOCK — B3 only.** B2, B4, B5 (@`8b537a2`), S8 all **merge-clean** |
| interleaving e2e (`e2e-interleave`) | died on spend limit — but left `test/film-interleave` (see salvage table) |

### 🔺 THE P1 THAT REORGANIZES THE PLAN — it cannot be closed before merging
The wave's single binding AC — *"film frame never unmounts / never paused-or-black **under interleaving**"* — has **zero tests, and none can exist pre-merge.** The six journey branches are siblings on B1a; **no branch contains two units' code.** B2 tested grow against a synthetic card its own comment describes as *"a feed card the way B1b will build one."*

**Two seams are unwired, and are invisible on every individual branch:**
1. **B1b calls `onGrow(card)`; B2's API is `grow(source: GrowSource, cardEl: HTMLElement)`.** The adapter is unwritten. B1b's page renders `FeedMagazine` with no `onGrow` at all (`b1b app/feed/page.tsx:69`); B2's page still renders B1a's old `FeedCards` shell (`b2 app/feed/page.tsx:70`).
2. **`lib/renderer/StoreWorld.tsx` has three divergent rewrites** (B3/B4/B5). B4 records the clicked product as internal state + `data-selected-product`; B5 expects it as a `narrationProductId` prop; **nothing wires them.** Post-merge, NARRATE_SHRINK narrates the store-wide fallback instead of the tapped product. A union merge conflicts three ways.

These are instances **four and five** of the cross-branch class that has dominated this wave.

**Consequence — the merge strategy must change.** Do not merge T1 to `main` to unblock this. Merge onto an integration branch (`test/film-interleave` already exists and is 4/7 of the way there), write the two seam adapters and the four interleaving tests there, run the gate against the *merged* tree, and only then merge to `main`. Four untested scenarios: two units claiming · B4 swap fired mid-grow-flight (same A/B buffers; B4's 12s floor vs B2's 520ms edge) · focus re-target racing grow · B5 dock swap racing B4 browse swap.

### 🔻 A CI defect that is LIVE ON `main` — fixed, verified, awaiting merge
Every live Supabase suite claims it *"auto-skips when `.env.local` is absent (CI has no keys)"*. **That claim is false**, proven by vitest probe: `describe.skipIf(true)` **executes its body at collection**, and `createClient("")` throws. Keyless CI gets collection errors, not skips.

`test/live-suite-collection-fix` @ `963851c` fixes 6 files (clients moved into `beforeAll`; skipped suites don't run hooks). **Verified four ways by the worker and independently re-verified by the CEO:** diff is test-only (all 6 under `__tests__`); keyless run = `29 passed | 7 skipped (36 files), 630 tests`; with keys, all 44 live tests genuinely execute against staging and pass (so it did not turn them into permanent silent skips).

**The telling part:** `live-composition.test.ts` on `main` *already had this fix*, tagged in-comment as `F12 (QA-Lead gate-1 must-fix 5)`. The defect was found once, fixed in one file, and **never swept across its six siblings.** Add a sweep step whenever a gate finding is a pattern rather than a one-off.

> The real risk here isn't a red CI run — it's someone "fixing" the red by putting production Supabase keys into CI.

### Other findings worth carrying
- **A fake test:** `aspect-counter.test.ts:163-168` claims to pin "epsilon gate matches the FLIP wiring threshold" but is **arithmetic on constants that never touches FilmLayer.** Invert the real gate at `FilmLayer.tsx:334` (`>=`→`<`) and the whole tree stays green while G1-F2 silently disengages and media smears on grow. Two more green-on-mutation: delete `stopAspectCounter?.()` from dispose (`:370`); rename the buffer/poster classnames (the counter no-ops via `aspect-counter.ts:122`, and the test rig hard-codes its own copies).
- **Adversary's Invariant 5 was DOWNGRADED P1 → P3** on real analysis: `releaseSlot` genuinely doesn't dispose `flightRef`, **but** parking only flips `visibility`, and `visibility:hidden` does **not** cancel a running CSS transition — `transitionend` still fires and `finish()` disposes normally. The timer is a backstop; worst case ~640ms of orphaned sampling on a hidden frame. Already fixed on `test/b2-gate2-coverage`.
- **B1b's "transient" live-test failure is a real structural race**, not agent noise: engine live suites plant *published* feed-eligible fixtures in the shared staging pool, and B1a's tests 2–3 assert over the whole pool. It scales with agent count. Scope assertions to seed handles ∪ own fixtures, or take a pg advisory lock.
- **S8's price path was re-confirmed end-to-end:** `majorToMinor` is pure integer string math (never a float parse), and three smuggled price-shaped keys in the order payload are ignored — `create_order` charges the catalog price.

### In flight when the session ended
- `b3-gate2-fix` — the two Gate-B P1 build fixes

**Re-dispatch anything that never reported.** All briefs are recoverable from this doc.

### ✅ Design-Lead rulings — LANDED, all 3 direction-level questions decided
Full text: `docs/08-agents_work/sessions/2026-07-22-design-lead-gate2-rulings.md`. Spec edits are in `docs/06-design/KOL-wave3-design-direction.md` (§2.1, new §2.1a, §4.1, new §4.1b, §7) and `KOL-wave3-screen-specs.md` (§1.1, §1.6, §1.7, §3.2).

- **R1 nameplate — APPROVE-WITH-CHANGES.** Weight is now **stroke-contrast-aware, not a number**. `strokeClass` per pairing (`warm-serif` = `modulated`; other three + `custom` = `uniform`). Renderer reads `--nameplate-size/-weight/-tracking`, **never a font name**. `modulated` → `display-hero`/700/`-0.03em`; `uniform` → `display`/600/`-0.025em`. Two axes, not one — statement larger-and-lighter, nameplate smaller-and-heavier. The critic's 500–600 proposal was adjusted: *weight alone under-corrects on heavy uniform faces.*
- **R2 mobile — APPROVE.** Mobile identity is **the left edge**. Four slots (`M-BLEED`, `M-FULL`, `M-OFF-L`, `M-OFF-R`), asymmetric insets, captions align to their own media's left edge. **Two columns rejected — shrinks the face.** Second slot table, same content-aware assignment.
- **R3 cycle — APPROVE.** **Content-aware slot assignment replaces the S1→S2→S3 cycle.** Cost = aspect fit + repeat penalty + edge penalty; four hard constraints; deterministic; degrades to centre focal point if `focalPoint` is absent. Adds a 6th slot `COLUMN` → five row patterns.
- **Contrast headroom bound (new, project-wide):** type over film **≥ 5.5:1 body / ≥ 4.0:1 large**. Variance-aware scrim deferred to Wave 4/5.
- **Ambient count** (CPO's dial): **0 ambient at ≤2 cards in view, 1 at 3, 2 at ≥4.** Everything-moving is the TikTok-Shop register §2.4 bans.
- **Follow-up NOT in Design-Lead's files — someone must do this:** `KOL-design-system.md` §3 must carry `strokeClass` on each pairing, and the `kind:"custom"` derivation must emit it.

> Design-Lead's own words: *"Two of the three findings are places I was wrong. I expressed an optical property as a number, and I wrote an anti-grid assertion that a cycle passes."* Both R1 and R3 are **spec defects the machine assertions passed** — more evidence for the eyes-on gate.

---

## THE BLOCKING FINDINGS

### Design-critic — GATE A (feed, blocks B1b): **BLOCK + DEFERRED**
- **P1** Mobile at 375px has **no composition at all** — identical widths, uniform gaps: the equal-cell layout §2.4 bans. §1.1's slot table is desktop-only; the spec is silent below the breakpoint. **Direction-level → Design-Lead.**
- **P1** N=18 capture shows **6 makers twice**. *Resolved by CEO:* fixture cycling (`MAKERS[i % 11]`), **not** an engine bug — `distinct on (store_id)` intact. But **N=18 remains unevidenced**; re-capture with 18 distinct fixtures.
- **P2** S1→S2→S3 is a **5-card period repeating 3.6× at N=18** — *"a deterministic three-pattern cycle is a grid with a longer period."* Both machine assertions still pass. **Direction-level.**
- **P2** ~510px unowned void at N=4; equal air on all four sides — no cluster-and-pause rhythm.
- **P2** Craft line carries a materials inventory and wraps to 2 lines — data shape wrong.
- **P2** Debug string *"Ferreira Press — intro (placeholder film)"* baked into a seed asset, **visible on staging**.
- **DEFERRED:** *"reads alive with people"* is **unjudgeable** — there are no faces. *"A PASS here would be awarded to the layout for a property the layout does not control."*

### Design-critic — GATE B (world hero, blocks B3): **BLOCK**
- **P1** The statement block is **bottom-anchored and grows upward past its panel**. Line 1 renders on page ground at **1.04:1 — invisible.** The maker's first line is not there. The ≤48-char budget is the wrong constraint (44 chars → 3 lines).
- **P1** `sunbaked` caption band **3.78:1**, below AA.
- **P1** Weight-700 nameplate reads as a **stamped logotype** on geometric sans, fine on high-contrast serif. *"Optical mass is a property of stroke contrast, not of a number."* **Direction-level.**
- **P2** 25–29px between display baseline and caption cap-height; descenders collide. Want ≥40px measured from descender.
- **P2** Demoted name has no visual claim — strongest optical break is the em dash inside the materials clause.
- **P3** `isoldeglass` panel flush to y=0; stray warm band at y≈700–820 in the dark theme.

### ⚠️ Every contrast number in this project is measured against a fiction
> *"hollowgrain's 4.89:1 is not a pass — it's **0.39 of headroom over a zero-variance surface**. A face lit from the left takes it under. **Tuning to these numbers is tuning to a fiction.**"*

All seed film is smooth synthetic gradient. **Re-verify I5 on real footage before contrast is called done.**

### Adversary — open items
- **F3 (P2)** `model3d_id` ownership is app-side only; a direct PostgREST write can reference another store's media. **Third instance of the "RLS gates rows, not values" class.** Needs a migration (Irreversible).
- **F4 (P3)** Per-product currency accepts any `^[A-Z]{3}$`; JPY renders `48.00 JPY` (no minor unit).
- **Invariant 5 NOT PROVEN:** *"`releaseSlot` does NOT dispose `flightRef`"* — B2's rAF loop is stopped only by a `durationMs+120` fallback. Needs the interleaving e2e.

### cr-feed — merge-order defect
**B1b branched one commit before B1a's head** — merging as-is regresses B1a's session file to PARTIAL. **Merge order: B1a head first, B1b rebased on top.**

---

## HARD-WON CONVENTIONS (in `.claude/memory/DECISIONS.md` — read them)

1. **RLS gates *which rows*, never *what values*.** Hit 3× (tag columns → MIG-CHECK; timestamps → MIG-TS; `model3d_id` → open). **Any column a read path orders/ranks/gates on must be server-enforced at the DB.**
2. **Cookie contract = names AND attributes.** Five units invented five conventions. Canonical: `kol_sid` + `kol_ring`, declared once in `lib/feed`, imported everywhere. **Amendment:** attributes too — B5 imported the names and stripped `Secure`, downgrading an HMAC cookie to plaintext. Assert with `toEqual`, never `toMatchObject`.
3. **Mutation verification is the standard** for any fix to a load-bearing guard: break it, watch the test go red, restore, report it.
4. **Z-order stacking contract:** `--z-film-bed 30` < `--z-film-chrome 35` < `--z-film 40`; app chrome ≥50. Lift chrome, never portal (portal breaks heading/a11y order).
5. **Cross-branch defects are the dominant failure mode.** Units individually correct, broken on contact, invisible to single-branch review: FILM-LAYER silently voided P3-EXT's `focalPoint`; five cookie conventions; B1b's branch point. **Gate every wave for integration, not just per-unit correctness.**

---

## AFTER GATE 2 — THE REST OF THE MVP

- **T2** B6 product page + cart (after S8 + B5)
- **T3** **B7a Stripe server + webhook — IRREVERSIBLE**, needs Full pipeline + 2-of-3 multi-judge + **Founder sign-off**. `create_order` already reads price server-side (no price parameter — live-proved against smuggled payloads). Stripe **TEST MODE**; a `sk_live_` prefix must hard-fail at startup.
- **T3.5** B7b checkout surface · **T4** B8 thank-you (maker-authored, never AI-fabricated)
- **Gate 3** + Playwright E2E over the full spine: FEED → GROWN → WORLD_OPEN → WORLD_BROWSE → NARRATE_SHRINK → PRODUCT_PAGE → CHECKOUT → THANK_YOU
- **Wave 4** seller pipeline (S1–S9, P9–P12) → **MVP functionally complete** · **Wave 5** buyer aux · **Wave 6** polish

---

## FOUNDER INPUTS OUTSTANDING

1. **REAL SEED FOOTAGE — highest leverage thing in the project.** 4 makers on film. Every image is a gradient; one card literally reads *"placeholder film"*. The critic: *"One face would change my read of that page more than any layout change."* Blocks the Gate-A "alive" clause, Focus Film judgement, and all contrast re-verification.
2. **`store-media` Supabase Storage bucket** — public read, authenticated write. Blocks S8's upload smoke test only (outbound curl is sandboxed here, so this is dashboard work). If provisioned **private**, S8's `getPublicUrl` generation needs rework.
3. **Stripe test-mode keys** before T3.
4. **`ANTHROPIC_API_KEY` must NOT enter any deployed environment** until `tagging_accuracy` clears macro-F1 ≥ 0.80 + thankyou-gate 100%, and F7/F8 (cost accounting, rate limit) land. P7 ships dark by design.

`ENGINE_COOKIE_SECRET` is provisioned locally (64 bytes) — **set a different one in Vercel project env**; they need not match.

---

## FIRST ACTIONS FOR THE NEXT CEO

**0. Raise the monthly spend limit.** Nothing below can run without workers.

1. **Re-dispatch B3 — it is the critical path.** Nothing survived; it holds the only P1 blocking a design gate. Brief = R1 `strokeClass` nameplate + the invisible statement + the 3.78:1 caption, using the source mechanism above. New bound: **≥ 5.5:1 body / ≥ 4.0:1 large.**
2. **Re-dispatch B1b's design work** on top of `feat/b1b-gate2-fix` @ `0610fec` (already correctly rebased — do not redo that): R2 mobile slot table, R3 content-aware assignment replacing the S1→S2→S3 cycle, plus the ~510px void, craft-line data shape, the `"placeholder film"` debug string visible on staging, and an N=18 re-capture with 18 *distinct* fixtures. **The anti-grid test must assert on period** (no ≤6-length slot sequence repeating more than twice at N=18) and be mutation-verified against the old cycle — the existing assertions passed on a layout the critic called a grid.
3. **Finish B2's item 2** on `test/b2-gate2-coverage` @ `ae303c7`: the fake epsilon test → a real FilmLayer wiring test, with all three mutations verified red. The other three items are done.
4. **Finish B4's `world-interaction.ts` direct audit** on `test/b4-browse-boundary` @ `2ef539e`.
5. **Merge `test/live-suite-collection-fix`** — complete and verified twice; needs only a QA-Lead pass (Lite, test-only).
6. **Build the integration branch.** Rebase `test/film-interleave` onto current `main`, add B3 + S8, write the **two seam adapters** (`onGrow`↔`grow`, and the three-way `StoreWorld` reconciliation where B5's hook consumes B4's interaction state), then the four interleaving tests. Also sweep the live-suite `beforeAll` fix across all seven branches here.
7. **Then QA-Lead consolidates Gate 2 against the merged tree** — carry forward: B2's sanctioned `FilmLayer.tsx` exception, B4's deliberate read-only ring on the feed side, and the ambient-loop dial (0 ambient at ≤2 cards in view, 1 at 3, 2 at ≥4).
8. **On PASS merge to `main`**, full suite after each step, push. **Then T2 (B6)** — the Wave-3 packet's briefs 10–13 are written and ready at `docs/08-agents_work/handoffs/2026-07-21-wave3-dispatch-packet.md`.

---

## ORCHESTRATION NOTES THAT MATTERED

- **Subagents go idle without reporting.** Roughly half the time. Check for written files, then `SendMessage` asking for the report. Never assume silence = clean.
- **Verify claims yourself when cheap.** Independent checks caught: the zero-delta FLIP, the `created_at` grant, B4's literals-not-imports, the fixture cycling, B5's stripped `Secure`.
- **The eyes-on gate found what 4,600 passing tests could not.** A maker's words rendering invisible; contrast passing against a fiction; a typographic rule expressed as a number producing opposite results across two faces. **Do not let a wave merge without a designer looking at it.**
- Workers repeatedly made *better* calls than their briefs when told the reasoning — B5 deleted a module rather than keep a re-export hop; B2 sampled the computed matrix rather than re-deriving easing. **Brief the why, not just the what.**
