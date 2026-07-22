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
  it("cold mount lands the layer ON the slot's rect — the mount-commit claim races the frame ref and must still position (gate-2 0x0 layer)", () => {
    // The provider's frame <div> is a later sibling of {children}, so the
    // slot's mount layout effect claims BEFORE the frame ref attaches. The
    // un-landed claim left the layer at its 0-size CSS default: an
    // invisible film on every cold world-open — /preview hero reviews were
    // conducted over bare --surface because of this. The provider must
    // land the active slot in the same pre-paint flush.
    const rect = {
      left: 213, top: 69, width: 852, height: 479,
      right: 1065, bottom: 548, x: 213, y: 69,
      toJSON: () => ({}),
    } as DOMRect;
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue(rect);
    const { container } = renderWorld(
      <StoreWorld config={senaStore} isPreview initialStage="world-open" />,
    );
    const frame = container.querySelector<HTMLElement>("[data-film-layer]")!;
    // in-flow slot: document coords, real size — not fixed/0x0/origin
    expect(frame.style.position).toBe("absolute");
    expect(frame.style.left).toBe("213px");
    expect(frame.style.top).toBe("69px");
    expect(frame.style.width).toBe("852px");
    expect(frame.style.height).toBe("479px");
  });

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

  it("focalPoint reaches the FRONT BUFFER on the production path (FilmLayerProvider mounted)", async () => {
    // CPO Ruling 3: makers must not be decapitated by the 4:5 crop. Every
    // world mounts FilmLayerProvider → layer mode — so the crop must land
    // on the layer's visible A/B buffer; self-mode coverage proves nothing
    // about this path (gate-1 P1 focalPoint void).
    const focal = { x: 0.5, y: 0.18 };
    const focalConfig: StoreConfig = {
      ...senaStore,
      media: {
        ...senaStore.media,
        clips: senaStore.media.clips.map((clip) => ({ ...clip, focalPoint: focal })),
      },
    };
    const { container } = renderWorld(
      <StoreWorld config={focalConfig} isPreview initialStage="world-open" />,
    );
    const frame = await primeFilm(container);
    const front = frame.querySelector<HTMLVideoElement>("video.kol-film-front");
    expect(front?.style.objectPosition).toBe("50% 18%");
    // the layer's poster underlay agrees with the film on the crop anchor
    expect(
      frame.querySelector<HTMLImageElement>("img.kol-film-poster")?.style.objectPosition,
    ).toBe("50% 18%");
  });

  it("the claimed hero slot is a transparent window; its poster returns while the film docks away", async () => {
    const { container, getByRole } = renderWorld(
      <StoreWorld config={senaStore} isPreview initialStage="world-open" />,
    );
    const frame = await primeFilm(container);
    const slot = container.querySelector<HTMLElement>("[data-film-slot]")!;

    // claimed + undocked: the slot paints NO poster of its own — the film
    // shows through from the --z-film-bed plane, and the hero chrome that
    // must read over it (heading/craft/scrim) sits inside the lifted stage
    expect(slot.querySelector("img")).toBeNull();
    expect(frame.hasAttribute("data-film-docked")).toBe(false);
    expect(container.querySelector(".kol-hero-stage .kol-scrim")).not.toBeNull();

    // docked: the layer flips to the film plane; the slot shows its poster
    goToStage(getByRole, "narrate-shrink");
    expect(frame.getAttribute("data-film-docked")).toBe("true");
    expect(slot.getAttribute("data-film-away")).toBe("true");
    expect(slot.querySelector("img")).not.toBeNull();

    // undock restores the transparent window
    goToStage(getByRole, "world-browse");
    expect(slot.querySelector("img")).toBeNull();
  });

  it("B3 unfold — GROWN → WORLD_OPEN is a SAME-SOURCE transition: Film Layer node identity persists, the visible element is never swapped or paused", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const { container, getByRole } = renderWorld(
      <StoreWorld config={senaStore} isPreview initialStage="grown" />,
    );
    const frame = await primeFilm(container);
    const film = frame.querySelector("video.kol-film-front");
    expect(film).not.toBeNull();

    goToStage(getByRole, "world-open");

    // the SAME Film Layer node — never remounted, never detached
    expect(container.querySelector("[data-film-layer]")).toBe(frame);
    expect(frame.isConnected).toBe(true);
    // cross-fading is FORBIDDEN on this edge (CPO Ruling 1): the visible
    // element is the SAME video — the A/B buffers were never touched, so
    // no sampled frame can show a paused or black incoming buffer
    expect(frame.querySelector("video.kol-film-front")).toBe(film);
    expect(frame.querySelectorAll("video.kol-film-front")).toHaveLength(1);
    // playback continuity: no transition ever calls pause (jsdom cannot
    // sample frames — the pause spy + untouched front buffer are the
    // testable projection of "never a paused or black frame")
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("B3 unfold — §3.3 choreography structure: items rise nearest-to-film first in BOTH directions, atmosphere in band 3, all inside the 900ms cap", () => {
    // give the world a block ABOVE the film so both directions exist
    const reordered: StoreConfig = {
      ...senaStore,
      blocks: senaStore.blocks.map((block) =>
        block.id === "b_story" ? { ...block, order: -1 } : block,
      ),
    };
    const { container } = renderWorld(
      <StoreWorld config={reordered} isPreview initialStage="grown" />,
    );

    const items = Array.from(container.querySelectorAll<HTMLElement>(".kol-unfold-item"));
    // every non-hero block is choreographed; the hero is NOT an item (the
    // film is the fixed point the world assembles around)
    expect(items).toHaveLength(senaStore.blocks.length - 1);
    expect(container.querySelector(".kol-hero-stage .kol-unfold-item")).toBeNull();

    const delayOf = (el: HTMLElement) =>
      Number.parseInt(el.style.getPropertyValue("--unfold-delay"), 10);
    const riseOf = (el: HTMLElement) =>
      Number.parseFloat(el.style.getPropertyValue("--unfold-rise"));

    // both direction-1 neighbours open the wave at 140ms (band 2 start)
    const above = items.filter((el) => el.dataset.unfoldDistance === "1");
    expect(above.length).toBeGreaterThanOrEqual(2); // one each side of the film
    for (const el of above) expect(delayOf(el)).toBe(140);

    // stagger is monotone outward and every item settles by t=900
    for (const el of items) {
      const distance = Number(el.dataset.unfoldDistance);
      expect(delayOf(el)).toBeGreaterThanOrEqual(140);
      expect(delayOf(el) + Number.parseInt(el.style.getPropertyValue("--unfold-dur"), 10))
        .toBeLessThanOrEqual(900);
      if (distance > 1) {
        const nearer = items.find((c) => Number(c.dataset.unfoldDistance) === distance - 1);
        if (nearer) expect(delayOf(el)).toBeGreaterThanOrEqual(delayOf(nearer));
      }
    }

    // atmosphere resolves in band 3 (≥340ms) as a breath: rise 0 — it is
    // the only block type with a zero rise, so the filter identifies it
    const atmoItems = items.filter((el) => riseOf(el) === 0);
    expect(atmoItems).toHaveLength(1); // sena carries exactly one atmosphere band
    for (const el of atmoItems) {
      expect(delayOf(el)).toBeGreaterThanOrEqual(340);
    }

    // parallax depth: a deeper block rises further than a nearer one
    const d1 = items.find((el) => el.dataset.unfoldDistance === "1")!;
    const deepest = items.reduce((a, b) =>
      Number(a.dataset.unfoldDistance) >= Number(b.dataset.unfoldDistance) ? a : b,
    );
    expect(riseOf(deepest)).toBeGreaterThan(riseOf(d1));
  });

  it("B3 pin — the engine's WORLD_OPEN pick reaches the persistent slot via videos.id, and an unbound pick is ignored", async () => {
    // hero bound to two clips; the engine picked the SECOND — the pin must
    // put it in the slot without touching the seller's other blocks
    const twoClipHero: StoreConfig = {
      ...senaStore,
      blocks: senaStore.blocks.map((block) =>
        block.type === "hero-video"
          ? { ...block, bindings: { ...block.bindings, clipTags: ["clip_intro", "clip_wheel"] } }
          : block,
      ),
    };
    const { container } = renderWorld(
      <StoreWorld
        config={twoClipHero}
        isPreview
        initialStage="world-open"
        pinnedClipId="clip_wheel"
      />,
    );
    const frame = await primeFilm(container);
    expect(
      frame.querySelector<HTMLVideoElement>("video.kol-film-front")?.src,
    ).toContain("/media/ashwork/wheel.mp4");

    cleanup();

    // a pick OUTSIDE the seller's bindings never overrides their authoring
    const { container: unpinned } = renderWorld(
      <StoreWorld
        config={senaStore}
        isPreview
        initialStage="world-open"
        pinnedClipId="clip_wheel"
      />,
    );
    const frame2 = await primeFilm(unpinned);
    expect(
      frame2.querySelector<HTMLVideoElement>("video.kol-film-front")?.src,
    ).toContain("/media/ashwork/intro.mp4");
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
