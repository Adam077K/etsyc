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
| `/how` hero | Cinematic opener ground (`how-story.tsx`) | ~~`indigo-dye.jpg`~~ **RESOLVED (cleanup wave)** — now `<MakerFilm>` on the human-presence slot: real maker footage (`COVER_MAKER.filmSrc`, odd-clay clip) with poster `clay-wheel.jpg` (Lena's hands at the wheel), degrading to the still. The thesis page opens on a person, not a texture. | Replace the odd-clay proof clip with Lena's real hero footage at the same fixture path — no code change (see `public/media/video/README.md`) |

## Worlds expansion — Grain & Groove + Ember & Rue + Risograph Room

These three worlds reuse **existing** local media, so every image is honest stock
that already renders. Four **derived** files were added (reworked crops of existing
sources — see below — never new downloads). Where an image is reused across maker
contexts, the content genuinely fits the new craft — the same practice the build
already uses (e.g. `salt-ceramics.jpg` is both Salt Kiln's feed tile and Odd Clay's
carafe gallery). No portrait is ever reused as a different named maker.

| File | Used as | In |
|---|---|---|
| woodwork.jpg | Bench / drilling timber (own feed tile) | Grain & Groove — hero, process 01, studio, Butterfly Board |
| maker-soren.jpg | Tomás Reyes' portrait (previously unused reserve) | Grain & Groove — story |
| apothecary.jpg | Dropper + oil bottles (own feed tile) | Ember & Rue — hero, process, studio, Neroli & Cedar Oil |
| salt-ceramics.jpg | Glazed stoneware vessels Noor decants into (ceramic bottle-vases) | Ember & Rue — story, process, Sealed Vessel |
| prints-wall.jpg | Wall of finished riso prints (own feed tile) | Risograph Room — feed tile, process 01, studio |

### Derived assets (reworked locally with ffmpeg; source credited, distinct from source use)

| File | Derived from | Treatment & why | In |
|---|---|---|---|
| wood-stool.jpg | stool-blue.jpg (Søren Bast's feed tile) | Tight crop + warm-timber grade (blue ground → sage) so it reads as Tomás's reclaimed piece, NOT the same cool studio stool that is Søren's tile. | Grain & Groove — Field Stool |
| wood-joint.jpg | stool-blue.jpg | Tight crop on the stretcher/leg joinery + warm grade — a joint detail, distinct framing from Søren's whole-stool tile. | Grain & Groove — process 02, Field Stool + Butterfly Board galleries |
| riso-ink.jpg | indigo-dye.jpg (Indigo & Ash's dye vat) | Tight lower-left detail crop + riso-language treatment (high contrast, hue toward riso blue, warm-paper split-tone). Distinct framing + colour from Sabine's wide vat — no cross-world déjà-vu. | Risograph Room — hero (heroFilm), process 02, Ink Field |
| riso-overprint.jpg | prints-wall.jpg (own feed tile, monstera frame) | Two-colour riso duotone (fluoro pink + blue) with RGB channel-shift misregistration — the pink/blue overprint collision the copy describes. | Risograph Room — story, Overprint Study |

`indigo-dye.jpg` stays exclusive to Indigo & Ash; `stool-blue.jpg` (raw) stays
Søren Bast's tile only — Grain & Groove shows the reworked wood-* crops instead.
Risograph Room's world **hero** leads on the riso-ink action register (`heroFilm`),
while the feed tile stays `prints-wall.jpg` (the feed is not disturbed).

Replace with KOL's own maker footage/photography before any public launch — this is
the screens-only stock pass, and the reuse above is a placeholder, not the shipped look.

## Two Dots — REAL maker assets (Founder-provided) · INTERNAL-ONLY

> **Governance (standing brand/legal rule).** These are the FIRST real assets on
> KOL — real video + photography of Sharon's children's-costume studio, provided
> by the Founder. The imagery includes **children**. This world is **internal-only
> and its branch is HELD from merge** until Sharon gives written permission for
> public use. Any asset containing an identifiable child's face is flagged below
> for specific Founder approval/swap. `feat/kol-twodots` must not merge on a QA
> PASS alone — Founder clearance is a separate, required gate.

Curation: 182 Wix-export files → 61 deduped candidates (min-dim ≥ 600px, ≥ 40KB) →
**9 images + 2 videos kept** (quilt.jpg logged retroactively — it shipped in a
prior wave to the Little Devil gallery without a CREDITS row; inspected faceless,
now recorded). Skipped: 121 duplicates/thumbnails/sub-5KB, plus all face-forward
costume portraits (governance — see below).

### Kept — no identifiable face (safe for hero/tile/process/product cards)

| File | Depicts | Source | Face |
|---|---|---|---|
| video/two-dots.mp4 | Top-down: adult hands making a small felt craft (the hero clip) | Founder video "Hands-on video.mp4" — muted H.264, faststart | none |
| video/product-butterfly-wings.mp4 | Child (fully **hooded** — face covered by the costume) spinning to show butterfly wings | Founder video "Show-coustum.mp4" — re-encoded 30fps, muted | none (hood covers face) |
| twodots/hero-poster.jpg | Hands + a handmade "MY CAT" matchbox craft (poster for the hero clip) | frame from Hands-on video | none |
| twodots/materials.jpg | Sewing-materials flat-lay (beads, denim, fabric, scissors, yarn) | photo #47, cropped to remove course-promo text | none |
| twodots/butterfly-back.jpg | Butterfly costume, child **back-turned** (no face) | photo #39 | none |
| twodots/devil-back.jpg | Little-devil costume (wings, tutu, trident) — **head-cropped** (top 28%) to remove a partial side profile present in the source; only the back of the hair remains | photo #09, cropped | none (cropped) |
| twodots/tote.jpg | Hand-printed cat-face drawstring bag (product) | photo #55, cropped from brand card to isolate the bag | none |
| twodots/felt.jpg | Felt-craft characters flat-lay (butterfly, cactus, panda…) | photo #33 | none |
| twodots/quilt.jpg | Patchwork-quilt detail (eyelet lace, tartan, floral cotton patches, dusty-rose binding) — a made object, no people | photo #61, cropped to the corner detail | none |

### Kept — CONTAINS a child's face → FLAGGED for Founder approval

| File | Depicts | Where used | Flag |
|---|---|---|---|
| twodots/workshop.jpg | Two people at sewing machines in the real studio; foreground back-turned, **background minor in side profile** | story image + process step 02 + Workshop product gallery | ⚠ partially-identifiable minor (profile). Founder to approve or swap. |

### Governance fallback plan — per image (so each Founder decision is one word)

| Image | Current wiring | If Founder APPROVEs | If Founder DECLINEs / SWAPs |
|---|---|---|---|
| twodots/workshop.jpg | story slot + process 02 + Workshop product gallery (contains a background minor in profile) | keep as-is | **pre-staged swap** → story + process 02 take `materials.jpg`; Workshop gallery drops to its other two shots. Both faceless & already shipped — one edit each in `worlds.ts` + `commerce.ts`. Alt flat-lay: `felt.jpg`. |
| twodots/devil-back.jpg | Little Devil product card + gallery (**faceless** head-cropped default) | *(upgrade path)* replace with uncropped #09 for fuller framing (head + felt horns; partial side profile) | no change — the faceless crop is already the conservative default |

### NOT shipped — held for Founder decision

- Founder video **"Showing the little girl costume.mp4"** clearly features a
  child's **face**. It was NOT processed into the repo or wired to any surface.
  Available in the Founder's Downloads for approval; drop in + set a `filmSrc`
  only after written permission.
- **Uncropped Little Devil shot** (source photo #09) shows the child's **partial
  side profile** (head turned left). NOT shipped — the wired `devil-back.jpg` is
  the head-cropped faceless version. If the Founder prefers the fuller framing
  (head + felt horns visible), approve #09 and it replaces the crop on the Little
  Devil card. Governance choice defaults to the faceless crop.

All Two Dots commerce data (prices, reviews, order/booking) is **demo/synthetic**
as always — only the photos and video are real. Currency shown as demo £ to match
the app's mock storefront; the real studio prices in ₪. Maker name ("Sharon") and
place ("Israel") are placeholders pending Founder confirmation — not fabricated
specifics.
