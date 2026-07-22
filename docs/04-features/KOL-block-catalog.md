# KOL — Block Catalog (the 11 Primitives)
*Phase 3 deliverable · session `ceo-5` · Design-Lead · 2026-07-19. Expands the §2 catalog in [`KOL-feature-tree.md`](./KOL-feature-tree.md) into build-ready specs. Every block is a constrained primitive (D9 layer 1). Props are typed against [`store-config.schema.md`](../03-system-design/store-config.schema.md); tokens/motion from [`KOL-design-system.md`](../03-system-design/KOL-design-system.md).*

> **What a block is.** A pre-designed, art-directed section the renderer (P4) composes from a store's `blocks[]` array. Variety across worlds comes from *which* blocks, in *what* order, with *which* variant, under *which* theme — never from freeform layout. Every block: (a) implements **all 4 states** — empty · loading · error · success; (b) reveals on the single `--ease-kol` choreography (§4 design system); (c) never lets its chrome compete with the maker's film.
>
> **Reading each entry.** `props` are the block's own settings (`blocks[].props`). `bindings` are ids into `media`/`products`/`voiceovers` (`blocks[].bindings`). "State" describes the *designed* behavior in each of the four states, not just presence.

**The 11:** `hero-video · craft-story · product-showcase · product-detail · voice-quote · process-reel · reviews · trust-badge · thank-you · atmosphere · contact-cta`.

---

## 1 · `hero-video`
**Purpose.** The persistent maker film the whole world unfolds around and returns to. Exactly one per world. It is the **shared film frame** that survives every state transition.

*Amended 2026-07-21 (CPO Ruling 1).* The shared element is the **frame**, not necessarily one `<video>` node. Across transitions that do not change the clip (`grow`/`ungrow`/`unfold`/`dock`/`undock`) the same video element carries playback and must never unmount, pause, re-source, or cross-fade. Where the clip source genuinely changes (B4 scoring swaps, B5 narration), the change is an in-frame cross-fade at `--dur-swap` between two stacked buffers inside a Film Layer whose container node persists for the session — the incoming buffer already playing before the fade starts. The full contract lives in [`specs/grow-interaction.md`](./specs/grow-interaction.md) "Film-frame continuity".

**Variants** (the same block, different `pageEligibility` state — the renderer picks by buyer state, the maker picks the resting one):
- `full-bleed` — edge-to-edge, `--radius 0`, feed/grown drama.
- `center-column` — framed center with world margins breathing around it (default resting).
- `corner-shrunk` — docked `320×180`, `--radius-md`, `--shadow-raised` (the `NARRATE_SHRINK` dock).

**Props / bindings.** `props: { showCraftLine: bool, statement?: string }` · `bindings.clipTags` (hint set; the video engine P6 owns final selection by `videoProfile`). Controls minimal: mute toggle + captions only; **sound off until opt-in** (the hard tone line — no autoplay audio).

`statement` (added 2026-07-21, store-config v1.3 amendment) is the maker's one big line over her film — `--fs-display-hero`, weight 400–500, `--scrim` mandatory, `--on-media` ink, ≤ 48 chars, at most one per world. `showCraftLine` is a different tier: it renders `maker.craft` at **caption** size, and the two may co-exist.

**`statement` is maker-authored and has no render-time fallback (D10)** — nothing is ever promoted into the display tier *as the maker's words*: no generated line, no promoted craft line, no store name. But the hero frame is never nameless (amended 2026-07-22, CPO E5 ruling): `maker.displayName` is stored identity, not attributed speech, and it simply changes tier. **Statement present** → statement holds display tier; the name leads the caption line beneath it (with `· craft · location` when `showCraftLine`, alone when not). **Statement absent** → the name holds display tier at weight 700 / `-0.03em`, the shipped render. Bold-and-tight reads as a nameplate; light-and-open reads as speech — that split is what keeps the name from ever being read as words the maker said.

