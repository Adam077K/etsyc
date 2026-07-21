// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StoreConfig } from "@/lib/store-config/types";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { StoreWorld } from "./StoreWorld";
import { STAGE_LABELS, WORLD_STAGES, type WorldStage } from "./stages";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/** Click the preview stage rail to a stage — the simulated transition. */
function goToStage(getByRole: ReturnType<typeof render>["getByRole"], stage: WorldStage) {
  fireEvent.click(getByRole("button", { name: STAGE_LABELS[stage] }));
}

describe("hero persistence — the P4 invariant", () => {
  it("keeps ONE hero video mounted and playing across FEED→GROWN→WORLD_OPEN→WORLD_BROWSE→NARRATE_SHRINK", () => {
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

    // forward through every transition, then all the way back (exercises
    // the dock AND the undock path)
    const walk: WorldStage[] = [...WORLD_STAGES.slice(1), ...[...WORLD_STAGES].reverse().slice(1)];
    for (const stage of walk) {
      goToStage(getByRole, stage);
      const root = container.querySelector("[data-world-stage]");
      expect(root?.getAttribute("data-world-stage")).toBe(stage);

      // exactly one shared element, ever
      const slots = container.querySelectorAll('[data-layout-id="hero-video"]');
      expect(slots).toHaveLength(1);
      // the SAME <video> element — never remounted, never detached
      expect(slots[0]?.querySelector("video")).toBe(video);
      expect(video?.isConnected).toBe(true);
      // never paused by any transition
      expect(pauseSpy).not.toHaveBeenCalled();
    }
  });

  it("folds the world body away in feed/grown (inert) and unfolds it from world-open on", () => {
    const { container, getByRole } = render(
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

  it("persists the hero on the custom (any-hex) theme path too", () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const { container, getByRole } = render(
      <StoreWorld config={customStore} isPreview initialStage="grown" />,
    );
    const video = container.querySelector('[data-layout-id="hero-video"] video');
    expect(video).not.toBeNull();

    goToStage(getByRole, "narrate-shrink");
    expect(container.querySelector('[data-layout-id="hero-video"] video')).toBe(video);
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("defensively mounts only the FIRST hero-video if a config carries duplicates", () => {
    const heroBlock = senaStore.blocks.find((block) => block.type === "hero-video");
    if (!heroBlock || heroBlock.type !== "hero-video") throw new Error("fixture lost its hero");
    const doubled: StoreConfig = {
      ...senaStore,
      blocks: [...senaStore.blocks, { ...heroBlock, id: "b_hero_dupe", order: 99 }],
    };
    const { container } = render(<StoreWorld config={doubled} isPreview />);
    expect(container.querySelectorAll('[data-layout-id="hero-video"]')).toHaveLength(1);
    expect(container.querySelectorAll("[data-block-crashed]")).toHaveLength(0);
  });
});
