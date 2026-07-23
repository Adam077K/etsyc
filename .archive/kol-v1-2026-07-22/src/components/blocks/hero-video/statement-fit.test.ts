/**
 * Gate-2 P1 — lines-after-balance fit for the hero statement.
 *
 * The critic's proof case: "Every glaze began as ash on a workshop floor" is
 * 44 characters — under the old ≤48 budget — and sets to THREE lines in the
 * sena center-column rect. The budget is replaced by fitStatementScale: a
 * loop over MEASURED set-line counts and band fit in the actual rect. These
 * tests drive the loop with synthetic measures shaped like the real cases;
 * the real-layout companion (e2e/preview.spec.ts) asserts the 3-line
 * statement stays inside the film rect on the live page.
 */

import { describe, expect, it } from "vitest";
import {
  fitStatementScale,
  MAX_STATEMENT_LINES,
  MIN_STATEMENT_SCALE,
  STATEMENT_SCALE_STEP,
} from "./statement-fit";

describe("fitStatementScale — lines-after-balance in the actual rect", () => {
  it("keeps full display size when the statement already sets within bounds", () => {
    const probed: number[] = [];
    const scale = fitStatementScale((s) => {
      probed.push(s);
      return { lines: 2, fits: true };
    });
    expect(scale).toBe(1);
    expect(probed).toEqual([1]); // no needless re-measures
  });

  it("a 3-line statement is permitted, not shrunk — the regression case must render, safely", () => {
    // the critic's exact shape: 44 chars, balances to 3 lines, band fits
    const scale = fitStatementScale(() => ({ lines: MAX_STATEMENT_LINES, fits: true }));
    expect(scale).toBe(1);
  });

  it("steps the size down until the set line count drops within the cap", () => {
    // sets to 4 lines above 0.8× — a char count could never catch this
    const scale = fitStatementScale((s) => ({ lines: s > 0.8 ? 4 : 3, fits: true }));
    expect(scale).toBeLessThanOrEqual(0.8);
    expect(scale).toBeGreaterThan(MIN_STATEMENT_SCALE); // fitted, not floored
  });

  it("steps down when the band would exceed its frame cap, even at a legal line count", () => {
    const scale = fitStatementScale((s) => ({ lines: 3, fits: s <= 0.7 }));
    expect(scale).toBeLessThanOrEqual(0.7);
    expect(scale).toBeGreaterThan(MIN_STATEMENT_SCALE);
  });

  it("lands on the first passing step from above (largest legal size wins)", () => {
    const scale = fitStatementScale((s) => ({ lines: s > 0.9 ? 4 : 2, fits: true }));
    // probes walk 1 → 0.92 → 0.8464…; the first one ≤0.9 wins
    expect(scale).toBe(STATEMENT_SCALE_STEP * STATEMENT_SCALE_STEP);
  });

  it("floors at MIN_STATEMENT_SCALE and applies it when nothing fits — overflow is then clipped, never painted outside", () => {
    const probed: number[] = [];
    const scale = fitStatementScale((s) => {
      probed.push(s);
      return { lines: 9, fits: false };
    });
    expect(scale).toBe(MIN_STATEMENT_SCALE);
    // the floor is APPLIED to the node (last probe at the floor), not just returned
    expect(probed[probed.length - 1]).toBe(MIN_STATEMENT_SCALE);
  });
});
