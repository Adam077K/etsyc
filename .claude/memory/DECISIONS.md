# Architecture & Strategy Decisions
*Append-only. 50-entry cap — archive to `DECISIONS_ARCHIVE.md` when full.*

> Empty template. Every C-suite agent appends one entry per significant decision
> using the format below. Workers do not write here.

---

## Format

```markdown
## YYYY-MM-DD — [Decision title]

**Context:** Why this came up.
**Options considered:** A / B / C with one-line trade-offs.
**Decision:** What we chose.
**Rationale:** Why this option won.
**Reversibility:** reversible | hard-to-reverse | irreversible
**Owner:** [agent name]
**Affects:** [list of agents / domains downstream]
```

---

<!-- Entries below this line, most-recent first. -->

## 2026-07-15 — Interview corpus (7 recordings) independently corroborates the locked "In the Making" bet

**Context:** Transcribed files 06–07 and produced `FINAL-SUMMARY.md` across all 7 recordings, then cross-checked it against the already-locked "In the Making" / Proof-of-Batch bet (entries below) — which the parallel `ceo-realness` workstream locked earlier today off the same `SYNTHESIS.md`.
**Finding:** The interview evidence supports the locked reframe with no contradiction. Say/do gap, "authenticity = not a scam," seller apathy (*"almost no interaction at all with the customer"*), and price-defection all argue **against** a relationship product and **for** a low-seller-effort, buyer-visible proof-of-human. This is exactly the bet.
**One tension logged (not a reversal):** the interviews show the **seller** as the higher-pain, lower-alternative user (05/06), which naively reads as "build seller-side tooling." The board already adjudicated this via the Dina-Murphy-portfolio constraint — build the **buyer-side** In-the-Making experience and keep seller effort near-zero. The interviews reinforce *why* seller effort must be near-zero (apathy is real and fatal to seller-chore products), not that we should flip the wedge seller-side. No change to D1–D9.
**New material:** file 06 = a founder product-thesis monologue (leans seller-tooling — a pre-board framing) usable as pitch problem-articulation; file 07 = pitch-delivery craft. Neither is buyer-demand evidence.
**Reversibility:** reversible (evidence/documentation log).
**Owner:** ceo (session `ceo-columbia-5-6-transcripts`)
**Affects:** cmo (may quote interview lines in the deck), cpo (crux framing), research-lead (the gate interviews in `docs/00-inbox/ACTIONS-2026-07-15-interviews.md`). Full reasoning: `docs/research/interviews/FINAL-SUMMARY.md`.

## 2026-07-15 — Board verdict: PROCEED_WITH_CONDITIONS on "In the Making" (6-persona board, R0→R3)

**Context:** Stress-tested the locked pitch bet via full board-meeting protocol before committing the 7 remaining build days. 6 personas, R1 independent → R2 cross-critique → R3 fresh-context synthesis.
**Verdict:** PROCEED_WITH_CONDITIONS. R1: 5 PROCEED_WITH_CONDITIONS + 1 PAUSE (broad-adversary). R2: broad-adversary moved to PWC → unanimous. R3 locked 9 decisions.
**Locked (R3):** (D1) Pitch architecture — slide 1 names the PRIMITIVE "Identity-Bound Commerce / Human Provenance Network"; In-the-Making = felt/demo expression + Trust-Graph = durable/roadmap expression on same slide; open on Dina Murphy coherence-gap + −11% habitual-buyer wound. (D2) Build In-the-Making + Proof-of-Batch ONLY; never build Trust-Graph (>60% cold-start miss). (D3) Retire "Made Just After You Ordered" → **Proof-of-Batch** ("yours is #7 of 12"). (D4) Zero-hands QR-sticker + shelf-phone (iOS Guided Access) rig. (D5) HMAC "Verified capture" badge now, C2PA roadmap-only; reframe "unfakeable video" → "identity-bound named-seller accountability." (D6) Two complementary gates. (D7 IRREVERSIBLE) Adam pre-commits pivot triggers IN WRITING Day 3. (D8) Hands-only + face-blur + preview-approve privacy. (D9) Honest return loop ~1.4–2.2× not 3×.
**Preserved dissent (broad-adversary):** Trust-Graph is the true durable spine; In-the-Making frequency is order-count-ceilinged; vindicated if Day-4 probe <60% OR capture <60% OR no Sora-decay answer without C2PA.
**Reversibility:** hard (D1/D2), irreversible (D7 pivot pre-commit)
**Owner:** ceo-realness
**Affects:** cpo/design-lead (build In-the-Making + Proof-of-Batch), research (Day-4/5 gates), cmo (deck: primitive-first), Founder (D7 written pre-commit)
**Sources:** docs/08-agents_work/2026-07-15-realness-board/ (R0-framing, R1-digest, R2-digest, R3-synthesis + 12 per-persona files)

## 2026-07-15 — Goal locked: "In the Making" (Made Just After You Ordered)

