# R2 — Risk-Modeler cross-critique

**Verdict:** PROCEED_WITH_CONDITIONS (unchanged in enum; conditions materially strengthened)
**Changed from R1:** verdict no, condition set yes (three new FMs, one gate discipline change, one composition adoption)

---

## 1. Framing the R2 concern class

R1 concern was silent seller-apathy failure downstream of a beautiful demo. R2 concern is that the **selection bias in a 5-maker behavioral test is itself the silent failure** — a hand-recruited, willing sample cannot falsify "seller apathy" because seller apathy is by construction the population that will not opt into a two-week research pilot. This is the class broad-adversary named but did not label. It is the class the Etsy Studio failure was: fine in pilot, dead in wild. My R1 test rig (QR-sticker + shelf-mounted phone with n=5) is a good execution proof but a bad consent proof. Broad-adversary's cold-DM probe is a good consent proof but a bad execution proof. Running one without the other leaves the corresponding blind spot open. Both must run, in that order, with the cold-DM probe as the GO/PAUSE gate on the behavioral rig.

---

## 2. Cross-examination of broad-adversary's PAUSE thesis

Broad-adversary makes five sub-claims. I evaluate each on FM impact, not on rhetorical force.

| Sub-claim | My R1 position | R2 revision | New/updated FM |
|---|---|---|---|
| (1) Seller-apathy unfalsifiable in 2wk, Etsy Studio prior repeats | FM-2 (seller apathy) MEDIUM prob | Upgrade to HIGH prob. Etsy Studio + Video Story is a documented same-population failure; ignoring it is unjustified. | **FM-16** (Etsy-Studio-repeat-in-pilot) HIGH/HIGH |
| (2) Sora/Veo decay 12-18mo, C2PA shopper-illegible | Addressed via "identity-bound signed-at-source" HMAC-badge reframe (my R1) | Accept the reframe is a MEDIUM signal, not a solve. Trust-Graph is genuinely more decay-resistant BY CONSTRUCTION (social edges are not videos). | **FM-18** (durability-decay) MEDIUM/HIGH |
| (3) Frequency math ceilinged: 3x/yr × 3 pings = 9 opens, does not retire -11% habitual buyer | Not modeled | Add. Doesn't kill the concept but ceilings the panel-story ambition. If pitch claims "we fix frequency," the math is falsifiable on the whiteboard. | **FM-17** (frequency-ceiling-in-pitch) MEDIUM/HIGH |
| (4) MTO excludes ready-to-ship / POD / vintage / digital | FM-4 (batch producers unaddressed) MEDIUM/MEDIUM | Compose with customer-voice's Proof-of-Batch: reframe atom so batch is native, MTO is a special case. Upgrades severity of FM-4 only if we DON'T adopt Proof-of-Batch. | (updated FM-4) |
| (5) Trust-Graph is spine, In-the-Making is scene 1 | Not the spine question I addressed | Structurally correct on decay resistance. Cold-start risk is real but does not require a shipped graph in 7 days — the pitch spine can lead with the graph vision while the demo shows the wedge. Low-cost adoption. | (structural, not FM) |

**Conclusion on broad-adversary's PAUSE:** I do NOT flip to PAUSE. Broad-adversary's remedy — kill In-the-Making spine, rebuild around Trust-Graph — introduces a larger risk than the one it retires: Trust-Graph has no demoable atom in 7 days (cold-start = zero-vouch graph is empty on demo day). The correct move is a **pitch-narrative reordering** (Trust-Graph as spine, In-the-Making as scene 1) with **build unchanged**, plus **adopting broad-adversary's Day-4 consent probe as a pre-build gate**. This captures ~80% of the value of their PAUSE at ~10% of the cost.

---

## 3. Falsification-gate reconciliation

The R1 board proposed four overlapping tests. Reconciling into one coherent Day-4 through Day-7 plan:

### Day 3-4 — Cold-DM consent probe (broad-adversary's design, adopted as pre-build gate)

