# KOL — Reference & Inspiration Library
*Phase 1 deliverable · session `ceo-5` · Research-Lead · 2026-07-19. Consumes [`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md) and [`KOL-MVP-master-plan.md`](../03-system-design/KOL-MVP-master-plan.md) as ground truth.*

> **How to use this file.** These are VIBE references, not things to copy. Every KOL screen and section (Phase 2/3) should be built against the relevant cluster below. For each reference: what to STEAL is specific and actionable; what to AVOID is the trap that would make KOL generic, cluttered, or transactional. Confidence on the *existence/URL* of every reference is HIGH (all are well-known live products); the "what to steal" annotations are craft judgments, not sourced facts.

**KOL in one line:** a desktop-first, video-native marketplace — buyers scroll a magazine-style feed of real makers on film, tap → the video grows, tap again → the maker's personalized branded *world* unfolds around the still-playing video → meet the human, buy from them. Makers build their world via an AI co-creation interview.

**The five surface clusters:**
1. Feed / discovery (magazine, mixed-media, reshuffling)
2. Immersive brand worlds / storytelling (the "world unfolds")
3. Video commerce (video-led buying, persistent player)
4. Craft / motion / editorial polish
5. Creator / store builders (seller-side co-creation & per-maker theming)

---

## 1 · Feed / Discovery
*Informs: the KOL discovery feed — magazine layout, mixed-size videos + images, reshuffles on refresh, different people each visit. Never a uniform grid.*

### Cosmos — https://www.cosmos.so
- **STEAL:** The definitive "editorial magazine, not a grid" feel. Asymmetric masonry with varied aspect ratios sitting side by side; generous negative space so each item breathes; ultra-minimal chrome (no visible cards/borders — the media *is* the UI). Silky column re-flow. This is the closest existing product to the emotional target of KOL's feed.
- **AVOID:** Cosmos is near-chromeless and moody to the point of being inscrutable to newcomers — KOL needs enough affordance (a maker name, a subtle hover state) that a first-time buyer understands these are shoppable humans.

### Are.na — https://www.are.na
- **STEAL:** Restrained, text-forward editorial grid; the discipline of "blocks" (image/video/text) as a unified content primitive that mixes freely — maps directly to KOL's mixed-media feed. Typographic calm; content-first hierarchy.
- **AVOID:** Utilitarian/austere, almost anti-commercial — no warmth or motion. KOL must add human warmth (faces, film, color) on top of this structural calm.

### Pinterest — https://www.pinterest.com
- **STEAL:** The reference implementation of a **masonry waterfall** at scale: variable-height tiles, gapless columns, infinite scroll, hover-to-preview (video autoplays muted on hover). Reshuffle-on-refresh behavior is native here. Save/collect affordance appearing on hover.
- **AVOID:** Ad density, tile sameness (everything becomes a uniform pin), and clickbait cropping. KOL's tiles are *people and their craft*, not thumbnails — resist the race-to-the-bottom crop.

### Behance — https://www.behance.net
- **STEAL:** Curated-gallery feel with large, high-quality hero media; project cards that feel like portfolio pieces; hover reveals title + author cleanly. Good model for "these are proud creators" framing.
- **AVOID:** Rigid uniform card grid and heavy metadata chrome (likes/views badges) — too portfolio-CV, not editorial-magazine. KOL wants mixed sizes, not equal cards.

### TikTok (For You feed) — https://www.tiktok.com
- **STEAL:** Video-native discovery gold standard: instant autoplay, zero-friction scroll between clips, algorithmic "different every visit," the feeling that content finds *you*. The vertical-swipe-to-next-video mechanic is a candidate for KOL's "tap a video → grows → scroll through other videos" step.
- **AVOID:** Full-bleed single-video-at-a-time is the opposite of KOL's magazine layout at the *discovery* stage; TikTok's frantic pace and sound-on default clash with KOL's calmer, trust-building tone. Steal the engine feel, not the layout.

### Instagram Reels / Explore — https://www.instagram.com/explore
- **STEAL:** The **Explore** grid's trick of breaking a uniform grid with occasional 2×-tall video tiles and mixed media — a lightweight way to get "magazine" energy from a mostly-regular system. Muted autoplay on the tall tiles.
- **AVOID:** Everything-is-square default; algorithmic homogeneity. KOL's mixed sizes should be *editorially* motivated (a hero maker gets a big tile), not random.

### Kinfolk — https://www.kinfolk.com
- **STEAL:** Print-magazine restraint translated to web: large serif display type, huge margins, slow deliberate pacing, muted natural palette, photography treated as art. This is the *tone* KOL wants — considered, warm, human, premium.
- **AVOID:** Editorial sites are read, not shopped — near-zero interaction and slow load. Borrow the typographic/photographic restraint, not the static pacing.

### Dwell — https://www.dwell.com
- **STEAL:** Editorial feed that mixes feature-sized hero stories with smaller entries in one scroll; strong image-led storytelling with tasteful captions; a "curated issue" feeling.
- **AVOID:** News-site density and ad units. KOL's feed is a gallery of people, not an article index.

**North stars (top 3):**
1. **Cosmos** — the exact emotional + structural target: editorial masonry that feels like a living magazine.
2. **Pinterest** — the proven mechanics (masonry, hover-preview video, reshuffle, infinite scroll) to build on.
3. **Kinfolk** — the tone floor: premium, warm, print-grade restraint that keeps KOL from feeling like a content farm.

---

## 2 · Immersive Brand Worlds / Storytelling
*Informs: the "world unfolds" moment — tapping a maker grows the video, then their whole branded world (products, story, color, type, atmosphere) animates in around the still-playing video. Every world must feel genuinely different.*

### Apple product pages — https://www.apple.com/airpods-pro/
- **STEAL:** The reference for **scroll-choreographed storytelling around a persistent hero element**: media pins/scales while copy and product details reveal in sequence; scroll-linked (not time-linked) animation so the user controls pace; immaculate restraint — one idea per viewport. This is structurally the closest to KOL's "world unfolds around the still-playing video."
- **AVOID:** Apple's single-product monolithic narrative and identical template across products — KOL needs *per-maker* distinctiveness, the opposite of one house style. Steal the choreography, not the sameness.

### Aesop — https://www.aesop.com
- **STEAL:** How atmosphere is built from **type + color + spacing alone** (almost no motion): literary long-form product copy, muted apothecary palette, generous margins — a whole "world" with minimal effects. A vital lesson: distinctiveness ≠ animation. Great model for lower-motion maker worlds.
- **AVOID:** Deliberately slow and text-heavy; can feel precious. KOL still has to sell — keep products reachable.

### Bottega Veneta — https://www.bottegaveneta.com
- **STEAL:** Confident negative space, oversized imagery, and a distinctive art-directed grid that signals luxury through restraint and scale rather than ornament. Good "quiet luxury" atmosphere reference for premium makers.
- **AVOID:** Fashion-house minimalism can be cold and hard to navigate; product discovery is often sacrificed for mood. KOL must keep warmth + shoppability.

### Gucci — https://www.gucci.com
- **STEAL:** The *opposite* pole from Bottega — maximalist, saturated, editorial, pattern-rich. Proof that a "world" can be loud and ornate and still premium. Essential to have both poles in the reference set so KOL's per-maker worlds can range wide without flattening.
- **AVOID:** Heaviness/slow load; ornament that buries the product. Use as evidence the system must *stretch* to maximalism, not as a literal template.

### Nike SNKRS — https://www.nike.com/launch
- **STEAL:** Product-as-hero drama: full-bleed product imagery, story-driven launch pages, anticipation/energy through motion and bold type. Good for makers whose story is about the drop/the object.
- **AVOID:** Hype/FOMO mechanics and countdowns — anti-relationship. KOL trades on trust and human connection, not scarcity urgency.

### Airbnb — https://www.airbnb.design and https://news.airbnb.com/2026-summer-release/
- **STEAL:** Warm, human, story-forward brand system; how Airbnb frames *people and places* (hosts, homes) — a strong analog for KOL framing *makers and their craft*. Rounded, friendly, trustworthy visual language; excellent illustration + photography balance.
- **AVOID:** Consumer-app uniformity — Airbnb is intentionally one consistent system. KOL needs per-maker variation on top of a trustworthy base.

### Active Theory — https://activetheory.net
- **STEAL:** Best-in-class WebGL/immersive transitions, spatial navigation, and the craft of things "unfolding" and moving in 3D space — direct inspiration for the *transition animation* when a maker's world opens around the video.
- **AVOID:** Experimental sites prioritize wow over usability, load heavy, and can be disorienting. Take the transition craft; keep KOL fast and legible.

### Awwwards — Sites of the Day — https://www.awwwards.com/websites/
- **STEAL:** A living, curated feed of the current bar for immersive/scrollytelling craft — use as an ongoing scouting source for per-maker world treatments and transition ideas.
- **AVOID:** Award-site trends chase novelty; many are unusable or slow. Filter hard for legibility + performance.

**North stars (top 3):**
1. **Apple product pages** — the scroll-choreography-around-a-persistent-hero blueprint, executed flawlessly.
2. **Aesop** — proof that a distinct world can be built with type/color/space and near-zero motion (anti-slop, low-risk maker worlds).
3. **Active Theory** — the transition/"unfold" motion craft for the signature moment (steal the craft, throttle the excess).

---

## 3 · Video Commerce
*Informs: the persistent video player — the leading video keeps playing as the buyer scrolls the store; on product click it shrinks to a corner and a contextual clip narrates. Meet-the-human-and-buy.*

### TikTok Shop — https://shop.tiktok.com
- **STEAL:** Product cards and buy CTAs overlaid on/beside playing video without stopping playback; the pinned "yellow basket" product anchor; seamless watch→product-detail→checkout while the creator keeps talking. The core proof that video and buying coexist on one surface.
- **AVOID:** Cluttered overlays, aggressive urgency ("selling fast!"), and creator-as-hawker energy. KOL is shopkeeper-relationship, not flash-sale.

### Whatnot — https://www.whatnot.com
- **STEAL:** Live-selling layout where the video holds primary real estate and the product/queue sits in a persistent side rail; clear "what am I looking at right now" context tying the current item to the stream. Community/trust cues (seller rating, presence).
- **AVOID:** Auction-driven FOMO, chat chaos, and countdown pressure. KOL keeps the calm, curated, one-maker focus — no bidding war energy.

### ShopShops — https://www.shopshops.com
- **STEAL:** Host-guided, in-store "come shopping with me" framing — a real person walking you through goods on video. This is the closest emotional analog to KOL's shopkeeper narration; steal the intimacy and the "she's showing me this specific thing" moment.
- **AVOID:** Livestream-only dependency and scheduling friction. KOL's narration is on-demand (pre-shot clips selected by the video engine), not live.

### YouTube miniplayer / picture-in-picture — https://www.youtube.com
- **STEAL:** The canonical **shrink-to-corner persistent player**: smooth dock animation, video keeps playing while you browse below, tap to re-expand, drag/dismiss affordances. Direct pattern reference for KOL's "video shrinks to a corner when you click a product."
- **AVOID:** The miniplayer can feel like an afterthought/nuisance overlay. In KOL the corner video is a *feature* (contextual narration), so design it as intentional and inviting, not a dismissible nag.

### Amazon Live — https://www.amazon.com/live
- **STEAL:** Carousel of shoppable products docked beneath a playing stream with "featured now" highlighting the item currently discussed — a clean model for syncing the product rail to what the video is talking about.
- **AVOID:** QVC/home-shopping aesthetic and banner clutter. Steal the video↔product sync mechanic, drop the shopping-channel look.

### Instagram video shopping / product tags — https://about.instagram.com/shopping
- **STEAL:** Tappable product tags anchored onto video frames; tapping surfaces a lightweight product sheet without leaving the video — a subtle way to make video directly shoppable.
- **AVOID:** Tag clutter obscuring the content. Keep tags sparse and elegant; the film comes first.

**North stars (top 3):**
1. **YouTube miniplayer** — the exact shrink-to-corner persistent-player mechanic KOL needs, proven and familiar.
2. **ShopShops** — the emotional target: a real person guiding you through their goods (KOL's shopkeeper narration, on-demand instead of live).
3. **TikTok Shop** — the proof that overlaid product/CTA + uninterrupted playback works at scale (take the mechanic, drop the urgency).

---

## 4 · Craft / Motion / Editorial Polish
*Informs: motion language, micro-interactions, type systems, and editorial storytelling across all KOL surfaces. The "company-grade, never slop" bar.*

### Linear — https://linear.app
- **STEAL:** The bar for **restrained, purposeful motion**: fast (~150–250ms), snappy easing, every transition earns its place; keyboard-grade responsiveness; immaculate spacing and a tight, legible type scale; subtle depth via layered shadows and hairline borders. The definition of "considered."
- **AVOID:** Cool, monochrome, dev-tool temperature. KOL is warm and human — borrow Linear's *discipline*, not its palette.

### Stripe — https://stripe.com
- **STEAL:** Best-in-class scroll-linked reveals, the famous animated gradient, and crisp typographic hierarchy that makes dense information feel effortless; interactive diagrams; flawless responsive behavior. Gold standard for "premium product marketing."
- **AVOID:** Enterprise-SaaS gloss can read corporate/cold. Keep KOL's storytelling human-scale, not B2B-slick.

### Vercel — https://vercel.com
- **STEAL:** High-contrast, confident black-and-white editorial layout; sharp geometric type; tasteful use of motion and gradient accents; strong sense of "shipping-grade" craft in every detail.
- **AVOID:** Dark-mode dev aesthetic and stark minimalism — again, temperature. Use for structural rigor, not mood.

### Family (app) — https://family.co
- **STEAL:** Signature **micro-interaction and motion choreography** — playful, physics-y, delightful spring animations; the marketing site itself is a motion showcase. Best reference for the small moments (tap feedback, element entrances, elastic transitions) that make KOL feel alive and crafted.
- **AVOID:** Motion-as-personality can tip into gimmick if over-applied; Family is a crypto-wallet vibe. Take the *craft of the springs*, apply sparingly to KOL's key moments.

### NYT immersive features (e.g. "Snow Fall") — https://www.nytimes.com/projects/2012/snow-fall/
- **STEAL:** The origin of **scrollytelling**: full-bleed media that transitions as you scroll, text woven through imagery/video, chaptered narrative pacing. Direct model for how a maker's *story* section unfolds within their world.
- **AVOID:** These are one-off bespoke productions — expensive, heavy, non-systematized. KOL needs this feel from a *reusable block system*, so extract patterns, not the bespoke build.

### Bloomberg Graphics — https://www.bloomberg.com/graphics/
- **STEAL:** Editorial data/visual storytelling with confident type, strong color discipline, and scroll-driven reveals that stay legible and fast. Proof that immersive can also be *performant and clear*.
- **AVOID:** Newsroom density and chart-heaviness — not relevant to KOL's product context. Take the pacing/legibility discipline.

### Igloo Inc / Awwwards motion picks — https://www.awwwards.com/websites/animation/
- **STEAL:** Current-bar reference for scroll and transition motion; use as an ongoing scouting feed for easing/choreography ideas.
- **AVOID:** Novelty-chasing and performance cost — filter for things that could survive in a real product.

**North stars (top 3):**
1. **Linear** — the discipline standard: motion that is fast, purposeful, and never decorative (the anti-slop attitude).
2. **Family** — the micro-interaction/spring craft that gives KOL its alive, hand-made-feeling moments.
3. **NYT "Snow Fall"** — the scrollytelling blueprint for how a maker's story unfolds inside their world.

---

## 5 · Creator / Store Builders (Seller-Side)
*Informs: seller onboarding, the AI-draft co-edit editor, the block/section library, and per-maker theming. Makers co-edit a JSON-config store; output must be radically different per maker yet always company-grade (constrained blocks + curated palettes = anti-slop rails).*

### Cargo — https://cargo.site
- **STEAL:** Proof that a *constrained* template system still produces radically distinctive, designer-grade sites — exactly KOL's anti-slop thesis (curated primitives → variety without slop). Strong art-directed defaults; typography and layout ranges that always look intentional.
- **AVOID:** Cargo still assumes design literacy and can expose too many knobs. KOL's maker is a non-designer guided by AI — hide complexity behind the co-creation interview.

### Squarespace — https://www.squarespace.com
- **STEAL:** The **section/block editing model** done for non-designers: add/reorder/swap pre-designed sections; global style/token controls (fonts, colors, spacing) that restyle the whole site coherently; live preview; "it always looks decent." The clearest reference for KOL's block-swap co-edit UX.
- **AVOID:** Template sameness (Squarespace sites are recognizable) and choice overload in the panel. KOL must guarantee *difference* per maker, and let AI make most choices so the maker mostly approves/tweaks.

### Universe — https://onuniverse.com
- **STEAL:** Grid/block building simplified to near-effortless for non-designers; mobile-first block manipulation; the feeling that anyone can assemble something that looks composed. Good model for a low-cognitive-load co-edit surface.
- **AVOID:** Can produce toy-like/samey output; limited range. KOL needs premium ceiling + real per-maker range, so pair simplicity with the curated high-craft block library.

### Framer — https://www.framer.com
- **STEAL:** The high-craft ceiling: sophisticated motion, breakpoints, and component/variant thinking in a visual editor; excellent live-preview and design-token handling; AI-assisted layout generation. Reference for how far the *editor's quality ceiling* can go.
- **AVOID:** Full creative freedom = complexity and the ability to make ugly things. KOL deliberately trades Framer's infinite canvas for constrained blocks — use Framer for the token/preview craft, not the freedom model.

### Shopify (theme editor / sections) — https://www.shopify.com
- **STEAL:** The commerce-specific section editor: drag-reorder sections, per-section settings, theme-level tokens, and a real-time preview tied to actual products/inventory — directly analogous to KOL's store editor with real product blocks.
- **AVOID:** Theme-marketplace sameness and settings sprawl. KOL's AI should pre-configure sections so the maker edits *content and voice*, not fiddly settings.

### Typedream / Softr / AI site builders — https://typedream.com
- **STEAL:** Emerging **AI-first onboarding**: describe your thing → get a drafted site → refine. Maps to KOL's "AI interview → drafts JSON store → co-edit." Reference for the draft-then-refine loop and the confidence-building first draft.
- **AVOID:** Generic AI output/slop and thin templates — the exact failure KOL's constrained-primitives + design-critic system exists to prevent. Use as a cautionary baseline for the quality floor to beat.

**North stars (top 3):**
1. **Squarespace** — the block/section swap + global-token model KOL's co-edit editor should feel like, built for non-designers.
2. **Cargo** — the existence proof for KOL's core thesis: constrained primitives yield distinctive, non-slop results.
3. **Framer** — the craft ceiling for live preview, tokens, and motion the editor can aspire to (borrow the polish, keep the guardrails).

---

## Synthesized visual direction for KOL

KOL should feel like a **living print magazine that breathes and plays** — the editorial restraint, warmth, and typographic confidence of Kinfolk/Cosmos as the resting state, layered over TikTok-grade video-nativeness and Pinterest-proven masonry mechanics for discovery. Its signature "world unfolds" moment borrows Apple's scroll-choreography-around-a-persistent-hero and Active Theory's transition craft, but is disciplined by Linear's rule that motion must always be purposeful and Aesop's proof that a distinct world can be built from type, color, and space alone (so low-motion maker worlds are still premium, never slop). Video behaves like YouTube's miniplayer — a persistent, intentional corner narrator (the ShopShops "she's showing me this" intimacy), never the urgency of a shopping channel. On the seller side, the editor feels like Squarespace's block-swap simplicity with Cargo's distinctiveness ceiling and Framer's live-preview polish, all riding on constrained primitives + curated palettes so every maker's world is unmistakably *theirs* yet structurally guaranteed company-grade. The through-line across all five surfaces: **warm, human, considered, and quietly premium — every pixel intentional, motion earned, and the real maker always at the center of the frame.**

---

## ★ Strategic findings (decision-grade)
1. **The contextual-clip-SWAP is genuinely novel.** No competitor ships KOL's core mechanic — a maker's video that *changes to a contextual narration clip* when the buyer clicks a specific product. The closest precedents are Bambuser (a persistent miniplayer that follows the shopper) and Instagram Reels (moment-tagged product surfacing), but the clip *swapping to the right narration on click* appears to be new. Treat it as KOL's signature moat and protect it. *(Can't-prove-a-negative — flagged UNKNOWN, but nothing surfaced doing it.)*
2. **The persistent-video-through-the-store model is proven to convert.** Bambuser's Kappahl PDP miniplayer rollout reported **+136% video-assisted sales and +30% AOV** — direct evidence the "video keeps playing as I move through the store" mechanic drives revenue, not just delight. Ref: [Bambuser shoppable video examples](https://bambuser.com/article/shoppable-video-examples).
3. **Desktop-first video-commerce is an open lane.** Almost all shoppable/live video commerce is mobile-vertical-first; purpose-built *desktop-first* commerce-video UX barely exists. KOL's desktop-first bet (D1) is contrarian but uncontested.
4. **Hard tone line: relationship, never shopping-channel.** Every video-commerce reference (TikTok Shop, Whatnot, QVC/HSN) trends toward urgency/FOMO/countdown. KOL must reject all of it — the maker's video is a studio visit, sound-OFF until opt-in, no scarcity chyrons.

---

*Craft judgments in "what to steal / avoid" are Research-Lead + researcher design analysis, not sourced empirical claims. All reference URLs are live, well-known products (HIGH confidence on existence). This library feeds Phase 2 (Feature Map) and gates Phase 3 (Design System) — Design-Lead + Founder sign off on the visual direction before any UI is built.*
