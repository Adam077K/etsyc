# KOL — AI Co-Creation Pipeline Spec (Phase 4, Workstream B)

*Phase 4 deliverable · 2026-07-19 · ai-engineer · session `ai-engineer-kol-ai-pipeline`. Implements D8 (co-creation loop), D9 (3-layer anti-slop) as reframed by **D15** (seller-shop design freedom), and D10/D11 (voice). Emits the object defined in [`store-config.schema.md`](./store-config.schema.md). ADR: [`adr/0002-ai-co-creation-pipeline.md`](./adr/0002-ai-co-creation-pipeline.md).*

> **What this is.** The end-to-end specification for turning a maker's interview into a published, company-grade, *genuinely custom* store — with quality structurally guaranteed. Five stages, in order: **Interview → Extraction → Design Derivation → Auto-Critic → Human Gate.** Every LLM feature ships with an eval harness and per-call cost logging (§8, §10) — non-negotiable.
>
> **The D15 mandate this spec exists to satisfy.** Seller shops get **full brand freedom** — any colors, any fonts, any vibe. Palette-capping a seller shop is **forbidden** (it is the flattening the product exists to fight). The 5 KOL palettes / 4 pairings are **starting points, not a cap**. Quality is held by the load-bearing **auto-critic** (§6) + **human approval** (§7), NOT by input constraint.

---

## 0 · Pipeline at a glance

```
S1 EXPLAINER      (video, no LLM)
      │
S2 AI_INTERVIEW ──────────────▶  §3  fixed beat-sheet + adaptive follow-ups   → interviews, interview_answers
      │  transcript (film|voice)
      ▼
   EXTRACTION ──────────────────▶ §4  transcript → typed BRAND PROFILE (JSON)  → interview_answers.extracted
      │  brand profile
      ▼
S3 DESIGN DERIVATION ──────────▶ §5  brand profile → COHERENT CUSTOM DESIGN     → stores.config, store_versions
      │  (D15 load-bearing)          SYSTEM → schema-valid store-config JSON
      ▼
P9 AUTO-CRITIC ────────────────▶ §6  [1] deterministic WCAG-AA HARD GATE        → store_versions.critic_score
      │  score / regen              [2] LLM hierarchy+coherence+fit score
      │   ▲     │ below-bar             regen loop (max 3) → escalate-to-human
      │   └─────┘
      ▼
S4 CO_EDIT + S5 VOICEOVER  (maker edits; each edit re-triggers §6 on changed sections)
      ▼
S6 APPROVE ────────────────────▶ §7  section-by-section human gate              → store_versions.approved_sections
      ▼
S7 PUBLISH   (precondition: AA gate PASS ∧ every rendered block approved)        → stores.published
```

Feature-tree trace: S1→S6, P8/P9/P10, feature-tree §5. Each stage's LLM specifics — prompt, guardrails, model, eval, cost log — are in §8 and §10.

### 0.1 Locked data contract (from Workstream A — cited as-is, NOT redesigned here)

- Interview persists to **`interviews`** / **`interview_answers`**.
- **`store_versions(critic_score, status, approved_sections)`** — critic score, publish status, and section approvals persist here; a version snapshots the whole store-config object (`meta` in the schema mirrors these fields).
- **`videos`** + **`video_profiles`** are the CANONICAL queryable tables **OWNED BY the video engine (Workstream C)**; `stores.config.media.clips[]` **REFERENCES `videos.id`**. This pipeline references already-persisted/tagged video ids; it does **NOT** create or tag videos (that is Workstream C / P7). See the footage handoff in §9.

---

## 1 · Scope & non-goals

**In scope (this spec):** interview conduct + extraction; brand-profile schema; brand → custom design system derivation; store-config emission (including the theme representation for custom palettes); copy generation; the auto-critic (deterministic AA + LLM coherence); the regen loop; the human approval gate; prompts, guardrails, model routing, evals, and cost logging for every LLM feature; the shared eval-harness proposal.

**Out of scope (owned elsewhere, referenced only):**
- Video creation, tagging, `videoProfile` authoring, and the AI-ranker slot (D5) → **Workstream C / P6, P7**. We reference `videos.id`.
- The `stores` / `store_versions` / `interviews` table DDL and RLS → **Workstream A / database-engineer**. We reference columns.
- Edits to `store-config.schema.md` → **Design-Lead / database-engineer**. We *propose* a `theme` amendment (§5.4) for their sign-off; we do not edit the file.
- The co-edit editor UI (S4) and voiceover recorder UI (S5) → frontend. We define only the data each writes and the re-critic trigger.

---

## 2 · Stack, models, and the mandatory per-feature contract

Per `CLAUDE.md` (Models, May 2026) and the direct-API AI stack (OpenAI / Claude / Gemini):