- **Instrument:** cold DM (no prior warm intro, no team affiliation revealed) to ≥25 Etsy makers across categories: 8 MTO custom, 8 batch, 5 quick-cycle (jewelry/leather), 4 slow-cycle (ceramics/wood).
- **Ask:** "Would you attach a QR sticker to each outgoing order and let a phone auto-capture 10-second clips at pack time in exchange for a 'Verified Capture' badge on your Etsy listings? No payment. No exclusivity. Reply YES / NO / TELL ME MORE."
- **Gate:** ≥60% YES or TELL-ME-MORE across the 25, with ≤$5 in-kind incentive (sticker+badge only, no cash), no more than 2/5 in slow-cycle refusing outright.
- **Kill:** <60% yes OR any yes conditioned on >$5 → **PAUSE** the ambient-rig build; escalate to Trust-Graph spine rebuild OR to Passive-capture-atom (my R1 minimum viable pivot). Adam pre-commits IN WRITING Day 3 (my R1 condition, unchanged).
- **Why this dominates my 5-maker test as a falsification gate:** it tests the population, not the willing sample. If we cannot get 15/25 unassisted yeses, the 5-maker behavioral test is measuring pilot-friendliness, not product-friendliness — the exact Etsy Studio failure mode.

### Day 5-6 — Behavioral rig test (my R1 design, retained as execution proof; runs ONLY if Day-4 gate passes)

- **Instrument:** ship QR-sticker + shelf-mounted phone rig to 5 makers who passed Day-4 (mix: 2 MTO, 2 batch, 1 quick-cycle). Rig captures 3 moments per order over 2 real orders each = 30 target clips.
- **Compose with customer-voice's Proof-of-Batch:** for batch makers, sticker = per-item token on the outbound package; shelf-phone captures ONE batch clip (12 candles being poured), plus a per-item pack-time reveal ("your item is #7 of this batch"). Adopted — the QR-rig is the identity-binding mechanism that makes Proof-of-Batch honest.
- **Gates (reconciled from architect + customer-voice + visionary):**
  - Capture completion: ≥60% of target clips delivered same-day (architect's bar, retained — customer-voice's ≥30% is too weak for a demo claim of "ambient")
  - Median maker time-per-clip: ≤30s (visionary's ≤30s dominates architect's ≤45s; if we claim "ambient" we own the tighter number)
  - Deferred capture: allowed within same calendar day, disallowed cross-day (architect)
- **Kill:** <60% capture OR median >30s OR ≥40% of clips are deferred cross-day → pivot to raw capture-atom (architect's R1 kill) OR to Trust-Graph spine (broad-adversary's KILL) — Adam picks Day-3 in writing.

### Day 6 — Buyer forced-choice test (strategist's design, retained)

- n≥10 Gen Z buyers, head-to-head listing pair: identical craft, one with "In the Making" thread + Verified Capture badge, one without, price parity → then repeat with target listing at +20% premium.
- **Gate:** ≥40% choose the badged listing at +20% premium.
- **Kill:** <40% → confirms the "premium evaporates on price" hypothesis; downgrade pitch claim from "buyer pays more" to "buyer converts more."

### Day 6-7 — Batch-reveal emotional-payload test (customer-voice's design, retained)

- Same n≥10 buyers: rate emotional payload of (A) per-order 3-moment thread vs (B) batch clip + per-item pack-time reveal.
- **Gate:** batch rated ≥50% of per-order payload.
- **Kill:** <50% → batch-producer story is dead; MTO-only demo, accept broad-adversary's MTO-scope-trap FM (strategist's R1) as unmitigated, and pre-empt the panel with an honest slide.

### One-page consolidated kill matrix

| Day | Test | Owner | PASS bar | FAIL action |
|---|---|---|---|---|
| 4 | Cold-DM ≥25 makers | broad-adversary design | ≥60% yes, ≤$5 incentive | PAUSE rig build; pivot to Trust-Graph or capture-atom |
| 5-6 | Ambient rig, 5 makers | risk-modeler design | ≥60% capture, median ≤30s, no cross-day defer >40% | Pivot per Day-3 pre-committed plan |
| 6 | Buyer forced-choice n≥10 | strategist design | ≥40% at +20% premium | Downgrade pitch claim, keep concept |
| 6-7 | Batch payload n≥10 | customer-voice design | Batch ≥50% of per-order payload | MTO-only demo, disclose scope |

All four gates must pass to ship the R1 pitch shape unmodified. Any single fail triggers a specific, pre-committed pivot — not a re-vote.

---

## 4. Updated FM ranking table

