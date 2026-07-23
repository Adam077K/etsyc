import { cubicBezier } from "framer-motion";
import type { FilmMotion, FilmTarget } from "./film-context";

/**
 * Transform-space targets for the persistent film. The stage's base box is the
 * full viewport (fixed inset-0); every presentation is expressed as a uniform
 * scale + translate + radius of that box — transform/opacity only, never layout
 * properties, and uniform scale so the film never distorts.
 */

const DOCK_EASE = cubicBezier(0.16, 1, 0.3, 1);

/**
 * Scroll-linked hero→dock settle, shared by the maker world and the thank-you
 * payoff. Given hero scroll progress `v` (0→1) and the docked scale, it drives
 * the persistent film's transform: it LANDS docked by 72% of the hero scroll,
 * insets 24px (matching cornerTarget's margin, so there's no seam into the
 * product PiP), and ramps the shadow linearly over [0.5, 0.9] — byte-parity
 * with the pre-continuous DockedFilm. Transform/opacity only.
 */
export function applyDockFrame(m: FilmMotion, v: number, docked: number): void {
  const p = DOCK_EASE(Math.min(v / 0.72, 1));
  m.scale.set(1 + (docked - 1) * p);
  m.x.set(-24 * p);
  m.y.set(-24 * p);
  m.radius.set(64 * DOCK_EASE(Math.min(v / 0.55, 1)));
  m.shadow.set(v <= 0.5 ? 0 : Math.min((v - 0.5) / 0.4, 1));
}

/** Full-bleed hero: the film fills the viewport (world / thank-you payoff). */
export const HERO_TARGET: FilmTarget = {
  scale: 1,
  x: 0,
  y: 0,
  radius: 0,
  opacity: 1,
  originX: 100,
  originY: 100,
  shadow: 0,
};

/**
 * The docked corner card used on product + checkout. Anchored bottom-right
 * (origin 100/100), so a uniform scale shrinks the full-viewport box toward the
 * corner; a small translate insets it. Radius is pre-divided by the scale so it
 * reads as ~`radius` px after the box shrinks.
 */
export function cornerTarget(
  vw: number,
  vh: number,
  {
    width = 176,
    margin = 24,
    radius = 18,
    opacity = 1,
  }: { width?: number; margin?: number; radius?: number; opacity?: number } = {},
): FilmTarget {
  const scale = vw > 0 ? width / vw : 0.14;
  return {
    scale,
    x: -margin,
    y: -margin,
    radius: scale > 0 ? radius / scale : radius,
    opacity,
    originX: 100,
    originY: 100,
    shadow: 1,
  };
}
