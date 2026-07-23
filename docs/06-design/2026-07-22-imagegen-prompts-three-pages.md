# KOL — Image-Generation Prompts for the Three Buyer Pages

*Design-Lead · 2026-07-22 · session `design-lead-imagegen-prompts`.*

Purpose: prove the KOL visual concept with high-fidelity **image-model mockups** of the three buyer surfaces, before another line of UI is built. Model-agnostic — written for any modern image model that accepts long structured prose (Nano Banana / GPT-Image / Midjourney v7 / Stitch).

Every value below is drawn from the binding rails, not invented:

- Palettes, hex, block-grounds, type scale, radius identities, shadows, motion tokens — [`docs/03-system-design/KOL-design-system.md`](../03-system-design/KOL-design-system.md)
- Slot tables, card anatomy, masthead, dock geometry, exclusion zone — [`docs/06-design/KOL-wave3-screen-specs.md`](./KOL-wave3-screen-specs.md)
- Maker names, crafts, locations, statements, product titles, prices, block order — `supabase/seed/002_w3_seed_worlds.sql` (the four real seeded worlds)

**Palettes are used differently on each page on purpose** — `sunbaked` light → `market-plum` light → `cuberto-noir` dark — to prove the rails reach warm-marketplace, brave-color-block, and dark-cinematic without flattening. **Font pairing is bound to palette** (design-system §3); it is not a free cross-product, and there is no Inter anywhere.

---

## 0 · The short launch prompt (paste this into a fresh session)

```
Generate three high-fidelity desktop UI mockups for KOL — a video-native marketplace where
buyers meet the real maker before the product. Not a grid marketplace; the antithesis of
TikTok Shop. Read docs/06-design/2026-07-22-imagegen-prompts-three-pages.md and use its
three prose prompts VERBATIM, one image per page:
  1. Discovery Feed — sunbaked palette, Clash Display / General Sans
  2. Maker World, unfolded — market-plum palette, Fraunces / Satoshi
  3. Product Page with docked narration video — cuberto-noir dark, Cabinet Grotesk / Satoshi
Render each at 2560×1600 (16:10), flat UI screenshot, no browser chrome, no device frame.
Honour every literal hex, font, price and name in the prompt — they are real data, not
placeholders. Honour the negative clause at the end of each prompt without exception.
Return the three images plus a one-line note on any instruction you could not satisfy.
```

---

## 1 · Discovery Feed (`FEED`) — `apps/kol/src/app/feed/page.tsx`

**A warm sun-drenched magazine index of four real makers on film, composed in asymmetric slots so it can never be mistaken for a product grid.**

```
Flat desktop UI screenshot, 2560×1600: the magazine discovery feed of KOL, a
video-native marketplace of real makers. Compose on a 1600×1000 CSS viewport — 1440 px
centred container, 80 px margins, a 12-column grid with 48 px gutters used as a
measuring device, never a cell structure. Palette is sunbaked light: ground #F6EFE3,
surface #FFFBF3, ink #221C15, muted #645648, line #E7DCC8, accent #C64A2C terracotta,
accent-2 #3E7E8C sky, on-media #FBF3E8; block-grounds clay #B8452A, olive #5F6B33, sky
#4C93A8 with cream ink #FBF3E8 — unused here; KOL's chrome never colour-blocks.
Typography is the bound statement-grotesk pairing: Clash Display for the one headline,
General Sans for names and captions; no mono, the feed carries no numbers. Top-left, an
eyebrow in General Sans 13 px uppercase 0.08 em, colour #645648: KOL · TODAY. Beneath it
the single display moment — Clash Display 56 px weight 500, tracking -0.015 em, ink
#221C15: “Four people who make things.” Then 96 px of open ground. Four film cards
follow in two asymmetric rows. Row one: a 4:5 card spanning columns 1–7 of Wren Hollis,
a woodturner in her forties at the lathe, oak shavings curling off the gouge, her face
in low afternoon light through a dusty workshop window — 35 mm f/2, tungsten mixed with
daylight, dust in the air, callused hands; beside it at columns 9–12, dropped 96 px, a
1:1 card of Isolde Brandt at the glory hole, furnace glow on her cheek, 85 mm backlight.
Row two starts 128 px lower: a 3:2 card at columns 1–5, dropped 64 px, of Mara Okafor
saddle-stitching oxblood leather in a stitching pony, two needles mid-pull, north window
light, 50 mm f/1.8; and a 4:5 card at columns 8–12 of Tomás Ferreira inking a Vandercook
press, hands black with ink. The media IS the card — no border, no shadow, no background
plate, 16 px radius only. Beneath each image, two flush-left lines: the maker's name in
Clash Display 22 px weight 500, ink #221C15; under it General Sans 13 px uppercase 0.08
em, colour #645648 — WOODTURNER · WHITSTABLE, KENT / GLASSBLOWER · BRISTOL /
LEATHERWORKER · WALTHAMSTOW, LONDON / LETTERPRESS PRINTER · LEEDS. The Wren card is live
film under a faint bottom-up scrim; the other three are crisp poster stills. Do not
render: prices, ratings, star clusters, save icons, discount badges, countdowns, sold
counts, category chips, filter bars, or any card chrome. No Inter or system sans, no
AI-purple, neon glow, pure black #000000, cream-plus-dainty-serif craft-fair styling, no
uniform equal-cell grid, cards of matching height, card-in-card nesting, lorem ipsum,
fake browser chrome, watermarks, logos, or stock-model smiling-to-camera portraits.
Faces lead; the film wins. Render params: --ar 16:10, photoreal UI screenshot, flat-on,
no device frame.
```

