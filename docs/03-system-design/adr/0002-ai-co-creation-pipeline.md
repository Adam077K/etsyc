# ADR-0002: AI Co-Creation Pipeline — brand-to-store derivation, load-bearing auto-critic, human gate

> Architecture Decision Record for the KOL seller pipeline (D8) and anti-slop system (D9), reframed by D15. Companion to the full spec: [`KOL-ai-pipeline-spec.md`](../KOL-ai-pipeline-spec.md).

---

## Header

| Field | Value |
|-------|-------|
| **ADR Number** | 0002 |
| **Title** | AI co-creation pipeline: derive a coherent custom design system per shop, gate quality with a deterministic-contrast + LLM-coherence critic and a section-by-section human approval |
| **Date** | 2026-07-19 |
| **Status** | Proposed |
| **Deciders** | ai-engineer (author), CTO (Phase 4 engines), Design-Lead / database-engineer (schema-amendment sign-off), QA-Lead (contrast gate) |

---

## Context

D8 locks the seller journey as a **co-creation loop**: explainer → adaptive AI interview → AI drafts a store as a JSON config → maker co-edits → approves section-by-section → publishes. D9 locks a **3-layer anti-slop system**. **D15 then moved the load-bearing weight**: seller shops get *full* brand freedom (any colors, any fonts, any vibe), so palette-capping — the original D9 "layer 1" quality guarantee — is **forbidden** for shops. The quality floor now rests on two things that used to be backstops: (2) an automated design-critic and (3) the human approval gate. The concept lock states this explicitly: "the AI pipeline needs a robust *brand input → coherent custom design system* derivation step AND a genuinely excellent critic with automated contrast/coherence enforcement — these are now load-bearing, not backstops."

This forces three architectural decisions that no earlier doc resolved:

1. **How does unstructured interview input become a coherent, *custom* (uncapped) design system, and then a schema-valid store-config?** The store-config schema (§2.2) currently constrains `theme.paletteId`/`fontPairingId` to curated **enums** — the pre-D15 rail. That representation cannot express D15 freedom. We must design a representation that can, without editing the schema doc (owned by Design-Lead / database-engineer).
2. **How is quality *guaranteed* rather than hoped for, once palette-capping is gone?** With any-color freedom, accessibility (contrast) is no longer free. A generic LLM "does this look good?" judge is non-deterministic and can pass an inaccessible design.
3. **How do we stop an infinite regeneration loop** and hand off to a human without publishing slop?

Every LLM feature in this pipeline must also ship, per the worker contract, with an **eval harness** and **per-call cost logging** — non-negotiable.

---

## Decision

Build a five-stage pipeline — **Interview → Extraction → Design Derivation → Auto-Critic → Human Gate** — in which:

