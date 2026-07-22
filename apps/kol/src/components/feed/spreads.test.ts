import { describe, expect, it, vi } from "vitest";

import {
  CAPTION_ALLOWANCE_PX,
  composeFeed,
  composeMobileFeed,
  MOBILE_SLOTS,
  mobileSlotRefWidthPx,
  REF_GRID,
  ROW_PATTERNS,
  SLOTS,
  slotRefHeightPx,
  slotRefWidthPx,
  type ComposableCard,
  type FeedRow,
} from "./spreads";

/**
 * Composition-model half of the anti-grid gate (W3-B1b R3). The gate-2
 * critic proved the previous machine assertions certified a layout that
 * was "a grid with a longer period" — a deterministic S1→S2→S3 cycle
 * repeating 3.6× at N=18 passed them all. The load-bearing assertion here
 * is therefore the PERIOD GATE: across N=18, no ordered slot sequence of
 * length 3–6 occurs more than twice, and ≥4 distinct row patterns appear
 * (screen-specs §1.7(c), strengthened per the gate-2 brief). It is
 * mutation-verified: reinstating the old cycle turns it red.
 *
 * Pixel-truth (real getBoundingClientRect boxes + the uniform-grid
 * negative control) lives in e2e/feed-layout.spec.ts.
 */

const FIXTURE_FOCALS = [
  { x: 0.5, y: 0.32 },
  { x: 0.34, y: 0.4 },
  { x: 0.62, y: 0.3 },
  { x: 0.5, y: 0.5 },
] as const;

/** Production-shaped input: every card 4:5 (FEED_CARD_ASPECT_DEFAULT) —
 *  the aspect-homogeneous worst case the composer must not cycle on. */
function cardsOf(n: number, salt = "fixture-video"): ComposableCard[] {
  return Array.from({ length: n }, (_, i) => ({
    videoId: `${salt}-${i}`,
    aspect: "4:5",
    focalPoint: FIXTURE_FOCALS[i % FIXTURE_FOCALS.length] ?? null,
  }));
}

/** Distinct-id profiles — the period gate must hold for ANY input, not
 *  one blessed fixture set. */
const PROFILES: ReadonlyArray<{ name: string; cards: (n: number) => ComposableCard[] }> = [
  { name: "fixtures", cards: (n) => cardsOf(n) },
  { name: "uuid-ish", cards: (n) => cardsOf(n, "3f9a1c-b7") },
  { name: "short-ids", cards: (n) => cardsOf(n, "v") },
  {
    name: "no focal points (schema add not landed)",
    cards: (n) =>
      cardsOf(n).map((card) => ({ ...card, focalPoint: null })),
  },
];

function slotNames(rows: FeedRow[]): string[] {
  return rows.flatMap((row) => row.slots.map(({ slot }) => slot.name));
}

function cardIndices(rows: FeedRow[]): number[] {
  return rows.flatMap((row) => row.slots.map(({ cardIndex }) => cardIndex));
}

/** Max occurrence count of any ordered subsequence of `length`. */
function maxSequenceRepeats(sequence: readonly string[], length: number): number {
  const counts = new Map<string, number>();
  let max = 0;
  for (let i = 0; i + length <= sequence.length; i += 1) {
    const key = sequence.slice(i, i + length).join("→");
    const next = (counts.get(key) ?? 0) + 1;
    counts.set(key, next);
    max = Math.max(max, next);
  }
  return max;
}

/** Mirror of the CSS flow at the 1440 reference — real geometry, no DOM. */
function refBoxes(rows: FeedRow[]) {
  const step = REF_GRID.colPx + REF_GRID.gutterPx;
  const boxes: Array<{
    cardIndex: number;
    slot: string;
    top: number;
    bottom: number;
    left: number;
    right: number;
    raisePx: number;
  }> = [];
  let rowTop = 0;
  for (const row of rows) {
    let track = 0;
    for (const { slot, cardIndex, raisePct } of row.slots) {
      const width = slotRefWidthPx(slot);
      // a card's rendered box is media + caption — mirror distributeAir
      const height = slotRefHeightPx(slot) + CAPTION_ALLOWANCE_PX;
      const raisePx = (raisePct / 100) * width;
      const top = rowTop + slot.dropYPx - raisePx;
      const left = (slot.colStart - 1) * step;
      boxes.push({
        cardIndex,
        slot: slot.name,
        top,
        bottom: top + height,
        left,
        right: left + width,
        raisePx,
      });
      track = Math.max(track, slot.dropYPx - raisePx + height);
    }
    rowTop += Math.max(0, track) + REF_GRID.rowGapPx;
  }
  return boxes;
}

