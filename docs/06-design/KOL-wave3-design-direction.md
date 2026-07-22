# KOL — Wave 3 Buyer-Surface Design Direction

*Design-Lead · 2026-07-21 · session `design-lead-wave3-direction`. Binding art direction for B1–B5. Extends [`KOL-design-system.md`](../03-system-design/KOL-design-system.md) v2 — it does not replace it. Where this file and the design system disagree, this file wins for the five buyer surfaces only; the design system remains the token source of truth.*

**Companion files:** [screen specs](./KOL-wave3-screen-specs.md) · [reference pass](./KOL-wave3-reference-pass.md) · [AA ship-blocker fix](./KOL-wave3-aa-fix-muted.md)

---

## 0 · The one-paragraph position

KOL is a **publication with a moving cover**. The platform is the publisher: it owns the paper, the trim size, the binding, the rhythm of the page turn, and — above all — **where the human's face is**. The seller is the art director of their own spread: colour, type, imagery, tone, and which sections exist are genuinely theirs, uncapped. These two are compatible because of a structural fact nobody has said out loud yet: **seller freedom and seller adjacency are never co-present.** The only surface where many makers appear side by side is the feed, and the feed carries no seller theme at all — a feed card is a film and a name in KOL's own chrome. The moment a seller's design system applies, they are alone on the screen. There is no MySpace wall to prevent, because there is no wall. What holds the product together across worlds is not a shared palette; it is a shared **geometry and tempo** — the film is always in the same slot, moving on the same curves, at the same durations. Colour can go anywhere precisely because motion and position cannot.

---

## 1 · The platform-frame / seller-freedom boundary

### 1.1 Why the usual answer fails

The instinctive resolution is "chrome is ours, content is theirs." It does not survive contact with this product, because a KOL world has almost no chrome — the world *is* content, edge to edge. A boundary drawn at chrome would hand the seller everything and guarantee incoherence, or claw content back and reproduce the flattening D15 exists to kill.

The second instinct is a palette cap. D15 already rejected it, correctly: capping colour is the flattening.

So the boundary has to be drawn on a different axis. It is drawn here:

> **The platform owns time and space. The seller owns light and voice.**

Geometry, tempo, rhythm, and the contrast law are the publisher's. Colour, type faces, imagery, copy, block choice, and film are the art director's. A reader can tell a Faire spread from a Kotn spread instantly, and still knows exactly where to find the page number.

### 1.2 The Seven Invariants

These hold in **every** world, curated or `kind:"custom"`, with no seller override. They are the coherence guarantee. A world that violates one is not a world with an unusual style — it is a rendering bug.

| # | Invariant | What it fixes | Seller's dial inside it |
|---|-----------|---------------|-------------------------|
| **I1** | **The Film Slot.** One hero film. Its rect per buyer state, its dock corner, its aspect behaviour, and the state machine are platform-defined. | Wherever you are in KOL, the maker's face is where you expect it. This is the single strongest cross-world signal. | Which clip (via tagging), whether the craft-line shows, the one statement line over it. |
| **I2** | **Motion grammar.** The two curves (`--ease-kol`, `--ease-cinematic`), the duration ramp, the 70 ms stagger, media-leads-text, one signature beat maximum, and reduced-motion behaviour. | Every world feels made by the same hand even when it looks nothing alike. Timing is the deepest-felt, least-noticed brand signal. | `motionPreset` (`hushed` → `dimensional`) = intensity, never timing. |
| **I3** | **Vertical rhythm.** The 8 px grid, `--space-section` between blocks, and full-bleed edge-to-edge for colour-block sections. | Stops a world reading as a pile. Rhythm is what makes a magazine a magazine. | `density` (`airy` \| `standard`). |
| **I4** | **Type-scale ratios.** The 8 roles, their relative sizes, line-heights, and tracking. Measure caps at 68 ch. | A world can shout or whisper, but the *interval* between heading and body is constant, so hierarchy reads identically everywhere. | Faces, weights, `scaleRatio`. |
| **I5** | **The contrast law.** AA body 4.5:1 for body copy, AA large 3:1 for display type, on whatever colours the seller brings. Machine-verified, no waiver. | Freedom that produces unreadable pages is not freedom. | None. This one has no dial by design. |
| **I6** | **Block anatomy.** What a `craft-story` *is* — its slots, its states, its reveal order. | Sellers compose, they do not invent structure; the renderer stays one renderer (D4). | Which blocks, which variant, what order, which ones colour-block. |
| **I7** | **KOL chrome is never themed.** Feed, nav, account, checkout, trust badge, and the corner-dock frame use KOL's own system, always. | The adjacency problem, solved structurally rather than aesthetically. | None. |

