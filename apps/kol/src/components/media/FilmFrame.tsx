"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useHeroPersistence } from "@/lib/renderer/hero-persistence";
import type { Clip } from "@/lib/store-config/types";
import { cn } from "@/lib/utils";
import { FilmControls } from "./FilmControls";
import { clipObjectPosition } from "./focal-point";
import { PosterStill } from "./PosterStill";

/**
 * FilmFrame — the shared muted-film primitive behind hero-video and
 * process-reel. Poster-first, sound OFF until opt-in (the hard tone line),
 * captions toggle, quiet fallback to the poster frame on decode/404 failure
 * so the world stays usable around the still. Autoplay is scroll-gated
 * (catalog §6): plays on scroll-into-view, pauses on scroll-out — EXCEPT
 * inside the renderer's hero slot (HeroPersistenceContext), where the film
 * never pauses (spec P4). Post-Amendment-A the hero slot has two shapes:
 * in "layer" mode the app-root Film Layer owns the video and this frame is
 * only the SLOT — a poster underlay registering its rect + clip; in "self"
 * mode (no FilmLayerProvider above — bare renderer mounts, unit rigs) this
 * frame owns its video and plays persistently, exactly as Wave 0 did.
 */
export function FilmFrame({
  clip,
  className,
  autoPlay = true,
  onError,
}: {
  clip: Clip;
  className?: string;
  autoPlay?: boolean;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroSlot = useHeroPersistence();
  const persistent = heroSlot?.mode === "self";
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);

  // Scroll-gated playback: in view → play, out of view → pause (tone +
  // performance). Film is content, not decoration — but nothing plays
  // off-screen. In the persistent hero slot the gate is OFF: play on mount,
  // no observer, no cleanup pause — the film survives every transition.
  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || !autoPlay || failed) return;
    if (persistent) {
      void video.play().catch(() => {
        /* autoplay veto (browser policy) — poster remains, no error chrome */
      });
      return;
    }
    // B4 reduced-motion rule: supporting reels (process-reel, any non-hero
    // frame) go STATIC — the poster is the designed still, no autoplay.
    // Only the persistent film is exempt (it is content, not decoration,
    // and playback continuity is its own AC) — that path returned above.
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void video.play().catch(() => {
              /* autoplay veto (browser policy) — poster remains, no error chrome */
            });
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [autoPlay, failed, persistent]);

  // <track default> is load-time only — drive the live TextTrack mode.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const track = video.textTracks[0];
    if (track) track.mode = captionsOn ? "showing" : "hidden";
  }, [captionsOn, failed]);

  // "layer" mode: the Film Layer owns the film element — this frame is the
  // slot registrar and the poster-first paint beneath it.
  if (heroSlot?.mode === "layer") {
    return (
      <FilmSlotFrame
        clip={clip}
        className={className}
        register={heroSlot.registerFilm}
        filmAway={heroSlot.filmAway}
      />
    );
  }

  if (failed) {
    return (
      <div
        className={cn(
          "relative flex w-full items-end overflow-hidden bg-surface",
          className,
        )}
      >
        {/* the poster may 404 too — the ground-tinted fill IS the designed fallback */}
        <PosterStill
          src={clip.poster}
          className="absolute inset-0 h-full w-full object-cover"
          objectPosition={clipObjectPosition(clip)}
        />
        <p className="relative m-4 rounded-md bg-surface/85 px-3 py-2 text-caption text-muted">
          Couldn&rsquo;t load this clip
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("group relative w-full overflow-hidden bg-surface", className)}
    >
      <video
        ref={videoRef}
        src={clip.src}
        poster={clip.poster}
        muted={muted}
        loop
        playsInline
        crossOrigin="anonymous"
        onError={() => {
          setFailed(true);
          onError?.();
        }}
        className="h-full w-full object-cover"
        // focal-point crop (v1.3 clips[].focalPoint, renderer-defaulted to
        // centre) — applies to the playing frame AND the poster attribute
        style={{ objectPosition: clipObjectPosition(clip) }}
      >
        {clip.captionsSrc ? (
          <track kind="captions" src={clip.captionsSrc} srcLang="en" label="English" />
        ) : null}
      </video>
      {/* minimal controls: mute + captions only — appear on hover/focus */}
      <FilmControls
        muted={muted}
        onMuteToggle={() => setMuted((m) => !m)}
        captionsOn={captionsOn}
        onCaptionsToggle={() => setCaptionsOn((c) => !c)}
        showCaptionsToggle={clip.captionsSrc !== null}
      />
    </div>
  );
}

/**
 * The hero slot under a Film Layer: registers its frame + clip with
 * HeroStage, which claims the film per stage. Once claimed, the slot is a
 * TRANSPARENT WINDOW — its poster and surface hide, and the film paints
 * through from the --z-film-bed plane BELOW the slot's chrome (stacking
 * contract, globals.css), so the maker's headline, craft line and
 * .kol-scrim read over the film exactly as Wave 0 shipped. The poster is
 * the SSR/pre-claim paint (never a posterless hero before hydration) and
 * returns whenever the film is away at the docked corner.
 */
function FilmSlotFrame({
  clip,
  className,
  register,
  filmAway,
}: {
  clip: Clip;
  className?: string;
  register: (element: HTMLElement, clip: Clip) => () => void;
  filmAway: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [claimed, setClaimed] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const release = register(element, clip);
    // the claim lands synchronously inside register — hide the poster in
    // the same pre-paint flush (the layer's own underlay takes over)
    setClaimed(true);
    return () => {
      setClaimed(false);
      release();
    };
  }, [register, clip]);
  const showPoster = !claimed || filmAway;
  return (
    <div
      ref={ref}
      data-film-slot=""
      data-film-away={filmAway ? "true" : undefined}
      className={cn(
        "relative w-full overflow-hidden",
        showPoster && "bg-surface",
        className,
      )}
    >
      {showPoster ? (
        <PosterStill
          src={clip.poster}
          className="absolute inset-0 h-full w-full object-cover"
          objectPosition={clipObjectPosition(clip)}
        />
      ) : null}
    </div>
  );
}
