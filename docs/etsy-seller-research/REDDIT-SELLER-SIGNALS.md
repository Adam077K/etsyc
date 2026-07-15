# Reddit / web seller signals — PARTIAL SALVAGE

> **Read this header first.** This is a *salvaged, partial* result, not the full sweep. The mining
> run on 2026-07-14 failed twice: the miners' structured output was rejected (schema too heavy), and
> then the account hit its monthly spend limit before the synthesis and gap-fill stages could run.
> Separately, the `site:reddit.com "exact phrase"` search style returned "no results" most of the
> time — Google indexes Reddit poorly for tight phrase queries. So what follows is grounded **only**
> in the dated sources that actually surfaced, most of them news/blog coverage of Reddit and Etsy-forum
> discussions rather than the raw threads themselves. **No seller quotes have been invented.** Where I
> have a real thread URL I say so; where I only have secondary coverage I say that too.
>
> The complete, high-fidelity version needs the local PRAW pull described in
> [LEADS.md](./LEADS.md) — that gets the actual thread text with verbatim seller language, for free,
> and is not subject to the search-indexing problem above. Treat this doc as the skeleton; that run
> puts flesh on it.
>
> **Confidence: MEDIUM on the events (multiple sources corroborate), LOW on relative frequency
> (the quote-level frequency data was exactly what the failed stage would have produced).**

---

## The dominant signal: the November 2025 search-visibility collapse

This was the loudest thing across every source that returned content, and it is well-corroborated:

- **"Etsy Sellers Say 'Total Search Invisibility' Is Causing Sales to Tank"** — EcommerceBytes, 2025-11-16. https://www.ecommercebytes.com/2025/11/16/etsy-sellers-say-total-search-invisibility-is-causing-sales-to-tank/
- **"Thousands of Etsy shops lost all traffic since [Nov 2025]"** — r/Etsy thread. https://www.reddit.com/r/Etsy/comments/1ov508n/thousands_of_etsy_shops_lost_all_traffic_since
- A search bug over **6–9 November 2025** wiped visibility heading into the holiday season — the worst possible timing. https://srcreativestudio.com/solved-sudden-drop-in-etsy-sales-and-no-search-visibility-6-9th-november-2025/ and https://www.valueaddedresource.net/etsy-search-visibility-bug/

**What it means for a product:** sellers experience Etsy search as a black box that can erase their income overnight with no warning and no explanation. A tool that gives them independent visibility into their own search standing — early warning when they drop, evidence of *why* — speaks directly to the deepest fear this surfaced. This is the closest thing here to a validated pain, and it happens to sit near the repo's existing search/visibility scanning code.

---

## Recurring pain #2: suspensions and deactivations with no explanation

The single highest *volume* of content across the whole sweep. Sellers lose their entire shop to an automated flag, get no reason, and can't reach a human. Sample of what surfaced (Etsy's own community forum threads — real seller posts):

- "Etsy shop permanently suspended for an unknown reason. This is going to kill my start up business!" https://community.etsy.com/t5/Technical-Issues/Etsy-shop-permanently-suspended-for-an-unknown-reason-This-is/td-p/145334456
- "My Shop Was Permanently Suspended Without Warning" https://community.etsy.com/t5/Technical-Issues/My-Shop-Was-Permanently-Suspended-Without-Warning-Hoping-for-a/td-p/148158278
- "Suspended without a reason" · "Etsy Shop Suspension and No response" (multiple threads)

Corroborating signal, and a tell in itself: **all three incumbent tools publish suspension-survival content** — eRank ("Why Did My Etsy Shop Get Suspended?"), Alura ("The Etsy Suspension Guide"), Marmalead ("Etsy Copyright Infringement"). When competitors all build help content around the same pain, the pain is real and high-traffic. There's also a documented **payment-account-reserve** grievance (funds held): https://indiesellersguild.org/etsy-payment-account-reserves-what-weve-learned/

Etsy itself responded to the pressure: **Fall 2025 added a Policy Violations page and listing appeals**, and a 2026-07 report says they're working on letting sellers appeal listing violations. So this was loud enough to move the platform.
https://www.cindylouwho2.com/blog/2025/9/22/etsy-fall-2025-changes-policy-violations-page-removed-listing-appeals-new-tools-coming · https://www.ecommercebytes.com/2026/07/02/etsy-to-work-on-letting-sellers-appeal-listing-policy-violations/

**What it means:** the fear of sudden, unexplained shutdown is a top-2 seller anxiety. It's also hard for a third party to *fix* (only Etsy can reinstate), so the product angle is prevention/early-warning/record-keeping, not resolution.

