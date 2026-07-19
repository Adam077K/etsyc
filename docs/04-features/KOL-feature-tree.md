# KOL v2 — Feature Tree, Section Catalog, Screen Map & Interaction Flows
*Phase 2 deliverable · authored 2026-07-19 · session `ceo-5` · CPO. Decomposes [`KOL-v2-concept-lock.md`](../01-foundation/KOL-v2-concept-lock.md) (D1–D13) into build-ready features. This is the index the Phase 5 spec pack fills in. Nothing here is invented — every item traces to a locked decision.*

> **Traceability rule:** every feature cites the D# it implements. If a build agent finds work with no D#, it is out of scope — escalate, do not build.
>
> **Risk tiers** (from CLAUDE.md QA gate): Trivial · Lite (<300 LOC, no API/DB/auth) · Full (API/DB/auth/billing, ≥300 LOC) · Irreversible (DB migration, workflow, agent-def, billing flow).

---

## 1 · Feature Tree

### 1A · Shared / Platform features

| # | Feature | Description | Implements | Risk | Data need (Supabase) | MCP at build |
|---|---------|-------------|-----------|------|----------------------|--------------|
| P1 | **Buyer + Seller Auth** | Supabase Auth; email/OTP; role flag (buyer/seller); session; RLS anchor | D2 | `auth.users`, `profiles(role)` | Supabase |
| P2 | **Account & Profile** | Persistent buyer/seller profile; personalization signal store; account settings | D2 | `profiles`, `buyer_signals` | Supabase |
| P3 | **Store-config JSON schema + validator** | The one contract every world conforms to (blocks + tokens + copy + media/clip refs). Zod-validated on read/write | D4 | `stores(config jsonb)` | Supabase |
| P4 | **Store renderer (one engine)** | Renders any store from its JSON config → live world. Hand-built + AI worlds share it | D4 | `stores`, `blocks`, `products`, `media` | Playwright (visual verify) |
| P5 | **Section/block library** | The catalog of pre-designed blocks the renderer composes (see §2). Constrained primitives = anti-slop layer 1 | D4, D9 | `blocks` | Figma, Playwright |
| P6 | **Video engine (unified selection)** | One rules+context engine: eligibility filter → scoring → anti-repetition; serves discovery + store + narration. AI-ranker upgrade slot | D5 | `videos`, `video_profiles`, `buyer_signals` | Supabase |
| P7 | **Video-profile tagging pipeline** | Tags footage: purpose, page-eligibility, product-links, mood — the signals the engine selects on | D5 | `video_profiles` | Supabase |
| P8 | **Curated design rails** | Curated palettes + font sets + motion presets. Bounds generation → anti-slop layer 1 | D9, D10 | tokens in `stores.config` / `design_tokens` | Figma |
| P9 | **Anti-slop auto-critic** | Automated design-critic scores contrast/hierarchy/coherence; regenerates below-bar | D9 | `store_versions(critic_score)` | — (LLM) |
| P10 | **Human approval gate** | Section-by-section maker approval before publish. Anti-slop layer 3 | D9, D8 | `store_versions(status)` | Supabase |
| P11 | **Trust badges** | Real-Maker (voice-anchored verified human) + AI-Transparency (honest AI-assist disclosure) | D7 | `verifications`, `badges` | Supabase |
| P12 | **Voiceover engine** | Record-in-editor (seller) + tap-to-hear playback (buyer), per-element real voice | D10, D11 | `voiceovers` | Supabase |

### 1B · Buyer features

