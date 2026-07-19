# KOL — Design System (Anti-Slop Rails) · **Direction v2**
*Phase 3 deliverable · session `ceo-5` · Design-Lead · rewritten 2026-07-19.*

> **This supersedes the first design pass.** The first pass read the brief as quiet / muted / craft-fair (Aesop/Kinfolk, small serif, timid earthy accents) and was rejected by the founder. This v2 is recalibrated to the founder-confirmed corrected direction in [`../research/references/NARRATIVE.md`](../research/references/NARRATIVE.md), derived from five curated screenshots (Faire · Kotn · Lusion · Cuberto · TikTok-Shop-as-anti-pattern). It still implements D9 layer 1 (constrained primitives) and the curated rails from [`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md), and serves the 11 blocks in [`KOL-block-catalog.md`](../04-features/KOL-block-catalog.md).

> **The corrected direction in one line.** Warm and human like Faire/Kotn, **melded** with modern, bold, and cinematic like Lusion/Cuberto: real faces lead every surface; typography makes **big, confident statements over film**; color is warm but **used bravely at ground scale** (whole sections color-block, not timid accents); motion is **cinematic, fluid, and physical** with a signature **liquid/3D moment**; the whole thing is **video-forward** — the antithesis of the dense, urgent, transactional deal-grid.

> **⚠️ SCOPE (per D15 — read first).** This design system is the **fixed identity of KOL's OWN product** — the discovery feed, nav, chrome, checkout, marketing, and the platform frame around every shop. It also serves as **starting points** (not a cap) for seller shops. **Seller shops get FULL brand freedom** (any colors/fonts/imagery): the AI derives a *coherent custom design system per shop* from the seller's brand, and anti-slop is guaranteed by the **auto-critic + maker approval**, NOT by limiting shops to these 5 palettes. So: the palettes/pairings below are **mandatory for KOL's own UI** and **optional presets for shops**. Treat the "AI may only pick from these" language below as applying to *KOL's product UI + direction-less shops*, not as a cage on a seller who brings their own brand.

> **What this file is.** The pre-approved atomic vocabulary for KOL's own product, and the starting-point library + structural/accessibility rails for shops. For shops, the load-bearing anti-slop guarantee is layer 2 (auto-critic: contrast/AA/hierarchy/coherence, auto-regen) + layer 3 (maker approval); layer 1 for shops is the block system + mandatory AA enforcement on whatever colors the seller brings, not a palette cap. One renderer (P4) consumes the tokens either way.

> **The core tension this file resolves.** Every maker world must feel *radically different* (D9 no-flattening) yet be *structurally guaranteed company-grade*. Variety comes from **which** curated set a world selects (palette × font pairing × motion preset × radius/density identity), never from freeform values. The space is wide but every point in it is pre-vetted — and now every point is **bold**, not timid.

---

## 0 · Design principles (the through-line, v2)

Five rules, re-derived from the corrected reference set. Every token below serves one of them.

1. **Human-first, film-led.** Real makers on film lead every surface. Type, color, and layout *frame the human* — they never compete with the film and they never degrade into a grid of product cards (the TikTok-Shop anti-pattern we explicitly reject). This is the warm, trust-building core from Faire/Kotn.
2. **Big, confident statements.** Typography is *bold and large* — Kotn-scale display set directly over sun-drenched human imagery. Hierarchy is loud on purpose. The one big line per world earns a dedicated cinematic tier (`display-hero`, §1.1). No timid, small, apologetic type.
3. **Brave color at ground scale.** Warmth is the resting temperature, but color is used **bravely** — whole sections color-block into vivid plum / mustard / terracotta / sky / berry grounds (Faire), not just tiny accents on paper. Every palette ships a **block-ground set** (§2) precisely so worlds can color-block sections without ever authoring raw hex.
4. **Cinematic + physical motion, one hand.** Motion is fluid, spatial, and physical (Lusion/Cuberto) — a world *unfolds* around a persistent film with real depth, video docks with mass, and each world carries **one signature liquid/3D moment**. It is still a single coherent system on one base curve, performance-safe, reduced-motion honored. Cinematic ≠ chaotic.
5. **The system stretches wide without flattening.** From `sunbaked` warm-marketplace to `bazaar` saturated-maximal to `cuberto-noir` dark-modern — the rails reach every mood while every point stays bold, human, and non-generic. If worlds cluster or read timid, the system has failed.

**Anti-slop guardrails baked into these rails** (from `frontend-design` + `design-taste-frontend` + `ui-typography` craft skills):
- **No Inter, anywhere as display.** Display faces are characterful bold grotesques and heavy optical serifs capable of Kotn-scale statements (§3).
- **We escape the #1 AI cliché** — cream + high-contrast dainty serif + timid terracotta *accent*. Where we use terracotta (`sunbaked`) it is a **bold section ground** paired with a heavy grotesque (exactly Kotn's move), never a small accent on quiet paper. It is one of five moods, never the default.
- **No AI-purple / neon glows / pure black.** Neutrals are warm-tinted, blacks are warm off-black, shadows are tinted to ground (§1.4).
- **Baseline dials (KOL v2):** `DESIGN_VARIANCE 7` (editorial + color-blocked, asymmetric — per-world 4–9), `MOTION_INTENSITY 6` (cinematic, fluid, disciplined — per-world 3–8), `VISUAL_DENSITY 4` (bold and full, not sparse — the reading state still breathes but blocks are confident, not precious).

---

## 1 · Design tokens

All tokens are CSS custom properties. A world selects a palette, a font pairing, and a motion preset; the renderer maps those onto these variable names. Spacing, radius scale, shadow, and the type *scale* are global; palette and font are per-world.

### 1.1 Type scale (8 roles, fluid — with a cinematic hero tier)

A bold editorial scale with a deliberate jump to `display`, plus a **new `display-hero` cinematic tier** (founder-approved) for full-bleed hero worlds where the maker's one line sits over film at Kotn scale. Fluid via `clamp()`; degrades cleanly to mobile.

| Role | Token | `clamp(min, vw, max)` | Line-height | Tracking | Use |
|------|-------|------------------------|-------------|----------|-----|
| **Display-hero** | `--fs-display-hero` | `clamp(3.5rem, 8vw, 7rem)` | `0.92` | `-0.03em` | **The full-bleed hero statement over film** (Kotn "New Arrivals"). One per world, max. |
| Display | `--fs-display` | `clamp(2.75rem, 5.5vw, 5.25rem)` | `0.95` | `-0.02em` | World section heroes, big statements |
| H1 | `--fs-h1` | `clamp(2rem, 3.8vw, 3.5rem)` | `1.0` | `-0.015em` | Section openers |
| H2 | `--fs-h2` | `clamp(1.5rem, 2.4vw, 2.25rem)` | `1.08` | `-0.01em` | Block titles |
| H3 | `--fs-h3` | `1.375rem` | `1.22` | `-0.005em` | Sub-heads, product titles |
| Body-lg | `--fs-body-lg` | `1.1875rem` (19px) | `1.6` | `0` | Editorial reading (craft-story) |
| Body | `--fs-body` | `1.0625rem` (17px) | `1.55` | `0` | Default UI + copy |
| Caption | `--fs-caption` | `0.8125rem` (13px) | `1.4` | `0.04em` | Labels, meta, eyebrows, data |

**Rules:**
- **`display-hero` is a statement, not decoration** — heavy weight (700–800 on grotesques, or Fraunces opsz-max), set over film with the over-media contrast treatment below. Kotn-scale confidence is the point; do not shrink it out of timidity.
- **Over-media type** (any heading set over film/photo): apply `--scrim` (§2 per-palette bottom-up gradient `transparent → ground/0.55`) OR a `text-shadow: 0 1px 40px color-mix(in oklab, black 40%, transparent)`, and set text in the palette's `--on-media` token (near-white warm or near-ink, whichever the world specifies). Contrast verified AA at build.
- Control hierarchy with **weight + scale + color together** — v2 explicitly *wants* big. Eyebrows/labels use `--fs-caption` uppercase, positive tracking. Numeric/price/data uses the mono role (§3).
- Body measure caps at `max-w-[68ch]`; no widows on `display-hero`/`display`/H1.

### 1.2 Spacing scale (8px grid, editorial reach)

Base unit `8px`; `4px` is the only half-step. Bold worlds still need large steps for full-bleed color-blocks and breathing hero sections.

```
--space-0.5: 4px    --space-1: 8px     --space-2: 16px    --space-3: 24px
--space-4: 32px     --space-5: 40px    --space-6: 48px    --space-8: 64px
--space-10: 80px    --space-12: 96px   --space-16: 128px  --space-20: 160px
```

Section vertical rhythm: `--space-16`→`--space-20` between world blocks at desktop; collapses to `--space-8`/`--space-10` below `md`. **Color-block sections** (§2 block-grounds) run full-bleed edge-to-edge (`w-screen`, no gutter) with `--space-12`→`--space-16` internal padding — the Faire move. Page container for reading content: `max-w-[1440px] mx-auto`, `--space-6` gutters (`--space-2` mobile).

### 1.3 Radius (identity lever — per-world) + pill

Radius is one of the cheapest, strongest identity signals. Worlds pick a **radius identity**, not per-element values. v2 adds a global `--radius-pill` because Faire's category chips and Cuberto's buttons are pill-shaped — a shared modern signal.

| Identity | `--radius-sm / -md / -lg` | Character | Example worlds |
|----------|---------------------------|-----------|----------------|
| **Sharp** | `0 / 0 / 2px` | Editorial rigor, gallery | `market-plum`, `cuberto-noir` (editorial variant) |
| **Soft** | `8px / 16px / 24px` | Considered, warm, default | `sunbaked`, `orchard` |
| **Round** | `12px / 24px / 36px` | Friendly, approachable, modern | `orchard` (food/candles), `bazaar`, `cuberto-noir` (playful variant) |

Global: `--radius-pill: 999px` — chips, category filters, primary CTAs (Faire/Cuberto pill). Media corners follow the world radius; the persistent hero video uses `--radius-md` docked, `0` full-bleed.

### 1.4 Shadow (tinted, diffuse — never harsh) + depth

Shadows are **tinted to the world's ground hue** and wide/soft. v2 adds `--shadow-depth` for the 3D/physical hero-product reveal (Cuberto glossy-object depth) — a taller, layered cast used *only* on the one signature 3D moment per world.

```
--shadow-subtle:  0 1px 2px   -1px  color-mix(in oklab, var(--ground) 88%, black)/6%
--shadow-card:    0 12px 28px -12px color-mix(in oklab, var(--ground) 82%, black)/12%
--shadow-raised:  0 24px 56px -20px color-mix(in oklab, var(--ground) 78%, black)/16%
--shadow-overlay: 0 40px 90px -28px color-mix(in oklab, var(--ground) 70%, black)/22%
--shadow-depth:   0 60px 120px -30px color-mix(in oklab, var(--ground) 62%, black)/28%,
                  0 8px 24px -8px    color-mix(in oklab, var(--ground) 80%, black)/14%
```

Cards are used only where elevation communicates hierarchy (docked video, modal, product-detail sheet, the signature 3D reveal). Default grouping is negative space, full-bleed color-blocks, and hairline `--line` borders — no card-in-card.

### 1.5 Motion tokens

See §4 for the full language. The atomic tokens (v2 — cinematic + physical):

```
--ease-kol:       cubic-bezier(0.32, 0.72, 0, 1);   /* THE base signature — confident decel, whole product */
--ease-cinematic: cubic-bezier(0.62, 0.02, 0.1, 1); /* deeper filmic ease for the world-unfold + hero reveals */
--dur-tap:      120ms   /* :active feedback, tap ripple */
--dur-state:    200ms   /* hover, focus, color/opacity state change */
--dur-enter:    340ms   /* single element entrance */
--dur-reveal:   520ms   /* scroll-triggered section reveal */
--dur-unfold:   900ms   /* the "world unfolds" transition — hard ≤900ms budget */
--dur-cinema:  1200ms   /* the signature 3D/liquid hero moment — hard ≤1.2s ceiling, once per world */
--spring-video:  { stiffness: 210, damping: 26, mass: 1 }   /* the physical video grow/dock/shrink */
--spring-liquid: { stiffness: 140, damping: 18, mass: 1.2 } /* the signature gooey/liquid moment (Cuberto blob) */
```

---

## 2 · Curated palettes (5 world moods — braver, color-blocking)

Five pre-approved palettes, recalibrated for the corrected direction: **warm human temperature, but brave enough to color-block whole sections.** Each ships light + dark and — new in v2 — a **block-ground set** (`--block-a/-b/-c` with matching `--on-block-*` ink) so a world can render full-bleed vivid sections (the Faire move) without authoring raw hex. The AI picks one whole palette per world; never mixes across palettes. Every value meets WCAG AA for its paired text (verified in the QA gate, not assumed).

**Token contract per palette:** `--ground` (page), `--surface` (raised/card), `--ink` (primary text), `--muted` (secondary), `--line` (hairline), `--accent` (interactive accent), `--accent-2` (secondary), `--on-media` (type set over film), plus the **block set** `--block-a/-b/-c` + `--on-block-a/-b/-c`.

### 2.1 `sunbaked` — warm, human, sun-drenched (Kotn × Faire)
*The default warm-marketplace mood: ceramics, textiles, apparel, wood. Kotn's sun-drenched human film with bold earth color-blocks. Terracotta is used **bold at ground scale** (Kotn), not as a timid accent — that's how we escape the cliché.*

| Token | Light | Dark |
|-------|-------|------|
| ground | `#F6EFE3` | `#191510` |
| surface | `#FFFBF3` | `#221D16` |
| ink | `#221C15` | `#F1EADD` |
| muted | `#6F6153` | `#A79A88` |
| line | `#E7DCC8` | `#332C23` |
| accent | `#C64A2C` (terracotta) | `#E0714E` |
| accent-2 | `#3E7E8C` (sky) | `#6FA9B4` |
| on-media | `#FBF3E8` | `#FBF3E8` |

**Block set:** `--block-a #B8452A` clay · `--block-b #5F6B33` olive · `--block-c #4C93A8` sky — each with `--on-block-* #FBF3E8` warm-cream ink.

### 2.2 `market-plum` — brave marketplace color-blocking (Faire)
*Faire's exact move: warm cream base, but whole sections block into deep plum, mustard, and soft coral. Home goods, food, gifting, multi-category makers. Serif headlines lead.*

| Token | Light | Dark |
|-------|-------|------|
| ground | `#F4EFE9` | `#1B1418` |
| surface | `#FCF8F3` | `#251B21` |
| ink | `#2A1D22` | `#F3E9E5` |
| muted | `#75655F` | `#B39EA0` |
| line | `#E6DBD0` | `#38272F` |
| accent | `#7A2E4A` (plum) | `#B85A76` |
| accent-2 | `#C6902F` (mustard) | `#DDA84E` |
| on-media | `#FBF4EC` | `#FBF4EC` |

**Block set:** `--block-a #4A2036` deep plum (`--on-block-a #F3DCE6`) · `--block-b #C6902F` mustard (`--on-block-b #2A1D0A`) · `--block-c #E88B6E` coral (`--on-block-c #3A160E`).

### 2.3 `cuberto-noir` — modern, dark↔light, 3D-forward (Cuberto/Lusion)
*The cinematic-modern mood: leather, metalwork, design objects, spirits, tech-craft. Alternating warm off-black and bright light sections, crisp bold grotesque, glossy 3D objects, a signature liquid moment. Warm off-black — never dev-tool cool, never pure black.*

| Token | Dark (primary) | Light (variant) |
|-------|----------------|-----------------|
| ground | `#111113` | `#F3F1EC` |
| surface | `#1B1C1F` | `#FCFAF5` |
| ink | `#F2F0EC` | `#16161A` |
| muted | `#9A9791` | `#6C6A66` |
| line | `#2A2B2F` | `#E4E1D9` |
| accent | `#E85C3A` (warm ember) | `#C6432A` |
| accent-2 | `#3D6CE0` (electric — 3D-object pop) | `#3157C4` |
| on-media | `#F5F3EF` | `#F5F3EF` |

**Block set:** `--block-a #0E0E10` ink-black (`--on-block-a #F2F0EC`) · `--block-b #F4F2ED` paper (`--on-block-b #16161A`) · `--block-c #3D6CE0` electric (`--on-block-c #F5F5FF`) — the dark↔light↔pop alternation is the identity.

### 2.4 `orchard` — fresh, botanical, alive (braver)
*Food, candles, florals, soap, apothecary. Cool-warm green with a bold berry and a bright chartreuse block — clearly alive, clearly not a dashboard, now confident enough to color-block.*

| Token | Light | Dark |
|-------|-------|------|
| ground | `#F1F5EC` | `#141A13` |
| surface | `#FBFCF7` | `#1D251B` |
| ink | `#1D241A` | `#E9EFE1` |
| muted | `#5E6B57` | `#93A08A` |
| line | `#DDE5D3` | `#2A3327` |
| accent | `#3F7A3E` (leaf) | `#6FA35F` |
| accent-2 | `#A83B58` (berry) | `#CE6A83` |
| on-media | `#F3F7EC` | `#F3F7EC` |

**Block set:** `--block-a #274A2A` forest (`--on-block-a #E9F2E4`) · `--block-b #8E3B52` berry (`--on-block-b #F7E4EA`) · `--block-c #C7D66A` chartreuse (`--on-block-c #26300E`).

### 2.5 `bazaar` — saturated, ornate, maximal (the loud pole)
*Pattern-rich textiles, art, vintage, statement jewelry. Jewel-tone color-blocking, three-way accent play. Proof the system reaches maximalism without slop.*

| Token | Light (warm) | Dark (jewel) |
|-------|--------------|--------------|
| ground | `#F7ECE0` | `#241028` |
| surface | `#FDF6EC` | `#31183A` |
| ink | `#2A1220` | `#F6E9D8` |
| muted | `#7A5A54` | `#C7A6B8` |
| line | `#E7D3C0` | `#43254D` |
| accent | `#C2452D` (vermilion) | `#E0623F` |
| accent-2 | `#1F6F6B` (teal) + `#D8A24A` (gold) | `#2E9A93` + `#E7B45C` |
| on-media | `#FBEFE0` | `#FBEFE0` |

**Block set:** `--block-a #7A1E3C` jewel-magenta (`--on-block-a #F9DCE6`) · `--block-b #1F6F6B` teal (`--on-block-b #EAF7F5`) · `--block-c #D8A24A` gold (`--on-block-c #2A1004`).

> **Rationale (per corrected reference).** `sunbaked` = Kotn's sun-drenched human film + bold earth blocks; `market-plum` = Faire's brave whole-section color-blocking on warm cream; `cuberto-noir` = Cuberto's dark↔light 3D-forward modernism (and the Lusion cinematic ceiling); `orchard` = living/botanical craft, now brave enough to block color; `bazaar` = the deliberate maximal counter-pole so per-maker worlds range wide without flattening. Five moods, zero overlap, **every one bold** — the AI drafter selecting any is guaranteed a coherent, non-generic, non-timid world.

---

## 3 · Curated font pairings (4 sets — bolder, bigger, characterful)

Each pairing is display + text + mono. **No Inter.** Displays are now **bold grotesques and heavy optical serifs** chosen for their ability to make Kotn-scale statements over film — the timid small-serif approach of the first pass is gone. Each names a self-hostable primary (free / Fontshare / Google) so nothing blocks build; premium alternates note the ceiling. The AI picks one whole pairing per world; roles never cross pairings.

### 3.1 `statement-grotesk`
*Kotn energy — big, bold, confident sans statements over human film. For `sunbaked`, `orchard`.*
- **Display:** `Clash Display` (Fontshare — bold, characterful grotesque; heavy weights carry `display-hero`; alt: PP Neue Machina)
- **Text:** `General Sans` (Fontshare — clean, warm-neutral body; alt: Söhne)
- **Mono:** `Geist Mono` (prices, data, meta)

### 3.2 `warm-serif`
*Faire warmth — heavy optical serif used **big** for marketplace headlines over color-blocks. For `market-plum`.*
- **Display:** `Fraunces` (variable optical serif — set at high opsz + 600–700 weight for Faire-scale statements, not the timid small serif of v1; alt: GT Sectra)
- **Text:** `Satoshi` (Fontshare)
- **Mono:** `Geist Mono`

### 3.3 `modern-mono-grotesk`
*Cuberto polish — crisp, tight, modern; pairs with dark↔light and 3D objects. For `cuberto-noir`.*
- **Display:** `Cabinet Grotesk` (Fontshare — tight bold; alt: PP Neue Montreal / Neue Haas Grotesk)
- **Text:** `Satoshi` (Fontshare)
- **Mono:** `JetBrains Mono`

### 3.4 `character-maximal`
*Loud, distinctive faces for the maximal pole. For `bazaar`.*
- **Display:** `Bricolage Grotesque` (Google — quirky, characterful, heavy; alt: Ogg / Cabinet Grotesk Bold)
- **Text:** `Satoshi`
- **Mono:** `Space Mono` (intentional quirk)

**Typographic craft (from `ui-typography`), enforced everywhere:** curly quotes `“ ”`, en dashes for ranges, em dashes for breaks; tabular/mono figures for all prices and data; no widows on `display-hero`/display/H1; hanging punctuation on pull-quotes where the pairing supports it. Display faces now carry **the one or two big statements per world** (the hero line, a section opener) — bold and large — while everything else stays in the text face. Big ≠ everywhere: restraint is in *how many* display moments, not in their *size*.

---

## 4 · Motion language (v2 — cinematic, fluid, physical)

> **One base curve, one cinematic curve, physical springs.** Everyday reveals, state changes, and layout moves ride `--ease-kol` (`cubic-bezier(0.32, 0.72, 0, 1)`) so the product feels like one considered hand. The **world-unfold and hero reveals** ride `--ease-cinematic` for a deeper, filmic settle. Physical objects (the video, the signature liquid moment) move on springs with mass. This is disciplined cinema — not a second decorative curve per element.

**Global rules (from `12-principles-of-animation` + performance guardrails):**
- Animate **only `transform` and `opacity`** (plus `filter` on the *single* signature liquid moment, GPU-composited, see §4.5). Never `top/left/width/height`. Corner-dock uses FLIP / shared-layout (`layoutId`), not layout-property animation.
- Everything respects `prefers-reduced-motion: reduce` → entrances become instant opacity fades (no translate, no parallax, no depth); the world-unfold plays as a cross-fade; the liquid/3D signature moment renders to its static end-state; video dock snaps.
- Perpetual/infinite motion is banned in the reading state (it fights the film). Ambient motion is allowed only in `atmosphere/spacer` blocks and stays sub-threshold.

### 4.1 Duration ramp
`--dur-tap 120` (tactile `:active`, `scale-[0.98]` / `-translate-y-[1px]`) → `--dur-state 200` (hover, focus ring, color) → `--dur-enter 340` (one element in) → `--dur-reveal 520` (section scroll-reveal) → `--dur-unfold 900` (world unfolds) → `--dur-cinema 1200` (the signature 3D/liquid moment, once per world).

### 4.2 Entrance choreography
Scroll-triggered, **once** per element. Each block reveals as a staggered wave: children `opacity 0→1` + `translateY(16px→0)`, `--dur-reveal`, `--ease-kol`, stagger **70ms**, fired when the block crosses ~15% into viewport. **Media leads text** (film/photo fades in *before* its surrounding copy). Color-block sections wash their `--block-*` ground in first, then the type settles over it. Discovery-feed tiles stagger-in on a silky reflow, never a hard grid pop.

### 4.3 The "world unfolds" transition (signature, ≤900ms)
The moment a buyer taps a grown video and the maker's world animates open *around* the still-playing film. Now **cinematic and physical** — a slight z-depth/parallax so the world feels like it unfolds in space (Lusion), not a flat fade. Storyboard, total ≤ **900ms**, on `--ease-cinematic`:

```
t=0ms      Video is the shared element (layoutId="hero-video"). It KEEPS PLAYING throughout —
           never unmounts, never pauses. Eases center-column → world position.
t=0–280    Ground/color-block cross-fades from feed-neutral to the world's --ground; the first
           color-block section washes in behind the film. Feed tiles fade out (opacity→0).
t=140–620  Blocks above/below rise in as staggered waves (translateY 18→0, opacity 0→1) with a
           subtle parallax-depth offset (nearer blocks travel slightly more), nearest-to-video
           first, 70ms stagger. Type settles after its container.
t=340–900  Atmosphere/spacer bands + secondary media resolve last (the world "breathes out").
t=900      Settled. Video playing, world scrollable. Nothing animates after this.
```
Reduced-motion: ground + blocks cross-fade in place over `--dur-reveal`, no parallax/depth, video snaps. Apple scroll-choreography-around-a-persistent-hero blueprint + Lusion spatial unfold, disciplined to a strict budget.

### 4.4 Video shrink / dock behavior (physical)
When the buyer clicks a product / goes deeper (`NARRATE_SHRINK`), the leading video **shrinks to a corner** and the video engine (P6) swaps to the contextual narration clip.
- **Motion:** shared-element FLIP on `layoutId="hero-video"` with `--spring-video`. Center-column → corner in ~440ms of spring settle; the video *keeps playing* across the move (intentional mini-player craft).
- **Dock target:** bottom-right `320×180` desktop (`--radius-md`, `--shadow-raised`), min `240×135`, `--space-3` inset. Draggable to any corner; subtle expand affordance on hover; dismiss collapses to an audio-only pill (voice keeps narrating).
- **Clip swap** under a 120ms cross-fade *inside* the frame while it's mid-dock — no black frame ever. On return to `WORLD_BROWSE` the video springs back to center.

### 4.5 The signature liquid / 3D moment (one per world — new in v2)
Every world carries **exactly one** memorable cinematic beat (Cuberto's gooey "TELL US" blob / Lusion's 3D presence). It is opt-in per world via the motion preset, never on every block, and is the world's most expressive gesture:
- **`liquid`** — an SVG goo/metaball filter (`feGaussianBlur` + `feColorMatrix` alpha-threshold) on the primary CTA or the world-unfold mask, driven by `--spring-liquid`. The blob merges/separates on hover/scroll. Filter runs on an isolated, GPU-composited layer; capped at one element; static end-state under reduced-motion.
- **`depth-3d`** — the one hero product (or the hero-video frame) reveals with real perspective: `perspective: 1200px` + `rotateX/Y` parallax tied to pointer/scroll, `--shadow-depth`, `--dur-cinema`, `--ease-cinematic`. For `depth-3d` worlds a GLB may render in a lazy-loaded `<model-viewer>`/R3F island (product-detail `3d-viewer`); everywhere else it is a CSS-transform illusion (no WebGL cost).
- **Budget:** one signature per world, `--dur-cinema` ceiling ≤1.2s, `transform`/`opacity`/`filter` only, fully static under reduced-motion. If a world's maker is low-motion, the preset is `none` — the world stays premium on type + color + film alone (motion is a dial, never a requirement).

**Motion presets (the AI picks one per world):** `hushed` (reveals only, no signature — dial 3) · `fluid` (reveals + cinematic unfold, no signature beat — dial 5, default) · `liquid` (fluid + the `liquid` signature — dial 7) · `dimensional` (fluid + the `depth-3d` signature — dial 8).

---

## 5 · How the rails guarantee anti-slop (D9 layer 1)

| Failure the rails prevent | Mechanism |
|---------------------------|-----------|
| Ugly / clashing color | AI picks 1 of 5 vetted palettes incl. their block-ground sets; cannot author raw hex |
| Timid / muted / craft-fair feel (the v1 rejection) | Every palette carries **bold block-grounds**; type scale has a `display-hero` tier; dials baseline at VARIANCE 7 / MOTION 6 / DENSITY 4 — the system defaults bold |
| Generic typography (Inter everywhere) | AI picks 1 of 4 vetted pairings, all bold display faces; Inter not in the set |
| Flat sameness across worlds | Palette × pairing × motion preset × radius identity × which block-grounds = wide, distinct, bold combination space |
| Illegible / low-contrast (incl. type-over-film) | Every palette + `--on-media`/`--on-block-*` pre-checked AA; over-media scrim mandatory; caption tracking + measure fixed |
| Janky or gratuitous motion | One base curve + one cinematic curve, fixed ramp, hard unfold/cinema budgets, one signature per world, `transform`/`opacity`/`filter` only, reduced-motion honored |
| The cream+dainty-serif+timid-terracotta cliché | Terracotta only appears as a **bold ground** (Kotn) paired with a heavy grotesque; warm-paper is 1 of 5 moods |
| Devolving into a transactional product grid | Blocks are film-led and human-first by spec (block catalog); `product-showcase` bans the generic 3-column card row; no urgency/deal chrome exists in the token set |

Layer 2 (auto-critic, P9) scores any drafted world on contrast/hierarchy/coherence **and boldness** (flags timid/muted output for regen). Layer 3 (P10) is the maker's section-by-section human approval. This file is the floor the other two layers stand on.

---

*Design judgments here are Design-Lead craft decisions grounded in the corrected reference narrative (`references/NARRATIVE.md`, founder-confirmed). Palette/pairing/motion choices are taste calls gating on Founder sign-off before any UI is built. Hex AA-contrast values — especially type-over-film (`--on-media`) and type-on-block-ground (`--on-block-*`) — must be re-verified by QA-Lead at build, not trusted from this doc. This v2 supersedes the first pass in full.*
