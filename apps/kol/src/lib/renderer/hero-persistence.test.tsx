// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { FilmLayerProvider } from "@/components/film/FilmLayer";
import type { StoreConfig } from "@/lib/store-config/types";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { StoreWorld } from "./StoreWorld";
import { STAGE_LABELS, WORLD_STAGES, type WorldStage } from "./stages";

/**
 * The P4 invariant, post-Amendment-A: "the film frame never unmounts and
 * never shows a paused or black frame." The Wave-0 suite asserted this
 * against a <video> owned by HeroStage; the mechanism moved UP into the
 * app-root Film Layer (HeroStage is now a slot registrar), so the suite
 * asserts the SAME guarantees one layer up:
 *  - one film frame ([data-film-layer]), identical node across every
 *    world-stage transition — never remounted, never detached;
 *  - same-source transitions keep the SAME visible video element (true
 *    element persistence — cross-fades are forbidden on stage edges);
 *  - pause is never called by any transition.
 * Deliberately NOT asserted: a single <video> node — the layer's A/B
 * buffers use two by design, and only source-changing swaps touch them.
 * The Wave-0 self-owned mechanism is still covered below ("self mode"),
 * because bare renderer mounts without a provider must behave exactly as
 * Wave 0 shipped.
 */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Click the preview stage rail to a stage — the simulated transition. */
function goToStage(getByRole: ReturnType<typeof render>["getByRole"], stage: WorldStage) {
  fireEvent.click(getByRole("button", { name: STAGE_LABELS[stage] }));
}

/** Mount a world the way the app does — under the app-root Film Layer. */
function renderWorld(ui: ReactNode) {
  return render(<FilmLayerProvider>{ui}</FilmLayerProvider>);
}

/** jsdom never fires media events — report canplay so the swap promotes. */
async function primeFilm(container: HTMLElement): Promise<HTMLElement> {
  const frame = container.querySelector<HTMLElement>("[data-film-layer]");
  expect(frame).not.toBeNull();
  for (const video of frame!.querySelectorAll("video")) {
    fireEvent(video, new Event("canplay"));
  }
  await waitFor(() => {
    expect(frame!.querySelector(".kol-film-front")).not.toBeNull();
  });
  return frame!;
}

describe("hero persistence — the P4 invariant, relocated to the Film Layer", () => {
  it("keeps ONE film frame mounted and playing across FEED→GROWN→WORLD_OPEN→WORLD_BROWSE→NARRATE_SHRINK", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");

    const { container, getByRole } = renderWorld(
      <StoreWorld config={senaStore} isPreview initialStage="feed" />,
    );

    // the hero slot registers — and owns no film element of its own
    const slot = container.querySelector('[data-layout-id="hero-video"]');
    expect(slot).not.toBeNull();
    expect(slot?.querySelector("video")).toBeNull();
    expect(slot?.querySelector("[data-film-slot]")).not.toBeNull();

    const frame = await primeFilm(container);
    const film = frame.querySelector(".kol-film-front");
    expect(film).not.toBeNull();
    // plays on claim — no scroll gate on the shared film
    expect(playSpy).toHaveBeenCalled();

    // forward through every transition, then all the way back (exercises
    // the dock AND the undock path)
    const walk: WorldStage[] = [...WORLD_STAGES.slice(1), ...[...WORLD_STAGES].reverse().slice(1)];
    for (const stage of walk) {
      goToStage(getByRole, stage);
      const root = container.querySelector("[data-world-stage]");
      expect(root?.getAttribute("data-world-stage")).toBe(stage);

      // exactly one film frame, ever — the SAME node, never detached
      expect(container.querySelectorAll("[data-film-layer]")).toHaveLength(1);
      expect(container.querySelector("[data-film-layer]")).toBe(frame);
      expect(frame.isConnected).toBe(true);
      // same-source transitions are TRUE element persistence: the same
      // visible video element — stage edges never touch the buffers
      expect(frame.querySelector(".kol-film-front")).toBe(film);
      // never paused by any transition
      expect(pauseSpy).not.toHaveBeenCalled();
    }
  });

  it("folds the world body away in feed/grown (inert) and unfolds it from world-open on", () => {
    const { container, getByRole } = renderWorld(
      <StoreWorld config={senaStore} isPreview initialStage="feed" />,
    );
    const body = container.querySelector(".kol-world-body");
    expect(body).not.toBeNull();
    expect(body?.hasAttribute("inert")).toBe(true);

    goToStage(getByRole, "world-open");
    expect(container.querySelector(".kol-world-body")?.hasAttribute("inert")).toBe(false);
    // unfold is a fade of the SAME mounted body — content never remounts
    expect(container.querySelector(".kol-world-body")).toBe(body);
  });

  it("persists the film on the custom (any-hex) theme path too", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const { container, getByRole } = renderWorld(
      <StoreWorld config={customStore} isPreview initialStage="grown" />,
    );
    const frame = await primeFilm(container);
    const film = frame.querySelector(".kol-film-front");

    goToStage(getByRole, "narrate-shrink");
    // the dock is now the Film Layer's edge — same frame, same element,
    // docked chrome, no pause
    expect(container.querySelector("[data-film-layer]")).toBe(frame);
    expect(frame.getAttribute("data-film-docked")).toBe("true");
    expect(frame.querySelector(".kol-film-front")).toBe(film);
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("defensively mounts only the FIRST hero-video if a config carries duplicates", () => {
    const heroBlock = senaStore.blocks.find((block) => block.type === "hero-video");
    if (!heroBlock || heroBlock.type !== "hero-video") throw new Error("fixture lost its hero");
    const doubled: StoreConfig = {
      ...senaStore,
      blocks: [...senaStore.blocks, { ...heroBlock, id: "b_hero_dupe", order: 99 }],
    };
    const { container } = renderWorld(<StoreWorld config={doubled} isPreview />);
    expect(container.querySelectorAll('[data-layout-id="hero-video"]')).toHaveLength(1);
    // only ONE slot ever registers with the layer — no second shared element
    expect(container.querySelectorAll("[data-film-slot]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-block-crashed]")).toHaveLength(0);
  });

  it("self mode (no Film Layer provider): the Wave-0 in-slot video persists and never pauses", () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");

    const { container, getByRole } = render(
      <StoreWorld config={senaStore} isPreview initialStage="feed" />,
    );

    const slot = container.querySelector('[data-layout-id="hero-video"]');
    expect(slot).not.toBeNull();
    const video = slot?.querySelector("video");
    expect(video).not.toBeNull();
    // persistent mode plays on mount (no scroll gate)
    expect(playSpy).toHaveBeenCalled();

    const walk: WorldStage[] = [...WORLD_STAGES.slice(1), ...[...WORLD_STAGES].reverse().slice(1)];
    for (const stage of walk) {
      goToStage(getByRole, stage);
      const slots = container.querySelectorAll('[data-layout-id="hero-video"]');
      expect(slots).toHaveLength(1);
      // the SAME <video> element — never remounted, never detached
      expect(slots[0]?.querySelector("video")).toBe(video);
      expect(video?.isConnected).toBe(true);
      expect(pauseSpy).not.toHaveBeenCalled();
    }
  });
});
