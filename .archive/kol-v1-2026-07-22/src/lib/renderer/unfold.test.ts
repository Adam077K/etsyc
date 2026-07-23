import { describe, expect, it } from "vitest";
import {
  UNFOLD_ATMOSPHERE_START_MS,
  UNFOLD_HARD_CAP_MS,
  UNFOLD_RISE_BASE_PX,
  UNFOLD_RISE_DURATION_MS,
  UNFOLD_WAVE_START_MS,
  unfoldTiming,
} from "./unfold";

/**
 * §3.3 unfold choreography — the binding numbers, asserted as numbers:
 * three bands, 70ms nearest-to-film stagger, ~1.3× parallax depth, and a
 * 900ms HARD CAP that survives arbitrarily deep worlds. These constants
 * are design-direction §5.2 / screen-specs §3.3 BINDING values — a change
 * here is a design change, not a refactor.
 */
describe("unfoldTiming — §3.3 bands", () => {
  it("band 2 opens at 140ms with the nearest-to-film block, staggered 70ms outward", () => {
    expect(unfoldTiming(1, 5, false).delayMs).toBe(140);
    expect(unfoldTiming(2, 5, false).delayMs).toBe(210);
    expect(unfoldTiming(3, 5, false).delayMs).toBe(280);
    // monotone: nearest-to-film always first
    for (let d = 2; d <= 12; d++) {
      expect(unfoldTiming(d, 12, false).delayMs).toBeGreaterThanOrEqual(
        unfoldTiming(d - 1, 12, false).delayMs,
      );
    }
  });

  it("the nearest block completes inside band 2 (by 620ms)", () => {
    const nearest = unfoldTiming(1, 9, false);
    expect(nearest.delayMs + nearest.durationMs).toBeLessThanOrEqual(620);
  });

  it("HARD CAP: nothing animates after t=900, even in a 20-block world", () => {
    for (let d = 1; d <= 20; d++) {
      for (const atmosphere of [false, true]) {
        const t = unfoldTiming(d, 20, atmosphere);
        expect(t.delayMs + t.durationMs).toBeLessThanOrEqual(UNFOLD_HARD_CAP_MS);
      }
    }
  });

  it("parallax depth: the nearest block rises exactly 18px, the furthest ~1.3×", () => {
    expect(unfoldTiming(1, 7, false).risePx).toBe(UNFOLD_RISE_BASE_PX);
    expect(unfoldTiming(7, 7, false).risePx).toBeCloseTo(UNFOLD_RISE_BASE_PX * 1.3, 1);
    // a single-block world has no depth to scale against
    expect(unfoldTiming(1, 1, false).risePx).toBe(UNFOLD_RISE_BASE_PX);
    // depth grows monotonically outward
    expect(unfoldTiming(4, 7, false).risePx).toBeGreaterThan(unfoldTiming(2, 7, false).risePx);
  });

  it("band 3: atmosphere never resolves before 340ms, regardless of proximity, and rises 0 (a breath, not a lift)", () => {
    const nearAtmosphere = unfoldTiming(1, 5, true);
    expect(nearAtmosphere.delayMs).toBe(UNFOLD_ATMOSPHERE_START_MS);
    expect(nearAtmosphere.risePx).toBe(0);
    // 340 + 560 lands exactly on the cap — the world breathes out to t=900
    expect(nearAtmosphere.delayMs + nearAtmosphere.durationMs).toBe(UNFOLD_HARD_CAP_MS);
    // a deep atmosphere block keeps its wave slot but still settles by 900
    const deep = unfoldTiming(6, 8, true);
    expect(deep.delayMs).toBeGreaterThanOrEqual(UNFOLD_ATMOSPHERE_START_MS);
    expect(deep.delayMs + deep.durationMs).toBeLessThanOrEqual(UNFOLD_HARD_CAP_MS);
  });

  it("the wave start + rise duration are the §3.3 constants (140 / 340)", () => {
    // pinned so a well-meaning refactor cannot silently retime the bands
    expect(UNFOLD_WAVE_START_MS).toBe(140);
    expect(UNFOLD_RISE_DURATION_MS).toBe(340);
  });
});
