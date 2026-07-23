# Design

> The durable visual world for KOL's own product UI (buyer-facing chrome + feed). Per concept-lock D15, this fixed system governs KOL's *own* surfaces; seller shops get full brand freedom later. Written as the direction contract before the first build edit; tokens updated after the first build settled them.

## World: "The Maker's Issue"

KOL's feed is a **living printed magazine of makers-on-film** — an editorial issue you scroll, where brave color-blocked spreads and big confident type frame real humans at work, and film is the primary medium. It is warm and human like Faire/Kotn, modern and cinematic like Cuberto/Lusion, and the deliberate antithesis of the transactional deal-grid (TikTok Shop / Complex).

**THESIS.** A curated magazine issue of shoppable humans, printed in bold color and shot on film — refuses the uniform product grid and the timid cream-craft-fair look in equal measure.

**Refuses:** uniform card grids, discount badges, urgency countdowns, rating clutter (the deal-grid); AND the spent AI default of a cream ground + high-contrast serif + terracotta accent (the timid-craft look NARRATIVE.md explicitly corrects).

## Color — strategy: Full palette, color-blocked at ground scale

> **Etsy brand skin — Founder directive, 2026-07-23 (pre-pitch).** The pitch positions KOL as a feature built into Etsy, judged by an Etsy panel, so the demo wears Etsy's palette. Only the ACCENT system is re-badged: signal → Etsy Orange, spread grounds → Etsy's Collage family (terracotta / fig / moss / denim). The espresso-ink ground and bone text system are unchanged — the dark editorial world is the product's identity. Every accent pairing is scripted-AA verified; the old→new mapping + ratios live in DECISIONS.md.

Warm-but-vivid. The dominant grounds are **deep warm ink** and **saturated color fields** (Faire's bravery), with warm bone paper as a supporting breathing tier — NOT the dominant ground. Color owns whole regions, never scattered accents.

| Role | Token | Hex | Use |
|---|---|---|---|
| Ink (primary dark ground) | `--ink` | `#1C1613` | Warm espresso-black. Cinematic film sections, footer, body text on light. |
| Bone (warm paper) | `--bone` | `#EFE6D6` | Supporting light ground + text on dark. Warmer/greyer than cream, used sparingly. |
| Bone-dim | `--bone-dim` | `#CDBFA6` | Muted labels/meta on ink (AA-checked). |
| Fig (spread ground) | `--plum` | `#4C2740` | Editorial pull-quote spreads. Etsy bubblegum/lavender family, darkened. |
| Moss (spread ground) | `--olive` | `#4E5A2A` | Craft/values spread. Etsy slime-green family, retained dark. |
| Rust (spread ground) | `--clay` | `#7C2D12` | Warm statement ground. Etsy earth family; kept well below the accent-orange value so the stat spread stays two-colour. |
| Denim (spread ground) | `--sky` | `#41628C` | Cool contrast ground. Etsy's brand blue (was Kotn pool-blue). |
| Etsy Orange (through-accent) | `--marigold` | `#F1641E` | THE signal color — active chips, links, CTA, hover underline. |
| Etsy Orange-bright | `--marigold-2` | `#FF7A3C` | Large display accent on ink + focus ring. |

**Contrast rules (WCAG AA, hard floor):** body text is always bone-on-ink (~13:1) or ink-on-bone. On color-block grounds, only large display type or bone body sit — every color pairing verified AA. Text over film/photo always sits on an ink scrim/gradient (never raw over image). Marigold is a *display/large-text and non-text-accent* color, never small body text on bone.

## Type — three voices

Loaded via `next/font/google`, self-hosted at build.

- **Bricolage Grotesque** (`--font-display`) — the loud voice. Kotn-scale statement headlines, weights 700–800. Characterful, warm-modern; chosen because Fraunces/Playfair are the spent defaults.
- **Young Serif** (`--font-serif`) — editorial warmth. Wordmark, pull-quotes, "issue" framing. Organic, chunky, off the training-default serif list.
- **Hanken Grotesk** (`--font-ui`) — the workhorse. UI, body, labels, chips. Crisp neutral, doesn't fight the display.
- **Geist Mono** (`--font-mono`) — masthead data + meta ("ISSUE 07 · 312 MAKERS ON FILM"). The magazine's colophon voice.

**Scale (fluid, clamp):** hero display ~ clamp(3rem, 8vw, 7.5rem); spread statement ~ clamp(2rem, 5vw, 4.5rem); section head ~ clamp(1.5rem, 3vw, 2.5rem); body 1rem–1.125rem; meta/mono 0.72rem tracked +0.14em uppercase.

## Layout — editorial masonry, never a grid

Asymmetric, mixed-size, breathing. A 12-col desktop field where feed items span varied widths/heights (tall film hero, wide photo, square portrait) and color-blocked full-bleed *spread interludes* break the rhythm. Generous negative space; the media is the UI (Cosmos). One spacing rhythm throughout (8px base), more space above a heading than below. Degrades: 12→2 col (tablet) → single warm column (mobile), display type scales down but stays confident.

## Motion — cinematic + physical, one orchestrated language (Framer Motion)

- Transform + opacity + filter only; never layout properties. Springs for physicality; `whileInView` once for scroll entrances, staggered children.
- **Tile hover — the "warm bloom":** film scales 1.03, saturation/brightness lift from a resting cool-grade, the maker's name inks in, a marigold underline wipes in. The signature micro-moment.
- **Signature moment — liquid ink:** an SVG gooey filter drives a morphing ink-blob divider between the hero and the feed and behind the stat spread number, plus a magnetic pull on the primary "Meet the makers" CTA. This is the Cuberto liquid/gooey beat, bounded and reduced-motion-safe.
- **Reduced motion:** `prefers-reduced-motion` disables autoplay (poster shown), large transforms, and the goo morph; opacity settles instantly. Nothing essential depends on motion.

## Media
Stock only this pass: film via `<video muted loop playsInline>` with an Unsplash poster still (graceful fallback if a clip fails); photos via `next/image` from Unsplash/Pexels. Real people making real things — warm, editorial, no stocky-corporate clichés. All maker identities are synthetic demo data, labelled in fixtures.

## Icons
Phosphor (`@phosphor-icons/react`) only, `weight="regular"` default / `"fill"` for active states. No other icon set.

## The four states
default (populated issue) · hover (warm bloom) · loading (warm skeleton masonry, shimmer in bone/ink) · empty (composed editorial "between issues" state, reachable via a craft filter with no makers).
