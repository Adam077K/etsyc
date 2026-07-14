# Corrections Log — 01 Columbia University

Source models: scribe_v1 (`raw/1-columbia-university.json`) vs scribe_v1_experimental (`raw2/1-columbia-university.json`)

---

## Changes Applied

| timestamp | raw (scribe_v1) | corrected | confidence | evidence |
|-----------|-----------------|-----------|------------|----------|
| [00:40] | `Anthropology` | `Anthropologie` | CONFIRMED | scribe_v1 logprob -0.243; experimental reads "Anthropologie" (logprob -0.303); cross-model disagreement. Context decisive: speaker is giving a boutique selling cups as an example — Anthropologie is the well-known lifestyle/home goods retailer; "Anthropology" is an academic discipline and makes no sense in context. |
| [01:23–01:28] | `"To lobby floor. Going up."` attributed to speaker_3, inside INTERVIEWER's spoken turn | Entire block re-labelled AMBIENT/BACKGROUND; removed from interview speech stream | CONFIRMED (reclassification); UNCERTAIN (exact wording) | Known elevator-announcement artifact per project brief. scribe_v1 "To" logprob -1.23, "lobby" logprob -2.23 — among the lowest confidence words in the entire file. Experimental also shows this region as non-interview audio. Exact content of the ambient block is UNCERTAIN — see flagged section below. |

---

## Flagged — Suspicious but Not Changed

Words and passages flagged as suspicious that were deliberately left in their scribe_v1 form. Each entry includes the suggested alternative and why correction was withheld.

### 1. [00:13] `cool-looking` — hyphenation vs two words

| field | value |
|-------|-------|
| raw | `cool-looking.` |
| suggested | `cool looking.` (two words, no hyphen) |
| scribe_v1 logprob | -0.293 (near threshold) |
| experimental | renders as two separate words `"cool"` (-8e-06) + `"looking."` (-0.0006) |
| decision | No change. Both "cool-looking" and "cool looking" are valid English. The difference is stylistic punctuation only; meaning is identical. Experimental's higher confidence on the two-word form is noted but does not constitute a meaning-changing error. |

---

### 2. [01:04] `"Bye."` — possible mishear as `"Bro, like-"`

| field | value |
|-------|-------|
| raw | `"Bye."` (speaker_2/INTERVIEWER, logprob -0.130) |
| suggested | `"Bro, like-"` |
| scribe_v1 logprob | -0.130 |
| experimental logprob | "Bro," -0.009, "like-" -0.054 — substantially more confident |
| context | INTERVIEWER is listing escalating emotional reactions: "indifferent" → "Oh, that sucks" → "Whatever" → [this word] → respondent's own view. "Bye." fits the escalation sequence as a dismissive exit. "Bro, like-" would be a hedging emphasis filler, breaking the escalation pattern. |
| decision | Not changed. Context argument favours scribe_v1's "Bye." despite experimental's higher confidence. Cannot resolve without audio. **HUMAN SPOT-CHECK RECOMMENDED at [01:04].** |

---

### 3. [01:06] `I feel like, I think that sucks` — possible mishear of `I'd be like, "I think that sucks"`

| field | value |
|-------|-------|
| raw | `I feel like, I think that sucks` (speaker_1/RESPONDENT) |
| suggested | `I'd be like, "I think that sucks"` |
| scribe_v1 logprob on "feel" | -0.334 (just under the -0.35 threshold; flagged) |
| experimental | "I'd" (-1.8e-05) + "be" (-4.8e-07) + "like," (-2.3e-06) + `"I` (-0.174) + `think` (-0.474) |
| analysis | The experimental model's "think" has logprob -0.474, indicating it too was uncertain. "feel like, I think" and "be like, 'I think'" are both natural spoken constructions. The experimental reading places this as reported speech ("I'd be like, 'I think that sucks'"), which is a common speech pattern. Scribe_v1's "feel" is near the suspicion threshold. No definitive resolution possible from text alone. |
| decision | Not changed. The respondent's sentiment and meaning are identical either way. **HUMAN SPOT-CHECK RECOMMENDED at [01:06].** |

