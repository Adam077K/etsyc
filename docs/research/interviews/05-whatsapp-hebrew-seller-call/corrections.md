---
source_file: 5-whatsapp-audio-2026-07-14-at-12.05.26
language: heb
baseline: ./transcript-raw.md   # scribe_v1, untouched
result: ./transcript-corrected.md
evidence:
  - raw/5-...json    # scribe_v1 (word-level, logprob)
  - raw2/5-...json   # scribe_v1_experimental (word-level, logprob)
totals:
  confirmed: 5
  probable: 23
  uncertain_applied: 0
  flagged_not_changed: 10
---

# Corrections log

## Headline finding — scribe_v1 output is truncated

`scribe_v1` stops at **177.12s (02:57), mid-word** (`באמזו`, i.e. "on Amazo-"). The audio
runs to **230.95s (03:50)**. **Roughly 53 seconds and 13 speaker turns are missing from the
scribe_v1 transcript** — and that missing tail contains the seller's answers on (a) her own
online-buying behaviour and (b) small-business vs. big-company purchase preference, which
are the two most research-relevant answers in the call.

`scribe_v1_experimental` transcribes the full 03:50. The tail in `transcript-corrected.md`
is **single-source** (experimental only) and is fenced off there with an HTML comment. Treat
it as slightly lower-reliability than the double-sourced first 02:57 — but not optional: it
is the payload.

## Scope note on punctuation

Where both models produce the **same words** and differ only in comma/period placement, the
experimental model's segmentation is used and **not** listed row-by-row below (no lexical
content changes). Every **lexical, segmentation, speaker, content and audio-event** change
IS listed.

---

## Changes applied

