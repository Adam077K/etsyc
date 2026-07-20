# KOL — Store-Config Schema (the D4 Spine)
*Phase 3 deliverable · session `ceo-5` · Design-Lead · 2026-07-19. The formal contract for feature P3/P4. Implements D4 (store engine) and binds D5 (video engine), D7 (trust), D9 (anti-slop), D10/D11 (voice). Tokens referenced here are defined in [`KOL-design-system.md`](./KOL-design-system.md); blocks in [`KOL-block-catalog.md`](../04-features/KOL-block-catalog.md).*

> **What this is.** The one JSON object every maker world *is*. The AI drafter (S3) emits it. Hand-built worlds emit it. The single renderer (P4) consumes it. It contains **data, never code** (D4). For `theme:{kind:"curated"}` worlds every field is bounded — palette/pairing are IDs into curated sets, blocks are from a fixed catalog, motion is a preset — so a valid config is structurally incapable of being slop (D9 layer 1). For **seller shops** (`theme:{kind:"custom"}`, **D15**) the theme carries full brand freedom (any-hex palette, catalog fonts); there the anti-slop guarantee is **not** the enum but the deterministic WCAG-AA contrast gate + auto-critic + maker approval (D9 layers 2–3), per [`KOL-ai-pipeline-spec.md`](./KOL-ai-pipeline-spec.md) §5.4/§6. Blocks remain catalog-bounded in both cases.
>
> **Validation.** Zod schema on every read/write (P3). Stored as `stores.config jsonb` in Supabase. Store versions snapshot the whole object (`store_versions`), carrying `criticScore` (P9) and per-section approval status (P10).
>
> **Changelog.** `v1.1` — `theme` becomes a discriminated union on `kind` (`curated | custom`) for D15 seller-shop brand freedom; the curated-enum invariant scopes to `kind:"curated"` only, with the WCAG-AA gate + auto-critic as the guarantee for `kind:"custom"`; §2.3 `videoProfile` source-of-truth note (ADR-0001 OQ-2). `v1.0` — initial Phase 3 contract.

---

## 1 · Top-level shape

```jsonc
{
  "schemaVersion": "1.1",     // string, semver — migration anchor (see Changelog)
  "storeId":       "uuid",    // FK stores.id
  "maker":         { … },     // identity + trust badges (D7)
  "theme":         { … },     // discriminated union on `kind`: curated (D9 enum rails) | custom (seller freedom, D15)
  "media":         { … },     // clips[] (video, D5-tagged) + images[]
  "products":      [ … ],     // the catalog
  "voiceovers":    [ … ],     // per-element real-voice recordings (D10/D11)
  "blocks":        [ … ],     // ORDERED array — the world, top to bottom
  "meta":          { … }      // version, status, critic score, approvals
}
```

**Top-level keys:** `schemaVersion · storeId · maker · theme · media · products · voiceovers · blocks · meta`.

Design invariants (enforced by the Zod validator):
- `theme` is a **discriminated union on `kind`**. For `kind:"curated"`, `paletteId` / `fontPairingId` / `motionPreset` **must** be members of the curated enums — free values rejected. For `kind:"custom"` (seller shops, D15), the curated-enum constraint does **not** apply; the accessibility + anti-slop guarantee is instead the deterministic WCAG-AA contrast gate + auto-critic + maker approval (D9 layers 2–3) — see §2.2 and [`KOL-ai-pipeline-spec.md`](./KOL-ai-pipeline-spec.md) §5.4/§6.
- Every `blocks[].bindings.*` id **must** resolve to a real entry in `media` / `products` / `voiceovers` (referential integrity).
- `blocks` is order-significant; `order` is the render sequence, `id` is stable across edits (so approvals/critic scores pin to a section, not a position).
- Exactly one `hero-video` block per world (the persistent film). Zero-or-more of every other type.

---

## 2 · Field schemas

