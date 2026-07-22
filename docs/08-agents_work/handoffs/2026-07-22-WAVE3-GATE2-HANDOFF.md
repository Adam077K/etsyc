# KOL — Wave 3 Gate-2 Handoff (paste-ready)

*From session `ceo-1-1784669503` · 2026-07-22. **Wave 2 and Wave 3 T0a are DONE and merged to `main`.** Wave 3 T1 is **built (7/7) but UNMERGED — Gate 2 is mid-flight with two active BLOCKs.** Start by finishing Gate 2.*

---

## ✅ CURRENT STATE — READ THIS FIRST (supersedes the spend-limit section below)

**The buyer spine is built, connected, and mutation-pinned at every seam.** Gate 2 returned **PASS (Full tier, 0 P0/P1)** on `integ/wave3-dryrun` @ `be11a12` — **but the CEO sent it back**, because that verdict predated two facts: the Playwright e2e suite has *never been executed on the merged tree*, and a live font defect sat inside the tree it passed. A re-verdict is pending on the final tree.

### Blocking on the Founder — one action closes four items
**Re-apply `supabase/seed/002_w3_seed_worlds.sql` to staging** (all upserts; no hand-written mutation needed). A worker's scoped PATCH was **denied by the permission classifier**; it stopped, and the CEO declined to run the same privileged write from a more permissive session — *being able to is not authorization*. That re-seed lands: both font fixes · the 36-file debug-caption strip · the craft-line data-shape fix · and unblocks the ferreirapress eyes-on capture.

Also still outstanding: **real maker footage** (gates 5 acceptance criteria) and the **`store-media` bucket**.

### 🔤 THE SHARPEST DEFECT OF THE WAVE — silent, live, and specified
`lib/theme/custom.ts:43` fell back to a **quoted passthrough** of any declared font family. `ferreirapress` declared `"Space Grotesk"`/`"Source Serif 4"`; `isoldeglass` declared `"Archivo"`. **None are in the catalog. None are loaded.** Both worlds rendered their type in the system stack — **two of two custom seed worlds** — with every test green.

The second one was found *by the guard written for the first*, on its first run. It was invisible to inspection because isoldeglass's **display** face was fine; only its body text was wrong, so the world looked broadly right.

> **The reason this class produced live wrongness rather than mere coverage gaps: the fallback was specified behaviour. Nothing was broken. The system did exactly what it was told, and what it was told was silent.**