| State | Design behavior |
|-------|-----------------|
| Empty | Maker hasn't uploaded film → poster still with a muted "Add your first clip" prompt (seller preview only; a live world can't reach this — publish requires ≥1 clip). |
| Loading | Poster frame shown immediately; subtle skeleton shimmer over a spinner-free progress edge; audio never loads until played. |
| Error | Clip 404/decode fail → fallback to `poster`, a quiet inline "Couldn't load this clip" + retry; the world stays usable around the still. |
| Success | Video plays muted, controls fade after 2s idle, captions available; `statement`, when present, sets at display-hero over `--scrim` and `maker.displayName` leads the caption line beneath it; when absent, `maker.displayName` sets at display-hero. Craft-line (`maker.craft`) sets in caption type if `showCraftLine`. |

---

## 2 · `craft-story`
**Purpose.** The maker's origin / craft narrative — the "meet the human" reading moment. Editorial long-form, Kinfolk pacing.

**Variants.** `text-left-media-right` (default; asymmetric per DESIGN_VARIANCE) · `stacked-editorial` (full-width type, media between paragraphs, NYT "Snow Fall" cadence) · `pull-quote` (one oversized line from the maker in display face).

**Props / bindings.** `props: { heading, body, pullQuote?, blockGround? }` · `bindings.imageIds` (art-directed with `focalPoint`), optional `bindings.voiceoverIds` (tap-to-hear on the heading). Body at `--fs-body-lg`, `max-w-[65ch]`; display face used once (the heading or pull-quote), not both.

**Block-ground (P2-a — the Faire color-block move).** `blockGround?: "a" | "b" | "c" | null` (default `null`). When set, the section renders **full-bleed in `--block-{a|b|c}`** with `--on-block-{a|b|c}` ink, `--space-12`→`--space-16` internal padding (design-system §1.2), and washes its ground in first on reveal (§4.2). **AA constraint:** `craft-story` carries body copy, so it may only color-block on a **dark** ground that clears AA body 4.5:1 — the two midtone grounds (`sunbaked`/`cuberto-noir` `--block-c`) are display-only and **rejected here** unless the variant is `pull-quote` (display type only). Best fit: `stacked-editorial` or `pull-quote` on `--block-a`.

| State | Design behavior |
|-------|-----------------|
| Empty | Seller view: ghost prompt "Tell the story behind your craft" with the interview beat that feeds it. Live: block omitted from render (never an empty section). |
| Loading | Shimmer text blocks matched to real line lengths; media area holds `focalPoint`-cropped `poster`/low-res. |
| Error | Media fails → text renders alone, layout reflows to `stacked-editorial`; copy is never blocked by media. |
| Success | Staggered reveal (media leads, then heading, then body, 70ms); optional tap-to-hear pill by the heading. |

---

## 3 · `product-showcase`
**Purpose.** The maker's products presented in-world — a gallery, not a grid dump. The bridge from story to buying.

**Variants.** `rail` (horizontal scroll, Cosmos silky) · `masonry` (mixed aspect, editorial — DESIGN_VARIANCE ≥7) · `featured-single` (one hero product, oversized, for made-to-order/one-of-a-kind makers).

**Props / bindings.** `props: { eyebrow?, heading? }` · `bindings.productIds` (ordered), optional `bindings.voiceoverIds` (per-product tap-to-hear). Price in mono/tabular figures. No generic 3-column card row (banned) — masonry or rail instead.

| State | Design behavior |
|-------|-----------------|
| Empty | Seller: "No products yet — add your first piece" with CTA into product management (S8). Live: block omitted. |
| Loading | Card skeletons sized to each product's `aspect` (no generic squares); price line as a short shimmer bar. |
| Error | "Couldn't load these pieces" inline + retry; any already-cached products stay rendered. |
| Success | Cards with `focalPoint` media + title + mono price + inventory/badge chip; hover lifts `-translate-y-[2px]`, `--shadow-card`. |

---

## 4 · `product-detail`
**Purpose.** The single-product deep view (screen `PRODUCT_PAGE`). Where the corner video narrates and the buyer decides. Add-to-cart lives here.

**Variants.** `image-gallery` (default, `focalPoint` gallery + thumbs) · `3d-viewer` (GLB via `model3dId`, orbit controls) · `video-led` (a `product-narration` clip is the hero, images secondary).

