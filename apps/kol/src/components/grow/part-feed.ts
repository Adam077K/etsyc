/**
 * Feed parting — the "what moves" half of the §5.2 grow edge that is not
 * the film: "Non-focus cards translate on Y only to part around it,
 * staggered 70 ms outward from the tapped card. Feed cards do not
 * re-layout (transform only)."
 *
 * The feed surface is B1b's; the seam is one attribute — any element
 * marked `data-feed-card` participates. Cards overlapping the grown
 * column's band slide up or down (whichever side of the column centre
 * they sit on) just far enough to clear it, on `--dur-grow` /
 * `--ease-kol`, staggered outward from the tapped card. `release()` runs
 * the exact reverse at `--dur-ungrow` (§2.5 "Out: exact reverse").
 *
 * Reduced motion: the caller skips parting entirely (§5.3 — transforms
 * are removed, the change is opacity only, and the film snaps).
 */

export const FEED_CARD_ATTRIBUTE = "data-feed-card";
export const PART_STAGGER_MS = 70;

export interface PartHandle {
  release(): void;
}

interface Band {
  top: number;
  bottom: number;
  left: number;
  right: number;
  centerY: number;
}

function centerOf(rect: DOMRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

export function partFeedCards(opts: {
  /** Viewport-space rect of the grown column's film window. */
  columnRect: { left: number; top: number; width: number; height: number };
  /** The tapped card — the origin of the stagger; it never moves itself. */
  sourceElement: HTMLElement | null;
  /** Breathing room around the column band (defaults to one 8px step ×3). */
  gutterPx?: number;
}): PartHandle {
  const gutter = opts.gutterPx ?? 24;
  const band: Band = {
    top: opts.columnRect.top - gutter,
    bottom: opts.columnRect.top + opts.columnRect.height + gutter,
    left: opts.columnRect.left - gutter,
    right: opts.columnRect.left + opts.columnRect.width + gutter,
    centerY: opts.columnRect.top + opts.columnRect.height / 2,
  };

  const origin = opts.sourceElement
    ? centerOf(opts.sourceElement.getBoundingClientRect())
    : { x: (band.left + band.right) / 2, y: band.centerY };

  const moved: HTMLElement[] = [];
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(`[${FEED_CARD_ATTRIBUTE}]`),
  )
    .filter((el) => el !== opts.sourceElement && !opts.sourceElement?.contains(el))
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return { el, rect, distance: Math.hypot(centerOf(rect).x - origin.x, centerOf(rect).y - origin.y) };
    })
    // stagger runs OUTWARD from the tapped card
    .sort((a, b) => a.distance - b.distance);

  let staggerIndex = 0;
  for (const { el, rect } of candidates) {
    const overlapsX = rect.right > band.left && rect.left < band.right;
    const overlapsY = rect.bottom > band.top && rect.top < band.bottom;
    if (!overlapsX || !overlapsY) continue;
    const goesUp = centerOf(rect).y < band.centerY;
    const deltaY = goesUp ? band.top - rect.bottom : band.bottom - rect.top;
    el.style.transition = "transform var(--dur-grow) var(--ease-kol)";
    el.style.transitionDelay = `${staggerIndex * PART_STAGGER_MS}ms`;
    el.style.transform = `translateY(${Math.round(deltaY)}px)`;
    moved.push(el);
    staggerIndex += 1;
  }

  let cleanupTimer = 0;
  return {
    release() {
      window.clearTimeout(cleanupTimer);
      moved.forEach((el, index) => {
        el.style.transition = "transform var(--dur-ungrow) var(--ease-kol)";
        el.style.transitionDelay = `${(moved.length - 1 - index) * PART_STAGGER_MS}ms`;
        el.style.transform = "";
      });
      // let the return transition land, then hand the styles back untouched
      cleanupTimer = window.setTimeout(
        () => {
          for (const el of moved) {
            el.style.removeProperty("transition");
            el.style.removeProperty("transition-delay");
            el.style.removeProperty("transform");
          }
        },
        405 + moved.length * PART_STAGGER_MS + 120,
      );
    },
  };
}
