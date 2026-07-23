import type { FilmTarget } from "./film-context";

/**
 * Transform-space targets for the persistent film. The stage's base box is the
 * full viewport (fixed inset-0); every presentation is expressed as a uniform
 * scale + translate + radius of that box — transform/opacity only, never layout
 * properties, and uniform scale so the film never distorts.
 */

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