### 1.3 What is genuinely, uncapped the seller's

Colour (any hex, any block-grounds, light or dark, no five-palette cap for `kind:"custom"`) · type faces and weights (including faces outside our four pairings) · all imagery and film · radius identity · density · motion intensity · block choice, order, and variant · which sections colour-block · every word of copy, narration, and voiceover.

### 1.4 The one place the boundary is under pressure — and the ruling

**Should a seller's brand appear on their feed card?** It is tempting: a hairline in their accent colour under the maker's name would make the feed feel less uniform.

**Ruling: no, not in Wave 3.** The feed is the only adjacency surface; putting seller colour there re-imports the exact problem I1–I7 were drawn to avoid, and does it at the product's most identity-defining screen. The feed's variety must come from the **films and the composition**, which is where variety is actually interesting.

If we want brand presence in the feed later, the only admissible form is a **derived, normalised** one — the seller's `accent` hue mapped to a fixed lightness and chroma so twelve of them cannot clash — applied to a single 2 px rule and nothing else. That is a **Wave 6 experiment**, explicitly deferred, and it needs a side-by-side of twelve cards before anyone approves it.

### 1.5 The invariant I expect to be argued with

I1 (the Film Slot) will feel restrictive to the first seller who wants their video full-bleed-left instead of centred. Holding it anyway is the right call: the persistent film is the product's entire differentiation, and a shared element cannot be a shared element if its geometry is authorable. Sellers who want a different *feeling* around the film have `atmosphere`, block-grounds, radius, density, and the signature beat — four levers that change the felt experience without breaking continuity.

---

## 2 · Art direction for the buyer surfaces

Derived from a first-hand read of the founder-curated set (see the [reference pass](./KOL-wave3-reference-pass.md) for the per-reference detail). Three corrections to the current design-system reading came out of actually looking at the screenshots rather than the narrative summary:

### 2.1 Correction A — display type over film is large and *airy*, not heavy

The design system says display faces should be heavy (700–800) so they can make Kotn-scale statements. Looking at Kotn: the heavy treatment is on the **commerce** banner ("UP TO 50% OFF", yellow, condensed, bold). The **editorial** moment — "New Arrivals" over a single person against sea-hazed light — is set *large, light-weight, and wide*. It floats on the image instead of stamping it.

That distinction matters more for KOL than for Kotn, because our image is always **a person's face**. A 7 rem 800-weight line across a maker's portrait competes with them; the whole product is built on the opposite instinct.

**Ruling, binding for `display-hero` set over film:**

| Context | Size | Weight | Tracking | Treatment |
|---|---|---|---|---|
| `display-hero` **over film** (I1 slot) | `--fs-display-hero` | **400–500** | `-0.01em` (relaxed from `-0.03em`) | `--scrim` mandatory; `--on-media` ink |
| `display-hero` / `display` **on a ground** (block-ground or `--ground`) | `--fs-display-hero` / `--fs-display` | **700–800** | `-0.03em` / `-0.02em` | as design-system §1.1 |

Same tier, two registers. Heavy when it has a ground to stand on; light when it is a guest on someone's face.

### 2.2 Correction B — brave colour and composed type, not both at once

Faire's colour-blocking is genuinely brave — plum, olive, chartreuse, coral, full-bleed, alternating with cream. But the type *inside* those bands is quiet: moderate-size light serif, small body. The colour is the loud element; the type is composed. Two loud elements is how `bazaar` gets made by accident in every world.

**Ruling:** in any block with `blockGround` set, the heading drops one tier (`display` → `h1`, `h1` → `h2`) and weight drops to the pairing's text weight + 100. The ground is carrying the emphasis. `voice-quote` is the deliberate exception — a maker's own words on a vivid ground at full display scale is the one place both are allowed to be loud, and it is allowed exactly once per world.