**Context:** After 4-thread research + divergent brainstorm across sides/pains, needed a single pitch spine for the 2-week HLV build.
**Options considered:** Follow-the-Hands (feed / biggest frequency swing, hard to demo) / Made-Just-After (make-my-thing progress loop, most demoable + deepest proof) / Trust-Graph (most defensible + on-brief Q4, worst cold-start).
**Decision:** Crown **"In the Making"** (Made Just After) as spine/hero; Follow-the-Hands + Trust-Graph become "the system it scales into." Passive process clip is the shared atom.
**Rationale:** Best proof×frequency×demoability for a 2-week prototype; resolves the core logic gap (proof is one-time, frequency needs recurrence) with one asset.
**Reversibility:** hard-to-reverse (whole pitch now orients here; revisit only if crux tests fail)
**Owner:** ceo-realness
**Affects:** cpo/design-lead (prototype), research (crux validation), cmo (pitch narrative)
**Crux to validate (days 5-9):** seller-effort-at-scale · buyer return-pull · proof legibility & fake-resistance. Full goal: docs/01-foundation/realness-goal.md

## 2026-07-15 — Realness Question: contrarian "unfakeable proof-of-human" reframe

**Context:** HLV × Etsy challenge (Columbia, Jul 13-24). Brief poses the romantic framing: Gen Z craves realness, AI killed proof, so build ways to find/believe/connect with makers. Our own discovery synthesis (5 interviews) contradicts the romantic version.
**Options considered:** A) Romantic framing — build maker-connection/storytelling features (what every other team will pitch). B) Contrarian framing — old signals dead + connection features die on seller apathy + price beats virtue, so build a NEW unfakeable trust signal at point-of-discovery requiring ~zero seller labor. C) Pure anti-fraud/verification play.
**Decision:** Pursue B as the working thesis, grounded in three findings: stated≫revealed preference, connection absent-by-design on Etsy, "authenticity"="not a scam."
**Rationale:** It's the only lane the data supports AND that differentiates from the obvious pitches. Reframe = "unfakeable, discovery-time, zero-seller-effort proof-of-human."
**Reversibility:** reversible (working thesis, pre-brainstorm)
**Owner:** ceo-realness
**Affects:** research-lead, cpo, design-lead, cmo — all downstream brainstorm/pitch work
**Research dispatched:** 4 parallel researchers → docs/research/realness/ (01 unfakeable-signals, 02 stated-vs-revealed, 03 genz-trust-behavior, 04 etsy-business-context). Grill + brainstorm to follow synthesis.

## 2026-07-14 — The name "Etsyc" must be abandoned (AWAITING FOUNDER SIGN-OFF)

**Context:** Before running seller outreach, the CEO commissioned a trademark check on "Etsyc" /
etsyc.com. The outreach plan would have put the name on a sending domain, a survey form, and
hundreds of emails to Etsy sellers.

**Findings (all sourced, HIGH confidence):**
- Etsy's Trademark Policy prohibits exactly this construction, verbatim: *"DON'T use the Etsy Marks
  or a term confusingly similar to 'Etsy' in the name of your company, organization, domain name,
  or trademark"* and *"DON'T alter, distort, or modify the Etsy Marks, including adding other terms
  to the Etsy Marks to create new words."*
- ETSY is a registered USPTO word mark (Reg. 3,297,913, registered 2007, renewed).
- WIPO **D2025-1536** (2025): `etsyuniverse.com` held confusingly similar for wholly adopting the
  mark plus a common term — **transferred to Etsy**. Near-on-point for `etsyc.com`.
- The 2008 case that Etsy *lost* (`etsey.com`, NAF FA0810001222645) turned solely on the domain
  predating Etsy's trademark rights. That defence is unavailable now.
- **The real kill switch is not litigation — it is the API.** Etsy's API Terms require app names to
  comply with the Trademark Policy; developers are documented as having API keys rejected for
  including "etsy" in the app name, silently and with no appeal. Etsyc's product depends on that API.
- Nominative fair use does NOT protect a mark inside your own brand name (New Kids 3-part test,
  prong 2 and 3). It DOES protect *"a tool for Etsy sellers"* as a descriptive tagline.
- **eRank was originally "EtsyRank"** and rebranded. No major incumbent (EverBee, Alura, Marmalead,
  Sale Samurai, Vela) uses "Etsy" in its brand. This is not a coincidence.

**Decision:** Rebrand before applying for an Etsy API key or publishing anything under the name. Do
not stand up etsyc.com even as a placeholder — public use with knowledge of the mark is evidence of
bad faith in a UDRP. Keep "for Etsy sellers" as a tagline; that is safe and is how every incumbent
operates.

**Rationale:** Cheap to fix today (a naming session). Existential later, once there are customers,
an API key, and search equity in the name. The API-rejection path means the product can die without
anyone ever sending a legal letter.

**Reversibility:** irreversible (once public use begins, it becomes UDRP evidence)
**Owner:** ceo
**Affects:** all — domain, product name, outreach sending domain, survey branding, API application
**Status:** Recommendation. Awaiting Adam's sign-off.
