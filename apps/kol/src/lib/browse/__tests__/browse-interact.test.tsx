// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilmLayerProvider } from "@/components/film/FilmLayer";
import { StoreWorld } from "@/lib/renderer/StoreWorld";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { SWAP_MIN_INTERVAL_MS, type BrowseClipResult } from "../contract";
import { selectBrowseClip } from "../select-browse-clip";

/**
 * B4 — WORLD_BROWSE: the world interacts live while the persistent film
 * keeps playing, and clip swaps are SCORING-DRIVEN, never random.
 *
 * Asserted against the FILM LAYER, never a single <video> node (the A/B
 * buffers use two by design — binding AC, CPO ruling). What this suite
 * pins:
 *  - a block boundary + the 12 s floor trigger an ENGINE selection (the
 *    mocked server action is the only clip source; Math.random is never
 *    consulted anywhere on the path);
 *  - the swap lands as an in-frame buffer cross-fade — same frame node,
 *    never remounted, never error chrome;
 *  - an empty selection keeps the current clip (graceful, §4.4);
 *  - product click = the B5 handoff (NARRATE_SHRINK + data-selected-product)
 *    and never pauses the film;
 *  - WORLD_OPEN → WORLD_BROWSE is a scroll, not an event;
 *  - per-block states hold in browse: error degrades inline, empty optional
 *    blocks are OMITTED, the rest of the world stays usable;
 *  - reduced motion: supporting reels go static, the persistent film does not.
 */

vi.mock("../select-browse-clip", () => ({
  selectBrowseClip: vi.fn(),
}));
const selectBrowseClipMock = vi.mocked(selectBrowseClip);

// --- controllable IntersectionObserver ------------------------------------

