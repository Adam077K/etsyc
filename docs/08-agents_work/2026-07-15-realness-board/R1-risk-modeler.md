# R1 — Risk-Modeler: FM Catalog for "In the Making"

## Framing: the concern class

The failure class I am most worried about is **silent-defeat by demo**: a pitch that survives Round 1 of judging because the video reel looks magical, but where two Etsy panelists in the room have already privately concluded (a) the seller-effort math does not close at 90M SKUs, or (b) the "unfakeable" claim decays before Etsy can ship it. That is a class of failure the team cannot see from inside the war-room, because it happens in judge silence. The second class is **testing-lie risk**: our own Day 5 user tests will look positive because the sample is a captive Columbia student pool with novelty bias — real Gen Z at scale will mute the notifications, which our test window is too short to detect.

Below: 12 FMs, ranked by probability x severity. FM-1 through FM-3 are the mitigation targets for the 7 remaining build days. This catalog covers both surfaces the CEO asked for — the 2-week PITCH bet AND the concept as a real product — and calls out which is which per FM.

---

## FM entries

### FM-1: Seller-effort at real scale — passive-capture is not passive
- **Trigger:** Buyer orders custom piece. Seller must remember to open the "In the Making" capture surface, aim a phone/webcam, start capture at the right moment, tag it to the right order, do it 2-3x per order across days of the make. At even 5 orders/week for a mid-tier seller, this is 10-15 discrete capture events. Discovery data already says sellers do "almost no interaction at all with the customer" — this asks them to do MORE, not less.
- **Blast radius:** Product-market fit. If sellers do not adopt, the whole spine collapses at scale even if the demo wins. Etsy panel will surface this in Q&A within 30 seconds. Also: the concept's core marketing claim ("zero DM/relationship burden") becomes a lie.
- **Detection:** Only detectable via a real seller diary study of ≥5 makers over ≥5 days. NOT detectable in a single-session lab test.
- **Recovery:** Requires a genuinely passive capture primitive (always-on-during-work-hours webcam with on-device event detection, or a physical smart-shelf trigger). None of these are buildable in 7 days.
- **Probability:** HIGH — the discovery evidence is direct and unambiguous ("almost no interaction at all"). Sellers who did not DM will not film.
- **Severity:** CRITICAL — this failure mode is the concept's founding contradiction. If it fires, the pitch loses on the deepest research finding of the entire discovery phase.
- **Surface:** BOTH (product AND pitch).

### FM-2: AI-video decay curve kills "unfakeable" claim by launch
- **Trigger:** Grounding facts already state fake-resistance decays ~12-18mo (Veo/Sora improving). Etsy ships nothing in <12mo. By the time "In the Making" reaches production traffic, generative video can produce a plausible timestamped hand-making clip end-to-end. Attacker: dropshipper generates the "make" video, uploads via the seller-facing capture tool.
- **Blast radius:** The entire differentiation collapses. Etsy is left with a feature that FEELS like proof but is legally/factually not. Worse than shipping nothing, because it manufactures a false-security signal that Etsy will be liable for when the first "faked realness" scandal breaks in TechCrunch.
- **Detection:** Post-hoc only — by definition, a good fake is not detected. First detection = first press incident.
- **Recovery:** Requires hardware-attested capture (C2PA at camera-firmware level, e.g. Sony/Nikon C2PA cameras or Truepic SDK on mobile with attestation). C2PA today is shopper-illegible; making it shopper-legible is one of the concept's own claimed innovations.
- **Probability:** HIGH — this is not speculative, it is a forecast the CEO already grounded. Sora/Veo trajectory is public.
- **Severity:** HIGH — kills the "un-fakeable" claim, which is the strongest verbal hook in the pitch. A judge who knows Sora will ask this in the first 60 seconds.
- **Surface:** BOTH. For the pitch, this is a KILL question in Q&A. For the product, this is a 12-mo half-life.

