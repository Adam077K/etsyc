---
role: design-lead
task: kol-etsy-entry
date: 2026-07-23
branch: feat/kol-etsy-entry
base: feat/kol-fixture-coherence @ a3c19bf
qa_verdict: PENDING (2-reviewer gate follows)
tier: lite
gates: { build: PASS, film-continuity-e2e: 4/4, detect: "[]", console-errors: 0 }
---

# Design-Lead — Etsy home replica + one-way KOL entry (/etsy)

Founder wave: the pitch positions KOL as a feature INTO Etsy; the demo journey
starts on an Etsy-looking home and steps into the KOL film feed.

## Shipped — new self-contained /etsy route (7 new files, 1 commit)
- app/etsy/page.tsx (noindex) + components/etsy/{etsy-home, etsy-header,
  etsy-listing-card, kol-entry-banner, etsy-footer}.tsx + lib/etsy-listings.ts.
- Etsy light register recreated (white ground, orange text wordmark, rounded
  "Search for anything" bar, category strip, 2->5 col listing grid with
  hearts/5-star rows/price/free-shipping). Reads as Etsy today, NOT as KOL.
- Grid populated with our OWN 15 products (commerce + makers fixtures), flat
  Etsy-listing style — the pitch's "grid villain".
- THE MONEY MOMENT: KOL nav tab ("Meet the makers — on film · NEW") + a
  hero-adjacent dark cinematic banner in KOL's ink/bone/Bricolage register,
  both -> `/`. Verified: click "Enter KOL" lands on / with body bg #1C1613.
- One-way: nothing in the KOL app links into /etsy (D15 chrome stays pure).
- Honesty line in footer: "Concept demo for the HLV x Etsy program — not an
  Etsy property."

## Honesty guardrails held
- No scraping, no Etsy-owned imagery/logo asset (wordmark = text). Star ratings
  derived from fixture reviews (all asExpected -> 5.0; count = true testimonial
  count) — no fabricated aggregates, no invented Star-Seller/programme badges.

## Verify
build PASS · film-continuity 4/4 (untouched routes) · detect [] (even on /etsy
files) · 0 console errors · transition captured · screens 1440+375 (page, fold,
landed-KOL). Reviewers: /etsy route + its components are EXEMPT from the KOL
design contract by Founder directive.
