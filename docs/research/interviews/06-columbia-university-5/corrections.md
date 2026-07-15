# Corrections — Interview 06 (Columbia University 5)

**Baseline:** `Columbia University 5.m4a` → scribe_v1 (transcription_id `kTxBdFZvTP80kPWaNh5m`)
**Cross-check:** same audio → scribe_v1_experimental
**Audio:** 1:38 (98.539 s) · eng (p=0.966) · 1 diarized speaker · 5 words below the `logprob < -0.35` doubt line

**Truncation check (the README's prime rule):** scribe_v1's last word ends at **98.099 s** of a
**98.539 s** file; experimental agrees at 98.099 s. The ~0.44 s tail is trailing silence. **No
truncation.** Both passes cover the full recording.

Every candidate change was reviewed against `transcript-raw.md`. **Nothing was changed** — no
CONFIRMED or PROBABLE mishear exists in this file. Filler, stutters and false starts were preserved
per verbatim-fidelity policy.

---

## 1. Changes applied

**None.** CONFIRMED 0 · PROBABLE 0 · UNCERTAIN 0.

The two models agree on every content word. This is the only file in the corpus with zero applied
corrections and zero flagged-uncertain spans.

---

## 2. Flagged as suspicious — deliberately NOT changed

Every sub-`-0.35` word was reviewed and cleared. None is a mishear.

| timestamp | raw (kept) | why it is NOT an error |
|---|---|---|
| **[00:06]** | **finds** (-0.577) | Below the doubt line in v1, but experimental reads the identical **`finds`** at **-0.16**. Models agree → correct despite v1's low confidence (same principle that protected "AI-made" in file 02). No change. |
| **[00:10]** | **as-** (-0.388) | A cut-off stutter inside the abandoned false start "AI influence as- w- with- no, not... AI influence." Not a mishear of a different word — the speaker restarts the clause. Preserved verbatim. |
| **[00:11]** | **w-** (-0.434) | Same abandoned false start; a cut-off "with". Stutter, not mishear. Preserved. |
| **[00:46]** | **customer** (-0.440) | Below the doubt line, but experimental also reads **`customer`** (in "customer experience ... officer, CX"). Models agree → correct. The phrase is coherent ("customer experience officer, CX"). No change. |
| **[00:47]** | **CX.** (-0.422) | The speaker's own gloss of "customer experience" as the initialism **CX**. Experimental agrees. Coherent in context. No change. |

---

## 3. Cross-model differences reviewed and dismissed (not errors)

Recorded for audit completeness. These are orthographic / stutter-rendering variants, not mishears;
"correcting" them would violate verbatim fidelity for zero gain. **scribe_v1 (kept) is the more
granular renderer** — it preserves stutters that experimental smooths away, which is exactly what a
verbatim research transcript wants.

| timestamp | v1 (kept) | experimental | verdict |
|---|---|---|---|
| [00:05] | `high quality` | `high-quality` | Hyphenation only. Identical words. Kept. |
| [00:10] | `as- w- with- no, not A- A- AI influence` | `as-- with it... No, not AI influence` | Same abandoned false start. v1 preserves the "w- with-" and "A- A-" stutters; experimental smooths them. **In a discovery transcript the stutter is the data** — v1 kept. |
| [00:35] | `enough to s- sell it` | `enough to sell it` | v1 renders the "s-" stutter-start; experimental drops it. Verbatim fidelity → v1 kept. |
| [00:36] | `to be s- successful` | `to be successful` | Same — "s-" stutter preserved by v1. Kept. |
| [00:46] | `customer experience o- officer, CX` | `customer experience of-officer, CX` | Both agree on "officer, CX". v1's `o-` is a stutter-start of "officer"; experimental fuses it as "of-officer". v1's reading is the cleaner stutter transcription. Kept. |
| [01:00] | `but the- and because` | `But the-- And because` | Same content; punctuation/casing only. Kept. |
| [01:04] | `it's- it's- so people` | `it's, it's-- So people` | Same repeated false start; rendering only. Kept. |
| [01:09] | `an- and- and- and, uh` | `and, and, and, and, uh` | v1 renders the "an-" stutter-start of the stammered "and"; experimental normalises. Stutter is data → v1 kept. |

---

## 4. Diarization notes

- Single speaker (`speaker_0`) across the entire recording in **both** models. No evidence of a
  second voice, no speaker-split, no ambient bleed. The cleanest diarization in the corpus.
- Because there is only one voice and it delivers a prepared-sounding thesis, `speaker_0` is mapped
  to **NARRATOR (product thesis)** rather than a buyer/respondent role. See `transcript-corrected.md`.