| LLM feature | Model | Why | Escalation / fallback |
|-------------|-------|-----|-----------------------|
| Interview follow-up generation (§3) | `claude-sonnet-4-6` | Real-time, conversational, needs nuance but not deep reasoning | Haiku for the "is this beat satisfied?" stopping check (classification) |
| Extraction: transcript → brand profile (§4) | `claude-sonnet-4-6` | Structured extraction over a long transcript; must not hallucinate | — |
| **Design derivation (§5, D15 load-bearing)** | **`claude-opus-4-7`** | The single hardest step: brand → coherent custom design system. Deep multi-constraint reasoning (color harmony × accessibility headroom × type × motion × brand fit). Runs a few times per shop, not per request | Sonnet fallback on Opus 429/529 with a quality flag; result still passes §6 gate |
| Copy generation (§5.6) | `claude-sonnet-4-6` | Maker's-own-voice copy, AA-aware constraints | — |
| Critic — coherence/hierarchy/fit (§6.2) | `claude-sonnet-4-6` | Rubric scoring with rationale; **not** used for the AA gate | Haiku for a cheap pre-screen only, never the final score |
| Critic — AA contrast (§6.1) | **none (deterministic)** | Computed WCAG ratio — never LLM-judged | n/a |

**Mandatory for every LLM feature (worker contract, non-negotiable):**

1. **Error handling** — rate limit (429) → exponential backoff + retry; overload (529) → graceful fallback (Sonnet for derivation) or queue-and-notify; all else → typed error, no silent failure.
2. **Cost logging** — every call logs the schema in §10.1. No exceptions.
3. **Eval harness** — every feature has a golden dataset + metric (§8). No feature ships without one.
4. **Prompt caching** — stable system-prompt blocks (>1024 tokens: beat-sheet, brand-profile schema, block catalog, design-token vocabulary, critic rubric) carry `cache_control: { type: 'ephemeral' }`.
5. **Keys** — always `process.env.ANTHROPIC_API_KEY` (and the relevant provider var). Never hardcoded.

---

## 3 · Stage 1 — Interview (D8 / S2 · feature-tree §5 `AI_INTERVIEW`)

**Goal:** capture everything the design + copy stages need, in the maker's own words, while feeling like an easy conversation with a curious shopkeeper — never a form.

**Input:** live film (preferred) or voice. **Both produce the same artifact: a timestamped transcript** (STT for voice; STT + optional visual frames for film). The interview logic is transcript-source-agnostic; film adds an optional `visualNotes` channel (workshop/product shots the maker holds up) that extraction may cite but the follow-up logic does not depend on it.

**Persists to:** `interviews` (one row per session: maker_id, mode `film|voice`, status, transcript_ref) and `interview_answers` (one row per beat: beat_id, question asked, transcript span, `extracted` jsonb filled by §4).

### 3.1 Fixed beat-sheet (the spine — always asked, in order)

| # | Beat | Opening question (maker-facing) | What it must surface |
|---|------|--------------------------------|----------------------|
| B1 | **Story / origin** | "How did you start making this?" | origin, turning point, why this craft, mission |
| B2 | **Craft** | "Walk me through how one piece is actually made." | medium, techniques, materials, process, time per piece |
| B3 | **Workshop** | "Where do you make it — what does the space feel like?" | setting, location, tools, sensory details (→ palette/mood signals) |
| B4 | **Values** | "What do you refuse to compromise on?" | principles, sustainability, community |
| B5 | **Brand feel** | "If your shop were a place, what would walking in feel like?" | mood words, color/light signals, type/motion feel, references |
| B6 | **Personal details** | "What should someone know about *you*, not just the work?" | pronouns (asked, never inferred), personality, fun facts |
| B7 | **Product stories** | "Pick a piece you love — tell me about it." (repeat per product) | per-product: name, what it is, materials, story, made-to-order?, variation, price range |

The **beat-sheet is a cached, stable system-prompt block** (it never changes per session → prompt-cache win).

### 3.2 Adaptive follow-up framework

For each beat, after the opening question, an LLM (`claude-sonnet-4-6`) decides whether to probe, using a **bounded** policy — not free-form conversation:

- **When to probe:** a required field for that beat (col. "What it must surface") is still unfilled OR the answer is a vague generic ("I just love making things"). Probe toward the *specific and sensory* — concrete materials, real place-names, felt textures — because these are what make a design custom rather than generic (directly feeds D15).
- **What to probe (per beat):** a ranked list of the beat's still-missing fields; ask the highest-value missing field, one question at a time, max **3 follow-ups per beat**.
- **Stopping condition (per beat):** stop when all required fields are filled at "specific" confidence, OR 3 follow-ups spent, OR the maker signals done ("that's about it"). A cheap Haiku classifier scores each answer `filled | vague | done` to drive this — deterministic budget, cheap model.
- **Film vs. voice:** identical follow-up logic; same transcript source. Film may attach `visualNotes`; if the maker shows a product on camera during B7, the follow-up may say "tell me the material of the one you're holding" — but this is a prompt hint, not a separate code path.

**Guardrail (D10 "never AI does it for you"):** the interviewer only *asks and reflects*. It never writes the maker's story for them, never puts words in their mouth. Extraction (§4) uses the maker's actual transcript spans as the source of truth.

