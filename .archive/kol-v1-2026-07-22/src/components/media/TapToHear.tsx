"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TapToHear — the D10 "hear her say it" primitive, shared by voice-quote,
 * product-showcase, product-detail, and trust-badge. Real playback, never a
 * dead affordance: if the audio can't load, the component removes itself
 * silently (catalog: graceful, no error chrome). Waveform (optional) fills
 * with progress and HOLDS position while paused.
 */
export function TapToHear({
  src,
  label,
  showWaveform = false,
  className,
}: {
  src: string;
  label: string;
  showWaveform?: boolean;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  // Degrade to nothing — the surrounding text never waited on audio.
  if (failed) return null;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().catch(() => setFailed(true));
      setPlaying(true);
    }
  };

  return (
    <>
      <audio ref={audioRef} src={src} preload="none" onError={() => setFailed(true)} />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `Pause: ${label}` : label}
        aria-pressed={playing}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 py-2 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink active:scale-[0.98]",
          className,
        )}
      >
        {playing ? (
          <Pause className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        ) : (
          <AudioLines className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        )}
        <span>{label}</span>
        {showWaveform ? <Waveform progress={progress} /> : null}
      </button>
    </>
  );
}

/** Slim waveform that fills as it plays — --accent at low opacity (catalog). */
function Waveform({ progress }: { progress: number }) {
  // fixed bar heights: a drawn waveform, not random per render
  const bars = [5, 9, 14, 8, 12, 16, 10, 6, 13, 9, 15, 7, 11, 8, 5];
  const filled = Math.round(progress * bars.length);
  return (
    <span aria-hidden="true" className="flex items-center gap-0.5">
      {bars.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}px` }}
          className={cn(
            "w-0.5 rounded-pill transition-colors duration-state ease-kol",
            i < filled ? "bg-accent" : "bg-accent/30",
          )}
        />
      ))}
    </span>
  );
}
