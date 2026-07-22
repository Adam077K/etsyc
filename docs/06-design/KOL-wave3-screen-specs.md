# KOL — Wave 3 Per-Screen Design Specs (B1–B5)

*Design-Lead · 2026-07-21. Build-ready design specs for the five buyer surfaces. Each `§` is a self-contained Design-Build worker brief and can be handed over verbatim. Read [`KOL-wave3-design-direction.md`](./KOL-wave3-design-direction.md) first — the Seven Invariants, the Film Layer, and the motion edge table are assumed here, not repeated.*

**Why one file and not five.** The persistent film crosses all five surfaces. Specifying the transitions in five separate documents guarantees five slightly different transitions. §0 holds everything shared; §§1–5 hold what is genuinely per-screen.

---

## 0 · Shared vocabulary (applies to all five)

### 0.1 The Film Layer

One `<video>`, mounted once at app root, fixed-position, `--z-film: 40`, never unmounted for the session. Each state assigns it a **target rect**; it moves between rects by FLIP transform only. `HeroStage` publishes the rect for the current stage; it does not own the element. `view-transition-name: hero-video` stays on `.kol-hero-stage` as the cross-route morph hook.

**Non-negotiable across every state:** the element is never remounted, `paused` never flips true, the source swap is always an in-frame cross-fade at `--dur-swap` (120 ms) so a black frame never appears, and audio stays off until the buyer opts in.

### 0.2 Transition edges

Per design-direction §5.2. Restated compactly for reference: `grow` 520 ms `--ease-kol` · `unfold` 900 ms `--ease-cinematic` · `dock` 440 ms `--spring-video` · `undock`/`ungrow` at `--return-ratio` 0.78 × forward · `swap` 120 ms.

### 0.3 The four states — house rules

These are the same four rules the block catalog already enforces; they are repeated here because a worker building a *screen* rather than a *block* has to apply them at screen level too.

| State | Rule |
|---|---|
| **Empty** | Empty ≠ blank. A warm invitation, in the interface's voice, never a void and never a spinner-shaped hole. |
| **Loading** | Skeleton matched to the **real final geometry**, never a centred spinner. Reserve exact space so nothing shifts on resolve (CLS 0). Posters paint immediately; text never waits on media. |
| **Error** | Quiet, inline, recoverable. Serve cache where cache exists. A failure never blocks the rest of the surface, and never blocks the film. |
| **Success** | The live surface. |

### 0.4 Accessibility floor (QA-Lead gates on this — no waiver)

Body copy AA 4.5:1, display type AA large 3:1, on whatever colours the world brings · **no opacity modifier on any ink token** (see [AA fix](./KOL-wave3-aa-fix-muted.md) §3) · every card and control keyboard-reachable with a visible `:focus-visible` ring (`2px solid var(--accent)`, `offset 2px` — already in `globals.css`) · minimum 44 px hit target (`min-h-11`, the codebase convention) · captions available on every clip · `prefers-reduced-motion` per design-direction §5.3, with **playback continuity preserved** · every image carries real `alt`; decorative bands carry `aria-hidden`.

---

## 1 · B1 — Discovery Feed (`FEED`)

**Surface:** KOL's own chrome. `theme.kind:"curated"`, `sunbaked`, light. **No seller theme reaches this screen** (Invariant I7).

### 1.1 Layout intent

A magazine index of people, not a catalogue of things. The reader should feel they have opened a publication whose subject is makers. Composition carries the identity — see the reference pass on why film-in-cells is still a grid.

**The grid is a measuring device, not a cell structure.** 12 columns, `max-w-page` (1440), `--space-6` gutters. Cards are placed into named **slots**; slots vary in span, aspect, and vertical drop.

| Slot | Span | Col start | Aspect | Drop-Y |
|---|---|---|---|---|
| `LEAD` | 7 | 1 | 4:5 | 0 |
| `SIDE` | 4 | 9 | 1:1 | `--space-12` (96 px) |
| `WIDE` | 8 | 3 | 16:9 | 0 |
| `INSET` | 5 | 1 | 3:2 | `--space-8` (64 px) |
| `TALL` | 5 | 8 | 4:5 | 0 |
| `COLUMN` | 4 | 5 | 3:4 | `--space-6` (48 px) |

