// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { customStore } from "@/lib/store-config/fixtures/custom";
import type { StoreConfig } from "@/lib/store-config/types";
import { resolveEdgeMs, resolveSwapMs, type FilmEdge } from "../edge-table";
import { FilmLayerProvider, useFilmLayer, type FilmLayerApi } from "../FilmLayer";
import { useFilmSlot } from "../useFilmSlot";

/**
 * The Film Layer's binding AC (CPO wording): "the film frame never
 * unmounts and never shows a paused or black frame." Its load-bearing
 * split: same-source transitions get TRUE element persistence (cross-fade
 * forbidden); source-changing swaps cross-fade in-frame with the incoming
 * buffer at canplay AND playing before the fade. These tests assert (i)
 * film-frame node identity across every transition and (ii) that the
 * visible video element is never paused — deliberately NOT a single
 * <video> node, which the A/B buffers rightly violate.
 */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** A feed card the way B1b will build one: a slot + a claim + a clip. */
function Card({ store, edge }: { store: StoreConfig; edge?: FilmEdge }) {
  const layer = useFilmLayer();
  const { ref, claim } = useFilmSlot();
  const clip = store.media.clips[0];
  if (!clip) throw new Error("fixture store has no clips");
  return (
    <button
      type="button"
      ref={ref}
      data-card={store.storeId}
      onClick={() => {
        claim(edge ?? null);
        layer?.swapClip(clip.src, clip.poster, clip.captionsSrc);
      }}
    >
      {store.maker.displayName}
    </button>
  );
}

/** Grabs the layer api for imperative calls in tests. */
function ApiProbe({ onApi }: { onApi: (api: FilmLayerApi) => void }) {
  const layer = useFilmLayer();
  useEffect(() => {
    if (layer) onApi(layer);
  }, [layer, onApi]);
  return null;
}

function frameOf(container: HTMLElement): HTMLElement {
  const frame = container.querySelector<HTMLElement>("[data-film-layer]");
  expect(frame).not.toBeNull();
  return frame!;
}

function frontVideo(frame: HTMLElement): HTMLVideoElement | null {
  return frame.querySelector<HTMLVideoElement>("video.kol-film-front");
}

/** jsdom fires no media events — report canplay on every layer buffer. */
function reportCanPlay(frame: HTMLElement) {
  for (const video of frame.querySelectorAll("video")) {
    fireEvent(video, new Event("canplay"));
  }
}

async function waitForFrontSrc(frame: HTMLElement, src: string) {
  await waitFor(() => {
    expect(frontVideo(frame)?.getAttribute("src")).toBe(src);
  });
}

function domRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

/** Give the frame a measurable rect derived from its own applied styles. */
function makeFrameMeasurable(frame: HTMLElement) {
  vi.spyOn(frame, "getBoundingClientRect").mockImplementation(() =>
    domRect(
      Number.parseFloat(frame.style.left || "0"),
      Number.parseFloat(frame.style.top || "0"),
      Number.parseFloat(frame.style.width || "0"),
      Number.parseFloat(frame.style.height || "0"),
    ),
  );
}

const REDUCED_MOTION_MEDIA: Pick<
  MediaQueryList,
  "matches" | "media" | "onchange" | "dispatchEvent"
> & {
  addEventListener: () => void;
  removeEventListener: () => void;
  addListener: () => void;
  removeListener: () => void;
} = {
  matches: true,
  media: "(prefers-reduced-motion: reduce)",
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
};

