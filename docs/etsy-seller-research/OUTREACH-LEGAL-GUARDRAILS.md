# Outreach Legal Guardrails

**Status:** Binding on all outreach. Read before the first send.
**Companions:** [SELLER-OUTREACH-PLAN.md](./SELLER-OUTREACH-PLAN.md) · [SELLER-SURVEY.md](./SELLER-SURVEY.md)

> **This is not legal advice.** It is a research summary written by an engineer. Several load-bearing items below are flagged **UNVERIFIED** — get a lawyer before relying on any of those. Where a primary source could not be read (Etsy returns HTTP 403 to every automated fetch, reproduced independently by two research passes), that is stated explicitly rather than papered over.

---

## 1. The rule that makes everything else simple

**Send to US sellers only. Exclude the EU, the UK, the EEA, and Canada entirely.**

Not as a risk-tolerance judgement — as an architectural one. A scraped or harvested list is **structurally non-compliant in the EU and UK regardless of jurisdiction, France included**, because of GDPR Art. 14 (below). You cannot fix it with a legitimate-interest assessment, a good unsubscribe link, or a careful tone. The only compliant move is not to collect them.

This also dissolves the original plan's central contradiction, which nobody spotted while the research threads ran in parallel: **the only surface where Etsy publicly exposes a seller's email address is the DSA/GPSR trader-details block, which renders to EU/UK viewers — and EU/UK sellers are precisely the ones you may not cold-email.** The emails you can get are the emails you may not send to. The plan ate itself.

---

## 2. What is permitted, per jurisdiction

### United States — cold email to sole traders is **permitted**, opt-out regime

**CAN-SPAM does not require prior consent.** It requires, for any commercial email:

