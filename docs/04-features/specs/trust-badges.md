# Feature Spec — Trust Badges (P11)

---

## Metadata

| Field | Value |
|---|---|
| **Feature Name** | Trust Badges (Real-Maker + AI-Transparency) |
| **Feature Slug** | trust-badges |
| **Status** | Draft |
| **Author** | CPO (Phase-5 spec worker) |
| **Reviewers** | CPO + CTO |
| **Created** | 2026-07-20 |
| **Last Updated** | 2026-07-20 |
| **Target Sprint** | Phase 5 — spec authoring (Batch 4, Trust & Anti-Slop) |

---

## Prioritization

**RICE Score**

| Factor | Score | Notes |
|--------|-------|-------|
| **Reach** | 9 | Renders on every product/store surface a buyer sees — 4 seed worlds + first cohort *(assumed — low confidence on cohort size)*; every buyer encounters the badge. |
| **Impact** | 3 | Massive — trust is KOL's core promise ("meet the human, trust them, and buy"). The two honest layers are the D7 mechanism for that trust. *(fact)* |
| **Confidence** | 85% | Data contract (`badges`, `verifications`, `maker.trust`) and the block are locked; the honesty rules are unambiguous. *(est.)* |
| **Effort** | 2 person-weeks *(ask CTO)* | `trust-badge` block render (2 variants × 4 states) + resolve logic over `maker.trust` + disclosure rendering. |
| **RICE Score** | (9 × 3 × 0.85) ÷ 2 ≈ **11.5** | Very high. |

**MoSCoW Classification:** Must Have.

**Why this priority?** Trust is the product's reason for being, and D7 requires every claim be provable in v1. The badge is where "trust must be honest" becomes concrete and visible to buyers.

---

## Overview

Trust badges render two honest trust layers on a maker's product/store surfaces (D7): a **Real-Maker** chip (a verified real human, anchored by their own voice) and an **AI-Transparency** chip (honest disclosure of where AI assisted vs. the maker's own work). The badge reads `maker.trust` from the store-config and always resolves to an honest state — `verified`, `pending`, or `unverified` — never a false or empty claim. It renders via the `trust-badge` block (block-catalog §8) in `inline-compact` and `expandable-detail` variants.

---

## Problem

KOL's whole promise is turning shopping *"from a transaction back into a relationship"* — buyers *"meet the human, trust them, and buy"* (concept-lock, what-KOL-is). That only works if the trust signals are real. The founder's non-negotiable is blunt: *"Trust must be honest. No claim we can't back (that's why 'product physically verified' is roadmap, not MVP)."* (concept-lock guardrails).

D7 splits trust into two provable layers: *"(1) Verified real human anchored by their own voice; (2) honest disclosure of where AI assisted vs maker's own. Every claim provable in v1."* (concept-lock D7). The risk the badge must structurally prevent is a **false claim** — a "verified" chip on a maker who isn't anchored, or an AI-drafted shop that hides its AI assistance. Both would break the trust the product is built on.

*(USER-INSIGHTS.md is empty — grounded in concept-lock D7 and the trust guardrail, not fabricated user quotes.)*

---

## Proposed Solution

Render the `trust-badge` block from `maker.trust`, resolving each layer to an honest state. Cited from block-catalog §8 and store-config §2.1.

**Real-Maker layer.** Resolve `maker.trust.realMaker.status` to one of `verified | pending | unverified`. `verified` is only shown when `voiceAnchorClipId` is resolved (non-null and pointing at a real clip); otherwise the badge shows `pending` — never a false verified claim. In `expandable-detail`, `verified` exposes a tap-to-hear the voice-anchor clip (the human speaking, the thing that anchors the claim).

**AI-Transparency layer.** Disclose verbatim from `maker.trust.aiTransparency.disclosure`, plus the exact `aiAssistedFields` (e.g. `copy`, `layout`, `palette`). The `level` (`maker-authored | ai-assisted | ai-drafted`) frames the chip. This is honest disclosure, not marketing — "Sena wrote every word. KOL's AI suggested the layout and picked the palette; Sena approved each section" (store-config §3 example).

