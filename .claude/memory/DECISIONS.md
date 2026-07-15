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

## 2026-07-15 — Discovery direction candidate: seller-first trust tooling with a buyer-visible signal

**Context:** Interview corpus complete at 7 recordings (01–05 buyers+seller, 06 founder thesis, 07 pitch craft). Day 4 (solutioning + team-formation vote) is Jul 16 and needs a wedge to pitch.
**Options considered:** Buyer-first "discovery→relationship" (larger market, but buyers are low-pain and responses were led) / Seller-first trust-transparency tooling (desperate user, direct Etsy Buyer-Experience value) / Two-sided at once (too broad for a 10-day sprint).
**Decision:** Recommend **seller-first trust tooling that emits a buyer-visible "this is real / this is the human" signal** as the leading candidate into Day 4. Not locked — Adam decides at the vote.
**Rationale:** Seller is the higher-pain, lower-alternative user (file 05: zero tools/relationship; file 06: seller overload). A seller-side signal is what makes buyer-side "discovery becomes relationship" real, and it serves the sponsor (buyer sees trust). Attacks the say/do + price-defection gap at point of discovery.
**Reversibility:** reversible (a framing choice, pre-build; revisit after B1/B2 validation).
**Owner:** ceo (session `ceo-columbia-5-6-transcripts`)
**Affects:** CPO (PRD/wedge), CMO (pitch narrative + USER-INSIGHTS), CBO (willingness-to-pay), research-lead (B1/B2 validation interviews). Full reasoning: `docs/research/interviews/FINAL-SUMMARY.md`.
