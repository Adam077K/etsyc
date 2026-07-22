import type { FeedCardAspect, FeedCardFocalPoint } from "@/lib/feed/select";

/**
 * The feed's composition model (W3-B1b R3 — screen-specs §1.1/§1.6,
 * design-direction §4.1/§4.1b, gate-2 critic ruling 2026-07-22).
 *
 * The 12-column grid is a MEASURING DEVICE, not a cell structure: cards
 * land in six named slots grouped into five row patterns. Assignment is
 * CONTENT-AWARE, not cyclic — the previous S1→S2→S3 rotation was a
 * deterministic three-pattern cycle that repeated 3.6× at N=18, i.e. a
 * grid with a longer period, and it is deleted. Each card is placed by
 * an art-director rule: the clip picks the slot it belongs in, and the
 * composition refuses to repeat itself.
 *
 *   cost(slot) = |ln(clipAspect / slotAspect)|            // aspect fit
 *              + 0.50 · repeatPenalty(slot)               // recent reuse
 *              + 0.35 · edgePenalty(slot)                 // same col-start
 *              + rowEchoPenalty(slot)                     // recent row pattern
 *              + 0.22 · contentSpread(videoId, slot)      // aperiodicity
 *
 * Two terms extend the spec's three, for reasons the spec's own gate
 * demands: with the data layer emitting one uniform card aspect
 * (FEED_CARD_ASPECT_DEFAULT is 4:5 for every card), a greedy argmin over
 * finite fixed-radius state PROVABLY settles into a limit cycle — which
 * is exactly the period screen-specs §1.7(c) exists to catch. rowEcho
 * pressures against a row pattern echoing 2–3 rows back; contentSpread
 * is a deterministic FNV-1a hash of (videoId, slot) that makes each
 * card's cost surface unique, so no state ever recurs exactly. Same
 * input → same composition, always: no Math.random(), no Date.now().
 *
 * The module is pure so the layout gate can test composition, period and
 * geometry at every N without a browser; pixel-truth assertions live in
 * e2e/feed-layout.spec.ts on real getBoundingClientRect boxes.
 */

export type SlotName = "LEAD" | "SIDE" | "WIDE" | "INSET" | "TALL" | "COLUMN";
export type RowPatternName =
  | "R-LEAD"
  | "R-INSET"
  | "R-CROSS"
  | "R-WIDE"
  | "R-PLATE";

/** Slot aspects are a superset of card aspects — COLUMN's 3:4 plate is a
 *  composition aspect that no card carries in its data. */
export type SlotAspect = FeedCardAspect | "3:4";

export interface SlotSpec {
  name: SlotName;
  /** 12-col span at md+ (screen-specs §1.1 slot table). */
  span: number;
  /** 1-based grid column start at md+. */
  colStart: number;
  /** Desktop slot aspect — mobile slots (§1.6) carry their own. */
  aspect: SlotAspect;
  /** Vertical drop within the row at md+, px — the anti-grid offset. */
  dropYPx: number;
}

export const SLOTS: Record<SlotName, SlotSpec> = {
  LEAD: { name: "LEAD", span: 7, colStart: 1, aspect: "4:5", dropYPx: 0 },
  SIDE: { name: "SIDE", span: 4, colStart: 9, aspect: "1:1", dropYPx: 96 },
  WIDE: { name: "WIDE", span: 8, colStart: 3, aspect: "16:9", dropYPx: 0 },
  INSET: { name: "INSET", span: 5, colStart: 1, aspect: "3:2", dropYPx: 64 },
  TALL: { name: "TALL", span: 5, colStart: 8, aspect: "4:5", dropYPx: 0 },
  // COLUMN is new (2026-07-22): a narrow centred portrait plate with four
  // columns of open ground each side — the magazine move the first slot
  // table had no vocabulary for.
  COLUMN: { name: "COLUMN", span: 4, colStart: 5, aspect: "3:4", dropYPx: 48 },
};

/** The five legal rows (§1.1) — any other slot set is not a composition. */
export const ROW_PATTERNS: Record<RowPatternName, readonly SlotName[]> = {
  "R-LEAD": ["LEAD", "SIDE"], // big-left / small-right
  "R-INSET": ["INSET", "TALL"], // small-left / big-right
  "R-CROSS": ["INSET", "SIDE"], // two smalls, wide ground between
  "R-WIDE": ["WIDE"], // the breath
  "R-PLATE": ["COLUMN"], // the centred plate
};