### FM-3: Pitch demo cannot show retention payoff in 4-6 minutes
- **Trigger:** The whole thesis is FREQUENCY — the 3x return loop of "started -> in progress -> done" pushing buyers back into the app. But that payoff plays out over days, not minutes. In a pitch you can either (a) fake the timelapse (which is intellectually incoherent with an "unfakeable" pitch — the judges will notice), or (b) show a 4-min video reel of "here is what the buyer sees over 3 days" and hope the panel imagines the retention lift. Neither demonstrates the return loop.
- **Blast radius:** The pitch's #1 quantitative claim (3x return, addresses habitual-buyer -11% YoY) becomes unfalsifiable narrative. Panel scores drop.
- **Detection:** Pre-detectable — this is a demo design problem, not a runtime failure.
- **Recovery:** Requires either a live pre-recorded reveal sequence (real Columbia maker actually made a real item, real buyer got real 3 pings over Jul 15-22, we play back real anticipation-thread state at pitch), OR a compressed-time interactive demo where the panel scrubs a timeline. Option A is time-tight but possible.
- **Probability:** HIGH — this is a certainty unless mitigated by pitch design. Baseline demo will fail this.
- **Severity:** HIGH — the pitch does not lose to hostile Qs, it loses to a shrug. "Cool but I don't see the retention math."
- **Surface:** PITCH.

### FM-4: Buyers mute the pings within 2 orders
- **Trigger:** Gen Z notification-fatigue baseline. 2-3 pings per order, on an app they open ~3x/year. First order = novelty. Second order = "oh, this again." Push-permission revoke or in-app mute. The frequency claim inverts — the very mechanism becomes friction.
- **Blast radius:** The 3x return loop degrades to 1.3x within 60 days. FREQUENCY thesis (Etsy's actual wound) is not fixed.
- **Detection:** Requires a 30-60 day cohort test. NOT detectable in the 2-week window at all.
- **Recovery:** Adaptive cadence (max 1 ping/order default, buyer-configurable), lock-screen-native reveal (silent update to app icon badge / lock-screen widget instead of push), or make the anticipation thread a destination the buyer opts into checking rather than a push stream.
- **Probability:** MEDIUM — depends on execution of notification design; not automatic doom but the default outcome.
- **Severity:** HIGH — undermines the frequency thesis at real product surface.
- **Surface:** PRODUCT (invisible to pitch; the panel will not detect this).

### FM-5: Passive-capture + C2PA rendering is not feasible in a student prototype
- **Trigger:** The demo needs a working capture surface that produces a C2PA-signed asset and renders provenance as plain English at point-of-search. This is 3 non-trivial engineering artifacts (capture UX for maker, signing pipeline, buyer-side provenance renderer) in 7 days with a student team. Realistic slippage on any one leaves the demo as PowerPoint.
- **Blast radius:** Pitch degrades from "we built it and it works" to "we designed it and here is a Figma." Kills the "make something you would use yourself" mandate.
- **Detection:** Detectable NOW by an honest engineering audit (see architect R1).
- **Recovery:** Descope to a Wizard-of-Oz capture (real seller films on phone, team manually stamps a C2PA-styled overlay, real buyer sees real result in real app skin). Judges will not know it was manual if the seed data is real.
- **Probability:** HIGH — student team, 7 days, 3 artifacts.
- **Severity:** HIGH — turns a build-and-test pitch into a design pitch, which loses against any team that shipped real code.
- **Surface:** PITCH (primarily). Product-side is a longer engineering problem.

### FM-6: Sellers game the make-moments (staged / batched / recycled clips)
- **Trigger:** Seller has 8 orders for the same ceramic mug. Films ONE make session, reuses the clip labeled with 8 different buyer names. Or: films a "in-progress" clip once, reuses across all orders. The proof-of-human becomes proof-of-a-human-once.
- **Blast radius:** "Made just after you ordered / for YOUR specific piece" becomes false. Once one buyer finds their clip is identical to another's (Reddit finds it in a week), the trust primitive dies AND is worse than never having claimed it.
- **Detection:** Requires perceptual-hash dedup + buyer-side per-order asset uniqueness verification. Not in the R1 build spec.
- **Recovery:** Enforce per-order uniqueness via a nonce/QR-code the seller must include in-frame at capture time (issued at order confirmation, expires at fulfillment). Similar pattern to trust-spec nonce replay prevention.
- **Probability:** HIGH — sellers optimize for effort; if the system permits reuse, reuse will dominate at scale within 3 months.
- **Severity:** HIGH — same class as FM-2 but caused by sellers not attackers.
- **Surface:** PRODUCT (partially visible in pitch if a judge asks "what stops reuse").

### FM-7: Privacy — maker's hands, home, kids in frame
- **Trigger:** Passive capture runs during real work. Real work happens in kitchens, garages, home studios. Kids walk through. Spouse's face is captured. Address-identifying background (a mailbox visible through a window). GDPR/CCPA implications; Etsy is subject to both.
- **Blast radius:** Single incident of a child's face in a "In the Making" clip that reaches a buyer = news story + regulatory exposure. Also chills seller adoption — makers with home studios will decline the feature (which is most of them, per Etsy's ~$8k median seller revenue = home-based).
- **Detection:** Requires on-device face-detection blur + audit UI. NOT in the R1 build.
- **Recovery:** On-device face-blur (Apple Vision framework / MediaPipe), maker-side preview-and-approve step (breaks the "passive" claim but only slightly), studio-only mode fallback.
- **Probability:** MEDIUM — depends on adoption base; higher for the home-based majority.
- **Severity:** HIGH — regulatory + reputational, and Etsy panel will ask this within 3 questions (Dina Murphy is Buyer Experience VP; her legal counterpart will have flagged this feature class before).
- **Surface:** BOTH. Panel-visible.

