import type { FilmRect } from "@/components/film/FilmLayer";

/**
 * B5 dock geometry — the §5.3 exclusion-zone contract (KOL-wave3
 * screen-specs §5.3, which closes B5 OQ #1 and the "dock covers the CTA"
 * risk). Replaces the pre-B5 clamp(240px, 32vw, 320px) corner rect.
 *
 * Two halves, one table:
 *
 *  - the DOCK rect the film occupies at NARRATE_SHRINK, per viewport band
 *    (16:9, spec-locked at 320×180 for ≥1440);
 *  - the EXCLUSION ZONE the product layout (B6) reserves in that corner so
 *    the add-to-cart CTA never enters it. This is a LAYOUT CONTRACT, not a
 *    runtime collision check — B6 reserves the space; nothing detects and
 *    dodges (§5.3, binding). The zone is a reservation in the product
 *    surface's own flow: it carries no z-index and never contests app
 *    chrome at z ≥ 50 (stacking contract, globals.css).
 *
 * Below 768px the dock sits bottom-CENTRE and there is no corner zone: the
 * CTA protection there is the audio-only-pill collapse (§5.3 row 3),
 * triggered when an element bearing PRIMARY_CTA_MARKER enters the
 * viewport. The pill itself is docked chrome — it lives on the Film Layer
 * behind [data-film-docked] — so the trigger wires up when B6's CTA and
 * the layer's pill affordance land; the marker contract is fixed here.
 */

export interface DockBand {
  /** Viewport-width floor of this band (px, inclusive). */
  minWidth: number;
  /** Dock size at this band — always 16:9, spec-locked (§5.3). */
  dock: { width: number; height: number };
  placement: "bottom-right" | "bottom-center";
  /**
   * Corner area (px, measured from the viewport's bottom-right) that B6's
   * layout reserves. The dock plus its inset always fits inside — see the
   * invariant test. null below 768: bottom-centre placement has no corner
   * zone; the pill rule covers the CTA instead.
   */
  exclusionZone: { width: number; height: number } | null;
}

/** The <768 band — also the find() fallback so no lookup can miss. */
const MOBILE_BAND: DockBand = {
  minWidth: 0,
  dock: { width: 200, height: 112 },
  placement: "bottom-center",
  exclusionZone: null,
};

/** §5.3 breakpoint table — descending; the first band whose floor fits wins. */
export const DOCK_BANDS: readonly DockBand[] = [
  {
    minWidth: 1440,
    dock: { width: 320, height: 180 },
    placement: "bottom-right",
    exclusionZone: { width: 340, height: 200 },
  },
  {
    minWidth: 1024,
    dock: { width: 280, height: 158 },
    placement: "bottom-right",
    exclusionZone: { width: 340, height: 200 },
  },
  {
    minWidth: 768,
    dock: { width: 240, height: 135 },
    placement: "bottom-right",
    exclusionZone: { width: 260, height: 155 },
  },
  MOBILE_BAND,
];

/**
 * Dock inset off the viewport edges — --space-2 (16px). §5.1 sketches a
 * --space-3 inset, but the §5.3 zones are the binding closure and only a
 * 16px inset keeps dock + inset inside them (320 + 24 = 344 > 340); 16px
 * is also the shipped pre-B5 margin. Recorded in the B5 session decisions.
 */
export const DOCK_INSET_FALLBACK_PX = 16;

/**
 * B6 marks its primary (add-to-cart) CTA with this attribute — the <768
 * pill-collapse trigger and the ≥768 "never enters the exclusion zone"
 * layout assertion both key off it.
 */
export const PRIMARY_CTA_MARKER = "data-primary-cta";

/** The §5.3 band for a viewport width. */
export function dockBandFor(viewportWidth: number): DockBand {
  return DOCK_BANDS.find((band) => viewportWidth >= band.minWidth) ?? MOBILE_BAND;
}

/** Read the inset token off :root; fall back where CSS isn't computed (jsdom/SSR). */
export function dockInsetPx(): number {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return DOCK_INSET_FALLBACK_PX;
  }
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--space-2");
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DOCK_INSET_FALLBACK_PX;
}

/** The viewport-fixed corner rect the film occupies at NARRATE_SHRINK. */
export function dockRectFor(viewportWidth: number, viewportHeight: number): FilmRect {
  const band = dockBandFor(viewportWidth);
  const inset = dockInsetPx();
  const { width, height } = band.dock;
  const left =
    band.placement === "bottom-center"
      ? (viewportWidth - width) / 2
      : viewportWidth - width - inset;
  return { left, top: viewportHeight - height - inset, width, height };
}

/** The corner area B6's layout reserves at this viewport; null below 768. */
export function exclusionZoneFor(
  viewportWidth: number,
): { width: number; height: number } | null {
  return dockBandFor(viewportWidth).exclusionZone;
}