**UX Flow:**

1. A buyer views a product page (or the store) carrying a `trust-badge` block.
2. The badge reads `maker.trust` and resolves both layers to their honest states.
3. `inline-compact` shows two small chips (Real-Maker state + AI-Transparency level).
4. Tapping/expanding (`expandable-detail`) reveals the full AI disclosure + `aiAssistedFields`, and — if Real-Maker is `verified` — a tap-to-hear the voice-anchor clip.
5. The buyer sees a provable, honest trust picture and can hear the maker's own voice.

---

## User Stories

- As a **buyer**, I want to know a real human made this and hear their voice, so I can trust who I'm buying from.
- As a **buyer**, I want to know exactly where AI helped build the shop, so the presentation never misleads me.
- As a **seller**, I want my Real-Maker verification and my honest AI disclosure shown accurately, so buyers trust me for the right reasons.
- As the **platform**, I want the badge to be structurally incapable of a false claim, so "trust must be honest" holds in every render.

---

## Acceptance Criteria

**Happy Path — verified Real-Maker + honest AI disclosure**
- Given `maker.trust.realMaker.status = "verified"` with a resolved `voiceAnchorClipId`, and an `aiTransparency` with `level:"ai-assisted"`, `disclosure`, and `aiAssistedFields:["layout","palette"]`, when the `trust-badge` renders, then the Real-Maker chip shows verified with a tap-to-hear the anchor clip, and the AI-Transparency chip shows the level and expands to the verbatim disclosure + the exact assisted fields.

**Real-Maker never claims false**
- Given `realMaker.status = "verified"` but `voiceAnchorClipId` is null/unresolved, when the badge resolves, then it renders `pending` ("Verification in progress"), never `verified` (store-config §2.1 rule; block-catalog §8 Error/Empty rows).
- Given `realMaker.status = "unverified"`, when the badge renders, then it shows the honest `unverified` state — not hidden, not implied verified.

**AI-Transparency discloses verbatim**
- Given an `aiTransparency.disclosure` string, when the badge renders, then the disclosure text is shown **verbatim** (the maker's/platform's honest words, not paraphrased or marketing-spun) and the `aiAssistedFields` are listed exactly.

**Always resolvable — never empty**
- Given any `maker.trust`, when the badge renders, then it always resolves to *some* honest state (verified / pending / unverified are all valid renders); the badge is never blank and never omitted for lack of a positive claim (block-catalog §8 Empty row).

**Loading State**
- Given the trust data is still loading, when the badge renders, then it shows skeleton chips with the disclosure text area reserved (no layout shift), per block-catalog §8 Loading.

**Error State — verification service unreachable**
- Given the verification service is unreachable, when the badge resolves the Real-Maker layer, then it shows `pending` ("Verification in progress") and never claims verified (block-catalog §8 Error).

**Edge Case — AI-Transparency writable by maker, Real-Maker not**
- Given a maker updates their `ai-transparency` disclosure, when it saves, then it persists (makers may write `ai-transparency` badges). Given a maker attempts to mint a `real-maker` badge, when it is attempted, then it is rejected unless a same-store verification is `verified` (service-role only) — enforced by `badges_real_maker_guard` (Part B §B4/§B0).

---

## UX / UI Notes

