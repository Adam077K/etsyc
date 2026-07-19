# KOL v2 — Concept Lock (Design Tree)
*Locked 2026-07-19 · session `ceo-5` · CEO grill with Adam. This SUPERSEDES the Jul-16 `KOL-vision-capture.md` where they conflict. Ground truth for every downstream planning + build agent.*

> **What KOL is, in one breath:** a desktop-first, video-native marketplace where buyers scroll a magazine-style feed of real makers *on film* (never a grid); tapping a maker grows the video, then unfolds their whole personalized branded **world** *around* the still-playing video; the maker guides you like a real shopkeeper, products and story revealed as you scroll; you meet the human, trust them, and buy — turning shopping from a transaction back into a relationship. Makers create their world through an AI co-creation interview: they stay the author, the tech takes the design/marketing slack, and quality is structurally guaranteed to be company-grade — never slop.

---

## The buyer journey (locked)
1. **Discovery feed** — magazine layout: mixed-size videos + images (not a uniform grid), reshuffles on refresh, shows different people/media each visit. Content chosen by the **video engine** (below), never a thank-you/checkout clip.
2. **Tap a video** → grows to a center column; scroll through other videos. (Tap an image → grows, learn the person behind it.)
3. **Tap again** → the maker's **world unfolds around the still-playing video** with animation: their products, descriptions, images, other videos, colors, fonts, layout, atmosphere — all per-maker.
4. **Scroll the store** → interact with everything while the video keeps playing.
5. **Click a product / go deeper** → the leading video **shrinks to a corner** and the video engine plays the *right* clip for what the buyer is now looking at (contextual narration).
6. **Product page** — images, description, 3D model (if available), **trust badge**, reviews, + seller-added interactions.
7. **Checkout** — price, reviews, pay (KOL-owned).
8. **Post-purchase** — personal **thank-you video**; order saved to account.

## The seller journey (locked)
1. **Onboarding explainer video** — the whole process, why it matters, how it helps a small business. Must feel easy + limitless.
2. **AI interview** — film (preferred) or voice. Adaptive: fixed story beats + smart follow-ups. Extracts story, craft, workshop, values, brand, personal details, product stories.
3. **AI drafts the store** as a **JSON config** (blocks + tokens + copy + media/clip refs) — never raw code.
4. **Co-edit** — maker reviews in a simple visual editor: swap blocks, tweak colors, re-record clips, add optional per-element **voiceovers**.
5. **Approve section-by-section → publish.** Maker is the author throughout; AI takes the slack.

---

## The 13 locked decisions

