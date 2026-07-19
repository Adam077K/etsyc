# KOL — START HERE
*The single onboarding entry point. If you are a new agent or teammate joining KOL, read this file first, then follow the reading path below. Last updated 2026-07-19 (session `ceo-5`).*

---

## What KOL is (60 seconds)
**KOL** (Hebrew for *"voice"*) is a **desktop-first, video-native marketplace** where buyers meet the real maker before the product. Buyers scroll a magazine-style feed of real makers *on film* (never a grid); tapping a maker grows the video, then the maker's fully personalized branded **world** unfolds *around* the still-playing video (their colors, fonts, studio, craft, atmosphere). The maker's video guides you like a real shopkeeper; a novel mechanic swaps the video to **contextual narration** when you click a product. You meet the human, trust them, and buy — turning shopping from a transaction back into a relationship. Makers build their world through an **AI co-creation interview** (they stay the author; the tech takes the design/marketing slack), and quality is structurally guaranteed company-grade — never slop.

- **Positioning:** a new way to shop from real humans; Etsy-compatible. Tagline: *"Every maker, finally heard."*
- **Context:** born in the HLV × Etsy program (Columbia, Jul 2026). The competition is a **checkpoint on a production-grade build**, not the finish line — the goal is a real venture.
- **Team:** Adam (founder), Shaian, Thea, Megan.
- ⚠️ **Name caveat:** "KOL" is a working name; the earlier "Etsyc" name has a live trademark risk (see DECISIONS.md 2026-07-14). Trademark/domain check required before any public/API use.

---

## Reading path

### ⭐ Tier 1 — authoritative & current (read these, in order)
1. **[`docs/01-foundation/KOL-v2-concept-lock.md`](01-foundation/KOL-v2-concept-lock.md)** — THE ground truth. 14 locked decisions (D1–D14), buyer + seller journeys, guardrails, out-of-scope. **Supersedes everything else where they conflict.**
2. **[`docs/03-system-design/KOL-MVP-master-plan.md`](03-system-design/KOL-MVP-master-plan.md)** — the phased build plan (Phases 0–8) the agent team runs.
3. **[`docs/02-competitive/KOL-reference-library.md`](02-competitive/KOL-reference-library.md)** — 40 annotated design references + the synthesized visual direction + strategic findings (incl. the novel contextual-clip-swap moat). *Note: visual direction is under active revision as of Jul 19 — Adam is re-gathering references.*
4. **[`docs/04-features/KOL-feature-tree.md`](04-features/KOL-feature-tree.md)** — 31 features (12 platform · 10 buyer · 9 seller), the 11-block catalog, 19 screens, buyer state machine, seller pipeline.
5. **[`docs/03-system-design/store-config.schema.md`](03-system-design/store-config.schema.md)** — the D4 spine: the JSON contract every maker world conforms to (AI emits it, one renderer consumes it).
6. **[`docs/03-system-design/KOL-design-system.md`](03-system-design/KOL-design-system.md)** — palettes, font pairings, motion, tokens (the anti-slop rails). ⚠️ *Palettes/fonts under revision — direction being reset by Adam.*
7. **[`docs/04-features/KOL-block-catalog.md`](04-features/KOL-block-catalog.md)** — the 11 blocks × variants × 4 states.

### 📜 Tier 2 — the pitch & the "why" (context)
8. **[`docs/01-foundation/KOL-vision-capture.md`](01-foundation/KOL-vision-capture.md)** — the fuller founder vision narrative (Jul 16). Concept-lock (Tier 1 #1) is the authoritative *decisions*; this is the richer *feeling*.
9. **[`docs/05-marketing/HLV-pitch-draft-v1.md`](05-marketing/HLV-pitch-draft-v1.md)** — the 3-min competition pitch script (slides + spoken).
10. **[`docs/01-foundation/HLV-ETSY-CHALLENGE.md`](01-foundation/HLV-ETSY-CHALLENGE.md)** — the original program challenge brief ("How will Gen Z find, believe in, and connect with the real people behind the things they love?").

### 🔬 Tier 3 — evidence & history (deep context)
11. **[`docs/research/interviews/FINAL-SUMMARY.md`](research/interviews/FINAL-SUMMARY.md)** — synthesis of 7 buyer/seller interviews (the demand evidence).
12. **[`docs/research/realness/`](research/realness/)** — 4 research threads (unfakeable signals, stated-vs-revealed preference, Gen-Z trust, Etsy business context).
13. **[`docs/01-foundation/realness-goal.md`](01-foundation/realness-goal.md)** — ⚠️ **HISTORICAL.** The earlier "In the Making / Proof-of-Batch" bet. Superseded by KOL v2. Read only for lineage, not current direction.

### 🧠 Memory (always-loaded cross-session state)
- **[`.claude/memory/DECISIONS.md`](../.claude/memory/DECISIONS.md)** — append-only architecture/strategy decision log with rationale.
- **[`.claude/memory/LONG-TERM.md`](../.claude/memory/LONG-TERM.md)** — cross-session facts, user prefs, current state.
- **[`CLAUDE.md`](../CLAUDE.md)** — project operating context (team, stack, rules).

---

## ⚠️ Do NOT rely on these (empty template scaffolds)
These generic-named files exist but are **unfilled templates** (headers + agent-instruction comments only) — they contain no real KOL content yet. Ignore them for onboarding until a session actually fills them:
`docs/01-foundation/VISION.md · BUSINESS_MODEL.md · TARGET_MARKET.md · PERSONAS.md` · `docs/02-competitive/POSITIONING.md · MOAT.md · LANDSCAPE.md` · `docs/03-system-design/ARCHITECTURE.md · TECH_STACK.md · API_CONTRACTS.md · DATABASE_SCHEMA.md` · `docs/04-features/ROADMAP.md · USER_STORIES.md` · `docs/05-marketing/GTM_STRATEGY.md · MESSAGING.md · CHANNELS.md · SEO_STRATEGY.md`.
*(The real, current equivalents are the `KOL-*` files in Tier 1.)*

## Current status (as of 2026-07-19)
- ✅ Phases 0–3 complete (concept lock · references · feature map · design-system specs).
- 🔄 **Design direction being reset** — the first palette/font direction was off. Adam curated a tight 5-reference set (Faire, Kotn, Lusion, Cuberto, TikTok Shop) as the operative design-token source: [`docs/research/references/`](research/references/README.md). Screenshots (committed) + videos (git-ignored) are being added there; Design-Lead redoes `KOL-design-system.md` from that set once explored.
- ⏭️ Next: finalize visual direction → Phase 4 (data model + AI/video engine specs) → Phase 5 (per-feature specs) → Phase 6 (build in `apps/kol/`).
