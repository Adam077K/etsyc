# Corrections — Interview 02 (Columbia University 2)

**Baseline:** `raw/2-columbia-university-2.json` (scribe_v1)
**Cross-check:** `raw2/2-columbia-university-2.json` (scribe_v1_experimental)
**Audio:** 1:17 · eng · 3 diarized speakers · 8 words below the `logprob < -0.35` doubt line

Every change made to `transcript-raw.md` to produce `transcript-corrected.md` is listed
below. Nothing was changed silently. Filler, stutters and false starts were never touched.

---

## 1. Changes applied

| timestamp | raw (scribe_v1) | corrected | confidence | evidence |
|---|---|---|---|---|
| **[00:01]** | let me get the **questions.** | let me get the **question.** | PROBABLE | v1 logprob **-0.386** (below the -0.35 doubt line; the preceding spacing is -0.429). Experimental reads **"question."** at **-0.00044** — near-certain. Cross-model disagreement plus v1's own self-doubt at exactly that token. Meaning is unaffected (he is fumbling for his question list either way), so the risk of the fix is low. |
| **[00:37]** | That's the sort of **thing.** | That's the sort **of-** | CONFIRMED | Three independent signals: (a) v1 logprob on `thing.` is **-0.430**, below the doubt line, with the preceding spacing at -0.516; (b) its timestamps are **37.880 → 37.899 = 19 ms** — physically impossible for a spoken word, the signature of a hallucinated completion; (c) experimental ends the turn at **`of-`** with logprob **-4.0e-8** (maximum confidence) and emits *no* following token before the interviewer starts at 38.059. The respondent trailed off; v1 finished his sentence for him. |
| **[00:45]** | *(nothing — interviewer's turn runs unbroken: "...doesn't exist in, like, Amazon, it'd be more convincing to buy?", and the respondent then opens with a doubled* "Yeah. Yeah, it would be...") | RESPONDENT backchannel **"Yeah"** restored at 00:45, overlapping the interviewer mid-sentence; the interviewer's turn is split around it; the respondent's following turn now reads **"Yeah, it would be more convincing for me to purchase."** (single "Yeah") | PROBABLE | Experimental places a `speaker_1` **"Yeah"** at **45.739 s** (logprob -5.5e-6) between "Amazon-" and "it'd be". v1 missed it — and paid for it: v1's **`more`** at 46.079 carries logprob **-1.805, the worst in the entire file**, while experimental reads the same word at -7e-7. A confidence collapse of that size on a common word is the classic fingerprint of a second voice on top of the signal at that exact moment. v1's alignment then degenerates: `buy?` (46.779→46.779), `Yeah.` (46.779→46.799), `Yeah,` (46.819→46.819) — three tokens crammed into 40 ms. **Both models see two "Yeah"s; they disagree only on where the first one lands.** No words were added or deleted — one backchannel was relocated to where the acoustic evidence puts it, and marked as overlap. |

**Totals: CONFIRMED 1 · PROBABLE 2 · UNCERTAIN 0.**
(No UNCERTAIN item was applied — by policy, uncertain items are logged, not written.)

---

## 2. Flagged as suspicious — deliberately NOT changed

Per the confidence discipline: where the fix is a guess, the original stands and the
alternative is recorded here. Seven items.

| timestamp | raw (kept) | suggested alternative | confidence | evidence / why it was left alone |
|---|---|---|---|---|
| **[00:16]** | You **can't** remember? | You **don't** remember? | UNCERTAIN | Direct cross-model conflict with *both* models near-certain: v1 `can't` at -0.00045, experimental `don't` at -0.00038. Two confident models cannot both be right, so one is wrong — but nothing adjudicates it. `/kænt/` and `/doʊnt/` are not close phonetically, which suggests a genuinely muddy intercept-recording moment. Meaning is identical; the interviewer is echoing the respondent's own "I can't really remember", which mildly favours the v1 reading. Left as-is. |
| **[00:32–00:33]** | "...good quality, **um-**" → Mm-hmm → "**...** maybe something unique" | "...good quality." → Mm-hmm → "**Um,** maybe something unique" | UNCERTAIN | Both models hear exactly one filler in this window but place it on opposite sides of the interviewer's "Mm-hmm". v1: `um-` at 32.88–33.04 (-6.4e-5) and a pause token `...` at 33.86. Experimental: nothing at 32.9, and `Um,` at 33.86 (-3.3e-6). v1's filler has a plausible 160 ms duration; experimental's is 20 ms. Kept v1's placement and preserved its pause marker. Either way the respondent hesitated — the research signal survives both readings. |
| **[00:53]** | **AI-made** | *(none — explicitly reviewed and KEPT)* | CONFIRMED CORRECT | **This is the trap in this file.** v1's logprob is **-0.432**, below the doubt line, so it presents as an error site. But experimental independently reads **`AI-made`** at **-6.9e-6** (near-certain), and "AI-made" is core project vocabulary appearing across the interview set. Per the brief: where the two models agree, the word is very likely correct even when logprob is low. **No change. Do not "fix" this in a later pass.** |
| **[01:10]** | you wouldn't trust **their-** | you wouldn't trust **or** | UNCERTAIN | Cross-model conflict on a phonetically adjacent pair: v1 `their-` (-0.089) vs experimental `or` (-8.3e-5). `/ðɛr/` vs `/ɔr/` is a plausible confusion. The respondent's answer — "Yeah, I wouldn't trust." with no object — mildly favours experimental's `or`; but the interviewer is visibly mid-restart ("trust their- you, pro- most likely...") and "trust their [shop/product]" is equally natural. Not resolvable. Original stands. |
| **[01:10]** | **pro-** | **p-** | UNCERTAIN | Both models are unsure (v1 **-0.662**, below the doubt line; experimental -0.361, also below it) and the preceding spacing is -0.883 / -0.723 respectively. Both agree it is a cut-off stutter of "probably" — v1's fragment is simply a superset of experimental's. Not a mishear of a *different* word, so there is nothing to correct; kept the fuller v1 rendering. |
| **[01:16]** | **Good.** *(attributed to speaker_0 / INTERVIEWER)* | **All right.** *(attributed to speaker_2)* | UNCERTAIN | Whole closing disagrees. v1 `Good.` logprob **-0.606** (below the doubt line) with a **20 ms** duration; experimental's `All` is **-0.534** — both models are guessing. Timing mildly favours experimental: v1 compresses "Good. Thank you." into **0.36 s** (76.639→76.999), experimental spreads "All right. Thanks." over **0.64 s** (76.36→76.999). The models also disagree on attribution (v1: interviewer; experimental: the third voice says all of it). Not confident enough to overwrite. Original stands, with the conflict flagged in the transcript. |
| **[01:16]** | **Thank you.** *(speaker_2)* | **Thanks.** *(speaker_2)* | UNCERTAIN | Same disputed closing span as above. v1 `Thank you.` (-0.012 / -0.022) vs experimental `Thanks.` (-0.041) — both are confident, and they conflict. Both models do agree that a **third, distinct speaker** delivers the closing, which is why `speaker_2` is mapped to BYSTANDER rather than merged into the interviewer. Original stands. |

---

## 3. Cross-model differences reviewed and dismissed (not errors)

Recorded for audit completeness — these are orthographic or formatting variants, not
mishears, and correcting them would violate verbatim fidelity for zero gain.

| timestamp | v1 (kept) | experimental | verdict |
|---|---|---|---|
| [00:02] | `sooo,` (-0.294) | `So,` | Elongation, not a mishear. The drawl is data; v1's rendering preserves it. Kept. |
| [00:11] / [00:21] | `mom and pop shop` | `mom-and-pop shop` | Hyphenation only. Identical words. |
| [00:12] | `farmer's market` (-0.012) | `farmers market` (-0.182) | Homophone/orthography. v1 is the more confident reading and matches project vocabulary. |
| [00:14] | `I can't r- really remember` | `I can't r-really remember` | Same stutter, different hyphen rendering. |
| [00:17] | `N- No- Nothing` | `N-no-nothing` | Same stutter, different rendering. |
| [00:35] | `I` — logprob **-0.474** (below doubt line) | `I` at 0.0 | Models agree → correct despite low v1 confidence. No change. |
| [00:38] | `you` — logprob **-0.360** (below doubt line) | `You` at -3.6e-7 | Models agree → correct. No change. |
| [00:46] | `more` — logprob **-1.805** (worst in file) | `more` at -7e-7 | Models agree the **word** is right. The confidence collapse is not a mishear — it is the acoustic footprint of the overlapping "Yeah", and it is what corroborated correction #3 above. No change to the word. |
| [00:55] | `drop-shipped` (-0.016) | `dropshipped` (-0.182) | Orthographic variant of the same term; v1 more confident. Kept. |

---

## 4. Diarization notes

- The `speaker_0` / `speaker_1` split is clean and consistent across both models for the
  whole body of the interview. No evidence of one person being split across two IDs.
- `speaker_2` appears **only** in the final 0.4 s. Both models independently assign the
  closing to a third speaker, so it is real — but they disagree on how much of the closing
  belongs to it (v1: only "Thank you."; experimental: "All right. Thanks." entirely).
  Mapped to **BYSTANDER**, most plausibly a second member of the interviewing team.
- No ambient/background audio events in this file.
