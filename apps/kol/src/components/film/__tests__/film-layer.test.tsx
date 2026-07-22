// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { customStore } from "@/lib/store-config/fixtures/custom";
import type { Clip, StoreConfig } from "@/lib/store-config/types";
import { resolveEdgeMs, resolveSwapMs, type FilmEdge } from "../edge-table";
import { bufferFadeMs, FilmLayerProvider, useFilmLayer, type FilmLayerApi } from "../FilmLayer";
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
        layer?.swapClip(clip);
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

/**
 * Record every value written to style.transform (any element). The FLIP's
 * invert transform is applied and released within one synchronous claim,
 * so asserting the final style can't see it — this pins the actual delta.
 */
function captureTransforms(sample: HTMLElement): { values: string[]; restore: () => void } {
  const proto = Object.getPrototypeOf(sample.style) as CSSStyleDeclaration;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "transform");
  if (!descriptor?.set) throw new Error("jsdom style prototype lost its transform accessor");
  const values: string[] = [];
  Object.defineProperty(proto, "transform", {
    ...descriptor,
    set(value: string) {
      values.push(String(value));
      descriptor.set!.call(this, value);
    },
  });
  return { values, restore: () => Object.defineProperty(proto, "transform", descriptor) };
}

/** A distinct clip derived from the sena fixture — unique src per name. */
function makeClip(name: string, focalPoint?: { x: number; y: number }): Clip {
  const base = senaStore.media.clips[0];
  if (!base) throw new Error("fixture store has no clips");
  return {
    ...base,
    id: `c_${name}`,
    src: `/films/${name}.mp4`,
    poster: `/stills/${name}.jpg`,
    ...(focalPoint ? { focalPoint } : {}),
  };
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
    act(() => api!.swapClip(clipB));
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

  it("a SAME-slot claim with a changed rect animates the real delta (zero-delta regression)", async () => {
    // grow, unfold, ungrow and the derived 702ms reverse all re-claim the
    // slot they already hold with a new rect. Gate-1 P1: publish-then-claim
    // snapped the frame first, so first === last and the edge moved nothing
    // while data-film-edge still claimed it ran. Both prior FLIP tests used
    // two different slots — this is the case they missed.
    const clip = senaStore.media.clips[0];
    if (!clip) throw new Error("fixture store has no clips");
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} edge="grow" />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);
    const card = container.querySelector<HTMLElement>(`[data-card="${senaStore.storeId}"]`)!;
    const cardRect = vi
      .spyOn(card, "getBoundingClientRect")
      .mockReturnValue(domRect(0, 0, 400, 225));
    makeFrameMeasurable(frame);

    // first claim parks→snaps the frame onto the card rect
    fireEvent.click(card);
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clip.src);
    expect(Number.parseFloat(frame.style.left)).toBe(0);

    // the SAME slot re-claims after its rect changed (B2's grow surface)
    cardRect.mockReturnValue(domRect(120, 640, 640, 360));
    const capture = captureTransforms(frame);
    try {
      fireEvent.click(card);
    } finally {
      capture.restore();
    }
    // the invert transform carried the REAL displacement…
    expect(capture.values).toContain("translate(-120px, -640px) scale(0.625, 0.625)");
    // …the observable record exists only beside that non-identity invert…
    expect(frame.dataset.filmEdge).toBe("grow");
    expect(frame.dataset.filmEdgeMs).toBe("520");
    // …and the FLIP released onto the new rect
    expect(frame.style.transform).toBe("");
    expect(Number.parseFloat(frame.style.left)).toBe(120);
    expect(Number.parseFloat(frame.style.top)).toBe(640);
  });

  it("a same-RECT re-claim is a non-event: no data-film-edge, no invert transform", async () => {
    const clip = senaStore.media.clips[0];
    if (!clip) throw new Error("fixture store has no clips");
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} edge="grow" />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);
    const card = container.querySelector<HTMLElement>(`[data-card="${senaStore.storeId}"]`)!;
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue(domRect(0, 0, 400, 225));
    makeFrameMeasurable(frame);
    fireEvent.click(card);
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clip.src);

    // rect unchanged — the identity gate must refuse the observable record
    const capture = captureTransforms(frame);
    try {
      fireEvent.click(card);
    } finally {
      capture.restore();
    }
    expect(frame.dataset.filmEdge).toBeUndefined();
    expect(frame.dataset.filmEdgeMs).toBeUndefined();
    expect(capture.values.filter((value) => value.startsWith("translate"))).toEqual([]);
  });

  it("rect maintenance mid-FLIP defers and lands as a snap on transitionend", async () => {
    const clip = senaStore.media.clips[0];
    if (!clip) throw new Error("fixture store has no clips");
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} edge="grow" />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);
    const card = container.querySelector<HTMLElement>(`[data-card="${senaStore.storeId}"]`)!;
    const cardRect = vi
      .spyOn(card, "getBoundingClientRect")
      .mockReturnValue(domRect(0, 0, 400, 225));
    makeFrameMeasurable(frame);
    fireEvent.click(card);
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clip.src);

    cardRect.mockReturnValue(domRect(120, 640, 640, 360));
    fireEvent.click(card); // grow FLIP in flight for 520ms
    expect(frame.dataset.filmEdge).toBe("grow");

    // a document-height shift republishes the live slot mid-flight (the
    // body-ResizeObserver path rides the same publish) — must NOT teleport
    cardRect.mockReturnValue(domRect(200, 900, 640, 360));
    fireEvent(window, new Event("resize"));
    expect(Number.parseFloat(frame.style.left)).toBe(120); // still the claim target
    expect(Number.parseFloat(frame.style.top)).toBe(640);

    // flight ends → deferred maintenance lands as a snap, not an edge
    fireEvent(frame, new Event("transitionend"));
    expect(Number.parseFloat(frame.style.left)).toBe(200);
    expect(Number.parseFloat(frame.style.top)).toBe(900);
    expect(frame.dataset.filmEdge).toBeUndefined();
  });

  it("focalPoint crops BOTH buffers and the poster underlay through swapClip", async () => {
    // CPO Ruling 3's production path: every world mounts FilmLayerProvider,
    // so the crop must land on the layer's A/B buffers — self-mode coverage
    // proved nothing here (gate-1 P1 focalPoint void).
    const clipF = makeClip("focal-f", { x: 0.2, y: 0.15 });
    const clipG = makeClip("focal-g", { x: 0.8, y: 0.9 });
    let api: FilmLayerApi | null = null;
    const { container } = render(
      <FilmLayerProvider>
        <ApiProbe onApi={(a) => (api = a)} />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);

    act(() => api!.swapClip(clipF));
    expect(
      frame.querySelector<HTMLImageElement>("img.kol-film-poster")?.style.objectPosition,
    ).toBe("20% 15%");
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipF.src);
    expect(frontVideo(frame)!.style.objectPosition).toBe("20% 15%");

    act(() => api!.swapClip(clipG));
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipG.src);
    // the OTHER buffer of the A/B pair — both sides carry the crop
    expect(frontVideo(frame)!.style.objectPosition).toBe("80% 90%");
    expect(
      frame.querySelector<HTMLImageElement>("img.kol-film-poster")?.style.objectPosition,
    ).toBe("80% 90%");
  });

  it("a swap mid-cross-fade defers (latest wins) and never mutates the visible fading buffer", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const pauseSpy = vi.spyOn(window.HTMLMediaElement.prototype, "pause");
    const clipA = makeClip("fade-a");
    const clipB = makeClip("fade-b");
    const clipC = makeClip("fade-c");
    const clipD = makeClip("fade-d");
    let api: FilmLayerApi | null = null;
    const { container } = render(
      <FilmLayerProvider>
        <ApiProbe onApi={(a) => (api = a)} />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);

    act(() => api!.swapClip(clipA));
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipA.src);
    act(() => api!.swapClip(clipB));
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipB.src);
    // the A→B cross-fade is now in flight; A's buffer is VISIBLY fading out
    const rear = frame.querySelector<HTMLVideoElement>(`video[src="${clipA.src}"]`)!;
    expect(rear).not.toBeNull();

    // 4a: a swap arriving mid-fade would reuse the fading-out buffer —
    // mutating its src runs the media load algorithm on a visible frame
    act(() => api!.swapClip(clipC));
    expect(frame.querySelector(`video[src="${clipC.src}"]`)).toBeNull();
    expect(rear.getAttribute("src")).toBe(clipA.src);
    // no pause has hit anything while the fade still runs
    expect(pauseSpy).not.toHaveBeenCalled();

    // latest wins: a newer request replaces the queued one outright
    act(() => api!.swapClip(clipD));

    // the fade completes → the rear releases, and ONLY the rear
    fireEvent(rear, new Event("transitionend"));
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(pauseSpy.mock.instances[0]).toBe(rear);
    // …and the deferred swap runs: D loads into the now-hidden buffer, C never existed
    expect(frame.querySelector(`video[src="${clipC.src}"]`)).toBeNull();
    const incoming = frame.querySelector<HTMLVideoElement>(`video[src="${clipD.src}"]`);
    expect(incoming).toBe(rear);

    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipD.src);
    // the promoted front was PLAYING and no stale pause ever hit it
    expect(playSpy.mock.instances.at(-1)).toBe(incoming);
    expect(pauseSpy).toHaveBeenCalledTimes(1);
  });

  it("a same-source swap never touches the inactive buffer (the forbidden buffer-flip restart)", async () => {
    const clipA = makeClip("same-src");
    let api: FilmLayerApi | null = null;
    const { container } = render(
      <FilmLayerProvider>
        <ApiProbe onApi={(a) => (api = a)} />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);
    act(() => api!.swapClip(clipA));
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clipA.src);
    const front = frontVideo(frame)!;
    const rear = Array.from(frame.querySelectorAll("video")).find((video) => video !== front)!;

    // a same-source claim+swap (every stage edge does this) must be a
    // no-op on the buffers: true element persistence, no reload
    act(() => api!.swapClip(clipA));
    expect(rear.hasAttribute("src")).toBe(false); // the inactive buffer NEVER loaded
    expect(frame.querySelectorAll(`video[src="${clipA.src}"]`)).toHaveLength(1);
    expect(frontVideo(frame)).toBe(front);
  });

  it("bufferFadeMs derives from the COMPUTED transition, with the token as fallback", () => {
    // reduced motion stretches the buffer fade to --dur-state (200ms) via
    // globals.css — a token-only --dur-swap read would under-wait and
    // collapse the pause margin to ~0 (gate-1 4b)
    const video = document.createElement("video");
    const computed = (transitionDuration: string) =>
      ({ transitionDuration, getPropertyValue: () => "" }) as unknown as CSSStyleDeclaration;
    vi.stubGlobal("getComputedStyle", vi.fn().mockReturnValue(computed("0.2s")));
    expect(bufferFadeMs(video)).toBe(200);
    vi.stubGlobal("getComputedStyle", vi.fn().mockReturnValue(computed("120ms, 0.34s")));
    expect(bufferFadeMs(video)).toBe(340); // longest of a list
    vi.stubGlobal("getComputedStyle", vi.fn().mockReturnValue(computed("")));
    expect(bufferFadeMs(video)).toBe(120); // --dur-swap token (jsdom/SSR)
  });

  it("visibilitychange resumes a tab-hidden front, veto-safely — parked frames stay parked", async () => {
    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, "play");
    const clip = senaStore.media.clips[0];
    if (!clip) throw new Error("fixture store has no clips");
    let api: FilmLayerApi | null = null;
    const { container } = render(
      <FilmLayerProvider>
        <Card store={senaStore} />
        <ApiProbe onApi={(a) => (api = a)} />
      </FilmLayerProvider>,
    );
    const frame = frameOf(container);

    // load a clip WITHOUT any claim: the layer is parked (hidden)
    act(() => api!.swapClip(clip));
    reportCanPlay(frame);
    await waitForFrontSrc(frame, clip.src);
    const film = frontVideo(frame)!;

    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    playSpy.mockClear();
    fireEvent(document, new Event("visibilitychange"));
    expect(playSpy).not.toHaveBeenCalled(); // parked frames stay parked

    // a claim brings the film live — now a tab return resumes the front
    // (jsdom media is always `paused`, standing in for the mobile tab-hide)
    fireEvent.click(container.querySelector(`[data-card="${senaStore.storeId}"]`)!);
    playSpy.mockClear();
    fireEvent(document, new Event("visibilitychange"));
    expect(playSpy).toHaveBeenCalled();
    expect(playSpy.mock.instances.at(-1)).toBe(film);

    // veto-safe: a rejected play() must not throw or raise error chrome
    playSpy.mockImplementationOnce(() => Promise.reject(new Error("autoplay veto")));
    fireEvent(document, new Event("visibilitychange"));
    await waitFor(() => {
      expect(frame.querySelector(".kol-film-front")).not.toBeNull();
    });

    // hidden tabs never resume
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    playSpy.mockClear();
    fireEvent(document, new Event("visibilitychange"));
    expect(playSpy).not.toHaveBeenCalled();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("the stacking contract: bed < chrome < docked, wired to the layer and the hero stage", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const bed = Number(/--z-film-bed:\s*(\d+)/.exec(css)?.[1]);
    const chrome = Number(/--z-film-chrome:\s*(\d+)/.exec(css)?.[1]);
    const film = Number(/--z-film:\s*(\d+)/.exec(css)?.[1]);
    expect(bed).toBe(30);
    expect(chrome).toBe(35);
    expect(film).toBe(40);
    // the ORDER is the contract: film below chrome undocked, above it docked
    expect(bed).toBeLessThan(chrome);
    expect(chrome).toBeLessThan(film);
    // the layer rides the bed plane undocked and the film plane docked…
    expect(css).toMatch(/\.kol-film-layer\s*\{[^}]*z-index:\s*var\(--z-film-bed\)/);
    expect(css).toMatch(/\.kol-film-layer\[data-film-docked\]\s*\{[^}]*z-index:\s*var\(--z-film\)/);
    // …and the hero stage lifts its chrome (heading/craft/scrim) over the bed
    expect(css).toMatch(/\.kol-hero-stage\s*\{[^}]*z-index:\s*var\(--z-film-chrome\)/);
  });
});
