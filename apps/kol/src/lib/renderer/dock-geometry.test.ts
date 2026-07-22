import { describe, expect, it } from "vitest";

import {
  DOCK_BANDS,
  DOCK_INSET_FALLBACK_PX,
  dockBandFor,
  dockInsetPx,
  dockRectFor,
  exclusionZoneFor,
  PRIMARY_CTA_MARKER,
} from "./dock-geometry";

/**
 * The §5.3 exclusion-zone contract, pinned numerically. These numbers are
 * design-locked (KOL-wave3 screen-specs §5.3) — a change here is a design
 * change, not a refactor.
 */

describe("dock-geometry — the §5.3 breakpoint table", () => {
  it.each([
    // [viewport width, dock w, dock h, placement]
    [1920, 320, 180, "bottom-right"],
    [1440, 320, 180, "bottom-right"],
    [1439, 280, 158, "bottom-right"],
    [1024, 280, 158, "bottom-right"],
    [1023, 240, 135, "bottom-right"],
    [768, 240, 135, "bottom-right"],
    [767, 200, 112, "bottom-center"],
    [375, 200, 112, "bottom-center"],
  ] as const)("at %dpx the dock is %d×%d, %s", (vw, width, height, placement) => {
    const band = dockBandFor(vw);
    expect(band.dock).toEqual({ width, height });
    expect(band.placement).toBe(placement);
  });

  it.each([
    [1920, { width: 340, height: 200 }],
    [1024, { width: 340, height: 200 }],
    [768, { width: 260, height: 155 }],
  ] as const)("at %dpx the product layout reserves %o", (vw, zone) => {
    expect(exclusionZoneFor(vw)).toEqual(zone);
  });

  it("below 768 there is no corner zone — the pill rule covers the CTA", () => {
    expect(exclusionZoneFor(767)).toBeNull();
    // the trigger contract B6's add-to-cart CTA carries
    expect(PRIMARY_CTA_MARKER).toBe("data-primary-cta");
  });

  it("dock + inset always fits INSIDE its exclusion zone (the whole point of §5.3)", () => {
    for (const band of DOCK_BANDS) {
      if (band.exclusionZone === null) continue;
      expect(band.dock.width + DOCK_INSET_FALLBACK_PX).toBeLessThanOrEqual(
        band.exclusionZone.width,
      );
      expect(band.dock.height + DOCK_INSET_FALLBACK_PX).toBeLessThanOrEqual(
        band.exclusionZone.height,
      );
    }
  });

  it("every dock size is 16:9 within a pixel of rounding", () => {
    for (const band of DOCK_BANDS) {
      expect(Math.abs(band.dock.height - (band.dock.width * 9) / 16)).toBeLessThanOrEqual(1);
    }
  });
});

describe("dock-geometry — rect computation", () => {
  it("bottom-right: inset off both viewport edges", () => {
    expect(dockRectFor(1920, 1080)).toEqual({
      left: 1920 - 320 - DOCK_INSET_FALLBACK_PX,
      top: 1080 - 180 - DOCK_INSET_FALLBACK_PX,
      width: 320,
      height: 180,
    });
  });

  it("bottom-centre below 768: horizontally centred, inset off the bottom", () => {
    expect(dockRectFor(375, 700)).toEqual({
      left: (375 - 200) / 2,
      top: 700 - 112 - DOCK_INSET_FALLBACK_PX,
      width: 200,
      height: 112,
    });
  });

  it("falls back to the 16px inset where CSS isn't computed (SSR/node)", () => {
    // node test env: no window — the token read must not throw
    expect(dockInsetPx()).toBe(DOCK_INSET_FALLBACK_PX);
  });
});