### FM-8: Etsy panel latches on "not on our roadmap infrastructure" and disengages
- **Trigger:** The concept requires Etsy to invest in a capture SDK, a C2PA rendering pipeline in search results, and seller device attestation. None of these are on Etsy's public 2026 roadmap. Panel does the mental math and concludes: "cool student concept, 3-year build for us, not shipping this year, next pitch."
- **Blast radius:** Loses on pragmatism. Panel scores "feasibility" low even if "vision" is high.
- **Detection:** Pre-detectable by reading Etsy's stated 2026 product priorities and mapping concept surface area against them.
- **Recovery:** Frame the pitch as a phased rollout — Phase 1 is opt-in seller pilot on existing Etsy mobile (no C2PA required, uses "Etsy Verified Capture" badge as an internal cryptographic signature not shopper-facing C2PA). Phase 2 introduces C2PA when industry-ready. Makes the ask 6mo not 3yr.
- **Probability:** MEDIUM — depends on how the pitch frames the ask.
- **Severity:** HIGH — a "cool but not for us" is functionally a loss.
- **Surface:** PITCH.

### FM-9: Testing lie — Day 5 Columbia test shows false positive
- **Trigger:** Team runs testing with 6-10 Columbia students plus 2-3 makers found via campus network. Novelty bias + social-desirability bias in a face-to-face test = 8/10 "yes I would love this" responses. Team ships the pitch citing this as validation. Etsy panel does not believe soft "would you use it" signal.
- **Blast radius:** The test that was supposed to de-risk the pitch actually inflates confidence. Team defends the concept in Q&A using data that a panelist recognizes as methodologically weak.
- **Detection:** Pre-detectable — the test design itself is the failure. Ask: "would this test find us wrong?"
- **Recovery:** Reframe Day 5 test as a Wizard-of-Oz *seller* diary study: 2-3 makers, 5 days, do they actually capture? Behavioral not stated preference. Buyer side: not "would you use" but "here is a real thread from a real order 3 days ago, tell us what you noticed / would you check again."
- **Probability:** HIGH — this is the default outcome without intervention.
- **Severity:** MEDIUM — degrades pitch credibility but not fatal on its own.
- **Surface:** PITCH.

### FM-10: "Made just after you ordered" collides with existing lead-time reality
- **Trigger:** Many Etsy makers batch-produce. Custom orders often use pre-made components (blanks, findings, dyed fabric). The claim "made JUST after you ordered" is either false (parts already existed) or slows fulfillment for makers who batch. Etsy already has a "made to order" flag — this concept assumes all handmade is made-to-order which is not true.
- **Blast radius:** Concept applies to a subset of Etsy inventory (est. 20-40% at most). Pitch overreaches; panel notices.
- **Detection:** Detectable by cross-checking Etsy category taxonomy against "true made-to-order" vs "assembly of pre-made components."
- **Recovery:** Position "In the Making" as opt-in for made-to-order sellers only; explicitly a wedge, not a marketplace-wide feature.
- **Probability:** MEDIUM — depends on how strongly the pitch claims universality.
- **Severity:** MEDIUM — trims the TAM claim but not fatal.
- **Surface:** BOTH.