/** What the composer needs to know about a card — a structural subset of
 *  FeedCard, so the view-model passes straight through. */
export interface ComposableCard {
  videoId: string;
  aspect: FeedCardAspect;
  focalPoint: FeedCardFocalPoint | null;
}

export interface FeedSlotAssignment {
  slot: SlotSpec;
  /** Index into the engine-ordered card list — order is never reshuffled. */
  cardIndex: number;
  /**
   * Upward pull into the previous row's void, as a percentage of this
   * card's own grid-area width (percentage margins resolve against inline
   * size, and every height in the composition is width-derived, so the
   * geometry survives viewport scaling). 0 = the plain drop-Y rhythm.
   * This is the cluster-and-pause mechanism: air is distributed as
   * composition, never as uniform padding (gate-2 critic finding 1 — the
   * ~510px unowned void at N=4).
   */
  raisePct: number;
}

export interface FeedRow {
  pattern: RowPatternName;
  slots: FeedSlotAssignment[];
}

const ASPECT_RATIO: Record<SlotAspect, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
  "3:4": 3 / 4,
};

/* ------------------------------------------------------------------ */
/* Cost model                                                          */
/* ------------------------------------------------------------------ */

const WEIGHT_REPEAT = 0.5;
const WEIGHT_EDGE = 0.35;
const WEIGHT_SPREAD = 0.22;
/**
 * Usage balance: each use beyond the least-used slot costs this much.
 * This is the "composition refuses to repeat itself" pressure at book
 * scale — without it a greedy argmin on aspect-homogeneous input settles
 * into its cheapest two or three slots and cycles them, which is the
 * exact failure the period gate exists to catch. 0.4 per use is sized to
 * overcome the largest base aspect gap (≈0.8, 4:5 vs 16:9) within two
 * placements, so every slot in the vocabulary gets spoken.
 */
const WEIGHT_BALANCE = 0.4;
/**
 * Transition echo: answering the same row pattern with the same successor
 * it received before is how three-card sequences recur even when slot
 * usage is balanced — the book reads "…and after every opening spread,
 * the plate." The last two answers per pattern are remembered and
 * penalised (full, then half), sized above the largest base aspect gap so
 * a cheap favourite cannot simply pay the fine every time.
 */
const WEIGHT_TRANSITION = 0.9;
/** Row-pattern echo: 1 row back is hard constraint 2; 2–3 rows back is
 *  scored pressure so no pattern drums. */
const ROW_ECHO_PENALTY: Record<number, number> = { 2: 0.8, 3: 0.2 };
/** A crop must keep the focal point ≥12% inside every crop edge (§1.1). */
const FOCAL_SAFE_INSET = 0.12;
/** Hard constraint 1: no slot repeats within 2 placements. */
const SLOT_REPEAT_WINDOW = 2;

/** Deterministic FNV-1a hash of (videoId, slot) → [0, 1). The
 *  aperiodicity term — content identity, never randomness. */
