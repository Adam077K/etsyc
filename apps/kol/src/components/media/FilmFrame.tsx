"use client";

import { useEffect, useRef, useState } from "react";
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
 * inside the renderer's persistent hero slot (HeroPersistenceContext),
 * where the film plays on mount and is never paused by this component
 * (spec P4: the hero never pauses across world-stage transitions).
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
  const persistent = useHeroPersistence();
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