**Props / bindings.** `props: { showModel3d: bool }` · `bindings.productIds` (single), `bindings.voiceoverIds`, `bindings.clipTags` (narration hint). Renders trust-badge (compact) + reviews inline. Add-to-cart is the one high-emphasis accent button in the world.

| State | Design behavior |
|-------|-----------------|
| Empty | n/a — a product-detail always has a product (route guard); if `model3dId` null and variant `3d-viewer`, silently falls back to `image-gallery`. |
| Loading | Gallery skeleton at product `aspect`; price + CTA area reserved (no layout shift when they resolve). |
| Error | Broken image → per-image placeholder with `alt` text visible; add-to-cart disabled with reason if inventory unresolved. |
| Success | Full gallery, mono price, inventory truth, tap-to-hear where present, corner video narrating; CTA tactile (`scale-[0.98]` on `:active`). |

---

## 5 · `voice-quote`
**Purpose.** A short maker quote — the "hear her say it" honest voice moment (D10 tap-to-hear layer), or its text-only equivalent.

**Variants.** `audio-tap` (quote + tap-to-hear real voice) · `text-only` (typeset quote, no audio) · `text+waveform` (quote with a slim waveform that fills as it plays).

**Props / bindings.** `props: { quote, attribution?, blockGround? }` · `bindings.voiceoverIds` (the real recording). Quote in display face at restraint; waveform in `--accent` at low opacity.

**Block-ground (P2-a).** `blockGround?: "a" | "b" | "c" | null` (default `null`) — the strongest color-block candidate: a maker's quote set in display face on a vivid `--block-{a|b|c}` ground (`--on-block-*` ink), full-bleed per §1.2, washed in per §4.2. Because the quote is **display/large type**, all three grounds are valid here — including the two midtone grounds (`--block-c`), which are display-only. Waveform recolors to `--on-block-*` at low opacity on a colored ground.

| State | Design behavior |
|-------|-----------------|
| Empty | If no quote set → block hidden entirely (never a blank quote frame). |
| Loading | Audio variant: waveform in skeleton shimmer; text shows immediately (text never waits on audio). |
| Error | Audio fetch fails → degrades to `text-only`, tap affordance removed, no error chrome (graceful, silent). |
| Success | Text set; tap plays real voice; waveform animates on `--ease-kol`; label from `voiceovers[].label`. |

---

## 6 · `process-reel`
**Purpose.** Behind-the-scenes / making-of film — the craft in motion (ShopShops "she's showing me" intimacy). Distinct from `hero-video`: this is supporting footage, scroll-triggered.

**Variants.** `single-reel` (one clip, autoplays muted on scroll-into-view) · `multi-clip-carousel` (2–4 process clips, Coverflow-lite, `--ease-kol`).

**Props / bindings.** `props: { caption? }` · `bindings.clipTags` (`purpose:["process"]` clips). Autoplays muted, pauses on scroll-out (performance + tone).

| State | Design behavior |
|-------|-----------------|
| Empty | No process footage → block hidden. |
| Loading | Reel `poster` with shimmer; carousel shows first poster, others as skeleton frames. |
| Error | Clip fails → `poster` + quiet retry; carousel skips the failed clip rather than blocking. |
| Success | Reel autoplays muted on scroll-in, pauses on scroll-out; caption in `--fs-caption`; carousel arrows tactile. |

---

## 7 · `reviews`
**Purpose.** Social proof on product/store — trust without a shopping-channel "selling fast" register.

**Variants.** `list` (chronological, quiet) · `rating-summary` (aggregate stars + count, mono figures) · `featured-quote` (one strong review in editorial type).

**Props / bindings.** `props: { layout }` · data from `reviews` table (not in store-config — live). Stars in `--accent`; counts tabular.

| State | Design behavior |
|-------|-----------------|
| Empty | "Be the first to review" — a warm invitation, not a void (empty-as-invitation). |
| Loading | Row skeletons (avatar circle + two text bars); aggregate number as shimmer. |
| Error | Serve cached reviews if available; else "Reviews are taking a moment" + retry, block never collapses jarringly. |
| Success | Reviews with real names/dates, aggregate summary; `featured-quote` sets one in display face. |

