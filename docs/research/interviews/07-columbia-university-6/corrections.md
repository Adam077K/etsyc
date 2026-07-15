# Corrections — Interview 07 (Columbia University 6)

**Baseline:** `Columbia University 6.m4a` → scribe_v1 (transcription_id `6H5FKcwnGMgkru0FJgbe`)
**Cross-check:** same audio → scribe_v1_experimental
**Audio:** 0:43 (42.645 s) · eng (p=0.980) · 3 diarized speakers · 7 words below the `logprob < -0.35` doubt line

**Truncation check (the README's prime rule):** scribe_v1's last word ends at **42.56 s** of a
**42.645 s** file; experimental ends at 42.479 s. The tail is trailing laughter/silence. **No
truncation.** Both passes cover the full recording.

**Where the doubt is concentrated:** every one of the 7 sub-`-0.35` words falls **after 00:27**, in
the off-mic logistics exchange as the group moves (the model tags `(camera moving)`). The
pitch-coaching body (00:00–00:27) is clean in both models. Nothing was changed; the muddy tail is
flagged, not guessed.

---

## 1. Changes applied

**None.** CONFIRMED 0 · PROBABLE 0 · UNCERTAIN 0 applied.

No disagreement in this file rises to CONFIRMED or PROBABLE. Where the models conflict, both are
low-confidence and the recording is physically muddy (voices off-mic, moving), so by policy the
original stands and the alternative is logged in §2.

---

## 2. Flagged as suspicious — deliberately NOT changed (4 unresolved spans)

| timestamp | raw (kept) | suggested alternative | confidence | evidence / why it was left alone |
|---|---|---|---|---|
| **[00:29]** | "...we just have to, like, **sit outside**, if you guys..." | "...we just have to like **set up five**. If you guys..." | UNCERTAIN | v1 `sit` logprob **-0.769** (below the doubt line). Experimental reads **"set up five"**. Context favours v1: the same speaker then says "move the conversation ... I'll meet you out there," which coheres with *sitting/going outside* and makes "set up five" semantically odd. But confidence is low both ways and the voice is off-mic. Not confident enough to overwrite; v1 kept, conflict flagged. |
| **[00:31]** | "If we can just move the conversation **around, right,** that'd be great." | "If we can just move the conversation **outside,** that'd be great." | UNCERTAIN | The two lowest-confidence content words in the file — v1 `around,` **-1.569** and `right,` **-1.028**. Experimental hears **"outside"** and no "right". "Outside" coheres with "meet you out there," which mildly favours experimental — but `/əˈraʊnd/` vs `/ˈaʊtˌsaɪd/` is not a close pair, the signal is muddy, and overwriting would be a guess. v1 kept, alternative recorded. |
| **[00:35]** | **Are you...** *(attributed to speaker_0)* | *(experimental hears no words here — a `speaker_1` "Okay." / backchannel overlaps instead)* | UNCERTAIN | v1's `Are` logprob **-1.966 — the worst word in the file.** Experimental doesn't render this as speech at all; it places backchannels ("Okay." / "Yeah.") across this window with different speaker IDs. Classic overlapping-speech smear. Kept v1's fragment but flagged; do not treat "Are you..." as a confirmed utterance. |
| **[00:40]** | "Because of my, uh, **checks** as well." | "Because of my, uh, **text** as well?" | UNCERTAIN | v1 `checks` logprob **-0.678** (below the doubt line). Experimental reads **"text"**. `/tʃɛks/` vs `/tɛkst/` is a plausible confusion and the two readings mean different things (checks vs text/message). Neither model is confident and there is no context to adjudicate. v1 kept, alternative recorded. Meaning-changing — flag before quoting. |

---

## 3. Cross-model differences reviewed and dismissed (not errors)

Orthographic / phrasing / audio-event-tagging variants, not mishears. Correcting them would violate
verbatim fidelity for zero gain.

| timestamp | v1 (kept) | experimental | verdict |
|---|---|---|---|
| [00:00] | `... so that then the other person` (leading ellipsis) | `So that then the other person` | The recording starts mid-sentence; v1's leading "..." marks that. Same words. Kept. |
| [00:02] / [00:14] | `(camera moving)` audio-event tags | *(not tagged)* | v1 was run with audio-event tagging and surfaced two `(camera moving)` events; experimental did not tag them. Real events, retained as context. |
| [00:09] | `And that's what you kind of want.` | `And that's what you kinda want.` | "kind of" vs "kinda" — orthography. Kept the fuller form. |
| [00:22] | `So then they're first replying, they lean in, it's like,` | `So then their first reply, and they'll lean in and say,` | Same meaning, different parse of a fast run of words. Neither is a clear mishear; both are plausible. v1 kept as baseline. |
| [00:33] | `clean up around here a little bit` (`clean` -0.706) | `clean up around a little bit` | v1 adds "here"; experimental drops it. Below-line confidence but not meaning-changing. Kept v1. |
| [00:38] | `Because of my, uh,` | `Because of my, uh,` | Both agree on the opening; only the object word (checks/text) is disputed — logged in §2. |
| close | `(laughs) (laughs)` | `[laughs]` | Same event, different tag rendering/count. Kept v1. |

---

## 4. Diarization notes

- The **body (00:00–00:27) is stable**: `speaker_0` (the coach) owns the pitch monologue in both
  models. This is the safe-to-quote portion.
- The **tail (00:27–00:43) diarization is unreliable.** The models disagree on who says the
  logistics turn — v1 assigns it to `speaker_1`, experimental to `speaker_2` — and they scatter the
  "Okay." / "Yeah." backchannels across different IDs. This is consistent with several people
  talking off-mic while moving (the `(camera moving)` tags). Speaker roles for the tail in
  `transcript-corrected.md` follow v1 but should be treated as approximate.
- No evidence the coach (`speaker_0`) is split across multiple IDs; that voice is consistent.
