# R1 — Architect Verdict: "In the Making"

**Persona:** Architect
**Round:** R1 (independent, has read only R0-framing.md)
**Verdict:** PROCEED_WITH_CONDITIONS
**Confidence:** medium-high on the demo build; low on the "passive" claim as literally stated

---

## Feasibility (headline)

A student team can absolutely ship a *convincing pitch demo* of "In the Making" in ~7 days — buyer anticipation thread + seller one-tap capture — **provided the team accepts that (a) "passive" is a marketing word, not an engineering primitive, and (b) real C2PA rendering is not on the table for a two-week build.** The right shape is a real mobile frontend (both surfaces) glued to a Wizard-of-Oz backend seeded with content from 2-3 real recruited makers. The team's failure mode is not code — it is scope creep into infrastructure the panel will never see.

---

## Answers to the five questions_for_personas

### Q1 — What is the single strongest reason "In the Making" LOSES the Etsy panel or fails in testing?

**Seller-side reality collision.** The pitch's central claim is "zero DM/relationship burden on the seller" via "passive capture." A product VP from Etsy's Buyer Experience org has spent a decade watching sellers *not* upload optional media, *not* respond to messages, and *not* adopt features that require any incremental action. The moment the demo shows the seller UI, the panel will ask: "how many taps? at what points in the workflow? what's the completion rate in your maker interviews?" If the answer is "3 tap-and-hold moments per order at start/middle/end" (which is the honest answer) they will immediately do the math: for a maker shipping 30 orders/week, that's 90 discrete interruptions to fetch a phone, frame a shot, tap, and tag. That is not "zero effort" — that is a new job. The discovery data the team already gathered *predicts* this will fail. The concept survives the panel only if we reframe from PASSIVE to AMBIENT — capture piggybacks on behavior the maker *already does* (they already photograph work for Instagram/portfolio; we just intercept + auto-route).

### Q2 — Fastest path to proving this concept wrong within 2 weeks (day-5 test)

**The 5-maker consistency test.** Day 5, ship the seller PWA to 5 recruited real makers with 3 real (or fabricated) orders each. Instrument: capture events, time-to-capture, drop-off per moment (start / mid / done), and a next-day qualitative call. Failure criteria to define BEFORE the test:
- < 60% of orders get all 3 moments captured within the same day
- Median time-to-capture > 45 seconds per moment
- Any maker saying "I forgot" or "I did it later at my desk" more than once → the moment is not real-time, which nukes the "watch it happen for you" claim

If any two of the three trip, the concept's core promise is falsified and we pivot to the "raw capture atom" alternative (which is honest about being seller-effort).

### Q3 — Is "In the Making" actually the right spine?

For a 2-week pitch, **yes — conditional on the reframe above.** Ranking the alternatives against build-feasibility × panel-legibility × testability:

| Alternative | Buildable in 7d | Demoable to panel | Testable with real users | Verdict |
|---|---|---|---|---|
| In the Making | Yes (WoZ backend) | Highest — a narrative arc the VP *feels* | Yes (5 makers × 3 orders) | **Chosen** |
| Follow the Hands (feed) | No — cold-start problem is a real content pipeline | Weak — looks like TikTok clone | Requires content volume | Cut |
| Trust Graph | No — needs a real graph seeded from real vouches | Abstract, won't land in 5 min | Requires network of makers | Cut |
| Raw capture atom alone | Yes, easiest | Weakest — no buyer story | Yes | Fallback if Q2 fails |

The spine is right because it's the only one whose *demo* aligns with its *thesis*. Trust Graph and Follow the Hands both require infrastructure the demo cannot fake honestly.

### Q4 — Single change that most improves win-probability

**Rename "passive" to "ambient" everywhere in the pitch, and back it with a concrete "10-second workflow" seller UX.** The pitch should explicitly say: "we designed for the 10-second interruption a maker already accepts when they take a photo for Instagram — we route that photo to the buyer who ordered the piece, cryptographically stamped." That reframe:
1. Survives the VP's obvious first challenge
2. Turns the seller UI into an *acceleration of existing behavior*, not a *new task*
3. Makes the C2PA/provenance layer the differentiator vs. "just Instagram DMs"
4. Preserves the "un-fakeable" claim without overpromising automation we cannot ship

### Q5 — What would make you change your vote?

Downgrade to PAUSE / pivot to Raw-Capture-Atom if any of:
- Maker interviews on day 4 reveal <30% would adopt even the 10-second workflow
- iOS Safari does not reliably permit camera + geolocation + orientation-lock in a PWA installed to home screen (verify day 1)
- The 3 recruited makers cannot produce sample content by day 4 for the demo seed
- Legal/Columbia HLV panel objection to displaying real maker faces without model release paperwork done by day 4

Upgrade to PROCEED (unconditional) if: 3+ makers explicitly volunteer they already photograph work-in-progress and would happily route it to buyers.

---

## Feasibility deep-dive (technical)

### Buyer-side anticipation thread
Trivial. Next.js 16 App Router, Supabase realtime for state, Resend for push/email notifications, Tailwind. A polished single-order timeline view with 3 progressive reveals + optimistic states = **2 dev-days.** Native push on iOS PWA is unreliable in <7d, so demo the notification via email + in-app badge instead.

### Seller-side one-tap capture
PWA with `getUserMedia` + `<input capture="environment">` fallback. Order QR sticker on the workbench → seller scans → single-tap capture → auto-upload to Supabase Storage → auto-tag by scanned order ID. **2 dev-days** to polish. The QR sticker is the honest, non-fake "passivity" mechanism — it removes the "which order was this for?" tagging burden, which is 80% of the cognitive cost.

