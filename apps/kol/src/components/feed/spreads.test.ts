import { describe, expect, it } from "vitest";

import {
  composeFeed,
  mobileAspectFor,
  SLOTS,
  SPREAD_PATTERNS,
  type FeedSpread,
} from "./spreads";

/**
 * Composition-model half of the anti-grid gate (W3-B1b). These assertions
 * run on the pure model at every N; the pixel-truth half — real measured
 * getBoundingClientRect boxes, plus the uniform-grid negative control —
 * lives in e2e/feed-layout.spec.ts.
 */

function slotNames(spreads: FeedSpread[]): string[] {
  return spreads.flatMap((s) => s.slots.map(({ slot }) => slot.name));
}

function cardIndices(spreads: FeedSpread[]): number[] {
  return spreads.flatMap((s) => s.slots.map(({ cardIndex }) => cardIndex));
}

describe("composeFeed — small-N terminations (discovery-feed AC, closes OQ-4)", () => {
  it("N=0 renders nothing (the empty state owns that surface)", () => {
    expect(composeFeed(0)).toEqual([]);
    expect(composeFeed(-3)).toEqual([]);
  });

  it("N=1 is a WIDE editorial single, not a lonely card", () => {
    expect(slotNames(composeFeed(1))).toEqual(["WIDE"]);
  });

  it("N=2 is one complete S1 opening", () => {
    expect(slotNames(composeFeed(2))).toEqual(["LEAD", "SIDE"]);
  });

  it("N=3 is a complete opening, then a breath (S1+S2)", () => {
    expect(slotNames(composeFeed(3))).toEqual(["LEAD", "SIDE", "WIDE"]);
  });

  it("N=4 (the seed period) is S1+S3 — never ends on a lone WIDE", () => {
    const spreads = composeFeed(4);
    expect(spreads.map((s) => s.pattern)).toEqual(["S1", "S3"]);
    expect(slotNames(spreads)).toEqual(["LEAD", "SIDE", "INSET", "TALL"]);
  });

  it("N=5 is the full S1→S2→S3 cycle", () => {
    expect(composeFeed(5).map((s) => s.pattern)).toEqual(["S1", "S2", "S3"]);
  });

  it("N=6 promotes the orphan half-spread to WIDE", () => {
    expect(composeFeed(6).map((s) => s.pattern)).toEqual(["S1", "S2", "S3", "S2"]);
  });

  it("N=18 (FEED_LIMIT_DEFAULT) cycles and terminates complete", () => {
    const spreads = composeFeed(18);
    expect(cardIndices(spreads)).toHaveLength(18);
    expect(spreads.map((s) => s.pattern)).toEqual([
      "S1", "S2", "S3", "S1", "S2", "S3", "S1", "S2", "S3", "S1", "S2",
    ]);
  });
});

describe("composeFeed — structural invariants for every N", () => {
  it("assigns every card exactly once, in engine order", () => {
    for (let n = 1; n <= 24; n += 1) {
      expect(cardIndices(composeFeed(n))).toEqual(
        Array.from({ length: n }, (_, i) => i),
      );
    }
  });

  it("never terminates on an orphan half-spread", () => {
    for (let n = 1; n <= 24; n += 1) {
      for (const spread of composeFeed(n)) {
        expect(spread.slots).toHaveLength(SPREAD_PATTERNS[spread.pattern].length);
      }
    }
  });
});

describe("anti-grid invariants carried by the model", () => {
  it("≥3 distinct spans from N=3 up; never a single span at N=2", () => {
    for (let n = 3; n <= 24; n += 1) {
      const spans = new Set(
        composeFeed(n).flatMap((s) => s.slots.map(({ slot }) => slot.span)),
      );
      expect(spans.size).toBeGreaterThanOrEqual(3);
    }
    const twoCardSpans = composeFeed(2).flatMap((s) =>
      s.slots.map(({ slot }) => slot.span),
    );
    expect(new Set(twoCardSpans).size).toBeGreaterThan(1);
  });

  it("cards sharing a spread row are vertically offset by more than 24px", () => {
    // the drop-Y is the anti-grid mechanism (design-direction §4.1)
    for (const spread of composeFeed(24)) {
      const drops = spread.slots.map(({ slot }) => slot.dropYPx);
      for (let i = 0; i + 1 < drops.length; i += 1) {
        expect(Math.abs((drops[i + 1] ?? 0) - (drops[i] ?? 0))).toBeGreaterThan(24);
      }
    }
  });

  it("no single repeating cell: span+aspect pairs vary across the feed", () => {
    const cells = new Set(
      composeFeed(18).flatMap((s) =>
        s.slots.map(({ slot }) => `${slot.span}:${slot.aspect}`),
      ),
    );
    expect(cells.size).toBeGreaterThanOrEqual(3);
  });

  it("slot table matches the screen spec §1.1 exactly", () => {
    expect(SLOTS.LEAD).toMatchObject({ span: 7, colStart: 1, aspect: "4:5", dropYPx: 0 });
    expect(SLOTS.SIDE).toMatchObject({ span: 4, colStart: 9, aspect: "1:1", dropYPx: 96 });
    expect(SLOTS.WIDE).toMatchObject({ span: 8, colStart: 3, aspect: "16:9", dropYPx: 0 });
    expect(SLOTS.INSET).toMatchObject({ span: 5, colStart: 1, aspect: "3:2", dropYPx: 64 });
    expect(SLOTS.TALL).toMatchObject({ span: 5, colStart: 8, aspect: "4:5", dropYPx: 0 });
  });
});

describe("mobile aspect cycle (§1.6 — variety by height when width is fixed)", () => {
  it("cycles 4:5 · 16:9 · 1:1 · 3:2 — consecutive cards never share an aspect", () => {
    const aspects = Array.from({ length: 18 }, (_, i) => mobileAspectFor(i));
    for (let i = 0; i + 1 < aspects.length; i += 1) {
      expect(aspects[i + 1]).not.toBe(aspects[i]);
    }
    expect(new Set(aspects.slice(0, 4))).toEqual(
      new Set(["4:5", "16:9", "1:1", "3:2"]),
    );
  });
});
