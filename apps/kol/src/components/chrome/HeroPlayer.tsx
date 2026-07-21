"use client";

/**
 * HeroPlayer — the persistent maker film (D5 / P4 invariant).
 *
 * KOL's signature mechanic is that the maker's film NEVER unmounts and
 * NEVER pauses as the buyer moves feed → grown → world → product. In a
 * routed app that only works if the player lives ABOVE the router, in
 * the root layout, and morphs between docked positions — which is what
 * this does. Routes declare intent via `useHeroStage()`; the element
 * itself is mounted once, here.
 *
 * Stages map to the buyer state machine:
 *   off      — not in a maker context (chrome pages)
 *   grown    — feed tap: centred, large
 *   world    — world unfolded: docked top-right, still playing
 *   narrate  — product view: corner dock, swaps to contextual narration
 */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import Link from "next/link";
import { getMaker } from "@/lib/mock/db";
import { gradientFor, usePrefersReducedMotion } from "@/lib/media/film";

export type HeroStage = "off" | "grown" | "world" | "narrate";

interface HeroState {
  stage: HeroStage;
  makerSlug: string | null;
  /** what the film is currently narrating — drives the caption */
  context: string | null;
  /** seconds elapsed; proves continuity across route changes */
  elapsed: number;
}

interface HeroApi extends HeroState {
  setHero(next: { stage: HeroStage; makerSlug?: string | null; context?: string | null }): void;
  dismiss(): void;
}

const Ctx = createContext<HeroApi | null>(null);

export function HeroPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<HeroState>({
    stage: "off",
    makerSlug: null,
    context: null,
    elapsed: 0,
  });

  // The film keeps playing across every route change — this ticker is the
  // observable proof of the P4 "never unmounts, never pauses" invariant.
  useEffect(() => {
    if (state.stage === "off") return;
    const t = window.setInterval(
      () => setState((s) => (s.stage === "off" ? s : { ...s, elapsed: s.elapsed + 1 })),
      1000,
    );
    return () => window.clearInterval(t);
  }, [state.stage]);

  const setHero = useCallback<HeroApi["setHero"]>((next) => {
    setState((s) => {
      const makerSlug = next.makerSlug === undefined ? s.makerSlug : next.makerSlug;
      // Changing maker restarts the film; same maker keeps it rolling.
      const elapsed = makerSlug !== s.makerSlug ? 0 : s.elapsed;
      return {
        stage: next.stage,
        makerSlug,
        context: next.context === undefined ? s.context : next.context,
        elapsed,
      };
    });
  }, []);

  const dismiss = useCallback(() => {
    setState({ stage: "off", makerSlug: null, context: null, elapsed: 0 });
  }, []);

  const value = useMemo(() => ({ ...state, setHero, dismiss }), [state, setHero, dismiss]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <HeroFilm />
    </Ctx.Provider>
  );
}

export function useHeroPlayer(): HeroApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHeroPlayer must be used inside HeroPlayerProvider");
  return ctx;
}

/**
 * Declarative helper for routes: state the stage you want on mount.
 * The player itself is never re-created — only re-positioned.
 */
export function useHeroStage(
  stage: HeroStage,
  makerSlug?: string | null,
  context?: string | null,
) {
  const { setHero } = useHeroPlayer();
  useEffect(() => {
    setHero({ stage, makerSlug: makerSlug ?? null, context: context ?? null });
  }, [setHero, stage, makerSlug, context]);
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * The single mounted film element. Position/scale change per stage;
 * the node is never torn down, so playback is continuous by construction.
 */
function HeroFilm() {
  const { stage, makerSlug, context, elapsed, setHero, dismiss } = useHeroPlayer();
  const maker = makerSlug ? getMaker(makerSlug) : undefined;

  // Real footage path. `videoSrc` is undefined until D12 footage lands, so
  // today this always resolves to the gradient — but the seam is real, and a
  // 404 on a dropped-in file falls back the same way.
  const videoSrc = maker?.videoSrc;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => setFailed(false), [videoSrc]);

  // The <video> lives inside the never-unmounted film node, so playback is
  // continuous across route changes for the same reason the clock is. Only a
  // maker change (new src) legitimately restarts it.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || failed || reducedMotion) return;
    void video.play().catch(() => {
      /* autoplay veto — the poster/gradient holds, no error chrome */
    });
  }, [videoSrc, failed, reducedMotion]);

  if (stage === "off" || !maker) return null;

  const grown = stage === "grown";

  const frame =
    stage === "grown"
      ? "left-1/2 top-1/2 w-[min(46rem,88vw)] -translate-x-1/2 -translate-y-1/2 aspect-[16/10]"
      : stage === "world"
        ? "right-4 top-20 w-72 aspect-video"
        : "right-4 bottom-4 w-80 aspect-video";

  return (
    <>
      {/* scrim only while grown — the feed stays visible behind it */}
      {grown ? (
        <button
          aria-label="Close"
          onClick={dismiss}
          className="fixed inset-0 z-40 cursor-default bg-ink/70 backdrop-blur-sm"
        />
      ) : null}

      <div
        data-hero-stage={stage}
        className={`fixed z-50 overflow-hidden rounded-md shadow-raised transition-all duration-unfold ease-cinematic ${frame}`}
        style={{ background: gradientFor(maker.filmClass) }}
      >
        {videoSrc && !failed ? (
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            loop
            playsInline
            preload="metadata"
            autoPlay={!reducedMotion}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklab, black 60%, transparent) 0%, transparent 60%)",
          }}
        />

        {videoSrc && !failed ? null : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-pill bg-on-media/90 text-ink shadow-raised">
              ▶
            </span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-[1] p-3 text-on-media">
          <p className="text-caption uppercase opacity-85">
            {stage === "narrate"
              ? `Still playing · ${context ?? "narrating this piece"}`
              : stage === "world"
                ? "Still playing · her world opened around this"
                : maker.craftLine}
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-h3 font-bold">{maker.name}</p>
            {/* continuity proof: this clock never resets across routes */}
            <span className="font-mono text-caption opacity-90">{fmt(elapsed)}</span>
          </div>

          {grown ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/m/${maker.slug}`}
                onClick={() => setHero({ stage: "world", makerSlug: maker.slug })}
                className="rounded-pill bg-on-media px-3 py-1 text-caption font-semibold text-ink"
              >
                Open {maker.name}&rsquo;s world →
              </Link>
              <button
                onClick={dismiss}
                className="rounded-pill border border-on-media/50 px-3 py-1 text-caption text-on-media"
              >
                Back to feed
              </button>
            </div>
          ) : (
            <button
              onClick={dismiss}
              aria-label="Dismiss film"
              className="absolute right-2 top-2 rounded-pill bg-ink/50 px-2 text-caption text-on-media"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </>
  );
}