`COLUMN` is new (2026-07-22). A narrow centred portrait plate with four columns of open ground on each side — the magazine move the first slot table had no vocabulary for, and the cheapest widening of the permutation space below.

**Rows** are the composition unit. Any set of slots whose columns do not overlap is a legal row. With six slots that is five row patterns, not three:

| Row | Slots | Reads as |
|---|---|---|
| `R-LEAD` | `LEAD` (1–7) + `SIDE` (9–12) | big-left / small-right |
| `R-INSET` | `INSET` (1–5) + `TALL` (8–12) | small-left / big-right |
| `R-CROSS` | `INSET` (1–5) + `SIDE` (9–12) | two smalls, wide ground between |
| `R-WIDE` | `WIDE` (3–10) alone | the breath |
| `R-PLATE` | `COLUMN` (5–8) alone | the centred plate |

Rhythm: `--space-10` between cards *within* a row, `--space-16` *between* rows. Two rhythms, not one — that is what makes it read composed rather than tiled.

**Slot assignment is content-aware, not cyclic** *(2026-07-22, gate-2 critic ruling — replaces the fixed S1→S2→S3 cycle, which at N=18 repeated 3.6 times and read as exactly that)*. Cards are placed by an art-director rule, not a rotation: **the clip picks the slot it belongs in, and the composition refuses to repeat itself.**

For each card in engine order:

```
eligible = slots whose crop keeps the clip's focalPoint at least 12% inside
           every crop edge, and whose columns fit the open space in the
           current row (else open a new row)

cost(slot) = |ln(clipAspect / slotAspect)|          // aspect fit — dominant term
           + 0.50 · repeatPenalty(slot, last 2 placements)
           + 0.35 · edgePenalty(slot.colStart, last 2 col-starts)

place at argmin(cost); ties break to the least-used slot so far
```

**Hard constraints (not scored — a placement violating one is illegal):**

1. No slot repeats within 2 placements.
2. No row pattern repeats **consecutively**.
3. A row's spans never overlap; a card that cannot fit the remaining columns opens a new row.
4. Never end on an orphan half-row — promote the trailing card to `WIDE` (unchanged).

**Deterministic, no randomness.** Same input order → same composition. This keeps the layout test stable and keeps parity with the engine's own anti-repetition posture.

**Degradation when `focalPoint` is absent** (design-direction §8.1 is a schema add that may not have landed in the data yet): treat the focal point as centre `(0.5, 0.5)` and **skip constraint-check 1 of eligibility only** — the focal-safety filter. Aspect fit, repeat penalty, edge penalty, and all four hard constraints still run. **The mechanism ships with or without the schema add**; focalPoint improves the crops, it does not gate the composition.

**Small N is unchanged in intent but expressed through the same rule.** At N = 1 the single card takes `WIDE` at col-start 3. At N = 2–4 the assignment runs normally; hard constraint 4 handles termination. The old N table is retained below as the expected output, and is what the test asserts.

**Termination at small N (closes design-direction OQ-4 — during the seed period the feed returns 4 cards, not 18, because of `distinct on (store_id)`):**

| N | Composition | Why |
|---|---|---|
| 1 | `WIDE` at col-start 3 | An editorial single, not a lonely card |
| 2 | `R-LEAD` | One complete row |
| 3 | `R-LEAD` + `R-WIDE` | A complete opening, then a breath |
| 4 | `R-LEAD` + `R-INSET` | Two complete rows — avoids ending on a lone `WIDE`, which reads as truncation |
| ≥ 5 | content-aware assignment above | Hard constraint 4 handles the tail: an orphan trailing card is **promoted to `WIDE`** |

**Never end on an orphan half-row.** This rule is the difference between "the feed is short" and "the feed is broken."

Engine request limit: **18**. Rationale: 12 reads thin for a publication; 24 thins the anti-repetition pool across few stores. 18 gives the assignment rule enough cards for four distinct row patterns to appear without any repeating consecutively.

### 1.2 The card

Media-first, caption-subordinate (the Cuberto move). **No card chrome** — no border, no shadow, no background. The media is the card. Radius `--radius-md`.

