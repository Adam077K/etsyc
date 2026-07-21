"use client";

/**
 * Film — the shared film surface.
 *
 * Real path: pass `src` (and ideally `poster`) and this renders an actual
 * muted, inline <video>. Fallback path: with no `src`, or if the file 404s
 * / fails to decode, it falls back to the designed gradient that matches
 * the approved page mockups one-to-one — so a missing D12 clip degrades
 * quietly instead of showing a broken player.
 *
 * Autoplay is muted-only and is suppressed under prefers-reduced-motion.
 * Scrim + on-media type follow design-system §1.1 over-media rules.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { gradientFor, usePrefersReducedMotion, type FilmVariant } from "@/lib/media/film";

export type { FilmVariant };
export type FilmAspect = "tall" | "wide" | "square" | "portrait";

const ASPECTS: Record<FilmAspect, string> = {
  tall: "aspect-[4/5]",
  wide: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

export function Film({
  variant = "v1",
  aspect = "wide",
  craft,
  title,
  play = true,
  rounded = true,
  className = "",
  src,
  poster,
  loop = true,
  autoPlay = true,
  stream,
  children,
}: {
  variant?: FilmVariant;
  aspect?: FilmAspect;
  craft?: string;
  title?: string;
  play?: boolean;
  rounded?: boolean;
  className?: string;
  /** real footage; omit until D12 lands and the gradient stands in */
  src?: string;
  /** still frame shown before/instead of playback */
  poster?: string;
  loop?: boolean;
  autoPlay?: boolean;
  /** live MediaStream (camera preview) — takes precedence over `src` */
  stream?: MediaStream | null;
  children?: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Track WHICH src failed rather than a boolean — a new src is then
  // automatically "not failed" with no reset effect (and no setState-in-effect).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // live camera preview: bind the stream imperatively (srcObject isn't a prop)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    } else if (video.srcObject) {
      video.srcObject = null;
    }
  }, [stream]);

  const failed = Boolean(src) && failedSrc === src;
  const showVideo = Boolean(stream) || (Boolean(src) && !failed);
  // a live preview and reduced-motion footage both suppress the play glyph
  const showPlayGlyph = play && !stream;

  return (
    <div
      className={`relative flex items-end overflow-hidden shadow-card ${ASPECTS[aspect]} ${
        rounded ? "rounded-md" : ""
      } ${className}`}
      style={{ background: gradientFor(variant) }}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          {...(stream ? {} : { src, poster })}
          muted
          playsInline
          preload="metadata"
          loop={loop}
          autoPlay={Boolean(stream) || (autoPlay && !reducedMotion)}
          onError={() => setFailedSrc(src ?? null)}
          className="absolute inset-0 h-full w-full object-cover"
        >
          {/* D12 clips ship with a captions file alongside them; until then an
              empty track keeps the element conformant rather than silently
              caption-less. See public/media/README.md. */}
          <track kind="captions" label="Captions" />
        </video>
      ) : null}

      {/* scrim — bottom-up, per §1.1 over-media type rule */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, black 55%, transparent) 0%, transparent 55%)",
        }}
      />
      {showPlayGlyph ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-pill bg-on-media/90 text-ink shadow-raised">
            ▶
          </span>
        </div>
      ) : null}
      {(craft || title || children) && (
        <div className="relative z-[1] w-full p-4 text-on-media">
          {craft ? <p className="text-caption uppercase opacity-85">{craft}</p> : null}
          {title ? <p className="font-display text-h3 font-bold">{title}</p> : null}
          {children}
        </div>
      )}
    </div>
  );
}
