"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * MakerFilm — the single film primitive for KOL. Given a still (poster) and an
 * OPTIONAL real clip, it plays a muted, looped, playsInline <video> when a clip
 * exists; otherwise it renders the Ken-Burns still stand-in. It degrades to the
 * still on: no clip fixture, prefers-reduced-motion, or a load error — so the
 * product consumes real footage the moment the Founder drops it into
 * public/media/video/ and wires the fixture `filmSrc`, and looks identical to
 * today until then.
 *
 * Presence is feature-detected from the fixture (`videoSrc`), never a runtime
 * fetch probe. Courtesy: preload="none" + IntersectionObserver means a clip
 * only fetches/plays while on screen, and pauses off screen (battery/data).
 * The poster is the same still, so there is no layout shift versus the image.
 */
export function MakerFilm({
  videoSrc,
  poster,
  alt,
  reduce,
  sizes,
  priority,
  className,
  /** Ken-Burns drift on the STILL. Set false when an ancestor already drifts. */
  drift = true,
}: {
  videoSrc?: string;
  poster: string;
  alt: string;
  reduce: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  drift?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const useVideo = Boolean(videoSrc) && !reduce && !failed;

  useEffect(() => {
    if (!useVideo) return;
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useVideo]);

  if (useVideo) {
    return (
      <video
        ref={videoRef}
        src={videoSrc}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        onError={() => setFailed(true)}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={poster}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={cn(className, drift && !reduce && "film-drift")}
    />
  );
}
