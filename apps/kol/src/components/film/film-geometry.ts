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
 * as a CENTERED band (equal top+bottom, so the card shows the middle of the
 * frame — transform/clip only, no distortion). Set to 16/10 so a landscape
 * desktop viewport (≥ this ratio) is left pixel-identical.
 */
const DOCK_MIN_ASPECT = 16 / 10;

/** Displayed aspect (w/h) of the docked card at a given viewport. */
export function dockAspect(vw: number, vh: number): number {
  return vh > 0 ? Math.max(vw / vh, DOCK_MIN_ASPECT) : DOCK_MIN_ASPECT;
}

/** Clip fraction (0–1) that crops the uniformly-scaled dock down to
    `DOCK_MIN_ASPECT`. Zero on any viewport already at/above that landscape
    floor (e.g. desktop), so those docks are untouched. */
export function dockClip(vw: number, vh: number): number {
  if (vh <= 0) return 0;
  return Math.max(0, 1 - vw / vh / DOCK_MIN_ASPECT);
}

/**
 * The dock shows the maker's FACE, not the top of frame (Founder). The maker
 * clips are shot with headroom — the face sits low (~⅔ down), so a purely
 * geometric middle band still lands on hair/props. We bias the shown band DOWN
 * by this fraction of the video so it settles on the face. Capped at clip/2 per
 * call so the band can never run past the frame's bottom edge. The FilmStage
 * pairs this with a matching object-position on portrait clips (which overflow
 * vertically on a landscape dock, where the clip is 0 and can't reframe).
 */
export const DOCK_FOCAL_BIAS = 0.16;

/** The downward band drop for a given clip — the focal bias, capped so the band
    stays inside the frame (its bottom inset `clip/2 - drop` can't go negative). */
export function bandDrop(clip: number): number {
  return Math.min(DOCK_FOCAL_BIAS, clip / 2);
}

/**
 * Keep the face band flush at its corner. FilmStage trims `clip/2 + drop` off the
 * top and `clip/2 - drop` off the bottom of the element's local box; once scaled
 * about the corner origin that band drifts off the anchor, so we compensate the
 * y-translate: pull UP by the top inset at a top-left dock, push DOWN by the
 * bottom inset at a bottom-right dock. Zero when clip is 0 (a landscape desktop
 * shows the full frame; object-position does the reframing there).
 */
function bandShift(
  corner: DockCorner,
  clip: number,
  scale: number,
  vh = typeof window !== "undefined" ? window.innerHeight : 0,
): number {
  const drop = bandDrop(clip);
  const insetTop = (clip / 2 + drop) * scale * vh;
  const insetBottom = (clip / 2 - drop) * scale * vh;
  return corner === "bottom-right" ? insetBottom : -insetTop;
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
  const scaleNow = 1 + (docked - 1) * p;
  const clipNow = clipAmt * p;
  m.originX.set(a.originX);
  m.originY.set(a.originY);
  m.scale.set(scaleNow);
  m.x.set(a.x * p);
  // Centered band: compensate y so the mid-frame card stays flush at the corner.
  m.y.set(a.y * p + bandShift(corner, clipNow, scaleNow));
  m.radius.set(DOCK_RADIUS * DOCK_EASE(Math.min(v / 0.55, 1)));
  m.shadow.set(v <= 0.5 ? 0 : Math.min((v - 0.5) / 0.4, 1));
  m.clip.set(clipNow);
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
    // Centered band: compensate y so the mid-frame card stays flush at the corner.
    y: a.y + bandShift(corner, clipAmt, docked),
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
  const clip = dockClip(vw, vh);
  return {
    scale,
    x: a.x,
    // Centered band: compensate y so the mid-frame card stays flush at the corner.
    y: a.y + bandShift(corner, clip, scale, vh),
    radius: scale > 0 ? radius / scale : radius,
    opacity,
    originX: a.originX,
    originY: a.originY,
    shadow: 1,
    clip,
  };
}

/* ---------------------------------------------------------------------------
 * VERTICAL store dock (Founder): world + product dock as a PORTRAIT card that
 * shows the maker's frame (face + hands), not a landscape strip. The film node
 * object-covers the full viewport, so a portrait card is a clip of that box to
 * the portrait aspect — cropping the excess dimension (WIDTH on a landscape
 * desktop, HEIGHT on a portrait phone) and compensating the translate so the
 * card sits flush at the corner. On a portrait phone this shows nearly the whole
 * frame; on desktop it is a portrait window centered on her (object-position in
 * FilmStage carries the face). Checkout/thank-you keep the landscape helpers.
 * ------------------------------------------------------------------------- */

