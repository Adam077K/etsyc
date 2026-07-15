# Seller Survey — instrument spec

**Status:** Ready to build. Build it in **week 1, day 6–7 — not before.**
**Companions:** [SELLER-OUTREACH-PLAN.md](./SELLER-OUTREACH-PLAN.md) · [OUTREACH-LEGAL-GUARDRAILS.md](./OUTREACH-LEGAL-GUARDRAILS.md)

---

## 0. Read this before you build it

**A survey is a confirmation instrument, not a discovery instrument.** Run the corpus mining and the paid interviews first (Outreach Plan §2, channels 1 and 2). Form a hypothesis. *Then* use this form to find out how widely it holds. If you ship this form before you've talked to ten sellers, you will get back a paraphrase of the Etsy Seller Census and r/EtsySellers, and you will have paid five weeks for it.

Two constraints this instrument is built around, both from evidence that survived adversarial verification:

- **An open-ended first question costs you 5+ percentage points of completion** versus a multiple-choice one (SurveyMonkey's own data — "it takes less mental energy to pick a response from a list"). Every open-text field costs roughly another point. So: MC opener, two open-text fields maximum, everything else closed.
- **A yes/no "do you use AI?" is the worst possible framing.** Etsy sellers face *opposing* pressures — efficiency-signalling pushes them to over-report, while the handmade-brand stigma and fear of Etsy enforcement push them to under-report. Q4 is engineered around this: it normalizes the behaviour in the preamble, asks about concrete *tasks* rather than the loaded umbrella term, and offers a graduated scale rather than a binary.

---

## 1. Tool: Tally (free tier)

| | Tally | Typeform | Fillout |
|---|---|---|---|
| Free tier | **Unlimited forms + unlimited responses** (fair-use), conditional logic included | **10 responses/month** (cut from 100 in Feb 2026) | 1,000 responses/mo |
| Webhooks on free | **Yes** | No | Yes |
| Paid | $24/mo (removes branding) | $28/mo | — |

**Tally.** The decision is the free tier and the free webhook, nothing else. (Ignore the "Typeform links look spammy to cold recipients" argument that floats around — it's anecdotal, sourced to a competitor's blog, and unverifiable. The real reason to skip Typeform is that ten responses a month is unusable.)

**Pipe to Supabase via the webhook**, not the JS event. Tally emits `Tally.FormLoaded`, `Tally.FormPageView`, `Tally.FormSubmitted`, `Tally.PopupClosed` from every embed method — verified against Tally's primary developer docs — but a client-side event can be lost or spoofed. Server-to-server webhook → Next.js Route Handler → `insert` is durable. Use `Tally.FormSubmitted` only for analytics.

**Settings:**
- One question per page.
- **No progress bar.** The evidence for honest, constant-rate bars is null; the only variant that measurably helps ("fast-start, slow-end") works by lying to the respondent, and the researchers who documented it explicitly recommend against using it.
- Mobile-first: large tap targets, large type. Assume a phone.
- No matrix grids, no long dropdowns, no required fields except Q1.
- Label the link **honestly**: *"7 questions, about 2 minutes."* Not 90 seconds. See §5.

---

## 2. The instrument

Preamble on page 1, above Q1:

> I'm Adam. I'm building something for Etsy sellers and I don't want to build the wrong thing, so I'm asking sellers first. Seven questions, about two minutes. Nothing is required except the first one, and I'll send you what everyone said if you want it.

---

### Q1 — hardest part · multiple choice, single, required

> **Think about the last seven days in your shop. Which of these ate the most of your time or your patience?**
>
> - Getting found in Etsy search
> - Writing listings — titles, tags, descriptions
> - Photos and mockups
> - Pricing, fees, and working out what I actually made
> - Customer messages, orders, and problems
> - Actually making the product
> - Something else

**Learns:** where the pain concentrates, ranked, in a closed form you can count.
**Decision:** this is the wedge. Whichever option clears ~30% is the workflow the MVP addresses; the rest go in the backlog. If the answers spread flat across all seven with no winner, that is a real result and it means there is no wedge here — stop and go back to interviews.
**Why MC and why first:** costs ~5pp less completion than an open box, and asking about *last week* rather than in general is the only framing that gets you behaviour instead of ideology.

---

### Q2 — the why · short open text, optional (**open-text field 1 of 2**)

> **What made that hard, specifically?**
> *One or two sentences is plenty.*

**Learns:** the verbatim language behind the click. This is where the actual gold is, and they answer it because they've already committed by clicking Q1.
**Decision:** feeds landing-page copy, the PRD's problem statement, and the interview script. If the verbatims here don't rhyme with what you heard in the paid interviews, one of your two data sources is wrong and you need to find out which before writing a line of code.

---

### Q3 — what works · multiple choice, single, optional

> **And what's actually working well for you right now?**
>
> - Repeat customers
> - My photos and branding
> - Etsy search traffic
> - Word of mouth
> - Social media (Instagram, TikTok, Pinterest)
> - Honestly, nothing right now

**Learns:** where their existing traction comes from — and the size of the "nothing" bucket, which is your despair index.
**Decision:** tells you what *not* to touch (never build something that breaks the one channel that's working) and, if "Etsy search traffic" is rare while Q1 says "getting found" is the top pain, confirms the search-visibility wedge from two directions.
**Why closed:** the brief requires covering "what's good"; a closed answer covers it for ~10 seconds of respondent time instead of 35.

---

### Q4 — AI usage · multi-select + graduated scale, both on one page, optional

Normalizing preamble, shown above both fields:

> Plenty of Etsy sellers now use AI somewhere in their workflow, and plenty don't. There's no right answer here and this is anonymous — I'm just trying to find out what's actually true.

**Q4a · multi-select:** *In the last 90 days, have you used an AI tool for any of these?*
- Writing listing titles, tags, or descriptions
- Product photos, mockups, or backgrounds
- Drafting replies to customers
- Keyword or competitor research
- Creating designs or artwork that you list for sale
- Something else
- **None of these**

**Q4b · single choice:** *Overall, how much of your shop work involves an AI tool these days?*
- None of it
- I tried it once or twice
- A little
- Quite a lot
- Most of it

**Learns:** actual AI adoption among Etsy sellers, by task and by intensity. **There is no published number for this anywhere** — I looked hard and the only figure in existence ("89% of top-rated sellers use AI enhancement") comes from the same vendor content-farm cluster that fabricated Etsy's non-existent "Jan 2026 enforcement wave." This is a genuine, verified research gap and it is the single most defensible reason to run this survey at all.
**Decision:** if a large majority already uses AI for listing copy, then "AI writes your listings" is a commodity — eRank ships it from $5.99/mo and Alura from $7.99 — and you must go somewhere else. If adoption is low *and* Q1 says listing copy is the top pain, there's a gap. If adoption is high but concentrated in one task and absent in another where the pain is high, **that specific gap is the product.**
**Why worded like this:** the umbrella term "AI" is loaded on Etsy — a real anti-AI faction exists (r/CraftedByAI, a 3,155-signature petition, NBC coverage of AI-generated crochet patterns), while buyers are far more relaxed (eRank's 2024 buyer survey, n=1,000: 61% open to or would consider AI-created items, 25.3% want strictly handmade). A yes/no gets you a defensive lie in whichever direction the respondent thinks you want. Concrete tasks + a graduated scale + explicit anonymity + a preamble that says both answers are normal gets you closer to the truth.

> **Do not ask about "Etsy's January 2026 AI disclosure policy." It does not exist.** Etsy's Creativity Standards and the Made-by / Designed-by / Sourced-by attribution framework were announced 9 July 2024. The "Jan 14, 2026" date appears only in AI-tool-vendor SEO blogs that copy each other verbatim, alongside invented enforcement figures. Asking sellers about a phantom deadline confuses respondents, contaminates the data, and marks you — to precisely the audience most primed to punish it — as someone who sources facts from AI slop.

---

### Q5 — what they wish existed · short open text, optional (**open-text field 2 of 2**)

> **If you could magic-wand one thing about running your shop into existence tomorrow, what would it be?**
> *Anything. It doesn't have to be realistic.*

**Learns:** the demand in their words, unconstrained by what they think is buildable.
**Decision:** cluster these. If a cluster maps onto the Q1 winner, you have a wedge confirmed from two independent angles and that's your MVP. If the magic-wand answers are all "more sales" or "lower fees," that's a null result you must respect — it means they want Etsy to be different, not a tool, and no SaaS you build will sell to them.

---

### Q6 — the screener · multiple choice, single, optional

> **Roughly what does your shop bring in in a typical month, before fees?**
>
> - Under $100
> - $100 – $500
> - $500 – $2,000
> - $2,000 – $10,000
> - Over $10,000
> - Rather not say

**Learns:** whether the people answering you are people who could ever pay you.
**Decision:** this is the most important question on the form and it is the one nobody in the research thought to ask. Etsy's own numbers: $10.9B marketplace GMS across 5.6M sellers ≈ **$1,950 gross per seller per year**. Free surveys, Reddit and cold email all select for the aggrieved, time-rich, low-revenue side-hustler. The seller who pays $29/mo for Alura is the busy professional who ignores strangers. **Segment every other answer by this field.** If the $500+/mo bands say something different from the sub-$100 band, the $500+ answer is the only one that matters — and if you have fewer than eight respondents in those bands, you don't have data about customers, you have data about an audience.
**Why bands and not a number:** revenue is sensitive; bands with an explicit "rather not say" get answered.

> Note: the widely-circulated Etsy seller-income figures — "median $574/month," "mean $2,965/month," "top 10% do 80% of GMS" — are **fabrications**. A $2,965/mo mean would require ~$199B of GMS, roughly 18× what Etsy actually did. They are not in the Seller Census. There is no reliable public source for Etsy seller revenue distribution, which is exactly why this question exists.

---

### Q7 — the close · email + checkbox, optional

> **Want me to send you what other sellers said?** *(and I'd love 20 minutes on a call — I'll send you a $25 gift card for your time)*
>
> - `[email field]`
> - ☐ Yes, I'd do a 20-minute call
>
> *Your email is only used to send you the results and, if you tick the box, to arrange a call. It goes nowhere else, it goes on no list, and I'll delete it if you ask.*

**Learns:** who will talk to you at length — the actual output of this whole exercise.
**Decision:** every ticked box is an interview. Ten interviews beats four hundred survey rows.
**Honest note on the incentive:** the "offer of survey results" was reported as an *empirically validated* incentive for small-business owners. **The study says the opposite** — small-business executives were significantly *more* likely to respond to cash, a gift card, or a charity donation than to an offer of results. Keep the share-back: it's free, honest, and harmless. Don't count on it to lift response. The $25 gift card for a call is the part with evidence behind it.

---

## 3. Cut from the form, on purpose

| Cut | Why |
|-----|-----|
| Anything about Etsy's fees, take rate, or Offsite Ads | Publicly documented and universally known among sellers. Asking wastes a question and signals you haven't done your homework. (Also: get the facts right if you ever cite them — the *mandatory* Offsite Ads rate at $10k+ is **12%**, not 15%. 15% is the *optional* rate for sub-$10k shops, who can opt out. Getting this backwards in front of a seller costs you all credibility in five seconds.) |
| "Are you angry about the AI / handmade policy?" | Craft Industry Alliance, Reddit, NBC and 20+ articles already confirm: yes, loudly. |
| Age, gender, sole-proprietor status, primary-vs-side income, hours worked | The Etsy 2024 Global Seller Census answers all of it with n in the thousands: 80% women, 89% businesses of one, 97% home-based, average age 43, 29% sole occupation, 11% of household income on average. |
| "Have you considered Shopify / TikTok Shop?" | Foregone yes. Ask what they *tried* and what happened — in an interview, not a survey. |
| "Is Etsy growing?" | Public in the earnings calls. |
| Free-text "any other comments" | Costs a completion point, returns nothing you can act on. |
| **Deep narrative questions** ("walk me through your last 7 days"; "what was the exact moment you first considered leaving") | These are the best questions anyone produced — and they are **interview questions, not survey questions.** They need 3–5 minutes of typing each, which no survey instrument survives. They are in §7 below, where they belong. |

---

## 4. Recruit-for-interview: where the survey ends and the real work starts

The survey's job is to (a) find out how widely the pains you heard in interviews actually hold, (b) get the AI number nobody has, (c) tell you whether your respondents can pay, and (d) **hand you a list of people who will talk to you.** That's it. Q7 is the deliverable.

---

## 5. Estimated completion time

| Question | Type | Est. |
|----------|------|------|
| Q1 | MC, 7 options | 15s |
| Q2 | Open text, short | 35s |
| Q3 | MC, 6 options | 10s |
| Q4a+b | Multi-select + scale, one page | 25s |
| Q5 | Open text, short | 35s |
| Q6 | MC, 6 options | 8s |
| Q7 | Email + checkbox | 12s |
| **Total** | **7 pages** | **≈ 2:20** |

Label it **"7 questions, about 2 minutes."** That is the honest number and it is close enough that nobody feels lied to.

**Do not label it "90 seconds."** SurveyMonkey's own timing data has question 1 averaging ~75 seconds on its own, and a 10-question survey averaging ~5 minutes. A "90 seconds" promise that you break 30 seconds in is worse than an honest 2-minute label — you've turned a respondent into someone who's been misled, at precisely the moment you're asking them to trust you.

**If you add a question, remove one.** Seven is the cap. Beyond ~8–10 questions on a cold audience you are trading completions for questions you didn't need.

---

## 6. Supabase schema

```sql
-- =====================================================================
-- Survey responses (written by the Tally webhook, service role only)
-- =====================================================================
create table public.survey_responses (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  tally_response_id text unique not null,          -- idempotency: Tally retries

  source            text not null,                 -- 'reddit' | 'email' | 'fiverr'
                                                   -- | 'fb_group' | 'newsletter'
                                                   -- | 'market' | 'direct'
                                                   -- set via ?source= hidden field on the Tally link
  hardest_task      text,                          -- Q1
  hardest_why       text,                          -- Q2  (open text 1)
  working_well      text,                          -- Q3
  ai_tasks          text[],                        -- Q4a (multi-select)
  ai_share          text,                          -- Q4b (graduated scale)
  magic_wand        text,                          -- Q5  (open text 2)
  revenue_band      text,                          -- Q6  <-- segment EVERYTHING by this
  email             text,                          -- Q7  (optional)
  wants_interview   boolean not null default false,-- Q7  checkbox

  country           text,                          -- from the outreach list where known;
                                                   -- null for organic. Do NOT infer from IP.
  raw               jsonb not null,                -- full Tally payload, for re-parsing later
  deleted_at        timestamptz                    -- soft delete for erasure requests
);

create index survey_responses_revenue_band_idx on public.survey_responses (revenue_band);
create index survey_responses_source_idx       on public.survey_responses (source);
create index survey_responses_email_idx        on public.survey_responses (lower(email))
  where email is not null;

alter table public.survey_responses enable row level security;
-- No policies = no access for anon/authenticated. The webhook Route Handler
-- writes with the service-role key, server-side only. Never expose that key
-- to the client. You read this table from the Supabase dashboard or a script.

-- =====================================================================
-- Outreach contacts (the hand-built email list; provenance is mandatory)
-- =====================================================================
create table public.outreach_contacts (
  id                 uuid primary key default gen_random_uuid(),
  shop_name          text not null,
  shop_url           text not null,
  email              text not null,
  source_url         text not null,                -- the EXACT page the email was on.
                                                   -- Required: GDPR Art. 14/15 make you
                                                   -- disclose the source on request, and
                                                   -- refusing to is one of the four things
                                                   -- CNIL fined Kaspr €240k for.
  extraction_method  text not null,                -- 'own_site_contact' | 'own_site_footer'
                                                   -- | 'own_site_mailto' | 'instagram_bio'
  country            text not null,                -- 'US' only. See legal guardrails.
  collected_at       timestamptz not null default now(),
  contacted_at       timestamptz,
  followed_up_at     timestamptz,
  replied_at         timestamptz,
  opted_out_at       timestamptz,
  notes              text,

  constraint outreach_contacts_us_only check (country = 'US'),
  constraint outreach_contacts_email_unique unique (email)
);

alter table public.outreach_contacts enable row level security;

-- =====================================================================
-- Suppression list. Check before EVERY send. Never delete a row from this.
-- =====================================================================
create table public.email_suppressions (
  email_hash text primary key,                     -- sha256(lower(trim(email)))
  reason     text not null,                        -- 'unsubscribe' | 'bounce'
                                                   -- | 'complaint' | 'manual'
  created_at timestamptz not null default now()
);

alter table public.email_suppressions enable row level security;
```

**Webhook route** — `app/api/webhooks/tally/route.ts`:
1. Verify Tally's signing secret. Reject on mismatch.
2. Upsert on `tally_response_id` (Tally retries; you must be idempotent).
3. Insert with the service-role key, server-side. Never from the browser.
4. Store the full payload in `raw` — you *will* want to re-parse it once you know what you're looking for.

---

## 7. The interview guide (this is where the good questions live)

For the paid Fiverr/Upwork calls and the Q7 volunteers. Twenty to sixty minutes. **Mom Test rules: ask about their last week, never their opinion, never the future, never your idea.**

1. **Walk me through your last seven days on the shop.** Which tools, apps, or spreadsheets did you actually open? Which task made you angriest?
2. **What was the exact moment you first thought about quitting Etsy** — or moving elsewhere? What did you do next, and what stopped you?
3. **What have you actually tried outside Etsy?** Shopify, TikTok Shop, your own site, Instagram DMs. What got you your first sale there, and what failed?
4. **When Etsy suppresses or flags a listing, what do you actually do in the next 24 hours?** Walk me through it step by step.
5. **What do you pay for today** — eRank, EverBee, Alura, Canva, anything? What made you start paying, and what would make you cancel it next month?
6. Only at the very end, and only if they ask what you're building: describe it in one sentence and then **shut up and watch their face.**

These five questions are the best output of the entire research programme. They cannot be delivered through a survey — each one needs minutes of narrative — and trying to squeeze them into a form is how you end up with a 40%-abandoned instrument full of one-word answers. Deliver them on a call, where they belong.