```
┌─────────────────────────┐
│                         │   media: poster still, focalPoint-cropped
│    [film / poster]      │   to the slot aspect (see design-direction §8.1
│                         │   — clips[].focalPoint is a required schema add)
└─────────────────────────┘
  Sena Okafor              ← --fs-h3, font-display, weight 500, text-ink
  CERAMICIST · LISBON      ← --fs-caption, font-text, uppercase, tracking 0.08em, text-muted
```

Nothing else. No price, no rating, no counter, no badge, no urgency chrome — banned per the reference pass. Maker name, craft line, place. That is the whole card.

**Hover / focus:** media scales `1.0 → 1.02` on `--dur-state` `--ease-kol` (transform only; the crop grows, the card box does not). Name shifts to `--accent`. No lift, no shadow.

### 1.3 The Focus Film (design-direction §6.3 — ⚠️ pending OQ-1 sign-off)

The card nearest viewport centre is the **focus card**; the Film Layer positions over its rect and plays its clip. All other cards show their poster still. Up to **two neighbouring cards** may play low-fidelity ambient loops (≤ 6 s, ≤ 480 p, muted, no audio track) — disposable elements, never the shared one.

On scroll, focus moves; the Film Layer FLIPs to the new rect over `--dur-state`, with a `--dur-swap` in-frame cross-fade. Focus never changes more than once per 400 ms (debounce) — a film that re-targets on every scroll tick is nausea, not life.

### 1.4 Masthead

Above the first spread, `--space-12` below it. One line at `--fs-h1`, weight 500, plus a caption eyebrow. This is the feed's single display moment.

```
KOL · TODAY                                    ← --fs-caption, uppercase, 0.08em, text-muted
Twelve people who make things.                 ← --fs-h1, font-display, weight 500, [text-wrap:balance]
```

The count is live and honest. At N=4 it reads "Four people who make things." A fabricated count is a trust failure in a product whose entire premise is honesty.

### 1.5 States

| State | Design |
|---|---|
| **Empty** | No published stores with feed-eligible clips. Masthead becomes "No one's opened their doors yet." Below it, `--fs-body-lg` `text-muted`: "KOL is makers before it is anything else. When the first world opens, it'll be here." Single `--accent-cta` pill: *"Are you a maker?"* → seller onboarding. Warm invitation, no illustration, no empty-box graphic. |
| **Loading** | Full spread geometry renders immediately with `.kol-skeleton` blocks at the exact slot aspects — **the composition is visible before the content is**, which is itself the identity statement. Name/craft lines are two short shimmer bars at real line lengths. Posters swap in per card as they resolve; no reflow. No spinner anywhere. |
| **Error** | Serve the last cached selection (session storage). Above the masthead, one `ErrorInline`: *"Showing you the last set — we couldn't reach the new one."* + retry. If there is no cache, fall through to Empty's layout with error copy: *"We're having trouble reaching the makers. Try again in a moment."* + retry. Never blank. |
| **Success** | Live composition; focus film playing; tapping a card runs `grow` → B2. |

### 1.6 Responsive — and the mobile composition (`< 768`)

Per design-direction §7 for `≥ 768`.

**At `< 768` the feed is single-column and its identity is carried by the left edge.** The prior spec said variety comes from card height and cycled four aspects; the built result at 375 px was eight cards of identical width with uniform gaps — the equal-cell layout design-direction §2.4 bans, one column wide. Aspect alternation is real but it is not enough, because **width equality is what reads as a grid.** Two columns is the wrong fix: it shrinks the maker's face, the one thing that must not shrink.

**Four mobile slots.** Widths are asymmetric, insets differ left and right, and one slot bleeds past both margins. The page margin is `--space-4` (32 px).

| Slot | Left inset | Right inset | Aspect | Caption |
|---|---|---|---|---|
| `M-BLEED` | 0 | 0 | 16:9 | indented `--space-4` from the viewport left edge |
| `M-FULL` | `--space-4` | `--space-4` | 4:5 | flush with media left edge |
| `M-OFF-L` | `--space-4` | `--space-16` (128 px) | 1:1 | flush with media left edge |
| `M-OFF-R` | `--space-16` | `--space-4` | 3:2 | flush with media left edge |

