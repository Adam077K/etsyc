# R1 — Broad-Adversary: the KILL thesis against "In the Making"

> Role: prosecutor. Not a balanced critic. I read only R0 framing, the locked
> goal doc (`docs/01-foundation/realness-goal.md`), and DECISIONS.md. I built
> the sharpest case that this bet is the wrong one, then checked whether the
> evidence justifies KILL vs PAUSE. Final verdict at the end.

---

## Opening statement — the world where "In the Making" was the wrong call

**Date: Friday, July 24, 2026. Pitch day.**

The Etsy panel is polite for the first two minutes. Then Dina Murphy leans
forward and asks the one question the concept cannot survive:

> *"You've got 8 million active sellers. What percentage of them will actually
> capture two-to-three per-order clips, week after week, at their bench,
> without staging it? And how did you validate that in two weeks?"*

The team's honest answer is: we tested with **one** maker (the goal doc
literally says "≥1 real maker"), that maker was recruited into the study and
therefore performed for the camera, and the buyer-side test was a
Wizard-of-Oz thread of pre-recorded clips that the "buyer" watched inside a
Figma prototype. We proved that a curated, produced version of the concept is
*delightful*. We proved nothing about the supply-side viability, which is the
entire proposition ("near-zero seller effort").

The panel exchanges glances. One of them notes — because they've lived
Etsy's product history — that Etsy has tried maker-video adjacencies before
(Etsy Studio, Etsy Video Story, Explore, the maker-video creator programs)
and they died on the same rock: sellers don't shoot content on cadence. The
panel is not hostile. They just already know how this story ends on the
seller side, and the pitch didn't touch it.

Then the second question:

> *"Your own R0 says process-video fake-resistance decays in 12–18 months.
> Sora 3 ships this fall. What is the concept in Q4 2027?"*

The team pivots to "…and it scales to Trust Graph." At which point the panel
does the math the team should have done: **if the durable answer is Trust
Graph, why is Trust Graph the wing and In-the-Making the spine?** The bet
has been backwards the whole time. The hero has a 12–18 month expiration
date; the demo-hardest alternative is the one with a decade of legs.

Meanwhile, in a parallel session, a competing team pitches something
smaller: a maker-vouches-for-maker widget with a hand-seeded graph of 40
verified sellers, live in a working web prototype, tested with 12 Gen Z
buyers who could name three vouched-for sellers from memory 48 hours later.
It is less ambitious. It is more real. It doesn't have an AI-video shelf
life problem. The panel rewards the honest test over the beautiful demo.

That is the world where "In the Making" was the wrong call.

---

## Evidence — the empirical case against the spine

### Evidence 1 — The seller-effort claim is the entire product and it cannot be tested in the time you have

The concept's central promise is "zero DM / relationship burden on the
seller … capture during work they already do." Everything downstream —
proof legibility, frequency loop, panel plausibility — collapses if the
seller side collapses.