**Global stopping condition:** all 7 beats satisfied → interview complete → transcript + per-beat spans handed to extraction.

---

## 4 · Stage 2 — Extraction → the Brand Profile

**Goal:** convert the transcript into one typed, structured **brand profile** — the *sole* input to design derivation (§5). This is the seam that lets us eval "understanding a human" separately from "designing for one."

**Model:** `claude-sonnet-4-6`, structured output validated against the brand-profile schema (Zod at implementation; this doc is the contract). **Hallucination guardrail:** every extracted fact must be grounded in a transcript span; the prompt requires a `sourceSpan` (char offsets) per fact, and any field the transcript does not support is `null` — never invented (measured by the eval's hallucination-rate metric, §8a).

**Persists to:** `interview_answers.extracted` (per-beat) and a consolidated `brand_profile` object snapshotted into the first `store_versions` draft's provenance.

### 4.1 Brand-profile schema (every field + type)

```jsonc
{
  "maker": {
    "displayName":     "string",              // the human, front and center
    "handle":          "string | null",       // @slug suggestion; maker confirms
    "craft":           "string",              // "hand-thrown stoneware, wood-ash glazes"
    "location":        "string | null",
    "pronouns":        "string | null",       // ASKED in B6, never inferred from name
    "yearsPracticing": "number | null"
  },
  "story": {
    "origin":        "string",                // how they started
    "turningPoint":  "string | null",
    "whyThisCraft":  "string",
    "mission":       "string | null"
  },
  "craft": {
    "medium":       "string",
    "techniques":   "string[]",
    "materials":    "string[]",
    "process":      "string",                 // narrative of making one piece
    "timePerPiece": "string | null"
  },
  "workshop": {
    "setting":        "string | null",        // "a converted garage full of morning light"
    "location":       "string | null",
    "tools":          "string[]",
    "sensoryDetails": "string[]"              // "smell of wet clay", "north light" → palette/mood signal
  },
  "values": {
    "principles":     "string[]",
    "sustainability": "string | null",
    "community":      "string | null"
  },
  "aesthetic": {                              // THE design-derivation signal (§5)
    "moodWords":         "string[]",          // "warm, quiet, earthy, unhurried"
    "paletteSignals":    {
      "described":       "string[]",          // colors the maker named: "clay browns, ash grey, cream"
      "sourceImagery":   "string[]"           // things whose colors to draw from: "my father's workshop", "wet stoneware"
    },
    "colorTemperature":  "warm | cool | neutral | mixed | null",
    "contrastPreference":"soft | bold | null",
    "typeFeel":          "editorial | grotesque | serif-literary | hand | geometric | null",
    "motionFeel":        "still | calm | lively | null",
    "densityFeel":       "airy | standard | null",
    "radiusFeel":        "sharp | soft | round | null",
    "references":        "string[]"           // "like a gallery catalog", "like my grandmother's kitchen"
  },
  "brand": {
    "name":       "string | null",            // studio name if any
    "tagline":    "string | null",
    "voiceTone":  "string",                   // "warm, understated, a little wry"
    "adjectives": "string[]"                  // brand adjectives for copy + critic fit-check
  },
  "products": [{
    "name":         "string",
    "whatItIs":     "string",
    "materials":    "string[]",
    "story":        "string | null",
    "priceRange":   "string | null",
    "madeToOrder":  "boolean | null",
    "variationNote":"string | null"           // "each fires differently in the ash"
  }],
  "personal": {
    "personality": "string | null",
    "funFacts":    "string[]"
  },
  "_provenance": {                            // grounding, for the hallucination eval
    "sourceSpans": "Record<fieldPath, {start:number,end:number}> "  // char offsets into transcript
  }
}
```

The `aesthetic` object is deliberately **descriptive, not prescriptive** — it captures *signals* (mood words, named colors, source imagery, felt preferences), never final hex/font values. Turning signals into a concrete, coherent, accessible system is the job of §5, where it can be reasoned about and critiqued.

---

## 5 · Stage 3 — Brand Profile → Coherent Custom Design System → Store-Config *(D15 — THE LOAD-BEARING STEP)*

**Goal:** derive, from the brand profile, a **coherent custom design system** — *any* colors (not capped to the 5 KOL palettes), plus type, motion, atmosphere — and render it into a **schema-valid store-config JSON** (blocks from the catalog, tokens, copy, media/clip refs → `videos.id`).

**Model:** `claude-opus-4-7` (justified: this is the single hardest reasoning step and it runs a handful of times per shop, not per request — see §2). The 5 KOL palettes/pairings are passed in the prompt as **starting-point exemplars ("here are five coherent systems for calibration — you may depart from them entirely")**, explicitly *not* as an allowed-set.

### 5.1 Sub-step A — derive the custom design system

Output: an intermediate **DesignSystem** object (not yet store-config), so it can be reasoned about and (partly) checked before committing to blocks:

```jsonc
{
  "palette": {
    "mode":  "light | dark",
    "roles": {                    // ANY colors — hex; NOT drawn from an enum
      "bg":        "#hex",        // page background
      "surface":   "#hex",        // card / block surface
      "ink":       "#hex",        // primary text
      "inkMuted":  "#hex",        // secondary text
      "accent":    "#hex",        // brand accent (CTAs, highlights)
      "accentInk": "#hex",        // text/icon ON accent
      "border":    "#hex"         // hairlines, dividers (non-text)
    },
    "derivedFrom": "string[]"     // trace: which paletteSignals/imagery produced these (for the critic + transparency)
  },
  "typography": {
    "displayFamily": "string",    // any family from the hosted font catalog (§5.5), e.g. "Fraunces"
    "textFamily":    "string",    // e.g. "Inter"
    "scaleRatio":    "number",    // 1.2 | 1.25 | 1.333 …
    "displayWeight": "number",
    "textWeight":    "number"
  },
  "motion":     { "intensity": "number(0-10)", "preset": "still | calm | lively" },  // preset = nearest KOL preset for the renderer
  "atmosphere": { "radius": "sharp | soft | round", "density": "airy | standard", "texture": "none | paper | grain | wash | null" }
}
```

**Derivation guidance baked into the prompt:**
- Ground palette in `aesthetic.paletteSignals` (named colors) and `sourceImagery` (extract a palette from the *described* materials/place — "wet stoneware + ash + north light" → warm greys, clay browns, cream). If signals are thin, use `moodWords` + `colorTemperature`.
- **Design with AA headroom on purpose** (§6.1 is a hard gate): choose `ink`/`bg` and `accentInk`/`accent` pairs that clear 4.5:1, and `border`/`surface` that clears 3:1, *by construction*. The prompt states the exact thresholds so the model targets them; §6.1 then *verifies* deterministically (belt and braces).
- Map `typeFeel` → family character; `motionFeel` → intensity; `densityFeel`/`radiusFeel` → atmosphere.
- **No-flattening imperative (D15):** two different brand profiles must not collapse to the same system. The prompt forbids defaulting to a "safe" house style; the critic's fit-to-brand dimension (§6.2) penalizes generic output.

### 5.2 Sub-step B — choose blocks + emit store-config

From the DesignSystem + brand profile + available media (`videos.id` set, §9), emit the full store-config object per [`store-config.schema.md`](./store-config.schema.md):

- **`blocks[]`** — select from the fixed catalog (`hero-video · craft-story · product-showcase · product-detail · voice-quote · process-reel · reviews · trust-badge · thank-you · atmosphere · contact-cta`), ordered. Exactly one `hero-video`. Choose variants and order that fit the story arc (origin → craft → products → trust → CTA is the default spine; vary per brand). Block *composition and order* is a primary "no-flattening" lever — different makers get different worlds.
- **`theme`** — the DesignSystem, encoded via the **proposed custom representation** (§5.4).
- **`media.clips[]` / `images[]`** — reference `videos.id` (§9) and uploaded images; bind clips to blocks by id (engine still owns final selection, D5).
- **`products[]`** — from `brand_profile.products`, with copy from §5.6.
- **`voiceovers[]`** — empty at draft; populated by S5 (maker records real voice, D10/D11).
- **`meta`** — `status: "draft"`, `version`, `criticScore: null` (filled by §6), `approvedSections: []`.

**All schema invariants must hold** (referential integrity of every `bindings.*` id; exactly one `hero-video`; stable block ids). Emit is retried on validation failure with the validator error fed back (max 2 structural retries before escalating).

### 5.3 Worked mapping — a custom palette into the `theme` block

Maker: metalsmith, "cold, precise, industrial — like a machinist's shop at dawn." Extracted `paletteSignals.described`: `["gunmetal", "steel blue", "raw brass"]`; `colorTemperature: "cool"`; `typeFeel: "geometric"`; `motionFeel: "still"`. **None of the 5 KOL palettes fits** — that is the point of D15. Derived DesignSystem palette:

```jsonc
"palette": { "mode": "dark",
  "roles": { "bg":"#14181C", "surface":"#1E242B", "ink":"#EEF2F5", "inkMuted":"#9AA6B0",
             "accent":"#C7973F", "accentInk":"#14181C", "border":"#333E48" },
  "derivedFrom": ["gunmetal→bg/surface","steel blue→border","raw brass→accent"] }
```

Encoded into `theme` (proposed custom form, §5.4):

```jsonc
"theme": {
  "kind": "custom",
  "customPalette": {
    "mode": "dark",
    "roles": { "bg":"#14181C","surface":"#1E242B","ink":"#EEF2F5","inkMuted":"#9AA6B0",
               "accent":"#C7973F","accentInk":"#14181C","border":"#333E48" }
  },
  "customPairing": { "displayFamily":"Space Grotesk","textFamily":"IBM Plex Sans",
                     "scaleRatio":1.25,"displayWeight":600,"textWeight":400 },
  "motionPreset": "still",          // nearest KOL preset (intensity 1 → "still")
  "radiusIdentity": "sharp",
  "density": "standard"
}
```

Contrast check (§6.1) on this palette: `ink #EEF2F5` on `bg #14181C` ≈ **14.8:1** (PASS ≥4.5), `accentInk #14181C` on `accent #C7973F` ≈ **7.1:1** (PASS), `border #333E48` on `surface #1E242B` ≈ **1.4:1** — **FAIL** for a border that must convey state (§6.1 treats structural borders as non-text, ≥3:1). The gate catches it; regen nudges `border` to `#4A5763` (≈3.1:1) → PASS. This is exactly why the deterministic gate is load-bearing: the LLM produced a beautiful, on-brand palette with one inaccessible hairline, and computation — not taste — caught it.

### 5.4 Proposed store-config schema amendment (for schema-owner sign-off)

> **⚠️ This is a PROPOSAL, not an edit.** `store-config.schema.md` is owned by Design-Lead / database-engineer. §2.2 today constrains `theme.paletteId` / `fontPairingId` to curated **enums** — the pre-D15 anti-slop layer 1. **D15 forbids palette-capping seller shops**, so the enum cannot express a seller shop's theme. The pipeline needs the representation below. **Raised as open_question #1.** Until accepted, seller-shop configs cannot validate.

Make `theme` a **discriminated union on `kind`**:

```jsonc
// theme = curated (KOL's own worlds, hand-built worlds, template starting points) — UNCHANGED behavior
"theme": {
  "kind": "curated",
  "paletteId":     "atelier-chalk | studio-paper | nocturne | orchard | bazaar",
  "mode":          "light | dark",
  "fontPairingId": "editorial-warm | gallery-grotesque | contrast-editorial | character-maximal",
  "motionPreset":  "still | calm | lively",
  "radiusIdentity":"sharp | soft | round",
  "density":       "airy | standard"
}

// theme = custom (SELLER SHOPS — D15 full freedom) — NEW
"theme": {
  "kind": "custom",
  "customPalette": {
    "mode":  "light | dark",
    "roles": { "bg":"#hex","surface":"#hex","ink":"#hex","inkMuted":"#hex",
               "accent":"#hex","accentInk":"#hex","border":"#hex" }     // 7 required roles, valid hex
  },
  "customPairing": {
    "displayFamily":"string","textFamily":"string",                     // from hosted font catalog (§5.5)
    "scaleRatio":"number","displayWeight":"number","textWeight":"number"
  },
  "motionPreset":  "still | calm | lively",   // kept as preset; nearest-to-intensity. (open_q #1b: allow raw intensity?)
  "radiusIdentity":"sharp | soft | round",
  "density":       "airy | standard"
}
```

**Validator changes required (for database-engineer/backend):**
- `theme` becomes a Zod `discriminatedUnion('kind', [Curated, Custom])`.
- **The §2.2 invariant "`paletteId`/`fontPairingId` must be members of the curated enums — free values rejected" applies ONLY to `kind:"curated"`.** For `kind:"custom"`, replace it with: (a) `roles.*` are valid hex; (b) `displayFamily`/`textFamily` ∈ hosted font catalog; (c) **the config MUST carry `meta.criticScore` from a passing AA gate before `status` may leave `draft`** — i.e., the accessibility guarantee moves from *input enum* to *output gate* (§6.1). This is the D15 reframe encoded in the schema.
- The renderer (P4) reads either shape: curated → look up tokens by id (existing path); custom → apply `roles`/`customPairing` directly as CSS custom properties.

**Other schema fields checked for seller-freedom expressiveness (flagging per brief):**
- `media.clips[].videoProfile` (§2.3) is authored **inline** in the schema, but the locked data contract says `videos`/`video_profiles` are canonical and `media.clips[]` **references `videos.id`**. The pipeline emits clip **references**, not inline profiles; the `videoProfile` source of truth is `video_profiles` (Workstream C). Flagged as **open_question #3** (coordinate with C + schema owner: is inline `videoProfile` a denormalized read-cache, or should §2.3 become a pure `{ videoId }` reference?).
- `theme.density` offers only `airy | standard` ("cockpit" withheld from worlds) — adequate for shops; no change requested.
- `motionPreset` as a 3-value enum is a mild freedom cap vs. a continuous intensity; noted as open_question #1b, low priority (3 presets read as expressive enough).
- All other fields (`maker`, `products`, `blocks.props`, `voiceovers`) already accept free values — no freedom conflict.

### 5.5 Fonts — "any font" in practice

Full font-file upload has hosting + licensing cost. For MVP, `customPairing.displayFamily`/`textFamily` resolve against a **broad hosted font catalog** (hundreds of families — e.g. a Fontsource/Google-Fonts subset curated for legibility, licensing, and web performance), and the derivation model may pick **any two** from it. This is "any font" for practical purposes and is not a 4-pairing cap. Arbitrary uploaded font files = **roadmap** (open_question #4). The critic's coherence dimension still judges the *pairing*, not the catalog membership.

### 5.6 Copy generation (D10 — text is its own layer, ≠ transcript)

Block headings/body and `products[].description` are generated by `claude-sonnet-4-6` from the brand profile in the **maker's voice** (`brand.voiceTone`, `brand.adjectives`), then surfaced for maker edit in co-edit (S4). Per D10, this text is *independent* of the video narration and of tap-to-hear voiceovers — the three voice layers never derive from each other. Copy is AI-*assisted*, maker-*authored*: the maker can rewrite anything, and the trust badge (`maker.trust.aiTransparency`) honestly discloses AI-assisted fields (`copy`, `layout`, `palette`).

---

## 6 · Stage 4 — Auto-Critic (D9 layer 2 — LOAD-BEARING · P9)

**Goal:** guarantee company-grade quality on *whatever colors and fonts the shop brings* (D15). Two sub-gates, **in strict order**: a deterministic accessibility hard gate, then an LLM coherence score. **The AA gate runs first and is dispositive — no LLM score matters until it passes.**

### 6.1 Sub-gate 1 — deterministic WCAG-AA contrast (HARD GATE, computed, NOT LLM)

**Standard:** WCAG 2.1.
- **SC 1.4.3 Contrast (Minimum):** normal text **≥ 4.5:1**; large text **≥ 3:1** (large = ≥ 24px, or ≥ 18.66px / 14pt bold).
- **SC 1.4.11 Non-text Contrast:** UI components, focus indicators, and meaningful graphical objects (borders that convey state/boundaries) **≥ 3:1**.

**Algorithm (deterministic):** for each color role pair that co-occurs in the rendered blocks, compute the WCAG contrast ratio:

```
relative luminance L = 0.2126·R + 0.7152·G + 0.0722·B   (R,G,B linearized from sRGB)
contrast ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

**Required checks (every rendered block's token usage):**

| Pair | Threshold | SC |
|------|-----------|----|
| `ink` on `bg` | ≥ 4.5:1 | 1.4.3 normal |
| `ink` on `surface` | ≥ 4.5:1 | 1.4.3 normal |
| `inkMuted` on `bg` and on `surface` | ≥ 4.5:1 (≥ 3:1 only if that text is provably ≥ large everywhere it appears) | 1.4.3 |
| `accentInk` on `accent` | ≥ 4.5:1 | 1.4.3 normal |
| Display headings (`ink`/`accent`) on their bg | ≥ 3:1 (large) | 1.4.3 large |
| `border` on `surface`/`bg` (structural) | ≥ 3:1 | 1.4.11 |
| Focus ring on adjacent | ≥ 3:1 | 1.4.11 |

**Verdict:** any failing pair → **AA gate FAIL**. On FAIL: (a) **auto-repair** — nudge the *lightness* (L in HSL/LCH) of the offending role toward the threshold while preserving hue and chroma (keeps the brand color, fixes only accessibility), re-check; if repair clears all pairs, PASS with a `repaired` flag surfaced to the maker in co-edit. (b) If auto-repair cannot clear it without a perceptible hue shift → **regen** (feed the specific failing pairs + measured ratios back to §5). **A config that fails the AA gate can NEVER reach the LLM coherence score, and can NEVER be published.** This is the accessibility guarantee that replaces the palette cap (D15 reframe).

### 6.2 Sub-gate 2 — LLM coherence / hierarchy / fit (only runs after AA PASS)

**Model:** `claude-sonnet-4-6`. Scores the AA-passing config on:

| Dimension | Weight | What it judges |
|-----------|--------|----------------|
| **Hierarchy** | 0.30 | Is visual hierarchy clear? Does the eye land on the right thing (hero video, then story, then products)? Type scale + spacing legible? |
| **Coherence** | 0.35 | Do palette + type + motion + atmosphere + copy + block composition feel like **one intentional brand**, not a random assembly? |
| **Fit-to-brand** | 0.25 | Does the result match the extracted brand profile — `moodWords`, `adjectives`, `references`? (Penalizes generic house-style output — the no-flattening check.) |
| **Slop-avoidance** | 0.10 | Explicit AI-tell / templatey signals: default lorem cadence, mismatched accent, arbitrary radius, meaningless motion. |

Output: per-dimension 0–1 + rationale + a bulleted list of concrete fixes. **`criticScore` = weighted sum → persisted to `store_versions.critic_score` (0–1).** The rationale/fixes are *not* auto-applied; they feed regen or surface to the maker.

### 6.3 Regen loop — trigger, feedback, stopping condition

- **Threshold:** `criticScore ≥ 0.75` to pass (calibrated against the §8c labelled set; a launch-tunable constant, not hardcoded magic).
- **Regen trigger:** AA FAIL (after auto-repair fails) OR `criticScore < 0.75`.
- **What's fed back to §5:** the *specific* deficits only — failing AA pairs with measured ratios, and the lowest-scoring coherence dimension(s) with the critic's concrete fixes. Not the whole score; not "try again." Targeted feedback prevents thrashing.
- **STOPPING CONDITION (hard):** **max 3 regen iterations.** If still below bar after 3 → **stop, do NOT loop, do NOT auto-publish.** Set `store_versions.status = 'in_review'` with a `needs_human_eye` flag and escalate to the maker in co-edit with the critic's notes ("we couldn't get this fully there on our own — here's what to adjust with us"). This bounds cost and guarantees no infinite loop and no below-bar auto-publish. Every iteration logs cost (§10).

---

## 7 · Stage 5 — Human Approval Gate (D9 layer 3 · S6 / P10)

**Goal:** the maker is the final author (D8, D10). Approval is **section-by-section**, not all-or-nothing.

- **UI (S4/S6, frontend-owned):** each rendered block shows an Approve control. The maker approves blocks individually; approving a block appends its `blockId` to `store_versions.approved_sections` (blockId array — matches the locked contract and schema §2.7 `meta.approvedSections`).
- **Partial-approve state:** a version can sit with some blocks approved and others not (`status: 'in_review'`). The store is not publishable in this state.
- **Publish precondition (hard):** `status → 'published'` requires **(a) the deterministic AA gate PASS on the current version** AND **(b) every *rendered* block's `id` present in `approved_sections`** AND (c) any Real-Maker trust badge's `voiceAnchorClipId` resolved (schema §2.1 — no false claim). Media-only clips not bound to a block (e.g. `thankyou`) don't require approval; they surface via the video engine's `pageEligibility` (D5).
- **Re-review on edit:** editing a block (copy, tokens, media, order) **removes it from `approved_sections`** and **re-triggers §6 on the changed section(s)** (and on coherence, since a token change is global). The maker must re-approve. This keeps approvals honest — an approved section always reflects what will publish.

---

## 8 · Evals — one harness, three datasets (every LLM feature has one)

**Non-negotiable:** no LLM feature ships without a golden dataset + metric + a run in CI before deploy. Shared harness shape in §8d (also the Workstream-C convergence proposal).

### 8a · Extraction quality (§4)

- **Dataset:** ≥ 12 labelled examples: `(transcript) → (expected brand profile)`. Cover: rich/verbose maker, terse maker, film-with-visualNotes, voice-only, off-topic rambling, a maker who names explicit colors, a maker who names none (imagery-only), non-English place-names, a maker who declines B6 personal details, an adversarial "make me sound premium" (must extract facts, not inflate), and two multi-product B7 cases.
- **Metrics:** field-level **precision / recall / F1** on extracted facts; **hallucination rate** = % of extracted facts with no supporting `sourceSpan` (target **0**); null-honesty = unsupported fields correctly left `null`.

### 8b · Design coherence (§5)

- **Dataset:** ≥ 12 `(brand profile) → (human-rated design system)` examples spanning distinct aesthetics (earthy-warm, cold-industrial, maximal-folk, minimal-gallery, playful-bright, dark-moody, etc.) so no two collapse to a house style (the D15 no-flattening test).
- **Metrics:** (1) **AA pass rate at first emit** (how often derivation designs with headroom, before the gate repairs) — target ≥ 0.8; (2) **critic-score vs. human-rating correlation** (does our critic agree with human designers?); (3) **distinctness** — pairwise palette/type distance across different brands must exceed a floor (catches flattening quantitatively).

### 8c · Critic accuracy (§6) — the load-bearing eval

- **Dataset (labelled slop set):** ≥ 20 configs, half **known-slop** (generic templates, clashing palettes, broken hierarchy, AA-failing), half **known-good custom** (real, distinctive, accessible, on-brand — including deliberately *unconventional-but-good* designs, e.g. maximal folk, high-contrast brutalist). Grows over time from real regen escalations.
- **Metrics:** **precision & recall on slop detection.** Two failure modes measured explicitly: **false negatives** (slop scored ≥ 0.75 — ships slop; recall protects against this) and **false positives** (good custom work scored < 0.75 — over-rejects and *attacks D15 freedom*; precision protects against this). The false-positive rate on the "unconventional-but-good" subset is the D15 canary — a critic that only likes safe designs is a flattening critic and fails this eval. AA-gate accuracy is separately asserted as **1.0** (it's deterministic — any deviation is a bug, tested with known color-pair fixtures).

### 8d · Shared eval-harness shape *(proposal — convergence with Workstream C, open_question #2)*

Both this pipeline and the video engine (C) need an LLM eval harness. Proposed shared shape so the two converge rather than fork:

```jsonc
// Dataset — JSONL, one golden example per line, same shape both workstreams:
{ "id":"ext-001", "feature":"extraction", "input": {...}, "expected": {...}, "labels": {...}, "notes":"terse maker" }

// Metric interface — each feature registers a scorer:
type Scorer<I,O,E> = (output: O, expected: E, input: I) => {
  score: number;                       // 0..1 primary
  breakdown: Record<string, number>;   // sub-metrics (precision, recall, f1, hallucinationRate, correlation…)
  pass: boolean;                       // vs. the feature's threshold
}

// Runner contract (CI): run(feature) → { n, passRate, meanScore, breakdown, regressions[], costUsd }
// Fails the build if passRate < feature.minPassRate OR a regression vs. the committed baseline.
```

The cost-log schema (§10.1) is the **same** across both workstreams so eval-run cost and production cost roll up together.

---

## 9 · Footage handoff with Workstream C (P7 tagging)

- The pipeline binds blocks to clips **by `videos.id`** and references the canonical `video_profiles` (owned by C) for eligibility/purpose/mood — it does **not** author `videoProfile` (D5 / P7 owns tagging).
- **Untagged footage at draft time:** if a maker's footage exists in `videos` but is not yet tagged in `video_profiles` when §5 drafts, the pipeline may still bind it (e.g. the `hero-video` needs a clip), marking those bindings **`pendingTag: true`** in draft provenance. The renderer/video-engine treats an untagged clip as **ineligible** (it won't surface until P7 tags it), and — hard rule — **a store cannot PUBLISH with an untagged clip bound to `hero-video`** (the persistent film must be real and eligible). This is the seam: draft may reference-ahead; publish requires C's P7 to have tagged everything the world renders.
- The **AI-ranker slot (D5)** is Workstream C's; this spec references it only — our `bindings.clipTags` are *hints*, the engine owns final selection.

---

## 10 · Cost logging & guardrails (every LLM call)

### 10.1 Cost-log schema (emitted on EVERY LLM call — shared with Workstream C)

```jsonc
{
  "event":         "llm_call",
  "feature":       "interview_followup | extraction | design_derivation | copy_gen | critic_coherence",
  "model":         "claude-sonnet-4-6 | claude-opus-4-7 | claude-haiku-4-5",
  "input_tokens":  0,
  "output_tokens": 0,
  "cached_tokens": 0,          // prompt-cache read hits
  "cost_usd":      0.0,        // computed from the model's rate card
  "latency_ms":    0,
  "trace_id":      "uuid",     // correlates a full pipeline run
  "store_id":      "uuid",
  "iteration":     0,          // regen iteration, for §6.3 cost attribution
  "outcome":       "ok | retry | fallback | error"
}
```

Aggregations to watch: **cost per published shop** (sum over a `trace_id`), **regen iterations per shop** (loop health — §6.3), **Opus share** (derivation cost), **cache-hit rate** (should be high on the stable beat-sheet / schema / rubric blocks).

### 10.2 Error handling (every call)

```
429 (rate limit)  → exponential backoff (250ms·2^n, jitter, max 5) then retry; log outcome:"retry"
529 (overload)    → for design_derivation, fall back Opus→Sonnet with a quality flag; else queue+notify; log outcome:"fallback"
other 4xx/5xx     → typed error surfaced to the stage; NO silent failure; log outcome:"error"
malformed output  → structural retry (max 2) with the Zod/validator error fed back; then escalate
```

### 10.3 Guardrails summary

- **D10 authorship:** AI asks, reflects, and takes design/copy slack — it never speaks *for* the maker. Copy/story are maker-editable and honestly disclosed via `aiTransparency`.
- **D15 freedom:** derivation is never allowed to cap to the 5 palettes; the critic must not over-reject unconventional-but-good work (measured, §8c).
- **Never slop:** the AA gate (deterministic) + coherence bar (≥0.75) + human approval are all required to publish; none is skippable.
- **No hardcoded keys; no `--no-verify`; prompt-cache stable blocks; every call logs cost.**

---

## 11 · Open questions (for sign-off / cross-spec)

1. **Schema freedom amendment (§5.4)** — the `theme` discriminated-union (curated | custom) needs Design-Lead / database-engineer sign-off; the §2.2 enum invariant must be scoped to `kind:"curated"` only, with the AA gate (§6.1) as the accessibility guarantee for `kind:"custom"`. *Blocker-if-rejected: seller-shop configs cannot validate without this.* (1b, low priority: allow raw `motionIntensity` alongside `motionPreset`?)
2. **Shared eval harness (§8d)** — proposed dataset/metric/cost-log shapes for convergence with Workstream C. Needs C's agreement to adopt the same harness + cost-log schema.
3. **Inline `videoProfile` vs. reference (§5.4, §9)** — store-config §2.3 authors `videoProfile` inline, but the locked contract says `media.clips[]` references `videos.id` with `video_profiles` canonical (owned by C). Resolve with C + schema owner: read-cache or pure reference?
4. **Font freedom scope (§5.5)** — MVP resolves `customPairing` against a broad hosted catalog ("any font" in practice). Arbitrary font-file upload (hosting + licensing) = roadmap; confirm acceptable for MVP.

---

*Spec is an ai-engineer Phase 4 contract proposal. The Zod schemas, the LLM-runner implementation, and the DB column bindings are database-engineer / backend-engineer deliverables against this doc. The `theme` amendment (§5.4) requires schema-owner sign-off before implementation. QA gate is structural — this spec is not merged by its author.*