### 2.1 `maker` — identity + trust (D7)
```jsonc
"maker": {
  "id":          "uuid",
  "displayName": "string",            // the human, front-and-center
  "handle":      "string",            // @slug, unique
  "craft":       "string",            // "hand-thrown stoneware"
  "location":    "string",            // "Lagos & London"
  "bio":         "string",            // maker's own words (≤ 280)
  "avatarMediaId": "mediaId|null",    // → media.images[]
  "trust": {
    "realMaker": {                    // Real-Maker layer (voice-anchored)
      "status":        "verified | pending | unverified",
      "verifiedAt":    "iso8601|null",
      "voiceAnchorClipId": "clipId|null"  // → media.clips[]; the voice that anchors the human
    },
    "aiTransparency": {               // AI-Transparency layer (honest disclosure)
      "level":          "maker-authored | ai-assisted | ai-drafted",
      "disclosure":     "string",     // human-readable, shown in the badge
      "aiAssistedFields": ["copy" | "layout" | "palette" | "…"]  // exactly where AI helped
    }
  }
}
```
Both trust layers must be *provable in v1* (D7). `realMaker.status: verified` requires a resolved `voiceAnchorClipId`; the renderer shows `pending` state otherwise (never a false claim).

### 2.2 `theme` — the design-system selection, a discriminated union on `kind` (D9 + D15)
`theme` is a **Zod `discriminatedUnion('kind', [Curated, Custom])`**. Its field names and shape mirror [`KOL-ai-pipeline-spec.md`](./KOL-ai-pipeline-spec.md) §5.4 (the emit-target) **exactly**, so the pipeline's output and this contract agree.

```jsonc
// kind:"curated" — KOL's OWN product UI, hand-built worlds, and the starting points offered to sellers. UNCHANGED behavior.
"theme": {
  "kind":          "curated",
  "paletteId":     "atelier-chalk | studio-paper | nocturne | orchard | bazaar",  // enum
  "mode":          "light | dark",     // which of the palette's two sets
  "fontPairingId": "editorial-warm | gallery-grotesque | contrast-editorial | character-maximal", // enum
  "motionPreset":  "still | calm | lively",  // maps to MOTION_INTENSITY 2 / 5 / 7
  "radiusIdentity":"sharp | soft | round",   // §1.3 of design system
  "density":       "airy | standard"         // VISUAL_DENSITY 3 / 5; "cockpit" not offered to worlds
}

// kind:"custom" — SELLER SHOPS: full brand freedom (D15). Derived per shop by the AI co-creation pipeline. NEW.
"theme": {
  "kind":          "custom",
  "customPalette": {
    "mode":  "light | dark",
    "roles": { "bg":"#hex", "surface":"#hex", "ink":"#hex", "inkMuted":"#hex",
               "accent":"#hex", "accentInk":"#hex", "border":"#hex" }   // 7 required roles, any valid hex
  },
  "customPairing": {
    "displayFamily":"string", "textFamily":"string",                    // from the hosted font catalog (AI-pipeline §5.5)
    "scaleRatio":"number", "displayWeight":"number", "textWeight":"number"
  },
  "motionPreset":  "still | calm | lively",  // kept as preset (nearest-to-intensity; open_q #1b)
  "radiusIdentity":"sharp | soft | round",
  "density":       "airy | standard"
}
```

- **`kind:"curated"`** — the original enum shape (unchanged). Every value is an ID into a curated set, so no raw colors, fonts, or timings ever appear and the theme is structurally incapable of being slop (**D9 layer 1**). Used by KOL's *own* product UI (feed, chrome, checkout), by hand-built worlds, and as **starting points** offered to sellers. This is *the* enforcement point for D9 layer 1 — but **only for curated themes**.
- **`kind:"custom"`** — **full seller-shop brand freedom (D15)**: an any-hex 7-role palette + a pairing of any two families from the hosted font catalog + motion/radius/density. Palette-capping a seller shop is forbidden (it is the flattening the product exists to fight). **The curated-enum invariant does NOT apply here.** Instead the accessibility + anti-slop guarantee is the **deterministic WCAG-AA contrast gate + auto-critic + maker approval** (D9 layers 2–3): a `kind:"custom"` config must carry a passing `meta.criticScore` from the AA gate before `meta.status` may leave `draft` — the guarantee moves from *input enum* to *output gate*. See [`KOL-ai-pipeline-spec.md`](./KOL-ai-pipeline-spec.md) §5.4 (the emit shape this mirrors) and §6 (the auto-critic that carries the quality bar for custom themes).

The renderer (P4) reads either shape: `curated` → look up tokens by id (existing path); `custom` → apply `roles`/`customPairing` directly as CSS custom properties.