interface IORecord {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  instance: IntersectionObserver;
}
let observers: IORecord[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[] = [];
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.rootMargin = options?.rootMargin ?? "0px";
    observers.push({ callback, options, instance: this });
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/** The controller's midline band is its signature among the page's IOs. */
const MIDLINE_MARGIN = "-50% 0px -50% 0px";

function crossMidline(target: Element) {
  const record = observers.find((o) => o.options?.rootMargin === MIDLINE_MARGIN);
  expect(record).toBeDefined();
  act(() => {
    record!.callback(
      [{ target, isIntersecting: true } as IntersectionObserverEntry],
      record!.instance,
    );
  });
}

// --- shared rig ------------------------------------------------------------

let now = 1_000_000;

beforeEach(() => {
  now = 1_000_000;
  observers = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  vi.spyOn(Date, "now").mockImplementation(() => now);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  selectBrowseClipMock.mockReset();
});

/** Mount the LIVE world (sena is published — no preview rail, no fixture UI). */
function renderBrowsingWorld(
  props: Partial<Parameters<typeof StoreWorld>[0]> = {},
) {
  return render(
    <FilmLayerProvider>
      <StoreWorld config={senaStore} initialStage="world-browse" {...props} />
    </FilmLayerProvider>,
  );
}

/** jsdom never fires media events — report canplay so pending swaps promote. */
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

const wheel = senaStore.media.clips.find((clip) => clip.id === "clip_wheel")!;

describe("B4 — store scroll & interact (WORLD_BROWSE)", () => {
  it("swaps to the ENGINE's clip at a block boundary — in-frame cross-fade, same frame, never random", async () => {
    const randomSpy = vi.spyOn(Math, "random");
    selectBrowseClipMock.mockResolvedValue({
      videoId: wheel.id,
      src: wheel.src,
      poster: wheel.poster,
      captionsSrc: wheel.captionsSrc,
    });

    const { container } = renderBrowsingWorld();
    const frame = await primeFilm(container);
    expect(frame.querySelector(".kol-film-front")?.getAttribute("src")).toBe(
      "/media/ashwork/intro.mp4",
    );
    // the reel's own scroll gate exists alongside the shared film
    expect(observers.some((o) => o.options?.threshold === 0.5)).toBe(true);

    now += SWAP_MIN_INTERVAL_MS + 1;
    const section = container.querySelector(".kol-world-body > *")!;
    crossMidline(section);

    // the engine action — scoped to this store — is the ONLY clip source
    await waitFor(() => {
      expect(selectBrowseClipMock).toHaveBeenCalledWith(senaStore.storeId);
    });
    // the INACTIVE buffer loads the clip; report canplay so it promotes
    await waitFor(() => {
      expect(
        [...frame.querySelectorAll("video")].some(
          (video) => video.getAttribute("src") === wheel.src,
        ),
      ).toBe(true);
    });
    for (const video of frame.querySelectorAll("video")) {
      fireEvent(video, new Event("canplay"));
    }
    await waitFor(() => {
      expect(frame.querySelector(".kol-film-front")?.getAttribute("src")).toBe(wheel.src);
    });

    // ONE film frame, the SAME node — the swap crossed buffers INSIDE it
    expect(container.querySelectorAll("[data-film-layer]")).toHaveLength(1);
    expect(container.querySelector("[data-film-layer]")).toBe(frame);
    // scoring-driven, never random (AC — QA also greps the diff)
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it("floors swaps at 12 s and fires only when a NEW block crosses the midline", async () => {
    selectBrowseClipMock.mockResolvedValue(null);
    const { container } = renderBrowsingWorld();
    await primeFilm(container);
    const sections = container.querySelectorAll(".kol-world-body > *");
    expect(sections.length).toBeGreaterThan(2);

    now += SWAP_MIN_INTERVAL_MS + 1;
    crossMidline(sections[0]!);
    await waitFor(() => expect(selectBrowseClipMock).toHaveBeenCalledTimes(1));

    // inside the floor: a new block crossing is seen but consumed silently
    crossMidline(sections[1]!);
    expect(selectBrowseClipMock).toHaveBeenCalledTimes(1);

    now += SWAP_MIN_INTERVAL_MS + 1;
    // same block again — dwelling is not a new boundary
    crossMidline(sections[1]!);
    expect(selectBrowseClipMock).toHaveBeenCalledTimes(1);
    // a genuinely new crossing past the floor fires
    crossMidline(sections[2]!);
    await waitFor(() => expect(selectBrowseClipMock).toHaveBeenCalledTimes(2));
  });

  it("the 12 s floor runs from MOUNT — a boundary crossed during the opening clip is consumed, not swapped", async () => {
    selectBrowseClipMock.mockResolvedValue(null);
    const { container } = renderBrowsingWorld();
    await primeFilm(container);
    const sections = container.querySelectorAll(".kol-world-body > *");

    // NO clock advance: mount is attempt zero — the maker finishes the
    // opening clip's first breath before changing subject (§4.2). Every
    // other test here advances past the floor first, which is exactly why
    // this line was never load-bearing before.
    crossMidline(sections[0]!);
    expect(selectBrowseClipMock).not.toHaveBeenCalled();

    // past the floor a NEW boundary fires — the mount floor delays the
    // first swap, it doesn't eat the mechanism
    now += SWAP_MIN_INTERVAL_MS + 1;
    crossMidline(sections[1]!);
    await waitFor(() => expect(selectBrowseClipMock).toHaveBeenCalledTimes(1));
  });

  it("prefers the CONFIG clip over the engine payload — focalPoint rides the swap (CPO Ruling 3)", async () => {
    // the engine view-model has no focalPoint field by design; only the
    // config clip carries the crop (they meet at videos.id, §B0). The mock
    // returns the SAME src either way — the crop landing on the buffer and
    // the poster underlay is the observable that pins the preference.
    const focalSena = {
      ...senaStore,
      media: {
        ...senaStore.media,
        clips: senaStore.media.clips.map((clip) =>
          clip.id === wheel.id ? { ...clip, focalPoint: { x: 0.2, y: 0.8 } } : clip,
        ),
      },
    };
    selectBrowseClipMock.mockResolvedValue({
      videoId: wheel.id,
      src: wheel.src,
      poster: wheel.poster,
      captionsSrc: null, // engine payload deliberately leaner than the config clip
    });
    const { container } = renderBrowsingWorld({ config: focalSena });
    const frame = await primeFilm(container);

    now += SWAP_MIN_INTERVAL_MS + 1;
    crossMidline(container.querySelector(".kol-world-body > *")!);
    await waitFor(() => {
      expect(
        [...frame.querySelectorAll("video")].some(
          (video) => video.getAttribute("src") === wheel.src,
        ),
      ).toBe(true);
    });

    const incoming = [...frame.querySelectorAll("video")].find(
      (video) => video.getAttribute("src") === wheel.src,
    )!;
    expect(incoming.style.objectPosition).toBe("20% 80%");
    expect(
      frame.querySelector<HTMLImageElement>("img.kol-film-poster")?.style.objectPosition,
    ).toBe("20% 80%");
  });

  it("fallback chain tail: posterless off-config selection keeps the current clip; engine src/poster swaps when unmirrored", async () => {
    selectBrowseClipMock
      .mockResolvedValueOnce({
        videoId: "v_offconfig_bare",
        src: "/media/engine/offconfig-bare.mp4",
        poster: null, // the layer's poster-first contract has nothing to stand on
        captionsSrc: null,
      })
      .mockResolvedValueOnce({
        videoId: "v_offconfig_postered",
        src: "/media/engine/offconfig-postered.mp4",
        poster: "/media/engine/offconfig-postered.jpg",
        captionsSrc: null,
      });
    const { container } = renderBrowsingWorld();
    const frame = await primeFilm(container);
    const sections = container.querySelectorAll(".kol-world-body > *");

    // leg 1 — off-config AND posterless → keep the current clip, quietly
    now += SWAP_MIN_INTERVAL_MS + 1;
    crossMidline(sections[0]!);
    await waitFor(() => expect(selectBrowseClipMock).toHaveBeenCalledTimes(1));
    await act(async () => {}); // let the selection settle
    expect(
      [...frame.querySelectorAll("video")].some((video) =>
        (video.getAttribute("src") ?? "").includes("offconfig-bare"),
      ),
    ).toBe(false);
    expect(frame.querySelector(".kol-film-front")?.getAttribute("src")).toBe(
      "/media/ashwork/intro.mp4",
    );
    expect(frame.textContent).not.toMatch(/Couldn.t load this clip/);

    // leg 2 — off-config WITH a poster → the engine view-model swaps whole
    now += SWAP_MIN_INTERVAL_MS + 1;
    crossMidline(sections[1]!);
    await waitFor(() => {
      expect(
        [...frame.querySelectorAll("video")].some(
          (video) => video.getAttribute("src") === "/media/engine/offconfig-postered.mp4",
        ),
      ).toBe(true);
    });
    // poster-first: the underlay is already the incoming clip's poster
    expect(
      frame.querySelector<HTMLImageElement>("img.kol-film-poster")?.getAttribute("src"),
    ).toBe("/media/engine/offconfig-postered.jpg");
    for (const video of frame.querySelectorAll("video")) {
      fireEvent(video, new Event("canplay"));
    }
    await waitFor(() => {
      expect(frame.querySelector(".kol-film-front")?.getAttribute("src")).toBe(
        "/media/engine/offconfig-postered.mp4",
      );
    });
  });

  it("a LATE selection landing after the buyer docked is DISCARDED — never change the subject under B5", async () => {
    let resolveLate: ((value: BrowseClipResult) => void) | undefined;
    selectBrowseClipMock.mockImplementation(
      () =>
        new Promise<BrowseClipResult>((resolve) => {
          resolveLate = resolve;
        }),
    );
    const { container, getByRole } = renderBrowsingWorld();
    const frame = await primeFilm(container);

    now += SWAP_MIN_INTERVAL_MS + 1;
    crossMidline(container.querySelector(".kol-world-body > *")!);
    expect(selectBrowseClipMock).toHaveBeenCalledTimes(1); // in flight…

    // …and while it's pending the buyer goes deeper: WORLD_BROWSE ends
    fireEvent.click(getByRole("button", { name: /Ridge Tumbler/i }));
    expect(
      container.querySelector("[data-world-stage]")?.getAttribute("data-world-stage"),
    ).toBe("narrate-shrink");

    // the response lands late — a valid, config-mirrored clip
    await act(async () => {
      resolveLate!({
        videoId: wheel.id,
        src: wheel.src,
        poster: wheel.poster,
        captionsSrc: wheel.captionsSrc,
      });
    });

    // discarded: no buffer ever loads it; the docked film plays on unchanged
    expect(
      [...frame.querySelectorAll("video")].some(
        (video) => video.getAttribute("src") === wheel.src,
      ),
    ).toBe(false);
    expect(frame.querySelector(".kol-film-front")?.getAttribute("src")).toBe(
      "/media/ashwork/intro.mp4",
    );
  });

  it("keeps the current clip when nothing is eligible — graceful, no error chrome", async () => {
    selectBrowseClipMock.mockResolvedValue(null);
    const { container } = renderBrowsingWorld();
    const frame = await primeFilm(container);

    now += SWAP_MIN_INTERVAL_MS + 1;
    crossMidline(container.querySelector(".kol-world-body > *")!);
    await waitFor(() => expect(selectBrowseClipMock).toHaveBeenCalledTimes(1));

    expect(frame.querySelector(".kol-film-front")?.getAttribute("src")).toBe(
      "/media/ashwork/intro.mp4",
    );
    // no failure chrome, no poster regression — the film simply plays on
    expect(frame.textContent).not.toMatch(/Couldn.t load this clip/);
  });

  it("product click hands off to NARRATE_SHRINK (B5) and NEVER pauses the film", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const { container, getByRole } = renderBrowsingWorld();
    const frame = await primeFilm(container);
    const film = frame.querySelector(".kol-film-front");

    fireEvent.click(getByRole("button", { name: /Ridge Tumbler/i }));

    const root = container.querySelector("[data-world-stage]")!;
    expect(root.getAttribute("data-world-stage")).toBe("narrate-shrink");
    // the B5 handoff: which product the buyer went deeper on
    expect(root.getAttribute("data-selected-product")).toBe("p_ridge_tumbler");
    // the film docked (Film Layer's edge) — same frame, same visible
    // element, and pause was never called by the interaction
    expect(container.querySelector("[data-film-layer]")).toBe(frame);
    expect(frame.getAttribute("data-film-docked")).toBe("true");
    expect(frame.querySelector(".kol-film-front")).toBe(film);
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("advances WORLD_OPEN → WORLD_BROWSE on the first scroll — a scroll, not an event", async () => {
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const { container } = renderBrowsingWorld({ initialStage: "world-open" });
    await primeFilm(container);

    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        container.querySelector("[data-world-stage]")?.getAttribute("data-world-stage"),
      ).toBe("world-browse");
    });
    // edge-less by design (stage-edges.ts): the film neither moves nor pauses
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("per-block states hold in browse: error degrades inline, empty optional blocks are OMITTED", async () => {
    const { container, queryByText, getByText } = renderBrowsingWorld({
      blockStates: { b_show: "error", b_proc: "empty" },
    });
    const frame = await primeFilm(container);

    // error: quiet + inline, the rest of the world stays usable
    expect(getByText(/Couldn.t load these pieces/)).toBeTruthy();
    // empty: the process reel is OMITTED from the live render — no caption,
    // no seller-preview ghost prompt, no blank band
    expect(queryByText("One tumbler, start to trim")).toBeNull();
    expect(queryByText("Show the making")).toBeNull();
    // the world around them is alive: quote renders, film still fronted
    expect(getByText(/The wheel leaves a mark\. I leave it in\./)).toBeTruthy();
    expect(frame.querySelector(".kol-film-front")).not.toBeNull();
  });

  it("prefers-reduced-motion: supporting reels go STATIC while the persistent film keeps playing", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }));

    const { container } = renderBrowsingWorld();
    const frame = await primeFilm(container);

    // the process-reel's scroll-gate observer is never even created — its
    // video stays on the poster (static), by design not by accident
    expect(observers.some((o) => o.options?.threshold === 0.5)).toBe(false);
    // playback continuity preserved: the shared film is content, not
    // decoration — it fronts and plays regardless of reduced motion
    expect(frame.querySelector(".kol-film-front")).not.toBeNull();
  });
});
