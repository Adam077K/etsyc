"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ASPECT_EPSILON, startAspectCounter } from "@/components/film/aspect-counter";
import { resolveEdgeMs } from "@/components/film/edge-table";
import { useFilmLayer, type FilmClipSource } from "@/components/film/FilmLayer";
import { useFilmSlot } from "@/components/film/useFilmSlot";
import { clipObjectPosition } from "@/components/media/focal-point";
import { ErrorInline } from "@/components/states/ErrorInline";
import { Skeleton } from "@/components/states/Skeleton";
import type { GrownSelection } from "@/lib/grow/types";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "./motion";
import type { GrowSource } from "./types";

/**
 * The GROWN centre column (screen-specs §2) — a column, not a modal: the
 * buyer has leaned in, not left the feed. The film window is TRANSPARENT;
 * the app-root Film Layer rides beneath it on the --z-film-bed plane and
 * this column's chrome (name, craft line, scrim, shadow) reads over the
 * film from --z-film-chrome, exactly the way .kol-hero-stage lifts its
 * chrome (stacking contract, globals.css). The column never mounts, moves
 * or remounts a <video> — it publishes rects and claims the `grow` edge.
 *
 * Empty state is N/A by construction — GROWN is only reachable from a
 * real tapped card (grow-interaction spec §UX Edge Cases); nothing is
 * fabricated for it.
 */

