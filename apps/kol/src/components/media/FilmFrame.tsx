"use client";

import { useRef, useState } from "react";
import { Captions, Volume2, VolumeX } from "lucide-react";
import type { Clip } from "@/lib/store-config/types";
import { cn } from "@/lib/utils";

/**
 * FilmFrame — the shared muted-film primitive behind hero-video and
 * process-reel. Poster-first, sound OFF until opt-in (the hard tone line),
 * captions toggle, quiet fallback to the poster frame on decode/404 failure
 * so the world stays usable around the still.
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "relative flex w-full items-end overflow-hidden bg-surface",
          className,
        )}
      >
        {/* the poster may 404 too — the ground-tinted fill IS the designed fallback */}
        <img
          src={clip.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => e.currentTarget.remove()}
        />
        <p className="relative m-4 rounded-md bg-surface/85 px-3 py-2 text-caption text-muted">
          Couldn&rsquo;t load this clip
        </p>
      </div>
    );
  }

  return (
    <div className={cn("group relative w-full overflow-hidden bg-surface", className)}>
      <video
        ref={videoRef}
        src={clip.src}
        poster={clip.poster}
        muted={muted}
        loop
        playsInline
        autoPlay={autoPlay}
        crossOrigin="anonymous"
        onError={() => {
          setFailed(true);
          onError?.();
        }}
        className="h-full w-full object-cover"
      >
        {clip.captionsSrc ? (
          <track
            kind="captions"
            src={clip.captionsSrc}
            srcLang="en"
            label="English"
            default={captionsOn}
          />
        ) : null}
      </video>
      {/* minimal controls: mute + captions only — controls fade after idle */}
      <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 transition-opacity duration-state ease-kol focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          aria-pressed={!muted}
          onClick={() => setMuted((m) => !m)}
          className="flex h-11 w-11 items-center justify-center rounded-pill bg-surface/85 text-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
        >
          {muted ? (
            <VolumeX className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Volume2 className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        {clip.captionsSrc ? (
          <button
            type="button"
            aria-label={captionsOn ? "Hide captions" : "Show captions"}
            aria-pressed={captionsOn}
            onClick={() => setCaptionsOn((c) => !c)}
            className="flex h-11 w-11 items-center justify-center rounded-pill bg-surface/85 text-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
          >
            <Captions className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
