# Corrections — Interview 03 (Columbia University 3)

Baseline: `raw/3-columbia-university-3.json` (scribe_v1).
Cross-check: `raw2/3-columbia-university-3.json` (scribe_v1_experimental).
Audio not audible to the corrector — all judgments are from word-level logprob, cross-model
disagreement, token duration, and context.

scribe_v1 words with `logprob < -0.35` (6 total): `would` 47.28 (-0.699) · `dif-` 49.50 (-0.427) ·
`ad` 58.04 (-0.759) · `find` 71.46 (-0.633) · `them` 76.90 (-0.430) · `Bye.` 79.58 (-0.368).
Each is dispositioned below.

---

## 1. Corrections applied

| timestamp | raw (scribe_v1) | corrected | confidence | evidence |
|---|---|---|---|---|
| [00:58] (58.039–58.079) | `...to, like, what the **ad** really was trying to say to advertise.` | `...to, like, what the **adver-** really was trying to say to advertise.` | **PROBABLE** | (1) scribe_v1 logprob **-0.759** — the single least-confident word in the file. (2) Token duration is **40 ms** (58.039→58.079) — far too short for the noun "ad"; the 220 ms after it is left unassigned by v1, i.e. v1 dropped audio here. (3) **Cross-model disagreement:** experimental renders the same 57.979–58.479 span as **`aver-really`** — a truncated fragment plus "really". Experimental uses the exact `X-Y` convention for this speaker's other false starts in this file (`ad-advertising` @23.9, `dif-different` @49.5), so it is explicitly hearing a *cut-off word*, not the noun "ad". (4) Context/idiom: this respondent stutters constantly and the surrounding turn repeats "trying to advertise" twice — an aborted "adver[tise/tisement]" is the natural fragment. Rendered as `adver-` to match the file's existing fragment style (`a-`, `dif-`). **Not CONFIRMED:** "what the ad really was trying to say" is a grammatical reading, and the exact fragment spelling is inferred, not heard. |

**Nothing else was changed.** No filler, hedge, repetition or grammatical error was touched.

---

## 2. Flagged as suspicious — deliberately NOT changed

| timestamp | raw (kept) | suggested alternative | confidence in the alternative | evidence / why left alone |
|---|---|---|---|---|
| [00:47] (47.279) | `I **would** feel, like, pretty disappointed` | `I'd feel...` / `I'll feel...` | UNCERTAIN | v1 logprob **-0.699**; experimental hears **`I'll`** (-0.023) over the same span. Both readings are semantically identical answers to "how would you feel". The contraction "I'd" is likely what was uttered, but no source spells it. Changing a hedge/modal in user research buys nothing and risks laundering a guess. |
| [00:49] (49.5) | `it's, like, **dif- different** to what they...` | — | n/a (resolved, no change) | v1 logprob -0.427 **but** experimental independently renders `dif-different`. Two models agree on the stutter → the low logprob reflects the fragment, not an error. |
| [00:57] (57.84) | `to, like, what **the** adver- really...` | `they` | UNCERTAIN | Genuine cross-model split: v1 `the` (-0.314) vs experimental `they` (-0.348) — *both* models doubt it. `they` echoes the parallel clause 6 s earlier ("what they, they were, like, trying to say"), but `the` agrees with the singular verb "was" that follows. Left as v1. Flagging because this sits immediately before the one correction above. |
| [01:00] (60.759–60.819) | `...trying to say to **advertise.**` | `...to advertise **it**.` | UNCERTAIN | Experimental splits the same 60 ms span into `advertise` + `it.` — a possible dropped word in v1. Both tokens are implausibly short (20/40 ms) in experimental, so this may equally be an experimental hallucination. Adding a word on one model's say-so is not justified. |
| [01:11] (71.459) | `the quality of the food you **find** out weren't... wasn't good?` | — | n/a (resolved, no change) | v1 logprob **-0.633**, but experimental agrees on `find` with high confidence (-0.002). Per brief: model agreement outweighs a lowish logprob. Left untouched. |
| [01:16] (76.099–76.199) | `**... a-** after trying them...` | `Like after trying...` | UNCERTAIN | v1 emits a zero-length `...` token plus a 19 ms `a-` fragment; experimental hears `Like` over 76.0–76.099. Both are plausible renderings of the respondent resuming after being interrupted. The v1 fragment is consistent with this speaker's stutter pattern; kept. |
| [01:16] (76.9–76.999) | `after trying **them** the first time` | `after trying the first time` (drop "them") | UNCERTAIN | v1 logprob **-0.430**; experimental has **no** `them` — it assigns the whole 76.9–76.999 span to `the`. v1 then squeezes `the` into 20 ms, which is a classic squeeze artifact and suggests `them` may be an insertion. But deleting a word the respondent may have said (referring to the tacos) is a destructive edit on ambiguous evidence. Kept. |
| [01:19] (79.579) | `Okay. / Thank you. / Okay. / Thank you. Bye.` | insert a third voice: `Great. Thank you.` (BYSTANDER) | UNCERTAIN | Experimental introduces a **`speaker_2`** here saying `Great. Thank you.` (logprob -0.519 on "Great.") — v1 has no such words and only 2 speakers. All tokens in this cluster are **zero-duration** in both models, i.e. overlapping speech at the very end of the recording. Not inserted: a word attested by one model only, at -0.519, inside a zero-duration overlap, is below the bar for adding content. Noted so the possible third participant is not lost. |

---

## 3. Diarization notes

- **Mapping is clean for the body of the interview.** `speaker_0` asks every question and echoes the
  respondent ("You'd lose interest.") → INTERVIEWER. `speaker_1` gives every answer → RESPONDENT.
  No re-attribution was needed for turns 1–11.
- **Tail (79.579 s) is unreliable.** Both models emit zero-duration tokens for the closing
  "Okay / Thank you / Bye" exchange, and they disagree on who says "Bye." (v1: `speaker_1`;
  experimental: `speaker_0`) and on whether a third speaker exists at all. The corrected transcript
  keeps v1's attribution verbatim rather than guessing.
- **No ambient/background audio** (no PA announcements, no bystander interjections) was detected
  anywhere in this recording — unlike file 1.

---

## 4. Deliberate non-edits (verbatim fidelity)

Left exactly as spoken/transcribed, per the prime directive: `into it` (for "in it"),
`different to what` (for "different from"), `everybody's, like, a- advertising`,
`there's, there's`, `they, they were`, `weren't... wasn't`, all `like`/`um`/`uh` fillers,
and `farmer's market` (v1 spelling; experimental's `farmers market` is a punctuation variant only).
