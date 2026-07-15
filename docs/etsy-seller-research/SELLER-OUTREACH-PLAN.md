# Seller Outreach Plan

**Owner:** Adam (solo founder)
**Status:** Approved operating plan, week of 2026-07-14
**Goal:** Get the first real customer data this company has ever had — enough to write a PRD that isn't a guess.
**Companions:** [SELLER-SURVEY.md](./SELLER-SURVEY.md) · [OUTREACH-LEGAL-GUARDRAILS.md](./OUTREACH-LEGAL-GUARDRAILS.md)

---

## 1. Honest verdict: is scrape-then-email the right play?

No — not as the lead channel, and not at the scale originally imagined. The plan dies on a closed loop that nobody spotted until the threads were read against each other: **the only place Etsy publicly exposes a seller's email is the DSA/GPSR trader-details block, which renders for EU/UK viewers — and EU/UK is exactly the jurisdiction where cold-emailing a sole trader is unlawful without prior consent (UK PECR reg. 22; Germany UWG §7(2) Nr. 2), and where GDPR Art. 14 makes any scraped list structurally non-compliant regardless.** The emails you can get are the emails you may not send to. Everywhere else, Etsy publishes no seller email at all, so "scrape Etsy for emails" is not a risky plan — it is a plan whose supply chain does not exist. What remains is hand-harvesting addresses that sellers self-published on *their own* websites and social bios, US-only, which is lawful and genuinely useful but is a ~60-send, ~5-reply channel, not a 2,000-send channel. Meanwhile a corpus of tens of thousands of unprompted seller complaints already exists on Reddit and in the 1-star reviews of eRank/EverBee/Alura, free and legal to read, and eight hours of a real Etsy seller's time can be *bought* on Fiverr for ~$180. **Lead with those. The email channel is a supplement, and it runs last.**

Second verdict, equally load-bearing: **a survey was never the right instrument for discovery.** Sellers will tell you fees are too high, search is opaque, listings get flagged unfairly, and they want more sales — all of which is already public with citations. A survey is a *confirmation* instrument. Use interviews and the existing corpus to form a hypothesis; use the survey to scale-test it.

Third, before a dollar is spent: **the name.** Every incumbent — eRank, EverBee, Alura, Marmalead, Sale Samurai, Vela — conspicuously avoids "Etsy" in its name. "Etsyc" and any domain containing `etsy` are the fastest possible route to a cease-and-desist, and a C&D landing mid-campaign poisons every channel at once. Resolve this in week 1 (§7). Do not print "Etsyc" on an outreach domain, a survey header, or an email signature until it's resolved.

---

## 2. Recommended channel mix, ranked

Ranked by expected decision-grade insight per hour of founder effort. Numbers marked **(est.)** are my estimates, not measured — the whole point of week 1 is to replace them with real ones.

