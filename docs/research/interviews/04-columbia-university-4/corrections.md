# Interview 4 — Corrections Log

**File:** `4-columbia-university-4.json` · **Duration:** 2:52 · **Language:** eng · **Speakers:** 3
**Evidence sources:** `scribe_v1` (word-level + logprob) · `scribe_v1_experimental` (same audio, independent decode) · context/domain vocabulary
**Applied:** 6 (4 CONFIRMED, 2 PROBABLE) · **Flagged but NOT changed:** 7

Every change made to `transcript-raw.md` to produce `transcript-corrected.md` is listed below.
Nothing was fixed silently. Fillers, stutters, false starts, and hedges were **not** touched —
only machine mishears and one speaker misattribution.

---

## 1. Corrections applied

| timestamp | raw (`scribe_v1`) | corrected | confidence | evidence |
|-----------|-------------------|-----------|------------|----------|
| **[00:27]** | `farmer's market where your...` | `farmer's market over here.` | **CONFIRMED** | `where` logprob **-1.33** (3rd worst in file). Experimental reads `over here.` across the identical span (27.96–28.32s; v1 `where` 27.96–28.30 + `your...` 28.31–28.32). "where your..." is not a grammatical English fragment; "over here" is, and it sets up the next clause ("I don't think there's a lot in New York"). Two independent sources + context. |
| **[00:39]** | `one of those fee- uh, holiday` | `one of those **flea-** uh, holiday` | **CONFIRMED** | `fee-` logprob **-1.34** (2nd worst). Experimental reads `fle-` on the same span (39.06–39.26s) → the onset is /fl/, not /fiː/. INTERVIEWER_1 said **"flea market"** at [00:13], priming the term. "flea market" is core project vocabulary. Speaker aborts the word and switches to "holiday or weekend markets" — the truncation is preserved. |
| **[01:43]** | `if you **were to** buy that online` | `if you **will** buy that online` | **PROBABLE** | `were` logprob **-0.42**. v1's `to` token spans 103.58–**103.59s** — a 0.01s degenerate token, the classic signature of a language-model insertion made to repair "were → were to". Experimental reads `will` over 103.38–103.50 with no filler token. Matches the same speaker's phrasing in the first half of their own sentence ("Do you think you **will** get the same experience"). INTERVIEWER_2 is a non-native-idiom speaker; v1 normalised them to the standard idiom. |
| **[02:15]** | `I mean, honestly, **as** for me personally,` | `I mean, honestly, **yes.** For me personally,` | **CONFIRMED** | `as` logprob **-2.13** — **the single worst-scored word in the file**. Experimental reads `yes.` over the same span (135.38–135.60s). **Meaning-changing:** the question at [02:00] was a yes/no question ("would you kind of feel distrusted...?"). "honestly, yes." *answers* it; "as for me personally" leaves it unanswered and destroys the finding. Same failure class as the `קינה → קנאה` case in file 5: cross-model disagreement catching a semantic error. |
| **[00:15]** | `mom and pop shop, or bakery.` | `mom and pop shop, or **a** bakery.` | **PROBABLE** | `bakery.` logprob **-0.90**; the token gap immediately before it scores **-1.05** — v1 itself signals a missing token at that junction. Experimental emits `a` at 15.18–15.19s, exactly filling the 15.10→15.20 gap between `or` and `bakery`. Function word only; no semantic impact. |
| **[00:50]** | turn assigned to `speaker_1` (**RESPONDENT**): *"Like, just how the experience was."* | turn re-attributed to `speaker_2` (**INTERVIEWER_2**) | **CONFIRMED** | Conversational logic is decisive: at [00:47] the RESPONDENT asks *"what exactly do you want to know about this?"* — they cannot then answer their own clarification request. Experimental diarization independently assigns this span (50.51–51.28s) to `speaker_2`, the second interviewer. v1 merged it into the respondent. Text is unchanged; only the speaker label moved. |

---

## 2. Flagged as suspicious — deliberately NOT changed

Logged so that no one "re-fixes" these later, and so that the known-unknowns stay visible.

