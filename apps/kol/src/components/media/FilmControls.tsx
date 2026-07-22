"use client";

import { Captions, Volume2, VolumeX } from "lucide-react";

/**
 * The shared film controls — mute + captions only, appearing on hover/focus
 * of the surrounding `group`. Extracted from FilmFrame so the Film Layer
 * inherits the exact same controls instead of forking them (Amendment A).
 * Sound stays OFF until explicit opt-in — the hard tone line.
 */
export function FilmControls({
  muted,
  onMuteToggle,
  captionsOn,
  onCaptionsToggle,
  showCaptionsToggle,
}: {
  muted: boolean;
  onMuteToggle: () => void;
  captionsOn: boolean;
  onCaptionsToggle: () => void;
  showCaptionsToggle: boolean;
}) {
  return (
    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 transition-opacity duration-state ease-kol focus-within:opacity-100 group-hover:opacity-100">
      <button
        type="button"
        aria-label={muted ? "Unmute" : "Mute"}
        aria-pressed={!muted}
        onClick={onMuteToggle}
        className="flex h-11 w-11 items-center justify-center rounded-pill bg-surface/85 text-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
      >
        {muted ? (
          <VolumeX className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Volume2 className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      {showCaptionsToggle ? (
        <button
          type="button"
          aria-label={captionsOn ? "Hide captions" : "Show captions"}
          aria-pressed={captionsOn}
          onClick={onCaptionsToggle}
          className="flex h-11 w-11 items-center justify-center rounded-pill bg-surface/85 text-ink transition-transform duration-tap ease-kol active:scale-[0.98]"
        >
          <Captions className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
