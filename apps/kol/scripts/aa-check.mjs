/**
 * Scripted WCAG AA check for the color pairings introduced by the capture-ritual
 * redesign. Team standard: verify contrast by script, never by eye. Composites
 * any alpha foreground/background over the stated dark ground before measuring.
 *
 * Floor classification (WCAG 1.4.3 / 1.4.11):
 *  - Normal text  → 4.5:1. "Large text" is >= 24px, or >= 18.66px (14pt) BOLD.
 *    Our 0.9rem (14.4px) serif why-lines and 12px (text-xs) lines are NORMAL.
 *  - Non-text UI / graphical objects → 3:1.
 */
const T = {
  ink: "#1C1613",
  inkSoft: "#241B16",
  inkRaise: "#2E241E",
  bone: "#EFE6D6",
  boneDim: "#CDBFA6",
  marigold: "#F1641E",
  marigoldBright: "#FF7A3C",
};

const hex = (h) => {
  const n = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};
// composite fg (with alpha a) over an opaque bg
const over = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

// [label, fgHex, fgAlpha, bgHex, bgAlpha, groundHex, minRatio]
// minRatio: 4.5 = normal text · 3.0 = non-text graphical object only.
const PAIRS = [
  ["marigold mono meta on ink (Call sheet, scene slot) [normal text]", T.marigold, 1, T.ink, 1, T.ink, 4.5],
  ["marigold 'to shoot' on ink-soft/30 (aside) [normal text]", T.marigold, 1, T.inkSoft, 0.3, T.ink, 4.5],
  ["marigold-bright kicker on ink (viewfinder, over from-ink) [normal text]", T.marigoldBright, 1, T.ink, 1, T.ink, 4.5],
  ["bone-dim mono 'in the can' on ink [normal text]", T.boneDim, 1, T.ink, 1, T.ink, 4.5],
  ["ink on marigold/90 chip (scene slate filled) [normal text]", T.ink, 1, T.marigold, 0.9, T.ink, 4.5],
  ["ink on marigold button [normal text]", T.ink, 1, T.marigold, 1, T.ink, 4.5],
  ["bone/95 framing guidance on ink scrim [normal text]", T.bone, 0.95, T.ink, 1, T.ink, 4.5],
  ["bone/70 why-line serif on ink-soft/60 [normal text]", T.bone, 0.7, T.inkSoft, 0.6, T.ink, 4.5],
  ["bone/55 why-line serif (0.9rem) on ink-soft (filmed) [normal text]", T.bone, 0.55, T.inkSoft, 1, T.ink, 4.5],
  ["bone/55 playsOn (12px) in call sheet aside on ink/40 [normal text]", T.bone, 0.55, T.ink, 0.4, T.ink, 4.5],
  ["bone/90 shot title in aside on ink/40 [normal text]", T.bone, 0.9, T.ink, 0.4, T.ink, 4.5],
  ["marigold-bright frame ticks on ink [non-text graphical]", T.marigoldBright, 1, T.ink, 1, T.ink, 3.0],
  ["marigold progress bar on ink-raise [non-text graphical]", T.marigold, 1, T.inkRaise, 1, T.ink, 3.0],
];

let fail = 0;
for (const [label, fg, fa, bg, ba, ground, min] of PAIRS) {
  const bgC = ba < 1 ? over(hex(bg), ba, hex(ground)) : hex(bg);
  const fgC = fa < 1 ? over(hex(fg), fa, bgC) : hex(fg);
  const r = ratio(fgC, bgC);
  const ok = r >= min;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  (need ${min})  ${label}`);
}
console.log(fail ? `\n${fail} FAILURE(S)` : "\nALL PASS");
process.exit(fail ? 1 : 0);