---

### 4. [01:10] `wouldn't,` (first instance) — possible self-correction start `would,`

| field | value |
|-------|-------|
| raw | `"Oh, so you wouldn't, you wouldn't trust the f-"` |
| suggested | `"Oh, so you would, you wouldn't trust the f-"` |
| scribe_v1 logprob on first "wouldn't," | -0.159 |
| experimental logprob on equivalent | "would," -0.046 |
| analysis | Experimental reads the first word as "would," (positive), followed by the self-corrected "wouldn't" — this would mean the INTERVIEWER started to say the wrong thing and corrected themselves. Scribe_v1 reads both as "wouldn't" — the INTERVIEWER repeating the correct word for emphasis. Both are plausible self-correction patterns. Experimental is more confident on its reading. |
| decision | Not changed. Both renderings reflect a speaker self-correction; neither meaningfully alters the record. |

---

### 5. [01:16] Missing `Wait,` before `What's another question?`

| field | value |
|-------|-------|
| raw | `"Okay. What's another question? What's another question?"` |
| suggested | `"Okay. Wait, what's another question? What's another question?"` |
| scribe_v1 | No "Wait" present; "What's" at 76.839 (logprob -0.058) |
| experimental | "Wait," at 76.639 (logprob -0.002) + "what's" at 76.819 (-1.3e-05) |
| analysis | Experimental confidently inserts "Wait," before "what's another question?" — this is a brief moment where the INTERVIEWER appears to pause and think aloud before asking the next question. Scribe_v1's logprob on "What's" (-0.058) is not alarming, but the experimental reading with "Wait" is more fluent as speech. |
| decision | Not changed. Minor omission if true; does not affect research content. |

---

### 6. [01:23–01:28] Exact wording of the ambient block (full detail)

This item is partially CONFIRMED (reclassification as ambient) but UNCERTAIN on content, so the content-level candidates are logged here.

**What the models heard:**

| timestamp | scribe_v1 | logprob | experimental | logprob |
|-----------|-----------|---------|--------------|---------|
| 83.36 | "To" | -1.233 | (no "To") | — |
| 83.619 | "lobby" | -2.230 | (no "lobby") | — |
| 83.639 | (no "Ground") | — | "Ground" | -0.140 |
| 84.459 | "floor." | -0.013 | "floor." | -0.014 |
| 84.699 | (absent) | — | "How" | -0.004 |
| 84.779 | (absent) | — | "many" | -4.2e-05 |
| 84.879 | (absent) | — | "questions" | -5.9e-05 |
| 85.319 | (absent) | — | "have" | -5.0e-05 |
| 85.419 | (absent) | — | "you" | -0.002 |
| 85.500 | (absent) | — | "got?" | -0.037 |
| 86.379 | "Going" | -0.005 | "Going" | -0.002 |
| 87.939 | "up." | -0.006 | "up." | -1.2e-07 |
| 87.259 | (absent) | — | "Wait," | -0.021 |
| 87.379 | (absent) | — | "what'd" | -0.001 |
| 87.720 | (absent) | — | "you" | 0.000 |
| 87.799 | (absent) | — | "say?" | -0.001 |