| # | Channel | Effort | Cash | Expected yield | Why it ranks here |
|---|---------|--------|------|----------------|-------------------|
| 1 | **Corpus mining** — r/EtsySellers (~240k members, two independent trackers) via the official Reddit API; Etsy Community forums; 1- and 2-star reviews of eRank / EverBee / Alura / Marmalead on G2, Capterra, Trustpilot | 8h | $0 | 90 days of threads, ~200 read closely; thousands of verbatims | Revealed complaint, not prompted opinion. No selection bias, no social-desirability bias, no interviewer effect, no legal exposure. Strictly better data than a survey, and it was proposed by nobody. |
| 2 | **Paid interviews** — hire Etsy sellers who already sell "Etsy shop consultation / listing audit" gigs on Fiverr and Upwork at $20–30/hr | 6h + booking | $150–200 | 6–8 hour-long interviews, near-100% show rate **(est.)** | A normal commercial transaction. Zero scraping, zero GDPR, zero PECR, zero Etsy ToS exposure, zero deliverability risk. Faster and deeper than five weeks of cold email. |
| 3 | **Reddit, done properly** — 45 min/day of genuine help in r/EtsySellers for 7–10 days, then **modmail the mods first**, then one substantive research post | 8h over 2 wks | $0 | 10–30 comments; 5–15 people willing to talk; 20–60 survey completions **(est.)** | Largest concentration of sellers anywhere. Mod permission is a hard gate — the "mods tolerate value posts" claim traces to a Reddit-marketing SaaS's own blog and was never verified. Ask them. |
| 4 | **Founder-to-founder email** — the founders of eRank, EverBee, Alura, Marmalead, plus 2 Etsy-seller newsletters and Craft Industry Alliance | 1h | $0 | 1–2 replies **(est.)** | They each have ~100k+ sellers and have already run the survey you want to run. One 30-minute call is worth 500 responses. Also opens paid-newsletter placement (opted-in audience, few hundred dollars, no legal or platform risk). |
| 5 | **Facebook groups** — join the 4–5 largest Etsy-seller groups, participate a week, then DM admins for permission | 5h | $0 | 10–40 survey completions **(est.)**, admin rejection is the base case | Group sizes (~120k / ~50k / ~30k) come from 2024 SEO listicles and are unverified. Check on joining. Cheap to try, don't over-invest. |
| 6 | **Hand-built US-only email** (§3–§5) | 12h | ~$25 | ~60 sends → 3–9 replies **(est.)** | Lawful, useful, and small. Runs *last*, after the hypothesis exists, and only to sellers who published a contact address on their own site. |
| 7 | **Local craft markets / maker fairs** — one Saturday | 6h | ~$0 | 10–20 face-to-face conversations | Most Etsy sellers also sell offline. You get to watch their face when you say the idea out loud. |

### Killed outright, do not spend an hour on any of these

- **Etsy Convos / Messages.** Etsy Seller Policy: *"Messages may not be used for the following activities: Sending unsolicited advertising or promotions, requests for donations, or spam."* Verified verbatim.
- **Etsy Community forums.** Community Policy prohibits *"unsolicited or duplicate posts or links to your shop, fundraisers, surveys, social media or other promotional content."* The word "surveys" is literally in the ban list.
- **Any automated scraping of Etsy.** Etsy Terms of Use prohibit crawling/scraping/spidering; API Terms prohibit automated access to listings, shops, or user profiles, and prohibit using Etsy data for unsolicited marketing. Termination follows the *person*, not the script — and if this product ever needs an Etsy API key, scraping puts its own lifeline on the table. That is the single strongest argument against the original plan, stronger than any fine.
- **Scraping the EU/UK trader-details block.** See §1. The emails you can get are the emails you may not send to.
- **Cold Instagram DMs.** The Instagram Messaging API *cannot initiate a conversation at all* — a 24-hour window only opens when the user contacts you first. Hand-DMing is the only mechanism and it is exactly what gets action-blocked.
- **Podcast sponsorship.** "The Jam with Marmalead" last published 2021-12-13. "Etsy Conversations" ended in 2023 and now airs reruns. Create & Thrive's community closes 2026-06-08. There is nothing to sponsor.
- **Hunter.io / Apollo.io / Anymail Finder enrichment.** All are domain-search-first and explicitly do not resolve personal Gmail/Yahoo/Outlook addresses. The modal Etsy seller is a sole trader on a personal Gmail. Structural near-zero coverage. This is the best-evidenced finding in the entire research pile.
- **The Apify "Etsy B2B email scraper."** 4 total users, 0 monthly users, no ratings; it Google-dorks rather than scraping Etsy.
- **Buying a list.** No credible vendor sells Etsy-seller emails, and if one appeared, buying scraped EU personal data just makes you the controller of someone else's unlawful collection.
- **Reddit ads.** Only if organic underdelivers, and budget $25–60 per completed survey (est.), not the $10–30 the research claimed. Skewed toward incentive-seekers.

---

## 3. Contact-acquisition pipeline (channel 6 only)

