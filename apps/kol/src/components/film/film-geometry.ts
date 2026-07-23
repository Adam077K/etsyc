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
 * Single source of truth for the TOP-LEFT dock anchor. The docked film settles
 * inset `DOCK_MARGIN` from the left and `dockTop(DOCK_MARGIN)` from the top
 * (which clears the masthead), scaled about the top-left origin. Every dock
 * expression here — `applyDockFrame` (scroll-linked) and `dockTarget` (one-shot)
 * — reads these so the corner is never re-declared inline by a caller.
 */
export const DOCK_MARGIN = 24;
/** Corner radius (px, pre-scale) of the settled world / thank-you / interlude
    dock. The small product/checkout dock keeps its own tighter radius. */
export const DOCK_RADIUS = 64;

/**
 * The dock lives TOP-LEFT (Founder directive). Its top inset must clear the KOL
 * masthead, so we read the `--header-h` CSS var (never hardcoded) and add the
 * card margin. SSR-safe fallback matches the token default (72px).
 */
export function dockTop(margin = DOCK_MARGIN): number {
  if (typeof document === "undefined") return 72 + margin;
  const h =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--header-h"),
      10,
    ) || 72;
  return h + margin;
}

/**
 * The corner dock is a landscape card. Because the persistent film is scaled
 * UNIFORMLY (never distorted), the docked box always inherits the viewport
 * aspect — fine on a landscape desktop (~16/10), but on a portrait phone it
 * balloons into a tall column that buries the page beneath it. So we cap the
 * dock's *displayed* aspect at this landscape floor and crop the surplus height
 * off the top with a clip (transform/clip only, no distortion). Set to 16/10 so
 * a landscape desktop viewport (≥ this ratio) is left pixel-identical.
 */
const DOCK_MIN_ASPECT = 16 / 10;

/** Displayed aspect (w/h) of the docked card at a given viewport. */
export function dockAspect(vw: number, vh: number): number {
  return vh > 0 ? Math.max(vw / vh, DOCK_MIN_ASPECT) : DOCK_MIN_ASPECT;
}

/** Top-edge clip fraction (0–1) that crops the uniformly-scaled dock down to
    `DOCK_MIN_ASPECT`. Zero on any viewport already at/above that landscape
    floor (e.g. desktop), so those docks are untouched. */
export function dockClip(vw: number, vh: number): number {
  if (vh <= 0) return 0;
  return Math.max(0, 1 - vw / vh / DOCK_MIN_ASPECT);
}

/**
 * Scroll-linked hero→dock settle, shared by the maker world and the thank-you
 * payoff. Given hero scroll progress `v` (0→1) and the docked scale, it drives
 * the persistent film's transform to the TOP-LEFT dock: it LANDS docked by 72%
 * of the hero scroll, insets `DOCK_MARGIN` from the left and `topInset` from the
 * top (which clears the masthead — pass `dockTop()`), and ramps the shadow
 * linearly over [0.5, 0.9]. Transform/opacity only, origin top-left (from
 * HERO_TARGET). `clipAmt` (from `dockClip`) ramps in with the dock so a portrait
 * phone lands on a landscape card instead of a full-height column that buries the
 * page; the FilmStage fades its chip out as it docks (clip>0). Stays 0 over the
 * hero (p→0).
 */
export function applyDockFrame(
  m: FilmMotion,
  v: number,
  docked: number,
  clipAmt = 0,
  topInset = DOCK_MARGIN,
): void {
  const p = DOCK_EASE(Math.min(v / 0.72, 1));
  m.scale.set(1 + (docked - 1) * p);
  m.x.set(DOCK_MARGIN * p);
  m.y.set(topInset * p);
  m.radius.set(DOCK_RADIUS * DOCK_EASE(Math.min(v / 0.55, 1)));
  m.shadow.set(v <= 0.5 ? 0 : Math.min((v - 0.5) / 0.4, 1));
  m.clip.set(clipAmt * p);
}

/**
 * The settled corner dock as a full transform target — for callers that drive
 * the film to the dock in ONE shot (the twodots interlude re-dock, and the
 * reduced-motion snap) rather than scroll-linked via `applyDockFrame`. `docked`
 * is the uniform scale; `clipAmt` (from `dockClip`) crops a portrait phone to a
 * landscape card. Position is the shared TOP-LEFT anchor — this is the single
 * source those callers import instead of re-declaring the corner inline.
 */
export function dockTarget(
  docked: number,
  clipAmt = 0,
  margin = DOCK_MARGIN,
): FilmTarget {
  return {
    scale: docked,
    x: margin,
    y: dockTop(margin),
    radius: DOCK_RADIUS,
    opacity: 1,
    originX: 0,
    originY: 0,
    shadow: 1,
    clip: clipAmt,
  };
}

/** Full-bleed hero: the film fills the viewport (world / thank-you payoff).
    Origin top-left so the hero→dock scale settles toward the TOP-LEFT dock. */
export const HERO_TARGET: FilmTarget = {
  scale: 1,
  x: 0,
  y: 0,
  radius: 0,
  opacity: 1,
  originX: 0,
  originY: 0,
  shadow: 0,
  clip: 0,
};

/**
 * The docked corner card used on product + checkout. Anchored TOP-LEFT
 * (origin 0/0), so a uniform scale shrinks the full-viewport box toward that
 * corner; the translate insets it `margin` from the left and `top` from the top
 * (pass `dockTop(margin)` to clear the masthead — defaults to `margin`). Radius
 * is pre-divided by the scale so it reads as ~`radius` px after the box shrinks.
 */
export function cornerTarget(
  vw: number,
  vh: number,
  {
    width = 176,
    margin = DOCK_MARGIN,
    radius = 18,
    opacity = 1,
    top,
  }: {
    width?: number;
    margin?: number;
    radius?: number;
    opacity?: number;
    top?: number;
  } = {},
): FilmTarget {
  const scale = vw > 0 ? width / vw : 0.14;
  return {
    scale,
    x: margin,
    y: top ?? margin,
    radius: scale > 0 ? radius / scale : radius,
    opacity,
    originX: 0,
    originY: 0,
    shadow: 1,
    clip: dockClip(vw, vh),
  };
}