| # | timestamp | raw (scribe_v1) | corrected | confidence | evidence |
|---|-----------|-----------------|-----------|------------|----------|
| 1 | 00:02 | `בסדר?` | `בסדר,` | PROBABLE | Experimental reads `בסדר,`. Turn parses as her *answering* "how's it going" then asking back ("Good — how's New York?"), not asking "OK?". |
| 2 | 00:09 | `קינה` | `קנאה` | **CONFIRMED** | Experimental reads `קנאה` (= envy). Line is the fixed idiom `איזה כיף לך, קנאה` = "how great for you — [I'm] jealous". v1 parsed it as the personal name "Kina", which is meaningless here. Flagged as CONFIRMED in the CEO context brief. |
| 3 | 00:11 | `(צחוק)` + a separate bare `.` word token | `[צחוק]` | **CONFIRMED** | v1 emits a spurious standalone `.` word (logprob −0.488) adjacent to the laughter event. Experimental emits `[צוחק]` and no `.`. Audio-event tag normalised to `[צחוק]`; the phantom `.` token dropped. |
| 4 | 00:12 | `אנחנו בדיוק היינו` | `אנחנו בדיוק אש-- אה, היינו` | PROBABLE | v1 has a 0.52s silent gap (12.38→12.90). Experimental fills it with an aborted word + filler (`אש--` 12.31–12.50, `אה` 12.94–13.04). Verbatim-fidelity: restore the false start. |
| 5 | 00:13 | `עם האלה מאטסי` | `עם ה-- אלה מאטסי` | PROBABLE | v1's `האלה` spans 13.80–14.70 = **0.90s**, implausibly long for one short word. Experimental splits it into a stretched article `ה--` (13.78–14.54) + `אלה` (14.55–14.70). Meaning unchanged ("with the… the Etsy people"). |
| 6 | 00:19 | `מתחילים לראיין` | `מתחילים, אה, לראיין` | PROBABLE | Experimental captures filler `אה` (19.40–19.46) in v1's gap. |
| 7 | 00:25 | `מאוד מאוד מאוד מבינה בדברים` | `מ-מאוד, מאוד, מאוד, אה, מבינה ב-בדברים` | PROBABLE | Experimental captures the stutter onsets (`מ-`, `ב-`) and a filler `אה` (26.25–26.27). Semantically identical; disfluency restored. |
| 8 | 00:28 | `חיה את העולם הזה` | `חיה את ה-, את העולם הזה` | PROBABLE | v1 gap 28.70→28.94. Experimental: `ה,` (28.78) + repeated `את` (28.95). Self-repetition restored. |
| 9 | 00:31 | `בקטנה זה לא, זה לא החלק` | `בקטנה. זה לא ה-- זה לא ה-החלק` | PROBABLE | Experimental captures two aborted definite articles (`ה--` 32.06, `ה-` on `החלק`). v1 compressed them. |
| 10 | 00:56 | `מ,דרך` | `מ- דרך` | PROBABLE | v1 encodes a false start as a comma *inside* a token (`מ,דרך`) — a v1 artifact, not orthography. Rendered as a normal aborted-word marker. Experimental merges it to `מדרך`; v1's segmentation retained as the more verbatim reading. |
| 11 | 01:01 | `ואז הם פשוט` | `ואז הם, אה, פשוט` | PROBABLE | Experimental captures filler `אה` (61.52) in v1's 61.28→61.54 gap. |
| 12 | 01:10 | `באטסי הרי זה פלטפורמה ענקית` | `באטסי הרי זו פלטפורמה ענקית` | PROBABLE | Experimental reads `זו`. `פלטפורמה` is feminine; `זו` is the grammatical form. Homophone-adjacent mishear in v1. |
| 13 | 01:16 | `ובמקרה ההוא מגיע אלי, אז הוא פונה אלי` | `ובמקרה הוא מגיע אליי, אז הוא פונה אליי` | PROBABLE | Experimental reads `הוא` (not `ההוא`). v1's version has no grammatical subject; experimental's parses cleanly ("and if by chance **he** lands on me"). `אלי`→`אליי` spelling normalised to match. |
| 14 | 01:27 | `אז כאילו אין לי ממש.` | `אז כאילו אין לי ממש--` | PROBABLE | Experimental marks it as an abandoned sentence (`ממש--`), which the following clause confirms — she restarts with `אני לא מושכת אליי לקוחות`. |
| 15 | 01:42 | `זה לא המיין ביזנס שלי` | `זה לא ה-main business שלי` | PROBABLE | Both models agree phonetically. Experimental identifies it as an **English code-switch** and writes it in Latin script. Retained that way because the code-switch itself is data (she reaches for English business vocabulary). |
| 16 | 01:43 | `...ביזנס שלי.` / CALLER `כן, כן.` / SELLER `אז אני כזה לא הכי משקיעה בזה.` | SELLER `...שלי, אז אני--` / CALLER `כן, כן.` / SELLER `כזה לא הכי משקיעה בזה.` | PROBABLE | Timing (exp: `אני-` 103.94–104.30; `כן, כן` 104.48–104.61; `כזה` 104.61) shows the caller's backchannel **interrupts mid-clause**. Turn boundary corrected; no words added or removed. |
| 17 | 01:46 | `ו-ביחד,` | `וביח--` | PROBABLE | `וביחד` ("and together") is incoherent before `נגיד ב-בצורה כללית`. Experimental marks it as an aborted word (0.82s, cut off). Reading it as a false start is the only coherent parse. |
| 18 | 02:02 | `את עושה גם חנות.` | `את עושה גם חנות?` | PROBABLE | Experimental punctuates as a question. It is the terminal clause of the caller's question ("…or is it more that on the side you also run a shop?"). |
| 19 | 02:08 | `חנות באתר שהיא גם המכירות אצלי זה לא הדבר העיקרי` | `חנות באתר, שגם המכירות אצלי זה לא הדבר העיקרי` | PROBABLE | v1's `שהיא גם` is ungrammatical. Experimental's single token `שגם` (128.44–128.93 covers both v1 tokens) parses correctly. |
| 20 | 02:30 | `ואת חושבת ככה מהפעם, זה מנקודה אישית יותר` | `ואת חושבת, ככה מה-- הפעם זה מנקודה אישית יותר` | PROBABLE | v1's `מהפעם` is ungrammatical here. Experimental splits into aborted `מה--` + `הפעם` ("this time"), which parses: "this time it's from a more personal angle". |
| 21 | 02:33 | `ופחות מהזה שאת מוכרת באטסי` | `ופחות מה, אה, זה שאת מוכרת באטסי` | PROBABLE | v1's `מהזה` spans 153.30–154.18 = **0.88s** — far too long for one word. Experimental resolves it into `מה` + filler `אה` + `זה`. |
| 22 | 02:35 | `שאת עושה קניות אונליין. את שמה לב ש--` | `כשאת עושה קניות אונליין, את שמה לב ש--` | PROBABLE | Experimental reads `כשאת` ("when you"). v1's `שאת` leaves the clause dangling; `כשאת` makes the whole question grammatical: "*When* you shop online, do you notice that—". |
| 23 | 02:39 | `ש--, ככה, את,` | `ש-- נו, ככה, את--` | PROBABLE | Experimental captures the filler `נו` (159.08–159.26) inside v1's 158.98→159.64 gap. |
| 24 | 02:45 | `איזה דופ ממסין` | `איזה דופ מ-מסין` | **CONFIRMED** | `ממסין` is **not a Hebrew word**. Experimental splits it into a stutter on the preposition: `מ-` + `מסין` = "**from China**". Context is decisive — the very next clause is `איזה שכפול של חברה אמיתית` ("some knockoff of a real company"). The line is "some dupe fro— from China". |
| 25 | 02:50 | `את עושה מחקר בכלל לפני שאת קונית משהו` | `א-את עושה מחקר בכלל ש-- לפני שאת קונה משהו` | PROBABLE | `קונית` is not a valid Hebrew verb form; both the correct form and the experimental model read `קונה`. Experimental also captures a stutter (`א-את`) and an aborted `ש--`. |
| 26 | 02:56 | `או שזה ממש אהה ככה את מחפשת באמזו` **[output ends mid-word]** | `או שזה ממש, אה, ככה את מחפשת באמזון או במשהו?` | **CONFIRMED** | v1 truncates mid-token. Experimental completes the word and the clause (`באמאזון או במשהו?`, 176.56–177.80). Spelling normalised to the standard `באמזון`. |
| 27 | 02:59–03:50 | **[absent from scribe_v1 entirely]** | 13 restored turns (SELLER's online-buying answer, small-business vs. big-company answer, sign-off, `[מקליד במקלדת]` audio event) | **CONFIRMED** | scribe_v1 produces zero tokens after 177.12s. scribe_v1_experimental produces 112 word tokens across 179.52–230.95s with normal logprobs and coherent two-speaker structure. The absence is a v1 failure, not silence. **Single-sourced — see caveat above.** |
| 28 | 03:32 | `זה היה בינתיים הככה החימום` | `זה היה בינתיים ה-ככה, החימום` | PROBABLE | `הככה` is not a word. Re-segmented as article + discourse marker + noun ("that was, for now, the — like — the warm-up"). Experimental-only span; segmentation is my reading, wording unchanged. |

---

## Flagged — reviewed, deliberately NOT changed

| # | timestamp | text as kept | why flagged | suggested alternative |
|---|-----------|--------------|-------------|----------------------|
| 1 | 00:03 | CALLER: `וואו, איזה כיף שם.` | Reads like the **SELLER's** reaction ("wow, what a blast over there") — a person *in* New York would say `פה` ("here"), not `שם` ("there"). Suspected diarization mis-attribution. | Reassign this sentence to SELLER. **Not done:** *both* models independently assign it to speaker_0, and I cannot hear the audio. Flagging rather than rewriting, per the diarization rule. |
| 2 | 00:05 | `חוויה משוגעת` | Experimental reads `משגעת`. Both are real words (`משוגעת` = crazy / `משגעת` = fabulous) and both fit. | Either. v1 retained. |
| 3 | 00:11 | CALLER: `ממש. ממש.` | v1 assigns the **second** `ממש` (11.65s, zero-length) to speaker_1; experimental has only one `ממש`, on speaker_0. Likely a zero-length overlap/duplication artifact in v1. | **Both `ממש` tokens rendered under CALLER (speaker_0)** — this IS an applied diarization decision, logged here (not a silent change). Rationale: experimental sees a single `ממש` on speaker_0, so speaker_0 is the confirmed source; v1's split of the duplicate onto speaker_1 is the artifact. Both repetitions kept (verbatim rule); attribution consolidated to the model-agreed speaker. Original v1 split is preserved in `transcript-raw.md`. |
| 4 | 00:31 | SELLER: `נכון.` | **Probable v1 artifact.** It spans 31.04–31.15 = **0.11s** — acoustically implausible for a two-syllable word (v1's other 2-syllable tokens run ≥0.2s). Experimental has **no** such token and instead extends `בקטנה` back to 31.01 to cover the same span. | **Delete it.** Not done because both readings are natural Hebrew ("True. In a small way." vs. just "In a small way.") and deletion would change whether the seller *affirms* the caller's premise — a meaning-bearing edit I will not make on timing evidence alone. **Highest-value item for a human listener to adjudicate.** |
| 5 | 00:40 | `בחודשים האלה שלקראת הלואין` | Cross-model disagreement **resolved in favour of scribe_v1**. Experimental reads `של לקראת הלווין` — `הלווין` means "the satellite" and `של לקראת` is ungrammatical. v1's `שלקראת הלואין` ("that lead up to Halloween") is correct and is corroborated by the context (she sells **costumes**; a swan costume is her own example). | None. Logged so the disagreement isn't silently buried. |
| 6 | 00:46 | `כן, כן, כן, כן, כן` | v1 has five; experimental has four. | v1 retained (more granular; verbatim rule). |
| 7 | 00:50 | `קודם כול` | Experimental reads `קודם כל`. Purely orthographic. | Either. v1 retained. |
| 8 | 01:12 | CALLER: `אטסי זה מקור, אה, לקוחות של לידים` | Garbled ("a source, uh, of customers, of leads") — but it is the **caller's own** self-correction mid-question, not a transcription error. Both models agree. | None. Kept verbatim. |
| 9 | 02:03 | SELLER: `כאילו אני מוכרת בארץ ב--` | Abandoned clause; reads as a contradiction with the preceding `אני מוכרת רק באטסי`. Both models agree on the words. She is self-correcting: *only* Etsy as a marketplace, but she also has her own website shop in Israel. | None. Kept verbatim — the self-contradiction is the data. |
| 10 | 03:21 | SELLER: `אבל לפעמים העלות יקרה` | Non-standard collocation ("the cost is expensive" rather than "high"). Experimental-only span, so no cross-model check. | Possibly `העלות יקרה` is exactly what she said (common in casual speech). Kept verbatim; do not "fix" to `העלות גבוהה`. |

---

## Confidence summary

- **CONFIRMED: 5** — two independent sources agree AND context is unambiguous
  (`קנאה`; the phantom `.` token; `מ-מסין`; the mid-word truncation; the missing 53s tail).
- **PROBABLE: 23** — good evidence (cross-model + timing/grammar), fix likely but not certain.
- **UNCERTAIN applied: 0** — nothing uncertain was written into the corrected transcript.
- **Flagged, not changed: 10** — including one high-priority item (#4, `נכון.`) that needs a
  human with the audio.