**Mechanism:** hand-browsing, human speed, logged out of any Etsy account. No crawler, no proxy, no headless browser, no Apify actor, no API key. You are a person looking at public shop pages, which is what those pages are for. The moment you automate it, you are in breach of Etsy's ToU and you have put a future Etsy API key at risk.

**What you collect, and from where:**

1. Open Etsy search, filter **Shop location = United States**, pick 3–4 categories that match the wedge you formed from channels 1–2.
2. For each shop, open **Shop Home** and the **About** tab. Look for the seller's own links — Etsy renders external/social links from Shop Manager → Settings → Info & Appearance → *Shop Links*, on both Shop Home and About. (Note: the widely-repeated "Related Links section on the About page" framing is a 2014 description and is stale — there are more link surfaces now, not fewer.)
3. If they linked their **own website**: open it, check `/contact`, the footer, and any `mailto:` in the page source. Take the address they published.
4. If they linked **Instagram** (business/creator profile): the profile chrome renders a public contact email *only when the seller opted in to show it*. Take that.
5. Record provenance on every single row: `shop_url`, `source_url` (the exact page the email was on), `extraction_method`, `collected_at`, `country`.

**Rule that makes this defensible:** the email must have been published by the seller, on a surface the seller controls, for the purpose of being contacted. An address on their own site's contact page qualifies. An address Etsy legally compelled them to disclose does not — different consent posture, different jurisdiction, different answer. Do not take the second kind.

**Tools:** a browser, a spreadsheet, and ~30 seconds per shop. Optionally NeverBounce or ZeroBounce (~$0.008/address) to verify before sending — $0.50 at this volume, worth it.

**Expected funnel.** Every percentage below is an **estimate**. The research thread's headline "12–20% net yield" figure had `source_url: NONE` and was a chain of seven multiplied guesses; it has been deleted. Calibrate on the first 100 shops and replace these numbers before scaling.

| Stage | Count | Rate | Note |
|-------|-------|------|------|
| US shops opened by hand | **500** | — | ~8h at ~1 min/shop incl. the off-Etsy hop |
| …that publish at least one external link (site / IG / Linktree) | **150–250** | 30–50% **(est., UNMEASURED)** | This is the crux number. Nobody has published it. Measure it. |
| …that link an **own domain** | 30–50 | ~20% of linked **(est.)** | |
| …own-domain sites where an email is findable | 20–35 | 60–70% of those **(est.)** | `/contact`, footer, `mailto:` |
| …that link **Instagram** with a public contact email shown | 15–30 | 10–20% of IG-linked **(est.)** | Vendor blogs claim 10–22%; all are companies selling scrapers. Craft niche likely at the low end. |
| Union, de-duplicated | **50–75** | ~10–15% of 500 **(est.)** | |
| …minus verification failures | 45–68 | −10% **(est.)** | ZeroBounce/NeverBounce |
| …minus wrong-person addresses | **40–60** | −10% **(est.)** | Drop `hello@`/`info@` where the shop is clearly one person; **drop print-on-demand shops entirely** — their published "manufacturer" email is Printify's or Gelato's, not the seller's |
| **Deliverable, attributable, US-only** | **≈40–60** | **8–12% of 500 (est.)** | |

**What that buys you:** at a 5–15% reply rate on a tiny, hand-personalized, non-selling list (the honest same-denominator benchmark for founders/owners is 0.57% replies-per-send across 7.5M emails — a hand-built list of 50 will beat that substantially, but not by 30×), you get **3–9 replies.** Nine replies. For twelve hours of work.

Hold that against channel 2: **$180 and six hours buys eight hour-long interviews with real sellers, guaranteed.** That comparison is the whole argument of this document.

---

## 4. Sending setup

Volume is ~60 emails total, hand-personalized, sent over 4–5 days. This is not a cold-email campaign; it is a founder writing sixty letters. The five-week, twelve-inbox, four-domain, $95/month warm-up farm the research prescribed is infrastructure for a problem you do not have.