**Analysis:**
- "To lobby floor." (scribe_v1) is almost certainly wrong. "lobby" at -2.230 is the single most uncertain word in this entire recording. "To" at -1.233 is the third most uncertain. These two words should be treated as garbage output.
- "Ground floor." (experimental, -0.140) is plausible and standard elevator vocabulary.
- "How many questions have you got?" (experimental, speaker_3, confident ~-0.004 range) — if real, this is a bystander (not the respondent Julia and not the interviewer) commenting on the interview — possibly a companion or passerby. Both models assign different speaker IDs here (scribe_v1 doesn't detect this at all).
- "Going up." — both models agree (ambient elevator).
- "Wait, what'd you say?" (experimental, speaker_1 = RESPONDENT, high confidence) — if real, Julia is reacting to something she heard (possibly the bystander question). This is the respondent's words but directed at ambient noise, not at the interview question.

**Candidates for the ambient block:**
- Candidate A (scribe_v1 corrected): "To lobby floor. Going up." → [GARBAGE — reject "To lobby" as machine noise]
- Candidate B (experimental): "Ground floor. [bystander: How many questions have you got?] Going up. [RESPONDENT: Wait, what'd you say?]"

**Recommendation:** Candidate B is substantially better supported by the evidence. However confirming the bystander comment and the respondent's reaction requires a human to listen to 83–88s of the audio. Do not treat either candidate as authoritative without that check.

---

## Scribe_v1 Low-Logprob Words (< -0.35) — Full Accounting

The brief states 11 words with logprob < -0.35 in scribe_v1. All 11 are listed here with disposition.

| # | word | timestamp | logprob | cross-model | disposition |
|---|------|-----------|---------|-------------|-------------|
| 1 | "why," | 00:04 | -1.159 | experimental agrees (-0.001) | Both models agree. Prosodic emphasis caused scribe_v1 uncertainty. Correct as-is. |
| 2 | "made" | 00:19 | -0.523 | experimental agrees (−4e-07) | Both agree. Correct as-is. |
| 3 | "or" | 00:30 | -0.523 | experimental agrees (-0.001) | Both agree. Correct as-is. |
| 4 | "Let" | 00:34 | -1.444 | experimental has "let" (0.0) | Both agree on the word. Scribe_v1 uncertain due to prosodic re-start ("Okay, let's... Let me..."). Correct as-is. |
| 5 | "it" | 00:34 | -0.550 | experimental agrees (contextually) | Both agree. Correct as-is. |
| 6 | "selling," | 00:40 | -1.561 | experimental agrees (-0.001) | Both agree on "selling,". Very low scribe_v1 confidence unexplained but experimental confirms. Correct as-is. |
| 7 | "f-" | 01:11 | -0.789 | experimental: "the..." trailing off | Partial word / intentional self-censorship. Not a mishear. Correct as-is. |
| 8 | "Right?" | 01:14 | -0.761 | experimental agrees (-8e-06) | Both agree. Low confidence likely due to laughter overlap. Correct as-is. |
| 9 | "To" | 01:23 | -1.233 | experimental: no "To"; reads "Ground" | ARTIFACT — part of ambient elevator announcement. Removed from interview speech stream. |
| 10 | "lobby" | 01:23 | -2.230 | experimental: no "lobby"; completely different reading | ARTIFACT — worst logprob in file. Removed from interview speech stream. |
| 11 | "Thanks," | 01:37 | -0.423 | experimental agrees (-9e-05) | Both agree. Low scribe_v1 confidence unexplained; experimental confirms. Correct as-is. |

---

## Diarization Issues Noted

These are not word-level corrections but attribution problems worth flagging for any analyst using speaker turns for analysis.

| timestamp | scribe_v1 attribution | issue | experimental attribution |
|-----------|-----------------------|-------|--------------------------|
| [00:00] | speaker_0 says "Okay, sorry." | speaker_0 appears only here; same voice as speaker_2 (INTERVIEWER) — diarization split at recording start | experimental assigns to speaker_0, same as rest of INTERVIEWER |
| [01:11] | speaker_3 says "Oh." | speaker_3 is otherwise the ambient/elevator channel; "Oh." here is almost certainly INTERVIEWER or RESPONDENT reacting to near-slip | experimental has no separate "Oh." from speaker_3 at this timestamp |
| [01:12] | (laughs) attributed to speaker_3 | Same as above — speaker_3 is ambient channel; the laugh is contextually the INTERVIEWER's | experimental attributes laugh to speaker_0 (INTERVIEWER) at ~74.5s |