describe("composeFeed — small-N terminations (§1.1 table, closes OQ-4)", () => {
  it("N=0 renders nothing (the empty state owns that surface)", () => {
    expect(composeFeed([])).toEqual([]);
  });

  it("N=1 is a WIDE editorial single, not a lonely card", () => {
    expect(slotNames(composeFeed(cardsOf(1)))).toEqual(["WIDE"]);
  });

  it("N=2 is one complete R-LEAD opening", () => {
    expect(slotNames(composeFeed(cardsOf(2)))).toEqual(["LEAD", "SIDE"]);
  });

  it("N=3 is a complete opening, then a breath (R-LEAD + R-WIDE)", () => {
    expect(slotNames(composeFeed(cardsOf(3)))).toEqual(["LEAD", "SIDE", "WIDE"]);
  });

  it("N=4 (the seed period) is R-LEAD + R-INSET — never ends on a lone WIDE", () => {
    const rows = composeFeed(cardsOf(4));
    expect(rows.map((row) => row.pattern)).toEqual(["R-LEAD", "R-INSET"]);
    expect(slotNames(rows)).toEqual(["LEAD", "SIDE", "INSET", "TALL"]);
  });
});

describe("composeFeed — structural invariants for every N and profile", () => {
  it("assigns every card exactly once, in engine order", () => {
    for (const profile of PROFILES) {
      for (let n = 1; n <= 24; n += 1) {
        expect(cardIndices(composeFeed(profile.cards(n)))).toEqual(
          Array.from({ length: n }, (_, i) => i),
        );
      }
    }
  });

  it("every row is one of the five legal patterns, left slot first", () => {
    for (const profile of PROFILES) {
      for (let n = 1; n <= 24; n += 1) {
        for (const row of composeFeed(profile.cards(n))) {
          expect(row.slots.map(({ slot }) => slot.name)).toEqual([
            ...ROW_PATTERNS[row.pattern],
          ]);
        }
      }
    }
  });

  it("hard constraint 1: no slot repeats within 2 placements", () => {
    for (const profile of PROFILES) {
      for (let n = 5; n <= 24; n += 1) {
        const names = slotNames(composeFeed(profile.cards(n)));
        for (let i = 0; i < names.length; i += 1) {
          expect(names[i]).not.toBe(names[i + 1]);
          expect(names[i]).not.toBe(names[i + 2]);
        }
      }
    }
  });

  it("hard constraint 2: no row pattern repeats consecutively", () => {
    for (const profile of PROFILES) {
      for (let n = 1; n <= 24; n += 1) {
        const patterns = composeFeed(profile.cards(n)).map((row) => row.pattern);
        for (let i = 0; i + 1 < patterns.length; i += 1) {
          expect(patterns[i + 1]).not.toBe(patterns[i]);
        }
      }
    }
  });

  it("deterministic: same input → same composition, and no randomness consulted", () => {
    const random = vi.spyOn(Math, "random");
    const now = vi.spyOn(Date, "now");
    for (const profile of PROFILES) {
      expect(composeFeed(profile.cards(18))).toEqual(composeFeed(profile.cards(18)));
      expect(composeMobileFeed(profile.cards(18))).toEqual(
        composeMobileFeed(profile.cards(18)),
      );
    }
    expect(random).not.toHaveBeenCalled();
    expect(now).not.toHaveBeenCalled();
    random.mockRestore();
    now.mockRestore();
  });

  it("ships without focalPoint: the mechanism runs, only the crop filter is skipped", () => {
    const withNull = composeFeed(
      cardsOf(18).map((card) => ({ ...card, focalPoint: null })),
    );
    expect(cardIndices(withNull)).toHaveLength(18);
  });

  it("focal safety: a face at the frame's top edge never lands in a crop that beheads it", () => {
    // y=0.05 survives only the uncropped 4:5 slots and COLUMN's gentle 3:4
    const cards = cardsOf(18);
    const edgy = { x: 0.5, y: 0.05 };
    for (const index of [6, 11]) {
      const card = cards[index];
      if (card !== undefined) cards[index] = { ...card, focalPoint: edgy };
    }
    const rows = composeFeed(cards);
    for (const row of rows) {
      for (const { slot, cardIndex } of row.slots) {
        if (cardIndex === 6 || cardIndex === 11) {
          expect(["LEAD", "TALL", "COLUMN"]).toContain(slot.name);
        }
      }
    }
  });
});