| # | Feature | Description | Implements | Risk | Data need | MCP |
|---|---------|-------------|-----------|------|-----------|-----|
| B1 | **Discovery feed** | Magazine layout (mixed-size video+image, not a grid); reshuffles per visit; engine-chosen content | D5, D1 | `videos`, `video_profiles`, `stores`, `buyer_signals` | Playwright |
| B2 | **Grow interaction** | Tap video → grows to center column; scroll other videos. Tap image → grows, meet the person | D5 | `videos` | Playwright |
| B3 | **World unfold** | Tap again → maker's branded world animates open *around* the still-playing video | D4, D5 | `stores`, `blocks` | Playwright |
| B4 | **Store scroll & interact** | Scroll the world, interact with everything while video keeps playing | D4 | `stores`, `products` | Playwright |
| B5 | **Contextual narration (shrink)** | Go deeper → leading video shrinks to corner; engine plays the *right* clip for what's on screen | D5 | `videos`, `video_profiles` | — |
| B6 | **Product page** | Images, description, 3D (optional), trust badge, reviews, seller-added interactions | D4, D7 | `products`, `media`, `reviews`, `badges` | Playwright |
| B7 | **Checkout** | Cart → price/reviews → pay (KOL-owned, Stripe **test-mode**); real order row | D6 | `carts`, `orders`, `order_items` | Stripe (test), Supabase |
| B8 | **Thank-you moment** | Personal thank-you video post-purchase; order saved to account | D6, D5 | `orders`, `videos` | — |
| B9 | **Order history** | Past orders tied to account | D2, D6 | `orders`, `order_items` | Supabase |
| B10 | **Tap-to-hear voiceover (buyer side)** | Optional per-element real-voice playback | D10, D11 | `voiceovers` | — |

### 1C · Seller features

| # | Feature | Description | Implements | Risk | Data need | MCP |
|---|---------|-------------|-----------|------|-----------|-----|
| S1 | **Onboarding explainer** | Video walk-through of the whole process; must feel easy + limitless | D8 | static/`videos` | — |
| S2 | **Adaptive AI interview** | Film (preferred) or voice; fixed story beats + smart follow-ups; extracts story/craft/workshop/values/brand/products | D8 | `interviews`, `interview_answers`, `media` | Supabase (LLM) |
| S3 | **AI store draft (JSON)** | AI drafts store as JSON config (blocks+tokens+copy+media/clip refs) — never raw code | D4, D8, D9 | `stores(config)`, `store_versions` | — (LLM) |
| S4 | **Co-edit visual editor** | Swap blocks, tweak curated colors/fonts, re-record clips, reorder — maker stays author | D8, D9 | `stores`, `store_versions`, `blocks` | Playwright, Figma |
| S5 | **Per-element voiceover recording** | Record real voice per element in-editor; suggested, optional | D10, D11 | `voiceovers`, `media` | Supabase |
| S6 | **Section-by-section approve → publish** | Approve each section; publish flips store live. Human gate | D8, D9 | `store_versions(status)`, `stores(published)` | Supabase |
| S7 | **Seller dashboard** | Manage store, products, orders received, verification status | D2, D6, D7 | `stores`, `products`, `orders`, `verifications` | Supabase |
| S8 | **Product management** | Add/edit products, images, 3D (optional), price, link clips | D4, D6 | `products`, `media` | Supabase |
| S9 | **Verification flow (Real-Maker)** | Voice-anchored real-human verification that mints the badge | D7 | `verifications`, `badges` | Supabase |

**Feature counts:** Shared/Platform **12** · Buyer **10** · Seller **9** · **Total 31.**

---

## 2 · Section / Block Catalog

The blocks the renderer (P4) composes from a store's JSON config. Each is a constrained primitive (anti-slop layer 1). Variants keep worlds different (D9 no-flattening); every block must implement all **4 states: empty · loading · error · success**.

