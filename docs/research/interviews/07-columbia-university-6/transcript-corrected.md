---
source_file: Columbia University 6.m4a
duration: "0:43"
language: eng
model: scribe_v1 (corrected against scribe_v1_experimental)
speakers: 3
date_recorded: 2026-07-15
---

# Interview 07 — Columbia University (6) — CORRECTED

**Speaker map**

| speaker_id | Role | Basis |
|---|---|---|
| `speaker_0` | **COACH** | Delivers the pitch-coaching monologue (00:00–00:27) and speaks again at the close. The dominant, clearly-miked voice. |
| `speaker_1` | **HOST / logistics** | The off-mic voice wrapping up the setting: "move the conversation ... , that'd be great ... I'll meet you out there." (In the second model this logistics turn is attributed to `speaker_2` instead — the models disagree on the tail; see `corrections.md`.) |
| `speaker_2` | **BYSTANDER** | A brief "Okay." backchannel. Diarization of the tail is unreliable — treat 1 vs 2 as approximate. |

**What this recording is.** Not a buyer interview. The body (00:00–00:27) is **coaching on how to
pitch**: frame the opportunity so the investor "sees it as if they're smarter than you," then leans
in. The tail (00:27–00:43) is **off-mic logistics** as the group physically moves — low audio
quality, overlapping voices, `(camera moving)` events.

**Ambient / background audio:** `(camera moving)` events tagged by the model at ~00:02 and ~00:14;
`(laughs)` at the close. Real events, not mishears.

**Correction policy applied:** verbatim fidelity. **Zero corrections were applied.** The coaching
body is clean and both models agree on it; the logistics tail is genuinely muddy and the two models
disagree without a tiebreaker, so — per policy — those spans are **left as scribe_v1 heard them and
flagged UNCERTAIN**, never guessed. This transcript is identical in wording to `transcript-raw.md`.

---

**[00:00] COACH:** ... so that then the other person (camera moving) is kind of getting a... You're, uh, you're letting them see the opportunity, as if, as if they're smarter than you. Because they... And that's what you kind of want. You want the, the investor or whoever on the other side to be like, "Oh, yes, I see this, I see this. (camera moving) But it could be like this. Oh, they don't seem to have seen that yet." So then they're first replying, they lean in, it's like, "Well, have you thought about that you could go to this opportunity?" Then you're like, "Yeah, yeah, yeah, exactly."

**[00:27] HOST:** Uh, so we just have to, like, sit outside, if you guys... **[uncertain]** If we can just move the conversation around, right, **[uncertain]** that'd be great. Thank you. I'm just gonna clean up around here a little bit and then I'll meet you out there.

**[00:35] BYSTANDER:** Okay.

**[00:35] COACH:** Are you... **[uncertain]**

**[00:36] HOST:** Yeah.

**[00:38] COACH:** Because of my, uh, checks as well. **[uncertain]** (laughs) (laughs)

---

**Corrected turn count:** 6 (unchanged from raw)

**Reader's caution — the entire tail after 00:27 is low-confidence.** Four spans are marked
**[uncertain]** and left as the machine heard them, because the two models conflict and nothing
adjudicates:

1. **"sit outside" (00:29)** — experimental hears **"set up five"**. Context ("move the
   conversation ... meet you out there") favours *outside*, but confidence is low both ways.
2. **"move the conversation around, right" (00:31)** — experimental hears **"move the conversation
   outside"** (no "right"). Both words are among the lowest-confidence in the file.
3. **"Are you..." (00:35)** — v1's `Are` is the single worst word in the file (logprob -1.966);
   experimental doesn't hear these as words at all (a backchannel overlaps here).
4. **"checks as well" (00:40)** — experimental hears **"text as well"**. Meaning-changing; unresolved.

Do not quote any [uncertain] span verbatim in a report without re-listening to the audio. The
coaching body (00:00–00:27) is safe to quote. Full detail in `corrections.md`.