export function GrownColumn({
  source,
  leaving,
  selection,
  sourceElement,
  onAdvance,
  onColumnReady,
  onRetrySelection,
}: {
  source: GrowSource;
  /** Ungrow in progress — chrome leaves first, film FLIPs back after (§2.5). */
  leaving: boolean;
  selection: GrownSelection | null;
  sourceElement: HTMLElement | null;
  onAdvance: () => void;
  onColumnReady: (rect: { left: number; top: number; width: number; height: number }) => void;
  onRetrySelection: () => void;
}) {
  const layer = useFilmLayer();
  const columnSlot = useFilmSlot({ fixed: true });
  const sectionRef = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const reduced = prefersReducedMotion();

  // image path — "meet the person": the portrait holds the column until
  // the buyer opts into the film; then the slot is handed to the Film
  // Layer and the state becomes a normal GROWN (§2.3 — a doorway, not a
  // parallel branch).
  const [watching, setWatching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // playback is DERIVED: event reports are keyed by src, so a retry or a
  // clip change falls back to "loading" without an imperative reset
  const [live, setLive] = useState<{ src: string; state: "playing" | "failed" } | null>(null);
  const [entered, setEntered] = useState(false);

  const slotRef = columnSlot.ref;
  const windowRefCallback = useCallback(
    (element: HTMLDivElement | null) => {
      windowRef.current = element;
      slotRef(element);
    },
    [slotRef],
  );

  /** The clip the film frame should be playing right now, if any. */
  const activeClip = useMemo<FilmClipSource | null>(() => {
    if (source.kind === "video") {
      return {
        src: withRetryParam(source.src, retryCount),
        poster: source.poster,
        captionsSrc: source.captionsSrc ?? null,
        ...(source.focalPoint ? { focalPoint: source.focalPoint } : {}),
      };
    }
    if (watching && selection?.status === "success" && selection.grown) {
      return {
        src: withRetryParam(selection.grown.src, retryCount),
        // poster continuity: fall back to the portrait so the swap's
        // underlay is the face the buyer is already looking at
        poster: selection.grown.poster ?? source.poster,
        captionsSrc: selection.grown.captionsSrc,
      };
    }
    return null;
  }, [source, watching, selection, retryCount]);

  // ---- claim the grow edge (video path) -------------------------------
  // The fresh column rect rides WITH the claim (atomic measure→FLIP inside
  // the layer); the frame FLIPs from wherever it sits — the tapped card
  // under the Focus Film model — to this window on §5.2 `grow`.
  useLayoutEffect(() => {
    if (source.kind !== "video") return;
    columnSlot.claim("grow");
    // parting rides the same beat; the band includes the affordance line
    const el = windowRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      onColumnReady({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per source; claim/onColumnReady are stable
  }, [source]);

  // ---- image path entrance: FLIP the portrait window from the card ----
  // No playback continuity constraint here (a still), so B2 runs its own
  // transform-only FLIP on the SAME tokens — with the same G1-F2 aspect
  // counter so the face never smears when 4:5 grows into 16:9.
  useLayoutEffect(() => {
    if (source.kind !== "image") return;
    const el = windowRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      onColumnReady({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    }
    if (reduced || !el || !sourceElement) return;
    const first = sourceElement.getBoundingClientRect();
    const last = el.getBoundingClientRect();
    if (first.width <= 0 || first.height <= 0 || last.width <= 0 || last.height <= 0) return;
    const dx = first.left - last.left;
    const dy = first.top - last.top;
    const sx = first.width / last.width;
    const sy = first.height / last.height;
    el.style.transformOrigin = "0 0";
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    void el.getBoundingClientRect();
    el.style.transition = "transform var(--dur-grow) var(--ease-kol)";
    el.style.transform = "";
    const stop =
      Math.abs(sx / sy - 1) >= ASPECT_EPSILON
        ? startAspectCounter(el, "[data-grow-portrait]")
        : null;
    const timer = window.setTimeout(() => {
      stop?.();
      el.style.removeProperty("transition");
      el.style.removeProperty("transform-origin");
    }, resolveEdgeMs("grow") + 120);
    return () => {
      window.clearTimeout(timer);
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entrance runs once per source
  }, [source]);

  // ---- hand the slot to the Film Layer when the portrait CTA fires ----
  // §2.3: a SNAP claim (no FLIP — the frame may be parked or elsewhere)
  // and the in-frame --dur-swap cross-fade is the whole motion.
  const slotClaim = columnSlot.claim;
  useEffect(() => {
    if (!watching) return;
    slotClaim(null);
  }, [watching, slotClaim]);

  // ---- drive the frame's clip ------------------------------------------
  // Same-source grows are a no-op inside swapClip (the binding AC's first
  // half); a non-focus or image-path grow cross-fades in-frame.
  useEffect(() => {
    if (!layer || activeClip === null) return;
    layer.swapClip(activeClip);
  }, [layer, activeClip]);

  // ---- playback status, read off the layer's OWN media events ---------
  // The layer exposes no playback state by design; media events don't
  // bubble, so listen in capture. Loading and error are per the spec:
  // poster + shimmer edge (never a spinner), then quiet inline retry.
  const activeSrc = activeClip?.src ?? null;
  const playback: "loading" | "playing" | "failed" =
    activeSrc !== null && live?.src === activeSrc ? live.state : "loading";
  useEffect(() => {
    if (activeSrc === null) return;
    const inLayer = (target: EventTarget | null): target is HTMLVideoElement =>
      target instanceof HTMLVideoElement &&
      target.closest("[data-film-layer]") !== null &&
      target.getAttribute("src") === activeSrc;
    const onPlaying = (event: Event) => {
      if (inLayer(event.target)) setLive({ src: activeSrc, state: "playing" });
    };
    const onError = (event: Event) => {
      if (inLayer(event.target)) setLive({ src: activeSrc, state: "failed" });
    };
    // already live (focus-card grow): the front buffer is this clip and
    // playing — sampled a frame later so state stays event-driven
    const raf = requestAnimationFrame(() => {
      const front = document.querySelector<HTMLVideoElement>(
        "[data-film-layer] video.kol-film-front",
      );
      if (front && front.getAttribute("src") === activeSrc && !front.paused) {
        setLive({ src: activeSrc, state: "playing" });
      }
    });
    document.addEventListener("playing", onPlaying, true);
    document.addEventListener("error", onError, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("playing", onPlaying, true);
      document.removeEventListener("error", onError, true);
    };
  }, [activeSrc]);

  // ---- second tap on the film → toward WORLD_OPEN (B3 owns the unfold) --
  // The window is pointer-transparent, so taps land on the Film Layer
  // itself; buttons (FilmControls, own chrome) are excluded. The
  // affordance button below is the equivalent accessible control.
  useEffect(() => {
    if (leaving) return;
    if (source.kind === "image" && !watching) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("button") !== null) return;
      if (target.closest("[data-film-layer]") === null) return;
      onAdvance();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [source.kind, watching, leaving, onAdvance]);

  // focus lands on the column (the section announces the maker); Escape
  // ungrows from the provider; the feed behind stays interactive.
  useEffect(() => {
    sectionRef.current?.focus({ preventScroll: true });
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const retry = useCallback(() => {
    if (source.kind === "image" && selection?.status !== "success") {
      onRetrySelection();
      return;
    }
    // the new cache-busted src no longer matches `live` → derived "loading"
    setRetryCount((count) => count + 1);
  }, [source.kind, selection, onRetrySelection]);

  const firstName = source.makerName.split(/\s+/)[0] ?? source.makerName;
  // "CERAMICIST · LISBON" (§2.2) — composed from FeedCard.craft + .place
  const craftLine = [source.craft, source.place].filter(Boolean).join(" · ");
  const mediaActive = activeClip !== null;
  const chromeIn = entered && !leaving;
  const selectionFailed = source.kind === "image" && selection?.status === "error" && !watching;
  const showError = (mediaActive && playback === "failed") || selectionFailed;
  const showAffordance = source.kind === "video" || watching;
  const ctaReady =
    source.kind === "image" && !watching && selection?.status === "success" && selection.grown !== null;

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      data-grow-column=""
      aria-label={`${source.makerName} — grown`}
      className="pointer-events-none fixed inset-x-0 top-0 z-[var(--z-film-chrome)] flex flex-col items-center outline-none md:top-[var(--space-10)]"
    >
      {/* §2.6 — a different composition per breakpoint, not a reflow:
          <768 full-bleed top-pinned · 768–1023 92vw · 1024–1439 640px ·
          ≥1440 720px */}
      <div className="flex w-full flex-col items-center md:w-[92vw] lg:w-[640px] min-[1440px]:w-[720px]">
        <div
          ref={windowRefCallback}
          data-grow-window=""
          className="relative aspect-video w-full overflow-hidden md:rounded-md [container-type:inline-size]"
        >
          {/* Empty state: N/A by construction — GROWN is only reachable
              from a real tapped card; nothing fabricated (spec §2.4). */}
          {source.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- config-driven remote srcs; next/image domains are a P5 config concern
            <img
              data-grow-portrait=""
              src={source.poster}
              alt={source.alt ?? `${source.makerName} — portrait`}
              style={{ objectPosition: clipObjectPosition({ focalPoint: source.focalPoint ?? undefined }) }}
              aria-hidden={watching && playback === "playing" ? true : undefined}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-opacity duration-[var(--dur-swap)]",
                watching && playback === "playing" && "opacity-0",
              )}
            />
          ) : null}

          {/* loading: poster paints in the frame underlay immediately; the
              shimmer is a progress EDGE, never a spinner (§2.4 / hero
              block precedent) */}
          {mediaActive && playback === "loading" ? (
            <Skeleton className="absolute inset-x-0 bottom-0 z-10 h-1 rounded-none" />
          ) : null}

          {/* chrome over the film — scrim + type + shadow. Media leads,
              text follows at --dur-enter (§2.5); on ungrow it leaves
              FIRST at --dur-state, opacity only. */}
          <div
            className={cn(
              "kol-scrim pointer-events-none absolute inset-0 shadow-raised transition-opacity ease-kol",
              chromeIn ? "opacity-100" : "opacity-0",
              leaving
                ? "duration-state"
                : cn("duration-enter", !reduced && "[transition-delay:var(--dur-enter)]"),
            )}
          >
            <div className="absolute inset-x-0 bottom-0 z-10 p-[var(--space-4)]">
              <h2 className="font-display font-medium leading-[0.95] tracking-[-0.02em] text-on-media [text-wrap:balance] text-[min(var(--fs-display),9cqi)]">
                {source.makerName}
              </h2>
              {craftLine !== "" ? (
                <p className="mt-2 font-text text-caption uppercase tracking-[0.08em] text-on-media">
                  {craftLine}
                </p>
              ) : null}
              {ctaReady ? (
                <button
                  type="button"
                  data-grow-cta=""
                  onClick={() => setWatching(true)}
                  className="pointer-events-auto mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-5 font-text text-caption uppercase tracking-[0.04em] text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
                >
                  Watch {firstName} at work
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* error: quiet, inline, beneath the column — the grown state
            stays usable and the tap-again affordance still works (§2.4) */}
        {showError ? (
          <ErrorInline
            message={"Couldn’t load this film."}
            onRetry={retry}
            className="pointer-events-auto mt-[var(--space-3)]"
          />
        ) : null}

        {/* the one affordance below the column, at --dur-grow after the
            film settles (§2.2) — also the keyboard path for the second tap */}
        {showAffordance ? (
          <button
            type="button"
            data-grow-affordance=""
            onClick={onAdvance}
            className={cn(
              "pointer-events-auto mt-[var(--space-3)] inline-flex min-h-11 items-center rounded-pill bg-surface/85 px-4 font-text text-caption uppercase tracking-[0.08em] text-muted transition-opacity ease-kol hover:text-ink",
              chromeIn ? "opacity-100" : "opacity-0",
              leaving
                ? "duration-state"
                : cn("duration-state", !reduced && "[transition-delay:var(--dur-grow)]"),
            )}
          >
            Tap again to open {firstName}&rsquo;s world
          </button>
        ) : null}
      </div>
    </section>
  );
}

/**
 * Retry must defeat swapClip's same-source no-op AND the browser's cached
 * failure — a cache-busting query does both without touching identity.
 */
function withRetryParam(src: string, attempt: number): string {
  if (attempt === 0) return src;
  try {
    const url = new URL(src, window.location.origin);
    url.searchParams.set("kolRetry", String(attempt));
    return url.href;
  } catch {
    return src;
  }
}
