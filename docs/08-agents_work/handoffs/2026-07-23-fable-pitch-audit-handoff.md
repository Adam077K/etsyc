# HANDOFF — KOL Final Pitch: Deep Audit & Rebuild (for a Fable 5 agent)
*Author: ceo-5, 2026-07-23. Paste-ready. Give this to a Fable-model agent. It is self-contained — every source is a real path in this repo or the founder's machine.*

---

## YOUR MISSION
You are a senior pitch strategist **and** presentation designer. Your job, in order:
1. **Research** KOL deeply — read everything in Phase 1 before forming a single opinion.
2. **Audit** the current pitch deck (v3) for **content accuracy, narrative strength, and visual/presentation quality**, measured against the reference decks and style the founder provided.
3. **Rebuild** it into a materially better, improved version and output it as a **NEW artifact** (a new self-contained HTML file — do not overwrite the existing one).

Do not shortcut the reading. The founder's #1 recent frustration was that the deck drifted from what the company actually believes and ships — so accuracy against the product docs is non-negotiable.

## WHAT THIS IS (context)
- **Event:** 7-minute final pitch, Fri Jul 24 2026, Hudson Lab Ventures × Etsy program, Columbia. Judged by an **Etsy product panel — the Buyer Experience org** (sponsor: Dina Murphy, VP Buyer Experience). The buyer's *felt experience of believing* is her P&L.
- **Product:** **KOL** (Hebrew for "voice") — a **desktop-first, video-native marketplace** where buyers meet the real maker before the product: scroll a magazine-style feed of makers *on film* (never a grid) → tap → the maker's fully personalized branded **world unfolds around a still-playing video** → the video swaps to contextual narration when you click a product → you meet the human, trust them, buy, and come back. Makers build their world via an **AI co-creation interview** (they stay the author; anti-slop is structural).
- **Production model:** fully produced, **zero shoot / zero live build**. All footage AI-generated from **one real Etsy seller's** (Sharon / Two Dots) approved photos + UGC; the app UI is shown as **designed stills + motion**, not a live recording. The team assembles the final deck in **Canva or Pitch**.

## PHASE 1 — RESEARCH (read ALL of this first)