### FM-11: The winning teams pitch cheaper, shippable versions
- **Trigger:** Other Columbia teams pitch the "romantic connection" product the CEO's reframe explicitly avoids. Judges reward familiar-shipping-Q4 concepts over ambitious 3-year infrastructure bets. Etsy panel's incentive is a pitch they can send to their PM team next week, not next roadmap cycle.
- **Blast radius:** Concept wins on originality, loses on adoptability. Third place.
- **Detection:** Judge-incentive pre-analysis; look at past HLV winners for pattern.
- **Recovery:** Ensure Phase 1 of the phased-rollout pitch (per FM-8 mitigation) is genuinely 90-day shippable on existing Etsy infrastructure.
- **Probability:** MEDIUM.
- **Severity:** MEDIUM.
- **Surface:** PITCH.

### FM-12: Plan abandonment mid-week — team rethinks concept on Day 8
- **Trigger:** Day 5 tests come back soft (per FM-9 mitigation, hopefully behavioral). Team panics, restarts concept work. Loses 2 days. Ships an under-cooked hybrid pitch.
- **Blast radius:** Neither the original concept nor the pivot get properly built. Third-place structural pattern.
- **Detection:** Requires a pre-committed stopping-point protocol: what evidence WOULD cause pivot? Written before test. Default = ship the plan.
- **Recovery:** Adam pre-commits on Day 4 (in writing) what test signal on Day 5 would trigger pivot vs continue. Anything less than that threshold = ship In the Making.
- **Probability:** MEDIUM — student teams in high-stakes pitches historically do this.
- **Severity:** HIGH — abandonment mid-week is worse than either "ship the plan" or "pivot early."
- **Surface:** PITCH.

---

## Ranking table

| Rank | FM | Severity | Probability | Product (S x P) |
|------|-----|----------|-------------|-----------------|
| 1 | FM-1 seller-effort-at-scale | CRITICAL | HIGH | CRIT-HIGH |
| 2 | FM-2 AI-video decay kills unfakeable | HIGH | HIGH | HIGH-HIGH |
| 3 | FM-3 pitch cannot demo retention in 4-6 min | HIGH | HIGH | HIGH-HIGH |
| 4 | FM-5 C2PA + passive-capture prototype infeasibility | HIGH | HIGH | HIGH-HIGH |
| 5 | FM-6 sellers game the make-moments (reuse) | HIGH | HIGH | HIGH-HIGH |
| 6 | FM-9 Day-5 test false positive | MEDIUM | HIGH | MED-HIGH |
| 7 | FM-4 buyers mute the pings | HIGH | MEDIUM | HIGH-MED |
| 8 | FM-7 privacy of hands/home/kids | HIGH | MEDIUM | HIGH-MED |
| 9 | FM-8 "not on our roadmap" panel disengagement | HIGH | MEDIUM | HIGH-MED |
| 10 | FM-12 plan abandonment Day 8 | HIGH | MEDIUM | HIGH-MED |
| 11 | FM-10 made-to-order taxonomy mismatch | MEDIUM | MEDIUM | MED-MED |
| 12 | FM-11 winning teams ship cheaper | MEDIUM | MEDIUM | MED-MED |

---

## Top-3 mitigations (pull forward to Day 4)

### Mitigation for FM-1 (seller-effort-at-scale)
- **Name:** "Zero-hands capture" — pre-order QR sticker + shelf-mounted phone. Seller sticks a per-order QR on the workbench at start; phone (mounted, always-on during work hours) auto-detects QR entry/exit to bracket capture. Zero taps.
- **Where in plan:** Day 4 build spec. Replace "seller opens capture app" with "seller sticks QR." Test in Day 5 seller diary.
- **Cost:** ~0 code (phone webcam + open-source QR detector). 1 physical prop (adhesive QR label printer, $50). No LLM.
- **Eliminates:** Reduces (does not eliminate) FM-1 to MEDIUM/MEDIUM. The QR itself must be applied — that's still one seller action per order — but 1 action vs 10-15 is a 15x reduction. Also enables per-order uniqueness (mitigates FM-6).