*Word count: 450.*

---

## 2 · Maker World, unfolded (`WORLD_OPEN`) — `apps/kol/src/app/w/[handle]/page.tsx`

**Mara Okafor's leather world settled open around a still-playing film, colour-blocking bravely into deep plum and mustard at ground scale.**

```
Flat desktop UI screenshot, 2560×1600: one maker's fully personalised world on KOL, at
the settled end-state of the 900 ms unfold — the film never stopped, the world assembled
around it. 1600×1000 CSS viewport, 1440 px container, 80 px margins, colour bands
breaking full-bleed past the container. Palette is market-plum light: ground #F4EFE9,
surface #FCF8F3, ink #2A1D22, muted #75655F, line #E6DBD0, accent #7A2E4A plum, accent-2
#C6902F mustard, on-media #FBF4EC; block-grounds deep plum #4A2036 with ink #F3DCE6,
mustard #C6902F with ink #2A1D0A, coral #E88B6E with ink #3A160E. Typography is the
bound warm-serif pairing: Fraunces at high optical size for display, Satoshi for body,
Geist Mono for every price, tabular figures. Radius identity is sharp: square corners
throughout. Top of frame, a centred 720 px-wide 16:9 film resting in its rect — Mara
Okafor, a Black woman in her late thirties, saddle-stitching a belt in a stitching pony,
two needles mid-pull, waxed linen thread taut, north window light raking across bridle
leather, 50 mm f/1.8, wax on her fingers, her face turned three-quarters into the light.
Over the film's lower left, above a mandatory bottom-up scrim fading to #F4EFE9 at 55 %,
one display line in Fraunces 112 px, weight 450, tracking -0.01 em, ink #FBF4EC: “Nine
stitches to the inch”. Directly beneath, one caption line in Satoshi 13 px uppercase
0.08 em, same ink, the name leading: MARA OKAFOR · LEATHERWORKER · WALTHAMSTOW, LONDON.
Below the film, 128 px of air, then an asymmetric three-piece product showcase — never
three equal cards: a tall Ninefold Belt image left, a wide oxblood card-sleeve still
right, the Weekend Holdall shot long beneath them. Titles in Fraunces 22 px; prices in
Geist Mono 17 px tabular, ink #2A1D22, reading £95.00, £48.00 and £520.00, each with a
muted #75655F caption — MADE TO ORDER, 14 IN STOCK, SOLD. Next a full-bleed mustard
#C6902F band, 96 px internal padding, carrying the craft story in Satoshi 19 px, ink
#2A1D0A, measure capped at 68 characters, beside a close photograph of an edge being
burnished. Then a quiet atmosphere band, and a hairline trust row — REAL MAKER ·
VERIFIED · MAKER-AUTHORED — in Satoshi 13 px uppercase, muted #75655F, no badge shields.
At the foot, a full-bleed deep plum #4A2036 band with ink #F3DCE6: one Fraunces line and
one square accent button. Motion preset is fluid: no liquid or 3D signature beat here,
deliberately. Do not render: Inter, AI-purple, neon glow, pure black, timid
cream-with-dainty-serif-and-terracotta-accent craft-fair styling, a dense transactional
deal grid, urgency chyrons, discount badges, star ratings, card-in-card nesting, lorem
ipsum, fake browser chrome, watermarks, logos, or stock-photo hands. Render params: --ar
16:10, photoreal UI screenshot, flat-on, no device frame.
```