### 2.3 `media` — clips (D5-tagged) + images
```jsonc
"media": {
  "clips": [{
    "id":        "clipId",
    "kind":      "video",
    "src":       "url",              // Supabase storage / CDN
    "poster":    "url",              // still frame (feed + loading states)
    "durationMs": 0,
    "captionsSrc": "url|null",       // WebVTT — accessibility
    "videoProfile": {                // ← the ONLY thing the video engine (P6) selects on
      "purpose":        ["intro" | "craft-story" | "process" | "product-narration" | "thankyou" | "atmosphere"],
      "pageEligibility":["feed" | "grown" | "world" | "product" | "checkout" | "thankyou"],
      "productLinks":   ["productId"],   // clips tied to specific products (narration)
      "mood":           ["calm" | "warm" | "energetic" | "intimate"],
      "antiRepetitionKey": "string"      // engine dedupes on this within a session
    }
  }],
  "images": [{
    "id":     "imageId",
    "src":    "url",
    "alt":    "string",              // required — accessibility, never empty
    "aspect": "1:1 | 4:5 | 3:2 | 16:9",
    "focalPoint": { "x": 0.0, "y": 0.0 }   // 0–1, for art-directed cropping
  }]
}
```
**How the video engine references clips (D5).** The engine never reads `blocks`. It queries `media.clips[].videoProfile` — filtering by `pageEligibility` (what state the buyer is in) ∩ `purpose` ∩ (for narration) `productLinks` ∩ `mood`, then applies anti-repetition on `antiRepetitionKey`. This **decouples footage from layout**: one tagged pool serves discovery, the persistent store player, *and* contextual narration. A `thankyou` clip is `pageEligibility:["thankyou"]` only — structurally it can never surface in the feed (the locked constraint from the buyer state machine).

> **Source-of-truth note (ADR-0001 OQ-2).** The inline `videoProfile` block above is a **config-side mirror for authoring/reference only**. The canonical, queryable source of truth is the **`video_profiles` table** (GIN-indexed on `purpose[]` / `page_eligibility[]` / `product_links[]` / `mood[]`); the video engine reads `videos` / `video_profiles` and **ignores the inline copy** — `media.clips[]` reference `videos.id`, and the write path upserts config and tables in one transaction. See [`adr/0001-kol-data-model.md`](./adr/0001-kol-data-model.md) OQ-2 and [`KOL-video-engine-spec.md`](./KOL-video-engine-spec.md).

### 2.4 `products`
```jsonc
"products": [{
  "id":        "productId",
  "title":     "string",
  "price":     { "amount": 0, "currency": "GBP" },   // amount in minor units (pence)
  "description": "string",           // maker's own copy (AI-assist OK, ≠ transcript — D10)
  "mediaIds":  ["imageId"],          // gallery, ordered
  "model3dId": "mediaId|null",       // optional GLB (D-open-question: upload vs generate)
  "narrationClipTags": ["clipId"],   // preferred narration clips for this product
  "inventory": { "status": "in-stock | made-to-order | sold-out", "qty": null },
  "badges":    ["one-of-a-kind" | "made-to-order" | "limited"]
}]
```

### 2.5 `voiceovers` — per-element real voice (D10/D11)
```jsonc
"voiceovers": [{
  "id":         "voId",
  "elementRef": { "kind": "block | product | field", "id": "…", "field": "title|…|null" },
  "src":        "url",               // seller-recorded, real voice (no cloning)
  "durationMs": 0,
  "transcript": "string|null",       // optional, for a11y; NOT the source of the text copy
  "label":      "string"             // buyer-facing: "Hear Sena on this glaze"
}]
```
Independent of `products[].description` and of clip narration — the three voice layers (video / text / tap-to-hear) never derive from each other (D10).

### 2.6 `blocks` — the ordered world
```jsonc
"blocks": [{
  "id":      "blockId",              // stable across edits
  "type":    "hero-video | craft-story | product-showcase | product-detail | voice-quote
              | process-reel | reviews | trust-badge | thank-you | atmosphere | contact-cta",
  "variant": "string",               // one of the catalog variants for this type
  "order":   0,                      // render sequence
  "props":   { /* per-type, see block catalog */ },
  "bindings":{                       // ids into media/products/voiceovers — validated
    "clipTags":     ["clipId"],      // hint set for the engine (engine still owns selection)
    "imageIds":     ["imageId"],
    "productIds":   ["productId"],
    "voiceoverIds": ["voId"]
  }
}]
```
`props` shape is defined per block type in the block catalog; the Zod schema is a discriminated union on `type`. `bindings` are validated for referential integrity at write time.

