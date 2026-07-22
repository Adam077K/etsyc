import type { FeedCardAspect } from "@/lib/feed/select";

/**
 * The feed's spread composition model (W3-B1b — screen-specs §1.1).
 *
 * The 12-column grid is a MEASURING DEVICE, not a cell structure: cards
 * land in named slots that vary in span, column start, aspect and vertical
 * drop, grouped into three spread patterns that cycle. The vertical drop is
 * the anti-grid mechanism (design-direction §4.1) — no two cards in a
 * spread share a top edge, which is the assertion that actually catches a
 * grid. This module is pure so the layout gate can test the composition at
 * every N without a browser; the pixel-truth assertions live in
 * e2e/feed-layout.spec.ts on real getBoundingClientRect boxes.
 */

export type SlotName = "LEAD" | "SIDE" | "WIDE" | "INSET" | "TALL";
export type SpreadPattern = "S1" | "S2" | "S3";

export interface SlotSpec {
  name: SlotName;
  /** 12-col span at md+ (screen-specs §1.1 slot table). */
  span: number;
  /** 1-based grid column start at md+. */
  colStart: number;
  /** Desktop slot aspect — the mobile aspect cycles independently (§1.6). */
  aspect: FeedCardAspect;
  /** Vertical drop within the spread at md+, px — the anti-grid offset. */
  dropYPx: number;
}

export const SLOTS: Record<SlotName, SlotSpec> = {
  LEAD: { name: "LEAD", span: 7, colStart: 1, aspect: "4:5", dropYPx: 0 },
  SIDE: { name: "SIDE", span: 4, colStart: 9, aspect: "1:1", dropYPx: 96 },
  WIDE: { name: "WIDE", span: 8, colStart: 3, aspect: "16:9", dropYPx: 0 },
  INSET: { name: "INSET", span: 5, colStart: 1, aspect: "3:2", dropYPx: 64 },
  TALL: { name: "TALL", span: 5, colStart: 8, aspect: "4:5", dropYPx: 0 },
};

/** S1 the opening · S2 the breath · S3 the counter-spread. */
export const SPREAD_PATTERNS: Record<SpreadPattern, readonly SlotName[]> = {
  S1: ["LEAD", "SIDE"],
  S2: ["WIDE"],
  S3: ["INSET", "TALL"],
};

export interface FeedSlotAssignment {
  slot: SlotSpec;
  /** Index into the engine-ordered card list — order is never reshuffled. */
  cardIndex: number;
}

export interface FeedSpread {
  pattern: SpreadPattern;
  slots: FeedSlotAssignment[];
}

const CYCLE: readonly SpreadPattern[] = ["S1", "S2", "S3"];

/**
 * Compose N cards into spreads, terminating on a COMPLETE spread at every
 * N (discovery-feed AC "Small-N composition", closes design-direction
 * OQ-4). The seed period returns N=4, not 18 — these terminations are what
 * the competition checkpoint actually displays:
 *
 *   N=1 → WIDE alone (an editorial single, not a lonely card)
 *   N=2 → S1          (one complete spread)
 *   N=3 → S1+S2       (a complete opening, then a breath)
 *   N=4 → S1+S3       (two complete spreads — never ends on a lone WIDE)
 *   N≥5 → S1→S2→S3 cycling; a would-be orphan half of S1/S3 is PROMOTED
 *         to WIDE. Never end on an orphan half-spread.
 */
export function composeFeed(count: number): FeedSpread[] {
  if (count <= 0) return [];
  if (count === 1) return [spread("S2", 0)];
  if (count === 2) return [spread("S1", 0)];
  if (count === 3) return [spread("S1", 0), spread("S2", 2)];
  if (count === 4) return [spread("S1", 0), spread("S3", 2)];

  const spreads: FeedSpread[] = [];
  let nextCard = 0;
  let step = 0;
  while (nextCard < count) {
    const remaining = count - nextCard;
    let pattern: SpreadPattern = CYCLE[step % CYCLE.length] ?? "S2";
    // orphan rule: a 2-slot pattern with 1 card left promotes to WIDE
    if (SPREAD_PATTERNS[pattern].length > remaining) pattern = "S2";
    spreads.push(spread(pattern, nextCard));
    nextCard += SPREAD_PATTERNS[pattern].length;
    step += 1;
  }
  return spreads;
}

function spread(pattern: SpreadPattern, firstCardIndex: number): FeedSpread {
  return {
    pattern,
    slots: SPREAD_PATTERNS[pattern].map((name, i) => ({
      slot: SLOTS[name],
      cardIndex: firstCardIndex + i,
    })),
  };
}

/**
 * Below md the feed is single-column and variety comes from card HEIGHT,
 * not width (design-direction §7) — aspects cycle so the anti-grid
 * identity survives a fixed column width.
 */
export const MOBILE_ASPECT_CYCLE: readonly FeedCardAspect[] = [
  "4:5",
  "16:9",
  "1:1",
  "3:2",
];

export function mobileAspectFor(cardIndex: number): FeedCardAspect {
  return MOBILE_ASPECT_CYCLE[cardIndex % MOBILE_ASPECT_CYCLE.length] ?? "4:5";
}