**The caption always aligns to its own media's left edge.** That is the load-bearing detail: the text column zig-zags down the page in step with the media, so the reader never sees a repeating rule. A caption set to a fixed page margin would undo the whole mechanism.

**Assignment uses the same content-aware rule as §1.1**, over this slot table instead of the desktop one — same cost function, same tie-break, same focalPoint degradation. One mechanism, two slot tables.

**Hard constraints:**

1. No slot repeats consecutively.
2. `M-BLEED` appears at most once per four cards and never twice within five.
3. The leading edge (`--space-4` vs `--space-16` vs `0`) never repeats more than twice consecutively.

**Rhythm:** `--space-8` after an inset card, `--space-12` after `M-BLEED` — a bleed card needs more air on the other side of it than an inset one does.

### 1.7 Acceptance beyond the CPO spec

- Desktop layout test asserts (a) rendered cards do not all share identical dimensions, **and** (b) **no two adjacent cards share `getBoundingClientRect().top` within 24 px**, **and** (c) **across N ≥ 12, no ordered three-card slot sequence occurs more than twice and at least four distinct row patterns appear.** (b) catches a grid; (c) catches a *cycle*, which passes (a) and (b) at every card. All three are necessary; none alone is sufficient.
- Mobile layout test at 375 px asserts (d) **no two adjacent cards share a rendered width within 8 px**, and (e) **at least one card per viewport-height breaks the dominant left edge.**
- Composition renders correctly and intentionally at N = 1, 2, 3, 4, on both slot tables.
- Type over film measures **≥ 5.5:1 body / ≥ 4.0:1 large** against its rendered backdrop (design-direction §4.1b — a full point of headroom over the I5 floor, because every number in this wave was measured on a zero-variance synthetic gradient).
- Zero elements matching the banned-chrome list (countdown, discount, sold-count, star cluster).

### 1.8 Data note for the implementer

The engine's `Selection` returns `videos.id` and nothing else about the maker. **Maker `displayName`, craft line, place, and avatar are not in the engine return** and must be joined from `stores` / `profiles` server-side. The engine and the renderer meet only at `videos.id` (video-engine-spec §0.1) — do not widen that contract to solve this.

---

## 2 · B2 — Grow Interaction (`GROWN`)

**Surface:** KOL chrome. Still no seller theme.

### 2.1 Layout intent

The tapped maker becomes the subject; the rest of the publication stays visible around them, slightly withdrawn. This is a **column, not a modal** — the buyer has not left the feed, they have leaned in.

- Film: `hero-video` `center-column` variant. **720 px** at ≥ 1440, 16:9, `--radius-md`, `--shadow-raised`, centred, top at `--space-10` from viewport top.
- The feed remains behind and **remains scrollable**. Non-focus cards translate on Y only to part around the centre column, staggered 70 ms outward from the tapped card. They do not fade, dim, or blur — the buyer is still in the feed.
- Feed ground gets no scrim. If the column needs separation, it comes from `--shadow-raised`, not from darkening the page.

### 2.2 Type over the film

```
Sena Okafor              ← --fs-display, font-display, weight 500, --on-media, over --scrim
CERAMICIST · LISBON      ← --fs-caption, uppercase, 0.08em, --on-media at full opacity
```

Anchored bottom-left of the film, `--space-4` inset. `--scrim` is mandatory (design-system §1.1). Nothing else sits over the film — no controls beyond mute/captions, no CTA, no chrome. One affordance below the column, `--space-3` beneath: a `--fs-caption` uppercase line, *"Tap again to open Sena's world"*, `text-muted`. It appears at `--dur-enter` after the grow settles, not during.

### 2.3 The image path — "meet the person" (closes B2 OQ #1)

Tapping an **image** card grows the still to the same centre-column rect, then resolves to a **portrait card**: the image full-bleed in the column, maker name at `--fs-display` over `--scrim`, craft line in caption, and **one** affordance — `--accent-cta` pill, *"Watch Sena at work."*

Activating it hands the slot to the Film Layer: the clip cross-fades in over `--dur-swap` and the state becomes a normal `GROWN`. **The image path is a doorway to film, not a parallel branch.** One state machine, one film slot, no second code path to maintain — and it honours "meet the human, then buy" more literally than the video path does.