### 2.7 `meta`
```jsonc
"meta": {
  "version":         3,               // store_versions.n
  "status":          "draft | in_review | approved | published",
  "criticScore":     0.0,             // P9 auto-critic, 0–1; < threshold → regen (D9 layer 2)
  "approvedSections":["blockId"],     // P10 section-by-section human gate (D9 layer 3)
  "createdAt":       "iso8601",
  "updatedAt":       "iso8601"
}
```

---

## 3 · Worked example — a complete maker world

*Maker: Sena Okonkwo, hand-thrown stoneware, studio “Ashwork Ceramics,” Lagos & London. Warm-earthy world (`atelier-chalk` / `editorial-warm` / `calm`). Realistic data, no placeholders.*

```jsonc
{
  "schemaVersion": "1.1",
  "storeId": "a7f3…-ashwork",
  "maker": {
    "id": "mk_sena",
    "displayName": "Sena Okonkwo",
    "handle": "ashwork",
    "craft": "hand-thrown stoneware, wood-ash glazes",
    "location": "Lagos & London",
    "bio": "I throw in small batches and fire with ash from my father’s workshop. Every piece keeps the mark of the wheel.",
    "avatarMediaId": "img_sena_portrait",
    "trust": {
      "realMaker": { "status": "verified", "verifiedAt": "2026-07-12T09:20:00Z", "voiceAnchorClipId": "clip_intro" },
      "aiTransparency": {
        "level": "ai-assisted",
        "disclosure": "Sena wrote every word. KOL’s AI suggested the layout and picked the palette; Sena approved each section.",
        "aiAssistedFields": ["layout", "palette"]
      }
    }
  },
  "theme": {
    "kind": "curated",
    "paletteId": "atelier-chalk", "mode": "light",
    "fontPairingId": "editorial-warm", "motionPreset": "calm",
    "radiusIdentity": "soft", "density": "airy"
  },
  "media": {
    "clips": [
      { "id": "clip_intro", "kind": "video", "src": "…/intro.mp4", "poster": "…/intro.jpg",
        "durationMs": 41000, "captionsSrc": "…/intro.vtt",
        "videoProfile": { "purpose": ["intro"], "pageEligibility": ["feed","grown","world"],
          "productLinks": [], "mood": ["warm","intimate"], "antiRepetitionKey": "sena-intro" } },
      { "id": "clip_wheel", "kind": "video", "src": "…/wheel.mp4", "poster": "…/wheel.jpg",
        "durationMs": 28000, "captionsSrc": "…/wheel.vtt",
        "videoProfile": { "purpose": ["process"], "pageEligibility": ["world"],
          "productLinks": [], "mood": ["calm"], "antiRepetitionKey": "sena-wheel" } },
      { "id": "clip_tumbler", "kind": "video", "src": "…/tumbler.mp4", "poster": "…/tumbler.jpg",
        "durationMs": 19000, "captionsSrc": "…/tumbler.vtt",
        "videoProfile": { "purpose": ["product-narration"], "pageEligibility": ["product"],
          "productLinks": ["p_ridge_tumbler"], "mood": ["intimate"], "antiRepetitionKey": "sena-tumbler" } },
      { "id": "clip_thanks", "kind": "video", "src": "…/thanks.mp4", "poster": "…/thanks.jpg",
        "durationMs": 12000, "captionsSrc": "…/thanks.vtt",
        "videoProfile": { "purpose": ["thankyou"], "pageEligibility": ["thankyou"],
          "productLinks": [], "mood": ["warm"], "antiRepetitionKey": "sena-thanks" } }
    ],
    "images": [
      { "id": "img_sena_portrait", "src": "…/sena.jpg", "alt": "Sena at the wheel, hands cupping wet clay", "aspect": "4:5", "focalPoint": { "x": 0.5, "y": 0.4 } },
      { "id": "img_ridge_1", "src": "…/ridge1.jpg", "alt": "Ridge tumbler, ash glaze pooling at the base", "aspect": "1:1", "focalPoint": { "x": 0.5, "y": 0.55 } },
      { "id": "img_bowl_1", "src": "…/bowl1.jpg", "alt": "Serving bowl, matte oatmeal exterior", "aspect": "3:2", "focalPoint": { "x": 0.5, "y": 0.5 } }
    ]
  },
  "products": [
    { "id": "p_ridge_tumbler", "title": "Ridge Tumbler", "price": { "amount": 4200, "currency": "GBP" },
      "description": "Thrown with a deliberate ridge you feel under the thumb. Ash glaze pools darker where it runs.",
      "mediaIds": ["img_ridge_1"], "model3dId": null, "narrationClipTags": ["clip_tumbler"],
      "inventory": { "status": "made-to-order", "qty": null }, "badges": ["made-to-order"] },
    { "id": "p_ash_bowl", "title": "Ash-glaze Serving Bowl", "price": { "amount": 12800, "currency": "GBP" },
      "description": "Big enough for a shared meal. Each fires a little differently in the ash.",
      "mediaIds": ["img_bowl_1"], "model3dId": null, "narrationClipTags": [],
      "inventory": { "status": "in-stock", "qty": 3 }, "badges": ["one-of-a-kind"] }
  ],
  "voiceovers": [
    { "id": "vo_glaze", "elementRef": { "kind": "product", "id": "p_ridge_tumbler", "field": null },
      "src": "…/vo_glaze.mp3", "durationMs": 9000, "transcript": null, "label": "Hear Sena on this glaze" }
  ],
  "blocks": [
    { "id": "b_hero",   "type": "hero-video",       "variant": "center-column", "order": 0,
      "props": { "showCraftLine": true }, "bindings": { "clipTags": ["clip_intro"], "imageIds": [], "productIds": [], "voiceoverIds": [] } },
    { "id": "b_story",  "type": "craft-story",       "variant": "text-left-media-right", "order": 1,
      "props": { "heading": "Ash from my father’s workshop", "body": "…" }, "bindings": { "imageIds": ["img_sena_portrait"], "clipTags": [], "productIds": [], "voiceoverIds": [] } },
    { "id": "b_proc",   "type": "process-reel",      "variant": "single-reel", "order": 2,
      "props": { "caption": "One tumbler, start to trim" }, "bindings": { "clipTags": ["clip_wheel"], "imageIds": [], "productIds": [], "voiceoverIds": [] } },
    { "id": "b_show",   "type": "product-showcase",  "variant": "featured-single", "order": 3,
      "props": { "eyebrow": "Made to order" }, "bindings": { "productIds": ["p_ridge_tumbler","p_ash_bowl"], "voiceoverIds": ["vo_glaze"], "clipTags": [], "imageIds": [] } },
    { "id": "b_space",  "type": "atmosphere",        "variant": "color-wash", "order": 4,
      "props": { "toneShift": "warm" }, "bindings": { "clipTags": [], "imageIds": [], "productIds": [], "voiceoverIds": [] } },
    { "id": "b_trust",  "type": "trust-badge",       "variant": "expandable-detail", "order": 5,
      "props": {}, "bindings": { "clipTags": ["clip_intro"], "imageIds": [], "productIds": [], "voiceoverIds": [] } },
    { "id": "b_cta",    "type": "contact-cta",       "variant": "footer-strip", "order": 6,
      "props": { "label": "Message Sena" }, "bindings": { "clipTags": [], "imageIds": [], "productIds": [], "voiceoverIds": [] } }
  ],
  "meta": { "version": 3, "status": "published", "criticScore": 0.86,
    "approvedSections": ["b_hero","b_story","b_proc","b_show","b_space","b_trust","b_cta"],
    "createdAt": "2026-07-10T14:02:00Z", "updatedAt": "2026-07-12T09:25:00Z" }
}
```

Note how `clip_thanks` exists in `media` but is bound to **no block** — the video engine surfaces it only in `THANK_YOU` via `pageEligibility`, exactly as the state machine requires. That decoupling (data tagged for the engine, not wired into layout) is the heart of D4×D5.

---

*Schema is a Design-Lead + CPO contract proposal for Phase 4. The Zod implementation (P3) and DB `stores.config jsonb` shape are the database-engineer / backend-engineer deliverables; this doc is the source of truth they implement against. Field names may tighten in review — `schemaVersion` exists so they can.*
</content>
