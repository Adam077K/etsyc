# KOL — Wave 3 Gate-2 Handoff (paste-ready)

*From session `ceo-1-1784669503` · 2026-07-22. **Wave 2 and Wave 3 T0a are DONE and merged to `main`.** Wave 3 T1 is **built (7/7) but UNMERGED — Gate 2 is mid-flight with two active BLOCKs.** Start by finishing Gate 2.*

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

### Reviewer status
| Reviewer | Verdict |
|---|---|
| adversary (`adv-gate2`) | 🔴 **BLOCK** → B5's two P2s **fixed** in `8b537a2`, **not re-verified** |
| code-review feed (`cr-feed`) | ✅ **PASS** — 0 P1 |
| design-critic (`critic-gate2`) | 🔴 **BLOCK both gates** — 13 findings |
| coverage (`qa-cov-gate2`) | ⏳ never reported |
| code-review film (`cr-film-consumers`) | ⏳ never reported |
| interleaving e2e (`e2e-interleave`) | ⏳ dispatched, never reported |

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

## FIRST FIVE ACTIONS FOR THE NEXT CEO

1. **Re-dispatch the three silent reviewers** (coverage, film-consumers code review, interleaving e2e) and collect `b3-gate2-fix`.
2. **Dispatch the design work — rulings are decided, nothing is waiting on a decision.** To B1b: R2 mobile slot table, R3 content-aware assignment (replaces the S1→S2→S3 cycle), plus the void, caption data shape, debug string, N=18 re-capture. To B3: R1 `strokeClass` nameplate, the invisible statement block, the 3.78:1 caption. Someone must also add `strokeClass` to `KOL-design-system.md` §3 — Design-Lead flagged it as outside their own edit scope.
3. **Spawn QA-Lead for the consolidated Gate-2 verdict** — carry forward: B2's sanctioned `FilmLayer.tsx` exception, B4's deliberate read-only ring on the feed side, the `flightRef` disposal gap, the merge-order constraint, and the ambient-loop dial recommendation (make count a function of cards in viewport; 0 ambient at ≤2 in view).
4. **On PASS: merge B1a → B1b (rebased) → B2 → B3 → B4 → B5 → S8**, full suite after each, push.
5. **Then T2 (B6).** The Wave-3 packet's briefs 10–13 are written and ready at `docs/08-agents_work/handoffs/2026-07-21-wave3-dispatch-packet.md`.

---

## ORCHESTRATION NOTES THAT MATTERED

- **Subagents go idle without reporting.** Roughly half the time. Check for written files, then `SendMessage` asking for the report. Never assume silence = clean.
- **Verify claims yourself when cheap.** Independent checks caught: the zero-delta FLIP, the `created_at` grant, B4's literals-not-imports, the fixture cycling, B5's stripped `Secure`.
- **The eyes-on gate found what 4,600 passing tests could not.** A maker's words rendering invisible; contrast passing against a fiction; a typographic rule expressed as a number producing opposite results across two faces. **Do not let a wave merge without a designer looking at it.**
- Workers repeatedly made *better* calls than their briefs when told the reasoning — B5 deleted a module rather than keep a re-export hop; B2 sampled the computed matrix rather than re-deriving easing. **Brief the why, not just the what.**
