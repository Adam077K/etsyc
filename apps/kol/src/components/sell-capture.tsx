"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Stop,
  Circle,
  VideoCamera,
  Microphone,
  ArrowClockwise,
  Check,
  MonitorPlay,
  X,
} from "@phosphor-icons/react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The film / voice capture register — KOL's differentiator, reused wherever a
 * maker records: the interview, an inbox reply, a re-recorded clip. Mirrors the
 * interview's capture language (framed still for film, a live level meter for
 * voice) so the whole seller side speaks one motion language. No real device
 * capture in this screens-only pass; this is the honest mock of that surface.
 *
 * Two registers live here, one language:
 *  - CaptureStage — the compact inline surface (inbox reply, small contexts).
 *  - CaptureRitual — the full-screen viewfinder a maker steps into to film a
 *    library clip: a designed take/retake ritual, not a file-upload chore.
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
            <FramingTicks inset="inset-2.5" />
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
  // Resting height of each bar as a fraction of full (0–1); the base height is
  // `h * 60%` and each bar breathes around `h` on its own delay, so the row
  // reads as an uneven, live audio meter rather than a synced equaliser.
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

/* ================================================================== *
 *  CaptureRitual — the full-screen viewfinder a maker steps into.
 *
 *  Not a file-upload chore: a designed ritual with a clear rhythm —
 *  framing → rolling → review → keep or film again. Cinematic letterbox
 *  and corner ticks frame an HONEST repo still (no fake camera feed); the
 *  framing guidance is KOL directing the maker like a patient DP, and the
 *  "where this lands" line closes the effort→payoff loop. Motion rides the
 *  studio bezier (transform/opacity/filter only) and settles instantly under
 *  reduced motion. Keyboard-first: Esc cuts or leaves, focus lands on the
 *  live action, and the recording state is announced.
 * ================================================================== */

export type RitualClip = {
  title: string;
  /** buyer-facing destination — the WHERE-IT-PLAYS line */
  playsOn: string;
  /** KOL's framing guidance for the viewfinder */
  frame?: string;
  /** the effort→payoff line */
  why?: string;
  /** honest still shown in the viewfinder (poster or hint) */
  still?: string;
  /** call-sheet scene label, e.g. "Scene 02 · How it's made" */
  scene?: string;
};

type RitualState = "framing" | "rolling" | "review" | "saving";

