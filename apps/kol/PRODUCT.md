# Product

<!-- impeccable:product-schema 1 -->

> Provenance: written from the founder-directed rebuild brief (`docs/08-agents_work/handoffs/2026-07-22-KOL-rebuild-LAUNCH-PROMPT.md`) and the locked concept (`docs/01-foundation/KOL-v2-concept-lock.md`). No live interview mechanism was available to this build agent, so product truth is **inferred from the explicit written brief**; every field below is founder-sourced from those documents, not invented. Facts marked (assumed) are the agent's labelled inferences.

## Platform

web

## Users
- **Primary — Buyers (Gen-Z + millennial gift/craft shoppers).** Arriving on desktop, browsing with intent to *discover* rather than search for a known SKU. They want to feel a human connection before they buy; they are allergic to the transactional deal-grid (TikTok Shop / Amazon) they already know.
- **Secondary — Indie makers / small-batch sellers.** Real humans who make real things (ceramics, textiles, woodwork, leather, glass, print, food). The feed is where their story reaches a buyer; they are the subject of every frame, never a faceless brand.

## Product Purpose
KOL is a **desktop-first, video-native maker marketplace**. It turns shopping from a transaction back into a relationship: buyers scroll a magazine-style feed of real makers *on film*, tap a maker to grow their video, tap again to unfold the maker's whole personalized branded world around the still-playing video — meeting the human, building trust, and buying from them. Success for the Discovery Feed specifically: a first-time visitor understands within seconds that these are *shoppable humans and their craft*, feels drawn in, and wants to keep scrolling and tap a maker.

## Positioning
The mechanism a neighbouring product cannot truthfully copy: **a curated, reshuffling editorial magazine of makers-on-film** (never a uniform grid) that leads to a per-maker *world that unfolds around a persistent, contextually-narrating video*. The contextual-clip swap and the "world unfolds around the playing video" are KOL's signature moat (see reference library ★1). The feed's job is to make that promise legible from the very first viewport.

## Operating Context
- Desktop-first, degrades gracefully to mobile web (concept-lock D1).
- Discovery is the entry surface of the buyer journey (concept-lock buyer journey step 1). Downstream: tap → expanded video → maker world → product → checkout.
- Content is chosen by a rules+context "video engine" and **reshuffles on refresh** — the feed shows different people/media each visit. Videos autoplay **muted**; sound is opt-in. No thank-you/checkout clips in discovery.

## Capabilities and Constraints
- **This pass is screens-only.** No backend, DB, or auth wiring. All data is typed mock fixtures (`src/lib/fixtures/`). Imagery is stock (Unsplash / Pexels) of real people making real things; real footage comes later.
- Stack: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind · Framer Motion. Icons: Phosphor (`@phosphor-icons/react`) only.
- Feed is **mixed-media, mixed-size, asymmetric** — explicitly *never* a uniform product grid, and never carries deal-grid devices (discount badges, urgency countdowns, "23K sold", star-rating clutter).
- Quality floor (non-negotiable): all interaction states (default / hover / loading / empty), responsive to mobile, `prefers-reduced-motion` respected, WCAG AA contrast, zero placeholder/TODO UI, no console errors.

## Brand Commitments
- **Name:** KOL. **Icon system:** Phosphor (founder-set). **Motion library:** Framer Motion.
- **Voice:** warm, human, considered, confident — a shopkeeper who knows their makers, never a hawker. No urgency, no scarcity, no hype.
- **Reference bar (the quality/feeling to hit, not a template to copy):** warm + human (Faire / Kotn) melded with modern + cinematic (Lusion / Cuberto). **Anti-references (binding):** TikTok Shop / Complex — the dense transactional deal-grid KOL is the antithesis of.
- Corrected design direction (founder-confirmed, `NARRATIVE.md`): bold BIG statement type · warm-but-vivid color-blocking (not timid/muted) · cinematic/physical motion with a signature liquid/3D moment · video-forward, human-first — never a product grid.

## Evidence on Hand
- Founder-curated reference screenshots: `docs/research/references/{faire,kotn,cuberto,shop-tiktok,complex-shop}.png` and `lusion.mov` (motion ceiling, local-only).
- Authoritative direction: `docs/research/references/NARRATIVE.md`; reference library: `docs/02-competitive/KOL-reference-library.md`.
- **Absent (must not be fabricated):** real maker footage, real maker names/inventory, prices, review counts, sales figures. All maker content in this build is **synthetic demo material, labelled as such** in fixtures; the replacement list is in the return brief.

## Product Principles
1. **The human leads every frame.** UI frames a real maker and their craft; the product is never the hero, the person is.
2. **Reject the deal-grid.** Few large, human-forward pieces; story first. No urgency, discount badges, or rating clutter — ever.
3. **Film is the medium.** Discovery is video-native; motion is cinematic and earned, not decorative.
4. **Curated, alive, always different.** The feed feels like a living printed issue that reshuffles — editorial, breathing, never algorithmic sameness.
5. **Trust is the conversion.** Every affordance builds the sense that these are real, reachable humans you can buy from.

## Accessibility & Inclusion
WCAG AA contrast is a hard floor, including text over film/photography (scrims required). Keyboard-navigable with visible focus. `prefers-reduced-motion` disables autoplay-heavy motion and large transforms. Muted autoplay with `playsInline`; captions/labels on all media; semantic landmarks and alt text.
