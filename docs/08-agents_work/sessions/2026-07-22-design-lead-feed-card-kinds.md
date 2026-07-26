---
role: design-lead
task: feed-card-kinds
date: 2026-07-22
qa_verdict: N/A (design brief — no source changed)
tier: n/a
deliverable: U3 implementation brief — `still` and `product-cluster` card kinds
constraint: Founder pitch Friday 2026-07-24. Judged on how it photographs at 1440 and 390.
---

# U3 — Design brief: the two new feed card kinds

Design-Lead. Extends the shipped magazine composition; changes nothing that already works.
No new tokens, no new dependency, no new motion library. Every value below is an existing
token or a value derived from `spreads.ts` reference geometry.

---

## (a) How the feed looks RIGHT NOW — honest read

Ran `pnpm -C apps/kol dev` and screenshotted with the repo's own Playwright (the Playwright
MCP is not in this agent's tool set — noted, fell back to a script, no hard-fail).
Shots: `/feed` and `/preview/feed?n=18` at 1440×900 and 390×844, full-page, after scrolling
the document so every `IntersectionObserver` reveal fired.

### The composition is genuinely good. The content is not there.

**What works — do not touch it.** At N=18 the magazine is real. Six slots, five row
patterns, no row echo, the left edge zig-zags on mobile, `raisePct` clusters cards and pools
the leftover air as a pause. Scrolling it, the eye never predicts the next row. This is the
best thing in the product and it is already built. The mobile composition is, if anything,
stronger than desktop — the bleed cadence against the two offset slots reads as a printed
object.

**What is broken — every frame is empty.** All 44 image assets are synthetic gradient SVGs
from one generative template: a colour field, sometimes a circle or four stripes. The 20
`.mp4`s are 608×760 / 9s generated clips of the same. There is not one face, one hand, one
object, one workshop in the entire feed. At 1440 the N=18 page reads as **a design-token
swatch board**, not a marketplace. The product's whole premise — "real makers, real faces" —
is absent from the actual pixels. Every visual judgement made on this project so far has been
made against these gradients.

**`/feed` live is worse than the preview.** Only 4 seed worlds are published, so the live
feed composes to `R-LEAD + R-INSET` and leaves roughly the bottom-right 40% of the 1440
viewport as dead ground. As a pitch slide, `/feed` at N=4 looks sparse and unfinished.
`/preview/feed?n=18` is the surface that photographs. **Pitch-mechanics note for the Founder:
demo the N=18 surface, or seed more published worlds before Friday.**

### Two live defects found while measuring

**1. `text-h3` is silently deleted from every feed maker name. (Highest craft defect.)**
`FeedCard.tsx:291` sets `cn("font-display text-h3 font-medium text-ink", …)`. In the rendered
DOM the class is **gone**:

```
h2Class: "font-display font-medium text-ink transition-colors duration-state ease-kol …"
h2Size:  "17px"      ← inherited body size
```

Cause reproduced directly against the repo's `tailwind-merge`:

```
twMerge("text-h3 text-ink")           => "text-ink"
twMerge("text-caption text-muted")    => "text-muted"
```

Unconfigured `tailwind-merge` classifies the custom type-scale classes as *text-colour* and
keeps the last one. So every maker name in the feed renders at **17px instead of 22px** — a
23% shortfall on the single element carrying the card's hierarchy. It is exactly why the
captions look flat in the screenshots. Blast radius is only `cn()` call sites (plain-string
`className`s are unaffected, which is why the craft line survives at 13px); the other
confirmed hit is `components/blocks/shared.tsx:142`.

*Fix (for CTO, not U3): extend `cn` with `extendTailwindMerge({ classGroups: { 'font-size':
[{ text: ['display-hero','display','h1','h2','h3','body-lg','body','caption'] }] } })`.
One file. Do it before Friday — it lifts every name in the feed.*

**2. The body typeface is not loading.** `--font-text` resolves to
`ui-sans-serif, system-ui, sans-serif` — the craft lines are rendering in the OS font (SF Pro
on macOS), not General Sans. `document.fonts` shows `Fraunces: loaded`, everything else
`unloaded`. The design system's #1 anti-slop rule is about typeface character; right now
half the type is the system default. Also note the feed pairs the `sunbaked` palette with
Fraunces, which §3 binds to `market-plum` / `warm-serif` — the masthead looks good, but it
contradicts the doc's own pairing binding. Flagging for CTO; not U3's scope.