function contentSpread(videoId: string, slotName: string): number {
  const key = `${videoId}|${slotName}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Focal safety (§1.1 eligibility): on each CROPPED axis, the surviving
 * fraction of the source must keep the focal point ≥12% (in source units)
 * inside both crop edges. Uncropped axes are the clip's own framing and
 * are not our concern. focalPoint absent → the filter is skipped entirely
 * (§1.1 degradation — the mechanism ships with or without the schema add).
 */
function isFocalSafe(
  card: ComposableCard,
  slotAspect: SlotAspect,
): boolean {
  if (card.focalPoint === null) return true;
  const clip = ASPECT_RATIO[card.aspect];
  const slot = ASPECT_RATIO[slotAspect];
  const { x, y } = card.focalPoint;
  // slot wider than clip → vertical crop; surviving height fraction:
  const vertVisible = clip / slot;
  if (vertVisible < 1 && vertVisible * Math.min(y, 1 - y) < FOCAL_SAFE_INSET) {
    return false;
  }
  // slot narrower than clip → horizontal crop; surviving width fraction:
  const horizVisible = slot / clip;
  if (
    horizVisible < 1 &&
    horizVisible * Math.min(x, 1 - x) < FOCAL_SAFE_INSET
  ) {
    return false;
  }
  return true;
}

function aspectFitCost(card: ComposableCard, slotAspect: SlotAspect): number {
  return Math.abs(Math.log(ASPECT_RATIO[card.aspect] / ASPECT_RATIO[slotAspect]));
}

/** Occurrences of the slot among the last 4 placements, 1/distance each,
 *  beyond the hard window (which already forbids distances ≤ 2 outright). */
function repeatPenalty(
  slotName: string,
  placed: readonly string[],
  hardWindow: number,
): number {
  let penalty = 0;
  for (let d = hardWindow + 1; d <= 4; d += 1) {
    if (placed[placed.length - d] === slotName) penalty += 1 / d;
  }
  return penalty;
}

/** Same leading edge as the last (1.0) or second-last (0.5) placement. */
function edgePenalty(edge: number, recentEdges: readonly number[]): number {
  let penalty = 0;
  if (recentEdges[recentEdges.length - 1] === edge) penalty += 1;
  if (recentEdges[recentEdges.length - 2] === edge) penalty += 0.5;
  return penalty;
}

function rowEchoPenalty(
  pattern: RowPatternName,
  rowHistory: readonly RowPatternName[],
): number {
  let penalty = 0;
  for (const [distance, value] of Object.entries(ROW_ECHO_PENALTY)) {
    // The candidate row would sit at index length; the row `d` back in the
    // finished book is rowHistory[length - d]. d=1 is hard constraint 2.
    if (rowHistory[rowHistory.length - Number(distance)] === pattern) {
      penalty += value;
    }
  }
  return penalty;
}

/* ------------------------------------------------------------------ */
/* Desktop composer                                                    */
/* ------------------------------------------------------------------ */

const STARTER_ORDER: readonly SlotName[] = ["LEAD", "INSET", "WIDE", "COLUMN"];
const SLOT_ORDER: readonly SlotName[] = [
  "LEAD",
  "SIDE",
  "WIDE",
  "INSET",
  "TALL",
  "COLUMN",
];

/** Patterns a starter can grow into; completions are keyed off the pair. */
const STARTER_PATTERNS: Partial<Record<SlotName, readonly RowPatternName[]>> = {
  LEAD: ["R-LEAD"],
  INSET: ["R-INSET", "R-CROSS"],
  WIDE: ["R-WIDE"],
  COLUMN: ["R-PLATE"],
};

function completionsFor(
  starter: SlotName,
  bannedPattern: RowPatternName | null,
): Array<{ slot: SlotName; pattern: RowPatternName }> {
  if (starter === "LEAD") {
    return bannedPattern === "R-LEAD"
      ? []
      : [{ slot: "SIDE", pattern: "R-LEAD" }];
  }
  // INSET completes right-side: TALL forms R-INSET, SIDE forms R-CROSS.
  const options: Array<{ slot: SlotName; pattern: RowPatternName }> = [
    { slot: "TALL", pattern: "R-INSET" },
    { slot: "SIDE", pattern: "R-CROSS" },
  ];
  return options.filter((option) => option.pattern !== bannedPattern);
}

interface Candidate {
  slot: SlotSpec;
  /** The row pattern this placement forms or reaches for (min-penalty one
   *  when a starter can grow two ways). */
  pattern: RowPatternName;
  completes: boolean;
  cost: number;
}

/**
 * Compose N cards into rows. Content-aware and deterministic (§1.1):
 * greedy argmin over the cost model under four hard constraints —
 *   1. no slot repeats within 2 placements;
 *   2. no row pattern repeats consecutively;
 *   3. a row's spans never overlap (rows only ever form the five legal
 *      patterns, left slot first, so reading order is DOM order);
 *   4. never end on an orphan half-row — a trailing single is promoted
 *      to WIDE (or to COLUMN when a WIDE row just ran, so constraint 2
 *      survives the promotion).
 *
 * N ≤ 4 returns the §1.1 termination table verbatim — it is the spec's
 * asserted output for the seed period, art-directed to avoid ending on a
 * lone WIDE, which the greedy rule cannot guarantee by itself:
 *   N=1 → WIDE alone · N=2 → R-LEAD · N=3 → R-LEAD + R-WIDE ·
 *   N=4 → R-LEAD + R-INSET.
 */
export function composeFeed(cards: readonly ComposableCard[]): FeedRow[] {
  const n = cards.length;
  if (n <= 0) return [];
  const rows =
    n <= 4 ? smallNRows(n) : assignRows(cards);
  return distributeAir(rows);
}

function smallNRows(n: number): FeedRow[] {
  const row = (pattern: RowPatternName, first: number): FeedRow => ({
    pattern,
    slots: ROW_PATTERNS[pattern].map((name, i) => ({
      slot: SLOTS[name],
      cardIndex: first + i,
      raisePct: 0,
    })),
  });
  if (n === 1) return [row("R-WIDE", 0)];
  if (n === 2) return [row("R-LEAD", 0)];
  if (n === 3) return [row("R-LEAD", 0), row("R-WIDE", 2)];
  return [row("R-LEAD", 0), row("R-INSET", 2)];
}

function assignRows(cards: readonly ComposableCard[]): FeedRow[] {
  const n = cards.length;
  const rows: FeedRow[] = [];
  const rowHistory: RowPatternName[] = [];
  const placed: SlotName[] = [];
  const edges: number[] = [];
  const usage = new Map<SlotName, number>();
  /** Per pattern, the successors it received on its last two runs. */
  const lastSuccessors = new Map<RowPatternName, RowPatternName[]>();
  let open: { starter: SlotName; assignment: FeedSlotAssignment } | null = null;

  const legal = (slotName: SlotName, hardWindow: number): boolean => {
    for (let d = 1; d <= hardWindow; d += 1) {
      if (placed[placed.length - d] === slotName) return false;
    }
    return true;
  };

  const minUsage = () =>
    Math.min(...SLOT_ORDER.map((name) => usage.get(name) ?? 0));

  const transitionEcho = (pattern: RowPatternName): number => {
    const prev = rowHistory[rowHistory.length - 1];
    if (prev === undefined) return 0;
    const answers = lastSuccessors.get(prev) ?? [];
    if (answers[0] === pattern) return WEIGHT_TRANSITION;
    if (answers[1] === pattern) return WEIGHT_TRANSITION / 2;
    return 0;
  };

  const score = (card: ComposableCard, candidate: Omit<Candidate, "cost">): Candidate => ({
    ...candidate,
    cost:
      aspectFitCost(card, candidate.slot.aspect) +
      WEIGHT_REPEAT * repeatPenalty(candidate.slot.name, placed, SLOT_REPEAT_WINDOW) +
      WEIGHT_EDGE * edgePenalty(candidate.slot.colStart, edges) +
      rowEchoPenalty(candidate.pattern, rowHistory) +
      transitionEcho(candidate.pattern) +
      WEIGHT_BALANCE * ((usage.get(candidate.slot.name) ?? 0) - minUsage()) +
      WEIGHT_SPREAD * contentSpread(card.videoId, candidate.slot.name),
  });

  for (let i = 0; i < n; i += 1) {
    const card = cards[i];
    if (card === undefined) break;
    const prevPattern = rowHistory[rowHistory.length - 1] ?? null;

    let candidates: Candidate[];
    if (open !== null) {
      // A started two-slot row always completes — viability was checked
      // when the starter was placed (the lookahead below).
      candidates = completionsFor(open.starter, prevPattern)
        .filter(({ slot }) => legal(slot, SLOT_REPEAT_WINDOW))
        .filter(({ slot }) => isFocalSafe(card, SLOTS[slot].aspect))
        .map(({ slot, pattern }) =>
          score(card, { slot: SLOTS[slot], pattern, completes: true }),
        );
      if (candidates.length === 0) {
        // Fallback ladder: focal first (it improves crops, never gates the
        // composition), then the repeat window — a card is always placed.
        candidates = completionsFor(open.starter, prevPattern)
          .filter(({ slot }) => legal(slot, 1))
          .map(({ slot, pattern }) =>
            score(card, { slot: SLOTS[slot], pattern, completes: true }),
          );
      }
    } else {
      const remaining = n - i;
      candidates = starterCandidates(card, remaining, prevPattern, i);
      if (candidates.length === 0) {
        candidates = starterCandidates(card, remaining, prevPattern, i, {
          skipFocal: true,
        });
      }
      if (candidates.length === 0) {
        candidates = starterCandidates(card, remaining, prevPattern, i, {
          skipFocal: true,
          hardWindow: 1,
        });
      }
    }

    const chosen = pickBest(candidates, usage);
    const assignment: FeedSlotAssignment = {
      slot: chosen.slot,
      cardIndex: i,
      raisePct: 0,
    };
    placed.push(chosen.slot.name);
    edges.push(chosen.slot.colStart);
    usage.set(chosen.slot.name, (usage.get(chosen.slot.name) ?? 0) + 1);

    if (chosen.completes) {
      const slots = open === null ? [assignment] : [open.assignment, assignment];
      rows.push({ pattern: chosen.pattern, slots });
      const predecessor = rowHistory[rowHistory.length - 1];
      if (predecessor !== undefined) {
        lastSuccessors.set(predecessor, [
          chosen.pattern,
          ...(lastSuccessors.get(predecessor) ?? []).slice(0, 1),
        ]);
      }
      rowHistory.push(chosen.pattern);
      open = null;
    } else {
      open = { starter: chosen.slot.name, assignment };
    }
  }

  // Constraint 4 belt: the lookahead makes a stranded starter unreachable,
  // but a composition model may never emit an illegal row regardless.
  if (open !== null) {
    const pattern: RowPatternName =
      rowHistory[rowHistory.length - 1] === "R-WIDE" ? "R-PLATE" : "R-WIDE";
    rows.push({
      pattern,
      slots: [
        {
          slot: SLOTS[ROW_PATTERNS[pattern][0] ?? "WIDE"],
          cardIndex: open.assignment.cardIndex,
          raisePct: 0,
        },
      ],
    });
  }
  return rows;

  function starterCandidates(
    card: ComposableCard,
    remaining: number,
    prevPattern: RowPatternName | null,
    index: number,
    relax: { skipFocal?: boolean; hardWindow?: number } = {},
  ): Candidate[] {
    const hardWindow = relax.hardWindow ?? SLOT_REPEAT_WINDOW;
    const out: Candidate[] = [];
    for (const name of STARTER_ORDER) {
      const spec = SLOTS[name];
      const patterns = (STARTER_PATTERNS[name] ?? []).filter(
        (pattern) => pattern !== prevPattern,
      );
      if (patterns.length === 0) continue; // constraint 2 at the source
      if (!legal(name, hardWindow)) continue;
      if (!relax.skipFocal && !isFocalSafe(card, spec.aspect)) continue;

      const isSingle = name === "WIDE" || name === "COLUMN";
      if (isSingle && remaining === 2 && relax.hardWindow === undefined) {
        // Tail guard: a single here leaves ONE trailing card, whose only
        // legal rows are the OTHER single (constraint 2 bans a repeat of
        // this one). If that other single sits in what will then be the
        // repeat window, this placement strands the tail into an illegal
        // ending — refuse it now instead of relaxing a hard rule later.
        const other: SlotName = name === "WIDE" ? "COLUMN" : "WIDE";
        if (placed[placed.length - 1] === other) continue;
      }
      if (!isSingle) {
        // Constraint 4 lookahead: a two-slot row needs a second card AND a
        // completion that will be legal + focal-safe for that card.
        if (remaining < 2) continue;
        const next = cards[index + 1];
        const viable = completionsFor(name, prevPattern).some(
          ({ slot }) =>
            slot !== name &&
            placed[placed.length - 1] !== slot &&
            (relax.skipFocal ||
              next === undefined ||
              isFocalSafe(next, SLOTS[slot].aspect)),
        );
        if (!viable) continue;
      }

      const pattern =
        patterns.length === 1
          ? (patterns[0] as RowPatternName)
          : // INSET reaches for whichever of its rows echoes least
            [...patterns].sort(
              (a, b) => rowEchoPenalty(a, rowHistory) - rowEchoPenalty(b, rowHistory),
            )[0] ?? (patterns[0] as RowPatternName);
      out.push(
        score(card, { slot: spec, pattern, completes: isSingle }),
      );
    }
    return out;
  }
}

/** argmin cost; ties break to the least-used slot, then slot-table order —
 *  full determinism, no coin ever flipped. */
function pickBest(
  candidates: readonly Candidate[],
  usage: ReadonlyMap<SlotName, number>,
): Candidate {
  const first = candidates[0];
  if (first === undefined) {
    throw new Error(
      "composeFeed: no legal placement — the fallback ladder must prevent this",
    );
  }
  let best = first;
  for (const candidate of candidates.slice(1)) {
    const delta = candidate.cost - best.cost;
    if (delta < -1e-9) {
      best = candidate;
      continue;
    }
    if (delta > 1e-9) continue;
    const usedCandidate = usage.get(candidate.slot.name) ?? 0;
    const usedBest = usage.get(best.slot.name) ?? 0;
    if (
      usedCandidate < usedBest ||
      (usedCandidate === usedBest &&
        SLOT_ORDER.indexOf(candidate.slot.name) < SLOT_ORDER.indexOf(best.slot.name))
    ) {
      best = candidate;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Air distribution — cluster and pause (critic finding 1)             */
/* ------------------------------------------------------------------ */

/**
 * Reference geometry at the 1440 design target: `max-w-page` 1440 −
 * 2 × `--space-6` page padding = 1344 content, 12 cols, `--space-6`
 * gutters → 68px columns. Heights are width-derived (aspect), so raises
 * expressed as a % of each card's own width scale with the viewport.
 */
export const REF_GRID = {
  containerPx: 1344,
  colPx: 68,
  gutterPx: 48,
  /** `--space-16` between rows (§4.2). */
  rowGapPx: 128,
  /** `--space-10` — the within-cluster air left when a card rises. */
  clusterAirPx: 80,
  /** Raises below this keep the plain drop rhythm — no fidgeting. */
  raiseMinPx: 64,
  /** Top edges within a row stay at least this far apart (anti-grid (b)
   *  asserts > 24px; 32 keeps the 8px grid with headroom). */
  topSeparationPx: 32,
} as const;

export function slotRefWidthPx(slot: SlotSpec): number {
  return slot.span * REF_GRID.colPx + (slot.span - 1) * REF_GRID.gutterPx;
}

export function slotRefHeightPx(slot: SlotSpec): number {
  return Math.round(slotRefWidthPx(slot) / ASPECT_RATIO[slot.aspect]);
}

/**
 * The caption block under every media box (`--space-2` + name line +
 * `--space-0-5` + craft line ≈ 72px on the 8px grid). A card's rendered
 * box is media + caption, so the skyline must carry it — otherwise a
 * raised card clusters against the caption above it, not the card.
 */
export const CAPTION_ALLOWANCE_PX = 72;

/**
 * Distribute air as composition, not uniform padding. A column skyline is
 * kept per grid column; a card whose natural top sits far above the
 * content under its own columns RISES into that void, stopping
 * `clusterAirPx` short of it — cards cluster, and the leftover air pools
 * on the other side of the row as the pause. At N=4 this is what owns the
 * ~510px void the critic measured under SIDE: TALL rises to sit
 * `--space-10` below it, and the pause lands beside INSET.
 *
 * The flow model mirrors CSS grid exactly (track = max margin box, rows
 * stack track + gap), so the raises it emits are the raises the browser
 * renders; the e2e overlap guard verifies that equivalence on real boxes.
 */
function distributeAir(rows: FeedRow[]): FeedRow[] {
  const bottoms = new Array<number>(13).fill(0); // 1-based columns
  let rowTop = 0;

  return rows.map((row) => {
    const raised = row.slots.map((assignment) => {
      const { slot } = assignment;
      const natural = rowTop + slot.dropYPx;
      let skyline = 0;
      for (let c = slot.colStart; c < slot.colStart + slot.span; c += 1) {
        skyline = Math.max(skyline, bottoms[c] ?? 0);
      }
      const room = natural - (skyline + REF_GRID.clusterAirPx);
      const raisePx =
        room >= REF_GRID.raiseMinPx ? Math.floor(room / 8) * 8 : 0;
      return { ...assignment, raisePx };
    });

    // Preserve the anti-grid top offset within the row: shrink the larger
    // raise until the two top edges separate again.
    if (raised.length === 2) {
      const top = (a: { slot: SlotSpec; raisePx: number }) =>
        rowTop + a.slot.dropYPx - a.raisePx;
      const [a, b] = raised as [
        (typeof raised)[0],
        (typeof raised)[0],
      ];
      while (
        Math.abs(top(a) - top(b)) < REF_GRID.topSeparationPx &&
        Math.max(a.raisePx, b.raisePx) > 0
      ) {
        if (a.raisePx >= b.raisePx) a.raisePx = Math.max(0, a.raisePx - 8);
        else b.raisePx = Math.max(0, b.raisePx - 8);
      }
    }

    let track = 0;
    const slots = raised.map(({ raisePx, ...assignment }) => {
      const { slot } = assignment;
      const height = slotRefHeightPx(slot) + CAPTION_ALLOWANCE_PX;
      const marginBox = slot.dropYPx - raisePx + height;
      track = Math.max(track, marginBox);
      const bottom = rowTop + marginBox;
      for (let c = slot.colStart; c < slot.colStart + slot.span; c += 1) {
        bottoms[c] = Math.max(bottoms[c] ?? 0, bottom);
      }
      return {
        ...assignment,
        raisePct:
          Math.round((raisePx / slotRefWidthPx(slot)) * 100 * 100) / 100,
      };
    });
    rowTop += Math.max(0, track) + REF_GRID.rowGapPx;
    return { pattern: row.pattern, slots };
  });
}

/* ------------------------------------------------------------------ */
/* Mobile composer (§1.6) — the left edge is the identity              */
/* ------------------------------------------------------------------ */

export type MobileSlotName = "M-BLEED" | "M-FULL" | "M-OFF-L" | "M-OFF-R";

export interface MobileSlotSpec {
  name: MobileSlotName;
  /** Inset from the viewport edge, px (the page carries no margin of its
   *  own below md — slots own their edges). */
  leftInsetPx: number;
  rightInsetPx: number;
  aspect: FeedCardAspect;
}

/**
 * Four mobile slots (§1.6): widths asymmetric, insets differing left and
 * right, one slot bleeding past both margins. Variety comes from EDGE and
 * HEIGHT, not width equality — at one column, width equality is what the
 * eye reads as a grid, and two columns would shrink the face.
 */
export const MOBILE_SLOTS: Record<MobileSlotName, MobileSlotSpec> = {
  "M-BLEED": { name: "M-BLEED", leftInsetPx: 0, rightInsetPx: 0, aspect: "16:9" },
  "M-FULL": { name: "M-FULL", leftInsetPx: 32, rightInsetPx: 32, aspect: "4:5" },
  "M-OFF-L": { name: "M-OFF-L", leftInsetPx: 32, rightInsetPx: 128, aspect: "1:1" },
  "M-OFF-R": { name: "M-OFF-R", leftInsetPx: 128, rightInsetPx: 32, aspect: "3:2" },
};

const MOBILE_SLOT_ORDER: readonly MobileSlotName[] = [
  "M-FULL",
  "M-OFF-L",
  "M-OFF-R",
  "M-BLEED",
];

/** The 375px reference — assertion (d) is checked at this width. */
export const MOBILE_REF_VIEWPORT_PX = 375;

export function mobileSlotRefWidthPx(slot: MobileSlotSpec): number {
  return MOBILE_REF_VIEWPORT_PX - slot.leftInsetPx - slot.rightInsetPx;
}

export interface MobileAssignment {
  slot: MobileSlotSpec;
  cardIndex: number;
}

/**
 * Same content-aware rule as the desktop table (§1.6: one mechanism, two
 * slot tables) under the mobile hard constraints:
 *   1. no slot repeats consecutively;
 *   2. M-BLEED never twice within five cards (which subsumes "at most
 *      once per four");
 *   3. the leading edge never repeats more than twice consecutively;
 *   4. no two adjacent cards share a rendered width within 8px at 375
 *      (assertion (d) as a constraint — M-OFF-L and M-OFF-R are
 *      equal-width mirrors and therefore never adjacent).
 */
export function composeMobileFeed(
  cards: readonly ComposableCard[],
): MobileAssignment[] {
  const out: MobileAssignment[] = [];
  const placed: MobileSlotName[] = [];
  const edges: number[] = [];
  const usage = new Map<MobileSlotName, number>();
  let lastBleed = -Infinity;

  // The four hard rules, stateless so the strand lookahead can ask "would
  // any slot be legal NEXT if I placed `name` now?" without duplication.
  const isLegal = (
    name: MobileSlotName,
    state: {
      last: MobileSlotName | undefined;
      edge1: number | undefined;
      edge2: number | undefined;
      sinceBleed: number;
    },
    relax: { skipEdgeRun?: boolean } = {},
  ): boolean => {
    const spec = MOBILE_SLOTS[name];
    if (state.last === name) return false;
    if (name === "M-BLEED" && state.sinceBleed < 5) return false;
    if (state.last !== undefined) {
      const lastWidth = mobileSlotRefWidthPx(MOBILE_SLOTS[state.last]);
      if (Math.abs(mobileSlotRefWidthPx(spec) - lastWidth) <= 8) return false;
    }
    if (
      !relax.skipEdgeRun &&
      state.edge1 === spec.leftInsetPx &&
      state.edge2 === spec.leftInsetPx
    ) {
      return false;
    }
    return true;
  };

  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    if (card === undefined) break;
    const state = {
      last: placed[placed.length - 1],
      edge1: edges[edges.length - 1],
      edge2: edges[edges.length - 2],
      sinceBleed: i - lastBleed,
    };

    /** Would placing `name` now leave the NEXT card with zero legal slots?
     *  (That is how a hard rule ends up "relaxed" — refuse the trap.) */
    const strands = (name: MobileSlotName): boolean => {
      if (i + 1 >= cards.length) return false;
      const nextState = {
        last: name,
        edge1: MOBILE_SLOTS[name].leftInsetPx,
        edge2: state.edge1,
        sinceBleed: name === "M-BLEED" ? 1 : state.sinceBleed + 1,
      };
      return !MOBILE_SLOT_ORDER.some((next) => isLegal(next, nextState));
    };

    const eligible = (relax: {
      skipFocal?: boolean;
      skipStrand?: boolean;
      skipEdgeRun?: boolean;
    }) =>
      MOBILE_SLOT_ORDER.filter((name) => {
        if (!isLegal(name, state, relax)) return false;
        if (!relax.skipFocal && !isFocalSafe(card, MOBILE_SLOTS[name].aspect)) {
          return false;
        }
        if (!relax.skipStrand && strands(name)) return false;
        return true;
      });

    let names = eligible({});
    if (names.length === 0) names = eligible({ skipFocal: true });
    if (names.length === 0) names = eligible({ skipFocal: true, skipStrand: true });
    if (names.length === 0) {
      names = eligible({ skipFocal: true, skipStrand: true, skipEdgeRun: true });
    }
    const first = names[0];
    if (first === undefined) {
      throw new Error(
        "composeMobileFeed: no legal placement — the relax ladder must prevent this",
      );
    }

    const minUsage = Math.min(
      ...MOBILE_SLOT_ORDER.map((name) => usage.get(name) ?? 0),
    );
    let best: MobileSlotName = first;
    let bestCost = Number.POSITIVE_INFINITY;
    for (const name of names) {
      const spec = MOBILE_SLOTS[name];
      const cost =
        aspectFitCost(card, spec.aspect) +
        WEIGHT_REPEAT * repeatPenalty(name, placed, 1) +
        WEIGHT_EDGE * edgePenalty(spec.leftInsetPx, edges) +
        WEIGHT_BALANCE * ((usage.get(name) ?? 0) - minUsage) +
        WEIGHT_SPREAD * contentSpread(card.videoId, name);
      const better =
        cost < bestCost - 1e-9 ||
        (Math.abs(cost - bestCost) <= 1e-9 &&
          (usage.get(name) ?? 0) < (usage.get(best) ?? 0));
      if (better) {
        best = name;
        bestCost = cost;
      }
    }

    out.push({ slot: MOBILE_SLOTS[best], cardIndex: i });
    placed.push(best);
    edges.push(MOBILE_SLOTS[best].leftInsetPx);
    usage.set(best, (usage.get(best) ?? 0) + 1);
    if (best === "M-BLEED") lastBleed = i;
  }
  return out;
}
