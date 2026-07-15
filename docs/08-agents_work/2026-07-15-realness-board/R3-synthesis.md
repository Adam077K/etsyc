# R3 — Synthesizer Lock: "In the Making" pitch bet

**Round:** R3 (fresh-context synthesis)
**Synthesizer:** synthesizer-routine (Opus)
**Inputs:** R0-framing.md, R1-digest.md, R2-digest.md — nothing else
**Final verdict:** PROCEED_WITH_CONDITIONS
**Tally entering R3:** 6× PROCEED_WITH_CONDITIONS (broad-adversary moved PAUSE→PWC in R2). No KILL, no remaining PAUSE.

---

## The decision the board split on — RESOLVED

Two things were entangled and are now separated:

1. **What we BUILD** — unanimous by R2. In-the-Making + Proof-of-Batch. Trust-Graph is a ≥60% build-miss from cold-start (needs 8–10 connected makers vs In-the-Making's 1 maker + 3 buyers) and cannot be demoed in a 10-minute panel. **We do NOT build Trust-Graph.** (architect-r2, risk-modeler-r2)

2. **What we LEAD THE PITCH WITH** — the contested axis. Three positions:
   - **Lead with In-the-Making** (strategist): Dina Murphy owns *Buyer Experience*; Trust-Graph lives in *marketplace-integrity*, outside her portfolio. A champion who has to hand the idea to another VP does not champion it. Trust-Graph is undemoable cold.
   - **Lead with the primitive / Trust-Graph** (customer-voice, broad-adversary, risk-modeler): customer-pain scored 3–0 for Trust-Graph; the −11% habitual-buyer wound is *invisible* to In-the-Making; the frequency ceiling (per-order ≈ max 9 app-opens/yr) is unpatchable by anything we build — only by narrative.
   - **Reconciliation** (visionary): the real primitive is **identity-bound reputation staked per artifact/vouch** — "Sora can't fake the consequences of getting caught." In-the-Making = the *felt* expression (build/demo). Trust-Graph = the *durable* expression (roadmap). Same slide, not sequential.

### The lock: visionary's reconciliation, with the strategist's constraint binding the build.

**Slide 1 names the PRIMITIVE, not the wedge.** The category is "Identity-Bound Commerce: The Human Provenance Network." On that same slide, two expressions of the one primitive appear together: **In-the-Making (felt — what we build and demo)** and **Trust-Graph (durable — roadmap)**. Follow-the-Hands (frequent) sits as Horizon-3.

This is the only architecture that satisfies **both** binding constraints simultaneously:

- **Dina-Murphy-championing constraint (strategist) is honored** because the thing we *build, demo, and hand her* is In-the-Making — a buyer-facing product squarely inside her Buyer Experience portfolio. She is never asked to champion a marketplace-integrity system she'd have to hand off. The demo artifact is hers to own.
- **Frequency-wound constraint (customer-voice / broad-adversary / risk-modeler) is honored** because the wound is *narrative-only-addressable*. Frequency is order-count-ceilinged; no build retires the −11% habitual-buyer decline. So the pitch must carry that story in words, and it does — by leading with the *primitive* (which spans browse-time trust and repeat-visit reputation via Trust-Graph on the roadmap) rather than with the In-the-Making wedge alone. Leading with the wedge would strand the −11% wound; leading with the primitive picks it up.

Naming the primitive on slide 1 also absorbs the broad-adversary's strongest concession from R2: "identity-bound named-seller accountability *is* Trust-Graph's substance under another label." We are not demoting Trust-Graph — we are stating its substance as the category thesis and shipping its first felt instance.

**The pitch opens on Dina Murphy's brand-vs-product coherence gap** (the "Celebrate Being Human" 2026 campaign makes a claim the marketplace cannot currently enforce) **fused with the −11% habitual-buyer wound** — not on buyer emotion (strategist-r1, customer-voice-r2). That single opening carries both constraints into the room.

---

## Locked decisions

**D1 — Pitch architecture.** Slide 1 names the primitive (Identity-Bound Commerce / Human Provenance Network). In-the-Making (felt) and Trust-Graph (durable) appear as two expressions of it on the same slide; Follow-the-Hands is Horizon-3. Open on the Dina Murphy coherence gap + the −11% habitual-buyer wound. *Source: visionary-r2 (reconciliation) bounded by strategist-r2 (Dina portfolio constraint). Reversibility: hard.*

**D2 — Build scope.** Build In-the-Making + Proof-of-Batch only. DO NOT build Trust-Graph (roadmap slide only). *Source: architect-r2. Reversibility: hard.*

**D3 — Proof-of-Batch reframe.** Retire "Made Just After You Ordered" (operationally false for batch-producers). The atom is a batch clip + per-item tag at pack — honest copy: "made in a batch we filmed; yours is #7 of 12." Expands addressable scope ~35% and is a net build-risk *reduction* (12× capture efficiency, small Supabase 1:N schema). *Source: customer-voice-r1, architect-r2. Reversibility: reversible.*

**D4 — Capture rig.** Zero-hands-per-order rig: per-order QR sticker + shelf-mounted always-on phone in iOS Guided Access kiosk mode. One sticker per order (~15× less seller effort), kills both the seller-effort objection and film-once-reuse gaming with one artifact. Per-item QR token composes with Proof-of-Batch ("your candle is #7"). *Source: risk-modeler-r1, architect-r2. Reversibility: reversible.*

**D5 — Provenance badge.** HMAC-signed "Verified capture — iPhone, 2:34 PM" badge in the 7-day build (real C2PA is not exposable in a mobile PWA in the window). C2PA is a Phase-2 roadmap slide with a 6-month ask, not 3-year. Reframe the primitive from "unfakeable video" to "identity-bound, signed-at-source, named-seller accountability" (fake = lose your store). *Source: architect-r1, risk-modeler-r1. Reversibility: reversible.*

**D6 — Two-gate test plan.** Run BOTH gates — they are complementary (consent-proof vs execution-proof), not redundant. See Test Plan below. *Source: risk-modeler-r2, broad-adversary-r2. Reversibility: reversible.*

**D7 — Written pre-committed pivot triggers.** Adam signs the pivot triggers IN WRITING on Day 3, BEFORE the Day-4 probe runs (removes motivated reasoning after data lands). Triggers: cold-DM probe <60% unassisted-yes → kill In-the-Making spine, rebuild around Trust-Graph; capture rig <60% by order 3 → pivot to capture-atom or Follow-the-Hands feed-first per pre-commit. *Source: risk-modeler-r1. Reversibility: irreversible (pre-commitment is the point).*

**D8 — Privacy stack.** Hands-only capture as default, face opt-in (not creepy). On-device face-blur + preview-approve before any clip is sent to the buyer. Model releases collected (NY right-of-publicity). *Source: customer-voice-r1, risk-modeler-r1, architect-r1. Reversibility: reversible.*

**D9 — Honest return-loop number.** State ~1.4–2.2× return loop, NOT 3×. Add a finished-piece reveal ping to manage cosmetic-variance chargebacks. An inflated 3× claim invites the panel to falsify the whole deck; the honest range survives scrutiny. *Source: customer-voice-r1. Reversibility: reversible.*

---

## Test plan (with numeric thresholds and fail actions)

**Gate 1 — Day-4 cold-DM maker-consent probe (THE population falsifier).**
Cold-DM ≥25 real makers. Threshold: ≥60% unassisted "yes" to capture, WITHOUT any incentive >$5. This tests the population, not a hand-picked n=1 — it is the direct falsifier of the near-zero-seller-effort claim that Etsy Studio / Video Story already failed on.
Fail action: probe <60% unassisted-yes OR yes contingent on >$5 incentive → **kill the In-the-Making spine, rebuild the pitch around hand-seeded Trust-Graph** (D7 pre-commit).

**Gate 2 — Day-5/6 behavioral capture rig (execution-proof).**
Recruit ≥1 real Columbia batch-maker + 3 real Gen Z buyers for the live demo; aim ≥5 makers × 3+ unassisted captures by Day 9. Threshold: ≥60% same-day 3-moment capture completion by order 3, median ≤45s/clip, no deferred capture. Guided-Access shelf phone + WoZ (Inngest-fired) ping thread over Days 6–9; 3-device PWA test + `<input capture>` fallback.
Fail action: <60% capture OR median >45s OR deferred capture → pivot to raw capture-atom or Follow-the-Hands feed-first per D7.

**Gate 3 — Day-5 buyer forced-choice at +20% price premium.**
n=10 buyers, head-to-head with a verified-capture item priced 20% above an unverified equivalent. Threshold: ≥40% choose the verified item at the premium.
Fail action: <40% → the "real" premium evaporates on comparison; reframe demo so head-to-head price comparison never happens (design the moment, not the discount).

**Gate 4 — Day-5 Priya-analog lapsed-buyer test (the −11% wound, directly).**
3 lapsed habitual buyers shown a Trust-Graph mock at browse. Threshold: ≥2 say "I'd come back for this."
Fail action: <2 → the frequency/repeat-visit narrative is unsupported; downgrade the Trust-Graph roadmap claim and lean the deck harder on first-purchase trust rather than repeat.

---

## Preserved dissent — broad-adversary (ended at PWC, thesis retained)

**Thesis:** Trust-Graph is the true durable spine, not In-the-Making. The frequency math is order-count-ceilinged — a 3×/yr buyer yields at best ~9 app-opens/yr and does NOT retire the −11% habitual-buyer decline; near-zero-seller-effort is unfalsifiable in two weeks at n=1 (Etsy already failed seller-video products on the *same* apathy); and the durability primitive (process video) has a public expiration as Sora/Veo close the gap in 12–18 months while C2PA stays shopper-illegible today. In-the-Making rebuilds parasocial "connection" in armor while the generatively-AI-resistant primitive (identity-bound reputation propagating through humans) is relegated to a roadmap.

**Why overruled (not erased):** The R3 lock adopts the *substance* of this thesis — slide 1 names the identity-bound-reputation primitive, and the frequency wound is carried by narrative because it is unpatchable by build. What is rejected is making Trust-Graph the *build/demo* spine, because it is undemoable cold in a 7-day window and sits outside the sponsoring VP's portfolio. The dissent is honored structurally by Gate 1 (the population falsifier the adversary demanded) with Adam's pre-signed kill trigger.

**Vindication conditions:**
- Day-4 cold-DM probe returns <60% unassisted-yes → the spine flips to Trust-Graph, adversary vindicated.
- Capture rig <60% by order 3 across ≥5 makers → seller-apathy thesis confirmed.
- No Sora/Veo decay answer that survives without leaning on shopper-illegible C2PA → durability thesis confirmed; Trust-Graph becomes the only defensible moat.
- Post-pitch: In-the-Making app-opens plateau at ≤ order-count while Trust-Graph browse-time trust drives the repeat-visit lift → frequency-ceiling thesis confirmed.

---

## Open questions deferred

- Follow-the-Hands feed (Horizon-3 frequency swing) — design deferred past the pitch window.
- C2PA Phase-2 productionization and the exact 6-month ask framing.
- The rehearsed honest answer to "what about the other 60% of makers who won't capture?" — script before pitch day.
- The Sora-in-2028 answer that does NOT rely on C2PA — must be in the moat slide, not improvised.
- Dina Murphy 12-month public-statement portfolio-fit confirmation (broad-adversary-r1 condition) — verify before finalizing slide 1 language.