### Product ground truth — authoritative. The deck must NEVER contradict these:
- `docs/01-foundation/KOL-v2-concept-lock.md` — the 16 locked decisions (D1–D16), guardrails, and explicit out-of-scope. **THE authority.**
- `docs/KOL-START-HERE.md` — 60-second what-is-KOL, the reading path, and **current build status** (what's actually built vs. specced).
- Verification specs — **what we ACTUALLY verify** (the founder specifically corrected the deck here): `docs/04-features/specs/verification-real-maker.md`, `trust-badges.md`, `proof-of-product.md`, `trustworthy-reviews.md`.
- Challenge brief: `docs/01-foundation/HLV-ETSY-CHALLENGE.md`.
- Evidence base: `docs/research/interviews/FINAL-SUMMARY.md` (the buyer/seller interviews) and `docs/01-foundation/realness-goal.md` (the earlier "In the Making" bet — historical, read for lineage).

### Current pitch materials — what you are improving:
- `docs/05-marketing/HLV-FINAL-pitch-plan.md` — the **v3 spec + full changelog** (read the v3 and v2 changelog at the very top; it records every board fix and every accuracy correction).
- `docs/05-marketing/HLV-pitch-sourced-figures.md` — every sourced number **and the "DO NOT USE" list** (e.g., no per-buyer order counts — Etsy doesn't publish them).
- `docs/05-marketing/HLV-pitch-panel-verdict.md` — the five-judge board review (VC, Etsy VP, narrative, design, numbers) with all accepted fixes.
- **The current v3 deck (exact slide content):** `/private/tmp/claude-501/-Users-adamks-VibeCoding-etsyc--worktrees-ceo-5-1784669506/25759167-6395-41d6-a950-1ec7f98026ac/scratchpad/kol-pitch-plan-v2.html` — read this file; it is the artifact you are improving. Also use it as the **structural + visual template** for your output (same card format, same design language).
- `docs/05-marketing/HLV-pitch-KOL-delivery.md` + `HLV-pitch-KOL-slidebuild.md` — the emotional spine / rehearsed delivery script (the human tone to preserve).

### Reference decks + style — the LOOK to match and beat (READ THE IMAGES/PDFs):
- `/Users/adamks/Downloads/LPP-Example-Ensemble.pdf` (43 pp) — **the winning example the HLV team handed us as the standard.** Study: one-clause-per-slide escalation, a named persona carried through the whole product demo (~36% of slides), background-color-as-act-marker, extreme text economy, the letterboxed inset panel.
- `/Users/adamks/Downloads/ORIGINAL - Skillo.pdf` (45 pp) — another student example (two-sided marketplace; note its flaw: it never shows its stated user in the demo).
- `docs/05-marketing/HLV ISS Pitch Template 2025.pdf` — the official *solutioning-day* template (74pt, fill-in-the-blank). This is **NOT** the final format; ignore its constraints, it's context only.
- **Main style reference:** `/Users/adamks/Downloads/pitch-style-vibe.webp` — the "Y." healthcare-brand aesthetic: warm bone/cream ground, near-black panels, large **editorial old-style serif in sentence case**, ONE warm accent, full-bleed film, tiny sourced footnotes. **Match this — but pushed MORE HUMAN** (workshop light, 35mm grain, hands/material, dust — observed, not aspirational).
- **Sub style reference:** `/Users/adamks/Downloads/pitch-style-vibe2.webp` — a red/black, data-forward, high-contrast deck (big numerals, radar/quadrant charts). Borrow its numeric confidence for the money/market slides only.

## PHASE 2 — AUDIT (critique the current v3, slide by slide)
Assess each slide on six axes and write down what's wrong or weak:
1. **Content accuracy vs the product docs** — flag anything **false / overstated / unbackable / off-belief**. This session already caught and fixed three (re-verify they're fully clean, then hunt for more):
   - Trust is **verified, not "no badge"** — we ship Real-Maker (verified human, voice-anchored) + AI-Transparency + verified-purchase reviews. **But never claim physical product inspection — that is roadmap** (D7, guardrail).
   - KOL is a **standalone marketplace**, pitched as a trust layer *built for / brought to* Etsy — **never claim it is already integrated "inside Etsy" with Etsy's catalog** (out of MVP scope).
   - Claim **only the live build spine** (DB · auth · store-render engine). The **co-creation interview engine is being built, not "already running"** — verify exact status in `KOL-START-HERE.md` and do not overclaim.
2. **Narrative** — arc, emotional beats, where it sags. Is it **buyer-centered**? The sponsor owns *Buyer* Experience; the buyer must be the hero for ~90% of the deck, the seller/co-creation engine is a single supporting defensibility line, not the emotional core.
3. **Headlines** — fragment discipline: **≤ 8 words; if you can't read it silently in under 2 seconds it's too long.** Punch up the soft ones.
4. **On-slide text** — the story must live **on the slide**, not only in the speaker's mouth. Split printed vs. spoken cleanly.
5. **Visual / presentation** — measure against the Y. reference + Ensemble: typography, hierarchy, the black/gray/white act-color system, restraint, big-numeral treatment, how AI-generated visuals avoid looking synthetic (tight-crop hands, one uniform grain/LUT pass), and the signature motion moments (feed → world-unfold → clip-swap) pre-rendered as video, not native Canva transitions.
6. **Numbers** — every figure sourced (cross-check `HLV-pitch-sourced-figures.md`); the money slide shows real low/mid/high math; nothing on the DO-NOT-USE list.

## PHASE 3 — REBUILD (produce the improved version)

### LOCKED constraints — improve everything else, but do NOT undo these:
- **Format:** 7:00 on stage · ~22 slides · free-form (not the 74pt template).
- **Style:** Y.-reference pushed human — bone/cream `#F1EDE6` + near-black panels + editorial old-style serif (sentence case) + one **clay-terracotta** accent; workshop light, 35mm grain. Big stats get lining/tabular numerals.
- **Taglines:** "Every maker, finally heard." (emotional sign-off) + "Meet the maker, not the listing." (positioning).
- **Three guardrails:** (1) generated clips are the *product experience*, never documentary proof — inoculate the demo up front; (2) **every number sourced on-slide**; (3) **pitch TO Etsy — never criticize Etsy**, align with their "Celebrate Being Human" campaign, treat the −9% as a shared market headwind, not an indictment.
- **Truth rails:** verification is real (Real-Maker + AI-Transparency + verified reviews), never physical inspection; KOL is standalone, pitched *for* Etsy; claim only what's built; buyer-centered.
- **Hero maker:** Sharon / Two Dots — a real Etsy seller with granted permission (founder-confirmed).

### Deliverable
- Write the complete improved deck as a **single self-contained HTML file** to a **new path**: `/private/tmp/claude-501/-Users-adamks-VibeCoding-etsyc--worktrees-ceo-5-1784669506/25759167-6395-41d6-a950-1ec7f98026ac/scratchpad/kol-pitch-plan-v4-fable.html`.
- **Match the current artifact's structure and visual language** (the linked v3 HTML is your template): a slide-by-slide **build-ticket** page where each slide card shows **① Headline ② On the slide ③ Design & visuals ④ Says**, plus the header (storyline, time budget, guardrails, how-to-read) and a **changelog block at the top listing exactly what you improved and why.** Theme-aware (light/dark), responsive, self-contained (inline CSS, no external fonts/CDNs — use a system serif stack), emoji favicon in the `<title>`/head is not needed since the orchestrator publishes it.
- The orchestrator (main session) will publish your HTML file as a new artifact — you do not need to call the Artifact tool; just write the file and return.
- **Return a concise ranked changelog** (what changed, why, by leverage) as your final message.

## HARD RULES
- **Never invent facts or numbers.** If a claim isn't backed by the docs, cut it or flag it inline.
- **Docs win.** If the deck and the product docs conflict, the docs are right.
- **Research before you rebuild.** Read every Phase-1 source. The founder will notice if you didn't.
- Preserve the human warmth of the delivery script — this is an emotional pitch, not a data dump.