The goal doc itself flags this as *"THE crux"* (crux #1 of 3) and admits the
test target is *"≥1 real maker."* One maker, in a two-week study, who knows
they're being watched, is not evidence about seller effort at scale. It is a
demo. A single-N test on the load-bearing variable is closer to a
falsification of the concept than a validation, because a positive result
provides no signal and a negative result kills the pitch four days before
final.

Your discovery data (per R0) already showed *"almost no interaction at all
with the customer"* — this is not a training problem, it is a revealed
preference. Sellers have designed their workflow to *avoid* this exact class
of task. The claim that a per-order capture ritual is "genuinely passive" is
an assertion, not a finding.

### Evidence 2 — The made-to-order shape only covers a fraction of the Etsy problem

"Turn the wait into the product" only works when there *is* a wait. Large
swaths of Etsy — ready-to-ship inventory, digital downloads, printables,
vintage resale, print-on-demand — have no wait to turn into anything. The
spine excludes these categories by construction.

The categories with a real wait are the highest-price, lowest-frequency
end of the marketplace — jewelry commissions, custom furniture, bespoke
apparel. That is precisely the segment where price-driven defection is
worst (91% buy on price, 71% dupe per R0). You are pitching a frequency
lever aimed at the slice of Etsy least positioned to move the frequency
number Kruti Patel Goyal actually cares about.

### Evidence 3 — The frequency math doesn't reach the wound

The pitch claims a "3× return loop" per order. Assume every element works
and every buyer opens the thread each time. A ~3×/yr buyer becomes a
~9× app-open/yr buyer. The frequency wound (habitual buyers −11% YoY,
average ~3×/yr) is a *purchase*-frequency problem, not an
*app-open*-frequency problem. Opening the app to watch a clip doesn't
retire the −11% number unless it converts to a second purchase, and there
is currently no mechanism in the pitch for that second purchase — the
thread ends when the item ships.

Frequency-through-thread is a per-order phenomenon and therefore ceilinged
by order-count. Follow-the-Hands is a per-day phenomenon (a feed) and
therefore uncoupled from order-count. Follow-the-Hands is structurally the
frequency answer. In-the-Making is a demo of proof, dressed as a frequency
answer.

### Evidence 4 — The signal has a public expiration date the panel will know

R0 concedes process-video fake-resistance decays in 12–18 months as
Veo/Sora improve. C2PA camera-signing is called out as "shopper-illegible
today." So the entire un-fakeability claim rests on a primitive with a
stated shelf life shorter than the launch window of a real Etsy feature.
The panel — product operators — will price this in. The pitch's own
research kills its own durability argument.

The only alternative with generative-AI-resistance built in is **Trust
Graph**: humans vouching for humans is not a signal a video model can
generate, because the signal is the *relationship*, not the pixel. That
places the durable spine in the wing and the expiring spine in the hero.

### Evidence 5 — The reframe is self-flattering

R0's rhetorical move is: "the romantic framing is what every other team
will pitch, so we won't." True. But the anti-romantic framing then quietly
smuggles back in a *watching-a-stranger-make-your-thing* product, which is
a romantic framing wearing a security guard's uniform. The concept still
runs on the buyer caring. It still runs on the buyer opening the app to
form a parasocial impression of the maker. The reframe won on paper by
outlawing the word *connection*, then rebuilt the connection product
underneath with different vocabulary.

Meanwhile the concept that *actually* differs from the romantic norm —
Trust Graph — is the one being demoted to a "system it grows into."

---

## The alternative — reframe the bet before Day 5

**Label: "Capture-atom hero, Trust-Graph spine, In-the-Making demo #1."**

Same atom, different center of gravity. The passive capture clip remains
the primitive. But the *pitch spine* is the Trust Graph, not the anticipation
thread. Deliverables shift:

- Build a hand-seeded graph of 30–50 real Etsy makers vouching for each
  other, each vouch backed by a shared capture-atom moment. This is
  demoable in a static prototype in 3 days.
- Use "In the Making" as **one** worked demo inside the Trust Graph story —
  the moment a vouched-for maker's process clip surfaces in the buyer's
  discovery feed. Not the whole product.
- Frequency story becomes: *"you follow humans your trusted humans follow,
  and their moments show up in a feed"* — Follow-the-Hands aesthetics on
  a Trust-Graph substrate. Uncoupled from order-count. Generative-AI-proof
  because the signal is the vouch, not the pixel.

**What you give up:** the emotional peak of "watch YOUR piece being made."
It's the most cinematic beat in the deck, and it goes away.

**What you gain:** (a) a spine you can actually test in 5 days without a
Wizard-of-Oz seller pipeline — you can *see* whether real makers will
vouch, in DMs, this week; (b) a durable signal past Sora 3; (c) an answer
that's genuinely off the romantic script other teams will pitch; (d) a
better fit to Dina Murphy's actual portfolio problem, because vouching is
a buyer-side discovery layer that doesn't tax the seller side.

The current bet has "In the Making" as spine because it's the most
demoable. That is a *demo-quality* argument, not a *concept-quality*
argument. In a pitch judged by product operators, concept quality wins.

---

## Answers to the 5 questions from R0

**Q1 — Single strongest reason "In the Making" loses the panel or fails
testing:**
The seller-effort claim is unfalsifiable in your available time and
contradicted by Etsy's own history of failed seller-video products.
Dina Murphy's panel will resolve this in one supply-side question the team
cannot answer with n=1. The demo is beautiful; the operational story
underneath it is empty. That is exactly the gap experienced product
executives are trained to detect.

**Q2 — Fastest path to proving the concept wrong by Day 5:**
Do not build. Ship a *maker-consent probe* by end of Day 4:
- Cold-DM 25 real Etsy makers today (Jul 15) — spread across custom jewelry,
  ceramics, apparel, woodwork. Message: *"We're a student team; would you
  agree to passively capture 2–3 short process clips per order for the next
  10 orders in exchange for [named incentive]?"*
- Success threshold: ≥60% *unassisted* yes, without cash incentive, closes
  within 48h. Any lower — especially any dependency on incentive dollars
  that don't scale — is a KILL signal on the spine.
- Parallel: reach out to 3 makers on the panelist's own network for
  ecological validity.

If sellers won't self-onboard when a student team asks them, they will
never self-capture at Etsy's marginal-supplier scale. This test is cheaper
than a prototype and answers the crux before you spend a build day on it.

**Q3 — Is In-the-Making the right spine, or is FTH / Trust-Graph / atom stronger?**
Trust-Graph is the right spine. It is the only alternative that: (a) is
generative-AI-resistant by construction, (b) is genuinely off the romantic
script every other team will pitch, (c) can be prototyped honestly (hand-
seed 40 makers), (d) matches Dina Murphy's buyer-side confidence-layer
mandate without adding seller chores, (e) uses the capture-atom as a
supporting primitive rather than a load-bearing one. Follow-the-Hands is
the strongest frequency story but the goal doc is correct that it's the
hardest to demo in a pitch context. In-the-Making is the best *demo* and
the worst *bet*.

**Q4 — Single change that most improves win-probability:**
Move the hero. Make Trust-Graph the spine; make In-the-Making a single
worked scene inside the Trust-Graph demo (a vouched maker's process clip
appears in a buyer's feed as one of three proof beats). Preserve the
atom, discard the ordering of assets. This costs the team one working day
of narrative rework and buys durability + testability + differentiation.

If moving the hero is deemed too disruptive, the next-best single change
is: replace "≥1 real maker" success criterion with *"≥5 real makers, each
completing 3+ real per-order captures unassisted."* If you can't hit that
threshold by Day 9, the spine has failed its own crux and you pivot.

**Q5 — What would make me change my vote:**
Three things, any two of which flip me to PROCEED_WITH_CONDITIONS:
1. Positive result from the Day-4 maker-consent probe above (≥60% yes,
   no scaling-blocker incentive).
2. A pitch-ready answer to the Sora/Veo 12–18mo decay question that does
   *not* wave at C2PA (which R0 admits is illegible today).
3. Evidence that Dina Murphy's product portfolio explicitly wants a
   made-to-order buyer-side layer over a discovery/trust layer. If she
   doesn't want the shape you're building, the concept quality is
   irrelevant.

---

## Verdict + probability

**Thesis-collapse probability by Jul 24 pitch: ~65%.** Basis: (a) the
load-bearing seller-effort variable will be tested at n=1 by the team's own
plan; (b) Etsy's operator panel will apply supply-side scrutiny the pitch
has not survived; (c) the pitch's own research kills its durability claim.
The 35% survival probability rests on charisma-of-demo carrying the room —
which does happen with student pitches, but is not a strategy.

**Verdict: PAUSE.** Not KILL, because (i) there is no supersession history
here — this is the first lock, not plan #5 in a series of abandoned plans;
(ii) the capture-atom has salvage value even if the spine falls (it powers
Trust-Graph and Follow-the-Hands equally well); (iii) the alternative
(Trust-Graph as spine) is stronger but not *strictly dominant* — it
carries a cold-start problem that requires hand-seeding to demo.

**PAUSE means:** do not spend a build day on the anticipation-thread
prototype until the Day-4 maker-consent probe returns. If ≥60% unassisted
yes, PROCEED_WITH_CONDITIONS: reframe the spine to elevate Trust-Graph and
demote In-the-Making to demo scene #1. If <60% or if consent requires
per-order cash incentive, KILL the In-the-Making spine and rebuild the
pitch around Trust-Graph seeded by capture-atoms.

**Kill-condition (explicit):** Day-4 maker-consent probe returns <60%
unassisted yes across 25 cold-DMed real Etsy makers, OR yes-rate depends
on per-order incentives >$5. Either outcome means the spine's central
supply-side claim is empirically false and the pitch cannot be honest with
the panel.

---

## Concessions to the affirmative case (in advance)

I concede three things any affirmative persona could reasonably press:

1. **In-the-Making is the most demoable spine, and demos win pitches.** True
   at the surface. But demos win pitches judged by non-operators. This
   panel operates the business the concept is aimed at. Concept quality
   dominates demo quality when the judges live inside the product.
2. **The capture-atom is genuinely reusable across all three concepts.** True,
   and that is precisely why the atom should stay while the spine moves.
3. **Reversibility is genuinely hard given the 2-week clock.** True — which
   is why the Day-4 probe matters. It costs one work-day, resolves the
   crux, and lets a reframe happen while there is still enough runway to
   execute cleanly (~5 build days remain post-probe).

Confidence: **medium-high.** The probe is a cheap test; if it comes back
positive I will happily update my probability meaningfully. If it comes
back negative, none of the affirmative arguments survive.