| timestamp | raw text (kept) | suggested alternative | status | reasoning |
|-----------|-----------------|-----------------------|--------|-----------|
| **[01:05]** | `closer to the 59th **Columbus** Circle` | ~~Columbia~~ — **REJECTED** | ⛔ **CONFIRMED FALSE POSITIVE — DO NOT CHANGE** | This reads like an error because "Columbia" saturates this project, and `Columbus` carries logprob **-0.59** (below the -0.35 doubt line), which invites a blind fix. **It is correct.** Both models independently read `Columbus Circle`, and the full phrase — *"the weekend markets closer to the 59th, Columbus Circle"* — is a real NYC location (59th St–Columbus Circle, Manhattan), exactly where weekend/holiday markets run. Changing it to "Columbia" would corrupt the transcript with a false fact. Read the surrounding sentence before touching a proper noun. *(Minor: experimental renders the number as `Fifty-Nine`; v1's `59th` is kept as the better orthography — not a correction.)* |
| **[00:30]** | `I don't think there's a lot in New York which are fairly...` | `...in New York, which I rarely see.` | UNCERTAIN | Genuine cross-model disagreement (`are fairly...` vs `I rarely see.`, same 30.26–30.92s span; v1 `fairly...` logprob -0.33). Acoustically plausible either way ("are fairly" ≈ "I rarely"). No context decides it, and the trailing `...` in v1 suggests the speaker really did trail off. **Original kept.** |
| **[01:21]** | `I don't know what it is normally set up you go to farmer's market and all` | `I don't know. It is normally set — if you go to farmer's market and all...` | UNCERTAIN | Garbled region. Models disagree twice: `what it is` vs `It is` (v1 `what` logprob -0.33), and `set up you go` vs `set if you go` (v1 `you` logprob -0.36). Both decodes are ungrammatical; neither is clearly the repair. **Original kept** — the meaning ("farmer's markets are normally not cheap because it's organic") survives intact either way. |
| **[01:52]** | `I was thinking to stop by the store by **Rideau**` | unresolved proper noun | UNCERTAIN | v1 `Rideau,` (logprob -0.34) vs experimental `Rido,` — both models produce an unidentifiable proper noun on the same span, which marks it as a real error site, **but neither offers a usable fix.** "Rideau" is an Ottawa/Canadian name and is unlikely in this NYC context; it is probably a store, street, or brand name near the respondent's route. **Original kept and flagged** — inventing a plausible NYC store name here would launder a guess into an apparent fact. *Worth a 10-second listen if anyone has the audio.* |
| **[00:51]** | `**Oh,** like, how the experience was.` | `or, like, how the experience was.` | UNCERTAIN | Filler-word disagreement (v1 `Oh,` vs experimental `or,`). No logprob flag, no semantic impact. **Original kept.** |
| **[02:36]** | `then obviously it would be a **super**.` | (truncated utterance) | UNCERTAIN | Reads as an incomplete sentence, but **both models agree** on `a super.` — so this is the speaker trailing off mid-phrase (probably "a super \[bummer/letdown]"), not a mishear. **Original kept.** Not counted as a transcription error. |
| **[02:43]–[02:47]** | RESPONDENT: `...the quality is nice, the longevity-` / INTERVIEWER_1: `It's just-` / RESPONDENT: `... it's just gonna be the same.` | experimental: RESPONDENT `...the-` / INTERVIEWER_1 `Longevity` / RESPONDENT `it, it's just gonna be the same.` | UNCERTAIN | Crosstalk region. The models disagree on **who says "longevity"** and on the placement of "it's just". v1's version duplicates "it's just" across both speakers, which hints at a diarization split — but the experimental alternative is not provably right either. **v1 segmentation kept unchanged and the disagreement logged**, per the "say so rather than silently rewrite" rule. |

---

## 3. Notes on things that are *not* errors

- **Fillers, stutters, false starts, hedges — all preserved.** `um`, `uh`, `like`, `You- you`,
  `r- run`, `My ma- like, my major`, `there was a, there was a`, `They, they didn't` are all
  verbatim and intentional. Do not clean these.
- **`distrusted` [02:11]** — non-standard usage by INTERVIEWER_1, but both models agree. Kept verbatim.
- **`competitively it was quite cheaper` [01:18]** — both models agree. Kept verbatim.
- **`super proportional` [02:49]** — both models agree; consistent with this speaker's heavy use of
  "super" (`super old couple`, `super organic`, `super cheap`). Not "directly proportional". Kept.
- **Orthographic-only divergences ignored** (not corrections): `farmer's`/`farmers`,
  `mom and pop`/`mom-and-pop`, `59th`/`Fifty-Nine`, `(laughs)`/`[laughs]`, and sentence-boundary
  punctuation. `scribe_v1` conventions retained throughout.