export function CaptureRitual({
  clip,
  onKeep,
  onClose,
}: {
  clip: RitualClip;
  /** the maker keeps the take — mode + duration string handed back */
  onKeep: (mode: CaptureMode, duration: string) => void;
  /** the maker leaves without filming */
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<CaptureMode>("film");
  const [state, setState] = useState<RitualState>("framing");
  const [seconds, setSeconds] = useState(0);
  const [take, setTake] = useState<{ mode: CaptureMode; seconds: number } | null>(
    null,
  );
  const rollBtn = useRef<HTMLButtonElement>(null);
  const cutBtn = useRef<HTMLButtonElement>(null);
  const keepBtn = useRef<HTMLButtonElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const labelId = useId();

  // Recording timer — ticks only while rolling.
  useEffect(() => {
    if (state !== "rolling") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  // Lock the page behind the ritual while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  // Move focus to the live action as the ritual advances (keyboard-first).
  useEffect(() => {
    const target =
      state === "framing"
        ? rollBtn.current
        : state === "rolling"
          ? cutBtn.current
          : state === "review"
            ? keepBtn.current
            : null;
    target?.focus();
  }, [state]);

  // Esc: cut while rolling, otherwise leave.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (state === "rolling") cut();
      else if (state !== "saving") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function roll() {
    setSeconds(0);
    setState("rolling");
  }
  function cut() {
    setTake({ mode, seconds });
    setState("review");
  }
  function again() {
    setTake(null);
    setSeconds(0);
    setState("framing");
  }
  function keep() {
    setState("saving");
    const dur = fmt(Math.max(take?.seconds ?? seconds, 4));
    saveTimer.current = setTimeout(
      () => onKeep(take?.mode ?? mode, dur),
      reduce ? 160 : 1100,
    );
  }

  const announce =
    state === "rolling"
      ? `Recording ${clip.title}. Press cut when you're done.`
      : state === "review"
        ? "Your take is ready. Keep it, or film again."
        : state === "saving"
          ? "Saving your clip."
          : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25, ease: easeOut }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelId}
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-ink/92 px-4 py-8 backdrop-blur-md sm:px-6"
    >
      {/* live-region for assistive tech — state changes are spoken, not just seen */}
      <p className="sr-only" aria-live="assertive">
        {announce}
      </p>

      {/* Leave — always reachable, never in the way. */}
      <button
        type="button"
        onClick={onClose}
        disabled={state === "saving"}
        className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-ink-soft/80 px-3 py-1.5 font-ui text-xs font-medium text-bone/70 ring-1 ring-line backdrop-blur-sm transition-colors hover:text-bone disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold sm:right-6 sm:top-6"
      >
        <X size={13} weight="bold" />
        {state === "review" ? "Discard" : "Leave"}
      </button>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.965, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
        className="w-full max-w-3xl"
      >
        {/* Scene slate — the call-sheet header for this one shot. */}
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <p className="meta text-marigold">
              {state === "rolling"
                ? "Now rolling"
                : state === "review"
                  ? "Your take"
                  : state === "saving"
                    ? "Saving"
                    : "Set your shot"}
            </p>
            <h2
              id={labelId}
              className="mt-1 font-display text-2xl font-bold leading-tight text-bone sm:text-3xl"
            >
              {clip.title}
            </h2>
          </div>
          {clip.scene && (
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-bone-dim">
              {clip.scene}
            </span>
          )}
        </div>

        {/* The viewfinder. */}
        <div className="relative overflow-hidden rounded-3xl bg-ink ring-1 ring-marigold/25">
          <div className="relative aspect-[16/10] w-full sm:aspect-video">
            {mode === "film" ? (
              <>
                <Image
                  src={clip.still ?? "/media/clay-shape.jpg"}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 48rem"
                  className={cn(
                    "object-cover transition-[filter,opacity] duration-500",
                    state === "rolling" ? "opacity-80" : "opacity-55 grayscale",
                  )}
                  priority
                />
                {/* cinematic scrim so any caption clears AA over the image */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-ink/50" />
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-ink-raise px-10">
                <div className="h-24 w-full max-w-md">
                  <LevelMeter />
                </div>
              </div>
            )}

            {/* Cinematic letterbox — closes in a touch when rolling. */}
            <Letterbox rolling={state === "rolling"} reduce={!!reduce} />
            <FramingTicks inset="inset-5 sm:inset-7" active={state === "rolling"} />

            {/* Top rail: rec + timer while rolling; mode toggle while framing. */}
            <div className="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3 sm:inset-x-6 sm:top-6">
              <AnimatePresence mode="wait">
                {state === "rolling" || state === "review" ? (
                  <motion.span
                    key="rec"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 rounded-full bg-ink/80 px-2.5 py-1 backdrop-blur-sm"
                  >
                    {state === "rolling" ? (
                      <RecDot />
                    ) : (
                      <Check size={12} weight="bold" className="text-marigold" />
                    )}
                    <span className="font-mono text-[0.7rem] tabular-nums text-bone">
                      {state === "rolling"
                        ? fmt(seconds)
                        : fmt(take?.seconds ?? 0)}
                    </span>
                  </motion.span>
                ) : (
                  <motion.div
                    key="mode"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="radiogroup"
                    aria-label="Film or voice"
                    className="inline-flex rounded-full bg-ink/80 p-1 ring-1 ring-line backdrop-blur-sm"
                  >
                    {(["film", "voice"] as CaptureMode[]).map((m) => {
                      const ModeIcon = m === "film" ? VideoCamera : Microphone;
                      const on = mode === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setMode(m)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full px-3 py-1 font-ui text-xs capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold",
                            on ? "bg-bone text-ink" : "text-bone/70 hover:text-bone",
                          )}
                        >
                          <ModeIcon size={14} weight={on ? "fill" : "regular"} />
                          {m}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Framing guidance — KOL directing, over the scrim. */}
            <AnimatePresence>
              {state !== "saving" && clip.frame && (
                <motion.div
                  key={state}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0.01 : 0.4, ease: easeOut }}
                  className="absolute inset-x-4 bottom-4 z-10 sm:inset-x-6 sm:bottom-6"
                >
                  {state === "review" ? (
                    <p className="font-serif text-base leading-snug text-bone sm:text-lg">
                      Nice. Watch it back in your head — does it feel like you?
                    </p>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 shrink-0 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-marigold-bright">
                        {state === "rolling" ? "Keep going" : "Framing"}
                      </span>
                      <p className="max-w-xl font-ui text-sm leading-snug text-bone/95">
                        {clip.frame}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Where this lands — the effort→payoff loop, closed under the frame. */}
        {state === "framing" && (
          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-line bg-ink-soft/60 px-4 py-3.5 sm:px-5">
            <p className="flex items-center gap-2 font-ui text-sm text-bone">
              <MonitorPlay size={16} weight="fill" className="shrink-0 text-marigold" />
              <span className="text-bone-dim">Lands on</span>
              <span className="font-medium">{clip.playsOn}</span>
            </p>
            {clip.why && (
              <p className="font-serif text-[0.98rem] leading-snug text-bone/70">
                {clip.why}
              </p>
            )}
          </div>
        )}

        {/* Action dock — the take/retake rhythm. */}
        <div className="mt-5">
          {state === "framing" && (
            <button
              ref={rollBtn}
              type="button"
              onClick={roll}
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-marigold px-6 py-4 font-ui text-base font-semibold text-ink transition-[transform,background-color] hover:bg-marigold-bright active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-ink/15">
                {mode === "film" ? (
                  <VideoCamera size={16} weight="fill" />
                ) : (
                  <Microphone size={16} weight="fill" />
                )}
              </span>
              {mode === "film" ? "Start rolling" : "Start recording"}
            </button>
          )}

          {state === "rolling" && (
            <button
              ref={cutBtn}
              type="button"
              onClick={cut}
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-bone px-6 py-4 font-ui text-base font-semibold text-ink transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <Stop size={17} weight="fill" />
              Cut
            </button>
          )}

          {state === "review" && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                ref={keepBtn}
                type="button"
                onClick={keep}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-full bg-marigold px-6 py-4 font-ui text-base font-semibold text-ink transition-[transform,background-color] hover:bg-marigold-bright active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <Check size={18} weight="bold" />
                Keep this take
              </button>
              <button
                type="button"
                onClick={again}
                className="flex items-center justify-center gap-2 rounded-full px-6 py-4 font-ui text-base font-medium text-bone ring-1 ring-line transition-[transform,color] hover:text-bone active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <ArrowClockwise size={17} weight="bold" />
                Film again
              </button>
            </div>
          )}

          {state === "saving" && (
            <div className="flex items-center justify-center gap-3 rounded-full bg-ink-soft px-6 py-4 ring-1 ring-line">
              <TypingDots />
              <span className="font-ui text-sm text-bone/70">
                {mode === "voice" ? "Saving your recording…" : "Saving your take…"}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Cinematic letterbox bars — the shot's frame. Bars are a fixed slice of the
 *  viewfinder; rolling scales them fully in from a resting two-thirds. Transform
 *  only (scaleY, origin-anchored) — never the height layout property. */
function Letterbox({ rolling, reduce }: { rolling: boolean; reduce: boolean }) {
  const scaleY = rolling ? 1 : 0.66;
  const t = { duration: reduce ? 0.01 : 0.5, ease: easeOut };
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute inset-x-0 top-0 h-[9%] origin-top bg-ink"
        animate={{ scaleY }}
        transition={t}
        style={{ scaleY }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[9%] origin-bottom bg-ink"
        animate={{ scaleY }}
        transition={t}
        style={{ scaleY }}
      />
    </div>
  );
}

/** Four corner framing ticks — the viewfinder's signature L-marks. Marigold
 *  "locks" the frame while rolling. Built from background bars (not borders) so
 *  each corner reads as a crisp camera tick, not a card accent. Decorative. */
export function FramingTicks({
  inset = "inset-3",
  active = false,
}: {
  inset?: string;
  active?: boolean;
}) {
  const bar = active ? "bg-marigold-bright" : "bg-bone/45";
  const corners = [
    { pos: "left-0 top-0", top: true, left: true },
    { pos: "right-0 top-0", top: true, left: false },
    { pos: "left-0 bottom-0", top: false, left: true },
    { pos: "right-0 bottom-0", top: false, left: false },
  ];
  return (
    <div aria-hidden className={cn("pointer-events-none absolute", inset)}>
      {corners.map(({ pos, top, left }) => (
        <span key={pos} className={cn("absolute h-5 w-5 sm:h-6 sm:w-6", pos)}>
          {/* horizontal arm */}
          <span
            className={cn(
              "absolute h-[2px] w-full transition-colors duration-500",
              bar,
              top ? "top-0" : "bottom-0",
              left ? "left-0" : "right-0",
            )}
          />
          {/* vertical arm */}
          <span
            className={cn(
              "absolute h-full w-[2px] transition-colors duration-500",
              bar,
              left ? "left-0" : "right-0",
              top ? "top-0" : "bottom-0",
            )}
          />
        </span>
      ))}
    </div>
  );
}