| Block | Purpose | Key variants | Empty | Loading | Error | Success |
|-------|---------|--------------|-------|---------|-------|---------|
| **hero-video** | The persistent maker video the world unfolds around | full-bleed · center-column · corner-shrunk | poster still, muted CTA | skeleton + spinner over poster | fallback poster + retry | video plays, controls minimal |
| **craft-story** | The maker's narrative / origin | text-left+media-right · stacked editorial · pull-quote | placeholder prompt (seller view) | shimmer text blocks | show cached copy | rich story renders |
| **product-showcase** | Grid/rail of products in the world | rail · masonry · featured-single | "no products yet" (seller) | card skeletons | "couldn't load products" + retry | cards with media+price |
| **product-detail** | Single product deep view | image-gallery · 3D-viewer · video-led | — | gallery skeleton | broken-image fallback | full detail + add-to-cart |
| **voice-quote** | A short spoken/written maker quote | audio-tap · text-only · text+waveform | hidden if unset | waveform loading | text-only fallback | tap-to-hear plays |
| **process-reel** | Behind-the-scenes / making-of clips | single-reel · multi-clip carousel | hidden if unset | reel skeleton | poster + retry | reel autoplays on scroll |
| **reviews** | Social proof on product/store | list · rating-summary · featured-quote | "be the first" | row skeletons | cached reviews | reviews + aggregate rating |
| **trust-badge** | Real-Maker + AI-Transparency layers | inline-compact · expandable-detail | n/a (always resolvable) | badge skeleton | "verification pending" state | verified badge + disclosure |
| **thank-you** | Post-purchase personal moment | video-message · text+media | fallback generic thanks | video loading | text fallback | personal video plays |
| **atmosphere/spacer** | Per-maker mood: color field, texture, motion transition | color-wash · image-band · motion-divider | collapses | — | static color fallback | animated transition |
| **contact/cta** | "Follow / message the maker" | button · card · footer-strip | hidden | — | disabled + tooltip | active CTA |

**Block catalog names:** `hero-video · craft-story · product-showcase · product-detail · voice-quote · process-reel · reviews · trust-badge · thank-you · atmosphere/spacer · contact/cta`.

> Exact per-block token/variant schemas are a **Phase 3** deliverable (store-config schema). This catalog names them and locks the 4-state requirement.

---

## 3 · Screen Inventory

### Buyer journey screens
| Screen | Purpose | Key blocks/features | D# |
|--------|---------|--------------------|----|
| **Discovery feed** | Magazine scroll of makers on film | feed grid, hero-video (feed variant) · B1 | D5,D1 |
| **Grown-video state** | Tapped video enlarged, others scrollable | hero-video (center) · B2 | D5 |
| **Unfolded world** | Maker's store open around the video | all store blocks · B3,B4 | D4 |
| **Product page** | Deep product view | product-detail, reviews, trust-badge · B6 | D4,D7 |
| **Cart / checkout** | Review + pay | product-showcase (mini), checkout · B7 | D6 |
| **Thank-you** | Post-purchase moment | thank-you · B8 | D6 |
| **Order history** | Past orders | list · B9 | D2,D6 |
| **Account settings** | Profile mgmt | forms · P2 | D2 |
| **Auth (login/signup)** | Enter as buyer | auth forms · P1 | D2 |

### Seller journey screens
| Screen | Purpose | Key blocks/features | D# |
|--------|---------|--------------------|----|
| **Seller onboarding / explainer** | Why + how, feel limitless | explainer video · S1 | D8 |
| **AI interview** | Film/voice adaptive capture | recorder + beat prompts · S2 | D8 |
| **Draft review (AI store draft)** | First look at generated world | store renderer (preview) · S3 | D4,D8 |
| **Co-edit editor** | Visual edit of blocks/tokens/clips | editor canvas + block palette · S4 | D8,D9 |
| **Voiceover recorder** | Per-element voice capture | inline recorder · S5 | D10,D11 |
| **Publish / approve** | Section-by-section approve → live | approval checklist · S6 | D8,D9 |
| **Seller dashboard** | Manage store/products/orders/verification | dashboard widgets · S7 | D2,D6,D7 |
| **Product management** | CRUD products + media | product forms · S8 | D4,D6 |
| **Verification** | Real-Maker voice-anchored verify | verify flow · S9 | D7 |
| **Auth (seller)** | Enter as seller | auth forms · P1 | D2 |

**Screen count:** Buyer **9** · Seller **10** · **19 screens.**

---

## 4 · Buyer Interaction State Machine

The signature "world unfolds around a persistent video" flow. Video engine (P6) action noted at each state.

```
[FEED] ──tap(video)──▶ [GROWN] ──tap(unfold)──▶ [WORLD_OPEN] ──scroll──▶ [WORLD_BROWSE]
                                                                              │
                                                                     click(product)
                                                                              ▼
[THANK_YOU] ◀──pay──── [CHECKOUT] ◀──add-to-cart── [PRODUCT_PAGE] ◀────── [NARRATE_SHRINK]
```

