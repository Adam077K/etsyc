import { expect, test } from "@playwright/test";
import { DOCK_BANDS, dockBandFor } from "../src/lib/renderer/dock-geometry";

/**
 * Gate finding P1-B — DOCK_BANDS is spec-locked (§5.3) and nothing asserted
 * it: a padding refactor or viewport-calc bug would have silently broken the
 * dock. This suite measures the REAL docked film frame via the QA handle
 * (`[data-film-frame]`, added for exactly this) at the three review
 * viewports and pins rect === band. Expectations are written through
 * dockBandFor so a spec-side band change and this suite move together —
 * while a LAYER-side drift (the mutation case) goes red here.
 */

const VIEWPORTS = [
  { width: 1440, height: 900, dock: { width: 320, height: 180 } },
  { width: 1024, height: 768, dock: { width: 280, height: 158 } },
  { width: 375, height: 812, dock: { width: 200, height: 112 } },
] as const;

test.describe("docked film frame matches the §5.3 band", () => {
  for (const vp of VIEWPORTS) {
    test(`${vp.width}×${vp.height} → ${vp.dock.width}×${vp.dock.height}`, async ({ page }) => {
      // the literal table above IS the spec under test — if dock-geometry.ts
      // drifts from it, fail here rather than silently following the drift
      expect(dockBandFor(vp.width).dock).toEqual(vp.dock);

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/preview");
      await expect(page.locator("[data-film-frame]")).toHaveCount(1);

      // walk the rail to NARRATE — reducedMotion:reduce (playwright config)
      // snaps the dock edge, so the rect below is the settled geometry
      await page.getByRole("button", { name: "Narrate" }).click();
      await expect(page.locator("[data-film-frame]")).toHaveAttribute("data-film-docked", "true");
      await page.waitForTimeout(250);

      const rect = await page
        .locator("[data-film-frame]")
        .evaluate((el) => {
          const b = el.getBoundingClientRect();
          return { width: b.width, height: b.height };
        });
      expect(Math.abs(rect.width - vp.dock.width), `width ${rect.width}`).toBeLessThanOrEqual(1);
      expect(Math.abs(rect.height - vp.dock.height), `height ${rect.height}`).toBeLessThanOrEqual(1);
    });
  }

  test("band table is descending and closed under find() (no width can miss)", () => {
    const widths = DOCK_BANDS.map((band) => band.minWidth);
    expect([...widths].sort((a, b) => b - a)).toEqual(widths);
    expect(widths[widths.length - 1]).toBe(0);
  });
});