*Word count: 444.*

---

## 3 · Product Page with contextual narration docked (`PRODUCT_PAGE` + `NARRATE_SHRINK`)

**Isolde Brandt's dark, cinematic glass world at the decision moment — the film has shrunk to a 320×180 corner dock and is narrating the exact vase on screen.**

```
Flat desktop UI screenshot, 2560×1600: a single-product decision page inside a maker's
dark world on KOL, the film docked bottom-right mid-narration. 1600×1000 CSS viewport,
1440 px container, 80 px margins, 12 columns, 48 px gutters. Palette is cuberto-noir
dark: warm off-black ground #111113 — never pure black — surface #1B1C1F, ink #F2F0EC,
muted #9A9791, line #2A2B2F, accent #E85C3A warm ember, accent-2 #3D6CE0 electric,
on-media #F5F3EF; block-grounds ink-black #0E0E10 with #F2F0EC, paper #F4F2ED with
#16161A, electric #3D6CE0 with #F5F5FF (display type only). Bound modern-mono-grotesk
pairing: Cabinet Grotesk display, Satoshi body, JetBrains Mono numerals, tabular
figures. Radius is sharp: square corners throughout, including the dock. Left, columns
1–7, the hero — one large 4:5 photograph of the Amber Swell Vase, hand-blown soda-lime
glass in deep amber, leaning deliberately, backlit so it burns and throws a long caustic
across matte charcoal, 85 mm macro, with a tall layered shadow reading as real depth.
Three square thumbnails below, one showing Isolde's hands on the punty. Right, columns
8–12, a sticky detail rail: eyebrow in Satoshi 13 px uppercase 0.08 em, colour #9A9791 —
ONE OF A KIND · 1 AVAILABLE; title in Cabinet Grotesk 40 px weight 600, tracking -0.02
em, ink #F2F0EC — Amber Swell Vase; price in JetBrains Mono 24 px, ink #F2F0EC —
£340.00; the maker's own words in Satoshi 17 px, ink #9A9791: “One gather, one breath,
one wave of amber caught mid-swell. The lean is deliberate — the glass wanted it.”
Materials in JetBrains Mono 13 px: SODA-LIME GLASS · AMBER OXIDE. Then the one
high-emphasis square button, full rail width, 56 px tall, fill #E85C3A, ink #1B1C1F,
Satoshi 17 px: Add to cart — and this is the world's single signature liquid moment, a
viscous ember droplet caught mid-merge with the button's left edge, one gooey metaball,
nothing else glowing. Beneath it a hairline #2A2B2F rule, an inline compact trust row in
muted ink — REAL MAKER · VERIFIED · MAKER-AUTHORED, no badge shields — then two short
quoted reviews in Satoshi 17 px with a mono verified-purchase line, no stars.
Bottom-right, inset 24 px from both edges, the dock: exactly 320×180, square, wide soft
shadow tinted to #111113, showing Isolde at the furnace mouth, molten amber on the
punty, her face lit orange, mid-sentence. A 340×200 exclusion zone keeps that corner
clear; the CTA sits far above it. Do not render: Inter, AI-purple, neon glow, pure black
#000000, a play button, scrub bar or title caption on the dock, a second CTA, star
clusters, countdowns, discount badges, lorem ipsum, fake browser chrome, watermarks,
logos, or CGI-perfect studio product renders — this is real glass shot in a real hot
shop. Render params: --ar 16:10, photoreal UI screenshot, flat-on, no device frame.
```

*Word count: 454.*

---

## 4 · How to judge the output

Reject and re-run if any of these are true:

1. Any of the three reads as a **uniform grid** of equal cells.
2. A **face is not leading** the primary media on every page.
3. Type is **Inter or a generic system sans**, or the display face does not match the page's bound pairing.
4. Colour is used only as small accents — **no page-2 or page-3 section blocks into a full-bleed vivid ground**.
5. Prices are proportional-figure rather than **mono, tabular**, or the currency drifts off GBP.
6. Any name, product, or price appears that is not in the seed data above.
7. The page-3 dock is anything other than **320×180, bottom-right, no chrome, no caption bar**.

---

*Design-Lead craft decisions against the binding rails. Every hex, font, slot, price, and name is traceable to the design system, the wave-3 screen specs, or the seeded worlds; nothing here is invented copy except the photographic direction, which is direction, not product claim.*
