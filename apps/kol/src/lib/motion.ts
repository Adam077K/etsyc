import type { Variants, Transition } from "framer-motion";

/**
 * One orchestrated motion language for "The Maker's Issue" — cinematic and
 * physical, entering from an already-legible default (content never hidden by
 * default; motion only refines). Transform + opacity + filter only, never
 * layout properties. Every consumer gates transforms behind
 * `useReducedMotion()` so the reduced-motion path settles instantly.
 */

// Exponential ease-out — the studio's signature curve (craft-floor: ease-out
// from an already-visible default, not spring-bounce).
export const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

/** Staggered container: children ink in one after another as a spread lands. */
export const stagger = (delayChildren = 0, staggerChildren = 0.08): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren, staggerChildren },
  },
});

/** A line/element rising into place — the page's core entrance. */
export const rise = (y = 28, duration = 0.9): Variants => ({
  hidden: { opacity: 0, y },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration, ease: easeOut },
  },
});

/** A masked wipe used for the marigold hover underline and kicker reveals. */
export const wipe: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.6, ease: easeOut } },
};

/** Reduced-motion drop-in: no transform, instant opacity. */
export const calm: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
};

/** Shared viewport config: animate once, a little before fully in view. */
export const inView = { once: true, margin: "0px 0px -12% 0px" } as const;