---

## 8 · `trust-badge`
**Purpose.** The two honest trust layers (D7): Real-Maker (voice-anchored verified human) + AI-Transparency (where AI assisted). Always resolvable — never a false or empty claim.

**Variants.** `inline-compact` (two small chips, for product-detail) · `expandable-detail` (chips expand to full disclosure + the voice-anchor clip).

**Props / bindings.** `bindings.clipTags` → `maker.trust.realMaker.voiceAnchorClipId`. Reads `maker.trust` directly. Disclosure copy is the maker's `aiTransparency.disclosure` verbatim.

| State | Design behavior |
|-------|-----------------|
| Empty | n/a — trust always resolves to *some* honest state (verified / pending / unverified are all valid renders). |
| Loading | Badge skeleton chips; disclosure text reserved. |
| Error | Verification service unreachable → shows `pending` state ("Verification in progress"), never claims verified. |
| Success | Verified: Real-Maker chip + voice-anchor tap; AI-Transparency chip expands to the honest disclosure + `aiAssistedFields`. |

---

## 9 · `thank-you`
**Purpose.** The post-purchase personal moment (`THANK_YOU` state) — the maker's own thank-you film. Relationship close, not a receipt.

**Variants.** `video-message` (the personal `thankyou` clip, centered) · `text+media` (fallback: warm message + a still, if no clip).

**Props / bindings.** `bindings.clipTags` (`purpose:["thankyou"]`, `pageEligibility:["thankyou"]` only). Order summary sits quietly below, secondary to the human moment.

| State | Design behavior |
|-------|-----------------|
| Empty | No thankyou clip → `text+media` fallback with the maker's written thanks + portrait (never a bare "Order confirmed"). |
| Loading | Poster + shimmer while the clip loads; order summary renders immediately below. |
| Error | Clip fails → `text+media` fallback; order confirmation is never blocked by media. |
| Success | Personal video plays (sound opt-in), warm copy, order saved to account, quiet "view order" link. |

---

## 10 · `atmosphere`
**Purpose.** Per-maker mood connective tissue — color field, texture, or motion transition between blocks. The "world breathes" spacer. The *only* block permitted ambient motion.