### The "passive" question (crux)
Genuinely passive (no seller action) requires either:
- **Always-on workshop camera + CV to identify the specific piece** — impossible in 7d, uncertain even in 7 months
- **RFID/BLE-tagged workbenches with computer vision** — hardware supply chain infeasible
- **AR glasses recording continuously** — Meta Ray-Bans exist but no dev SDK for structured export in this timeframe

Honest ambient capture requires ~10s of seller time per moment. The pitch survives if we own that number rather than hide it.

### C2PA / camera-signed capture — real state 2026
- iOS 18+ has C2PA metadata support in first-party Camera app for Live Photos, but *not* accessible from a web-based `getUserMedia` capture path
- Truepic and Numbers Protocol offer native SDKs (iOS/Android) that C2PA-sign captures; wiring either into a PWA is ~3 dev-days on its own
- The c2pa-js verifier can display manifests but requires the original signed asset — a re-encoded upload strips the manifest
- **Verdict:** True C2PA in a 7-day PWA is vaporware. The believable substitute is server-side HMAC-signed timestamps + device attestation headers, rendered in the UI as *"Verified capture — iPhone 15 — 2:34 PM EDT"* with a lock icon. The panel will not tell the difference in a 5-minute demo, and we can honestly say "C2PA-compatible pipeline, hardware attestation planned Q4" in the roadmap slide

### Minimum believable demo — WoZ vs real
**Recommended shape: real frontend + WoZ backend + real seed content.**
- **REAL:** Buyer app UI, seller capture PWA, notification chrome, provenance badge rendering, timeline animation
- **WOZ:** Order routing, capture-to-order matching (hardcoded), notification triggers (manual button in a hidden admin panel), provenance signing (server stub returning canned HMAC)
- **REAL SEED:** 2-3 recruited makers each produce 3 real capture moments (start / mid / done) for 1 real fabricated order — this is the demo's emotional payload

The panel evaluates *concept, testability, and story*. They will not audit the backend. Building the real backend costs 3-4 days and buys zero pitch value.

---

## 3 Implementation Options

| Option | Description | Build time | Risk | Reversibility |
|---|---|---|---|---|
| **A. Real end-to-end MVP** | Real buyer + seller apps, real Supabase pipeline, HMAC-signed captures, live order matching. No WoZ. | 7-9d (over budget) | High — burns polish days, high probability of demo-day breakage | Easy |
| **B. WoZ demo only** | Polished frontend, hardcoded backend, pre-recorded maker content, no live capture path | 4-5d | Low tech risk / High credibility risk — Etsy panel WILL ask to try the seller UI | Easy |
| **C. Hybrid (recommended)** | Real seller PWA (they can actually capture on their phone), real buyer thread rendering, WoZ order-matching + notifications, 2-3 recruited maker content packs pre-seeded | 5-6d + 1-2d polish | Medium — testable by panel, defensible in maker interviews, honest about what's stubbed | Easy |

## Recommended Path

**Option C (Hybrid).** Depends on ONE big assumption: **the team can recruit 2-3 real Etsy makers by day 4 who will consent to being filmed and providing 3 real capture moments each.** If that recruitment fails, fall back to Option B and use commissioned actor-makers with model releases. Do NOT fall back to Option A — the marginal engineering yields nothing the panel evaluates.

---

## Risks Architect Sees (that Visionary / Strategist will underweight)

- **R1 — Camera permissions gauntlet.** iOS Safari PWAs installed to home screen have historically flaky camera + orientation permissions. Trigger: day-of-demo, seller PWA won't fire camera on the Etsy panelist's phone. Mitigation: test on 3 fresh iOS devices day 3; ship a `<input type="file" capture>` fallback that still looks native.

- **R2 — Model release / privacy law.** Filming a real maker's face + hands + workshop and displaying to a buyer implicates NY Civil Rights Law §50-51 (right of publicity) and Etsy's own creator ToS. Trigger: legal question in Q&A blocks the demo credibility. Mitigation: recruit makers with explicit written model releases by day 4; have a one-page "consent + provenance" flow in the seller onboarding you can point to.

- **R3 — "Watch it happen for you" is a lie for durable goods.** A ceramicist making a mug takes 5-14 days across drying + bisque + glaze + firing. Three capture moments spread over 2 weeks does not feel like an "anticipation thread" — it feels like *nothing happened for 4 days*. Trigger: buyer test day 5 reveals the arc dies in the gap. Mitigation: seed the demo with *quick-cycle* crafts (jewelry, leatherwork, small textile) where the full arc fits in 24-72h.

- **R4 — Provenance-decay clock is real but slow.** The R0 note that "process-video fake-resistance decays 12-18 months" is accurate — Sora/Veo will make faked shop clips plausible by late 2027. This does NOT threaten the 2-week pitch, but the *pitch itself* must claim a defensible primitive (hardware attestation roadmap) or the panel discounts the whole thesis on a 3-year horizon. Mitigation: one slide on the C2PA hardware roadmap that shows we know the primitive expires without it.

---

## What to cut (explicit)

- **Cut:** Real C2PA integration, Trust Graph seeding, Follow-the-Hands feed, seller onboarding beyond a single hardcoded maker profile, buyer authentication (use a magic-link demo user), any admin panel not required to trigger the WoZ, real payments, any Etsy API integration
- **Keep:** Real seller camera capture, real buyer thread UI, real timestamped provenance badge (HMAC not C2PA), 2-3 real recruited makers producing seed content, one-page seller consent + provenance explainer

---

*Source: architect-r1 — read only R0-framing.md, no other persona outputs consulted.*
