// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ASPECT_EPSILON,
  counterFor,
  parseMatrixScale,
  startAspectCounter,
} from "../aspect-counter";

/**
 * G1-F2 — the grow FLIP scales the frame non-uniformly (feed card 4:5 →
 * centre column 16:9) while the buffers are cover-fit, so without a
 * counter-transform the film distorts for the whole edge. These tests pin
 * the inverse math (visible media scale stays UNIFORM — cover, never
 * stretch) and the sampling loop's apply/clear lifecycle.
 */

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("parseMatrixScale", () => {
  it("reads x/y scale off a 2d matrix", () => {
    expect(parseMatrixScale("matrix(0.4444, 0, 0, 0.9877, -120, 40)")).toEqual({
      x: 0.4444,
      y: 0.9877,
    });
  });

  it("reads x/y scale off a 3d matrix", () => {
    const m3d = `matrix3d(0.5, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 1, 0, 10, 20, 0, 1)`;
    expect(parseMatrixScale(m3d)).toEqual({ x: 0.5, y: 0.9 });
  });

  it("treats none/empty as identity and garbage as unparseable", () => {
    expect(parseMatrixScale("none")).toEqual({ x: 1, y: 1 });
    expect(parseMatrixScale("")).toEqual({ x: 1, y: 1 });
    expect(parseMatrixScale("translate(10px)")).toBeNull();
    expect(parseMatrixScale("matrix(1, 2)")).toBeNull();
  });
});

describe("counterFor — cover semantics under a non-uniform frame scale", () => {
  // the flagship grow geometry: 320×400 card (4:5) → 720×405 column (16:9)
  const grow = { scaleX: 320 / 720, scaleY: 400 / 405, width: 720, height: 405 };

  it("makes the visible media scale uniform at u = max(sx, sy)", () => {
    const c = counterFor({ ...grow, focalX: 0.5, focalY: 0.5 });
    const u = Math.max(grow.scaleX, grow.scaleY);
    // visible scale = frame scale × inverse — uniform in both axes
    expect(grow.scaleX * c.scaleX).toBeCloseTo(u, 10);
    expect(grow.scaleY * c.scaleY).toBeCloseTo(u, 10);
  });

  it("centres the cover overhang at focal 0.5/0.5", () => {
    const c = counterFor({ ...grow, focalX: 0.5, focalY: 0.5 });
    const u = Math.max(grow.scaleX, grow.scaleY);
    // media visual box vs frame visible box, both in visual px
    const overhangX = grow.width * u - grow.width * grow.scaleX;
    // visual left offset = translateX × frame scaleX (origin 0 0)
    expect(c.translateX * grow.scaleX).toBeCloseTo(-overhangX / 2, 6);
    // y is the cover axis (u === scaleY): no overhang, no shift
    expect(c.translateY).toBeCloseTo(0, 10);
  });

  it("aligns the overhang to the medium's focal fractions", () => {
    const left = counterFor({ ...grow, focalX: 0, focalY: 0.5 });
    expect(left.translateX).toBeCloseTo(0, 10); // left-anchored crop
    const right = counterFor({ ...grow, focalX: 1, focalY: 0.5 });
    const u = Math.max(grow.scaleX, grow.scaleY);
    const overhangX = grow.width * u - grow.width * grow.scaleX;
    expect(right.translateX * grow.scaleX).toBeCloseTo(-overhangX, 6);
  });

  it("is the identity for a uniform scale", () => {
    const c = counterFor({ scaleX: 0.7, scaleY: 0.7, width: 720, height: 405, focalX: 0.3, focalY: 0.6 });
    expect(c.scaleX).toBeCloseTo(1, 10);
    expect(c.scaleY).toBeCloseTo(1, 10);
    expect(c.translateX).toBeCloseTo(0, 10);
    expect(c.translateY).toBeCloseTo(0, 10);
  });
});

describe("startAspectCounter — the sampling loop", () => {
  function rig(frameTransform: () => string) {
    const frame = document.createElement("div");
    const bufferA = document.createElement("video");
    bufferA.className = "kol-film-buffer";
    const poster = document.createElement("img");
    poster.className = "kol-film-poster";
    frame.append(bufferA, poster);
    document.body.append(frame);
    Object.defineProperty(frame, "offsetWidth", { value: 720 });
    Object.defineProperty(frame, "offsetHeight", { value: 405 });

    // manual rAF pump — each pump() runs one sampled frame
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      queue.push(cb);
      return queue.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      queue.length = 0;
    });
    const realGetComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element) => {
      const style = realGetComputedStyle(el);
      if (el === frame) {
        return { ...style, transform: frameTransform(), objectPosition: "" } as CSSStyleDeclaration;
      }
      return { ...style, objectPosition: "50% 50%" } as CSSStyleDeclaration;
    });
    const pump = () => {
      const next = queue.shift();
      next?.(0);
    };
    return { frame, bufferA, poster, pump };
  }

  it("applies the inverse to buffers + poster mid-flight and clears on stop", () => {
    const sx = 320 / 720;
    const sy = 400 / 405;
    const { frame, bufferA, poster, pump } = rig(
      () => `matrix(${sx}, 0, 0, ${sy}, -100, -50)`,
    );
    const stop = startAspectCounter(frame);
    pump();
    expect(bufferA.style.transform).toContain("scale(");
    expect(bufferA.style.transformOrigin).toBe("0 0");
    expect(poster.style.transform).toContain("scale(");
    const parsed = parseMatrixScale("none"); // sanity: helper stays importable
    expect(parsed).toEqual({ x: 1, y: 1 });
    // visible scale uniform: parse the applied inverse back out
    const match = /scale\(([-\d.]+), ([-\d.]+)\)/.exec(bufferA.style.transform);
    expect(match).not.toBeNull();
    expect(sx * Number.parseFloat(match![1]!)).toBeCloseTo(sy * Number.parseFloat(match![2]!), 6);
    stop();
    expect(bufferA.style.transform).toBe("");
    expect(poster.style.transform).toBe("");
  });

  it("self-neutralises when the frame scale returns to uniform", () => {
    let transform = `matrix(0.5, 0, 0, 1, 0, 0)`;
    const { bufferA, pump, frame } = rig(() => transform);
    const stop = startAspectCounter(frame);
    pump();
    expect(bufferA.style.transform).not.toBe("");
    transform = "none"; // transition landed — identity
    pump();
    expect(bufferA.style.transform).toBe("");
    stop();
  });

  it("skips unparseable samples instead of guessing", () => {
    const { bufferA, pump, frame } = rig(() => "translate(10px)");
    const stop = startAspectCounter(frame);
    pump();
    expect(bufferA.style.transform).toBe("");
    stop();
  });

  it("epsilon gate matches the FLIP wiring threshold", () => {
    // the layer engages the counter at |sx/sy − 1| ≥ ASPECT_EPSILON —
    // grow's 4:5 → 16:9 ratio is far past it, same-aspect edges are not
    expect(Math.abs(320 / 720 / (400 / 405) - 1)).toBeGreaterThan(ASPECT_EPSILON);
    expect(Math.abs(0.7 / 0.7 - 1)).toBeLessThan(ASPECT_EPSILON);
  });
});