### 2.3 Correction C — the colour band frames the human, it does not replace them

The single most reusable structural move in Faire: every colour band contains a **photograph of a real person, inset within the band** with generous ground showing around it. The band is a mat around a portrait. It is not a colour field with text on it.

**Ruling:** `atmosphere` `block-ground` and `craft-story` with `blockGround` set should default to **carrying an image inset at 60–72 % of the band width**, with `--space-12`→`--space-16` of ground breathing around it, rather than rendering as an empty colour field. An empty band is permitted only as `atmosphere` between two film-led sections, and never twice in a row.

### 2.4 The rejected register, restated precisely

Looking at TikTok Shop directly surfaces the lesson that matters most for B1, and it is not the one people expect. TikTok Shop's "Savings for you" row **is video** — five autoplaying clips with duration badges — and it is still, unmistakably, a grid. **Video does not save you from grid-ness. Layout does.** The feed's identity is carried by composition, not by media type. This is the direct justification for B1's hard-gate acceptance criterion, and the reason I will not accept "but the cards have film in them" as a defence of an equal-cell layout.

Also banned across all five buyer surfaces, from the same read: countdown chyrons, discount badges, "N sold" counters, star-rating clutter adjacent to media, and any element whose job is urgency. None of these exist in the token set and none may be added.

---

## 3 · Typographic system for B1–B5

The design-system §1.1 scale is unchanged. What Wave 3 adds is **role assignment** — which surface uses which role — so five workers do not each invent a hierarchy.

