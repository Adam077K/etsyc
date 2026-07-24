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
  /** Optional external handle on the <video> — the continuous film layer uses
      it to seed currentTime for a seamless feed→world handoff. */
  videoRef: externalRef,
  /** Seed the clip's playhead on mount (currentTime continuity across a seam). */
  initialTime,
  /** Audio state. Defaults to MUTED — every feed tile, hero and overlay film
      stays muted (browser + contract compliance). Only the persistent FilmStage
      passes `muted={false}`, once the user arms sound, so the SAME clip node
      becomes audible without a re-mount. */
  muted = true,
}: {
  videoSrc?: string;
  poster: string;
  alt: string;
  reduce: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  drift?: boolean;
  videoRef?: React.MutableRefObject<HTMLVideoElement | null>;
  initialTime?: number;
  muted?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // `useReducedMotion()` is false on the server and true on the reduced-motion
  // client, so choosing video-vs-still from `reduce` at first paint would swap
  // element types at hydration (React #418). Gate on mount: the server and the
  // first client paint render identically (reduce ignored), then reduced motion
  // applies. globals.css disables .film-drift under the media query meanwhile.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const effectiveReduce = mounted ? reduce : false;
  const useVideo = Boolean(videoSrc) && !effectiveReduce && !failed;

  // Bridge the internal ref to the optional external handle, and seed the
  // playhead when a starting time is supplied (feed→world currentTime carry).
  // preload="none" means metadata isn't ready at ref-attach, so a seek there is
  // swallowed — apply the seed on `loadedmetadata` (or now if already ready).
  const seededRef = useRef(false);
  const setVideoNode = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (externalRef) externalRef.current = el;
    if (
      !el ||
      initialTime === undefined ||
      !Number.isFinite(initialTime) ||
      seededRef.current
    ) {
      return;
    }
    const seek = () => {
      if (seededRef.current || !videoRef.current) return;
      try {
        videoRef.current.currentTime = initialTime;
        seededRef.current = true;
      } catch {
        /* clamped/blocked seek — the muted loop keeps the seam seamless anyway. */
      }
    };
    if (el.readyState >= 1 /* HAVE_METADATA */) seek();
    else el.addEventListener("loadedmetadata", seek, { once: true });
  };

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

  // React's `muted` JSX attribute is unreliable (a long-standing quirk where the
  // property doesn't reflect), so mirror the desired state onto the DOM property
  // directly whenever it changes. The FilmStage's own gesture handler also sets
  // this within the user-gesture task so the browser permits the unmute.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, useVideo]);

  if (useVideo) {
    return (
      <video
        ref={setVideoNode}
        src={videoSrc}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload="none"
        aria-hidden="true"
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
      // No `!reduce` gate: `useReducedMotion()` is false on the server and true
      // on the reduced-motion client, so gating the class here mismatches at
      // hydration (React #418). globals.css already disables `.film-drift` under
      // the prefers-reduced-motion media query, so the class is safe to keep.
      className={cn(className, drift && "film-drift")}
    />
  );
}