**Domain.** One. Not `etsyc.com`, not `getetsyc.com`, not anything containing `etsy` (see §7). Use a neutral domain or your own name — `adamkoszary.com`-style personal domains outperform product domains on founder-research emails anyway, because the email is from a person. **Cost: ~$12/yr at Cloudflare or Namecheap.** Do not send from the domain that will later carry the product's transactional mail (password resets, receipts) — that is the one piece of the original advice worth keeping, and it costs $12 to obey.

**Inbox.** One. Google Workspace ($8.40/user/mo) or Fastmail ($5/mo). Send from Gmail/the web client, by hand, one at a time.

> **Know what you're relying on:** the Google Workspace Acceptable Use Policy prohibits using the service *"to generate, distribute, publish or facilitate unsolicited mass email, promotions, advertisements, or other solicitations ('spam')."* Sixty hand-written, individually-personalized, non-commercial research emails is not "mass email" in any practical sense — but you are relying on that reading and on lax enforcement, not on permission. At this volume the risk is negligible. It would not be at 2,000.

**Explicitly banned senders:** **Resend** and **Postmark**. Both verified verbatim. Resend's AUP: *"You are prohibited from sending unsolicited messages of any kind, including cold outreach, purchased lists, or scraped contact data."* Postmark's ToS: *"All email lists… must be permission-based subscriptions."* Termination without warning, no refund, and it takes your transactional email with it. **Never touch the account you'll use for the product's own mail.**

**Auth.** SPF + DKIM + DMARC (`p=none`) on the sending domain. Twenty minutes of DNS. Do it because it's the direction of travel and it's free — not because you're a bulk sender. **You are not a bulk sender.** Google's DMARC and RFC 8058 one-click-unsubscribe requirements bind at **>5,000 messages/day to Gmail**. You will send ~15/day. The rules that actually apply to you are the all-senders baseline: SPF *or* DKIM, valid forward and reverse DNS, TLS, RFC 5322 formatting, and a spam-complaint rate under 0.30% (target <0.10%).

**Warm-up.** Two weeks of light, normal use — send real mail to real people from the new address (your own accounts, friends, the founder-to-founder emails in channel 4). That's it. No warm-up pool. The "4–6 weeks minimum, non-negotiable" figure appears in no mailbox-provider documentation anywhere; every source for it is a company that bills for warm-up by the month. And the "90% open / 50% reply" target those pools produce is *synthetic engagement between bots*, which is precisely what Gmail's ranking systems are built to discount.

**Ramp.** Week 1 of sending: 10/day. Week 2: 15–20/day. Done in a week.

**Tooling.** None. No Instantly ($47/mo, not the $30 quoted), no Smartlead, no sequencer. Sixty emails is a spreadsheet and a Gmail tab. **Total cash: ~$12 domain + ~$8 inbox + ~$0.50 verification ≈ $21.**