1. The interview runs a **fixed beat-sheet with a bounded adaptive follow-up framework** and a single transcript source (film or voice), persisting to `interviews` / `interview_answers`.
2. Extraction produces a typed **brand profile** (structured JSON), the sole input to design.
3. Design derivation emits a **coherent custom design system** (palette of *any* colors, type, motion, atmosphere — not capped to the 5 KOL palettes) and maps it into a **schema-valid store-config** via a proposed `theme` amendment that accepts *either* a curated `paletteId` (KOL's own worlds / template starting points) *or* a `customPalette` + `customPairing` object (seller shops).
4. The auto-critic runs a **deterministic WCAG AA contrast hard gate** (computed, not LLM-judged) *before* any LLM coherence score is allowed to matter, then an LLM hierarchy/coherence/fit score. A bounded **regen loop (max 3 iterations)** escalates to a human when it cannot clear the bar. `criticScore` persists to `store_versions.critic_score`.
5. The human approves **section-by-section**; approvals persist to `store_versions.approved_sections` (blockId array); publish requires the deterministic gate PASS + every rendered block approved.

The proposed schema amendment is documented as a clearly-marked, sign-off-required section in the spec and raised as an open question — **this ADR does not modify `store-config.schema.md`.**

---

## Rationale

**Why we chose this:**

1. **It honors D15 without abandoning the "never slop" floor.** Freedom (any palette/font) and quality (accessible, coherent, maker-approved) are made compatible by moving the guarantee from *input constraint* to *output verification*. The critic + human gate carry the bar the palette cap used to carry.
2. **The contrast gate is deterministic, so accessibility cannot regress silently.** WCAG AA is a computed ratio (§1.4.3 / §1.4.11), not an aesthetic opinion. Making it a hard gate *before* the LLM score means no amount of "it looks nice" can ship an inaccessible design — the exact failure mode any-color freedom introduces.
3. **A typed brand profile decouples the two hardest LLM jobs** (understanding a human vs. designing for one) so each can be evaled, cached, and improved independently, and so the design step is deterministic-in, deterministic-out enough to test.
4. **A bounded regen loop with human escalation** makes the load-bearing critic safe: it can neither loop forever (cost) nor auto-publish below-bar work (quality). The human is the final author (D8, D10 "never AI does it for you").

**What we're trading off:**

- **The critic becomes a single point of quality failure.** If the critic is miscalibrated it either ships slop (false negative) or over-rejects good custom work (false positive) — the latter directly attacks D15's promise of freedom. We accept this and mitigate with a labelled slop-set eval measuring *both* precision and recall (spec §8c).
- **Design derivation is the most expensive LLM call** (we route it to Opus). We accept the cost because it is the load-bearing coherence step and runs a few times per shop, not per request; prompt caching and a Sonnet fallback bound the exposure.
- **The proposed `theme` amendment adds a discriminated union to the schema**, increasing validator and renderer complexity vs. a flat enum. We accept this as the irreducible cost of D15 freedom.

---

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **A — Chosen: typed brand profile → custom design system → schema-valid config, deterministic-AA-then-LLM critic, bounded regen, human gate** | Honors D15 freedom; accessibility guaranteed by computation; each LLM stage independently evaluable; no infinite loop; human stays author | Critic is load-bearing (single failure point); design step is costly; schema needs a union amendment |
| **B — Keep the curated palette cap (pre-D15 D9 layer 1)** | Simplest; quality trivially bounded; no critic risk | **Violates D15 — forbidden.** Palette-capping seller shops is the flattening the product exists to fight |
| **C — Single monolithic LLM call: transcript → finished store-config** | Fewest moving parts; one prompt | Untestable (no intermediate to eval); no place to enforce deterministic contrast; hallucination and slop uncontrolled; can't cache; can't isolate regressions |
| **D — Pure-LLM critic ("rate this design 1–10")** for the whole quality bar | Simple; flexible | Non-deterministic on accessibility — can pass an inaccessible design; not auditable; can't prove the AA floor in v1 (violates "no claim we can't back") |
| **E — Human-only quality (no auto-critic), rely on maker approval alone** | No critic-calibration risk | Makers are not designers; "AI takes the slack" (D8) fails; regressions and contrast errors reach the human unfiltered; contradicts D9's structural guarantee |

---

## Consequences

**Positive:**
- Seller shops can use **any** palette/type/vibe (D15) while every published shop provably meets WCAG AA and a coherence bar.
- The AA floor is **computed and auditable** — a real, defensible trust claim (aligns with D7's "every claim provable in v1").
- Each LLM feature (interview, extraction, derivation, copy, critic-coherence) has an isolated eval + cost log; regressions are caught before deploy.
- The pipeline shares an eval-harness and cost-log schema shape with the video engine (Workstream C), so the two converge instead of forking.

**Negative:**
- The critic must be **calibrated and continuously eval'd** against a labelled slop set, or it silently degrades quality or freedom. This is ongoing work, not one-time.
- The proposed `theme` union **must be accepted by the schema owner** before the renderer and validator can implement it; until then, seller-shop configs cannot validate. Tracked as an open question / blocker-if-rejected.
- Design derivation on Opus adds cost per draft/regen; mitigated but non-zero.

**Neutral:**
- Video tagging stays owned by Workstream C (P7). This pipeline only *references* `videos.id`; untagged footage at draft time follows a defined handoff (spec §9) and cannot be published bound to `hero-video`.
- Custom fonts resolve against a broad hosted font catalog (hundreds of families), not arbitrary uploaded font files in MVP (font upload = roadmap); this is "any font" for practical purposes and is noted as an open question.

---

## References

- `.claude/memory/DECISIONS.md` — D15 (seller-shop design freedom), D9 (3-layer anti-slop), D8 (co-creation loop)
- `docs/01-foundation/KOL-v2-concept-lock.md` — D8, D9, D10/D11, **D15**, D16
- `docs/03-system-design/store-config.schema.md` — §2.2 `theme` (the enum tension), §2.3 `media`, §2.6 `blocks`, §2.7 `meta`
- `docs/04-features/KOL-feature-tree.md` — S2/S3/S4/S6, P8/P9/P10, §5 seller pipeline flow
- Full spec: `docs/03-system-design/KOL-ai-pipeline-spec.md`
- WCAG 2.1 SC 1.4.3 (Contrast Minimum), SC 1.4.11 (Non-text Contrast)

---

## Implementation Checklist

- [x] Status is set to **Proposed**
- [x] At least **2 real alternatives** listed (A–E)
- [x] Both **positive and negative consequences** documented
- [x] An entry added to **`.claude/memory/DECISIONS.md`** (see session file handoff — CEO/lead appends on merge)
- [ ] All **Deciders** notified — schema-amendment sign-off from Design-Lead / database-engineer pending
- [ ] Linked from `docs/03-system-design/ARCHITECTURE.md` or the relevant feature spec
- [ ] Impacted agents informed (Workstream C on shared harness + footage handoff; QA-Lead on the AA gate)

---

_Last updated: 2026-07-19 | Updated by: ai-engineer (session ai-engineer-kol-ai-pipeline)_