1. No false or misleading header information.
2. No deceptive subject line.
3. Identification as an advertisement (any clear means; context can suffice).
4. **A valid physical postal address.**
5. **A clear opt-out mechanism**, which must keep working for **at least 30 days** after the send.
6. **Opt-outs honored within 10 business days.** (We use 48 hours. It costs nothing and it's decent.)

Source: FTC CAN-SPAM Compliance Guide — `ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business`. *(Note: ftc.gov 403s automated fetch; the six requirements above were confirmed against multiple independent secondary sources reporting the FTC guide. Substance is uncontroversial.)*

**Penalty calibration — do not let anyone scare you with the wrong number.** The $53,088-per-violation figure that circulates is the **statutory maximum civil penalty** under the FTC Act (effective 17 Jan 2025; still $53,088 in 2026 because OMB cancelled the inflation adjustment). It is a ceiling for egregious commercial spammers, not an expectation. For calibration: **Verkada sent 30M+ commercial emails and the total DOJ/FTC penalty was $2.95M — about $0.10 per email — and that bundled data-security and deception counts.** FTC civil enforcement against a solo founder sending 60 hand-written research emails is not the risk. **Your real downside is provider suspension and domain reputation, not a judgment.**

*Nuance worth knowing:* CAN-SPAM governs messages whose **primary purpose is commercial advertisement or promotion**. A genuinely non-commercial market-research email that sells nothing arguably falls outside it entirely. **Do not rely on that.** Include the postal address and the opt-out anyway — it costs one line and it removes the question.

### United Kingdom — **DO NOT SEND**

**UK PECR reg. 22 requires prior consent** to send marketing email to an "individual subscriber," and the **ICO is explicit that sole traders and unincorporated partnerships ARE individual subscribers** — treated exactly like consumers. Etsy sellers are overwhelmingly sole traders (Etsy's own 2024 Census: **89% are businesses of one**).

The mitigation you'd reach for doesn't exist:

- **You cannot filter for the corporate ones.** ICO guidance says you generally cannot tell a sole trader from a limited company from an email address, and **when in doubt you must assume individual.** "Just exclude the sole traders" is not an available move.
- **Soft opt-in does not apply.** It is available only for people who already bought from you or negotiated to buy. A cold prospect is excluded by definition. Invoking it for cold outreach is a category error.
- **Legitimate interest does not cure it.** GDPR Art. 6(1)(f) is a *lawful basis under GDPR*; PECR sits on top and independently demands prior consent. Confirmed by EDPB Guidelines 1/2024 and the ePrivacy-as-*lex specialis* principle. A documented LIA for cold email to UK sole traders produces a written record proving you knew the rule and proceeded anyway.

Source: ICO — `ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/business-to-business-marketing/`. The UK is the **largest non-US Etsy seller bloc (~10%)** and has the strictest regime. "Filter out the EU" without filtering out the UK misses the biggest problem.

### Germany (and by extension, treat all of the EU this way) — **DO NOT SEND**

**UWG § 7 Abs. 2 Nr. 2** requires **prior express consent** for advertising by electronic mail, and it applies to **any** *Adressat* — B2B included, sole traders included. Verified verbatim at `gesetze-im-internet.de/uwg_2004/__7.html`: *"Werbung unter Verwendung … elektronischer Post, ohne dass eine vorherige ausdrückliche Einwilligung des Adressaten vorliegt."*

> Correction to a citation that circulates widely, including in our own research: the provision is **§ 7 Abs. 2 Nr. 2**, not Nr. 3. Nr. 3 is the pre-December-2021 numbering and now covers concealed sender identity.

What makes Germany the sharpest edge is not the regulator — it is the **Abmahnung**: a private cease-and-desist with recoverable legal fees, available to *competitors*, cheap and routine to send. Realistic cost: a few hundred to low-four-figures EUR plus a signed undertaking with a contractual penalty on repeat. Not existential. But it is per-complainant and repeatable, and Germany is the densest part of the EU seller pool.

### France — **DO NOT SEND** (it is *not* the safe harbour it looks like)

CNIL does permit B2B prospecting on a legitimate-interest basis without prior consent — **but only if the person "a été informée de la possible utilisation de son adresse électronique … pour de la prospection et est en mesure de s'y opposer" — informed at collection.** A harvested list has informed nobody. It fails the French test on the same clause everyone quotes to claim it passes.

Source: `cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique-sms-mms-et-automate-dappel`

*(One genuinely favourable carve-out: purely generic addresses — `contact@`, `info@` — fall outside the prospecting rules entirely because they are not personal data. This does not rescue the plan: an Etsy sole trader's shop email is a personal address, and we're dropping generic addresses anyway as poorly attributed.)*

### GDPR Article 14 — the one that actually kills EU/UK, in every member state

**If you obtain someone's personal data from anywhere other than the person themselves, you must give them a privacy notice — disclosing the source — within one month, or at the latest at first contact.** Art. 15 separately obliges you to disclose the source on request.

This bites at **collection**, not at send. So "we'll geo-filter at the send stage" is architecturally too late by design.

**This is not theoretical.** CNIL fined **Kaspr €240,000** (5 Dec 2024) and the transparency and source-disclosure failures were a core part of it — notice given four years late and only in English (Arts. 12/14), and refusal to disclose data sources on request (Art. 15). The Polish DPA has enforced the same duty against list-builders. "Disproportionate effort" fails as a defence precisely because you are holding their email address.

> **Whatever else you do, never adopt the instruction "never reveal how you sourced the list."** It is the exact opposite of the law — Arts. 14(2)(f) and 15 *require* source disclosure — and it is evidence of consciousness of wrongdoing. This is why [SELLER-SURVEY.md §6](./SELLER-SURVEY.md) makes `source_url` a **NOT NULL** column on `outreach_contacts`.

### Canada — **DO NOT SEND**

CASL requires express or implied consent for any commercial electronic message. "Conspicuous publication" implied consent exists, but the **CRTC reads it narrowly**: mere public availability is not enough, and the message must be directly relevant to the recipient's business role. AMP maxima are CAD $1M (individual) / $10M (organization).

**Less scary than it's usually painted:** CASL's **private right of action has been suspended indefinitely** since Order in Council P.C. 2017-0580 (June 2017) — exposure is regulator-only, no class actions. But it is moot for us: Etsy seller emails are not "conspicuously published" anywhere in the sense CASL means, so the implied-consent door doesn't open. Excluding Canada costs us little and removes the question.

Source: `crtc.gc.ca/eng/com500/faq500.htm`

---

## 3. How to actually filter

Filter at **collection**, never at send. A row that shouldn't exist is a row you shouldn't have collected.

| Signal | Rule |
|--------|------|
| Etsy shop location field | Must read **United States**. *(Self-declared and imperfect — treat as necessary, not sufficient.)* |
| Their own website | Must show a US address, US phone, US shipping, or a US business registration. A `.co.uk` / `.de` / `.fr` / `.eu` TLD is an immediate drop. |
| Any EU/UK/CA signal anywhere | Drop the row. When in doubt, drop the row. A doubtful row is worth ~$3 of expected value and is not worth an Art. 14 problem. |
| Print-on-demand / dropship shops | Drop. The published "manufacturer" contact is Printify's or Gelato's, not the seller's. |
| Generic addresses (`hello@`, `info@`) on a one-person shop | Drop. Poor attribution, and the reply comes from nobody. |

Enforced in the schema: `outreach_contacts` carries `constraint outreach_contacts_us_only check (country = 'US')`. The database will not let you store a European seller. That is deliberate.

---

## 4. Mandatory elements of every email

Every message. No exceptions. No "just this one."

1. **Who you are.** Real name, real identity. No pseudonyms, no fake company.
2. **A valid physical postal address**, in the footer. A PO box or a registered-agent address is fine.
3. **A clear, working way out.** At 60 sends, `reply "stop" and I'll never email you again` fully satisfies CAN-SPAM and needs no hyperlink — which is what lets email 1 stay link-free and plain-text. It must keep working for **at least 30 days**, and you honor it within **48 hours** (the law allows 10 business days).
4. **Truthful subject and headers.** No `Re:` on a first contact, no fake threading, no spoofed From.
5. **Suppression list checked before every send.** `email_suppressions`, keyed on `sha256(lower(trim(email)))`. **Never delete a row from it.** Anyone who opts out is never contacted again, on any channel, forever — including the Reddit and Facebook channels if you recognize the name.

### RFC 8058 one-click unsubscribe — required?

**No, not at your volume — and it is important that you know why, because it is a five-week and $95/month difference.**

Google's and Yahoo's DMARC and `List-Unsubscribe` / `List-Unsubscribe-Post` requirements bind on **bulk senders: more than 5,000 messages per day to Gmail accounts.** Microsoft matched the same 5,000/day threshold on 5 May 2025. **You will send roughly 15 a day.**

What actually applies to you is the **all-senders baseline**: SPF **or** DKIM (not necessarily both), valid forward and reverse DNS (PTR), TLS, RFC 5322-compliant formatting, and a spam-complaint rate that never reaches **0.30%** (target **<0.10%**). Google escalated from soft-fail to permanent 5xx rejection in November 2025 — real, but it's about complaint rates, not headers.

**Do SPF + DKIM + DMARC (`p=none`) anyway.** Twenty minutes of DNS, free, and it's the direction of travel. Just don't let "we must be bulk-sender compliant" inflate the timeline or the budget. **If you ever exceed 5,000/day to Gmail, RFC 8058 becomes mandatory and this section is void.**

---

## 5. Etsy's terms — exactly what we must not do

> **Sourcing caveat, stated honestly:** `etsy.com/legal/*` and `help.etsy.com` return **HTTP 403 to every automated fetch**. Two independent research passes reproduced this. The quotes below come from search-engine snippets of those exact URLs, mirrored policy versions, and secondary reporting. They are almost certainly substantively correct — every marketplace bans scraping — but **nobody on this project has read the operative contract in a browser.** Before you rely on the precise wording of any of it, **open these pages in an actual browser and read them:** `etsy.com/legal/terms-of-use/`, `etsy.com/legal/api/`, `etsy.com/legal/sellers/`, `etsy.com/legal/community/`.

**Terms of Use** — *"you agree not to crawl, scrape, or spider any page of the Services"* and not to reverse-engineer the source.

**API Terms of Use** — prohibits *"automated systems or browser extensions to access, analyze, or scrape the Etsy Site, the Etsy API or any Etsy data, including but not limited to Etsy listings, shops, or user profiles"* without express written authorization. Separately prohibits using the API *"for purposes of transmitting spam or other unsolicited marketing communications"* and prohibits processing personal data about Etsy members without that member's affirmative authorization.

**Seller Policy (Messages / Convos)** — *"Messages may not be used for the following activities: Sending unsolicited advertising or promotions, requests for donations, or spam."*

**Community Policy** — prohibits *"unsolicited or duplicate posts or links to your shop, fundraisers, surveys, social media or other promotional content."* The word **surveys** is in the ban list, verbatim.

### Therefore, hard rules

| Never | Always |
|-------|--------|
| Run a crawler, scraper, spider, Playwright/Puppeteer job, Apify actor, or browser extension against etsy.com | Browse by hand, at human speed, **logged out** of any Etsy account |
| Use the Etsy API to source contacts or to send anything | Take the email from the seller's **own website or own social bio** — a surface *they* control, where *they* published a contact address to be contacted |
| Send anything through Etsy Convos | — |
| Post the survey in the Etsy Community forums | — |
| Buy a list | — |

### The risk nobody priced, and it is the biggest one

**Etsy account termination follows the person, not the script.** Etsy asserts the right to permanently revoke selling rights *"either on your now-suspended account or via any other Etsy selling account in the future."* **[UNVERIFIED — help.etsy.com 403s; get this confirmed in a browser before relying on it.]**

If this product is a tool *for* Etsy sellers, it will eventually need a working Etsy API key and OAuth app to function. **Scraping under the same identity puts the product's own lifeline on the table.** That is not a GDPR fine or a deliverability ding — that is the business. It is the single strongest argument against the entire scrape-then-email plan and the original research priced it at zero.

Corollary: **if you open your own Etsy shop** (recommended — a $0.20 listing gets you posting rights in the Etsy Community, firsthand product insight, and converts you from "stranger with a survey" to "seller building a thing"), the ToS downside becomes concrete and personal. Which is one more reason to kill the scraping path rather than tiptoe around it.

---

## 6. Legal comfort that does not exist

Two citations circulate as reassurance. Both are wrong, and one is **backwards.**

**hiQ Labs v. LinkedIn did not protect scrapers. hiQ was destroyed.** LinkedIn won summary judgment on breach of contract (Nov 2022); the Dec 2022 stipulated consent judgment was **$500,000 against hiQ**, plus a **permanent injunction** to cease all scraping and destroy all scraped data and derived algorithms. hiQ wound down. The Ninth Circuit's narrow CFAA holding survives — but **criminal CFAA was never your risk. Breach of contract is, and that is exactly the claim hiQ lost.** Citing hiQ as cover is the most dangerous single error in the research pile.

**Van Buren v. United States (2021)** *is* good law and *is* correctly stated: "exceeds authorized access" means entering areas of a system off-limits to you, not misusing access you have. It forecloses most CFAA claims against scrapers of public data. **It says nothing about breach of contract, and contract is the weapon platforms actually use.**

**Meta v. Bright Data (N.D. Cal., 23 Jan 2024, Chen J.)** genuinely held that *"the Facebook and Instagram Terms do not bar logged-off scraping of public data."* Real, and useful — but: it is **one district court opinion**, not binding precedent; it turned on the specific construction of the word "use" in **Meta's** terms; Meta's tortious-interference claim **survived** summary judgment; and it says **nothing about Etsy**, whose wording nobody on this project has read. "Scrape logged out and Bright Data protects you" is a claim about the wording of a document no one has opened.

---

## 7. Honest risk ranking — what will actually bite

Ordered by expected cost × probability, not by how frightening the number sounds.

| # | Risk | Likelihood | Cost | Mitigation |
|---|------|-----------|------|-----------|
| **1** | **Trademark.** "Etsyc," and any domain containing `etsy`, against Etsy's registered mark. Cold-emailing sellers *from* such a domain is the most efficient possible C&D trigger, and a C&D mid-campaign poisons every channel at once. Every incumbent (eRank, EverBee, Alura, Marmalead, Sale Samurai, Vela) avoids the word. That is not a coincidence. | **Medium–High** if you ship the name | Rebrand under duress, mid-campaign — the worst possible time | **Resolve in week 1.** Search USPTO TESS + EUIPO; read Etsy's third-party branding policy; 30 minutes with a trademark solicitor. Until resolved, send from a neutral or personal domain and sign "Adam." **UNVERIFIED — get a lawyer before relying on any of this.** |
| **2** | **Etsy account / API termination**, permanent and cross-account, if you automate against Etsy — killing the API key your product will need. | **Medium** if you automate · **Very low** if you hand-browse | **The business.** This is the highest-severity item on the list. | Never automate against etsy.com. Hand-browse, logged out. Never touch the API for outreach. |
| **3** | **Sending-provider suspension.** Google Workspace's AUP prohibits *"unsolicited mass email, promotions, advertisements, or other solicitations ('spam')."* Resend and Postmark ban cold outreach outright and terminate without warning or refund. | **Low** at 60 hand-written sends · **High** at 2,000 | Lose the inbox; **lose your transactional email too** if it's the same account | Dedicated domain and inbox, never the product's. **Never Resend, never Postmark, ever, for anything cold.** At 15/day of individually-written mail you are relying on lax enforcement, not permission — know that. |
| **4** | **Deliverability damage** — complaints, blacklisting, burned domain. | **Low–Medium** | Weeks of degraded sending; recovery may mean abandoning the domain | Separate domain from the product's; SPF/DKIM/DMARC; verified list; plain text; no pixel; 48h opt-out; keep complaints under 0.10%. |
| **5** | **A UK/EU complaint** → ICO/CNIL warning or delete-order, or a German Abmahnung (few hundred to low-four-figure EUR + a signed undertaking with a penalty on repeat). | **Near zero if you exclude EU/UK.** Medium-high if you don't — at 2,000 recipients that's 2,000 draws. | Nuisance to low four figures, per complainant, repeatable | **Exclude EU/UK/EEA/CA at collection.** Enforced by a DB check constraint. Never at the send stage — Art. 14 bites at collection. |
| **6** | **CAN-SPAM enforcement.** | **Very low** for a solo founder sending 60 research emails | Theoretically $53,088/violation; realistically nothing | Postal address + opt-out + honest headers. Done. Do not let the ceiling figure drive decisions. |
| **7** | **CFAA.** | **Negligible** post-*Van Buren* for public data | — | Not your risk. Contract is your risk. |

### The risk that isn't legal at all, and is bigger than everything above

**That the sellers these channels reach are not the sellers who would pay.** Free surveys, Reddit threads and cold email all select for the aggrieved, time-rich, low-revenue side-hustler. The seller who pays $29/mo for Alura is the busy professional who ignores strangers. **Every channel selects against the buyer.** The failure mode isn't a low response rate — it's a *high* one, from the wrong people, which feels like validation and produces a PRD for a product with no payer.

The revenue-band screener ([SELLER-SURVEY.md](./SELLER-SURVEY.md) Q6) is the only defence, and paid interviews are the only channel where you get to *choose* who you talk to. That is why they lead the plan.

---

## 8. Pre-flight checklist — every box before the first send

- [ ] Name/trademark question resolved, or sending from a neutral domain under a personal signature
- [ ] Sending domain is **not** the product's domain, and contains no form of the word "etsy"
- [ ] SPF + DKIM + DMARC (`p=none`) live on the sending domain
- [ ] **Not** Resend. **Not** Postmark.
- [ ] Every row in `outreach_contacts` has a `source_url` and `country = 'US'`
- [ ] Zero EU / UK / EEA / Canada rows exist in the table
- [ ] Zero print-on-demand shops; zero generic `hello@` / `info@` addresses
- [ ] List verified (NeverBounce or ZeroBounce)
- [ ] `email_suppressions` table exists and is checked before every send
- [ ] Email 1 has: real name, physical postal address, `reply "stop"` out, no link, no pixel, no attachment
- [ ] Sequence is **two touches, then silence**
- [ ] Every email address in the list came from a page **the seller controls** — their own site, their own bio — never from Etsy's trader-details block, never from Etsy Messages, never from a crawler