**Send hygiene, non-negotiable:**
- Plain text. No HTML, no images, no attachments.
- **No tracking pixel.** (The oft-quoted "tracking costs 68% of replies" figure is contradicted by the vendor's own data on the same page — their numbers are 7.4% vs 4.4%, a 41% relative decline — but the direction is real and a pixel buys you nothing here.)
- **No link in email 1.** The link goes in the follow-up.
- Every email carries a postal address and an explicit, one-line way out. See §5.
- Maintain a suppression list from day one. Anyone who says stop is never contacted again, on any channel, forever. Honor within 48 hours (CAN-SPAM allows 10 business days; 48 hours is the decent norm and costs nothing).

---

## 5. Email sequence

Two touches. That's it. Anything more from a stranger asking for a favour is harassment with a schedule.

### Email 1 — day 0, plain text, no link, no pixel

> **Subject:** question about [Shop Name]
>
> Hi [First name],
>
> I'm Adam. I'm building a tool for Etsy sellers and I'm trying hard not to build the wrong one, so I'm asking sellers first instead of guessing.
>
> I found your shop and read your about page — [one specific, true, non-flattering observation: "you've been at this since 2019 and you make every piece yourself" / "your listings are the only ones in that category with real photos"].
>
> One question: what was the most annoying part of running your shop last week? Not the biggest-picture thing — the actual thing that wasted your time or made you swear.
>
> Just hit reply. One sentence is plenty. I'm not selling anything and there's nothing to click.
>
> If you'd rather I left you alone, reply "stop" and I'll never email you again.
>
> Adam
> [Your name, full postal address]

Notes on why it's shaped like that: it says who you are and what you want in the first two lines; the specific observation proves a human opened the shop; the question is about *last week*, not opinions and not the future (Mom Test); the ask is one sentence, not a form; the out is explicit and effortless; the postal address and opt-out satisfy CAN-SPAM even though a genuinely non-commercial research email arguably falls outside it. **Never say "I hope this finds you well." Never bold a header. Never write three of anything.**

### Email 2 — day 5, same thread, reply to your own email

> Hi [First name] — one nudge in case that got buried, then I'll stop.
>
> Same question: what was the most annoying part of your shop week?
>
> If typing a reply is too much, here's the same thing as seven taps: [Tally link]
>
> And if you want me gone, reply "stop" — no hard feelings either way.
>
> Adam
> [Full postal address]

No third email. Ever.

---

## 6. Week-by-week execution

### Week 1 — the week that actually matters. Budget: $162–212.

| Day | Do | Cash |
|-----|-----|------|
| 1 (4h) | Read the **Etsy 2024 Global Seller Census** (`storage.googleapis.com/etsy-extfiles-prod/2025_Q1_GLOBAL_Seller%20Census%202024.pdf`) and the **Q1 2026 shareholder letter**. Anything they answer is a question you are now banned from asking. Then pull 90 days of r/EtsySellers via the official Reddit API, cluster, read the top ~200 threads. Write down the five recurring pains **in sellers' own words**. | $0 |
| 1 (2h) | Same treatment for the 1- and 2-star reviews of eRank, EverBee, Alura, Marmalead. That list is your gap map: what the incumbents already ship, and where they fail. **eRank ships an AI Listing Helper from $5.99/mo. Alura ships AI titles, descriptions and customer responses from $7.99. The "AI listing optimizer" slot is occupied.** Find out what isn't. | $0 |
| 1–2 (2h) | Book 6–8 Etsy sellers on Fiverr/Upwork for "shop consultation" gigs at $20–30. Screen for real shops with real revenue. In parallel: **modmail the r/EtsySellers mods**, ask permission for a research post, offer a $25 gift card for a 20-minute call. | $150–200 |
| 2–5 (6h) | Do the calls. Mom Test rules: ask about their **last week**, never their opinion, never the future, never your idea. Use the interview guide in [SELLER-SURVEY.md §7](./SELLER-SURVEY.md). Ten conversations is enough. | $0 |
| 5 (1h) | Email the founders of eRank, EverBee, Alura, Marmalead, Craft Industry Alliance, and two Etsy-seller newsletters. One reply pays for the week. | $0 |
| 5 (20m) | **Find out whether you're allowed to be called Etsyc** before it goes on anything. See §7. | $0 |
| 6–7 (4h) | Write the PRD from the calls and the corpus. *Then* build the Tally form — and use it to **scale-test the hypothesis you now have**, not to go looking for one. | $0 |

### Week 2 — scale-test. Budget: $0–75.

- Post the mod-approved research thread in r/EtsySellers. Cross-post to r/Etsy and r/EtsySellerHelp (confirm they exist and size them — nobody did).
- Post in whichever Facebook groups approved you. Expect rejection as the base case.
- Buy the sending domain, stand up the inbox, SPF/DKIM/DMARC, and start using it for the founder-to-founder emails so it accrues genuine history. ($20)
- Ship the Tally form + the Supabase webhook.
- Optional: $25 gift cards for the two best Reddit call volunteers. ($50)

### Week 3 — the email supplement. Budget: ~$1.

- Hand-collect 500 US shops → ~40–60 deliverable addresses (§3). Calibrate the funnel on the first 100 and **write down the real hit rate** — you will be the only person who has ever measured it.
- Verify the list ($0.50). Send 10–15/day for a week. One follow-up each.
- **Kill criterion: if the first 30 sends produce fewer than 2 replies, stop. Don't send the other 30.**

### Not in the plan, on purpose

Warm-up pools · Instantly · Smartlead · multiple sending domains · residential proxies · Playwright/Puppeteer against Etsy · Hunter/Apollo · Apify · Reddit ads · podcast sponsorships · any send to EU, UK, or Canada.

**Total, three weeks: $185–235.** Against a $200 ceiling, that's within noise — cut the optional gift cards if it isn't.

---

## 7. The name — resolve in week 1, 20 minutes

Every serious tool in this category avoids "Etsy" in its brand: eRank, EverBee, Alura, Marmalead, Sale Samurai, Vela. That is not an aesthetic coincidence. "Etsyc" is one character from Etsy's registered mark, and the plan as originally scoped had you cold-emailing thousands of Etsy sellers *from a domain containing Etsy's trademark* — which is the most efficient possible way to summon a C&D and lose every channel at once.

**Do this:** search the USPTO TESS and EUIPO databases for Etsy's registered marks and their classes; read Etsy's published trademark/branding policy for third-party developers; then get 30 minutes with a trademark solicitor before printing the name anywhere.

**This is flagged UNVERIFIED. Nobody in the research read Etsy's trademark policy. Get a lawyer before relying on any of it.** Until it's resolved, send research emails from a neutral or personal domain and sign them "Adam," not "Etsyc."

---

## 8. Success criteria

The primary metric is not responses. It is **whether you can write a PRD you'd bet money on.**

| Signal | Worked | Didn't |
|--------|--------|--------|
| **Deep conversations** (paid interviews + Reddit calls + market stalls) | **≥10**, of which ≥4 with sellers grossing $500+/mo | ≤5 → the problem is your ask, not the channel. Rewrite the ask, don't buy more channels. |
| **Convergence** | The same 2–3 pains, in sellers' own words, appear in the corpus *and* in the interviews *and* in the survey open-text | The three sources disagree → you don't have a pain, you have noise |
| **Survey completions** | **≥40**, of which **≥8 from the $500+/mo revenue bands** | <40, or all respondents in the <$100/mo band → see below |
| **Email pilot** (~60 sends) | ≥4 replies (≈6%) → the channel is real and worth 500 more sends | ≤1 reply from the first 30 → kill it, don't send the rest |
| **Founder-to-founder** | 1 call with an incumbent founder | 0 replies → not a failure, it cost an hour |

### The one that will lie to you

**A high response rate from the wrong sellers.** Etsy is a power law: the top decile does most of the GMS, and the median shop grosses roughly $1,950 a *year* (Etsy's own disclosure: $10.9B marketplace GMS ÷ 5.6M sellers). The population reachable by free surveys, Reddit threads and cold email is the aggrieved, time-rich, low-revenue side-hustler. The population that pays $29/mo for Alura is the busy professional who ignores strangers. **Every channel in this plan selects against the buyer.** A $10 gift card is an incentive that actively selects for the seller who needs $10.

That is why the revenue-band question in the survey ([SELLER-SURVEY.md](./SELLER-SURVEY.md) Q6) is not demographic filler — it is the screener that tells you whether the data you just collected describes anybody who will ever pay you. **If fewer than 8 of your 40 respondents gross $500+/mo, treat the entire dataset as coloured by non-payers and go back to channel 2 with a bigger budget.** Paid interviews are the only channel in this document that lets you choose who you talk to.