### Mitigation for FM-2 (AI-video decay)
- **Name:** Reframe the claim from "unfakeable" to "signed-at-source with named seller accountability." Do not fight Sora; make the primitive be *identity binding* (this signed clip is bound to seller_id; if faked, seller loses store). Add C2PA where camera supports it; do not lead with it.
- **Where in plan:** Pitch narrative (Day 6 rehearsal) + concept sentence at top of deck.
- **Cost:** Zero engineering. Copy change.
- **Eliminates:** Removes the Sora-KILL question from Q&A. Reframes to accountability-model that survives 3-5 years. Downgrades FM-2 to LOW/MEDIUM.

### Mitigation for FM-3 (demo cannot show retention)
- **Name:** "Live real-time reveal." Start a real Etsy order today (Day 4). Real Columbia maker, real Columbia buyer, real 3-ping cadence Jul 15-22. On pitch day, open the real buyer's real app and show the real thread state. Panel sees a real artifact, not a video reel. If pitch is before Jul 22, compress to 48-hour cycle with a real fast-turn item (candle, print, bracelet).
- **Where in plan:** Day 4 kickoff — recruit real maker + real buyer TODAY.
- **Cost:** ~$50 (buy the real item). 2 hours coordination.
- **Eliminates:** FM-3 entirely. Also generates FM-9 mitigation data (behavioral, not stated preference).

---

## Answers to R0 questions_for_personas (prose)

**Q1: Single strongest reason "In the Making" LOSES the panel or fails in testing?**
FM-1 — the seller-effort contradiction. The pitch's founding evidence (sellers do "almost no interaction at all") is the exact behavior the concept requires MORE of. A panelist who has read Etsy's seller-support tickets will see this in the first slide. It loses on the strongest data the team has.

**Q2: Fastest path to proving this concept wrong within 2 weeks — what test on Day 5?**
A seller behavioral diary study. Not "would you use this" — instead: give 3 real Etsy makers a real capture setup (even Wizard-of-Oz, the QR + shelf-phone rig from the FM-1 mitigation) and tell them "capture for the next 5 orders however works for you." Count actual capture events. If <60% of orders get captured across 5 days, the concept is falsified. This is behavioral, cheap, and runs in the window.

**Q3: Is "In the Making" actually the right spine, or is Follow-the-Hands / Trust-Graph / raw capture-atom stronger?**
"In the Making" is the strongest DEMO spine because it has a natural narrative arc (start / progress / done). It is NOT the strongest PRODUCT spine — Trust-Graph is more defensible long-term. But we are pitching, not shipping. The right move: pitch "In the Making" as Phase 1, name Trust-Graph explicitly as the 18-month scale path. This mitigates FM-8 (roadmap disengagement) and captures the strongest of both.

**Q4: Single change that most improves win-probability?**
The live real-time reveal (FM-3 mitigation). One real maker, one real buyer, real order started Day 4, real thread state shown on pitch day. It converts every abstract claim in the pitch to a concrete artifact. This single change addresses FM-3, generates the data for FM-9, and gives the panel something no other team will have: a live artifact.

**Q5: What would make me change my vote?**
- Vote UP toward PROCEED (from PROCEED_WITH_CONDITIONS): a signed commitment from Adam that Day 5 seller diary is behavioral (not stated-preference) AND the live-reveal is booked with real people by end of Day 4.
- Vote DOWN toward PAUSE: if by end of Day 4 the team has not recruited real seller + buyer for the live-reveal, FM-3 becomes unmitigated and the pitch drops back to a shrug-risk. In that case, PAUSE and re-scope to a smaller feasible demo.

---

## Confidence: HIGH
The failure modes here map 1:1 onto the R0 grounding facts and the discovery data the CEO already commissioned. This is not speculation — it is the CEO's own evidence re-projected forward.
