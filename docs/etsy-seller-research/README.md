# Etsy seller research

Customer discovery for a tool aimed at Etsy sellers. Side project. As of 2026-07-14 there is no
product, no PRD, and no customer data — this folder is the effort to fix the last one first.

## Read in this order

| File | What it is |
|---|---|
| [LEADS.md](./LEADS.md) | **Start here.** Named, contactable people: sellers whose time you can buy today, tool founders who'll answer a founder-to-founder email, and the communities worth the effort. Everything a fabrication audit killed is listed at the bottom with reasons. |
| [SELLER-OUTREACH-PLAN.md](./SELLER-OUTREACH-PLAN.md) | The operating plan — channels ranked by insight-per-hour, the funnel numbers, the email copy, a three-week timeline. |
| [SELLER-SURVEY.md](./SELLER-SURVEY.md) | The survey instrument. Every question has a decision attached to it, or it isn't in there. |
| [OUTREACH-LEGAL-GUARDRAILS.md](./OUTREACH-LEGAL-GUARDRAILS.md) | What you may and may not do, per jurisdiction. Read before sending anything. |

## The four findings that shaped all of it

**You cannot scrape Etsy seller contacts. Not "shouldn't" — cannot.** Etsy publishes no seller
emails on shop pages, the official API exposes none (and `findShops` can't even enumerate shops —
it requires a name query), and the one place an email does appear is the EU/UK trader-details block,
which is exactly the jurisdiction where cold-emailing sole traders is unlawful. Every door is closed,
and they were closed on purpose.

**Buy seller time instead of begging for it.** Etsy sellers already sell consultation calls on Fiverr
for $20–40. It's a normal transaction: they show up, you choose who you talk to, and there's no
scraping, no GDPR, and no Etsy ToS exposure. This is the best channel available and it inverts the
whole problem.

**Most "Etsy experts" don't sell on Etsy.** Of seven coaching gigs audited, exactly one had a
verifiable shop. Ask "what's your Etsy shop URL?" before you pay. A real seller answers in five
seconds; a consultant deflects. Free, and it screens better than any research.

**Every free channel selects against the buyer.** Reddit's loudest Etsy sellers are hobbyists. A great
response rate from people grossing under $100/month feels like validation and produces a PRD with no
payer in it. The revenue-band screener is the only defence.

## Open decisions

- **The name.** "Etsyc" is prohibited by Etsy's own trademark policy by example, and devs get API keys
  silently rejected for "etsy" in the app name. See the 2026-07-14 entry in
  `.claude/memory/DECISIONS.md`. **Nothing goes out under this name until it's resolved** — no
  signature, no domain, no survey header.
- **Interview budget.** The first move (four Fiverr messages) is free. Paid interviews start at ~$20.

## Do this first

Four Fiverr messages asking "what's your Etsy shop URL?" The message is written for you in
[LEADS.md](./LEADS.md). Fifteen minutes, $0, and the replies do the screening.
