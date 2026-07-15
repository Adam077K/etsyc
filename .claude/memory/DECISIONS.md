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

## 2026-07-14 — The name "Etsyc" must be abandoned (AWAITING FOUNDER SIGN-OFF)

**Context:** Before running seller outreach, the CEO commissioned a trademark check on "Etsyc" /
etsyc.com. The outreach plan would have put the name on a sending domain, a survey form, and
hundreds of emails to Etsy sellers.

**Findings (all sourced, HIGH confidence):**
- Etsy's Trademark Policy prohibits exactly this construction, verbatim: *"DON'T use the Etsy Marks
  or a term confusingly similar to 'Etsy' in the name of your company, organization, domain name,
  or trademark"* and *"DON'T alter, distort, or modify the Etsy Marks, including adding other terms
  to the Etsy Marks to create new words."*
- ETSY is a registered USPTO word mark (Reg. 3,297,913, registered 2007, renewed).
- WIPO **D2025-1536** (2025): `etsyuniverse.com` held confusingly similar for wholly adopting the
  mark plus a common term — **transferred to Etsy**. Near-on-point for `etsyc.com`.
- The 2008 case that Etsy *lost* (`etsey.com`, NAF FA0810001222645) turned solely on the domain
  predating Etsy's trademark rights. That defence is unavailable now.
- **The real kill switch is not litigation — it is the API.** Etsy's API Terms require app names to
  comply with the Trademark Policy; developers are documented as having API keys rejected for
  including "etsy" in the app name, silently and with no appeal. Etsyc's product depends on that API.
- Nominative fair use does NOT protect a mark inside your own brand name (New Kids 3-part test,
  prong 2 and 3). It DOES protect *"a tool for Etsy sellers"* as a descriptive tagline.
- **eRank was originally "EtsyRank"** and rebranded. No major incumbent (EverBee, Alura, Marmalead,
  Sale Samurai, Vela) uses "Etsy" in its brand. This is not a coincidence.

**Decision:** Rebrand before applying for an Etsy API key or publishing anything under the name. Do
not stand up etsyc.com even as a placeholder — public use with knowledge of the mark is evidence of
bad faith in a UDRP. Keep "for Etsy sellers" as a tagline; that is safe and is how every incumbent
operates.

**Rationale:** Cheap to fix today (a naming session). Existential later, once there are customers,
an API key, and search equity in the name. The API-rejection path means the product can die without
anyone ever sending a legal letter.

**Reversibility:** irreversible (once public use begins, it becomes UDRP evidence)
**Owner:** ceo
**Affects:** all — domain, product name, outreach sending domain, survey branding, API application
**Status:** Recommendation. Awaiting Adam's sign-off.