| Surface | Display moments allowed | Role assignment |
|---|---|---|
| **B1 feed** | 1 (the feed's own masthead line) | Masthead `--fs-h1`, weight 500. Card maker name `--fs-h3`. Card craft-line `--fs-caption`, uppercase, `0.08em`. **No card headline larger than `h3`** — the film is the headline. |
| **B2 grown** | 1 (the maker's name) | Name `--fs-display`, weight 500, over `--scrim`. Craft-line `--fs-caption`. Nothing else. |
| **B3 world open** | 1 (the maker's statement, per §2.1) | `--fs-display-hero`, weight 400–500 over film. This is the world's one hero statement. |
| **B4 world browse** | per the seller's block composition | Governed by block catalog + §2.2. Platform adds nothing. |
| **B5 narrate + product** | 1 (the product title) | Title `--fs-h1`, weight per pairing. Price `--font-mono`, tabular, `--fs-h3`. Dock carries **no type at all** except captions. |

**Craft rules that apply everywhere (from `ui-typography`, non-negotiable):** curly quotes, en dashes for ranges, em dashes for breaks; tabular figures for every price and count; no widows on `display-hero`/`display`/`h1` (use `[text-wrap:balance]`, already in use in `StoreWorld`); body measure `max-w-[68ch]`; eyebrows uppercase with positive tracking, never bold.

---

## 4 · Spacing and rhythm

Global scale unchanged (design-system §1.2). Two Wave-3 additions:

**4.1 The feed's rhythm is a 12-column asymmetric stagger, not a grid.** Columns are a measuring device, not a cell structure. Cards span 4, 5, 6, or 7 columns and are vertically offset from their neighbour so **no two cards share a top edge**. The offset is the anti-grid mechanism and it is testable: the B1 layout test should assert both (a) rendered cards do not all share identical dimensions, and (b) **no two adjacent cards share a `getBoundingClientRect().top` within 24 px.** The second assertion is the one that actually catches a grid; the first can be passed by a grid with two cell sizes.

**4.2 Feed vertical rhythm is `--space-10` between cards within a spread and `--space-16` between spreads.** A "spread" is the repeating unit of the composition (§ screen spec B1). Two rhythms, not one, is what makes a page read as composed rather than tiled.

---

## 5 · Motion grammar for the buyer state machine

The design system defines the atomic curves and the ramp. Wave 3 names the **edges of the state machine** so the choreography is one system rather than five independently-invented transitions.

### 5.1 New tokens (add to `globals.css` `:root`)

```css
/* Wave-3 buyer-state transition grammar */
--dur-grow:   var(--dur-reveal);   /* 520ms — FEED → GROWN */
--dur-ungrow: 405ms;               /* 0.78 × grow — GROWN → FEED */
--dur-dock:   440ms;               /* WORLD_BROWSE ↔ NARRATE_SHRINK spring settle */
--dur-swap:   120ms;               /* in-frame clip cross-fade — never a black frame */
--return-ratio: 0.78;              /* every reverse edge runs at 0.78 × its forward edge */
```

`--dur-grow` aliases `--dur-reveal` deliberately: growing a maker out of the feed should read at the same tempo as a section revealing itself, because it is the same gesture — the product showing you something.

**`--return-ratio` is a real rule, not decoration.** Forward motion is discovery and earns its time; going back is a return to a place you already know and should feel brisker. 0.78 is the ratio at which the return reads as "snappier" without reading as "different."

### 5.2 The edge table — binding choreography

| Edge | Name | Duration | Curve | What moves | What must not move |
|---|---|---|---|---|---|
| `FEED → GROWN` | **grow** | `--dur-grow` | `--ease-kol` | Film Layer FLIPs card rect → centre-column rect. Non-focus cards translate on Y only to part around it, staggered 70 ms outward from the tapped card. | The film. It does not pause, reload, or re-buffer. Feed cards do not re-layout (transform only). |
| `GROWN → WORLD_OPEN` | **unfold** | `--dur-unfold` (900 ms hard cap) | `--ease-cinematic` | 0–280 ground wash + feed fade-out · 140–620 blocks rise in staggered waves (`translateY 18→0`, parallax depth offset, nearest-to-film first, 70 ms) · 340–900 atmosphere and secondary media resolve. | The film. Anything after t=900. |
| `WORLD_OPEN → WORLD_BROWSE` | *(no transition)* | — | — | Nothing. Scroll only; per-block `--dur-reveal` reveals fire as normal. | Do not animate a state change here. It is a scroll, not an event. |
| `WORLD_BROWSE → NARRATE_SHRINK` | **dock** | `--dur-dock` | `--spring-video` (FLIP) | Film Layer springs to the corner rect. Clip swap cross-fades **inside the frame** over `--dur-swap`. | The film. The world behind it does not dim, blur, or scale. |
| `NARRATE_SHRINK → WORLD_BROWSE` | **undock** | `--dur-dock` × `--return-ratio` ≈ 343 ms | `--spring-video` | Reverse. | — |
| `GROWN → FEED` | **ungrow** | `--dur-ungrow` | `--ease-kol` | Reverse of grow. | — |

### 5.3 Reduced motion — the complete contract

`prefers-reduced-motion: reduce` must not degrade the *product*, only the *motion*. In every edge above: transforms and parallax are removed; the change becomes an opacity cross-fade at `--dur-state`; the Film Layer **snaps** to its new rect; **and the film keeps playing throughout.** Playback continuity is an accessibility-independent invariant — a reduced-motion user still gets the persistent film, because the film is content, not animation. The existing global `prefers-reduced-motion` block in `globals.css` already collapses transition durations; the Film Layer's FLIP must additionally skip its invert step rather than run it at 0.01 ms, which would produce a visible jump.

### 5.4 Motion downgrade policy (closes world-unfold OQ #2)

Decide **before** the unfold begins and hold for the session. Never downgrade mid-transition.

Downgrade one preset step (`dimensional` → `liquid` → `fluid` → `hushed`) when any of:
- `navigator.hardwareConcurrency <= 4`
- `navigator.deviceMemory <= 4` (where exposed)
- the previous unfold in this session recorded ≥ 3 frames over 20 ms

The signature beat (§4.5) is the first thing dropped and the last thing restored. Reveals are never dropped — a world with no reveals reads broken, not fast.

---

## 6 · The Film Layer — the structural mechanism behind I1

This is the load-bearing implementation decision for all five surfaces, and it is a design decision as much as an engineering one, because it determines what the feed can look like.

### 6.1 The problem

`layoutId="hero-video"` works today because Wave 0's `/preview` simulates FEED and GROWN *inside a single world* — `HeroStage` holds one tree position and the world body fades around it. The real feed is **cross-maker**: N stores, one card each, in KOL chrome, and the tapped card's film must arrive in the world without remounting. React cannot move a DOM node between component trees without unmounting it.

### 6.2 The mechanism

**One `<video>` element, mounted once at the app root, in a fixed-position layer (`--z-film: 40`, matching the existing `.kol-hero-docked` z-index). It is never unmounted for the life of the session.** Every buyer state assigns it a target rect; it moves between rects by FLIP transform only. `HeroStage` becomes the *slot registrar* — it publishes the rect the Film Layer should occupy for the current stage — rather than the element's owner. The `view-transition-name: hero-video` already on `.kol-hero-stage` stays as the cross-route morph hook.

This satisfies B2's and B3's load-bearing acceptance criteria literally: element identity persists, `paused` never flips true, no re-buffer.

### 6.3 The design consequence — "one film at a time"

If exactly one element is the shared film, the feed cannot have 18 of them playing. I want to argue this is the **better** design, not a constraint I am conceding to:

- A magazine does not have twenty-four things moving. TikTok Shop does, and that is precisely the register we reject (§2.4).
- Twelve to twenty-four simultaneous video decodes is the single largest threat to the 60 fps budget that B1, B3, and B4 all carry.
- One moving thing among stills is *more* arresting than twenty-four moving things. Attention needs a ground to be figure against.

**The Focus Film model:** the card nearest viewport centre is the **focus card**, and the Film Layer positions itself over that card's rect and plays its clip. All other cards render their poster still with `focalPoint` crop. Up to **two neighbouring cards** may play low-fidelity ambient loops (≤ 6 s, ≤ 480 p, muted, no audio track) so the page reads alive; these are disposable elements, never the shared one. As the buyer scrolls, focus moves and the Film Layer FLIPs to the new card's rect with a `--dur-swap` cross-fade inside the frame.

Tapping a **non-focus** card first promotes it to focus (Film Layer FLIPs to it, ≤ 200 ms, clip cross-fades in-frame) and then runs `grow`. The buyer perceives one continuous motion.

> ⚠️ **This requires a small amendment to the B1 spec** and needs Founder/CPO sign-off — see §8.

---

## 7 · Responsive behaviour — deliberate, not inherited

Desktop-first (D1). Each breakpoint is a **different composition**, not a reflow of the same one.

| Breakpoint | Feed composition | Film Slot | Corner dock (B5) |
|---|---|---|---|
| **≥ 1440** (design target) | 12-col asymmetric stagger, spans 4/5/6/7, two cards visible in the opening viewport — the magazine opening spread | Centre column 720 px | 320×180, bottom-right, `--space-3` inset |
| **1024–1439** | Same composition, spans compress to 5/6/7 | Centre column 640 px | 280×158 |
| **768–1023** (tablet) | Two-track editorial stack: large / small alternating, still vertically offset | 92 vw, top-anchored | 240×135 |
| **< 768** (mobile) | **Single column — variety comes from card *height*, not width.** Aspect ratios cycle 4:5 · 16:9 · 1:1 · 3:2. This is what preserves the anti-grid identity when width is fixed. | Full-bleed, top-pinned | 200×112, **bottom-centre**, and see below |

**The mobile dock ruling (closes B5 OQ #1 and B5 risk "dock covers the CTA"):** on `< 768`, when a primary CTA (`add-to-cart`) enters the viewport, the dock **collapses to the audio-only pill** already specified in design-system §4.4 — the maker keeps narrating, the CTA is never occluded, and nothing errors. On `≥ 768` the dock sits bottom-right and the product layout reserves a `340 px × 200 px` exclusion zone in that corner; the CTA never enters it.

---

## 8 · What this direction needs that store-config v1.3 cannot express

Three gaps. The first two are genuine blockers for the direction as written; the third is a recommendation.

### 8.1 `media.clips[].focalPoint` — **required**

`media.images[]` carries `focalPoint {x, y}` for art-directed cropping. **`media.clips[]` does not.** But the same clip is composed at four wildly different aspect ratios across the journey: feed card (4:5 or 1:1), centre column (16:9), world hero (full-bleed), corner dock (16:9 at 320 px). Without a focal point, a centre-framed crop will decapitate makers in the 4:5 feed card. This is not a nice-to-have; it is the difference between "meet the human" and "meet the human's shoulder."

```jsonc
"clips": [{
  // ... existing fields
  "focalPoint": { "x": 0.5, "y": 0.5 }   // 0–1, default centre; the face, for cross-aspect crops
}]
```

Additive, defaulted, non-breaking. Sits alongside `poster`. Owner: P3 validator + P4 renderer.

### 8.2 `hero-video.props.statement` — **required**

`HeroVideoBlockSchema.props` is `{ showCraftLine: boolean }`. `showCraftLine` renders `maker.craft` **at caption size**. So there is currently **no way for a maker to author the one big line over their film** — the single most identity-defining piece of typography in the product, the entire reason the `display-hero` tier exists, and the direct analogue of Kotn's "New Arrivals" moment.

```jsonc
// type:"hero-video" props
"props": {
  "showCraftLine": true,
  "statement": "string | undefined"   // OPTIONAL — the maker's own words, one line, set at
                                       // --fs-display-hero over film per §2.1 (weight 400–500,
                                       // --scrim mandatory, --on-media ink). Maker-authored;
                                       // D10 applies — never AI-fabricated. Max 1 per world.
}
```

Validator constraint: max ~48 characters. It is a statement, not a paragraph, and it has to survive `[text-wrap:balance]` at 7 rem without widowing.

### 8.3 `impact-stat` — **recommended, not blocking**

The block catalog already flags this as deferred (P3-c). Looking at Kotn's "25 schools funded. 5,127 farms supported." band first-hand, it is a strong, cheap, honest primitive: a maker-declared stat pair set in mono/tabular figures, asymmetric with an image. It reinforces D16-2 (Proof of Product, maker-*declared* provenance). I recommend it for Wave 6, implemented as a `craft-story` sub-slot rather than a twelfth block, so the catalog stays at 11.

### 8.4 Everything else in this direction is already expressible

B1 needs no store-config at all (KOL chrome; it consumes the engine's `Selection` plus `stores`/`profiles` metadata — note that the maker's display name, craft line, and avatar are **not** in the engine's return and must be joined separately). B2–B5 are covered by existing `hero-video` variants (`full-bleed` / `center-column` / `corner-shrunk`), the existing block set, and the existing theme union.

---

## 9 · Open questions needing a Founder or CPO decision

| # | Question | My recommendation | Why it needs a decision |
|---|---|---|---|
| **OQ-1** | **"One film at a time"** (§6.3) amends B1's AC, which currently reads "muted autoplaying film … renders across mixed-size cards" (plural). | Adopt the Focus Film model. | It changes a written acceptance criterion. I believe it is both better design and the only way to satisfy B2's element-identity AC, but I will not quietly reinterpret a binding AC. |
| **OQ-2** | **Seller accent in the feed** (§1.4). | Defer to Wave 6, behind a twelve-card side-by-side review. | It is the one real tension in the boundary and deserves an explicit "not now" rather than silence. |
| **OQ-3** | **The Lusion signature beat.** World-unfold OQ #1 is still open — agents cannot watch `lusion.mov`, so the specific cinematic moment being targeted is undefined. | Founder to describe the beat in one paragraph, or approve `depth-3d` (perspective + pointer parallax on the hero product, design-system §4.5) as the default. | Blocks the `dimensional` preset's actual implementation. It has now been open since 2026-07-20. |
| **OQ-4** | **Feed length at N=4 seed worlds.** `distinct on (store_id)` means the feed returns 4 cards during the seed period, not 18. | Request limit 18; **design the composition to terminate gracefully at N = 1, 2, 3, 4** (spread patterns specified in the B1 screen spec). | If nobody decides this, the feed ships looking broken at exactly the moment it is demoed. |

---

## 10 · The ship-blocker

The deferred Wave-0 WCAG item is fixed and specified in [`KOL-wave3-aa-fix-muted.md`](./KOL-wave3-aa-fix-muted.md). Headline: the defect is **not** the `sunbaked --muted` token value — it is an un-audited alpha modifier, and the same modifier fails in **8 of 10** palette-modes. Both the structural fix and a token regrade are specified there.

---

*Design judgments here are Design-Lead craft decisions grounded in the founder-confirmed reference set (`docs/research/references/`) and a direct read of the Wave-0 render spine. Every contrast figure in the companion AA file was computed, not estimated. The four open questions above are genuine decisions, not hedges — I have given a recommendation on each.*
