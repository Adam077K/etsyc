---
date: 2026-07-14
role: ceo
task: etsy-seller-survey
color: gold
tier: lite
qa_verdict: N/A (research only — no code changed)
agents_spawned: 18 (workflow) + 1 (zero-budget researcher)
---

# CEO — Etsy seller survey & outreach research

**Ask:** Adam wanted to scrape Etsy shop contacts, text/contact sellers, and drive them to a fast
survey about what's hard/good/bad about selling on Etsy, and whether they use AI. Later added a
hard $0 budget constraint.

**Grilled and settled:** survey stays discovery-shaped (not thesis-validating); email only, never
SMS (TCPA: $500–1,500 statutory damages per text to a scraped mobile).

**Key finding — the original plan is not viable, for supply-chain not legal reasons.** Etsy
publishes seller emails *only* in the DSA/GPSR trader block, which renders for EU/UK traders — the
exact population that may not be cold-emailed (UK PECR reg. 22 treats sole traders as consumers;
DE UWG §7(2) requires prior consent; GDPR Art. 14 notification duty on scraped data). The emails
obtainable are the emails that may not be used. Elsewhere Etsy publishes no email at all.

**Recommended channels, ranked:** (1) mine the existing corpus — 90d of r/EtsySellers via official
API + 1-star reviews of eRank/EverBee/Alura (revealed complaint, free, legal); (2) *buy* seller
time — Etsy sellers already sell consultation gigs on Fiverr at $20–30/hr, zero cold outreach;
(3) mod-approved Reddit post; (4) email incumbent founders. Cold email survives only as a ~60-send
US-only supplement in week 3.

**Expected:** ≥10 deep conversations, ≥40 survey completions. Cost $185–235 (essentially all Fiverr
interviews) — conflicts with Adam's $0 constraint; free version keeps breadth, loses depth.

**Top risks:** (1) every free channel selects against the *buyer* — a strong response rate from
sub-$100/mo hobbyists reads as validation and yields a PRD with no payer; revenue-band screener is
the only defence. (2) "Etsyc" contains Etsy's trademark; no incumbent does this — unresolved,
blocks domain/form/email in week 1.

**Deliverables:** `docs/etsy-seller-research/SELLER-OUTREACH-PLAN.md`, `SELLER-SURVEY.md`,
`OUTREACH-LEGAL-GUARDRAILS.md`

**Open:** Adam must read r/EtsySellers + r/Etsy + r/handmade sidebar rules on surveys himself —
Reddit blocks automated fetch from this environment, and most seller subs ban surveys outright.

**Awaiting Adam:** free-only vs ~$60 partial-interview variant; trademark decision.