Fixed: both worlds re-faced to catalog faces (ferreirapress → Fraunces/Satoshi, a letterpress printer's display face carrying impression-on-paper character; isoldeglass → General Sans). `font-catalog.test.ts` now parses the seed SQL and fails on any off-catalog family. Whether the runtime should *loudly reject* rather than fall back is an open §5.5 catalog decision.

### 🕳️ FAIL-SAFE BRANCHES THAT WERE NEVER EXERCISED — systematic inventory
Triggered by finding that **no fixture rendered the modulated nameplate register at all**, making a `DECISIONS.md` merge gate literally unsatisfiable. The class:

> **A fail-safe default that is never exercised looks identical to a working feature.** Coverage won't flag it (the fallback line *is* covered). Tests won't flag it (the fallback *is* correct). It surfaces only when someone asks: *has anything ever taken the other branch?*

| # | Finding | State |
|---|---|---|
| 1 | font passthrough (above) | **live defect ×2** — fixed |
| 2 | `custom.ts:54` light-mode `--on-media` — ran live on ferreirapress, asserted nowhere | pinned |
| 3 | `curated.ts:60` `accent3 ?? accent` — dead both ways, zero consumers | removed |
| 4 | `accentCtaPair` generic-dark branch — fires for no existing world | emission-pinned only |
| 5 | **6 of 10 palette × mode combos have never been rendered** (sunbaked-D, orchard-D, market-plum-L, cuberto-noir L+D, bazaar L+D) | **open gap** |
| 6 | **curated-MODULATED nameplate has never painted** — all seeds author statements, so the absent-statement path never runs on the curated path; covered only via custom/noor | **open — may gate B3 merge** |
| 7 | `reviews` layout variants, `atmosphere block-ground` silent fall-through, `dimensional` motion preset | reported |

**#5 matters beyond itself:** Design-Lead's shadow-blend and badge-opacity findings *cannot be measured*, because no dark world is rendered anywhere to measure them on. **The evidence base itself has a hole.**

### 📏 THE MOBILE CONSTRAINTS WERE PROVABLY UNSATISFIABLE — and got fixed at the root
An engineer **derived** (not guessed) that **(d)-hard, (e)-literal, the bleed cadence, and anti-periodicity cannot all four hold** under §1.6: `M-OFF-L`/`M-OFF-R` were accidental **215px bilateral mirrors**, so (d) deleted their adjacency edge, leaving one edge-breaker and forcing a ping-pong that anti-periodicity then rejected. Any three could hold.

Design-Lead chose **Path A — fix the slot table**, not "pick three and record it": *"choosing three is honest but permanently leaves a spec that asserts something it cannot satisfy."* `M-OFF-L` right inset 128px → **112px** (231px vs 215px, 16px apart). Widen left rather than narrow right because `M-OFF-L` is 1:1 (231×231 reads as an editorial plate) while narrowing 3:2 `M-OFF-R` yields a thumbnail.

### 📐 CONSTANTS REGISTER — approved, `KOL-design-system.md` §6
Four instances this wave of **one constant calibrated in isolation, wrong at the other end of an unnamed axis**: nameplate weight (typeface stroke contrast) · caption margin (descender depth) · atmosphere tint (ground luminance) · and the constraint-set version above. Design-Lead caught the first itself, then repeated the mistake twice — **evidence the insight does not survive as an insight.**

Every appearance-governing constant gets a row: value · **calibrated-against** · **blind-to** · far-end check (**measured / reasoned / derived** — explicit, never uniform confidence) · status (`OK` / `KNOWN-GAP` / `NEEDS-CHECK` / **`NEEDS-RENDER`** for "measurement context does not exist"). Pre-merge gate; auto-flag any `color-mix(in oklab, token N%, …)` on a wide-luminance token (*"the reviewer does not need to understand oklab — the pattern match is sufficient"*); re-grep `Blind-to: ground luminance` whenever a palette world is added.

**Constraint-set companion:** when adding a constraint on a layout variable, verify against every other constraint on that variable that a simultaneously-satisfying assignment exists.

---

## 🛑 (HISTORICAL) SESSION INTERRUPTED BY A MONTHLY SPEND LIMIT

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

### ✅ RECOVERY AFTER THE LIMIT LIFTED — work re-dispatched and landing

The spend limit lifted and workers spawn again. Completed since:

| Branch | Head | Base | What landed |
|---|---|---|---|
| `test/b2-filmlayer-wiring` | `b0c9c98` | `ae303c7` | **The fake test is dead.** A real FilmLayer-level test renders `FilmLayerProvider` and queries actual DOM (`[data-film-layer]`, `video` tags) instead of the classnames the counter selects on. `FRAME_MEDIA_SELECTOR` is now exported and the rig derives from it. **All 3 mutations verified red** — including the buffer-only classname rename, the variant nothing caught before. Film suites 24 → 25. *CEO-verified independently.* |
| `test/b4-world-interaction` | `13b4a26` | `2ef539e` | **B4's last coverage hole closed. 5 surviving mutants killed.** Browse suites 17 → 21. *CEO-verified independently.* |
| `test/b1a-live-race` | `6024cfc` | `763522c` | **The shared-pool race is fixed** by scoping assertions to seed stores (option 1). Race reproduced deterministically: old whole-pool assertion RED under churn, scoped assertion GREEN under the same churn. *CEO-verified independently.* |

**Why option 1 (scope) beat option 2 (advisory lock)** — worth keeping, it generalizes: the invariants these tests state are **per-card** ("no served clip is non-feed-eligible", "same session → same order"); quantifying over the whole shared pool was incidental. And scoping is provably lossless here: `seededJitter` is FNV-1a over `sessionId:videoId` (`rank.ts:58-70`) and the final sort compares each card's own score (`rank.ts:304`), so **the seed subsequence's relative order is structurally invariant to other rows entering or leaving the pool.** Empirically confirmed — the seed subsequence was byte-identical in both arrays while the pool churned. An advisory lock would instead have killed live-suite parallelism exactly as agent count grows, added lock-timeout failure modes, not protected against non-suite writers to staging, and left the over-broad assertions in place.

Anti-triviality guard (a scoped assertion can narrow until it's vacuously true): three `toBeGreaterThanOrEqual(SEED_HANDLES.length)` floors at `live-feed.test.ts:219,254,288` plus a hard `beforeAll` check at `:112` that fails loudly if the seed stores aren't all present.

**Path correction, recorded so it isn't repeated:** the coverage audit's UNFINISHED item named `lib/browse/world-interaction.ts`. **That file does not exist.** `lib/renderer/world-interaction.ts` is a 28-line context contract carrying none of the four behaviours — all four live in **`lib/browse/BrowseSwapController.tsx`** (190 lines). Audit that.

B4 audit result: midline-crossing-consumed and floor-applies-on-attempts were **already genuinely pinned** (proved by red mutation, no padding added). Three things were NOT: the floor running from **mount** (every existing test advanced the clock past the floor first), **all three legs of the fallback chain** (test 1's mock returned src/poster identical to the config clip, so preference was indistinguishable), and **late-response discard after a stage change**.

**B2's work now spans two branches** — `test/b2-gate2-coverage` @ `ae303c7` (3 items) and `test/b2-filmlayer-wiring` @ `b0c9c98` (fast-forwards cleanly onto it). Integration needs both. Same for B4: `test/b4-browse-boundary` @ `2ef539e` then `test/b4-world-interaction` @ `13b4a26`.

**Independent confirmation of the CI defect:** a worker in a fresh worktree hit *"7 `live-*` suites fail at collection — supabaseUrl is required"* without knowing it was a known issue. That is exactly what CI does today.

### 🟢 INTEGRATION DRY RUN — `integ/wave3-dryrun` @ `7058a0a` (off `main` @ `578a7ce`)
The merged tree now exists. **11 branch tips merged, keyless full run: 48 files (39 passed / 9 skipped) · 803 tests — 743 passed, 60 skipped, 0 failed.** typecheck and lint clean. B1b and B3 deliberately excluded (both being rewritten).

**Conflict map:** merges 1–5 and 7 are **CLEAN** (the test chains merge cleanly because each contains its parent). Only `feat/b5-narration-shrink` conflicts, in 3 files:
- `.claude/memory/DECISIONS.md` — mechanical, take HEAD
- `docs/06-design/KOL-wave3-screen-specs.md` — mechanical, take HEAD
- **`lib/renderer/StoreWorld.tsx` — the real one.** B4 brings `WorldInteractionContext` + `selectedProductId` + `data-selected-product`; B5 brings `useProductNarration` + `narrationProductId`. Resolution is a union **plus the seam wiring**. ⚠️ **B3 will conflict here again — whoever resolves it must preserve the wiring line.**

**The seam is now wired and pinned.** Resolution: `productId: narrationProductId ?? selectedProductId` — B4's recorded click drives narration, an explicit prop overrides it (B6's product-page case). The proof it matters: under an unwire mutation the new test goes red while **B5's five original tests stay green** — the existing suite was structurally blind to this seam, which is exactly why both units were green while NARRATE_SHRINK narrated the store-wide fallback.

**Clean-merge-but-broken-on-contact findings:**
1. **FIXED** — `live-feed.test.ts` (B1a) and `live-products-boundary.test.ts` (S8) were **born broken**: their branches forked *before* `test/live-suite-collection-fix`, so git merged everything cleanly and the merged tree then failed 2 files at collection keyless. Repaired in `924f16a`.
2. **FIXED (in flight)** — ring-cookie **write attributes** were declared **four independent times**, and browse's module-level const froze `NODE_ENV` at import — the exact bug narration's F2 fix forbids. See the DECISIONS entry: *a convention recorded in prose is not a convention.*
3. **VERIFIED CLEAN** — cookie *names* (2 declarations, all else imports); no cross-branch DOM/state collisions (`HeroStage`, dock rect, `data-*` attrs each have one writer; the three `swapClip` writers are stage-disjoint with guards pinned on both sides); no dangling imports from the B1b/B3 exclusion.

**Known unknown:** S8's live suite repair was not executed live (heavy fixtures — 3 users, storage, orders). Structurally identical to the 8 proven suites; the two observable differences are 5 clients instead of 2–3 and a storage-bucket probe later in `beforeAll`. The keyless-skip half **is** verified in the merged tree. The with-keys live path is **inference, not execution** — needs one live run. Carry as unverified, not done.

### ✅ BOTH DESIGN TRACKS COMPLETE

**B1b — `feat/b1b-design-r2r3` @ `f99210c`** (off `feat/b1b-gate2-fix`). All six Gate-A items. Unit 702/702, e2e 16/16, typecheck + lint clean.
- **R3 shipped**: the S1→S2→S3 cycle is deleted; cost-based assignment per §4.1b, deterministic, 6th slot `COLUMN`, five row patterns.
- **The period gate is real**: no ordered slot sequence of length 3–6 occurs more than twice at N=18, ≥4 distinct row patterns, re-asserted in e2e on *rendered* order and proven against the `?grid=1` control. Mutation reproduced the critic's exact 5-card period. **It also fired twice unprompted during development** — catching the engineer's own first pass cycling `LEAD,SIDE,COLUMN`, then a mobile 5-cycle a weight change resurrected.
- **⚠️ SPEC CORRECTION for Design-Lead — §4.1b's cost function is partly inert in production.** Production emits **uniform 4:5 for every card**, so the aspect-fit term does nothing and greedy argmin on homogeneous input settles into a limit cycle. Three added terms (transition-echo 0.9/0.45, usage-balance 0.4/use, FNV-1a hash of (videoId,slot) at 0.22) are **load-bearing, not embellishment**. With real footage of varied aspect, aspect-fit would do its intended work — another consequence of having no real film.
- **⚠️ SPEC CONFLICT for Design-Lead:** the literal every-viewport form of mobile constraint (e) is **unsatisfiable** under the binding §1.6 table — (d) forbids `M-OFF-L`↔`M-OFF-R` adjacency and the bleed is gap-limited, so an occasional same-edge pair is forced by the constraint system itself. Implemented as: dominant edge breaks within any 3 consecutive cards + 0.95 edge weight making pairs a last resort.
- **The debug-caption defect was 36 files, not 1.** The critic spotted one string on one feed card. It was in all 20 poster SVGs — and then in **16 more**: every product frame, portrait frame and scene frame, which render on **B4/B5 world surfaces**. All stripped; `grep -ril placeholder public/seed` now returns nothing. *CEO-verified.*
- **N=18 evidence is now honest on both axes.** The first re-capture had 18 distinct *names* but only **8 distinct poster images** (2–3 uses each) — caught by CEO eyes-on, not by the report, which said "no visible repetition." Now 18 distinct stills, palette-interleaved, and the e2e pins **both** axes so the image axis can't silently regress the way the name axis did. Composition is bit-identical (poster src never enters the composer), so captures stay comparable.
- **Why it mattered, in the engineer's own re-review:** the recycled images created *"false periodicity anchors — the same blue pool and orange dome recurring at similar card sizes suggested a periodicity the slot sequence didn't actually have; the eye latched onto the repeats and read 'pattern'."* With distinct stills the phantom rhythm is gone and slot variety reads as editorial pacing. **A composition gate judged against recycled imagery measures something other than the composition.**
- **Open caveat for the critic's eyes-on:** all seed art comes from one generative template family (gradient ground + single motif), so four line-motif cards carry a sibling resemblance despite distinct files and palettes. That is asset generation upstream of this unit, not fixture cycling.

**B3 — `fix/b3-gate2-contrast` @ `c2f7469`.** Statement **1.04:1 → 7.32:1**, caption **3.78:1 → 7.32:1**, 661/661. Scrim moved onto the chrome block (direction 2) so the band tracks its full rendered height. R1 `strokeClass` register shipped with no numeric weight; `craft` P3 dropped.

### 🎨 DESIGN-LEAD BAND RULING — final, ready to implement
Session file: `docs/08-agents_work/sessions/2026-07-22-design-lead-band-weight.md`.

The fix produced a band covering ~85% of the hero at 1440px and **the entire frame at 375px** — a mobile hero with zero film, on a product whose premise is makers on film. Correctly diagnosed as a **frame-size failure, not a scrim failure**: `aspect-video` at 375px is 375×211px, so frame height ≈ minimum chrome height and no scrim tuning can help. Partial transparency is foreclosed by arithmetic — meeting 5.5:1 over potentially-white film needs alpha ≥ **0.953**, at which point film is 4.7% visible.

**Three changes to `components/blocks/hero-video/index.tsx`:**
1. `frameClass` → `aspect-[4/5] sm:aspect-video` on `full-bleed` and `center-column` (`corner-shrunk` exempt). Portrait mobile hero → ~40% coverage, ~60% film visible.
2. Statement `<h1>` → `text-[min(var(--fs-display-hero),8cqi)] sm:text-[min(var(--fs-display-hero),10cqi)]`
3. Caption `<p>` → `mt-4 md:mt-10` (both branches) — absorbs the critic's ≥40px descender P2.

**Lever 5 (2-line clamp) was ruled, then CHALLENGED BY CEO AND WITHDRAWN.** It reproduced the 1.04:1 failure structure exactly — full text in the DOM, screen readers fine, contrast green, and a maker's statement stopping mid-sentence in production. Design-Lead's own verdict: *"That's not belt-and-suspenders. That's the defect pattern wearing a safety label."* Residual risk relocated to the authoring layer: a `maxlength` on the seller editor, and word count (~10 words) as a better proxy than character count at display-hero scale — a CPO spec revision, not a CSS clamp.

**RE-CONFIRMED against film-backed captures** (2026-07-22, after the 0×0 fix). Design-Lead re-judged all three open questions with footage actually in the frame and **amended nothing**:
- `aspect-[4/5]` at mobile is *more* confirmed — at 375px the film shows only as a sliver through the rounded corners; a 375×211px landscape frame cannot show chrome and film simultaneously regardless of footage.
- ~50% coverage on name-only at 1440 reads as **intentional editorial composition** with film present: *"the maker's world occupies the top, the maker's name occupies the bottom"* — not "a band covering half the hero."

**⚠️ NEW, UNRESOLVED, AND STRUCTURAL — scrim legibility depends on footage luminance.**
> *"Light footage makes the scrim band visually harder than dark footage. In the Sena statement capture the warm-to-charcoal transition is clearly visible — the band reads as a dark card placed over the bottom of the film. In Noor's dark navy captures the scrim is invisible as a design element; text appears to live naturally inside the frame. Both pass contrast; the difference is perceptual, not measured."*

This **cannot be resolved while meeting ≥5.5:1 over light footage** — the alpha ≥ 0.953 arithmetic forecloses it. It is not a defect and no lever fixes it. The suggested direction is **world-specific scrim tinting** (a warm-tinted scrim for sunbaked-palette worlds instead of neutral ground-tinted charcoal), which is a design-system palette question for a later cycle. **Re-evaluate the moment real footage lands** — every judgement here is still against synthetic gradient art, which is better evidence than cream but not final evidence.

### 🧩 THE SEAM LEDGER — the wave's defining discovery
Three seams connect the buyer journey. **All three were specified and none were written.** Every unit was green; the journey did not exist.

| Seam | State | What was actually wrong |
|---|---|---|
| **B4 → B5** (StoreWorld) | ✅ wired + pinned | B4 recorded the tapped product as internal state; B5 read a prop nobody passed. Tapping narrated the store-wide fallback |
| **feed → grow** (B1b → B2) | ✅ wired + pinned | **`GrowProvider` had ZERO production consumers — nothing in the tree mounted it.** B2's whole feature was unreachable. Its contract doc specified the mapping B1b should write; nobody wrote it |
| **grow → world** | ⏳ in flight | Was a documented no-op — there was no world route until B3 folded in |

**Proven twice, with numbers: per-branch green says nothing about the journey.** Under the feed→grow unwire mutation, B1b's and B2's own suites return **62/62 GREEN**. Under the StoreWorld unwire, B5's five originals stay green. Both suites were structurally blind: B1b pins `onGrow` against a `vi.fn()`; B2 drives `grow()` with a hand-built source. **Neither ever touched the other.**

The generalizable rule: **a unit test that constructs its own counterparty cannot detect that the counterparty was never connected.** Any contract spanning two units needs a test that mounts both.

### ♻️ THE RE-TYPED CONSTANT — eight instances in one wave
1–4. Four cookie *name* conventions · 5. cookie *attributes* (×4 sites) · 6. `405` for `resolveEdgeMs("ungrow")` · 7. `CHROME_LEAVE_MS` duplicating `--dur-state` · 8. test rigs re-typing `FRAME_MEDIA_SELECTOR` · 9. the `kol_sid` mint's inline attribute copy · 10. **B1b re-typing `"data-feed-card"` instead of importing B2's `FEED_CARD_ATTRIBUTE`**

The last one is the aspect-counter pattern exactly: **B2's parting test plants its own attribute**, so a rename in B1b would silently no-op the parting choreography with every suite green. A self-referential rig cannot observe the thing it claims to test.

**Cookies are now compiler-enforced** — seven declaration sites down to **one** (`firstPartyCookieOptions()` in `lib/feed/session.ts`, middleware-safe, a *function* so `NODE_ENV` can't freeze at import). The `kol_sid` mint had **never had an attribute pin of any kind** — the least-guarded cookie in the system was the one minting buyer identity.

### 📐 FINAL DESIGN RULINGS (all closed 2026-07-22)

| Item | Ruling |
|---|---|
| **Lever 6 caption margin** | `mt-4 md:mt-12`. Original `mt-10` arithmetic was **inverted** — descenders eat *into* the margin, not extend it. Measured ink-to-ink: `mt-10` gave 42px grotesk / **38px Fraunces** (short of the ≥40 bound); `mt-12` gives ~50 / ~46. **Same class as R1** — a value correct on one face and wrong on another because stroke properties differ |
| **375 coverage metric** | **Solid-band coverage**, not "fully clear." Counting the fade as covered film would logically require setting the fade to zero and painting a hard edge — the wrong fix. Denominated the same way `HERO_CHROME_MAX_FRACTION` is (`getBoundingClientRect()` on the chrome box, excluding the pseudo-element fade) |
| **Mobile film-exposure gate** | **Revised ≥50% → ≥48%; 48.8% accepted.** ⚠️ *Read the rationale before treating this as goalpost-moving:* the ≥50% figure was **calibrated against the clamped (truncated) statement**, which has since been withdrawn — a criterion derived from a defect. The shortfall is **5.6px** in a 469px frame, ≥50% was a round number rather than a perception threshold, and tightening the fit for 1.2pp would mean a mobile-specific cap constant. **The trade is explicit: 5.6px of band in exchange for the maker's third line staying on screen** |
| **`fitStatementScale`** | **APPROVED as canonical.** Measures rendered lines via `Range#getClientRects` after `text-wrap:balance`, scales rather than truncates, enforces the coverage bound directly. **Supersedes** the `maxlength` seller-editor requirement, the word-count authoring spec revision, and the residual long-statement risk from the Lever 5 withdrawal. An engineer's implementation choice answered a design question two roles had been arguing in the abstract |

⚠️ **UNREVIEWED ARCHITECTURE — route to QA-Lead.** Design-Lead flagged, correctly, that it approved the scrim's *behaviour* but has no authority over its *structure*: `.kol-hero-chrome` replaces the original `::before` approach and `kol-scrim` moved to the frame container on `feat/b3-world-unfold`. Load-bearing, design-approved, **never code-reviewed.**

### ✅ ALL 13 ORIGINAL DESIGN-CRITIC FINDINGS RESOLVED

The last to close was the isoldeglass "stray warm band" (P3), and it resolved as **correct behaviour + a catalog spec gap** — not a theme leak, not a B3 defect, and explicitly **not** bad configuration.

**Mechanism.** `atmosphere/index.tsx:31` renders `ground → color-mix(in oklab, accent 10%, ground) → ground`. The formula is right; the **10% constant is perceptually weighted, so its effect scales with the luminance distance between the inputs**:
- cream baseline (ground L\*≈95) → midpoint L\*≈94: a ~1 L\* delta, invisible, reads as seamless connective tissue
- near-black ground (L\*≈1–2) with a warm accent (L\*≈50+) → midpoint L\*≈6–8: a **4–6 L\* delta**, a clearly visible warm stripe

That is perceptual non-linearity in oklab near the luminance floor, not a rendering error.

**Why it isn't the seller's fault** — the reasoning generalizes past this block:
> *"The supposedly neutral fallback (`var(--surface)`) is not safe on dark palettes either: on a dark-world theme `--surface` is measurably lighter than `--ground` and produces a visible brightness band rather than a hue band. The catalog provides no configuration that behaves correctly on near-black grounds. **It is not honest to call this a configuration error when the correct configuration does not exist.**"*

**Future cycle, catalog-tier — Option A preferred:** introduce `--atmosphere-tint-pct` (default `10%`); dark-palette world themes set `3–4%`. One line, no block logic change, no schema change — a calibration lever at the theme layer. Option B (seller-facing documentation telling authors to avoid the variant on dark worlds) shifts the burden to guidance instead of fixing it.

**The pattern worth carrying:** this is the *third* instance this wave of **a single constant calibrated implicitly against one context and wrong in another** — nameplate weight across stroke classes (R1), caption margin across descender depths (Lever 6), and now atmosphere tint across ground luminance. Each looked like a value bug and was really a missing axis. When a design constant is a bare number, ask what it was calibrated against and what happens at the other end of that range.

### 🔍 TWO EVIDENCE DEFECTS THAT INVALIDATE EARLIER REVIEWS
1. **Capture contamination.** `playwright.config.ts` hardcoded `localhost:3000` with `reuseExistingServer: true`, and this repo runs ~60 worktrees. A worker's first capture run silently screenshotted **another worktree's dev server**. **Any capture-based review predating the `KOL_E2E_PORT` fix should be treated with suspicion.** Mitigating: the critic's Gate-B numbers were independently reconstructed from theme math on the correct build, so those findings were real.
2. **`/preview` renders no film at all.** The app-root Film Layer holds a **0×0 rect** there, so the hero backdrop is bare `--surface` cream. This is why the statement measured 1.04:1, why "contrast measured against a fiction" recurred all session, and why a design critic could judge a *video-native* surface showing no video. **Fix in flight** — after it lands, re-capture the five heroes on a private port and re-judge the band ruling against a frame that actually contains footage.

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