### 2.4 States

| State | Design |
|---|---|
| **Empty** | N/A by construction — `GROWN` is only reachable from a card that exists. Do not fabricate one. |
| **Loading** | Poster frame fills the column immediately at final geometry; `.kol-skeleton` shimmer over it. Name and craft line render **instantly** — they come from store metadata, not from the clip, and must never wait on video. |
| **Error** | Clip 404 / decode fail → hold the `poster` at full column size, `ErrorInline` beneath the column: *"Couldn't load this film."* + retry. The grown state stays fully usable and the tap-again affordance still works — a broken clip must not block entry to the world. |
| **Success** | Film plays muted in the column; feed scrolls around it; second tap runs `unfold` → B3. |

### 2.5 Transition choreography

**In (`grow`, 520 ms, `--ease-kol`):** Film Layer FLIPs card rect → column rect. Feed cards part on Y, 70 ms stagger outward from the tapped card. Name/craft fade in at t=340 (`--dur-enter`), after the film has arrived — media leads text, always. Tap-again affordance at t=520.

**Out (`ungrow`, 405 ms):** exact reverse. Affordance and type leave first (opacity only), then the film FLIPs back.

**Reduced motion:** no FLIP, no parting. The column cross-fades in at `--dur-state`; the film keeps playing.

### 2.6 Responsive

≥ 1440: 720 px column · 1024–1439: 640 px · 768–1023: 92 vw · < 768: full-bleed, top-pinned, feed continues below rather than around.

---

## 3 · B3 — World Unfold (`WORLD_OPEN`)

**Surface:** **the seller's world.** From this state onward the maker's theme applies (curated token lookup or `kind:"custom"` CSS-prop apply). KOL chrome recedes to nothing but the persistent film frame.

This is the product's signature moment. It gets the most care and the hardest budget.

### 3.1 Layout intent

The world **blooms around** a film that never stops. Not a page load with an animation on top — the film is the fixed point and the world assembles about it. The buyer should not be able to identify a moment where "navigation happened."

Film resting position: `hero-video` per the maker's chosen variant (`center-column` default, `full-bleed` for worlds that want the Kotn treatment). It **stays in the rect it grew to** and the world builds around it — it does not move during the unfold. Moving the film *and* building the world in the same 900 ms is two events; keeping the film still makes it one.

### 3.2 The maker's statement and the identity line

*(Amended 2026-07-22 — CPO E5 ruling. The prior text said an absent statement leaves the world with no hero line at all; that contradicted the shipped `hero-video` render and would have judged B3 against a spec the product deliberately contradicts.)*

