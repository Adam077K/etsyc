# Voice-Anchored Real-Human Verification (S9 / Real-Maker badge) — Research Brief
*researcher · 2026-07-20 · session `ceo-phase5` · Overall confidence: MEDIUM (approaches/threat-model HIGH from primary+academic; 3rd-party vendor pricing MEDIUM — comparison sites, not official quotes)*

## The load-bearing distinction
The cheap, self-serve, mature "liveness / IDV" market is almost entirely **face** liveness anchored on an **ID document** (AWS, Azure, Persona, Stripe, Veriff). **"Voice as the anchor" is not how these vendors are built.** S9 has two separable jobs; conflating them is where honest-trust breaks:
- **Security layer** — "is a *live real human* present, not a photo/replay/deepfake?" → liveness/PAD.
- **Anchor layer** — "is there a persistent, human-recognizable signature (their voice) tied to this maker?" → the *product* purpose of the voice clip; `voice_anchor_clip_id` is a reproducible artifact. **Not by itself a security control.**

The honest MVP treats **voice as the anchor** and a **liveness/challenge control as the security**, and never claims legal identity.

## Threat model (HIGH confidence)
- Speaker-verification spoofing has 4 vectors — impersonation, voice conversion, TTS, replay — all mountable with off-the-shelf tools (ASVspoof, [arxiv 2210.02437](https://arxiv.org/pdf/2210.02437)).
- Passive liveness (invisible) is the industry direction; active challenge-response (say a random phrase) doubles as PAD **and** as the voice-anchor capture. iBeta PAD L1 = <$30 attacks, L2 = <$300 3D masks (enterprise benchmark).
- **Injection attacks** (virtual camera / SDK hook feeding a synthetic stream) bypass the sensor; liveness gives "limited protection." Only multi-signal fusion (device + SDK integrity + frame auth + AI deepfake analysis) is robust. **Browser capture is materially easier to inject than a hardened native mobile SDK** ([deepidv.com 2026](https://www.deepidv.com/media/articles/deepfake-injection-attacks-bypass-identity-verification-2026)).

## Vendor cost & integration reality
| Vendor / approach | Rough cost | Self-serve? | Notes |
|---|---|---|---|
| AWS Rekognition Face Liveness | ~$0.015/check | Yes, API-first | Face liveness only (no voice, no identity) |
| Azure AI Face Liveness | ~$0.015/check; 30k/mo free | API but **gated** (intake form for prod) | Face liveness only |
| Stripe Identity | ~$1.50/verification | Yes, very API-first | Doc+selfie+liveness+match = *legal identity* |
| Persona | ~$1.50/KYC; ~$250/mo Essential | Yes, self-serve+API | Configurable flows |
| Veriff | ~$0.80/verification | Yes | Lowest published bundled IDV |
| Onfido/Entrust | ~$2.25; ~$50k–200k/yr | Enterprise quote | Overkill for MVP |
| iProov | Enterprise quote | Enterprise | Best-in-class injection/deepfake resistance |
| **Pindrop** (voice/audio deepfake) | Enterprise quote | API, enterprise | The only category that actually scores **voice** liveness (~99% known, >90% unseen, <1% FPR). Overkill for MVP |

*Structural finding (HIGH): cheap self-serve liveness is face-only; bundled IDV anchors on face+document; genuine voice liveness is enterprise-only. **"Voice-anchored" verification is a build, not a buy** for KOL's framing.*

## MVP recommendation (phased)
- **Phase 0 — Seeded 4 makers (now): pure human-in-the-loop, no vendor.** Founder runs a live video call, or reviews a recorded challenge-response clip (maker says a KOL-generated random phrase on camera); confirms a real, specific person; the clip becomes `voice_anchor_clip_id`; mint the badge manually. Fully honest and defensible at n=4, zero vendor cost, ships immediately, satisfies the publish precondition. **→ S9 is NOT blocked for the seeded MVP.**
- **Phase 1 — early real-maker scale (dozens→hundreds): automate capture, keep human review on flags.** Native-first challenge-response capture (prefer mobile SDK over browser — browser is the injection soft target); random phrase on camera → face+voice+prompt evidence + the anchor in one step. Add cheap passive **face-liveness** (~$0.015/check AWS or Azure) as the anti-spoof gate. Manual review queue for low-confidence scores.
- **Phase 2 — add only if abuse appears:** bundled IDV (Veriff ~$0.80 / Stripe or Persona ~$1.50) *if* the badge must assert legal identity; voice-match/audio-deepfake (Pindrop-tier) *if* voice-clone farming becomes measured. **Do not pre-buy.**

**Honest claim vs security theater:** Defensible now — "a live, real human recorded this, and we hold a reproducible voice anchor for them." Do NOT claim — "this maker is the specific named person / made this product" (needs document identity + product provenance, which S9 explicitly excludes). Don't let a face-liveness pass masquerade as identity or authorship.

## Open decisions for the founder (Adam)
1. **What does the badge assert?** "Live real human + persistent voice anchor" (cheap, low-friction, honest, no document) — **recommended for MVP** — vs "legally verified named identity" (Persona/Stripe/Veriff, KYC-grade, more friction). Core honest-trust call.
2. **Voice's role: anchor or security?** Recommend **anchor** (community-audible consistency; security via video liveness). Voice-as-security means committing to enterprise audio-deepfake tooling (Pindrop).
3. **Build-cheap vs buy-bundled at scale:** self-host $0.015 face-liveness + own challenge-response voice capture vs buy bundled IDV. Ties to #1.
4. **Friction & cadence:** one-time at first publish (recommended for MVP) vs periodic re-anchoring; and the liveness-confidence threshold that routes to human review vs auto-pass.

## Gaps
- No self-serve/API vendor natively productizes "voice-anchored" human verification (voice as primary anchor) — build-not-buy for KOL.
- iProov / Pindrop have no public per-check pricing (enterprise quote-based).
- Persona/Veriff/Onfido per-check prices are from comparison sites, not official quote pages — order-of-magnitude; verify at contract time.

*Full source list (23 URLs) in the session transcript. Key primary sources: AWS/Azure pricing pages, ASVspoof (arxiv), deepidv.com injection-attack analysis, regulaforensics/veridas liveness, Pindrop capability pages.*
