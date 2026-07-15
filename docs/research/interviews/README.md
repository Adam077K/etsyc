# Customer & Seller Discovery Interviews — 2026-07-14 (files 01–05) · 2026-07-15 (files 06–07)

Transcripts of seven discovery recordings for the **Etsy × Columbia challenge**.
Files 01–04 are English street interviews (buyers, around Columbia / NYC); file 05 is a
Hebrew phone call (an expert seller, consulted as a domain expert before the seller
interviews began). **Files 06–07 are not buyer interviews** — 06 is a single-speaker
product-thesis monologue, 07 is pitch-coaching plus an off-mic logistics exchange. They
are kept in this folder for provenance but should be read as founder/positioning artifacts,
not demand evidence (flagged in the corpus table below).

Produced by ElevenLabs Scribe, then corrected against a second independent model pass.

---

## ⚠️ READ THIS BEFORE TRUSTING ANY TRANSCRIPT

**ElevenLabs `scribe_v1` silently truncated recording 05.**

It stopped transcribing at **177s of a 231s recording** — dropping **54 seconds (23%)** of the
call, cutting off **mid-word** (`באמזו…` / "on Amazo[n]"). The API returned **HTTP 200 with no
error, no warning, and no flag.** Nothing in the response indicated data was missing.

The lost tail contained the single most valuable exchange in the entire corpus (the
small-business-vs-price answer, below). It was recovered **only** because a second model
(`scribe_v1_experimental`) was run over the same audio and transcribed the full 231s.

**Consequences for anyone doing this again:**

1. **Always verify the last transcribed word reaches the end of the audio.**
   `ffprobe` the duration, compare against `max(.words[].end)`. Do not assume HTTP 200 means complete.
2. **Never trust a single STT pass on material that matters.** A second model is not just an
   accuracy check — here it was *data recovery*.
3. Recording 05 was the only `.mp4` (WhatsApp container); the four clean files were `.m4a`.
   A container-handling bug is the leading hypothesis — **untested**. If you re-run this,
   transcode to `.mp3`/`.wav` first and see whether `scribe_v1` then reaches 231s.

**Truncation audit (all five files):**

| # | Recording | Audio | scribe_v1 reached | Lost | Status |
|---|-----------|-------|-------------------|------|--------|
| 01 | Columbia University | 104s | 103s | 2s | ok |
| 02 | Columbia University 2 | 77s | 77s | 0s | ok |
| 03 | Columbia University 3 | 80s | 80s | 0s | ok |
| 04 | Columbia University 4 | 172s | 172s | 0s | ok |
| 05 | WhatsApp (Hebrew) | 231s | **177s** | **54s** | **TRUNCATED — recovered from 2nd model** |
| 06 | Columbia University 5 | 98.5s | 98.1s | ~0s (silence) | ok |
| 07 | Columbia University 6 | 42.6s | 42.6s | 0s | ok |

Files 06–07 (added 2026-07-15) were both verified clean against the truncation rule: `scribe_v1`'s
last word reaches the true audio duration on both, and `scribe_v1_experimental` agrees. Both are
`.m4a` — the same clean-container class as files 01–04.

Recording 05's final ~54s is therefore **single-sourced** (experimental model only, no
cross-model confirmation). It is fenced as such in its corrected transcript. **It is also the
most quotable material in the corpus** — so if any passage deserves a human ear against the
original audio, it is this one.

---

## The corpus

| # | Recording | Lang | Dur | Speakers | Who |
|---|-----------|------|-----|----------|-----|
| [01](01-columbia-university/) | Columbia University | eng | 1:44 | 4 | buyer (+ bystanders, ambient) |
| [02](02-columbia-university-2/) | Columbia University 2 | eng | 1:17 | 3 | buyer |
| [03](03-columbia-university-3/) | Columbia University 3 | eng | 1:20 | 2 | buyer |
| [04](04-columbia-university-4/) | Columbia University 4 | eng | 2:52 | 3 | buyer (richest English interview) |
| [05](05-whatsapp-hebrew-seller-call/) | WhatsApp seller call | heb | 3:50 | 2 | **expert seller** (+ English translation) |
| [06](06-columbia-university-5/) | Columbia University 5 | eng | 1:38 | 1 | ⚠️ **not a buyer interview** — product-thesis monologue |
| [07](07-columbia-university-6/) | Columbia University 6 | eng | 0:43 | 3 | ⚠️ **not a buyer interview** — pitch-coaching + off-mic logistics |

