---
role: cpo
task: e5-heroline
date: 2026-07-22
status: COMPLETE
qa_verdict: N/A (ruling, no code)
tier: n/a
---

- E5 blocked B3: screen-specs §3.2 + world-unfold AC said "no hero line when `statement` absent"; shipped `hero-video` renders `maker.displayName` at display-hero. Two reviewers had already cleared the code — so this was an unmade product decision, not a defect.
- **Ruling 1 (APPROVE-WITH-CHANGES):** name stays in the display tier when `statement` is absent. A display name is stored identity, not attributed speech; D10 bans fabricated *words*. Spec text amended, code unchanged.
- **Ruling 2 (APPROVE-WITH-CHANGES — the unruled half):** when `statement` is present, `maker.displayName` demotes to lead the caption line beneath it. B3 is deep-linkable; an unattributed statement is the weaker D10 posture. This is a real render change to `hero-video/index.tsx` and flips one currently-green test assertion.
- **Ruling 3 (REJECT the seed change):** seeds keep all 4 statements — they are the competition demo. Absent path exercised by `/preview` fixture toggle + existing unit tests instead.
- Eyes-on gate filed (blocks B3 merge, not dispatch): both hero variants viewed at world scale under a real theme. Design-Lead's direction was code-read, never `/preview`'d.
- Files changed: screen-specs §3.2 (rewritten), world-unfold AC + changelog, block-catalog hero-video props + Success state, design-direction display-budget row, DECISIONS.md (+1 entry, 21/50).
