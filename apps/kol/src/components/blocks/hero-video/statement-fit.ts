/**
 * Lines-after-balance fit for the hero statement (§3.2, gate-2 P1).
 *
 * The old authoring constraint was a ≤48-character budget — the wrong
 * constraint: "Every glaze began as ash on a workshop floor" is 44 chars and
 * sets to THREE lines in the sena center-column rect. A character count
 * cannot bound a line count across five type pairings, so the budget is
 * replaced by a constraint measured in the ACTUAL rect with the ACTUAL
 * pairing: the set statement may occupy at most MAX_STATEMENT_LINES lines,
 * and the chrome band it sits in may occupy at most HERO_CHROME_MAX_FRACTION
 * of the film frame (the film always wins — the band must never veil the
 * whole hero). When either bound is exceeded, the display size steps down
 * until both hold; the band itself grows with the text and carries its own
 * solid --scrim-strong backdrop, so a fitted statement is on covered scrim
 * by construction (invariant I5 — no waiver).
 */

/** Max set lines for the display statement, measured after text-wrap:balance. */
export const MAX_STATEMENT_LINES = 3;

/** The chrome band (fade zone included) may cover at most this much of the frame. */
export const HERO_CHROME_MAX_FRACTION = 0.8;

/** Multiplicative step per fit iteration — small enough to land near the bound. */
export const STATEMENT_SCALE_STEP = 0.92;

/** Hard floor — below this the line is no longer display-tier; stop stepping. */
export const MIN_STATEMENT_SCALE = 0.55;

export interface StatementMeasurement {
  /** Set line count at the probed scale (after balance, in the real rect). */
  lines: number;
  /** Whether the chrome band fits inside HERO_CHROME_MAX_FRACTION of the frame. */
  fits: boolean;
}

/**
 * Find the largest scale ≤ 1 at which the statement sets to
 * ≤ MAX_STATEMENT_LINES lines AND the chrome band fits the frame cap.
 * `measure` is expected to apply the scale to the real node and report what
 * actually set — the loop never reasons about characters.
 */
export function fitStatementScale(
  measure: (scale: number) => StatementMeasurement,
): number {
  let scale = 1;
  while (scale > MIN_STATEMENT_SCALE) {
    const m = measure(scale);
    if (m.lines <= MAX_STATEMENT_LINES && m.fits) return scale;
    scale *= STATEMENT_SCALE_STEP;
  }
  // floor: apply it so the node is left at the smallest permitted size —
  // overflow past this point is clipped by the frame, never painted outside
  measure(MIN_STATEMENT_SCALE);
  return MIN_STATEMENT_SCALE;
}

/** Count the rendered line boxes of an element via a Range walk (0 in jsdom). */
export function countSetLines(el: HTMLElement): number {
  const range = el.ownerDocument.createRange();
  range.selectNodeContents(el);
  // jsdom has no Range#getClientRects — report 0 lines (fit becomes a no-op)
  if (typeof range.getClientRects !== "function") return 0;
  let lines = 0;
  let lastTop = Number.NEGATIVE_INFINITY;
  for (const rect of range.getClientRects()) {
    if (rect.width <= 1 || rect.height <= 1) continue;
    // fragments on one line share (approximately) a top edge
    if (Math.abs(rect.top - lastTop) > rect.height / 2) {
      lines += 1;
      lastTop = rect.top;
    }
  }
  return lines;
}

/**
 * DOM-side driver: probe scales on the real h1 inside the real frame.
 * The base size is read COMPUTED (style cleared first), so the class's own
 * responsive expression — 8cqi below sm, 10cqi from sm (band ruling) —
 * stays the source of truth at every viewport; probes scale that resolved
 * pixel value, and the ResizeObserver re-derives it on any frame resize.
 */
export function fitHeroStatement(args: {
  frame: HTMLElement;
  chrome: HTMLElement;
  statement: HTMLElement;
}): number {
  const { frame, chrome, statement } = args;
  statement.style.fontSize = "";
  const basePx = Number.parseFloat(getComputedStyle(statement).fontSize);
  return fitStatementScale((scale) => {
    if (Number.isFinite(basePx) && basePx > 0) {
      statement.style.fontSize = scale === 1 ? "" : `${(basePx * scale).toFixed(2)}px`;
    }
    const lines = countSetLines(statement);
    const frameHeight = frame.getBoundingClientRect().height;
    const bandHeight = chrome.getBoundingClientRect().height;
    // jsdom / pre-layout: nothing measured → treat as fitting (no-op)
    const fits =
      frameHeight === 0 || bandHeight <= frameHeight * HERO_CHROME_MAX_FRACTION;
    return { lines, fits };
  });
}