/** Displayed aspect (w/h) of the vertical store card. */
export const DOCK_PORTRAIT_ASPECT = 9 / 16;

/** Target card width for the vertical store dock (px), by viewport. */
function portraitWidth(vw: number): number {
  return vw < 640 ? 124 : 165;
}

/** Resolve the portrait card's transform for a viewport + corner: uniform scale,
    the single-axis crop fraction to reach the portrait aspect, and the flush
    compensation. `cropX` tells FilmStage which axis to clip. */
function portraitParams(
  vw: number,
  vh: number,
  corner: DockCorner,
  margin: number,
): { scale: number; clip: number; cropX: boolean; x: number; y: number; originX: number; originY: number } {
  const A = DOCK_PORTRAIT_ASPECT;
  const W = portraitWidth(vw);
  const boxA = vw > 0 && vh > 0 ? vw / vh : 1;
  let scale: number;
  let clip: number;
  let cropX: boolean;
  if (boxA > A) {
    // Landscape viewport → crop WIDTH; card height is the full scaled box height.
    scale = vh > 0 ? W / (A * vh) : 0.14;
    clip = Math.max(0, 1 - (A * vh) / vw); // L/R total
    cropX = true;
  } else {
    // Portrait viewport → crop HEIGHT; card width is the full scaled box width.
    scale = vw > 0 ? W / vw : 0.14;
    clip = Math.max(0, 1 - boxA / A); // T/B total
    cropX = false;
  }
  const a = dockAnchor(corner, margin);
  const insetX = cropX ? (clip / 2) * vw * scale : 0;
  const insetY = cropX ? 0 : (clip / 2) * vh * scale;
  return {
    scale,
    clip,
    cropX,
    x: corner === "bottom-right" ? a.x + insetX : a.x - insetX,
    y: corner === "bottom-right" ? a.y + insetY : a.y - insetY,
    originX: a.originX,
    originY: a.originY,
  };
}

/** One-shot portrait store card (product dock, reduced-motion snap, interlude
    re-dock). Radius reads ~16px after the box shrinks. */
export function portraitDockTarget(
  vw: number,
  vh: number,
  corner: DockCorner = "top-left",
  margin = DOCK_MARGIN,
): FilmTarget {
  const p = portraitParams(vw, vh, corner, margin);
  return {
    scale: p.scale,
    x: p.x,
    y: p.y,
    radius: p.scale > 0 ? 16 / p.scale : 16,
    opacity: 1,
    originX: p.originX,
    originY: p.originY,
    shadow: 1,
    clip: p.clip,
  };
}

/** Scroll-linked hero→PORTRAIT dock settle (maker world / twodots). Like
    applyDockFrame but lands on the vertical card: scale + single-axis clip + the
    flush compensation all ramp with the hero scroll `v`. Top-left store corner. */
export function applyPortraitDockFrame(
  m: FilmMotion,
  v: number,
  vw: number,
  vh: number,
  corner: DockCorner = "top-left",
  margin = DOCK_MARGIN,
): void {
  const t = portraitParams(vw, vh, corner, margin);
  const p = DOCK_EASE(Math.min(v / 0.72, 1));
  const scaleNow = 1 + (t.scale - 1) * p;
  const clipNow = t.clip * p;
  m.originX.set(t.originX);
  m.originY.set(t.originY);
  m.scale.set(scaleNow);
  // The flush compensation rides on clipNow + scaleNow, so it ramps with p.
  const insetX = t.cropX ? (clipNow / 2) * vw * scaleNow : 0;
  const insetY = t.cropX ? 0 : (clipNow / 2) * vh * scaleNow;
  const a = dockAnchor(corner, margin);
  m.x.set(a.x * p + (corner === "bottom-right" ? insetX : -insetX));
  m.y.set(a.y * p + (corner === "bottom-right" ? insetY : -insetY));
  m.radius.set((16 / (t.scale || 1)) * DOCK_EASE(Math.min(v / 0.55, 1)));
  m.shadow.set(v <= 0.5 ? 0 : Math.min((v - 0.5) / 0.4, 1));
  m.clip.set(clipNow);
}
