/**
 * The Wave-3 buyer-state edge table (design-direction §5.2 — BINDING
 * choreography). Exactly five rect edges plus the in-frame clip swap;
 * WORLD_OPEN ↔ WORLD_BROWSE is deliberately absent — it is a scroll, not
 * an event, and the Film Layer must not animate it.
 *
 * Durations resolve from the §5.1 tokens in globals.css at runtime so
 * design owns the numbers; the fallbacks here mirror the tokens exactly
 * for environments without computed CSS (jsdom, SSR). The film-layer test
 * suite pins the two in lockstep.
 */

export const FILM_EDGES = ["grow", "ungrow", "unfold", "dock", "undock"] as const;
export type FilmEdge = (typeof FILM_EDGES)[number];

export interface EdgeSpec {
  /** CSS custom property that owns this edge's duration (§5.1). */
  durationToken: string;
  /** Token value in ms — the jsdom/SSR fallback, kept equal to the CSS. */
  fallbackMs: number;
  /** Hard cap — nothing on this edge may move after this (unfold: 900ms). */
  capMs?: number;
  /** Reverse edge: duration is multiplied by --return-ratio (§5.1). */
  returnRatio?: boolean;
  /** Timing function, var()-based — inline styles resolve custom props. */
  easing: string;
  /** Literal curve for style engines that reject var() in timing functions. */
  easingFallback: string;
  /** FLIP release rides a linear() spring generated from --spring-video. */
  spring?: boolean;
}

const EASE_KOL = "cubic-bezier(0.32, 0.72, 0, 1)";
const EASE_CINEMATIC = "cubic-bezier(0.62, 0.02, 0.1, 1)";

export const EDGE_TABLE: Record<FilmEdge, EdgeSpec> = {
  /** FEED → GROWN — card rect FLIPs to the centre-column rect. */
  grow: {
    durationToken: "--dur-grow",
    fallbackMs: 520,
    easing: "var(--ease-kol)",
    easingFallback: EASE_KOL,
  },
  /** GROWN → FEED — reverse of grow, pre-ratioed in its own token. */
  ungrow: {
    durationToken: "--dur-ungrow",
    fallbackMs: 405,
    easing: "var(--ease-kol)",
    easingFallback: EASE_KOL,
  },
  /** GROWN → WORLD_OPEN — the world materialises around the film. */
  unfold: {
    durationToken: "--dur-unfold",
    fallbackMs: 900,
    capMs: 900,
    easing: "var(--ease-cinematic)",
    easingFallback: EASE_CINEMATIC,
  },
  /** WORLD_BROWSE → NARRATE_SHRINK — the film springs to the corner rect. */
  dock: {
    durationToken: "--dur-dock",
    fallbackMs: 440,
    easing: "var(--ease-cinematic)",
    easingFallback: EASE_CINEMATIC,
    spring: true,
  },
  /** NARRATE_SHRINK → WORLD_BROWSE — dock reversed at --return-ratio. */
  undock: {
    durationToken: "--dur-dock",
    fallbackMs: 440,
    returnRatio: true,
    easing: "var(--ease-cinematic)",
    easingFallback: EASE_CINEMATIC,
    spring: true,
  },
};

export const SWAP_FALLBACK_MS = 120;
export const RETURN_RATIO_FALLBACK = 0.78;

/**
 * Parse a CSS <time> ("520ms" / "0.52s") to ms; null when unparseable.
 * Exported for the layer's computed-duration reads (buffer fade under
 * reduced motion runs at --dur-state, not --dur-swap — the pause delay
 * must derive from the element, not the token).
 */
export function parseCssTime(raw: string): number | null {
  const value = raw.trim();
  if (value.endsWith("ms")) {
    const ms = Number.parseFloat(value);
    return Number.isFinite(ms) ? ms : null;
  }
  if (value.endsWith("s")) {
    const s = Number.parseFloat(value);
    return Number.isFinite(s) ? s * 1000 : null;
  }
  return null;
}

/** Read a token off :root; fall back when CSS isn't computed (jsdom/SSR). */
function readTokenMs(token: string, fallbackMs: number): number {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return fallbackMs;
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token);
  return parseCssTime(raw) ?? fallbackMs;
}

/** The §5.1 return ratio — every reverse edge runs at this × its forward edge. */
export function readReturnRatio(): number {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return RETURN_RATIO_FALLBACK;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--return-ratio")
    .trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : RETURN_RATIO_FALLBACK;
}

/**
 * Resolve an edge's duration in ms. `reverse` applies the §5.1 return-ratio
 * rule for the one preview back-walk (WORLD_OPEN → GROWN) that reverses an
 * edge without a pre-ratioed token of its own — a derived rule, not a new
 * edge. Edges whose spec already carries `returnRatio` (undock) ignore it.
 */
export function resolveEdgeMs(edge: FilmEdge, options?: { reverse?: boolean }): number {
  const spec = EDGE_TABLE[edge];
  let ms = readTokenMs(spec.durationToken, spec.fallbackMs);
  if (spec.capMs !== undefined) ms = Math.min(ms, spec.capMs);
  if (spec.returnRatio || options?.reverse === true) ms *= readReturnRatio();
  return ms;
}

/** The in-frame clip cross-fade duration (--dur-swap). */
export function resolveSwapMs(): number {
  return readTokenMs("--dur-swap", SWAP_FALLBACK_MS);
}