| # | Decision | Locked choice | Why | Reversibility |
|---|----------|---------------|-----|---------------|
| D1 | **Surface** | Desktop-first responsive web (Next.js); degrades to mobile web | The "world unfolds around a persistent video" needs a large canvas; fastest to build + share; matches stack | hard |
| D2 | **Auth** | **In scope.** Supabase Auth, buyers + sellers | Persistent buyer profile (real personalization signal) + orders tied to accounts. *(Reversed the earlier "skip auth".)* | hard |
| D3 | **AI engine scope (MVP)** | Hybrid: **3 pre-built worlds + 1 live pipeline** | Buyer experience looks finished; seller magic is provably real; guardrails bounded to one flow | reversible |
| D4 | **Store engine** | **Section/block library + per-maker JSON config**, one renderer | Radically different per maker, yet AI emits DATA not code; hand-built + AI worlds share one renderer | hard |
| D5 | **Video engine** | **One unified rules+context selection engine** (discovery + store + narration), AI-ranker-ready | SELECTS from the maker's real footage by video-profile tags + business profile + buyer situation, w/ anti-repetition. No buyer-time generation. Upgrade slot for LLM/embedding re-rank | hard |
| D6 | **Checkout** | **KOL-owned, Stripe test-mode**, real orders in Supabase | Full end-to-end experience (cart→pay→thank-you→history); real product that works; no real money | reversible |
| D7 | **Trust badge** | **Real-Maker + AI-Transparency** (two honest layers) | (1) Verified real human anchored by their own voice; (2) honest disclosure of where AI assisted vs maker's own. Every claim provable in v1 | reversible |
| D8 | **Seller pipeline** | **Co-creation loop**: explainer → adaptive interview → AI drafts JSON → maker co-edits → approve → publish | Back-and-forth, creative freedom, maker stays author, tech takes the slack | hard |
| D9 | **Anti-slop system** | **3 layers**: constrained primitives (valid JSON × pre-designed blocks × curated palettes) + automated design-critic (regen below-bar) + human approval gate | Quality structurally guaranteed, not hoped for; directly answers the prompts/guardrails/QA concern | hard |
| D10 | **Voice model** | Three **independent** layers: store **video** (shopkeeper narration) · store **text** (own copy, AI-assist OK, ≠ transcript) · **tap-to-hear voiceovers** (optional, seller-recorded real voice per element, suggested) | Keeps "hear her say it" honest without cloning; text is free to be its own thing | reversible |
| D11 | **Voiceover scope (MVP)** | **Full**: record-in-editor (seller) + tap-to-hear playback (buyer) | Both sides real; full personal-touch demo | reversible |
| D12 | **Footage source** | **Team-produced: 4 worlds, one per teammate** (Adam, Shaian, Thea, Megan). 3 pre-built + 1 live. Each is their own real maker | Honest (real people, not actors playing strangers), fully controlled, dogfoods the product | reversible |
| D13 | **Timeline model** | **Competition = checkpoint on a production-grade build.** Pre-MVP = whole product working, seeded with 4 teammate worlds (proof-of-concept). Final MVP = demo content cleared/archived, opened to real buyers + sellers both sides | Not a throwaway; the pitch is a checkpoint, the venture continues | hard |
| D14 | **App location** | KOL product app lives in **`apps/kol/`** in this repo (monorepo with the agent system + docs). Workers create worktrees off this repo as usual | Fastest start, worktree workflow unchanged, everything in one context; extractable to its own repo later | reversible |
| D15 | **Design-system scope + seller freedom** *(amends D4/D9)* | **Two surfaces, two rules.** (a) **KOL's own product UI** (feed, nav, chrome, checkout, marketing) uses the FIXED design system — the 5 palettes / 4 pairings / motion presets. (b) **Seller shops get FULL brand freedom** — any colors, fonts, imagery, vibe; the AI derives a *coherent custom design system per shop* from the seller's brand input; the 5 palettes are **starting points, not a cap**. Anti-slop for shops is guaranteed by **AI-generation coherence + the auto-critic (contrast/AA/hierarchy/coherence, auto-regens ugly) + maker approval** — NOT by palette limitation. "No flattening" wins; the critic carries the quality bar | hard |

> **On D15 (the freedom↔anti-slop resolution).** The original D9 leaned on "constrained primitives (1 of 5 palettes)" as anti-slop *layer 1* for everything. D15 corrects that: palette-capping seller shops = the flattening the whole product exists to fight. So for **seller shops**, layer 1 becomes *structural + accessibility rails only* (the block/section system, spacing, mandatory AA-contrast enforcement on whatever colors the seller brings), and the **load-bearing quality guarantee shifts to layer 2 (auto-critic) + layer 3 (maker approval)**. Implication for Phase 4: the AI pipeline needs a robust *"brand input → coherent custom design system"* derivation step AND a genuinely excellent critic with automated contrast/coherence enforcement — these are now load-bearing, not backstops. KOL's *own* UI keeps the fixed system (consistency = our brand).

---

## Guardrails & non-negotiables (from the founder)
- **Never "AI does it for you."** Every AI touchpoint is *with* the maker; they stay the creative author.
- **No flattening.** Every store must feel genuinely different — different layout, fonts, motion, atmosphere.
- **Never slop.** Company-grade output is a hard floor, enforced structurally (D9).
- **Trust must be honest.** No claim we can't back (that's why "product physically verified" is roadmap, not MVP).
- **Voice is one element, not the whole.** Video, imagery, design, personalized brand, and felt human connection matter as much as voice.

## Explicitly OUT of the MVP (roadmap)
- Product physical-authenticity verification ("exactly as real life") — needs inspection ops.
- Real ML personalization / trained recommender — MVP uses rules+context with an AI-ranker upgrade slot (D5).
- Fully open generative store creation for any maker at scale — MVP is bounded to the block library + curated palettes.
- Native mobile app — desktop-first web first (D1).
- Etsy API integration / real Etsy sync — KOL is standalone for MVP (Etsy-compatible is positioning, not v1 plumbing). *(Note: revisit the "Etsyc" naming/trademark decision before any public Etsy-adjacent branding — see DECISIONS.md 2026-07-14.)*

## Open questions (resolve during planning, not blocking)
- 3D model source per product (upload vs generate) — treat as optional per-product asset.
- Exact block catalog (which sections exist) — Phase 2/3 deliverable.
- Interview beat-sheet + extraction schema — Phase 4 deliverable.
- Curated palette/font set for the anti-slop rails — Phase 3 deliverable.