| State | Trigger in | Video engine action | Notes |
|-------|-----------|---------------------|-------|
| **FEED** | load / refresh | Selects a mixed set by video-profile + business profile + buyer signals; anti-repetition; **never** thank-you/checkout clips | Magazine layout, reshuffles per visit |
| **GROWN** | tap a feed video | Grows tapped clip to center column, keeps playing; feed scroll continues around it | Tap image → grow variant (meet the person) |
| **WORLD_OPEN** | tap again on grown video | Video keeps playing; world **animates open around it** (blocks, tokens, atmosphere per maker) | The signature transition |
| **WORLD_BROWSE** | scroll the store | Video persists; engine may swap to store-context clips (anti-repetition holds) | Interact with all blocks live |
| **NARRATE_SHRINK** | click product / go deeper | Leading video **shrinks to a corner**; engine plays the *right* contextual narration clip | Contextual selection, no buyer-time generation |
| **PRODUCT_PAGE** | land on product | Corner video may narrate the product; tap-to-hear voiceovers available | Images, 3D (opt), badge, reviews |
| **CHECKOUT** | add-to-cart → checkout | Video minimized/paused; focus on price+reviews+pay | KOL-owned, Stripe test-mode |
| **THANK_YOU** | payment success | Engine selects the maker's **personal thank-you** clip; order saved | Only place a thank-you clip is eligible |

**States in order:** `FEED → GROWN → WORLD_OPEN → WORLD_BROWSE → NARRATE_SHRINK → PRODUCT_PAGE → CHECKOUT → THANK_YOU`.

Back-transitions: any state → FEED (exit world); PRODUCT_PAGE → WORLD_BROWSE (video re-expands); CHECKOUT → PRODUCT_PAGE (cancel).

---

## 5 · Seller Pipeline Flow

The co-creation loop (D8) with anti-slop gates (D9). Maker is the author throughout; AI takes the slack.

```
[EXPLAINER] ─▶ [AI_INTERVIEW] ─▶ [AI_DRAFT_JSON] ─▶ [CO_EDIT] ─▶ [VOICEOVER] ─▶ [APPROVE] ─▶ [PUBLISH]
                     │                   │                             ▲            │
                  adaptive          auto-critic ──below-bar──▶ regen ──┘       section-by-section
                  follow-ups        (D9 layer 2)                               human gate (D9 layer 3)
```

| Stage | What happens | Anti-slop / gate | Data written |
|-------|-------------|------------------|--------------|
| **EXPLAINER** | Watch onboarding video; understand the process | — | — |
| **AI_INTERVIEW** | Film/voice; fixed beats + adaptive follow-ups; extract story/craft/values/brand/products | — | `interviews`, `interview_answers`, `media` |
| **AI_DRAFT_JSON** | AI emits store as JSON config: blocks (from library) + curated tokens + copy + media/clip refs | Layer 1: constrained primitives (valid JSON × pre-designed blocks × curated palettes) | `stores.config`, `store_versions` |
| **CO_EDIT** | Maker swaps blocks, tweaks curated colors/fonts, re-records clips, reorders | Layer 2: auto-critic scores contrast/hierarchy/coherence, regenerates below-bar | `store_versions` |
| **VOICEOVER** | Record real voice per element (optional, suggested) | — | `voiceovers`, `media` |
| **APPROVE** | Review section-by-section, approve each | Layer 3: human approval gate | `store_versions.status` |
| **PUBLISH** | Store flips live; trust badges resolve (Real-Maker needs verification) | verification precondition for Real-Maker badge | `stores.published`, `badges` |

---

## Build-order note for CTO / Phase 4
The two spines are **P3 store-config JSON schema** (D4) and **P6 video engine** (D5) — everything conforms to them. DB migrations for all `Data need` tables above are **Irreversible tier** (database-engineer before backend-engineer). Auth (P1) and checkout (P7/B7) are **Full tier** minimum. See master plan Phase 4 for the schema/spec sequencing.