**Total:** 13 min 25 s · ~3,896 words · 7 recordings · transcription cost ≈ $0.20 (two model passes each).

> **Files 06–07 carry zero applied corrections.** Both transcribed cleanly with full cross-model
> agreement on content. 06 has no flagged spans at all; 07 has four `[uncertain]` spans, all in its
> off-mic logistics tail after 00:27 (the pitch-coaching body is clean). Details in each folder's
> `corrections.md`.

Each folder contains:

- `transcript-raw.md` — untouched `scribe_v1` output. **The audit baseline. Never edit this.**
- `transcript-corrected.md` — corrections applied, verbatim fidelity preserved.
- `corrections.md` — every change, with confidence + evidence; plus everything flagged and
  deliberately *not* changed.
- `transcript-english.md` — recording 05 only: English translation of the corrected Hebrew.

---

## How corrections were made (and their limits)

**Nobody listened to the audio.** Not the CEO, not the correction workers — no agent in this
pipeline can hear. Corrections were therefore made only where the *evidence* proved an error,
never by guessing at what "sounds right":

1. **Word-level confidence** (`logprob`) — where the model itself hesitated.
2. **Cross-model disagreement** — the same audio through `scribe_v1` and `scribe_v1_experimental`.
   Where two independent models disagree on a real word, something is genuinely wrong.
3. **Context and cross-file consistency** — project vocabulary; a term must render the same way
   in every recording.

Every correction is labelled **CONFIRMED** / **PROBABLE** / **UNCERTAIN**. The standing rule was
**never silently fix**: anything uncertain was left as-is and *logged*, with the alternative
reading recorded. In user research a laundered guess is worse than a known unknown — it turns
a guess into an apparent fact.

### Verbatim fidelity is the prime directive

Filler ("like", "um"), false starts, stutters, and hedges are **preserved**. In discovery
interviews the hesitation *is* the data. These transcripts are deliberately not "readable prose."

### False positives — do NOT "fix" these

Confident-looking errors that are actually correct. They are guarded here so nobody re-breaks them:

- **"Columbus" (04, ~65s) is CORRECT.** Reads like a mishear of "Columbia," but the line is
  *"the weekend markets closer to the 59th, Columbus Circle"* — a real NYC location.
- **"To lobby floor. Going up." (01, ~83s) is NOT a mishear.** It is an **elevator announcement**
  bleeding into the recording, spliced mid-sentence into a speaker's turn. Real audio, wrongly
  *attributed*. (The two models disagree on this whole block — flagged UNCERTAIN, needs a human ear.)

### Notable confirmed corrections

| # | Raw | Corrected | Why it mattered |
|---|-----|-----------|-----------------|
| 04 | `as` | **`yes`** | The respondent's **answer to a yes/no question** (logprob −2.13, worst in file). As "as," the answer is noise; corrected, it is a *yes*. |
| 04 | `fee-` | **`flea-`** | "flea market" — core project vocabulary. |
| 01 | `Anthropology` | **`Anthropologie`** | The retail chain, not the academic discipline. |
| 05 | `קינה` ("Kina", a name) | **`קנאה`** (jealous) | Idiom: *"how great for you — I'm jealous."* Meaning-changing. |

---

## Open items for a human

1. **Spot-check recording 05's final 54s against the audio** — single-sourced, and the most
   quotable material in the corpus.
2. **Spot-check recording 01 at 01:23–01:28** — the two models disagree substantially on the
   ambient/elevator block, including whether a bystander speaks. Left UNCERTAIN.
3. **Test the truncation root cause** — re-run recording 05 transcoded to `.mp3` and check
   whether `scribe_v1` reaches 231s. Confirms or kills the container hypothesis.

---

*Generated 2026-07-14 · session `ceo-elevenlabs-transcripts` · see
`docs/08-agents_work/sessions/2026-07-14-ceo-elevenlabs-transcripts.md`*