*(Re-amended 2026-07-22 — gate-2 critic ruling. The E5 text set the absent-`statement` nameplate at a flat `weight 700` at `display-hero`. That was measured wrong: Noor Haddad in Fraunces reads as an airy nameplate at those exact values, and Sena Okonkwo in a geometric sans at the same values reads as a logotype stamped onto her own face. **Optical mass is a property of stroke contrast, not of a number** — the number was never the rule. The nameplate register now comes from design-direction §2.1a, which also dissolves this section's standing contradiction with §2.1.)*

Two lines, two tiers, and **only one of them is display tier in either case**.

**The statement — display tier, seller-owned voice.** `hero-video.props.statement` (design-direction §8.2). One line, ≤ 48 characters, `--fs-display-hero`, **weight 400–500**, tracking `-0.01em`, `--on-media` over mandatory `--scrim`, `[text-wrap:balance]`. Per design-direction §2.1: light and large, not heavy and large. It is a guest on the maker's face. Maker-authored — AI may suggest it at authoring time with the maker's approval, and may never emit it at render time (D10).

**The identity line — platform-guaranteed.** The maker's name is never absent from the hero frame. It occupies whichever tier the statement leaves free:

| `statement` | Display tier — exactly one line | Caption tier beneath |
|---|---|---|
| **present** | the statement — `--fs-display-hero`, weight 400–500, `-0.01em` | `maker.displayName` **leads the line**, then `· maker.craft · maker.location` when `showCraftLine`. With `showCraftLine: false` the name renders alone. |
| **absent** | `maker.displayName` in the **nameplate register** — `var(--nameplate-size)` / `var(--nameplate-weight)` / `var(--nameplate-tracking)`, resolved from the pairing's `strokeClass` per design-direction §2.1a | `maker.craft · maker.location` when `showCraftLine` |

**The nameplate register, restated here because it is the part that gets mis-built:**

| `strokeClass` | Pairings | Size | Weight | Tracking |
|---|---|---|---|---|
| `modulated` | `warm-serif` (Fraunces) | `--fs-display-hero` | 700 | `-0.03em` |
| `uniform` | `statement-grotesk`, `modern-mono-grotesk`, `character-maximal`, and `kind:"custom"` unless it declares otherwise | `--fs-display` | 600 | `-0.025em` |

The renderer reads the three custom properties. **It never branches on a font family name** — that would not survive the first `kind:"custom"` world, which can bring any face.

The register split is the load-bearing part, and it now moves on two axes at once: **the statement is larger and lighter; the nameplate is smaller and heavier.** A name set tight and dense reads as a **nameplate**; a line set open and light reads as **speech**. Because they diverge on both size and weight rather than weight alone, they are unmistakable for one another on a modulated serif and on a geometric sans equally — which is what the single-number version could not do. Both remain display tier; the one-display-line budget is unchanged.

The identity line never truncates or ellipsizes — a person's name wraps to a second caption line before it is cut.

**Still banned, unchanged (D10).** Nothing may be promoted into the display tier *as the maker's words*: not a generated line, not the craft line, not the store name. **A fabricated statement in a maker's voice is a D10 violation** — the maker's words are theirs or they are absent. `maker.displayName` is **stored identity, not attributed speech**; naming the human is the product's promise, not a fabrication of it.

**Why identity never yields to voice.** B3 is deep-linkable. A buyer who lands cold on a world — no feed, no `GROWN` card, no §2.2 name/craft pass — would otherwise read *"Vessels blown in one breath"* and have no way to name the person whose world they are standing in. An unattributed statement is the weaker D10 posture, not the stronger one.

### 3.3 Unfold choreography (900 ms hard cap, `--ease-cinematic`)

Extends design-system §4.3 with the Film Layer correction:

```
t=0        Film Layer holds its rect. Playing. Untouched for the whole 900ms.
t=0–280    Ground cross-fades feed-neutral → the world's --ground. If the world's first
           block carries a blockGround, that band washes in behind the film in the same
           window. Feed cards fade to 0 (opacity only) and unmount at t=280.
t=140–620  Blocks rise in staggered waves — translateY 18→0, opacity 0→1, 70ms stagger,
           NEAREST-TO-FILM FIRST outward in both directions. Parallax depth: blocks
           further from the film travel ~1.3× the distance, giving the spatial read.
           Type settles after its container, never with it.
t=340–900  atmosphere bands and secondary media resolve last — the world "breathes out."
t=900      Settled. Nothing animates after this. Per-block scroll reveals take over.
```

**Reduced motion:** ground and blocks cross-fade in place at `--dur-reveal`. No translate, no parallax, no depth. The film does not move and does not pause.

### 3.4 States

| State | Design |
|---|---|
| **Empty** | N/A at world level — a published world always carries ≥ 1 block (`hero-video`). Optional blocks with no content are **omitted from the live render**, not rendered empty. The renderer-level empty state is the existing `UnpublishedGuard` (a quiet, themed closed door), which already exists in `StoreWorld.tsx` and must not be replaced. |
| **Loading** | Blocks reveal progressively with skeletons at each block's real layout. The unfold **does not wait** for all blocks — it starts on the first, and later blocks join the wave as they resolve. A block that resolves after t=900 reveals on its own `--dur-reveal`, not by restarting the unfold. |
| **Error** | A failed block degrades quietly and inline (existing `BlockBoundary`), and **the world still opens**. One failed block never blocks the unfold. If the *theme* fails to resolve, fall back to `sunbaked` light with a console warning — never render an unstyled world. |
| **Success** | Full per-maker world around the still-playing film; scrolling enters B4. |

### 3.5 No-flattening verification

Two worlds unfolding must differ in **layout, tokens, atmosphere, and motion** — not merely in colour. The design-critic gate (P9) should compare Sena and Noor on: block order, which blocks carry `blockGround`, radius identity, density, motion preset, and type pairing. Differing on colour alone is a fail, and it is the most likely way this quietly regresses.

### 3.6 Performance

60 fps on mid-range desktop through the unfold, no re-buffer of the film. Downgrade policy per design-direction §5.4 — decided **before** the unfold begins, held for the session, never mid-transition.

---

## 4 · B4 — Store Scroll & Interact (`WORLD_BROWSE`)

**Surface:** the seller's world.

### 4.1 Layout intent

Not a new screen — a **continuation**. `WORLD_OPEN → WORLD_BROWSE` has **no transition** (design-direction §5.2). It is a scroll, not an event; animating it would invent a state change the buyer did not make.

Blocks compose per the maker's `blocks[]` under their theme. Per-block reveals fire on `--ease-kol`, 70 ms stagger, media-leads-text, once per element, at ~15 % into viewport — the existing `Reveal` behaviour, unchanged.

### 4.2 Film behaviour during browse

The film stays in its rect and keeps playing. The engine may swap the clip to `process` / `atmosphere` footage as the buyer scrolls — **scoring-driven, never random**, anti-repetition holding.

**Swap choreography and the design rule that governs it (closes B4 OQ #1 — the scroll thresholds):** a swap is permitted only at a **block boundary**, when a new block crosses 50 % of the viewport, and **at most once per 12 seconds**. Cross-fade in-frame at `--dur-swap`, never a black frame.

The reasoning is not technical, it is dramatic: a shopkeeper who changes subject mid-sentence is unsettling. Tying swaps to block boundaries makes the film feel like it is **responding to what you are looking at**, which is the entire promise. The 12 s floor stops a fast scroller from triggering a strobe of clips.

### 4.3 Block interaction rules

Every block interacts live. Two platform rules override any block's own behaviour:

1. **No block interaction may pause, unmount, or re-source the Film Layer.** `process-reel` autoplays its own separate elements muted on scroll-in and pauses on scroll-out; it is never the shared film.
2. **The film always wins.** No block's chrome, motion, or colour may pull focus from it. In practice: no block may render `--shadow-overlay` or higher, and no block may run ambient motion except `atmosphere` (design-system §4).

### 4.4 States

| State | Design |
|---|---|
| **Empty** | Optional blocks with no content are omitted. A sparse world must still read **intentional** — this is what `--space-section` and `atmosphere` are for. A three-block world is a short essay, not a broken page. |
| **Loading** | Per-block layout-matched skeletons at real geometry. Progressive; the world is scrollable while later blocks resolve. |
| **Error** | Per-block quiet inline degrade via `BlockBoundary`; the rest of the world stays usable. If a clip swap fails, **keep the current clip playing** — engine-graceful, no error surfaced, no gap. |
| **Success** | Fully interactive world, film continuous and contextually shifting. |

### 4.5 Responsive

The world's own blocks own their responsive behaviour (block catalog). The platform contributes: `--space-section` collapses `--space-16`/`--space-20` → `--space-8`/`--space-10` below `md`; colour-block sections stay full-bleed at every breakpoint (they are the identity); the film pins to top on `< 768` rather than scrolling away, so the maker is never off-screen.

---

## 5 · B5 — Contextual Narration Shrink (`NARRATE_SHRINK`)

**Surface:** the seller's world, plus the dock frame, which is **KOL chrome** (Invariant I7 — the dock frame is ours, its contents are theirs).

### 5.1 Layout intent

The maker leans in and talks about the one thing you are looking at. The film gets out of the reading path without leaving. This is the moment the product's central claim — "the film follows you" — is either felt or not.

**Dock:** `hero-video` `corner-shrunk`. 320×180 at ≥ 1440, bottom-right, `--space-3` inset, `--radius-md`, `--shadow-raised`, `--z-film: 40`. Draggable to any corner (position persists for the session). Hover reveals an expand affordance. Dismiss collapses to an **audio-only pill** — the voice keeps narrating, per design-system §4.4.

**The dock carries no type at all** except captions. Everything else — title, price, controls — lives in the product surface. A dock with a caption bar is a video player; a dock without one is the maker, still there.

### 5.2 Dock choreography

```
dock    440ms  --spring-video (FLIP)   film rect → corner rect
swap    120ms  in-frame cross-fade     fires DURING the dock move, not after
undock  343ms  (440 × --return-ratio)  reverse
```

The clip swap fires **while the film is in flight**. Doing it after arrival reads as two events; doing it during reads as the maker turning to the product as she moves. The world behind does **not** dim, blur, or scale — the buyer is still in the world.

**Reduced motion:** the dock snaps to its corner at `--dur-state`; the clip still cross-fades (a cross-fade is not motion sickness); the film never pauses.

### 5.3 The exclusion zone (closes B5 OQ #1 and the "dock covers the CTA" risk)

| Breakpoint | Dock | CTA protection |
|---|---|---|
| ≥ 1024 | 320×180 / 280×158, bottom-right | Product layout reserves a **340 × 200 px** exclusion zone in that corner. The add-to-cart CTA never enters it. |
| 768–1023 | 240×135, bottom-right | 260 × 155 exclusion zone |
| < 768 | 200×112, **bottom-centre** | When a primary CTA enters the viewport, the dock **collapses to the audio-only pill**. The maker keeps narrating, the CTA is never occluded, nothing errors. |

This is a layout contract on B6 (product page), not a runtime collision check. Reserve the space; do not detect and dodge.

### 5.4 Narration fallback — the load-bearing path

`product_links` has no element-level FK, so a stale id yields zero rows. The engine's fallback chain: product-scoped narration → any `product-narration` clip in the store → **keep the currently-playing clip**.

**The design requirement is that all three outcomes look identical to the buyer.** No "no narration available" message, no different dock treatment, no missing-content affordance. The dock docks, the film plays, the product renders. Narration is a bonus the buyer was never promised, so its absence cannot be visible. If a buyer can tell which of the three branches ran, the design has failed.

### 5.5 States

| State | Design |
|---|---|
| **Empty / no match** | Indistinguishable from success — see §5.4. The persistent clip continues in the dock. This is the state most likely to be built wrong; test it explicitly. |
| **Loading** | Dock appears at final geometry immediately with the clip `poster` + `.kol-skeleton` shimmer. The **product content never waits on the dock.** |
| **Error** | Clip 404 / decode → dock holds the `poster`, or keeps the previous clip. One quiet retry affordance on hover only — never a persistent error chip over the maker's face. Never blocking. |
| **Success** | Corner clip narrates the product; product surface renders around it. |

### 5.6 Accessibility specifics

The dock is `position: fixed` and must **not** trap focus, must **not** precede the product content in tab order (it comes after the main content), and must expose captions. Its controls are keyboard-reachable and it is dismissible from the keyboard. A fixed video over a reading surface is a genuine accessibility hazard; these four are not optional.

---

## 6 · Handover checklist for Design-Build workers

Before a B1–B5 brief is considered complete:

- [ ] All four states implemented and **visually verified**, not just present in code
- [ ] Reduced-motion path verified with playback continuity intact
- [ ] axe-core clean at 375 / 768 / 1024 / 1440
- [ ] No opacity modifier on any ink token (guard test from the [AA fix](./KOL-wave3-aa-fix-muted.md))
- [ ] Film Layer: element identity persists and `paused` never flips true across every transition the screen owns
- [ ] No banned chrome (countdown, discount badge, sold-count, star cluster, urgency copy)
- [ ] Screen renders correctly at the seed-period data volume (N=4 stores), not just at full volume
- [ ] Session file written; QA-Lead spawned before merge

**Two things a worker must NOT do:** invent a transition not in the edge table (design-direction §5.2), and add a seller-themed element to B1 or B2 (Invariant I7).

---

*These specs are Design-Lead craft decisions against the binding CPO acceptance criteria in `docs/04-features/specs/`. Where I have proposed changing an AC — the Focus Film model in §1.3 — it is flagged as OQ-1 and requires Founder/CPO sign-off; it has not been quietly reinterpreted. Everything else here is additive to the ACs and does not alter them.*
