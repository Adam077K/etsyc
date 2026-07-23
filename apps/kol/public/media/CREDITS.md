# Media credits — Discovery Feed (screens-only pass)

All imagery is free-license stock (Unsplash License / Pexels License), depicting
real people making real things. Downloaded locally for reliable rendering; the
maker names/studios attached to them in `src/lib/fixtures/makers.ts` are
**synthetic demo data**, not the photographers or their real subjects.

Replace with KOL's own maker footage/photography before any public launch.

| File | Depicts | Source | License |
|---|---|---|---|
| clay-wheel.jpg | Hands throwing a pot on a wheel | Unsplash `photo-1493106641515-6b5631de4bb9` | Unsplash |
| woodwork.jpg | Person drilling a timber plank | Pexels photo 1094767 | Pexels |
| amara.jpg | Portrait, golden light | Unsplash `photo-1544005313-94ddf0286df2` | Unsplash |
| salt-ceramics.jpg | Ceramic bottle-vases | Unsplash `photo-1565193566173-7a0ee3dbe261` | Unsplash |
| apothecary.jpg | Hands, dropper + oil bottles | Unsplash `photo-1556760544-74068565f05c` | Unsplash |
| forge-kaito.jpg | Portrait, misty | Unsplash `photo-1519058082700-08a0b56da9b4` | Unsplash |
| jewelry.jpg | Fine ring on dark box | Unsplash `photo-1605100804763-247f67b3557e` | Unsplash |
| stool-blue.jpg | Wooden stool on blue | Unsplash `photo-1503602642458-232111445657` | Unsplash |
| textiles-rack.jpg | Rack of dyed cloth | Unsplash `photo-1542060748-10c28b62716f` | Unsplash |
| mesa-rosa.jpg | Woman preparing food | Pexels photo 1153369 | Pexels |
| prints-wall.jpg | Wall of framed prints | Unsplash `photo-1513519245088-0e12902e5a38` | Unsplash |
| film-elias.jpg | Person with a film camera | Pexels photo 3585047 | Pexels |
| quote-portrait.jpg | Portrait, black & white | Pexels photo 3094216 | Pexels |
| maker-jonah.jpg | Portrait, smiling | Unsplash `photo-1607990281513-2c110a25bd8c` | Unsplash |
| maker-elin.jpg | Portrait, winter | Unsplash `photo-1487412720507-e7ab37603c6f` | Unsplash |
| plates.jpg | Assorted ceramic plates | Unsplash `photo-1604014237800-1c9102c219da` | Unsplash |
| mono-ceramics.jpg | Speckled ceramic tumblers | Unsplash `photo-1610701596007-11502861dcfa` | Unsplash |
| maker-soren.jpg | Portrait, black & white (unused reserve) | Unsplash `photo-1552058544-f2b08422138a` | Unsplash |

## Arc 1 — maker worlds (Odd Clay + Indigo & Ash)

| File | Depicts | Source | License |
|---|---|---|---|
| clay-shape.jpg | Hands finishing a clay bowl on a wheel | Pexels photo 2166456 | Pexels |
| clay-drying.jpg | Rows of unglazed pots drying | Pexels photo 2162938 | Pexels |
| clay-shelf.jpg | Finished ceramics on a studio shelf | Unsplash `photo-1610701596061-2ecf227e85b2` | Unsplash |
| sabine.jpg | Portrait, wax-print, terracotta wall | Unsplash `photo-1531123897727-8f129e1688ce` | Unsplash |
| indigo-dye.jpg | Indigo/ink swirl (dye vat) | Unsplash `photo-1528459801416-a9e53bbf4e17` | Unsplash |
| textile-fold.jpg | Folded lengths of cloth | Pexels photo 4614226 | Pexels |
| textile-machine.jpg | Thread spools + sewing machine | Pexels photo 4614225 | Pexels |
| textile-scarf.jpg | Worn scarf, moody light | Unsplash `photo-1520903920243-00d872a2d1c9` | Unsplash |

## Imagery upgrade manifest — priority swaps for real photography

Slots where the interim stock reads weaker than the surface deserves, ordered
for the Founder's photography drop. Each is a *content* upgrade, not a layout
change.

| Surface | Slot | Interim | Proper shot |
|---|---|---|---|
| `/how` hero | Cinematic opener ground (`how-story.tsx`) | `indigo-dye.jpg` — an abstract dye swirl; reads impersonal in the least-scrimmed quadrant (interim fix: right scrim floored at `ink/30`) | A real maker's hands or face mid-process (throwing, dyeing, carving) — the thesis page's first human impression should be a person, not a texture |

## Worlds expansion — Grain & Groove + Ember & Rue + Risograph Room

These three worlds reuse **existing** local media, so every image is honest stock
that already renders. One derived file was added — `riso-ink.jpg`, a reworked crop
of an existing source (see below), not a new download. Where an image is reused
across maker contexts, the content genuinely fits the new craft — the same practice
the build already uses (e.g. `salt-ceramics.jpg` is both Salt Kiln's feed tile and
Odd Clay's carafe gallery). No portrait is ever reused as a different named maker.

| File | Reused as | In |
|---|---|---|
| woodwork.jpg | Bench / drilling timber (own feed tile) | Grain & Groove — hero, process, studio, Butterfly Board |
| stool-blue.jpg | Finished hand-joined stool | Grain & Groove — process, Field Stool |
| maker-soren.jpg | Tomás Reyes' portrait (previously unused reserve) | Grain & Groove — story |
| apothecary.jpg | Dropper + oil bottles (own feed tile) | Ember & Rue — hero, process, studio, Neroli & Cedar Oil |
| salt-ceramics.jpg | Glazed stoneware vessels Noor decants into (ceramic bottle-vases) | Ember & Rue — story, process, Sealed Vessel |
| prints-wall.jpg | Wall of finished riso prints (own feed tile) | Risograph Room — hero, process, studio, Overprint Study |
| riso-ink.jpg | Riso ink on warm paper — a **derived** asset: a tight lower-left detail crop of `indigo-dye.jpg` with a riso-language treatment (high contrast, hue pushed toward riso blue, warm-paper split-tone). Deliberately distinct framing + colour from Sabine's wide-vat use of the same source, so a viewer touring both worlds gets no déjà-vu. Made locally with ffmpeg from the credited Unsplash source (`photo-1528459801416-a9e53bbf4e17`). | Risograph Room — story, process, Ink Field |

`indigo-dye.jpg` itself stays exclusive to Indigo & Ash's studio; the print world
only ever shows the reworked `riso-ink.jpg` crop above.

Replace with KOL's own maker footage/photography before any public launch — this is
the screens-only stock pass, and the reuse above is a placeholder, not the shipped look.