describe("FilmLayer — the persistent film architecture", () => {
  it("the film survives a cross-tree handoff between two different store worlds", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const senaClip = senaStore.media.clips[0];
    const customClip = customStore.media.clips[0];
    if (!senaClip || !customClip) throw new Error("fixtures lost their clips");

    // a feed of two cards from two DIFFERENT store configs — two component
    // trees. THIS is the case the Wave-0 suite could not test.
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} />
        <Card store={customStore} />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);

    // card A claims the film
    fireEvent.click(container.querySelector(`[data-card="${senaStore.storeId}"]`)!);
    reportCanPlay(frame);
    await waitForFrontSrc(frame, senaClip.src);
    const filmA = frontVideo(frame)!;
    expect(playSpy).toHaveBeenCalled();

    // card B — a different store, a different tree — claims the film. The
    // visible film stays A's, playing, until B's buffer canplays AND plays.
    fireEvent.click(container.querySelector(`[data-card="${customStore.storeId}"]`)!);
    expect(frontVideo(frame)).toBe(filmA);
    expect(pauseSpy).not.toHaveBeenCalled();

    reportCanPlay(frame);
    await waitForFrontSrc(frame, customClip.src);

    // the film frame never unmounted and playback never stopped
    expect(container.querySelectorAll("[data-film-layer]")).toHaveLength(1);
    expect(container.querySelector("[data-film-layer]")).toBe(frame);
    expect(frame.isConnected).toBe(true);
    expect(pauseSpy).not.toHaveBeenCalled();
    // the incoming buffer was PLAYING before it became the front
    const lastPlayed = playSpy.mock.instances.at(-1);
    expect(lastPlayed).toBe(frontVideo(frame));
  });

  it("a clip swap never shows a paused or black frame", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const clipA = senaStore.media.clips[0];
    const clipB = senaStore.media.clips[1];
    if (!clipA || !clipB) throw new Error("sena fixture needs two clips");

    let api: FilmLayerApi | null = null;
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} />
        <ApiProbe onApi={(a) => (api = a)} />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);
    fireEvent.click(container.querySelector(`[data-card="${senaStore.storeId}"]`)!);
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipA.src);
    const outgoing = frontVideo(frame)!;

    // swap to clip B: it loads into the INACTIVE buffer…
    act(() => api!.swapClip(clipB.src, clipB.poster, clipB.captionsSrc));
    const incoming = frame.querySelector<HTMLVideoElement>(`video[src="${clipB.src}"]`);
    expect(incoming).not.toBeNull();
    expect(incoming).not.toBe(outgoing);

    // …while the OUTGOING buffer is still the visible film, still playing
    // (no pause), and the poster underlay is B's poster — never black.
    expect(frontVideo(frame)).toBe(outgoing);
    expect(pauseSpy).not.toHaveBeenCalled();
    expect(
      frame.querySelector<HTMLImageElement>("img.kol-film-poster")?.getAttribute("src"),
    ).toBe(clipB.poster);

    // only after canplay does the incoming buffer PLAY and then take the
    // front — the cross-fade begins with both buffers live.
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipB.src);
    expect(playSpy.mock.instances.at(-1)).toBe(incoming);
    // no observable pause at any sampled point of the handoff; the hidden
    // rear buffer is released later, behind an opaque playing front
    expect(pauseSpy).not.toHaveBeenCalled();
    expect(outgoing.isConnected).toBe(true);
  });

  it("reduced motion snaps the rect and keeps the film playing", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue(REDUCED_MOTION_MEDIA),
    );
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const clip = senaStore.media.clips[0];
    if (!clip) throw new Error("fixture store has no clips");

    // two slots, same store, same clip — a pure rect move, no swap
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} />
        <Card store={senaStore} edge="grow" />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);
    const [cardA, cardB] = Array.from(
      container.querySelectorAll<HTMLElement>(`[data-card="${senaStore.storeId}"]`),
    );
    expect(cardA && cardB).toBeTruthy();
    vi.spyOn(cardA!, "getBoundingClientRect").mockReturnValue(domRect(0, 0, 400, 225));
    vi.spyOn(cardB!, "getBoundingClientRect").mockReturnValue(domRect(120, 640, 400, 225));
    makeFrameMeasurable(frame);

    fireEvent.click(cardA!);
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clip.src);
    const film = frontVideo(frame)!;

    // an edge claim under reduced motion: the FLIP skips its invert step —
    // no transform, no transition run at 0.01ms — and SNAPS to the rect
    fireEvent.click(cardB!);
    expect(frame.style.transform).toBe("");
    expect(frame.dataset.filmEdge).toBeUndefined();
    expect(Number.parseFloat(frame.style.top)).toBe(640);
    expect(Number.parseFloat(frame.style.left)).toBe(120);
    // …and the film keeps playing: same visible element, never paused
    expect(frontVideo(frame)).toBe(film);
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it("every edge duration matches the edge table", async () => {
    // §5.2, resolved through the token reader (jsdom falls back to the
    // table values, which are pinned to the CSS below)
    expect(resolveEdgeMs("grow")).toBe(520);
    expect(resolveEdgeMs("ungrow")).toBe(405);
    expect(resolveEdgeMs("unfold")).toBe(900); // hard cap
    expect(resolveEdgeMs("dock")).toBe(440);
    expect(resolveEdgeMs("undock")).toBeCloseTo(343.2, 3); // dock × --return-ratio
    expect(resolveEdgeMs("unfold", { reverse: true })).toBeCloseTo(702, 3);
    expect(resolveSwapMs()).toBe(120);

    // the §5.1 tokens in globals.css agree with the table fallbacks —
    // neither side can drift alone
    // vitest runs with cwd = apps/kol (jsdom import.meta.url is not file:)
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toMatch(/--dur-reveal:\s*520ms/);
    expect(css).toMatch(/--dur-grow:\s*var\(--dur-reveal\)/);
    expect(css).toMatch(/--dur-ungrow:\s*405ms/);
    expect(css).toMatch(/--dur-dock:\s*440ms/);
    expect(css).toMatch(/--dur-swap:\s*120ms/);
    expect(css).toMatch(/--return-ratio:\s*0\.78/);
    expect(css).toMatch(/--z-film:\s*40/);
    expect(css).toMatch(/--dur-unfold:\s*900ms/);

    // and a real claim rides the table: grow runs at 520ms on the frame
    const clip = senaStore.media.clips[0];
    if (!clip) throw new Error("fixture store has no clips");
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} />
        <Card store={senaStore} edge="grow" />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);
    const [cardA, cardB] = Array.from(
      container.querySelectorAll<HTMLElement>(`[data-card="${senaStore.storeId}"]`),
    );
    vi.spyOn(cardA!, "getBoundingClientRect").mockReturnValue(domRect(0, 0, 400, 225));
    vi.spyOn(cardB!, "getBoundingClientRect").mockReturnValue(domRect(120, 640, 400, 225));
    makeFrameMeasurable(frame);

    fireEvent.click(cardA!);
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clip.src);
    fireEvent.click(cardB!);
    expect(frame.dataset.filmEdge).toBe("grow");
    expect(frame.dataset.filmEdgeMs).toBe("520");
    // FLIP released: layout landed on the new rect, transform back to none
    expect(frame.style.transform).toBe("");
    expect(Number.parseFloat(frame.style.top)).toBe(640);
  });
});
