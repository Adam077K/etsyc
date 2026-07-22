# Wave 3 — Reference Pass (magazine feed + world unfold)

*Design-Lead · 2026-07-21. References are **vibe, never copy**. Every entry below records what I saw, what to take, and — the part that usually gets skipped — **what NOT to take**, because three of these references contain the exact anti-pattern our own spec forbids.*

---

## Method note — honest scoping

Refero, Stitch, and Pencil MCPs and web search were **not available in this session's toolset**. Per the graceful-fallback rule I did not hard-fail; I did the pass against the **founder-curated set already committed at `docs/research/references/`**, which is the authoritative source for KOL's direction anyway (founder-confirmed, `NARRATIVE.md`, 2026-07-19).

I read the screenshots directly rather than working from the existing written summary. That turned up **three corrections** to the summary, all of which are now binding in the [design direction](./KOL-wave3-design-direction.md) §2. Working from a summary of a reference is not a reference pass.

**Gap I am declaring rather than papering over:** the curated set has **no true magazine-feed reference**. The closest is Cuberto's project index (below). If someone with Refero access can pull 3–5 editorial/asymmetric feed layouts (candidates: Cosmos, Are.na, It's Nice That, Semi-Permanent, Bloomberg Businessweek digital), the B1 composition would benefit. It is not blocking — the composition is specified — but it is a real gap.

---

## Per-reference read

### Kotn — `kotn.png` · type over film

**What I saw.** Two distinct typographic registers on one page. The commerce banner ("UP TO 50% OFF") is heavy, condensed, yellow, stamped on a flat blue field. The editorial moment — **"New Arrivals"** across a full-bleed image of one woman against sea-hazed light — is **large, light-weight, wide-tracked, near-white**, floating rather than stamping. A category triptych (Womenswear / Home / Menswear) uses three images with the label centred in white, **no card chrome at all** — no border, no radius, no shadow. An impact-stat band sets "25 schools funded. 5,127 farms supported." at ~3 rem, left, image right, asymmetric, no card.

**Take.** The editorial register, not the commerce one. This is the direct source of design-direction §2.1: **`display-hero` over film is 400–500 weight, not 700–800.** Our image is always a person's face; a heavy 7 rem line competes with the human the whole product exists to introduce. Also take: labels over media with zero card chrome, and the asymmetric stat band (§8.3).

**Do NOT take.** Kotn's actual product rows are a **uniform 5-across grid of identical cells** with price, swatches, and sale badges. Kotn is a type-over-film reference. It is not a feed-layout reference and must not be cited as one.

---

### Faire — `faire.png` · colour at ground scale

**What I saw.** Full-bleed colour bands — deep plum, olive, chartreuse, coral — alternating with warm cream, each edge to edge with generous internal padding. **Every band contains a photograph of a real person, inset within the band** with ground breathing around it: the founders outside Tula House on plum; a maker seated in her studio on olive; a woman laughing on chartreuse. The band is a mat around a portrait. The type inside the bands is **quiet** — moderate-size light serif, small body copy. Pill category chips. The page closes on a large coral field with a centred, composed serif line: "The perfect / for your store, right this way."

**Take.** Two rulings came out of this. §2.2: **brave colour, composed type — never both loud at once**, or every world becomes `bazaar` by accident. §2.3: **a colour band frames a human, it is not an empty colour field with text on it** — `atmosphere` `block-ground` and `craft-story` with `blockGround` should default to carrying an inset image at 60–72 % band width. The closing coral band is the `contact-cta` `footer-strip` pattern verbatim.

**Do NOT take.** Faire's bestseller and category rows are also uniform grids with review counts and "Unlock wholesale price" chrome. Faire is a **colour-band** reference. Same caveat as Kotn.

---

### Cuberto — `cuberto.png` · the closest thing to our feed

**What I saw.** The "Featured projects" section is a **two-column asymmetric stagger on a near-black ground**: left and right columns carry different card heights and are vertically offset from each other, so **no two cards share a top edge** anywhere down the page. Cards are media-first with a small caption underneath — no titles competing with the image. Strong dark ↔ light alternation between page sections. The footer carries the signature liquid moment: a chrome/metallic goo forming "Have an idea? TELL US" over near-black.

**Take.** This is the layout DNA for **B1**. The vertical offset is the mechanism — it is what makes a two-column layout read as composed rather than tiled, and it is what design-direction §4.1 turns into a testable assertion (*no two adjacent cards share a top edge within 24 px*). Also take: media-first cards with subordinate captions, and dark↔light section alternation as a rhythm device for `cuberto-noir` worlds.

**Do NOT take.** Cuberto's cards are all the same *width* within a column. Our feed varies span (4/5/6/7 of 12) as well as height. Cuberto is two-column; at ≥ 1440 we are richer than that.

---

### Lusion — `lusion.mov` · the motion ceiling (⚠️ unviewable)

**Status: not assessed.** It is a video, git-ignored, and agents cannot watch it. `NARRATIVE.md` characterises it as cinematic WebGL, fluid spatial transitions, real 3D depth, liquid-smooth scroll.

This is why **OQ-3 is still open** (design-direction §9) and has been since 2026-07-20. The `dimensional` motion preset's signature beat cannot be implemented against a reference nobody on the build side has seen. Founder to describe the target beat in one paragraph, or approve `depth-3d` (perspective + pointer parallax on the hero product, design-system §4.5) as the default. I am flagging this as an unassessed reference rather than quietly designing around it.

---

### TikTok Shop — `shop-tiktok.png` · the anti-pattern, and the lesson people miss

**What I saw.** Uniform 5-across equal cells for the entire page length. Flash-sale countdown ("Ends in 06 : 34 : 32"), discount badges (−50 %, −54 %, −61 %), "23K sold" counters, star ratings crammed under every thumbnail, "Free shipping" chips. Zero human story anywhere.

**The lesson that matters, and it is not the obvious one.** The "Savings for you" row **is video** — five autoplaying clips with duration badges — and it is still, unmistakably, a grid. **Video does not save you from grid-ness. Layout does.**

This is the direct justification for B1's hard-gate acceptance criterion, and it is why "but the cards have film in them" is not an acceptable defence of an equal-cell layout at review. It also justifies design-direction §6.3: a wall of simultaneously-playing video *is* the TikTok register, regardless of what is in the frames.

**Banned across all five buyer surfaces as a result:** countdown chyrons, discount badges, sold-counters, star clutter adjacent to media, and any element whose job is urgency. None exist in the token set; none may be added.

---

### Complex — `complex-shop.png` · the "cleaner grid is still a grid" control

Not separately screenshotted in detail this pass; `NARRATIVE.md` records it as cleaner than TikTok Shop but "fundamentally a grid of stuff." Its value is as a control: it proves that removing the urgency chrome does **not** fix the register. Composition does. Consistent with the TikTok read above.

---

## Synthesis — what the reference set actually gives us

| Need | Reference | What we take |
|---|---|---|
| Type over a human face | **Kotn** (editorial register only) | Large, light-weight, wide-tracked, scrimmed |
| Colour at ground scale | **Faire** | Full-bleed bands that frame an inset portrait; quiet type inside them |
| Asymmetric feed composition | **Cuberto** | Vertical offset between columns; media-first, caption-subordinate |
| Motion ceiling | **Lusion** | ⚠️ unassessed — OQ-3 |
| What to reject | **TikTok Shop / Complex** | Layout makes a grid, not media type |

**The composite in one line:** *Cuberto's offset composition, carrying Kotn's light-over-film type, punctuated by Faire's portrait-framing colour bands — and never, at any breakpoint, resolving into equal cells.*
