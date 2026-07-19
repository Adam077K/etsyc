# KOL — Design System (Anti-Slop Rails)
*Phase 3 deliverable · session `ceo-5` · Design-Lead · 2026-07-19. Implements D9 layer 1 (constrained primitives) and the curated design rails (feature P8) from [`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md). Consumes [`KOL-reference-library.md`](../02-competitive/KOL-reference-library.md) as visual input.*

> **What this file is.** The pre-approved atomic vocabulary every maker world is built from. The AI store-drafter (S3) may only pick from the palettes, font pairings, motion presets, and token steps defined here — so it *cannot* emit ugly. Hand-built worlds emit the same tokens. One renderer (P4) consumes them. This is the first of the three anti-slop layers: constrained primitives → automated critic → human gate.
>
> **The core tension this file resolves.** Every maker world must feel *radically different* (D9 no-flattening) yet be *structurally guaranteed company-grade*. The resolution: variety comes from **which** curated set a world selects (palette × font pairing × motion preset × radius/density identity), never from freeform values. The design space is wide but every point in it is pre-vetted.

---

## 0 · Design principles (the through-line)

Five rules, inherited from the reference synthesis. Every token below serves one of them.

1. **Living print magazine.** Editorial restraint at rest (Kinfolk/Cosmos/Aesop): generous negative space, typographic confidence, photography/film treated as art. Warmth is the resting temperature — never dev-tool cool (the trap Linear/Vercel/Stripe fall into).
2. **Video always at the center.** The maker's film is the hero of every state. Type, color, and layout frame it; they never compete with it.
3. **One quiet easing.** Motion is Linear-grade: fast, purposeful, every transition earns its place. The whole product moves on a *single* signature curve so it feels like one considered hand (§4).
4. **Distinctiveness ≠ animation.** Aesop proves a whole world can be built from type + color + space with near-zero motion. Low-motion worlds must be as premium as high-motion ones. Motion is a *dial*, never a requirement.
5. **The system stretches to both poles.** From Bottega quiet-luxury restraint to Gucci saturated maximalism — the rails must reach both without any world reading as generic. If all worlds cluster, the system has failed.

**Anti-slop guardrails baked into these rails** (from `frontend-design` + `design-taste-frontend` craft skills):
- **No Inter as display.** Banned for premium/creative vibes. Display faces are characterful serifs and grotesques (§3).
- **We deliberately dodge the #1 AI cliché** — warm cream (#F4F1EA) + high-contrast serif + terracotta accent. `Atelier Chalk` is our warm-paper palette but its accent is clay-umber used *sparingly* with an olive secondary, not a terracotta field; and it is one of five moods, never the default everything lands on.
- **No AI-purple / neon glows / pure black.** Neutrals are warm-tinted, blacks are off-black, shadows are tinted to ground (§1.4).
- **Baseline dials (KOL-tuned):** `DESIGN_VARIANCE 7` (editorial masonry, asymmetric — but each world may range 4–9), `MOTION_INTENSITY 5` (fluid, disciplined; per-world 2–7), `VISUAL_DENSITY 3` (airy, gallery — the reading state).

---

## 1 · Design tokens

All tokens are CSS custom properties. A world selects a palette, a font pairing, and a motion preset; the renderer maps those onto these variable names. Spacing, radius, shadow, and the type *scale* are global (shared by all worlds); palette and font are per-world.

### 1.1 Type scale (7 roles, fluid)

A perfect-fourth-ish editorial scale with a deliberate jump to `display`. Fluid via `clamp()` so it breathes across the desktop-first canvas (D1) and degrades cleanly to mobile.

| Role | Token | `clamp(min, vw, max)` | Line-height | Tracking | Use |
|------|-------|------------------------|-------------|----------|-----|
| Display | `--fs-display` | `clamp(2.75rem, 5.5vw, 5.25rem)` | `0.95` | `-0.02em` | World hero, the one big statement |
| H1 | `--fs-h1` | `clamp(2rem, 3.6vw, 3.25rem)` | `1.02` | `-0.015em` | Section openers |
| H2 | `--fs-h2` | `clamp(1.5rem, 2.2vw, 2.125rem)` | `1.1` | `-0.01em` | Block titles |
| H3 | `--fs-h3` | `1.25rem` | `1.25` | `-0.005em` | Sub-heads, product titles |
| Body-lg | `--fs-body-lg` | `1.1875rem` (19px) | `1.6` | `0` | Editorial reading (craft-story) |
| Body | `--fs-body` | `1.0625rem` (17px) | `1.55` | `0` | Default UI + copy |
| Caption | `--fs-caption` | `0.8125rem` (13px) | `1.4` | `0.02em` | Labels, meta, eyebrows, data |

**Rules:** measure caps at `max-w-[65ch]` for body. Control hierarchy with **weight and color first, scale second** — display should not scream (anti-oversized-H1). Eyebrows/labels use `--fs-caption` uppercase with positive tracking; numeric/price/data uses the mono role (§3).

### 1.2 Spacing scale (8px grid, editorial reach)

Base unit `8px`; `4px` is the only half-step (fine typographic alignment). Editorial worlds need large steps for the Kinfolk "huge margins" feel.

```
--space-0.5: 4px    --space-1: 8px     --space-2: 16px    --space-3: 24px
--space-4: 32px     --space-5: 40px    --space-6: 48px    --space-8: 64px
--space-10: 80px    --space-12: 96px   --space-16: 128px  --space-20: 160px
```

Section vertical rhythm: `--space-16` to `--space-20` between world blocks at desktop (breathing room per Kinfolk/Aesop); collapses to `--space-8`/`--space-10` below `md`. Page container: `max-w-[1440px] mx-auto` with `--space-6` gutters (`--space-2` on mobile).

### 1.3 Radius (identity lever — per-world)

Radius is one of the cheapest, strongest identity signals. Worlds pick a **radius identity**, not per-element values.

| Identity | `--radius-sm / -md / -lg` | Character | Example world moods |
|----------|---------------------------|-----------|---------------------|
| **Sharp** | `0 / 0 / 2px` | Bottega/Vercel editorial rigor | Studio Paper, Nocturne |
| **Soft** | `6px / 12px / 20px` | Considered, warm, default | Atelier Chalk, Orchard |
| **Round** | `10px / 20px / 32px` | Airbnb friendly, approachable | Orchard (food/candles), Bazaar |

Media (video/image) corners follow the world radius; the persistent hero video uses `--radius-md` when docked, `0` when full-bleed.

### 1.4 Shadow (tinted, diffuse — never harsh)

Shadows are **tinted to the world's ground hue** (never neutral gray on warm paper) and wide/soft (diffusion, not drop). Off-black base, low alpha.

```
--shadow-subtle:  0 1px 2px   -1px  color-mix(in oklab, var(--ground) 88%, black)/6%
--shadow-card:    0 12px 28px -12px color-mix(in oklab, var(--ground) 82%, black)/12%
--shadow-raised:  0 24px 56px -20px color-mix(in oklab, var(--ground) 78%, black)/16%
--shadow-overlay: 0 40px 90px -28px color-mix(in oklab, var(--ground) 70%, black)/22%
```

**Cards are used only when elevation communicates hierarchy** (docked video, modal, product-detail sheet). Default grouping is negative space and hairline `--line` borders — no card-in-card. This keeps the resting state gallery-airy (`VISUAL_DENSITY 3`).

### 1.5 Motion tokens

See §4 for the full language. The atomic tokens:

```
--ease-kol: cubic-bezier(0.32, 0.72, 0, 1);   /* THE signature easing — one curve, whole product */
--dur-tap:     120ms   /* :active feedback, tap ripple */
--dur-state:   200ms   /* hover, focus, color/opacity state change */
--dur-enter:   320ms   /* single element entrance */
--dur-reveal:  500ms   /* scroll-triggered section reveal */
--dur-unfold:  800ms   /* the "world unfolds" transition — hard <1s budget */
--spring-video: { stiffness: 210, damping: 26, mass: 1 }  /* ONLY the physical video grow/dock/shrink */
```

---

## 2 · Curated palettes (5 world moods)

Five pre-approved palettes, each a coherent mood spanning the required range (warm-earthy → cool-gallery → dark-dramatic → fresh-botanical → saturated-maximalist). Each ships **light + dark**. The AI picks one whole palette per world — never mixes hexes across palettes (color-consistency rule). Every palette meets WCAG AA for text-on-ground and text-on-surface (verified in the QA gate, not assumed).

Token contract per palette: `--ground` (page), `--surface` (raised/card), `--ink` (primary text), `--muted` (secondary text), `--line` (hairline border), `--accent` (single interactive accent, saturation < 80%), `--accent-2` (secondary, used *tiny*).

### 2.1 `atelier-chalk` — warm, earthy, handmade
*Ceramics, textiles, wood. The resting temperature: Family/Aesop warm paper, Kinfolk restraint. Accent is clay-umber, kept off the cliché by an olive secondary and sparing use.*

| Token | Light | Dark |
|-------|-------|------|
| ground | `#F4EFE6` | `#1B1713` |
| surface | `#FBF8F1` | `#241E19` |
| ink | `#211C17` | `#F0E9DD` |
| muted | `#6B6157` | `#A79C8D` |
| line | `#E4DCCC` | `#352E27` |
| accent | `#9A6A4B` (clay) | `#C68A63` |
| accent-2 | `#6B7257` (olive) | `#8A916F` |

### 2.2 `studio-paper` — cool, minimal, gallery
*Jewelry, print, design objects. Bottega quiet luxury: near-monochrome, distinctiveness from space and type, accent barely present.*

| Token | Light | Dark |
|-------|-------|------|
| ground | `#F6F6F4` | `#101113` |
| surface | `#FFFFFF` | `#191B1D` |
| ink | `#16181A` | `#F1F1EF` |
| muted | `#6E7378` | `#8C9196` |
| line | `#E5E5E2` | `#26282B` |
| accent | `#38506B` (graphite-blue) | `#7C97B4` |
| accent-2 | `#16181A` (ink-as-accent) | `#F1F1EF` |

### 2.3 `nocturne` — dark, dramatic, premium
*Leather, metalwork, spirits, small-batch. Dark-primary (SNKRS/Nocturne drama) with a warm brass accent. Light variant is warm stone for daytime worlds.*

| Token | Dark (primary) | Light (variant) |
|-------|----------------|-----------------|
| ground | `#121110` | `#EFEAE2` |
| surface | `#1C1A18` | `#F8F4EC` |
| ink | `#EDE8E0` | `#211D18` |
| muted | `#928B80` | `#736A5E` |
| line | `#2B2824` | `#DED5C6` |
| accent | `#C9A24B` (brass) | `#9C7A2E` |
| accent-2 | `#B4553C` (ember) | `#A2492F` |

### 2.4 `orchard` — fresh, botanical, alive
*Food, candles, florals, soap, apothecary. Cool-warm green ground with a berry secondary — clearly not the earthy Atelier, clearly not a dashboard.*

| Token | Light | Dark |
|-------|-------|------|
| ground | `#F2F5EE` | `#161C15` |
| surface | `#FBFCF8` | `#1F271D` |
| ink | `#1E241C` | `#E9EFE2` |
| muted | `#5E6B58` | `#94A08B` |
| line | `#DEE5D5` | `#2C352A` |
| accent | `#4B7A46` (leaf) | `#7FA86E` |
| accent-2 | `#8E3B52` (berry) | `#C06A80` |

### 2.5 `bazaar` — saturated, ornate, maximal
*The Gucci pole. Pattern-rich textiles, art, vintage, jewelry with a loud voice. Jewel tones, three-way accent play. Proof the system reaches maximalism without slop.*

| Token | Light (warm) | Dark (jewel) |
|-------|--------------|--------------|
| ground | `#F7ECE0` | `#241028` |
| surface | `#FDF6EC` | `#31183A` |
| ink | `#2A1220` | `#F6E9D8` |
| muted | `#7A5A54` | `#C7A6B8` |
| line | `#E7D3C0` | `#43254D` |
| accent | `#C2452D` (vermilion) | `#E0623F` |
| accent-2 | `#1F6F6B` (teal) + `#D8A24A` (gold) | `#2E9A93` + `#E7B45C` |

> **Rationale (per reference).** `atelier-chalk` = "warm off-white ground per Family/Aesop"; `studio-paper` = Bottega "confident negative space, restraint over ornament"; `nocturne` = SNKRS "product-as-hero drama" without the FOMO; `orchard` = Airbnb warm-human framing applied to living/botanical craft; `bazaar` = the deliberate Gucci counter-pole so per-maker worlds "range wide without flattening" (reference-library §2). Five moods, zero overlap — the AI drafter selecting any one is guaranteed a coherent, non-generic world.

---

## 3 · Curated font pairings (4 sets)

Each pairing is display + text + mono. **No Inter.** Serif displays are permitted and encouraged (KOL is explicitly editorial/creative, the one context where serif is right). Each set names a self-hostable primary (all free / Fontshare / Google) so nothing blocks build; premium alternates noted for the ceiling. The AI picks one whole pairing per world; roles never cross pairings.

### 3.1 `editorial-warm`
*Kinfolk/Aesop editorial restraint. For `atelier-chalk`, `orchard`.*
- **Display:** `Fraunces` (variable optical serif — warm, high character at large opsz)
- **Text:** `Geist Sans` (clean grotesque body; alt: Söhne)
- **Mono:** `Geist Mono` (prices, data, meta)

### 3.2 `gallery-grotesque`
*Bottega/Vercel structural calm — sans-only, near-monochrome. For `studio-paper`.*
- **Display:** `Cabinet Grotesk` (Fontshare — tight, confident; alt: PP Neue Montreal)
- **Text:** `Satoshi` (Fontshare)
- **Mono:** `JetBrains Mono`

### 3.3 `contrast-editorial`
*High-contrast display serif for drama (SNKRS energy). For `nocturne`.*
- **Display:** `Instrument Serif` (Google — dramatic high-contrast; alt: GT Sectra / Domaine)
- **Text:** `Geist Sans`
- **Mono:** `JetBrains Mono`

### 3.4 `character-maximal`
*Loud, distinctive faces for the maximal pole. For `bazaar`.*
- **Display:** `Bricolage Grotesque` (Google — quirky, characterful; alt: Ogg / Cabinet Grotesk Bold)
- **Text:** `Satoshi`
- **Mono:** `Space Mono` (adds intentional quirk)

**Typographic craft (from `ui-typography`), enforced everywhere:** curly quotes `“ ”`, en dashes for ranges, em dashes for breaks; tabular/mono figures for all prices and data; no widows on display/H1; hanging punctuation on pull-quotes where the pairing supports it. Display faces are used **with restraint** — one or two moments per world, not on every heading.

---

## 4 · Motion language

> **One curve, whole product.** Every reveal, state change, and layout move uses `--ease-kol` (`cubic-bezier(0.32, 0.72, 0, 1)`) — a confident, gently decelerating ease-out. This single-easing discipline is what makes KOL feel like "one considered hand" (Linear's rule: motion must always be purposeful). The *only* exception is the physical video grow/dock/shrink, which uses `--spring-video` because a physical object should move with mass. Never linear easing; never a second decorative curve.

**Global rules (from `12-principles-of-animation` + performance guardrails):**
- Animate **only `transform` and `opacity`**. Never `top/left/width/height`. Corner-dock uses FLIP / shared-layout (`layoutId`), not layout-property animation.
- Everything respects `prefers-reduced-motion: reduce` → entrances become instant opacity fades (no translate), the world-unfold plays as a cross-fade, video dock snaps.
- Perpetual/infinite motion is banned in the reading state (it fights the film). Ambient motion is allowed only in `atmosphere/spacer` blocks and stays sub-threshold.

### 4.1 Duration ramp
`--dur-tap 120` (tactile `:active`, `scale-[0.98]` / `-translate-y-[1px]`) → `--dur-state 200` (hover, focus ring, color) → `--dur-enter 320` (one element in) → `--dur-reveal 500` (section scroll-reveal) → `--dur-unfold 800` (the signature moment).

### 4.2 Entrance choreography
Scroll-triggered, **once** per element. Each block reveals as a staggered wave: children `opacity 0→1` + `translateY(14px→0)`, `--dur-reveal`, `--ease-kol`, stagger **70ms**. Fires when the block crosses ~15% into viewport. Media (video/image) fades in *before* its surrounding text (film leads). Discovery feed tiles stagger-in on a Cosmos-style silky reflow, never a hard grid pop.

### 4.3 The "world unfolds" transition (signature, <1s budget)
The moment a buyer taps a grown video and the maker's world animates open *around* the still-playing film. Storyboard, total ≤ **800ms**:

```
t=0ms     Video is the shared element (layoutId="hero-video"). It KEEPS PLAYING throughout —
          it never unmounts, never pauses. It eases from center-column → its world position.
t=0–260   Ground color cross-fades from feed-neutral to the world's --ground. Feed tiles
          fade out (opacity→0, no move) so focus collapses onto the maker.
t=120–520 Blocks above/below the video rise in as staggered waves (translateY 16→0, opacity
          0→1), nearest-to-video first, 70ms stagger. Type settles after its container.
t=300–800 Atmosphere/spacer bands and secondary media resolve last (the world "breathes out").
t=800     Settled. Video playing, world scrollable. No element animates after this.
```
Reduced-motion: ground + blocks cross-fade in place over `--dur-reveal`, video snaps to position. This is the Apple scroll-choreography-around-a-persistent-hero blueprint + Active Theory unfold craft, disciplined to a strict budget (reference-library §2 north stars).

### 4.4 Video shrink / dock behavior
When the buyer clicks a product / goes deeper (state `NARRATE_SHRINK`), the leading video **shrinks to a corner** and the video engine (P6) swaps to the contextual narration clip.
- **Motion:** shared-element FLIP on `layoutId="hero-video"` with `--spring-video`. Center-column → corner in ~440ms of spring settle. The video *keeps playing* across the move (YouTube-miniplayer craft, but intentional, not a nuisance).
- **Dock target:** bottom-right, `320×180` desktop (`--radius-md`, `--shadow-raised`), min `240×135`, `--space-3` inset. Draggable to any corner; a subtle expand affordance on hover; dismiss collapses to an audio-only pill (voice keeps narrating).
- **Clip swap** happens under a 120ms cross-fade *inside* the video frame while the frame itself is mid-dock — the buyer never sees a black frame. On return to `WORLD_BROWSE` the video springs back to center (re-expand).

---

## 5 · How the rails guarantee anti-slop (D9 layer 1)

| Failure the rails prevent | Mechanism |
|---------------------------|-----------|
| Ugly / clashing color | AI picks 1 of 5 vetted palettes; cannot author raw hex |
| Generic typography (Inter everywhere) | AI picks 1 of 4 vetted pairings; Inter not in the set |
| Flat sameness across worlds | Palette × pairing × motion preset × radius identity = wide, distinct combination space |
| Illegible / low-contrast | Every palette pre-checked AA; caption/label tracking + measure fixed |
| Janky or gratuitous motion | One easing, fixed duration ramp, hard unfold budget, `transform`/`opacity` only |
| The cream+serif+terracotta cliché | Deliberately avoided; warm-paper is 1 of 5 moods with a non-terracotta accent strategy |

Layer 2 (auto-critic, P9) scores any drafted world on contrast/hierarchy/coherence and regenerates below-bar. Layer 3 (P10) is the maker's section-by-section human approval. This file is the floor the other two layers stand on.

---

*Design judgments here are Design-Lead craft decisions grounded in the reference library (HIGH confidence on reference existence; palette/pairing choices are taste calls). Palettes and pairings gate on Founder sign-off before any UI is built (per reference-library close). Hex AA-contrast values must be re-verified by QA-Lead at build, not trusted from this doc.*
</content>
</invoke>
