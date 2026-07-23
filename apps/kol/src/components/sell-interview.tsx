"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  Sparkle,
  VideoCamera,
  Microphone,
  ArrowClockwise,
  ArrowRight,
  Check,
  Stop,
  Circle,
} from "@phosphor-icons/react";
import {
  STORY_BEATS,
  INTERVIEW_TRANSCRIPT,
  type InterviewTurn,
  type BeatId,
  type CaptureMode,
} from "@/lib/fixtures/sell";
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* Scripted continuation — the maker's remaining answers + KOL's follow-ups. In
   the live product these are captured; here they stand in so the demo advances
   truthfully through the fixed story beats. */
const SCRIPT: { answer: InterviewTurn; nextPrompt: InterviewTurn | null }[] = [
  {
    answer: {
      id: "s-craft",
      speaker: "maker",
      beat: "craft",
      mode: "film",
      duration: "0:41",
      text: "I wedge the clay first — knock the air out, get it breathing. Then I fight it dead-centre on the wheel; get that wrong and nothing after it can be saved. Three slow pulls to raise the walls, and I stop the second it tells me what it wants to be.",
    },
    nextPrompt: {
      id: "s-q-workshop",
      speaker: "kol",
      beat: "workshop",
      text: "I can already see the shop taking shape. Where does all this happen — describe the room you throw in.",
    },
  },
  {
    answer: {
      id: "s-workshop",
      speaker: "maker",
      beat: "workshop",
      mode: "film",
      duration: "0:29",
      text: "A little studio in Alfama, here in Lisbon. South light in the mornings, a drying shelf my landlord is convinced is a fire hazard, and the salt kiln out in the yard.",
    },
    nextPrompt: {
      id: "s-q-values",
      speaker: "kol",
      beat: "values",
      text: "Last big one. When someone lives with one of your pots for years — what do you hope it does for them?",
    },
  },
  {
    answer: {
      id: "s-values",
      speaker: "maker",
      beat: "values",
      mode: "film",
      duration: "0:33",
      text: "I hope they stop noticing it, honestly — that it becomes the cup they reach for without thinking. If a pot ends up on your table for thirty years, I've done my job.",
    },
    nextPrompt: {
      id: "s-q-brand",
      speaker: "kol",
      beat: "brand",
      followUp: true,
      text: "That's your whole shop, in your own words. Warm, unhurried, a little defiant about the wobble. Ready to see it built?",
    },
  },
];

type CaptureState = "idle" | "recording" | "transcribing";

