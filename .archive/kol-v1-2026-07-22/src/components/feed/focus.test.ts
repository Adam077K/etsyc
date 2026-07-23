import { describe, expect, it } from "vitest";

import {
  ambientCountForVisible,
  ambientIndicesFor,
  pickFocusIndex,
} from "./focus";

describe("pickFocusIndex — nearest viewport centre wins", () => {
  it("picks the minimum distance", () => {
    expect(pickFocusIndex([420, 60, 900, 310])).toBe(1);
  });

  it("keeps the earlier (engine-ordered) card on a tie", () => {
    expect(pickFocusIndex([100, 100, 300])).toBe(0);
  });

  it("skips unmeasurable cards", () => {
    expect(pickFocusIndex([Number.POSITIVE_INFINITY, 80])).toBe(1);
  });

  it("null when nothing is measurable", () => {
    expect(pickFocusIndex([])).toBeNull();
    expect(
      pickFocusIndex([Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY]),
    ).toBeNull();
  });
});

describe("ambientCountForVisible — loops scale with cards in view (gate-2)", () => {
  it("≤2 in view → 0 ambient: focus alone carries the life", () => {
    expect(ambientCountForVisible(0)).toBe(0);
    expect(ambientCountForVisible(1)).toBe(0);
    expect(ambientCountForVisible(2)).toBe(0);
  });

  it("3 in view → 1 ambient", () => {
    expect(ambientCountForVisible(3)).toBe(1);
  });

  it("≥4 in view → 2 ambient, never more (everything-moving is banned)", () => {
    expect(ambientCountForVisible(4)).toBe(2);
    expect(ambientCountForVisible(18)).toBe(2);
  });
});

describe("ambientIndicesFor — spending the ambient budget", () => {
  it("takes the composition-order neighbours around a mid-feed focus", () => {
    expect(ambientIndicesFor(5, 18)).toEqual([6, 4]);
  });

  it("widens downward at the top edge", () => {
    expect(ambientIndicesFor(0, 4)).toEqual([1, 2]);
  });

  it("widens upward at the bottom edge", () => {
    expect(ambientIndicesFor(3, 4)).toEqual([2, 1]);
  });

  it("a zero budget yields no ambient at all", () => {
    expect(ambientIndicesFor(5, 18, 0)).toEqual([]);
  });

  it("N=1 is exempt — no neighbours exist", () => {
    expect(ambientIndicesFor(0, 1)).toEqual([]);
  });

  it("never includes focus, never exceeds the budget, always in range", () => {
    for (let count = 2; count <= 19; count += 1) {
      for (let focus = 0; focus < count; focus += 1) {
        for (let budget = 0; budget <= 2; budget += 1) {
          const ambient = ambientIndicesFor(focus, count, budget);
          expect(ambient.length).toBeLessThanOrEqual(budget);
          expect(ambient).not.toContain(focus);
          for (const index of ambient) {
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(count);
          }
        }
      }
    }
  });
});
