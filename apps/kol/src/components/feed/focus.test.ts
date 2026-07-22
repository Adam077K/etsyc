import { describe, expect, it } from "vitest";

import { ambientIndicesFor, pickFocusIndex } from "./focus";

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

describe("ambientIndicesFor — the ≥2-in-motion floor (CPO Ruling 2)", () => {
  it("takes the composition-order neighbours around a mid-feed focus", () => {
    expect(ambientIndicesFor(5, 18)).toEqual([6, 4]);
  });

  it("widens downward at the top edge", () => {
    expect(ambientIndicesFor(0, 4)).toEqual([1, 2]);
  });

  it("widens upward at the bottom edge", () => {
    expect(ambientIndicesFor(3, 4)).toEqual([2, 1]);
  });

  it("N=1 is exempt — no neighbours exist", () => {
    expect(ambientIndicesFor(0, 1)).toEqual([]);
  });

  it("floor: for every N≥2 and every focus, ≥1 ambient neighbour exists", () => {
    for (let count = 2; count <= 19; count += 1) {
      for (let focus = 0; focus < count; focus += 1) {
        const ambient = ambientIndicesFor(focus, count);
        expect(ambient.length).toBeGreaterThanOrEqual(1);
        expect(ambient.length).toBeLessThanOrEqual(2);
        expect(ambient).not.toContain(focus);
        for (const index of ambient) {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(count);
        }
      }
    }
  });
});