---

## Recurring pain #3: the AI tension is real, loud, and cuts both ways

This directly answers your "do you use AI?" question — and warns you how to ask it. Two camps, both present:

- **AI disclosure is now mandatory and confusing.** "Etsy AI Disclosure Explained 2026 (Exactly What to Tick…)" https://www.inkfluenceai.com/blog/etsy-ai-disclosure-explained-2026
- **Compliant AI listings get flagged anyway — false positives.** "Etsy Keeps Flagging My AI Art Even Though I Disclosed It" and "Why Compliant Listings Still Get False Positives (2026)." https://aimetadatacleaner.com/blog/etsy-ai-disclosure-metadata-guide-2026
- **"Can You Sell AI Art on Etsy?"** policy guides for both 2025 and 2026 — a live, contested question. https://www.xhbt.org/open-calls/etsys-ai-art-policy-2026-complete-guide
- A YouTube piece on "Etsy REVEALS Their AI BOT Seller Suspensions" ties the AI theme back to pain #2.

**What it means for the survey:** "Do you use AI?" is a loaded question on a handmade marketplace. Sellers who use it fear being flagged; sellers who don't often resent those who do. Ask it obliquely — about specific *tasks* ("what parts of your listings do you write yourself vs. get help with?") rather than a yes/no that invites a defensive or dishonest answer. This confirms the survey-design caution already in [SELLER-SURVEY.md](./SELLER-SURVEY.md).

---

## Recurring pain #4: fees, taxes, and "is it still worth it"

- **1099-K tax thresholds** — a recurring source of confusion and dread each tax season. https://help.etsy.com/hc/en-us/articles/360000336447
- **Packaging/handling charges** being pulled into fee calculations — r/EtsySellers thread. https://www.reddit.com/r/EtsySellers/comments/1id0mrs/etsy_removing_packaginghandling_charges_from_our
- **"Is Etsy Still Worth It in 2026?"** — even six-figure sellers publicly asking the question. https://loveeattravelrepeat.com/is-etsy-still-worth-it-in-2026/

**What it means:** margin anxiety is chronic background pain, not an acute crisis. Real, but less differentiating than the visibility and suspension fears — everyone knows fees hurt.

---

## Where sellers look when they consider leaving

Diversification signal that surfaced (thinner than the above):
- **Amazon Handmade** comes up as the main alternative and gets panned ("Amazon Handmade is a joke" — Amazon seller forum). https://sellercentral.amazon.com/seller-forums/discussions/t/0fa4d9f1-e439-41c8-93b4-1f444c5ea006
- **Etsy vs. Amazon Handmade** comparison content is heavily produced (Shopify's own blog runs it). https://www.shopify.com/blog/amazon-handmade-vs-etsy

The Shopify/TikTok-Shop/own-site migration angle did **not** surface strongly here — that's a coverage gap, not evidence of absence. The local PRAW run should target it directly.

---

## Tools: what surfaced

Lots of "best Etsy SEO tools 2026" roundup content, which confirms the category is crowded and sellers actively shop for tools. The incumbents (eRank, Alura, Marmalead) are everywhere. What did **not** surface here is the raw "I cancelled X because…" seller language that would map the competitive gap — again, a casualty of the failed quote-mining stage. This section is the weakest in the doc and should not be leaned on.

---

## Honest coverage map

| Theme | Confidence | Why |
|---|---|---|
| Nov 2025 search-visibility collapse | **Medium-High** | Multiple independent dated sources + a real Reddit thread |
| Unexplained suspensions / no support | **Medium-High** | High volume; real Etsy-forum threads; Etsy changed policy in response |
| AI disclosure tension & false-positive flagging | **Medium** | Several 2025-2026 sources, both camps present |
| Fees / 1099-K / "worth it" | **Medium** | Real but generic; everyone knows fees hurt |
| Diversification to Shopify/TikTok/own site | **Low** | Under-mined; gap |
| Tool love/hate & willingness-to-pay | **Low** | The quote-level data was in the stage that failed |
| Daily operational grind / burnout | **Low** | `site:reddit.com` phrase searches mostly returned nothing |

## What to run next to fix the gaps

1. **The local PRAW pull** ([LEADS.md](./LEADS.md)) — free, not subject to the search-indexing problem, gets real thread text. This is the right fix, and it doesn't touch the spend limit.
2. **Re-run the mining workflow** with a flatter schema and broader (non-`site:`) queries, once the monthly spend limit is raised or resets. The script is saved and can be re-run with edits.