**Variants.** `color-wash` (a field in the world's `--ground`→`--surface` gradient) · `block-ground` (P2-a — a solid full-bleed band in a vivid `--block-{a|b|c}`, the purest Faire color-block; the connective tissue that carries the brave-color move between film sections) · `image-band` (full-bleed art-directed still) · `motion-divider` (sub-threshold ambient motion — Aesop-quiet, respects reduced-motion by going static).

**Props / bindings.** `props: { toneShift: "warm"|"cool"|"neutral", blockGround? }` · optional `bindings.imageIds`. Height from spacing scale (`--space-16`/`--space-20`). `blockGround?: "a" | "b" | "c" | null` selects the ground for the `block-ground` variant; since atmosphere carries little or no type (or only display/eyebrow type), **all three grounds are valid** here including the midtone `--block-c` — any body-scale caption on it must recolor to a compliant pairing or drop to display size.

| State | Design behavior |
|-------|-----------------|
| Empty | Collapses to a pure spacing gap (still valid — it's atmosphere, absence is fine). |
| Loading | `image-band` shows `--ground` fill until the image resolves (no layout shift). |
| Error | Image fails → falls back to `color-wash` in the world palette. |
| Success | Color field / band / ambient divider renders; `motion-divider` animates sub-threshold on `--ease-kol`, static under reduced-motion. |

---

## 11 · `contact-cta`
**Purpose.** "Follow / message the maker" — keep the relationship open past the sale. The world's closing note.

**Variants.** `button` (single quiet CTA) · `card` (maker mini-profile + CTA) · `footer-strip` (full-width close with handle + message action).

**Props / bindings.** `props: { label, blockGround? }` · reads `maker` for handle/avatar. One accent action, low urgency (relationship, not conversion pressure).

**Block-ground (P2-a).** `blockGround?: "a" | "b" | "c" | null` (default `null`) — the world's closing note color-blocks into a `--block-{a|b|c}` ground for a confident sign-off (strongest on `footer-strip`, full-bleed per §1.2). The `label`/handle set in `--on-block-*`. The CTA is `--fs-body`/caption type, so on a colored ground it must sit on a **dark** ground that clears AA body 4.5:1; the two midtone `--block-c` grounds are display-only and rejected here (use `--block-a`).

| State | Design behavior |
|-------|-----------------|
| Empty | If messaging not enabled for the maker → block hidden (no dead CTA). |
| Loading | n/a — static from `maker` data; renders immediately. |
| Error | Message action unavailable → CTA disabled with a tooltip ("Messaging opens soon"), never a broken click. |
| Success | Active CTA, tactile `:active`; `footer-strip` sets handle in caption type, avatar from `avatarMediaId`. |

---

## Cross-cutting requirements (every block)

- **4 states are non-negotiable** — a block that renders only `success` is not shippable (design-taste Rule 5).
- **No alpha on ink tokens.** `text-ink/*`, `text-muted/*`, `text-on-media/*`, `text-on-block-*/*`, `text-accent*/*` are banned — a slash-opacity on an ink composites a color nobody audited (EmptyPrompt's `text-muted/80` over `bg-surface/60` measured 3.63:1, sub-AA in 8 of 10 palette-modes). Secondary hierarchy comes from the **type scale**, not a second alpha. Backdrop alphas (`bg-surface/60` …) are fine. Enforced by `no-ink-alpha.test.ts` (design-system §5).
- **Empty ≠ blank.** Live worlds omit truly-empty optional blocks; seller-preview shows guiding prompts tied to the interview beat that fills them; required blocks (hero-video) can't reach empty in a published world.
- **Loading = skeleton matched to real layout** (never a centered spinner); reserve space so nothing shifts when data resolves.
- **Error = quiet + inline + recoverable**, in the interface's voice, never blocking the rest of the world (frontend-design writing rules).
- **Reveal on the one curve** — `--ease-kol`, 70ms stagger, media-leads-text, once per element, reduced-motion → instant fade.
- **The film always wins.** No block's chrome, motion, or color may pull focus from the maker's video.
- **Block-grounds are the brave-color move (P2-a).** Four blocks expose an optional `blockGround: "a" | "b" | "c"` prop that renders the section full-bleed in a palette's `--block-{a|b|c}` ground with `--on-block-*` ink (design-system §2): `voice-quote` + `atmosphere` (`block-ground` variant) accept **all three** grounds (display/large type or no type); `craft-story` + `contact-cta` carry body/UI copy so they accept **only dark grounds that clear AA body 4.5:1** — the two midtone grounds (`sunbaked`/`cuberto-noir` `--block-c`) are display-only and rejected there. Grounds wash in first on reveal (§4.2), `--space-12`→`--space-16` padding (§1.2). This is how the renderer builds the Faire "section-on-a-color-block" identity from config alone.

*P3-c — impact-stat primitive (optional, deferred):* a small maker-authored stat pair (e.g. "12 years · one wheel", set in mono/tabular figures per design-system §3) could live as a `craft-story` sub-slot or a future dedicated primitive; not one of the 11 in v1, noted here so P4 doesn't reinvent it ad hoc. **CPO position 2026-07-21:** agreed — Wave 6, as a `craft-story` sub-slot, **not** a twelfth block. The catalog stays at 11. Every block added is a block the AI drafter must learn to compose and the critic must learn to judge; a stat pair is a slot, not a structure. It must remain maker-*declared* (D16-2) — the platform never computes or infers a stat on a maker's behalf.

---

*Block designs are Design-Lead craft specs for Phase 4 implementation. Per-block `props` Zod shapes (discriminated union on `type`) are the backend-engineer deliverable against this catalog. Visual fidelity gates on design-critic + QA-Lead WCAG PASS at build, per the design workflow.*
</content>
