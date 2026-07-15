# R2 — Architect cross-critique

**Verdict:** PROCEED_WITH_CONDITIONS (hold from R1)
**Changed from R1:** No — but sharpened. I now argue Trust-Graph is **not build-feasible in 7 days** as a spine, which resolves the R1 structural question in favor of In-the-Making. I also **adopt Proof-of-Batch** as the atom and **partially adopt** risk-modeler's QR-sticker rig with a specific iOS-PWA caveat that neither R1 verdict addressed.

**Influenced by:**
- `risk-modeler-r1` — QR-sticker + shelf-phone rig is the single biggest buildability unlock in R1, but only if I resolve the iOS PWA background-camera constraint I flagged in R1.
- `customer-voice-r1` — Proof-of-Batch collapses the capture-burden math; I underestimated this in R1.
- `broad-adversary-r1` — forced me to actually score Trust-Graph on 7-day buildability rather than hand-wave "harder cold-start."
- `strategist-r1` + `visionary-r1` — three-rung ladder framing means I don't need to build Trust-Graph to *show* Trust-Graph.

---

## Buildability head-to-head (7 working days, student team, WoZ-allowed)

| Dimension | In-the-Making (spine) | Trust-Graph (spine) |
|---|---|---|
| Real assets needed for a credible demo | 1 maker + 1–3 buyers + 1 real batch order | ≥8–10 makers who **authentically know each other**, mutual vouches, real orders behind the vouches |
| Cold-start dependency | Linear: recruit maker → capture → thread | Recursive: recruit maker A → who invites B → who vouches for A → who invites C… |
| Recruitment days-at-risk | 1–2 days (already sourceable at Columbia; jewelry/candle/leather) | 4–6 days (vouch quality requires prior relationships; fabricating them reads fake to an Etsy panel) |
| UI surface to build | 2 screens (seller capture PWA, buyer thread) + 1 admin (WoZ orchestrator) | 3 screens (vouch flow, graph render, "why trust this seller" panel) + invite system + consent flow |
| Data model | `orders → captures[]` (trivial) | `makers ↔ vouches (m:n edges) + strength + witnessed_order_id` (graph, non-trivial for viz) |
| WoZ escape hatch | Yes — human posts pings from Slack behind the API | Weak — you can fake the graph, but the panel will ask "who are these people" |
| Failure mode if build slips | Ship 1 thread live in pitch (still lands) | Ship a graph with <5 nodes (looks like a school project) |
| Estimated build days (Sonnet-paced, ambient WoZ backend) | 4–5 days build + 2 days test | 6–8 days build + recruitment overhang |

