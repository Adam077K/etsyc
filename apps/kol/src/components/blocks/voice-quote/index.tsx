"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Pause } from "lucide-react";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Skeleton } from "@/components/states/Skeleton";
import { cn } from "@/lib/utils";
import { BlockSection, voiceoverById, type BlockProps } from "../shared";

/**
 * Block 5 · voice-quote — the "hear her say it" honest-voice moment (D10).
 * Text never waits on audio; audio failure degrades silently to text-only
 * (no error chrome). Display type ⇒ ALL three block-grounds are valid here,
 * including the two midtone --block-c grounds (large-text-only).
 */
export function VoiceQuoteBlock({ block, data, state = "success" }: BlockProps<"voice-quote">) {
  const voiceover = block.bindings.voiceoverIds[0]
    ? voiceoverById(data, block.bindings.voiceoverIds[0])
    : undefined;
  const ground = block.props.blockGround ?? null;

  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioFailed, setAudioFailed] = useState(false);

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

  // Empty: no quote set → block hidden entirely (never a blank quote frame).
  if (state === "empty" || block.props.quote.length === 0) return null;

  if (state === "loading") {
    // text shows immediately — only the waveform shimmer waits on audio
    return (
      <BlockSection ground={ground}>
        <figure className="mx-auto max-w-[28ch] space-y-[var(--space-3)] text-center">
          <QuoteText quote={block.props.quote} attribution={block.props.attribution} />
          {block.variant !== "text-only" ? (
            <Skeleton aria-busy="true" className="mx-auto h-8 w-48 rounded-pill" />
          ) : null}
        </figure>
      </BlockSection>
    );
  }

  // Error (or audio fetch failed at runtime): graceful, silent → text-only.
  const audioAvailable =
    block.variant !== "text-only" && voiceover !== undefined && state !== "error" && !audioFailed;

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play().catch(() => setAudioFailed(true));
      setPlaying(true);
    }
  };

  return (
    <BlockSection ground={ground}>
      <figure className="mx-auto max-w-[28ch] space-y-[var(--space-3)] text-center">
        <Reveal>
          <QuoteText quote={block.props.quote} attribution={block.props.attribution} />
        </Reveal>
        {audioAvailable ? (
          <Reveal delayMs={STAGGER_MS * 2} className="flex justify-center">
            <audio ref={audioRef} src={voiceover.src} preload="none" onError={() => setAudioFailed(true)} />
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? `Pause: ${voiceover.label}` : voiceover.label}
              aria-pressed={playing}
              className="inline-flex min-h-11 items-center gap-3 rounded-pill border border-line px-4 py-2 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink active:scale-[0.98]"
            >
              {playing ? (
                <Pause className="h-4 w-4 text-accent" aria-hidden="true" />
              ) : (
                <AudioLines className="h-4 w-4 text-accent" aria-hidden="true" />
              )}
              <span>{voiceover.label}</span>
              {block.variant === "text+waveform" ? (
                <Waveform progress={playing ? progress : 0} />
              ) : null}
            </button>
          </Reveal>
        ) : null}
      </figure>
    </BlockSection>
  );
}

function QuoteText({ quote, attribution }: { quote: string; attribution?: string }) {
  return (
    <>
      {/* display face at restraint — curly quotes per typographic craft §3 */}
      <blockquote className="font-display text-h1 [text-wrap:balance]">
        &ldquo;{quote}&rdquo;
      </blockquote>
      {attribution ? (
        <figcaption className="text-caption uppercase tracking-[0.08em] text-muted">
          — {attribution}
        </figcaption>
      ) : null}
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
