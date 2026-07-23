"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Stop, Circle } from "@phosphor-icons/react";

/**
 * The film / voice capture register — KOL's differentiator, reused wherever a
 * maker records: the interview, an inbox reply, a re-recorded clip. Mirrors the
 * interview's capture language (framed still for film, a live level meter for
 * voice) so the whole seller side speaks one motion language. No real device
 * capture in this screens-only pass; this is the honest mock of that surface.
 */

export type CaptureMode = "film" | "voice";

export function CaptureStage({
  mode,
  seconds,
  onStop,
  stopLabel = "Done",
  hint,
}: {
  mode: CaptureMode;
  seconds: number;
  onStop: () => void;
  stopLabel?: string;
  hint?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-ink ring-1 ring-marigold/30">
      <div className="relative flex h-40 items-center justify-center bg-ink-raise sm:h-44">
        {mode === "film" ? (
          <div className="relative h-full w-full">
            <Image
              src="/media/clay-shape.jpg"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 32rem"
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-ink/30" />
            <p className="absolute inset-x-0 bottom-3 text-center font-ui text-xs text-bone/85">
              {hint ?? "You're on camera — talk to the lens"}
            </p>
          </div>
        ) : (
          <LevelMeter />
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 backdrop-blur-sm">
          <RecDot />
          <span className="font-mono text-[0.7rem] tabular-nums text-bone">
            {fmt(seconds)}
          </span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-ui text-xs text-bone/55">
          {mode === "film" ? "Filming" : "Recording"} — keep it short, keep it you
        </span>
        <button
          type="button"
          onClick={onStop}
          className="flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Stop size={15} weight="fill" />
          {stopLabel}
        </button>
      </div>
    </div>
  );
}

/** The brief transcribing/saving beat after a take is stopped. */
export function CaptureSaving({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-5 ring-1 ring-line">
      <TypingDots />
      <span className="font-ui text-sm text-bone/60">{label}</span>
    </div>
  );
}

export function RecDot() {
  return (
    <Circle
      size={11}
      weight="fill"
      className="animate-pulse text-error"
      aria-hidden
    />
  );
}

export function TypingDots() {
  const reduce = useReducedMotion();
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-marigold"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function LevelMeter() {
  const reduce = useReducedMotion();
  const bars = [0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.9, 0.65, 0.45, 0.8, 0.55, 0.7];
  return (
    <div className="flex h-full items-center gap-1.5" aria-hidden>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-marigold/80"
          style={{ height: `${h * 60}%` }}
          animate={
            reduce ? undefined : { scaleY: [h, h * 0.35, h * 1.1, h * 0.6, h] }
          }
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.06,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