| Rank | FM | Severity | Probability | Source |
|---|---|---|---|---|
| 1 | **FM-16 Etsy-Studio-repeat-in-pilot** (concept demos with 5 willing, dies with cold-outbound population) | CRITICAL | HIGH | broad-adversary R1 (1) |
| 2 | **FM-2 Seller apathy** (upgraded from MEDIUM/MEDIUM) | HIGH | HIGH | R1, upgraded |
| 3 | **FM-1 Silent selection-bias failure** (5-maker sample is the willing) | HIGH | HIGH | R1 recast |
| 4 | **FM-4 Batch-producer exclusion** (mitigated if Proof-of-Batch adopted) | HIGH | MEDIUM | customer-voice R1 |
| 5 | **FM-3 MTO-scope panel trap** (Dina Murphy hears "boutique") | HIGH | MEDIUM | strategist R1 |
| 6 | **FM-18 Video-durability decay** (Sora/Veo 12-18mo, C2PA illegible) | MEDIUM | HIGH | broad-adversary R1 (2) |
| 7 | **FM-17 Frequency-ceiling in pitch** (3×3=9 opens does not retire -11%) | MEDIUM | HIGH | broad-adversary R1 (3) |
| 8 | **FM-5 Ambient is fiction** (10s/moment is not zero) | MEDIUM | HIGH | architect R1 |
| 9 | **FM-6 iOS PWA camera flake** | MEDIUM | MEDIUM | architect R1 |
| 10 | **FM-7 NY right-of-publicity, no model releases** | HIGH | LOW | architect R1 |
| 11 | **FM-8 Ceramics/slow-cycle arc broken** | MEDIUM | MEDIUM | architect R1 |
| 12 | **FM-9 Face-in-frame creepiness** | MEDIUM | MEDIUM | customer-voice R1 |
| 13 | **FM-10 Cosmetic-variance chargeback on reveal** | MEDIUM | LOW | customer-voice R1 |

Top-3 changed from R1: FM-16 is new and takes rank 1. FM-1 (my R1 top) drops to rank 3 as a recast of the same underlying failure class that broad-adversary named more precisely.

---

## 5. Top-3 mitigations (updated)

**Mitigation for FM-16 (Etsy-Studio-repeat) — adopt broad-adversary's Day-4 cold-DM probe as pre-build gate.**
- Where: inserted BEFORE my R1 QR-rig build. Day 3 afternoon.
- Cost: ~2 hours of DM writing + 24h response window. Zero LLM cost, zero build cost.
- Eliminates: the entire class of "we tested with 5 friends" false positives. If FM-16 is true, we know Day 4 not Day 10.

**Mitigation for FM-2/FM-1 (seller apathy + selection bias) — QR-sticker + shelf-mounted always-on phone rig, composed with Proof-of-Batch.**
- Where: my R1 mitigation, retained, with customer-voice composition. Day 5-6 build.
- Cost: ~$60 (25 QR stickers, 5 shelf mounts, use maker's own phone). 1 day of engineering.
- Eliminates: silent film-once-reuse gaming AND makes batch producers first-class (sticker = per-item token). Combined effect kills two FMs with one artifact.

**Mitigation for FM-18 + FM-17 (durability decay + frequency ceiling) — pitch-narrative reordering, not build change.**
- Where: pitch deck slide 1 leads with Trust-Graph as spine; In-the-Making is scene 1 of the spine. In-the-Making build unchanged.
- Cost: deck reorder only. Zero build cost. ~2 hours of narrative work.
- Eliminates: broad-adversary's structural PAUSE thesis at ~10% of its cost. Trust-Graph as spine gives us a decay-resistant (social not video) durability answer AND a frequency answer that scales beyond 3×N-orders (each vouch adds a graph edge, not an app-open).

---

## 6. Remaining dissent

Broad-adversary's PAUSE is not fully retired. Preserved dissent: **if the Day-4 cold-DM probe returns <60%, the correct action is not "rescope In-the-Making" but "kill the spine and rebuild around Trust-Graph."** I accept this as the pre-committed pivot rule. Adam signs Day 3.

Frequency-ceiling FM (FM-17) is a structural math problem that no build change can fix — only a narrative change can. If the panel challenges "9 opens/yr doesn't retire -11%," the honest answer is "correct — the frequency retirement comes from the Trust-Graph horizon, not this wedge." This must be in the pitch or it will be extracted by Q&A.
