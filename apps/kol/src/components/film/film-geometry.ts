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
 * Which corner the film docks to. Per the Founder directive the STORE (maker
 * world + product) docks TOP-LEFT; checkout + thank-you keep the pre-directive
 * BOTTOM-RIGHT dock (they were never in the directive, and moving them re-broke
 * a shipped checkout fix). A route names its corner; the helpers resolve it.
 */
export type DockCorner = "top-left" | "bottom-right";

/**
 * Resolve a dock corner to its transform anchor: the origin the film scales
 * about, plus the inset translate that pins the shrunk card `margin` in from the
 * two live edges. TOP-LEFT additionally clears the masthead (via `dockTop`);
 * BOTTOM-RIGHT sits `margin` in from the bottom/right edges. Single source —
 * every dock helper resolves position through here, so a caller only ever names
 * a corner, never re-derives coordinates inline.
 */
export function dockAnchor(
  corner: DockCorner,
  margin = DOCK_MARGIN,
): { originX: number; originY: number; x: number; y: number } {
  if (corner === "bottom-right") {
    return { originX: 100, originY: 100, x: -margin, y: -margin };
  }
  return { originX: 0, originY: 0, x: margin, y: dockTop(margin) };
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
 * payoff. Given hero scroll progress `v` (0→1), the docked scale, and the dock
 * `corner`, it drives the persistent film's transform to that corner: it LANDS
 * docked by 72% of the hero scroll, insets to the corner anchor, and ramps the
 * shadow linearly over [0.5, 0.9]. Transform/opacity only; it sets the origin to
 * match the corner so the scale settles toward it. `clipAmt` (from `dockClip`)
 * ramps in with the dock so a portrait phone lands on a landscape card instead of
 * a full-height column; the FilmStage fades its chip out as it docks (clip>0).
 * Stays 0 over the hero (p→0).
 */
export function applyDockFrame(
  m: FilmMotion,
  v: number,
  docked: number,
  clipAmt = 0,
  corner: DockCorner = "top-left",
): void {
  const a = dockAnchor(corner);
  const p = DOCK_EASE(Math.min(v / 0.72, 1));
  m.originX.set(a.originX);
  m.originY.set(a.originY);
  m.scale.set(1 + (docked - 1) * p);
  m.x.set(a.x * p);
  m.y.set(a.y * p);
  m.radius.set(DOCK_RADIUS * DOCK_EASE(Math.min(v / 0.55, 1)));
  m.shadow.set(v <= 0.5 ? 0 : Math.min((v - 0.5) / 0.4, 1));
  m.clip.set(clipAmt * p);
}

/**
 * The settled corner dock as a full transform target — for callers that drive
 * the film to the dock in ONE shot (the twodots interlude re-dock, and the
 * reduced-motion snap) rather than scroll-linked via `applyDockFrame`. `docked`
 * is the uniform scale; `clipAmt` (from `dockClip`) crops a portrait phone to a
 * landscape card; `corner` picks the anchor. Single source — callers import this
 * instead of re-declaring the corner inline.
 */
export function dockTarget(
  docked: number,
  clipAmt = 0,
  corner: DockCorner = "top-left",
): FilmTarget {
  const a = dockAnchor(corner);
  return {
    scale: docked,
    x: a.x,
    y: a.y,
    radius: DOCK_RADIUS,
    opacity: 1,
    originX: a.originX,
    originY: a.originY,
    shadow: 1,
    clip: clipAmt,
  };
}

/** Full-bleed hero: the film fills the viewport (world / thank-you payoff).
    Corner-agnostic — at scale 1 the origin is irrelevant, and each route snaps
    its own dock origin, so the hero carries none (letting the film grow from
    whichever corner it arrived at). */
export const HERO_TARGET: FilmTarget = {
  scale: 1,
  x: 0,
  y: 0,
  radius: 0,
  opacity: 1,
  shadow: 0,
  clip: 0,
};

/**
 * The small docked corner card used on product (top-left) + checkout
 * (bottom-right). A uniform scale shrinks the full-viewport box toward the
 * corner anchor (origin + inset from `dockAnchor`). Radius is pre-divided by the
 * scale so it reads as ~`radius` px after the box shrinks.
 */
export function cornerTarget(
  vw: number,
  vh: number,
  {
    width = 176,
    margin = DOCK_MARGIN,
    radius = 18,
    opacity = 1,
    corner = "top-left",
  }: {
    width?: number;
    margin?: number;
    radius?: number;
    opacity?: number;
    corner?: DockCorner;
  } = {},
): FilmTarget {
  const scale = vw > 0 ? width / vw : 0.14;
  const a = dockAnchor(corner, margin);
  return {
    scale,
    x: a.x,
    y: a.y,
    radius: scale > 0 ? radius / scale : radius,
    opacity,
    originX: a.originX,
    originY: a.originY,
    shadow: 1,
    clip: dockClip(vw, vh),
  };
}