**Honest verdict:** In-the-Making is the only spine with a demo I would bet on shipping by Day 10. Trust-Graph as spine is a **7-day miss with ≥60% probability**. Trust-Graph belongs on the roadmap slide (visionary-r1's "Human Provenance Network" ladder), NOT in the demo path.

This directly answers broad-adversary's "spine is wrong" thesis on feasibility grounds: even if Trust-Graph is the more defensible long-term primitive, it is not shippable in the window. The correct move is In-the-Making = spine, Trust-Graph = roadmap-slide-3.

---

## Does the QR-sticker + shelf-phone rig actually work on iOS PWA?

Risk-modeler's rig is the highest-leverage design move in R1. My R1 flagged iOS PWA camera as flaky. Reconciling:

**What the rig actually needs from the device:**
1. Foreground camera preview on a phone that stays on a shelf
2. Continuous QR-code scanning of stickers placed on in-progress items
3. On QR-detect: capture ~10s clip + tag to order + upload

**What iOS PWA can and cannot do:**
- ✅ Foreground camera via `getUserMedia` — works in iOS 16.4+ Safari PWA
- ✅ QR decoding via `BarcodeDetector` polyfill (jsQR) — works
- ❌ **Background camera / screen-lock capture — NOT supported**. Safari suspends the tab on lock or app-switch.
- ❌ Persistent "always-on" without user gesture — screen sleeps

**The unlock:** iOS **Guided Access** (Settings → Accessibility → Guided Access) locks the phone into the PWA with the screen always on. Maker triple-clicks the side button once at start of shift; phone becomes a single-app kiosk with continuous camera. This is a 30-second one-time setup per shift, not per order — it preserves the "zero-hands per order" claim.

**Verdict on the rig:** Buildable for the demo with **one added condition**: the demo maker's phone must be configured with Guided Access before Day 4 capture test. Ship a 5-step setup card in the seller onboarding. Do NOT claim "installs itself"; claim "one-time shift setup." A native app is Phase 2 (post-pitch).

**Second caveat that R1 missed:** per-order QR stickers require the maker to print stickers per order. For candles/jewelry batch-makers (customer-voice's cohort) this is trivial (existing pack workflow uses order slips). For solo commission makers it's friction. This is another reason to pick a **batch-producer** as the demo maker — the rig and Proof-of-Batch reinforce each other.

---

## Does Proof-of-Batch simplify or complicate the build?

**Simplifies (net win):**
- 1 batch capture serves 3–12 orders → collapses capture burden by an order of magnitude
- Aligns with existing maker workflow (batch-make → pack → ship)
- Removes the "3 captures per order" cadence problem I flagged in R1

**Complicates (manageable):**
- Data model needs `batch_clip (1) → order_items (N)` mapping — Supabase schema addition, ~2 hours
- Adds a "pack-tag" step: maker scans order QR against physical item at pack. This is a *new* moment but it's a moment the maker already performs (fulfillment); the QR just captures it.

**Net:** Proof-of-Batch **reduces total build risk** and makes the QR-sticker rig 12× more efficient. Adopt.

**One caveat:** the anticipation thread narrative shifts. "Made just after you ordered" becomes "made in the batch you're in." Customer-voice already priced this at ~1.4–2.2× return-loop vs 3× — I accept the honesty tax; a real 1.8× beats a fake 3×.

---

## Minimum believable demo (locked)

1. **1 real Columbia-area batch-maker** (candles or small-batch jewelry), recruited by Day 4
2. **Zero-hands rig deployed:** iPhone/iPad in Guided Access on a shelf; per-order QR stickers printed from the seller PWA
3. **3 real Gen Z buyers** order from the same batch on Day 5
4. **Ambient capture** of one batch-make session (~10s clip) + per-item pack-tag scans on Day 6–7
5. **Buyer anticipation thread** (WoZ-orchestrated pings from Slack behind the API) plays across Days 6–9
6. **Pitch day:** live buyer + live maker in the room; play the actual thread; show the batch-clip + per-item reveal; roadmap slide shows Follow-the-Hands + Trust-Graph as rungs 2 and 3

If any of steps 1–3 slips past Day 6: fall back to a pre-recorded "founder demo" of the same flow with a second maker recruited from the team's own network. Never demo an empty product.

---

## Updated conditions (delta from R1)

1. **Kill spine only if** Day-4 5-maker capture probe <60% same-day completion with the QR+shelf-phone rig **AND** batch-producer variant also fails. (Was: single-mode kill.)
2. **Adopt Proof-of-Batch** as the atom naming; retire "Made Just After You Ordered" (customer-voice-r1).
3. **Build the QR + Guided Access setup card** as a first-class demo artifact — the pitch is the rig, not the app.
4. **Do not build Trust-Graph.** Ship it on the roadmap slide only. Revisit at Phase 2 (post-pitch).
5. Keep my R1 conditions: HMAC-signed capture badge, model releases, 3-device PWA test, `<input capture>` fallback.

---

## Risks Architect still sees (unchanged from R1 unless noted)

- **[NEW] Guided Access configuration failure at demo maker's device** — trigger: first-time setup fails on maker's specific iOS version. Mitigation: pre-configure the device ourselves; hand it to them Day 4.
- **QR-sticker print pipeline** — trigger: maker's home printer produces low-contrast stickers that don't decode. Mitigation: pre-print a batch of 50 QR labels for the demo maker.
- **WoZ human-in-the-loop for pings** — trigger: team member forgets to send the Day 7 ping. Mitigation: Inngest scheduled function fires the ping; human only writes the copy.
- **Live-in-room demo failure** — trigger: real buyer no-shows pitch day. Mitigation: pre-recorded playback of the actual thread as fallback; live buyer is upside.