describe("THE PERIOD GATE — a cycle is a grid with a longer period (gate-2)", () => {
  it("N=18: no ordered slot sequence of length 3–6 occurs more than twice", () => {
    for (const profile of PROFILES) {
      const names = slotNames(composeFeed(profile.cards(18)));
      for (let length = 3; length <= 6; length += 1) {
        expect(
          maxSequenceRepeats(names, length),
          `${profile.name}: a length-${length} slot sequence repeats >2× — the composition is cycling (${names.join(",")})`,
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  it("N=18: at least four distinct row patterns appear (§1.7(c))", () => {
    for (const profile of PROFILES) {
      const patterns = new Set(
        composeFeed(profile.cards(18)).map((row) => row.pattern),
      );
      expect(
        patterns.size,
        `${profile.name}: ${[...patterns].join(",")}`,
      ).toBeGreaterThanOrEqual(4);
    }
  });

  it("holds at N=12 and N=24 too — the gate is not tuned to one N", () => {
    for (const profile of PROFILES) {
      for (const n of [12, 24]) {
        const names = slotNames(composeFeed(profile.cards(n)));
        for (let length = 3; length <= 6; length += 1) {
          expect(
            maxSequenceRepeats(names, length),
            `${profile.name} at N=${n}`,
          ).toBeLessThanOrEqual(2);
        }
      }
    }
  });

  it("NEGATIVE CONTROL: the gate rejects the old S1→S2→S3 cycle", () => {
    // The exact sequence the deleted composer produced at N=18 — the one
    // both prior machine assertions passed (gate-2 critic exhibit).
    const oldCycle = [
      "LEAD", "SIDE", "WIDE", "INSET", "TALL",
      "LEAD", "SIDE", "WIDE", "INSET", "TALL",
      "LEAD", "SIDE", "WIDE", "INSET", "TALL",
      "LEAD", "SIDE", "WIDE",
    ];
    expect(maxSequenceRepeats(oldCycle, 3)).toBeGreaterThan(2);
    expect(maxSequenceRepeats(oldCycle, 5)).toBeGreaterThan(2);
  });
});

describe("geometry at the 1440 reference — air is composition (finding 1)", () => {
  it("no two cards ever overlap, at any N, in any profile", () => {
    for (const profile of PROFILES) {
      for (let n = 1; n <= 24; n += 1) {
        const boxes = refBoxes(composeFeed(profile.cards(n)));
        for (let i = 0; i < boxes.length; i += 1) {
          for (let j = i + 1; j < boxes.length; j += 1) {
            const a = boxes[i];
            const b = boxes[j];
            if (a === undefined || b === undefined) continue;
            const overlaps =
              a.left < b.right &&
              b.left < a.right &&
              a.top < b.bottom &&
              b.top < a.bottom;
            expect(
              overlaps,
              `${profile.name} N=${n}: cards ${a.cardIndex}(${a.slot}) and ${b.cardIndex}(${b.slot}) overlap`,
            ).toBe(false);
          }
        }
      }
    }
  });

  it("a raised card keeps ≥ --space-10 of cluster air over its columns", () => {
    for (const profile of PROFILES) {
      const boxes = refBoxes(composeFeed(profile.cards(18)));
      for (const box of boxes) {
        if (box.raisePx <= 0) continue;
        for (const other of boxes) {
          if (other === box) continue;
          const sharesColumns = box.left < other.right && other.left < box.right;
          if (!sharesColumns || other.bottom > box.top) continue;
          // nearest card above, over any shared column
        }
        const nearestAbove = Math.max(
          0,
          ...boxes
            .filter(
              (other) =>
                other !== box &&
                box.left < other.right &&
                other.left < box.right &&
                other.bottom <= box.top + 0.5,
            )
            .map((other) => other.bottom),
        );
        expect(box.top - nearestAbove).toBeGreaterThanOrEqual(
          REF_GRID.clusterAirPx - 0.5,
        );
      }
    }
  });

  it("N=4: TALL rises into the void under SIDE — the ~510px pause is owned", () => {
    const rows = composeFeed(cardsOf(4));
    const tall = rows[1]?.slots[1];
    expect(tall?.slot.name).toBe("TALL");
    expect(tall?.raisePct ?? 0).toBeGreaterThan(0);

    const boxes = refBoxes(rows);
    const side = boxes.find((box) => box.slot === "SIDE");
    const tallBox = boxes.find((box) => box.slot === "TALL");
    expect(side).toBeDefined();
    expect(tallBox).toBeDefined();
    if (side && tallBox) {
      const air = tallBox.top - side.bottom;
      // clustered: --space-10 ≤ air < --space-10 + the 8px quantum
      expect(air).toBeGreaterThanOrEqual(REF_GRID.clusterAirPx - 0.5);
      expect(air).toBeLessThan(REF_GRID.clusterAirPx + 8.5);
    }
  });

  it("anti-grid (b) at the model level: DOM-adjacent cards never share a top within 24px", () => {
    for (const profile of PROFILES) {
      for (const n of [4, 12, 18, 24]) {
        const boxes = refBoxes(composeFeed(profile.cards(n)));
        for (let i = 0; i + 1 < boxes.length; i += 1) {
          const a = boxes[i];
          const b = boxes[i + 1];
          if (a === undefined || b === undefined) continue;
          expect(
            Math.abs(a.top - b.top),
            `${profile.name} N=${n}: cards ${i},${i + 1}`,
          ).toBeGreaterThan(24);
        }
      }
    }
  });

  it("the first row never raises — there is no void above the opening", () => {
    for (const profile of PROFILES) {
      const [first] = composeFeed(profile.cards(18));
      for (const { raisePct } of first?.slots ?? []) {
        expect(raisePct).toBe(0);
      }
    }
  });

  it("skeleton parity: raise geometry is slot-derived, so any N=4 input matches (CLS 0)", () => {
    const fromFixtures = composeFeed(cardsOf(4));
    const fromSynthetic = composeFeed(
      Array.from({ length: 4 }, (_, i) => ({
        videoId: `skeleton-${i}`,
        aspect: "4:5" as const,
        focalPoint: null,
      })),
    );
    expect(
      fromFixtures.map((row) => row.slots.map(({ slot, raisePct }) => [slot.name, raisePct])),
    ).toEqual(
      fromSynthetic.map((row) => row.slots.map(({ slot, raisePct }) => [slot.name, raisePct])),
    );
  });
});

describe("slot table matches screen-specs §1.1 exactly", () => {
  it("six slots, including the new COLUMN plate", () => {
    expect(SLOTS.LEAD).toMatchObject({ span: 7, colStart: 1, aspect: "4:5", dropYPx: 0 });
    expect(SLOTS.SIDE).toMatchObject({ span: 4, colStart: 9, aspect: "1:1", dropYPx: 96 });
    expect(SLOTS.WIDE).toMatchObject({ span: 8, colStart: 3, aspect: "16:9", dropYPx: 0 });
    expect(SLOTS.INSET).toMatchObject({ span: 5, colStart: 1, aspect: "3:2", dropYPx: 64 });
    expect(SLOTS.TALL).toMatchObject({ span: 5, colStart: 8, aspect: "4:5", dropYPx: 0 });
    expect(SLOTS.COLUMN).toMatchObject({ span: 4, colStart: 5, aspect: "3:4", dropYPx: 48 });
  });

  it("five row patterns whose spans never overlap (hard constraint 3)", () => {
    expect(Object.keys(ROW_PATTERNS)).toHaveLength(5);
    for (const names of Object.values(ROW_PATTERNS)) {
      const spans = names.map((name) => {
        const slot = SLOTS[name];
        return [slot.colStart, slot.colStart + slot.span - 1] as const;
      });
      for (let i = 0; i + 1 < spans.length; i += 1) {
        const left = spans[i];
        const right = spans[i + 1];
        if (left && right) expect(left[1]).toBeLessThan(right[0]);
      }
    }
  });
});

describe("mobile composition (§1.6) — the left edge is the identity", () => {
  it("slot table matches the spec: asymmetric insets, one bleed, no width mirrors", () => {
    expect(MOBILE_SLOTS["M-BLEED"]).toMatchObject({ leftInsetPx: 0, rightInsetPx: 0, aspect: "16:9" });
    expect(MOBILE_SLOTS["M-FULL"]).toMatchObject({ leftInsetPx: 32, rightInsetPx: 32, aspect: "4:5" });
    // right inset --space-14 (112), not --space-16: the slot-table fix
    // that broke the accidental 215px bilateral symmetry so (d), (e),
    // the bleed cadence and anti-periodicity can all hold at once
    expect(MOBILE_SLOTS["M-OFF-L"]).toMatchObject({ leftInsetPx: 32, rightInsetPx: 112, aspect: "1:1" });
    expect(MOBILE_SLOTS["M-OFF-R"]).toMatchObject({ leftInsetPx: 128, rightInsetPx: 32, aspect: "3:2" });
    // every pair of rendered widths clears (d)'s 8px guard at 375
    const widths = Object.values(MOBILE_SLOTS).map(mobileSlotRefWidthPx);
    expect(widths.sort((a, b) => b - a)).toEqual([375, 311, 231, 215]);
    for (let i = 0; i < widths.length; i += 1) {
      for (let j = i + 1; j < widths.length; j += 1) {
        expect(Math.abs((widths[i] ?? 0) - (widths[j] ?? 0))).toBeGreaterThan(8);
      }
    }
  });

  it("assigns every card once, in order, for every N and profile", () => {
    for (const profile of PROFILES) {
      for (let n = 1; n <= 24; n += 1) {
        const assigned = composeMobileFeed(profile.cards(n));
        expect(assigned.map(({ cardIndex }) => cardIndex)).toEqual(
          Array.from({ length: n }, (_, i) => i),
        );
      }
    }
  });

  it("hard constraints: no consecutive slot, bleed gap ≥5, (e)-LITERAL edges, adjacent widths differ >8px", () => {
    for (const profile of PROFILES) {
      for (const n of [8, 18, 24]) {
        const slots = composeMobileFeed(profile.cards(n)).map(({ slot }) => slot);
        let lastBleed = -Infinity;
        for (let i = 0; i < slots.length; i += 1) {
          const slot = slots[i];
          if (slot === undefined) continue;
          if (i > 0) {
            expect(slot.name).not.toBe(slots[i - 1]?.name);
            const prev = slots[i - 1];
            if (prev !== undefined) {
              expect(
                Math.abs(mobileSlotRefWidthPx(slot) - mobileSlotRefWidthPx(prev)),
                `${profile.name} N=${n}: cards ${i - 1},${i} share a width`,
              ).toBeGreaterThan(8);
              // §1.7(e) in its LITERAL form — achievable since the
              // slot-table fix reopened the M-OFF-L↔M-OFF-R edge: the
              // leading edge never repeats even once consecutively
              expect(
                slot.leftInsetPx,
                `${profile.name} N=${n}: cards ${i - 1},${i} share a left edge`,
              ).not.toBe(prev.leftInsetPx);
            }
          }
          if (slot.name === "M-BLEED") {
            expect(i - lastBleed).toBeGreaterThanOrEqual(5);
            lastBleed = i;
          }
        }
      }
    }
  });

  it("N=18 reads alive: the bleed appears, and ≥3 distinct left edges are used", () => {
    for (const profile of PROFILES) {
      const slots = composeMobileFeed(profile.cards(18)).map(({ slot }) => slot);
      const names = new Set(slots.map((slot) => slot.name));
      expect(names.has("M-BLEED"), `${profile.name}: the bleed never fires`).toBe(true);
      const edgeSet = new Set(slots.map((slot) => slot.leftInsetPx));
      expect(edgeSet.size).toBeGreaterThanOrEqual(3);
    }
  });

  it("mobile period gate: no slot sequence of length 4–6 repeats more than twice at N=18", () => {
    for (const profile of PROFILES) {
      const names = composeMobileFeed(profile.cards(18)).map(({ slot }) => slot.name);
      for (let length = 4; length <= 6; length += 1) {
        expect(
          maxSequenceRepeats(names, length),
          `${profile.name}: mobile is cycling (${names.join(",")})`,
        ).toBeLessThanOrEqual(2);
      }
    }
  });
});
