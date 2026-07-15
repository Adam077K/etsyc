---
date: 2026-07-14
agent: ceo
session: ceo-elevenlabs-transcripts
color: gold
task: Transcribe 5 discovery recordings via ElevenLabs and correct transcription errors
tier: lite
qa_verdict: PASS
branch: ceo-4-1784037417
---

# CEO Session — ElevenLabs transcription + correction

## Outcome

Five recordings (11m04s) transcribed and corrected. 16 deliverable files under
`docs/research/interviews/`. Cost ≈ $0.15.

**Established from the audio: this is the Etsy × Columbia challenge.** Files 1–4 are English
buyer interviews around Columbia/NYC; file 5 is a Hebrew call to an expert seller (a family
contact) consulted before the seller interviews. Decodes the "Etsyc" codename.

## The finding that matters

**`scribe_v1` silently truncated recording 05 at 177s of 231s — dropping 54s (23%), mid-word,
returning HTTP 200 with no error.** The lost tail held the most valuable exchange in the corpus
(small-business preference collapsing under price). Recovered only because a second model pass
(`scribe_v1_experimental`) had been run over the same audio.

The second pass was originally run as an *error-detection* device (cross-model disagreement =
likely error). It turned out to be *data recovery*. Audit confirmed the other four files are clean.

**Durable lesson → `docs/research/interviews/README.md`:** never trust a single STT pass on
material that matters; always verify `max(.words[].end)` against the true audio duration, because
HTTP 200 does not mean complete.

## Method

No agent in this pipeline can hear audio. Corrections were therefore evidence-driven, never
guessed: (1) word-level `logprob`, (2) cross-model disagreement between two independent Scribe
models, (3) context + cross-file consistency. Every change labelled CONFIRMED/PROBABLE/UNCERTAIN.

Standing rule: **never silently fix.** Anything uncertain stayed as-is and was logged with its
alternative reading. Verbatim fidelity (filler, stutters, hedges preserved) was the prime
directive — these are research interviews, and the hesitation is the data.

Two false positives were caught and are now guarded in the README so nobody re-breaks them:
"Columbus" (04) is Columbus Circle, a real NYC location, not a mishear of "Columbia"; the "lobby
floor / going up" line (01) is an elevator announcement bleeding into the recording, not a mishear.

## Orchestration

- T2. 1 Explore (repo orientation) + 5 parallel technical-writer workers (one per recording,
  Opus) + 1 adversary-engineer as the independent QA gate.
- Workers 1 and 4 stalled mid-task and were resumed via SendMessage rather than respawned.
- Workers wrote to their own isolated worktrees (shared-checkout writes were blocked); output
  was collected into the CEO worktree.

## Decisions

| Key | Value | Reason |
|-----|-------|--------|
| `stt_verification` | Always run a 2nd independent model pass on material that matters | It caught a meaning-changing error AND recovered 23% of a silently-truncated file |
| `transcript_fidelity` | Verbatim — no cleanup of filler/stutters/hedges | Discovery-interview hedges are the research signal |
| `correction_policy` | Never silently fix; log UNCERTAIN with alternatives | A laundered guess is worse than a known unknown in research data |
| `secret_handling` | `~/.etsyc/.env`, chmod 600, outside the repo | `~/.zshrc` is not sourced by non-interactive shells, so it never reached the tool shell |

## Open items for a human

1. Spot-check recording 05's final 54s against the audio — single-sourced, and the most quotable
   material in the corpus.
2. Spot-check recording 01 at 01:23–01:28 — models disagree on the ambient/elevator block.
3. Test the truncation root cause: re-run 05 transcoded to `.mp3` and see if `scribe_v1` reaches
   231s (05 was the only `.mp4`; container-handling bug is the leading, untested hypothesis).
4. **Rotate the ElevenLabs API key** — it was pasted in plaintext into the session and appended
   to `~/.zshrc`.

## Not done (deliberately, pending Founder direction)

- Nothing committed or pushed — awaiting confirmation on whether transcripts belong in this repo.
- No insights extracted into `USER-INSIGHTS.md`. Per CLAUDE.md only CMO/CPO may write it, and the
  brief was transcription + correction, not synthesis. The seller-call material is rich enough to
  justify a follow-up CPO/CMO pass if wanted.
