# KOL — Reference Narrative & Corrected Design Direction
*Written 2026-07-19 by CEO after exploring the founder-curated screenshots. This is the authoritative brief for redoing [`../../03-system-design/KOL-design-system.md`](../../03-system-design/KOL-design-system.md). It CORRECTS the first design direction, which was too quiet/muted/craft-fair. Founder-confirmed.*

---

## Per-reference read (what each teaches, from the actual screenshots)

### Faire — `faire.png` · overall style + human feeling
Warm cream ground, but **color is used bravely**: whole sections block into deep plum, olive, mustard, soft coral. Serif headlines ("The perfect for your store, right this way"), **real founder portraits with quotes**, a "Shop by your values" row (Women-owned, Latino-owned, Handmade…), rounded pill category chips, soft-cornered product cards. **Take:** warmth + trust + humanity at marketplace scale, and the confidence to color-block whole sections instead of defaulting to one muted ground.

### Kotn — `kotn.png` · human feeling + BOLD type
**Huge, heavy display type set directly over full-bleed, sun-drenched photography of real people** ("UP TO 50% OFF", "New Arrivals"). Earthy-but-vivid palette (tan, terracotta, sky blue, olive). An impact-stat moment ("25 schools funded. 5,127 farms supported."). Instagram grid of real humans. **Take:** big confident typographic statements over human imagery; people lead every frame; "honor the people who make them" as a felt value, not a caption.

### Lusion — `lusion.mov` (video, local only — not viewed by agents) · motion, flow, 3D
The motion/immersion **ceiling**: cinematic WebGL, fluid spatial transitions, real 3D depth and product presence, liquid-smooth scroll. **Take:** KOL's signature moments (the "world unfolds," the video dock, hero product reveals) should feel cinematic and physical — depth and fluidity, not flat fades. *(If a specific beat in the clip is the target, founder to describe it; agents can't watch video.)*

### Cuberto — `cuberto.png` · style + clean + video + modern
**Dark↔light alternating sections**, crisp bold sans, **glossy 3D objects**, playful 3D characters, rounded pill buttons, video-forward project tiles, and a **liquid/gooey signature-motion moment** ("Have an idea? TELL US" chrome blob). **Take:** the modern, confident, high-craft polish bar; 3D objects and video woven into a clean layout; one memorable liquid/gooey interaction as a signature.

### TikTok Shop / Complex — `shop-tiktok.png`, `complex-shop.png` · the "old" way to REJECT
Dense grids of tiny product cards, flash-sale/coupon **urgency**, discount badges (−50%, −54%), star-rating + "23K sold" clutter, zero human story. Complex is cleaner but still fundamentally a **grid of stuff**. **Take (as anti-pattern):** KOL is the opposite — few large, human-forward pieces; story first; no urgency chyrons, no deal-grid density.

---

## The correction (why the first direction was off)
The first design pass read the brief as **quiet, muted, restrained** (Aesop/Kinfolk, small serif, earthy craft-fair). The references say the opposite on three axes:

| First direction (OFF) | Corrected direction (from the refs) |
|---|---|
| Quiet, muted, **small** type | **Bold, confident, BIG** statement type (Kotn) |
| Muted earthy grounds | Warm **but vivid, color-blocked** sections (Faire) |
| "One quiet easing," restrained | **Cinematic, fluid, liquid, 3D-capable** motion (Lusion, Cuberto) |
| Editorial-calm | **Modern, crisp, video-forward** polish (Cuberto) |
| — | Reject the **transactional grid** entirely (TikTok/Complex) |

## The corrected direction (one paragraph)
KOL is **warm and human like Faire/Kotn, melded with modern, bold, and cinematic like Lusion/Cuberto.** Real human faces lead every surface. Typography makes **big, confident statements** set over film and photography. Color is warm but **used bravely** — whole worlds can color-block into vivid grounds, not just muted paper. Motion is **cinematic and physical** — fluid spatial transitions, real depth, a signature liquid/3D moment — never flat. The whole thing is **modern and video-forward**, the antithesis of the dense, urgent, transactional deal-grid. Warm humanity + modern cinematic confidence.

## Instructions for Design-Lead (redo `KOL-design-system.md`)
Keep the anti-slop STRUCTURE (curated palettes × font pairings × motion presets = variety within rails), but recalibrate every rail to the corrected direction:
1. **Type:** bolder, bigger display faces capable of Kotn-scale statements over imagery. Add the founder-approved **`display-hero` cinematic tier (~6.5–7rem)** for full-bleed hero worlds, keeping ~5.25rem as standard. Display faces can be heavier/more characterful; still no Inter.
2. **Color:** warm but **braver** — palettes should support Faire-style section color-blocking (vivid plum/olive/mustard/coral-grade accents used at *ground* scale, not just tiny accents). Keep human-warm temperature; drop the timid/muted feel.
3. **Motion:** upgrade from "one quiet easing, restrained" to **cinematic + fluid**, including a signature liquid/gooey and/or 3D-depth moment (Cuberto/Lusion), while still honoring performance + reduced-motion. The world-unfold and video-dock should feel physical and cinematic.
4. **Video-forward + human-first:** every layout leads with film/photography of real people; UI frames the human, never a product grid.
5. Look at the actual screenshots in this folder before proposing. Re-derive palettes/pairings/motion from THIS set; supersede the prior `KOL-design-system.md` direction.