**Surface touched:** rendered on **seller shops** (the maker's product/store surfaces, `theme.kind:"custom"`, D15) and read by the buyer. The badge is content within a seller world, so the world's own theme applies; anti-slop for shops remains the AA gate + critic + approval (not a palette cap). KOL's own chrome around it stays curated.

**Block:** `trust-badge` (block-catalog §8), variants `inline-compact` (two small chips, for product-detail) and `expandable-detail` (chips expand to full disclosure + the voice-anchor clip). Reads `maker.trust` directly; disclosure copy is `aiTransparency.disclosure` verbatim; the anchor tap binds `bindings.clipTags → maker.trust.realMaker.voiceAnchorClipId`.

**4-state (mandatory — this is a rendered UI surface):**
- **Empty:** N/A in the void sense — trust *always* resolves to an honest state (`verified`/`pending`/`unverified` are all valid renders). The badge is never a blank frame (block-catalog §8).
- **Loading:** skeleton chips; disclosure text area reserved so nothing shifts when data resolves.
- **Error:** verification service unreachable → render `pending` ("Verification in progress"); never claim verified.
- **Success:** verified → Real-Maker chip + voice-anchor tap; AI-Transparency chip expands to the honest disclosure + `aiAssistedFields`.

**Key Interactions:**
- Expand `expandable-detail` → full disclosure + (if verified) tap-to-hear the anchor clip. Sound off until opt-in (the platform tone line) — the tap is the opt-in.
- `inline-compact` on product-detail sits alongside the add-to-cart area without competing with the film.

**Edge Cases:**
- Verified state but the anchor clip fails to load → the verified chip still renders (verification is real); the tap-to-hear degrades quietly to unavailable, not an error that hides the badge.
- A shop with no AI assistance at all → `level:"maker-authored"` with an honest "made entirely by the maker" disclosure (still a positive, honest render).

---

## Technical Requirements

### Backend Changes
- Resolve logic over `maker.trust` producing the two chip states; enforce the honesty rule (`verified` requires a resolved `voiceAnchorClipId`, else `pending`).
- Badge writes governed by the guard: makers may write `ai-transparency` badges; `real-maker` is verification-gated and **service-role only** (`badges_real_maker_guard` → `enforce_real_maker_badge`, which fires for all writers including service role and requires a same-store `verifications.status='verified'`) — Part B §B4/§B0.

### Frontend Changes
- `trust-badge` block render (P4 renderer path): `inline-compact` + `expandable-detail`, all 4 states per block-catalog §8. Tap-to-hear the anchor clip (opt-in). Verbatim disclosure rendering (no transformation of `disclosure`).

### Database Changes
- **Data need (Full tier — database-engineer before backend-engineer):** reads/writes `badges(kind badge_kind {real-maker | ai-transparency}, transparency_level ai_transparency_level, disclosure, ai_assisted_fields)` and `verifications` — per Part B §B4. Guard `badges_real_maker_guard` (see S9). No new tables/columns proposed. The verification lifecycle itself is owned by **S9** (`verification-real-maker.md`, W4) — this spec consumes its resolved state.

### External Services
- None directly. Verification resolution (which resolves `voiceAnchorClipId`) is S9's flow; the badge consumes the resolved value.

---

## Non-Functional Requirements

| Category | Requirement | Test Method |
|----------|-------------|-------------|
| **Honesty (core)** | The badge can never render `verified` without a resolved `voiceAnchorClipId`; AI disclosure is shown verbatim. | E2E across verified/pending/unverified + null-anchor cases; assert no false verified. |
| **Security** | `real-maker` badges are service-role only and require a same-store verified verification; makers can only write `ai-transparency`. | Guard test: maker attempts `real-maker` mint → rejected (Part B §B0). |
| **Accessibility** | Chips and expand control are keyboard navigable; the tap-to-hear control has an accessible label; disclosure text meets AA contrast within the world's theme (enforced by P9 AA gate). | axe-core audit + screen-reader walkthrough. |
| **Performance** | Badge resolves from `maker.trust` (already in the loaded config) — no extra round-trip in the happy path. | Render benchmark; verify no N+1 on trust data. |

---

## Dependencies

**Upstream Dependencies**

| Depends On | Type | Status | Risk If Delayed |
|-----------|------|--------|----------------|
| S9 verification (resolves `voiceAnchorClipId`; sets `realMaker.status`) | Feature | In Progress (Batch 3) | H |
| P3 store-config schema (`maker.trust`, §2.1) | Data | In Progress (Batch 1) | H |
| P4 store renderer (renders the `trust-badge` block) | Feature | In Progress (Batch 1) | M |
| `badges` + `verifications` tables + `badges_real_maker_guard` | Data | Not Started (Full) | H |

**Downstream Dependencies**

| What Depends on This | Team / Agent | Notified? | Notes |
|---------------------|-------------|-----------|-------|
| P10 human approval gate | backend-engineer | Yes | Publish precondition (c) = any Real-Maker `voiceAnchorClipId` resolved. |
| B6 product-page | frontend-engineer | Yes | Renders the inline-compact badge on the product page. |

---

## Out of Scope

- The verification **flow** that mints the Real-Maker badge and resolves the anchor — owned by **S9** (`verification-real-maker.md`, W4).
- Product-level provenance (role/materials/process) — owned by **P13** (`proof-of-product.md`) — a separate, product-scoped honest-trust surface, not the maker-identity badge.
- 3rd-party physical product verification — **roadmap** per D7 (concept-lock; explicitly not MVP).
- Auto-revocation of a minted `real-maker` badge when a later verification is rejected — **known-deferred (N4)**, not built in this phase (Part B §B5).

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Badge renders a false "verified" (broken trust) | L | H | Structural rule: `verified` requires a resolved `voiceAnchorClipId`, else `pending`; enforced in resolve logic + the DB guard. |
| Maker mints `real-maker` without verification | L | H | `badges_real_maker_guard` rejects it (fires for all writers incl. service role); makers can only write `ai-transparency` (Part B §B0). |
| A stale `real-maker` badge survives a later-rejected verification | M | M | Known-deferred (N4); documented as a hardening gap; not silently claimed as solved. |
| AI disclosure paraphrased into marketing spin | L | M | Disclosure rendered verbatim from `aiTransparency.disclosure`; no transformation. |

---

## Success Metrics

| Metric | Baseline | Target | Timeframe |
|---|---|---|---|
| False "verified" renders | N/A | 0 (structural) | Ongoing |
| Verified badges with a resolved, playable voice anchor | N/A | 100% of verified | At each publish |
| Buyers who expand the badge to view disclosure / hear the anchor | N/A | ≥ 25% *(assumed — low confidence)* | 30 days post launch |

---

## Rollout Plan

**Rollout Stages**

| Stage | Audience | Criteria to Advance | Duration |
|-------|----------|---------------------|----------|
| Internal Testing | 4 seed worlds (D12) | All 4 states render; no false verified; verbatim disclosure; guard enforced | 1–2 days |
| Private Beta | First seller cohort | Verified anchors play; disclosure clarity validated | 1 week |
| Full Launch | All shops | All prior stages pass | — |

**Feature Flag**
- Behind a feature flag? No — trust rendering is core to every product surface and must be honest by construction.

**Rollback Plan**
- Rollback trigger: any false-verified render discovered.
- Rollback decision maker: CTO.
- Rollback steps: fail-safe to `pending`/`unverified` rendering (honest degrade); patch resolve logic; re-enable verified rendering.
- Data impact: read-only rendering over `maker.trust`/`badges`; no data loss on rollback.

---

## Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| 1 | Exact copy for each honest state (verified / pending / unverified) and the AI levels — coordinate wording with Design-Lead so it reads as honest, not marketing. | CPO + Design-Lead | Build |
| 2 | N4 (no auto-revoke of `real-maker` on later-rejected verification) is known-deferred — confirm the interim honesty stance (does a rejected re-verification surface anywhere to the buyer, or is the stale badge simply left until the roadmap fix?). | CTO | Build |
| 3 | On which surfaces does `expandable-detail` vs `inline-compact` appear by default (product-detail = compact; store = expandable?) — confirm with B6/P4. | CPO | Build |

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-20 | Initial draft | CPO (Phase-5 spec worker) |

---

_Last updated: 2026-07-20 | Updated by: CPO (Phase-5 spec worker)_
