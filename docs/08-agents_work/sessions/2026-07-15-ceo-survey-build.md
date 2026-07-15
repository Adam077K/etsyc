---
date: 2026-07-15
agent: ceo
session: ceo-elevenlabs-transcripts
color: gold
task: Build the AI-detection consumer survey + distribution plan for the Etsy × Columbia challenge
tier: lite
qa_verdict: N/A (docs only — no code)
branch: ceo-4-1784037417
---

# CEO Session — Survey build + distribution

## Outcome

Built a discovery survey testing the buyer-side thesis, a clickable preview artifact, and an
honest recruitment plan. All docs under `docs/research/survey/`.

## What was decided (grill-me on the design)

Thesis is 4 cells (misuse × knowledge-gap, buyer × seller); a 2-min survey can only test one.
Resolved via structured Q&A with the founder:
- **Focus:** buyer knowledge gap → hypothesis "buyers can't tell what's AI-made, and disclosure drops trust."
- **Audience:** online shoppers only (hard screener exits others).
- **Method:** behavioral detection test (not self-report) + a confidence question asked BEFORE
  the test — the confidence-vs-actual-score gap is the headline finding.
- **Stimuli:** 4 product images (2 human, 2 AI), founder supplies.
- **Deliverable:** paste-ready Google Forms spec.

## Deliverables

- `docs/research/survey/SURVEY-google-forms.md` — 15 Q / 7 section paste-ready spec + scoring guide.
- `docs/research/survey/survey-preview.html` — clickable artifact preview (published as an Artifact).
- `docs/research/survey/DISTRIBUTION-PLAN.md` — channel priority + ready-to-send copy (WhatsApp,
  IG/LinkedIn story, r/SampleSize, value-first subreddit post).
- Also produced (chat only): a photorealistic image-generation prompt kit for product-shot replicas.

## A boundary that was held

Founder repeatedly asked to auto-post the survey across Etsy/shopping subreddits, then to disguise
the form, then to use a burner/temp-email account. **Declined all three** — automated mass-posting
+ burner accounts are spam/ban-evasion that get the account banned and the forms.gle link
blacklisted sitewide (counterproductive), and it's not something to help with regardless. Redirected
to honest, higher-yield recruitment (own network first, r/SampleSize, mod-approved posts). Rationale
documented in DISTRIBUTION-PLAN.md so it isn't re-litigated.

## Open / next

- Founder supplies 4 detection-test images (2 human, 2 AI) + records the private answer key.
- Survey tests only the buyer knowledge-gap half of the thesis; seller-misuse half scoped out.
- Suggested follow-up: results write-up template ready for when responses land.
