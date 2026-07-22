/**
 * G1-F2 — aspect-ratio counter-transform for the frame FLIP.
 *
 * The Film Layer's FLIP moves the frame between slot rects with
 * `translate(dx, dy) scale(sx, sy)`. When the two rects share an aspect
 * ratio the scale is uniform and the cover-fit media inside is merely
 * resized. When they do NOT — the flagship case is `grow`, feed card 4:5
 * → centre column 16:9 — the non-uniform frame scale stretches the media
 * with it and the maker's face smears for the entire edge.
 *
 * Fix (the standard FLIP counter-transform, sampled per frame): while the
 * frame transitions, read its computed scale (ox, oy) each animation frame
 * and set the inverse on the media so the media's VISIBLE scale is always
 * uniform at u = max(ox, oy) — exactly `object-fit: cover` semantics for
 * the frame's momentary visible box. A translate aligns the cover overhang
 * to each medium's own object-position fractions, so at the start of a
 * grow the crop matches what the card showed (focal-point crop, CPO
 * Ruling 3) and at the end the transform is the identity. Sampling the
 * computed matrix — rather than re-running the easing in JS — keeps the
 * inverse exact under ANY timing function, including the --spring-video
 * linear() curve, and under interruption.
 *
 * Transform-origin: the frame FLIPs about `0 0` (globals.css
 * .kol-film-layer), and the media fill the frame (`inset: 0`), so the
 * inverse also applies about `0 0` — the same fixed point, exact
 * cancellation of the scale component.
 */

/**
 * Media inside the frame that must never distort: A/B buffers + poster.
 * Exported so the test rig derives its fixture classnames from THIS string
 * — a re-typed copy let a renamed classname no-op the counter (zero
 * matches → noop) while the rig stayed green.
 */
export const FRAME_MEDIA_SELECTOR = ".kol-film-buffer, .kol-film-poster";

/** Below this x/y scale-ratio delta the frame scale is effectively uniform. */
export const ASPECT_EPSILON = 0.01;

/**
 * Read the x/y scale off a computed `transform` value. The FLIP writes
 * translate+scale only (no rotate/skew), so matrix `a`/`d` ARE the scales.
 * `none`/empty is the identity; anything unparseable returns null and the
 * sampler skips that frame (jsdom, exotic engines).
 */
export function parseMatrixScale(transform: string): { x: number; y: number } | null {
  const value = transform.trim();
  if (value === "" || value === "none") return { x: 1, y: 1 };
  const matrix = /^matrix\(([^)]+)\)$/.exec(value);
  if (matrix?.[1] !== undefined) {
    const parts = matrix[1].split(",").map((part) => Number.parseFloat(part));
    if (parts.length === 6 && parts.every(Number.isFinite)) {
      return { x: parts[0]!, y: parts[3]! };
    }
    return null;
  }
  const matrix3d = /^matrix3d\(([^)]+)\)$/.exec(value);
  if (matrix3d?.[1] !== undefined) {
    const parts = matrix3d[1].split(",").map((part) => Number.parseFloat(part));
    if (parts.length === 16 && parts.every(Number.isFinite)) {
      return { x: parts[0]!, y: parts[5]! };
    }
    return null;
  }
  return null;
}

export interface CounterTransform {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
}

/**
 * The inverse to apply (about origin `0 0`) to a cover-fit medium filling
 * a `width`×`height` frame whose FLIP scale is (`scaleX`, `scaleY`):
 * visible media scale becomes uniform u = max(sx, sy) — cover, never
 * stretch — and the overhang is distributed by the medium's
 * object-position fractions (`focalX`, `focalY` in 0..1).
 */
export function counterFor(opts: {
  scaleX: number;
  scaleY: number;
  width: number;
  height: number;
  focalX: number;
  focalY: number;
}): CounterTransform {
  const { scaleX: ox, scaleY: oy, width, height, focalX, focalY } = opts;
  const u = Math.max(ox, oy);
  return {
    scaleX: u / ox,
    scaleY: u / oy,
    translateX: (width * (ox - u) * focalX) / ox,
    translateY: (height * (oy - u) * focalY) / oy,
  };
}

/** "30% 60%" → { x: 0.3, y: 0.6 }; non-percentage components centre. */
function objectPositionFractions(raw: string): { x: number; y: number } {
  const parts = raw.trim().split(/\s+/);
  const fraction = (part: string | undefined): number => {
    if (part === undefined || !part.endsWith("%")) return 0.5;
    const parsed = Number.parseFloat(part);
    return Number.isFinite(parsed) ? parsed / 100 : 0.5;
  };
  return { x: fraction(parts[0]), y: fraction(parts[1]) };
}

/**
 * Start the per-frame counter loop for a frame whose FLIP release is in
 * flight. Returns a stop function that cancels the loop and clears every
 * media transform — the Film Layer calls it from the flight's dispose, so
 * finish, supersede and unmount all clean up through one path. The loop
 * self-neutralises near uniform scale (end of the transition), and a
 * sample it cannot parse is skipped rather than guessed at.
 */
export function startAspectCounter(
  frame: HTMLElement,
  selector: string = FRAME_MEDIA_SELECTOR,
): () => void {
  if (typeof requestAnimationFrame !== "function" || typeof getComputedStyle !== "function") {
    return () => {};
  }
  const media = Array.from(frame.querySelectorAll<HTMLElement>(selector));
  if (media.length === 0) return () => {};

  // layout box is snapped before the FLIP release — constant for the flight
  const width = frame.offsetWidth;
  const height = frame.offsetHeight;
  if (width <= 0 || height <= 0) return () => {};

  const focals = media.map((el) => objectPositionFractions(getComputedStyle(el).objectPosition ?? ""));
  let applied = false;
  let raf = 0;

  const clear = () => {
    if (!applied) return;
    applied = false;
    for (const el of media) {
      el.style.removeProperty("transform");
      el.style.removeProperty("transform-origin");
    }
  };

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const scale = parseMatrixScale(getComputedStyle(frame).transform ?? "");
    if (!scale || scale.x <= 0 || scale.y <= 0) return;
    if (Math.abs(scale.x / scale.y - 1) < ASPECT_EPSILON / 2) {
      clear();
      return;
    }
    applied = true;
    media.forEach((el, index) => {
      const focal = focals[index] ?? { x: 0.5, y: 0.5 };
      const counter = counterFor({
        scaleX: scale.x,
        scaleY: scale.y,
        width,
        height,
        focalX: focal.x,
        focalY: focal.y,
      });
      el.style.transformOrigin = "0 0";
      el.style.transform =
        `translate(${counter.translateX}px, ${counter.translateY}px) ` +
        `scale(${counter.scaleX}, ${counter.scaleY})`;
    });
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    clear();
  };
}