export function SellInterview() {
  const reduce = useReducedMotion();
  const [turns, setTurns] = useState<InterviewTurn[]>(INTERVIEW_TRANSCRIPT);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<CaptureMode>("film");
  const [capture, setCapture] = useState<CaptureState>("idle");
  const [recapture, setRecapture] = useState<{
    id: string;
    state: "recording" | "transcribing";
  } | null>(null);
  const [seconds, setSeconds] = useState(0);
  const scrollAnchor = useRef<HTMLDivElement>(null);

  const lastTurn = turns[turns.length - 1];
  const openPrompt = lastTurn?.speaker === "kol" ? lastTurn : null;
  const queueDone = step >= SCRIPT.length;
  const completedBeats = new Set(
    turns.filter((t) => t.speaker === "maker").map((t) => t.beat),
  );
  const activeBeat: BeatId = openPrompt?.beat ?? lastTurn?.beat ?? "brand";
  const canBuild = completedBeats.size >= 2;
  const busy = capture !== "idle" || recapture !== null;

  // Recording timer — the only place seconds tick (reset happens on start).
  useEffect(() => {
    const running = capture === "recording" || recapture?.state === "recording";
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [capture, recapture]);

  // Keep the newest turn in view as the conversation grows.
  useEffect(() => {
    if (reduce) return;
    scrollAnchor.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, capture, reduce]);

  function answerPrompt() {
    if (busy || queueDone || !openPrompt) return;
    setSeconds(0);
    setCapture("recording");
  }

  function stopAnswer() {
    if (capture !== "recording") return;
    setCapture("transcribing");
    window.setTimeout(
      () => {
        const entry = SCRIPT[step];
        if (!entry) {
          setCapture("idle");
          return;
        }
        setTurns((prev) => [
          ...prev,
          { ...entry.answer, mode },
          ...(entry.nextPrompt ? [entry.nextPrompt] : []),
        ]);
        setStep((s) => s + 1);
        setCapture("idle");
      },
      reduce ? 200 : 1400,
    );
  }

  function reRecord(id: string) {
    if (busy) return;
    setSeconds(0);
    setRecapture({ id, state: "recording" });
  }

  function stopReRecord() {
    if (recapture?.state !== "recording") return;
    const id = recapture.id;
    setRecapture({ id, state: "transcribing" });
    window.setTimeout(
      () => {
        // A genuine re-take: the clip is refreshed (duration nudges to prove it).
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id && t.duration
              ? { ...t, duration: bumpDuration(t.duration) }
              : t,
          ),
        );
        setRecapture(null);
      },
      reduce ? 200 : 1200,
    );
  }

  return (
    <div className="mx-auto grid min-h-[100svh] max-w-issue gap-8 px-5 pb-16 pt-28 sm:px-8 sm:pt-32 lg:grid-cols-[16rem_1fr] lg:gap-12">
      {/* ---- Beat rail ---- */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <p className="meta text-marigold">The interview</p>
        <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-bone">
          Five beats, in your
          <br className="hidden lg:block" /> own time.
        </h1>
        <ol className="mt-8 space-y-1">
          {STORY_BEATS.map((beat, i) => {
            const done = completedBeats.has(beat.id);
            const active = beat.id === activeBeat && !done;
            return (
              <li key={beat.id}>
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors",
                    active && "bg-marigold/10",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold tabular-nums transition-colors",
                      done && "bg-marigold/25 text-marigold",
                      active && "bg-marigold text-ink",
                      !done && !active && "border border-bone/25 text-bone/55",
                    )}
                  >
                    {done ? <Check size={13} weight="bold" /> : i + 1}
                  </span>
                  <div>
                    <p
                      className={cn(
                        "font-ui text-sm font-medium leading-tight",
                        done || active ? "text-bone" : "text-bone/50",
                      )}
                    >
                      {beat.label}
                    </p>
                    <p className="mt-0.5 font-ui text-xs leading-snug text-bone/55">
                      {beat.intent}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-8 max-w-[15rem] font-ui text-xs leading-relaxed text-bone/55">
          Answer on film or by voice. Nothing is final — you can re-record any clip
          before your world is built.
        </p>
      </aside>

      {/* ---- Conversation ---- */}
      <div className="flex flex-col">
        <div className="flex-1 space-y-6">
          {turns.map((turn) => (
            <TurnBubble
              key={turn.id}
              turn={turn}
              reduce={!!reduce}
              isLatestMaker={turn.id === lastMakerId(turns)}
              recapture={recapture}
              seconds={seconds}
              onReRecord={() => reRecord(turn.id)}
              onStopReRecord={stopReRecord}
              disabled={busy && recapture?.id !== turn.id}
            />
          ))}

          {/* KOL is composing the next question after a fresh answer. */}
          <AnimatePresence>
            {capture === "transcribing" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0.01 : 0.3 }}
                className="flex items-center gap-3"
              >
                <KolMark />
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md bg-ink-soft px-4 py-3 ring-1 ring-line">
                  <TypingDots />
                  <span className="font-ui text-sm text-bone/60">
                    KOL is listening…
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={scrollAnchor} className="h-2" />
        </div>

        {/* ---- Capture / completion dock ---- */}
        {/* Static in-flow on mobile so the conversation reads chronological
            (history above, active input below); sticky only from lg where the
            column is tall enough to keep the dock in view without overlap. */}
        <div className="mt-8 -mx-5 bg-gradient-to-t from-ink via-ink via-40% to-transparent px-5 pb-6 pt-10 sm:-mx-8 sm:px-8 lg:sticky lg:bottom-0">
          {queueDone ? (
            <CompletionDock reduce={!!reduce} />
          ) : (
            <CaptureDock
              mode={mode}
              onMode={setMode}
              state={capture}
              seconds={seconds}
              busy={busy}
              onRecord={answerPrompt}
              onStop={stopAnswer}
              canBuild={canBuild}
              question={openPrompt?.text}
              beatLabel={
                STORY_BEATS.find((b) => b.id === openPrompt?.beat)?.label
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function TurnBubble({
  turn,
  reduce,
  isLatestMaker,
  recapture,
  seconds,
  onReRecord,
  onStopReRecord,
  disabled,
}: {
  turn: InterviewTurn;
  reduce: boolean;
  isLatestMaker: boolean;
  recapture: { id: string; state: "recording" | "transcribing" } | null;
  seconds: number;
  onReRecord: () => void;
  onStopReRecord: () => void;
  disabled: boolean;
}) {
  const isKol = turn.speaker === "kol";
  const beat = STORY_BEATS.find((b) => b.id === turn.beat);
  const busyHere = recapture?.id === turn.id;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
      className={cn("flex gap-3", isKol ? "flex-row" : "flex-row-reverse")}
    >
      {isKol ? <KolMark /> : <MakerMark />}

      <div className={cn("max-w-xl", isKol ? "items-start" : "items-end")}>
        <div
          className={cn(
            "mb-1.5 flex items-center gap-2",
            isKol ? "justify-start" : "flex-row-reverse",
          )}
        >
          <span className="meta text-bone-dim">{isKol ? "KOL" : "You"}</span>
          {turn.followUp && (
            <span className="rounded-full bg-marigold/15 px-2 py-0.5 font-ui text-[0.65rem] font-medium text-marigold">
              follow-up
            </span>
          )}
          {!isKol && beat && (
            <span className="font-ui text-[0.7rem] text-bone/55">
              {beat.label}
            </span>
          )}
        </div>

        {busyHere ? (
          <ReRecordBubble
            mode={turn.mode ?? "film"}
            state={recapture.state}
            seconds={seconds}
            onStop={onStopReRecord}
            reduce={reduce}
          />
        ) : (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 font-ui text-[0.95rem] leading-relaxed ring-1",
              isKol
                ? "rounded-tl-md bg-ink-soft text-bone/90 ring-line"
                : "rounded-tr-md bg-marigold/[0.12] text-bone ring-marigold/20",
            )}
          >
            <p>{turn.text}</p>
            {!isKol && turn.mode && (
              <div className="mt-3 flex items-center gap-3 border-t border-bone/10 pt-2.5">
                <span className="flex items-center gap-1.5 font-ui text-xs text-bone/60">
                  {turn.mode === "film" ? (
                    <VideoCamera size={14} />
                  ) : (
                    <Microphone size={14} />
                  )}
                  {turn.mode === "film" ? "Filmed" : "Voice"} · {turn.duration}
                </span>
                {isLatestMaker && (
                  <button
                    type="button"
                    onClick={onReRecord}
                    disabled={disabled}
                    className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 font-ui text-xs font-medium text-marigold transition-colors hover:bg-marigold/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    <ArrowClockwise size={13} weight="bold" />
                    Re-record
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReRecordBubble({
  mode,
  state,
  seconds,
  onStop,
  reduce,
}: {
  mode: CaptureMode;
  state: "recording" | "transcribing";
  seconds: number;
  onStop: () => void;
  reduce: boolean;
}) {
  return (
    <div className="rounded-2xl rounded-tr-md bg-ink-raise px-4 py-4 ring-1 ring-marigold/30">
      {state === "recording" ? (
        <div className="flex items-center gap-3">
          <RecDot />
          <span className="font-ui text-sm text-bone">
            Re-recording · {mode === "film" ? "camera" : "mic"} · {fmt(seconds)}
          </span>
          <button
            type="button"
            onClick={onStop}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-bone px-3 py-1.5 font-ui text-xs font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <Stop size={13} weight="fill" />
            Use this take
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2.5">
          <TypingDots />
          <span className="font-ui text-sm text-bone/60">
            {reduce ? "Saving take…" : "Refreshing your clip…"}
          </span>
        </div>
      )}
    </div>
  );
}

/* The live capture surface for the open question. */
function CaptureDock({
  mode,
  onMode,
  state,
  seconds,
  busy,
  onRecord,
  onStop,
  canBuild,
  question,
  beatLabel,
}: {
  mode: CaptureMode;
  onMode: (m: CaptureMode) => void;
  state: CaptureState;
  seconds: number;
  busy: boolean;
  onRecord: () => void;
  onStop: () => void;
  canBuild: boolean;
  question?: string;
  beatLabel?: string;
}) {
  const recording = state === "recording";
  const transcribing = state === "transcribing";

  return (
    <div className="rounded-3xl border border-line bg-ink-soft p-4 sm:p-5">
      {question && !recording && !transcribing && (
        <div className="mb-4 flex items-start gap-2.5 border-b border-line pb-4">
          <Sparkle size={15} weight="fill" className="mt-0.5 shrink-0 text-marigold" />
          <p className="font-ui text-sm leading-snug text-bone/80">
            <span className="meta mr-2 text-bone-dim">
              {beatLabel ?? "Answering"}
            </span>
            {question}
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mode toggle */}
        <div
          role="radiogroup"
          aria-label="Answer with film or voice"
          className="inline-flex rounded-full bg-ink p-1 ring-1 ring-line"
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
                disabled={busy}
                onClick={() => onMode(m)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-ui text-sm capitalize transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                  on ? "bg-bone text-ink" : "text-bone/70 hover:text-bone",
                )}
              >
                <ModeIcon size={16} weight={on ? "fill" : "regular"} />
                {m}
              </button>
            );
          })}
        </div>

        {canBuild && !busy && (
          <Link
            href="/sell/studio"
            className="flex items-center gap-1.5 font-ui text-sm font-medium text-marigold transition-colors hover:text-marigold-bright"
          >
            Skip ahead — build my world
            <ArrowRight size={15} weight="bold" />
          </Link>
        )}
      </div>

      {/* Capture body */}
      <div className="mt-4">
        {recording ? (
          <CapturePreview mode={mode} seconds={seconds} onStop={onStop} />
        ) : transcribing ? (
          <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-5 ring-1 ring-line">
            <TypingDots />
            <span className="font-ui text-sm text-bone/60">
              Transcribing your answer…
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRecord}
            className="group flex w-full items-center gap-4 rounded-2xl bg-ink px-4 py-4 text-left ring-1 ring-line transition-colors hover:ring-marigold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-marigold text-ink transition-transform group-hover:scale-105">
              {mode === "film" ? (
                <VideoCamera size={22} weight="fill" />
              ) : (
                <Microphone size={22} weight="fill" />
              )}
            </span>
            <span>
              <span className="block font-ui text-sm font-semibold text-bone">
                {mode === "film" ? "Answer on camera" : "Answer by voice"}
              </span>
              <span className="block font-ui text-xs text-bone/55">
                Take your time — press again when you&#39;re done
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

/* Stand-in for the live camera/mic (no real capture in this environment). */
function CapturePreview({
  mode,
  seconds,
  onStop,
}: {
  mode: CaptureMode;
  seconds: number;
  onStop: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-ink ring-1 ring-marigold/30">
      <div className="relative flex h-36 items-center justify-center bg-ink-raise sm:h-40">
        {mode === "film" ? (
          <div className="relative h-full w-full">
            <Image
              src="/media/clay-shape.jpg"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 40rem"
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-ink/30" />
            <p className="absolute inset-x-0 bottom-3 text-center font-ui text-xs text-bone/80">
              You&#39;re on camera — talk to the lens
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
          {mode === "film" ? "Filming" : "Recording"} your answer
        </span>
        <button
          type="button"
          onClick={onStop}
          className="flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Stop size={15} weight="fill" />
          Done
        </button>
      </div>
    </div>
  );
}

function CompletionDock({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.6, ease: easeOut }}
      className="flex flex-col items-start gap-4 rounded-3xl border border-marigold/30 bg-marigold/[0.08] p-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-marigold text-ink">
          <Check size={24} weight="bold" />
        </span>
        <div>
          <p className="font-display text-lg font-bold text-bone">
            That&#39;s everything we need.
          </p>
          <p className="font-ui text-sm text-bone/70">
            Five beats, in your own words. Let&#39;s turn them into a world.
          </p>
        </div>
      </div>
      <Link
        href="/sell/studio"
        className="group flex shrink-0 items-center gap-2.5 rounded-full bg-marigold px-6 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        Build my world
        <ArrowRight
          size={19}
          weight="bold"
          className="transition-transform group-hover:translate-x-1"
        />
      </Link>
    </motion.div>
  );
}

/* ---- small parts ---- */

function KolMark() {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-marigold/15 text-marigold">
      <Sparkle size={18} weight="fill" />
    </span>
  );
}

function MakerMark() {
  return (
    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-marigold/30">
      <Image src="/media/clay-shape.jpg" alt="" fill sizes="36px" className="object-cover" />
    </span>
  );
}

function RecDot() {
  return (
    <Circle
      size={11}
      weight="fill"
      className="animate-pulse text-error"
      aria-hidden
    />
  );
}

function TypingDots() {
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

/* ---- helpers ---- */

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function bumpDuration(d: string): string {
  const [m, s] = d.split(":").map(Number);
  const total = (m ?? 0) * 60 + (s ?? 0) + 3;
  return fmt(total);
}

function lastMakerId(turns: InterviewTurn[]): string | undefined {
  for (let i = turns.length - 1; i >= 0; i--) {
    if (turns[i]?.speaker === "maker") return turns[i]?.id;
  }
  return undefined;
}