---

## (b) Reference pull — what to steal

Refero MCP is not in this agent's tool set. Falling back to the founder-curated reference set
already on disk (`docs/research/references/`), which I read directly — a better source than a
generic search, because the Founder already ruled on it.

### Faire — the natural experiment that settles the product-cluster argument

`faire.png` contains **two adjacent product rows with identical grid geometry and opposite
registers**, and the difference is entirely chrome:

| "Featured brands" (row 1) | "Bestsellers you might like" (row 2) |
|---|---|
| One object per frame, generous air around it | Object crammed to the frame edge |
| Under it: **brand name** (ink) + **city** (muted small caps) | Under it: price, `$`-strikethrough, ★ rating, review count |
| Nothing else | "Bestseller" badge chip + "Unlock wholesale price" button |
| Reads **editorial** | Reads **catalogue** |

**Steal:** the register is not a function of the grid — it is a function of what you hang
under the object. This is the single most useful observation for the cluster card, and it is
the evidence that a small product grid *can* be made editorial.

**Also steal (Faire):**
- The plum "We're Faire" block: a full-bleed photo inset **on a colour-blocked ground**, with
  the attribution set small inside the frame ("Joan Martinez and Christian Summers,
  Co-Founders of Tula House"). → the cluster card's ground treatment and its in-frame
  attribution.
- "Explore categories": image tiles with the label set **inside** the frame, bottom-left.

### Kotn — how a still holds its ground next to motion

`kotn.png`, the `Womenswear / Home / Menswear` row: three static image tiles, each carrying
**one large word set inside the frame in `on-media` white**. They sit directly above and below
motion-forward surfaces and never read as broken, because the type inside the frame is a
deliberate compositional act that no auto-generated thumbnail performs.

**Steal:** *a still earns its slot by carrying type that the film cards cannot.* Film cards
are busy, so their caption sits below the frame. The still inverts it and brings the type
inside. That inversion is the entire mechanism.

Also: the Instagram grid at the foot of the page — four stills of real people in real rooms,
**no captions at all**, functioning as texture and rhythm rather than as content.

### TikTok Shop / Complex — the register to refuse

Dense equal cells, −50% badges, ★ + "23K sold", flash-sale chyrons, zero human story.
Everything in §(c) below that is written as a prohibition traces to this file.

---

## (c) The two card kinds

### Shared frame contract (both kinds)

Both new kinds keep the existing card shell exactly: `<article>` with `[data-feed-card]`,
`data-feed-slot`, `data-feed-mobile-slot`, the `SLOT_PLACEMENT_CLASS` / `slotLiftProps` /
`MOBILE_*` class maps, and one stretched `<button>` tap target. Add `data-feed-kind="film" |
"still" | "product-cluster"` on the `<article>` so the layout gate and the critic can assert
composition by kind.

**Silhouette rule — the thing that makes the scroll legible.** Film keeps its caption
**below** the media box. Both new kinds carry all their type **inside** the frame and have
**no caption below**. So the scroll reads as one moving kind and two plates, and the
difference is visible from across a room. This is deliberate; do not "unify" it.

**Hard invariant — focus and ambient are film-only.** `pickFocusIndex` and `ambientIndicesFor`
must only ever consider `kind === "film"` cards. If a still or a cluster is allowed to become
focus, the shared Film Layer claims a card that has no clip and the frame goes blank. This is
the single most likely way U3 breaks the shipped Film Layer. Restrict the index list at the
source in `FeedMagazine.tsx`, not with a guard inside the card.

---

### C1 · STILL card

> One art-directed maker image, focalPoint-cropped, maker-attributed.
> A magazine plate, not a dead thumbnail.

**Why it does not look broken next to autoplaying film.** Four mechanisms, all load-bearing:

1. **Type inside the frame.** The maker's name is set over the image at `--fs-h2` scale,
   bottom-left. No thumbnail does this. It reads as composed.
2. **No play affordance, ever.** No triangle, no duration chip, no hover-scrub. Nothing on a
   still promises motion, so nothing fails to deliver it.
3. **It never takes the two cinema slots.** LEAD and WIDE are where the eye expects film;
   a still there reads as a video that failed to load. See the slot table.
4. **Stillness is on-system.** §4 already bans perpetual motion in the reading state. The
   still card is not "the one that isn't moving" — it is the pause the system already
   specifies. **Do not add a Ken Burns pan.** It would violate §4 and it is the exact tell
   that says "we were embarrassed this was static."

**Structure.**

```
<article data-feed-kind="still">                      ← slot placement + lift, as film
  <Reveal delay={indexInRow * STAGGER_MS}>
    <div class="kol-scrim relative overflow-hidden rounded-md bg-ground
                [container-type:inline-size]  {MOBILE_ASPECT} {MOBILE_MEDIA} {DESKTOP_ASPECT}">
      <PosterStill src={image} objectPosition={clipObjectPosition({focalPoint})}
                   class="absolute inset-0 h-full w-full object-cover {mediaMotionClass}" />
      <Reveal delay={indexInRow * STAGGER_MS + STAGGER_MS}
              class="kol-hero-chrome pointer-events-none absolute inset-x-0 bottom-0 z-10
                     px-[var(--space-3)] pb-[var(--space-3)]
                     md:px-[var(--space-4)] md:pb-[var(--space-4)]">
        <h2 …name… />
        <p …craft · place… />
      </Reveal>
    </div>
  </Reveal>
  <button … />                                        ← stretched tap target, as film
</article>
```

**Reuse `.kol-scrim` + `.kol-hero-chrome` verbatim.** They already ship (`globals.css:219`,
`:236`), they are already the sanctioned over-media treatment, and `.kol-hero-chrome` paints
its own `--scrim-strong` backdrop under every set line — so contrast is
`contrast(--on-media, --scrim-strong)` **by construction, independent of the photograph**.
That is `9.07:1`, already pinned by `scrim-strong.test.ts`. This is why the still card needs
no new AA work and no per-image tuning. The `[container-type:inline-size]` root is required —
`--hero-chrome-fade` is `min(128px, 12cqw)` and sizes to the frame.

**Type roles.**

| Element | Spec |
|---|---|
| Maker name | `font-display`, `text-[min(var(--fs-h2),9cqi)]`, `font-medium`, `leading-[1.08]`, `tracking-[-0.01em]`, `text-on-media`, `[text-wrap:balance]` |
| Craft · place | `font-text`, `text-caption`, `uppercase`, `tracking-[0.08em]`, `text-on-media`, `mt-[var(--space-0-5)]` |

`--fs-h2` (`clamp(1.5rem, 2.4vw, 2.25rem)`) is the deliberate step: **larger than the film
card's name** (`--fs-h3`, 22px) and well below the hero tier. The still card is quieter in
motion, so it is louder in type. That trade is the whole design. Do **not** promote it to
`--fs-display*` — one display-tier line per surface is already ruled (E5), and the feed spends
its on the masthead.

**Slot eligibility.**

| Slot | Ref box @1440 | Still? | Why |
|---|---|---|---|
| `SIDE` span4 1:1 | 416×416 | **yes** | square plate; Kotn's category-tile proportion |
| `INSET` span5 3:2 | 532×355 | **yes** | landscape plate; workshop/process framing |
| `TALL` span5 4:5 | 532×665 | **yes** | portrait — the best slot for a face |
| `COLUMN` span4 3:4 | 416×555 | **yes — preferred** | the centred plate with four columns of open ground each side. This slot was invented for exactly this object. |
| `LEAD` span7 4:5 | 764×955 | **no** | the book's biggest frame. A static image this large reads as a billboard or a failed video. |
| `WIDE` span8 16:9 | 880×495 | **no** | 16:9 is the cinema aspect. A still here is a letterboxed frame with no film in it. |

Mobile: `M-FULL`, `M-OFF-L`, `M-OFF-R` **yes**. `M-BLEED` **no** — edge-to-edge and static is
a billboard, and the bleed is the mobile composition's cinematic beat.

**States.**

| State | Behaviour |
|---|---|
| Loading | `Skeleton` at the slot aspect (existing `FeedMagazineSkeleton` geometry) with the two shimmer bars placed **inside** the frame bottom-left, matching the live chrome band position — CLS-0 against the real card. |
| Empty | Cannot occur by construction: U1 only emits `kind:"still"` when an image resolved. |
| Error | Image 404 → `PosterStill` hides itself, `bg-ground` shows, and the chrome band **still carries name + craft on `--scrim-strong`**. The card degrades to a warm typographic plate, which is a legitimate magazine object. No error copy — an error message inside a discovery feed is chrome. Never blank. |
| Success | As specified. |

**Hover / focus.** Identical to film: `motion-safe:group-hover:scale-[1.02]` on the image over
`--dur-state` / `--ease-kol`; name → `group-hover:text-accent`. Reuse `mediaMotionClass`
unchanged. The `:focus-visible` outline rings the whole card via the existing global.

---

### C2 · PRODUCT-CLUSTER card — the hard one

> 2–4 products from ONE maker. The challenge: make a small product grid read as an
> editorial still-life spread, not a catalogue cell.

**The governing idea: one maker's table, photographed once.**
Not four product cards side by side — **one plate, with several objects on it.** Everything
below follows from that sentence. Faire's row-1-vs-row-2 experiment is the proof it works.

#### The five moves that separate it from the catalogue

**1. It is ONE frame, not N cards.** The pieces share one ground, one radius hierarchy, one
tap target. Pieces are `rounded-sm` (8px) **inside** a `rounded-md` (16px) frame — nested, not
sibling. No per-piece border, no per-piece shadow, no per-piece link.

**2. The internal composition is never equal and never symmetric** — the same rule the outer
magazine already enforces on itself. **A 2×2 is banned; a 2×2 *is* the catalogue cell.**

| n | Internal grid | Anti-grid device |
|---|---|---|
| 2 | `grid-cols-[1.6fr_1fr]`, lead full height | second piece `self-start mt-[12%]` — tops never align |
| 3 | `grid-cols-[1.4fr_1fr] grid-rows-[1.2fr_1fr]`, lead `row-span-2` | unequal row fractions on the right column |
| 4 | `grid-cols-[1.5fr_1fr_1fr] grid-rows-[1.3fr_1fr]`, lead `row-span-2`, piece 2 `col-span-2` top-right, pieces 3 + 4 bottom-right | the L, explicitly not a quad |

Gaps are **asymmetric on the two axes** so the eye cannot resolve a square module:
`gap-x-[var(--space-4)] gap-y-[var(--space-3)]` (32 / 24) desktop,
`gap-x-[var(--space-3)] gap-y-[var(--space-2)]` (24 / 16) below md.
Frame padding `p-[var(--space-4)]` desktop, `p-[var(--space-3)]` mobile.

**3. Prices are wall labels, not a price column.** This is the move that decides the register.
Each price hangs off **its own piece's left edge**, immediately under that piece — so the
prices are *never vertically aligned with each other*. A museum labels its objects; a
catalogue tabulates them. The existing mobile rule ("the caption aligns to its own media's
left edge") is the same grammar, so this is consistent, not new.

- Lead piece: title (`font-text text-caption text-ink`) + price
  (`font-mono text-caption tabular-nums text-muted`), stacked, `mt-[var(--space-1)]`.
- Supporting pieces: **price only**. Density stays low and hierarchy stays legible.
- `formatPrice()` from `lib/utils.ts` — it already derives minor-unit digits from Intl.

**4. Maker attribution is inside the frame, and it is the largest thing in the card.**
Bottom of the frame, `mt-[var(--space-3)]`, `flex items-center gap-[var(--space-2)]`:

- avatar 32px `rounded-full object-cover` from `card.avatarUrl`; null → the maker's initial
  in `font-display` on `bg-ground` (never a silhouette glyph, never a grey person icon);
- then a stacked block: name (`font-display text-h3 font-medium`) over craft · place
  (`font-text text-caption uppercase tracking-[0.08em]`).

The maker's name outweighs every product title in the card. That is the argument the card
exists to make.

**5. The ground is colour-blocked — the Faire move.**
This is what makes the card photograph. The frame's ground is chosen **deterministically from
`storeId`** with the same FNV-1a device `spreads.ts` already uses for `contentSpread`, so the
book varies but a maker is stable across reloads:

| hash bucket | ground | ink | measured contrast |
|---|---|---|---|
| 50% | `--surface` `#FFFBF3` | `--ink` / `--muted` | 14.5:1 / 6.86:1 |
| 50% | `--block-b` `#5F6B33` olive | `--on-block-b` `#FBF3E8` | **5.25:1** |

`--block-a` (clay `#B8452A` + `#FBF3E8`) computes to **4.87:1** — it clears WCAG AA body
(4.5:1) but sits under the gate-2 feed bound of ≥5.5:1 body. That bound was written for type
**over film**, and this is type over a solid ground, so it arguably does not apply — but it is
a judgement call, so **block-a is excluded from the default set** and available only if
CTO/QA rule the bound inapplicable. `--block-c` (sky) is large-text-only per §2 and is
**banned** here outright.
*All three figures are my computation from the §2 hexes and must be re-verified by QA-Lead at
build, per the design system's own instruction — do not ship them on my arithmetic.*

Product images sit on the colour ground exactly as Faire's featured-brands row does. **On a
block ground, all four ink roles switch to `--on-block-b`** — including the mono price. No
opacity modifiers on any ink token (that ban is enforced by `no-ink-alpha.test.ts`).

#### The prohibition list — restated as implementation rules

Absolutely none of the following may exist in this card, in any state, at any breakpoint:
discount badge · strikethrough / compare-at price · percentage off · ★ rating · review count ·
"N sold" · stock counter · "selling fast" / "only 2 left" / any urgency chyron · countdown ·
"Shop now" / "Add to cart" button · cart or bag icon · per-piece hover-add · "Sponsored".

Also excluded, though the schema permits them: the `PRODUCT_BADGES` values
`one-of-a-kind` / `made-to-order` / `limited`. They are true and they are good — **they belong
in the maker's world, not on the feed card.** The feed card's job is to make you want the
person, not to qualify the item.

**One tap target, one destination.** The whole card links to `/w/[handle]`. Individual pieces
are **not** separately linked. Per-piece links are the catalogue affordance, they create four
tap targets where the design says "one plate", and they triple the a11y surface. Single
`<button>`, `aria-label`: `"See ${makerName}'s work — ${craft}"`.

#### Slot eligibility

The cluster needs internal width. At `SIDE` (416px) four pieces are ~140px thumbnails — that
is precisely the failure this card exists to avoid.

| Slot | Ref box | n=2 | n=3 | n=4 | Note |
|---|---|---|---|---|---|
| `LEAD` span7 4:5 | 764×955 | yes | yes | **yes** | the cluster's best frame; tall enough for the lead piece to dominate |
| `WIDE` span8 16:9 | 880×495 | yes | yes | **yes** | the still-life band — reads most like Faire |
| `INSET` span5 3:2 | 532×355 | yes | yes | **no** | ~120px supporting pieces at n=4 |
| `SIDE` span4 1:1 | 416×416 | **no** | no | no | catalogue cell |
| `TALL` span5 4:5 | 532×665 | **no** | no | no | portrait fights a still-life spread |
| `COLUMN` span4 3:4 | 416×555 | **no** | no | no | reserved for the still plate |

Mobile: `M-BLEED` (375, 16:9) — up to **3** pieces. `M-FULL` (311, 4:5) — up to **2** pieces.
`M-OFF-L` (231) and `M-OFF-R` (215) — **never**. Where the desktop card carries 4 and mobile
allows 2–3, drop the **trailing** pieces (engine order is meaningful); never resize to fit.

**U2 hand-off:** the cluster should declare its `aspect` from its piece count — n=2 → `3:2`,
n=3 → `16:9`, n=4 → `16:9` — so the existing cost model routes it toward the right slots on
aspect fit alone. The eligibility table above is the **hard gate** on top of that, because the
composer's relax ladder can otherwise place anything anywhere.

#### States

| State | Behaviour |
|---|---|
| Loading | Frame at slot aspect with its ground painted, internal grid rendered as `Skeleton`s at the **same fractions**, attribution row as a 32px circle + two bars. Geometry is identical to live — CLS-0. |
| Empty | Cannot occur: U1 only emits `product-cluster` for 2–4 products. |
| Error | Per-piece 404 → that cell shows `bg-ground` with its wall label intact. **All** pieces fail → the frame keeps its ground, wall labels and attribution: a typographic still-life on a colour plate. Degraded but composed. No error copy. |
| Success | As specified. |

#### Hover / focus

The pieces scale **together as one object**: `motion-safe:group-hover:scale-[1.02]` applied to
the grid wrapper, not per piece. Independent per-piece hover is the catalogue tell — it says
"these are four things you can pick." One object moving says "this is one maker's table."
Name → `group-hover:text-accent` (on a block ground: no colour change; use
`group-hover:underline underline-offset-4` instead, since `--accent` is not AA on the olive).
`--dur-state` / `--ease-kol`.

---

## (d) Three-kind scroll choreography

### Composition rules — these belong in `spreads.ts`, enforced, not hoped for

1. **Film is the spine. Two non-film cards are NEVER adjacent** — not within a row, not across
   a row boundary. A still next to a cluster reads as "the video ones failed to load." This is
   the single most important rule on this page.
2. **The opening `R-LEAD` row is always film in the LEAD slot.** The first thing on the page
   must move. Non-negotiable for the pitch.
3. **At most one cluster per two rows.** Clusters are the densest object in the book; two in
   view is a marketplace.
4. **At most one still per row.**
5. **A cluster never opens or closes the book.** The last row is film or still.
6. Existing hard constraints (slot repeat window, row-pattern echo, edge penalty,
   `contentSpread`) are untouched. Kind eligibility is an additional **filter** on the
   candidate set, applied before scoring — never a new cost term. Keep the fallback ladder:
   if kind eligibility empties the candidate set, relax rules 3–5 first, then 4, and **never**
   relax rule 1 or 2.

### The rhythm this produces

```
R-LEAD    film (LEAD) · still (SIDE)          ← opens moving, answered by a plate
R-WIDE    cluster (WIDE)                      ← the breath becomes the still-life band
R-INSET   film (INSET) · film (TALL)          ← back to people
R-PLATE   still (COLUMN)                      ← the centred plate, air on both sides
R-LEAD    film (LEAD) · film (SIDE)
R-CROSS   cluster (INSET) · film (SIDE)
```

Film, plate, table, film, plate. Read down a phone it is: *someone working · a thing they
made · their table · someone working.* That is a magazine's rhythm and it is the argument the
feed is making.

### Reveal choreography — `--ease-kol`, `--dur-reveal`, 70ms stagger

All three kinds use the shipped `Reveal` component and `STAGGER_MS`. Nothing new. Media leads
text everywhere (§4.2). The **number of beats differs by kind**, and that is what makes the
rhythm audible:

| Kind | Beats (delay = `indexInRow * 70 + …`) |
|---|---|
| film | media `+0` → caption `+70` |
| still | image `+0` → in-frame chrome `+70` |
| product-cluster | frame + ground `+0` → lead piece `+70` → **supporting pieces `+140` all together** → attribution `+210` |

Supporting pieces resolve **as a group, not individually staggered** — staggering them
individually enumerates them, which is a catalogue gesture; arriving together says "the rest
of the table." The cluster takes 210ms longer to settle than a film card, which reads as
"this one has more in it." It earns its density.

**Reduced motion.** Nothing new required: the existing `.kol-reveal` media query in
`globals.css` collapses every `Reveal` to an instant opacity fade with no translate. Verify
the cluster's four beats collapse to a single fade rather than a 210ms staircase of fades —
if the delays survive, gate them on the same media query.

### Accessibility

- One `<button>` per card, `min-h-11`, stretched — unchanged from film.
- Still `aria-label`: `"See ${makerName} — ${craft} · ${place}"`. It must not say "Watch",
  since nothing plays.
- Cluster `aria-label`: `"See ${makerName}'s work — ${craft}"`. Product titles and prices are
  inside the card and read by the screen reader in DOM order after the label; do not
  `aria-hidden` them.
- Decorative avatar: `alt=""`. The name is already text.
- Contrast pairings, all at full opacity, no ink alphas:
  `on-media` on `scrim-strong` 9.07:1 (pinned by test) · `ink` on `surface` ~14.5:1 ·
  `muted` on `surface` 6.86:1 (stated in §2.1) · `on-block-b` on `block-b` 5.25:1 (computed —
  **QA-Lead to re-verify**).

---

## (e) The asset problem — ranked recommendation, decision needed TODAY

**The honest answer to the question you asked me to answer head-on: no, the mixed-media feed
cannot look good without real imagery, and it is worse than the film-only feed if we ship it
on gradients.** A film card on a gradient at least *moves* — the eye forgives it as a
placeholder. A still card and a cluster card are 100% image; a gradient still card is just a
coloured rectangle with a name on it, and a gradient cluster is four coloured rectangles with
prices, which is a catalogue of nothing. **The two new kinds raise the floor on asset quality
at the exact moment we have none.**

Current inventory: 4 stores × (1 portrait + 2–3 product images + 5 clips), **all synthetic**.
There is no store-media bucket.

**The one piece of good news:** no infrastructure is needed. The SVGs are served from
`apps/kol/public/seed/<handle>/` and referenced by `config.media.images[].src`. Real files
drop into the same folder and the same config field. **Zero backend work — this is a content
task, not an engineering task.**

### Ranked

**1 · Hand-picked licensed stock. RECOMMENDED. ~4 hours, risk LOW.**
Unsplash / Pexels (free, commercial use permitted), or Stocksy (~$15–50/image) if he wants
images investors have not seen. Per maker: **1 portrait (a face), 1 process/workshop shot,
3 product stills on a plain ground** = 5 × 4 makers = **20 minimum, pick 40 for choice.**
Search terms that land: *glassblower studio*, *letterpress workshop*, *leatherworker hands*,
*woodturning lathe*, *ceramic studio shelf*.
Budget: 2–3h picking, 1h cropping into `public/seed/`, **+30 min setting `focalPoint` x/y per
image** — do not skip this, the composer crops across five aspects and an unset focal point
will behead people. This is the only option that makes the feed photograph well by Friday.
*Caveat to state out loud: these are not KOL's makers. Label the demo "representative
imagery" and do not let anyone in the room infer these are real sellers.*

**2 · AI-generated products + stock faces. ~3 hours, risk MEDIUM.**
Image models are excellent at product still-lifes on plain grounds and that is most of what
the cluster card needs. **Do not generate faces** — faces are where models read fake, and
"real people" is the whole pitch. Risk is consistency: three products from one maker must look
like one maker's hand. Viable as a supplement to option 1, not a replacement.

**3 · Shoot it himself. ~2 hours, risk LOW quality-ceiling.**
Phone camera, four real objects on a windowsill in daylight, a friend's hands at a table.
Only covers products, not four distinct makers — but "we shot this ourselves last night" is a
genuinely good pitch line, and it is 100% honest. Good as a fallback for the cluster card
specifically.

**4 · Ship film-only for Friday. The safety net.**
If nothing lands by **Thursday noon**, U3 renders film only and the still + cluster kinds go
dark behind the eligibility filter. The magazine composition already works and already
photographs. Cost: we lose the "a maker with no footage can finally appear" story, which is
one of the better product arguments — but a sparse honest feed beats a full fake one.

**5 · Keep the gradients. REJECT.** On a 1440 slide this reads as a swatch board. It is the
one option that actively loses the room.

### What I need from the Founder today (Wednesday)

> **Commit to option 1 by end of Wednesday, or U3 is scoped film-only.**

There is no version of this where the assets arrive Thursday night and the feed looks
considered on Friday morning — cropping, focal points, and the critic pass need Thursday.
This is a decision, not a task, and it is his.

---

## Open items handed back

- **CTO:** the `tailwind-merge` fix (defect 1) — one file, lifts every maker name in the feed.
- **CTO:** General Sans is not loading (defect 2); and `sunbaked` is rendering with Fraunces
  against §3's pairing binding.
- **U2:** cluster declares `aspect` from piece count (n=2 → `3:2`, n≥3 → `16:9`).
- **U3:** kind eligibility is a candidate **filter** in `spreads.ts`, applied pre-scoring.
- **U3:** restrict focus + ambient index lists to `kind === "film"` in `FeedMagazine.tsx`.
- **QA-Lead:** re-verify the three block-ground contrast figures; confirm the cluster's four
  reveal beats collapse under `prefers-reduced-motion`.
- **Founder:** the asset decision, today.

*Design judgements here are Design-Lead craft calls grounded in the founder-confirmed
`references/NARRATIVE.md` set and the shipped token system. No source files were edited.*
