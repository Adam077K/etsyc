---
role: design-lead
task: gate2-rulings
date: 2026-07-22
qa_verdict: N/A (spec rulings — no code changed)
tier: n/a
---

- **R1 APPROVE-WITH-CHANGES.** Nameplate weight is now stroke-contrast-aware, not a number. `strokeClass` declared per pairing (`warm-serif` = `modulated`; the other three + `custom` = `uniform`); renderer reads `--nameplate-size/-weight/-tracking`, never a font name. `modulated` → `display-hero`/700/`-0.03em`, `uniform` → `display`/600/`-0.025em`. Two axes, not one — statement larger-and-lighter, nameplate smaller-and-heavier. Critic's 500–600/`-0.03em` proposal adjusted: weight alone under-corrects on heavy uniform faces.
- **R2 APPROVE.** Mobile identity is the left edge. Four slots (`M-BLEED`, `M-FULL`, `M-OFF-L`, `M-OFF-R`), asymmetric insets, captions align to their own media's left edge. Two columns rejected — shrinks the face. Same content-aware assignment as desktop, second slot table.
- **R3 APPROVE.** Content-aware slot assignment replaces the S1→S2→S3 cycle. Cost = aspect fit + repeat penalty + edge penalty; four hard constraints; deterministic; degrades to centre focal point if the `focalPoint` schema add has not landed. Added 6th slot `COLUMN` → five row patterns.
- **Contrast headroom bound:** type over film ≥ 5.5:1 body / ≥ 4.0:1 large. Variance-aware scrim recommended for Wave 4/5, not now.
- **Ambient count (CPO's dial, design opinion given):** 0 ambient at ≤ 2 cards in view, 1 at 3, 2 at ≥ 4. Everything-moving is the TikTok-Shop register §2.4 bans.
- **Said plainly:** two of the three findings are places I was wrong. I expressed an optical property as a number, and I wrote an anti-grid assertion that a cycle passes.
- Files: `docs/06-design/KOL-wave3-design-direction.md` (§2.1, new §2.1a, §4.1, new §4.1b, §7), `docs/06-design/KOL-wave3-screen-specs.md` (§1.1, §1.6, §1.7, §3.2), `.claude/memory/DECISIONS.md` (1 entry).
- **Follow-up not in my files:** `KOL-design-system.md` §3 must carry `strokeClass` on each pairing and the `kind:"custom"` derivation must emit it.
