"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  EnvelopeSimpleOpen,
  PaperPlaneTilt,
  VideoCamera,
  Microphone,
  PencilSimple,
  ArrowLeft,
  Check,
  CaretRight,
  Play,
} from "@phosphor-icons/react";
import {
  LETTERS,
  type Letter,
  type LetterEntry,
  type LetterStatus,
  type ReplyMode,
} from "@/lib/fixtures/inbox";
import { MAKER_AVATAR } from "@/lib/seller-identity";
import { CaptureStage, CaptureSaving, fmt } from "@/components/sell-capture";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Filter = "all" | "needs-reply" | "answered";
type ComposeMode = "write" | "film" | "voice";
type CaptureState = "idle" | "recording" | "saving";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "needs-reply", label: "Needs a reply" },
  { id: "answered", label: "Answered" },
  { id: "all", label: "All" },
];

export function SellMessages() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [letters, setLetters] = useState<Letter[]>(LETTERS);
  const [filter, setFilter] = useState<Filter>("needs-reply");
  const [selectedId, setSelectedId] = useState<string | null>(
    LETTERS[0]?.id ?? null,
  );

  // Brief warm skeleton on first paint, per the design system's loading state.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), reduce ? 0 : 500);
    return () => clearTimeout(t);
  }, [reduce]);

  const counts = useMemo(
    () => ({
      "needs-reply": letters.filter((l) => l.status === "needs-reply").length,
      answered: letters.filter((l) => l.status === "answered").length,
      all: letters.length,
    }),
    [letters],
  );

  const visible = useMemo(
    () =>
      filter === "all"
        ? letters
        : letters.filter((l) => l.status === filter),
    [letters, filter],
  );

  const selected = letters.find((l) => l.id === selectedId) ?? null;

  function handleSend(entry: LetterEntry) {
    if (!selected) return;
    setLetters((prev) =>
      prev.map((l) =>
        l.id === selected.id
          ? {
              ...l,
              status: "answered" as LetterStatus,
              preview:
                entry.mode === "text"
                  ? entry.body
                  : `You replied ${entry.mode === "film" ? "on film" : "by voice"}.`,
              thread: [...l.thread, entry],
              draftReply: undefined,
            }
          : l,
      ),
    );
  }

  return (
    <div className="mx-auto max-w-issue px-5 pb-16 pt-24 sm:px-8 sm:pt-28">
      <Header count={counts["needs-reply"]} loading={loading} />

      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr] lg:gap-8">
        {/* ---- Letter list ---- */}
        <section
          aria-label="Your letters"
          className={cn(selected ? "hidden lg:block" : "block")}
        >
          <FilterBar filter={filter} onChange={setFilter} counts={counts} />
          {loading ? (
            <ListSkeleton />
          ) : visible.length === 0 ? (
            <EmptyList filter={filter} />
          ) : (
            <ul className="mt-4 space-y-2">
              {visible.map((letter, i) => (
                <LetterRow
                  key={letter.id}
                  letter={letter}
                  active={letter.id === selectedId}
                  index={i}
                  reduce={!!reduce}
                  onOpen={() => setSelectedId(letter.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* ---- Open letter ---- */}
        <section
          aria-label="Conversation"
          className={cn(selected ? "block" : "hidden lg:block")}
        >
          {loading ? (
            <ThreadSkeleton />
          ) : selected ? (
            <OpenLetter
              key={selected.id}
              letter={selected}
              reduce={!!reduce}
              onBack={() => setSelectedId(null)}
              onSend={handleSend}
            />
          ) : (
            <NoSelection />
          )}
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Header({ count, loading }: { count: number; loading: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <p className="meta text-bone-dim">Ask the Maker</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[0.95] text-bone sm:text-5xl">
          Your letters
        </h1>
      </div>
      <p className="max-w-sm font-serif text-lg leading-snug text-bone/70">
        {loading
          ? "Gathering the post…"
          : count > 0
            ? `${count} ${count === 1 ? "buyer is" : "buyers are"} waiting to hear from you. Answer in your own words — or on film.`
            : "Everyone's heard back. This is where new questions land."}
      </p>
    </div>
  );
}

function FilterBar({
  filter,
  onChange,
  counts,
}: {
  filter: Filter;
  onChange: (f: Filter) => void;
  counts: Record<Filter, number>;
}) {
  return (
    <div
      role="group"
      aria-label="Filter letters"
      className="flex flex-wrap items-center gap-1.5"
    >
      {FILTERS.map((f) => {
        const on = filter === f.id;
        return (
          <button
            key={f.id}
            aria-pressed={on}
            onClick={() => onChange(f.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-3.5 py-1.5 font-ui text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              on
                ? "bg-bone text-ink"
                : "text-bone/60 ring-1 ring-line hover:text-bone",
            )}
          >
            {f.label}
            <span
              className={cn(
                "font-mono text-[0.7rem] tabular-nums",
                on ? "text-ink/55" : "text-bone/40",
              )}
            >
              {counts[f.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function LetterRow({
  letter,
  active,
  index,
  reduce,
  onOpen,
}: {
  letter: Letter;
  active: boolean;
  index: number;
  reduce: boolean;
  onOpen: () => void;
}) {
  const needsReply = letter.status === "needs-reply";
  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.4, delay: index * 0.04, ease: easeOut }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={cn(
          "group flex w-full items-start gap-3 rounded-2xl p-3 text-left ring-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold",
          active
            ? "bg-ink-soft ring-marigold/35"
            : "ring-line hover:bg-ink-soft hover:ring-line",
        )}
      >
        <span className="relative mt-0.5 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-raise font-ui text-sm font-semibold text-bone/80 ring-1 ring-line">
          {letter.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-ui text-[0.95rem] font-semibold text-bone">
              {letter.buyerFirst}
              <span className="font-normal text-bone/60"> · {letter.buyerPlace}</span>
            </span>
            <span className="shrink-0 font-mono text-[0.65rem] text-bone-dim">
              {letter.at}
            </span>
          </span>
          <span className="mt-0.5 flex items-center gap-1.5">
            <span className="truncate font-ui text-xs text-marigold">
              {letter.subject}
            </span>
          </span>
          <span className="mt-1 line-clamp-2 font-serif text-sm leading-snug text-bone/60">
            {letter.preview}
          </span>
        </span>
        <span className="mt-1 shrink-0">
          {needsReply ? (
            <span
              aria-label="Needs a reply"
              className="block h-2 w-2 rounded-full bg-marigold"
            />
          ) : (
            <Check size={14} weight="bold" className="text-bone/35" aria-label="Answered" />
          )}
        </span>
      </button>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */

function OpenLetter({
  letter,
  reduce,
  onBack,
  onSend,
}: {
  letter: Letter;
  reduce: boolean;
  onBack: () => void;
  onSend: (entry: LetterEntry) => void;
}) {
  const answered = letter.status === "answered";
  // OpenLetter remounts per letter (keyed by id in the parent), so a needs-reply
  // letter opens straight into the composer; "Write again" re-opens it on an
  // answered one. Deriving avoids resetting state inside an effect.
  const [reopened, setReopened] = useState(false);
  const [sentAnnounce, setSentAnnounce] = useState("");
  const composing = letter.status === "needs-reply" || reopened;
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) return;
    anchor.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [letter.thread.length, composing, reduce]);

  return (
    <div className="flex min-h-[32rem] flex-col rounded-3xl border border-line bg-ink-soft/40">
      {/* Thread header — reads as a letter about a piece, not a ticket. */}
      <div className="flex items-center gap-3 border-b border-line p-4 sm:p-5">
        <button
          type="button"
          onClick={onBack}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-bone/70 transition-colors hover:bg-ink-raise hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold lg:hidden"
          aria-label="Back to letters"
        >
          <ArrowLeft size={18} weight="bold" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold leading-tight text-bone">
            {letter.buyerFirst}
            <span className="font-ui text-sm font-normal text-bone/60">
              {" "}
              from {letter.buyerPlace}
            </span>
          </p>
          <p className="mt-0.5 font-ui text-xs text-bone/60">
            {answered ? "You've answered" : "Waiting on you"}
          </p>
          {/* On mobile the About chip is hidden, so name the piece here. */}
          <p className="mt-1 font-ui text-xs text-marigold sm:hidden">
            About · {letter.subject}
          </p>
        </div>
        <AboutChip letter={letter} />
      </div>

      {/* The exchange */}
      <div className="flex-1 space-y-5 p-4 sm:p-6">
        {letter.thread.map((entry) => (
          <ThreadEntry key={entry.id} entry={entry} letter={letter} reduce={reduce} />
        ))}
        <div ref={anchor} className="h-0" />
      </div>

      {/* Composer / answered footer */}
      <div className="border-t border-line p-4 sm:p-5">
        <p role="status" aria-live="polite" className="sr-only">
          {sentAnnounce}
        </p>
        {composing ? (
          <Composer
            letter={letter}
            reduce={reduce}
            onSend={(entry) => {
              setReopened(false);
              setSentAnnounce(
                entry.mode === "text"
                  ? "Reply sent"
                  : `Reply sent on ${entry.mode === "film" ? "film" : "voice"}`,
              );
              onSend(entry);
            }}
          />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-ui text-sm text-bone/60">
              <Check size={16} weight="bold" className="text-marigold" />
              Answered — they&rsquo;ll get a note the moment you reply again.
            </span>
            <button
              type="button"
              onClick={() => setReopened(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-ui text-sm font-medium text-marigold transition-colors hover:bg-marigold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <PencilSimple size={15} weight="bold" />
              Write again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AboutChip({ letter }: { letter: Letter }) {
  const href = letter.productId
    ? `/m/odd-clay/p/${letter.productId}`
    : "/m/odd-clay";
  return (
    <Link
      href={href}
      className="hidden shrink-0 items-center gap-2.5 rounded-full bg-ink-raise py-1 pl-1 pr-3 ring-1 ring-line transition-colors hover:ring-marigold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold sm:flex"
    >
      <span className="relative h-8 w-8 overflow-hidden rounded-full">
        <Image src={letter.image} alt="" fill sizes="32px" className="object-cover" />
      </span>
      <span className="text-left">
        <span className="meta block text-bone-dim">About</span>
        <span className="block font-ui text-xs font-medium text-bone">
          {letter.subject}
        </span>
      </span>
    </Link>
  );
}

function ThreadEntry({
  entry,
  letter,
  reduce,
}: {
  entry: LetterEntry;
  letter: Letter;
  reduce: boolean;
}) {
  const isMaker = entry.from === "maker";
  const filmed = entry.mode === "film" || entry.mode === "voice";

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.45, ease: easeOut }}
      className={cn("flex gap-3", isMaker ? "flex-row-reverse" : "flex-row")}
    >
      {isMaker ? (
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-marigold/30">
          <Image src={MAKER_AVATAR} alt="" fill sizes="36px" className="object-cover" />
        </span>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-raise font-ui text-xs font-semibold text-bone/75 ring-1 ring-line">
          {letter.initials}
        </span>
      )}

      <div className={cn("max-w-md", isMaker ? "items-end" : "items-start")}>
        <div
          className={cn(
            "mb-1.5 flex items-center gap-2",
            isMaker ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="meta text-bone-dim">
            {isMaker ? "You" : letter.buyerFirst}
          </span>
          <span className="font-mono text-[0.65rem] text-bone/35">{entry.at}</span>
        </div>

        {filmed ? (
          <FilmReplyCard entry={entry} />
        ) : (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 font-serif text-[0.98rem] leading-relaxed ring-1",
              isMaker
                ? "rounded-tr-md bg-marigold/[0.12] text-bone ring-marigold/20"
                : "rounded-tl-md bg-ink-soft text-bone/85 ring-line",
            )}
          >
            {entry.body}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FilmReplyCard({ entry }: { entry: LetterEntry }) {
  const isVoice = entry.mode === "voice";
  return (
    <div className="overflow-hidden rounded-2xl rounded-tr-md ring-1 ring-marigold/25">
      <div className="relative flex h-36 w-64 max-w-full items-center justify-center bg-ink-raise">
        <Image
          src={MAKER_AVATAR}
          alt=""
          fill
          sizes="16rem"
          className={cn("object-cover", isVoice ? "opacity-40" : "opacity-75")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-bone/90 text-ink">
          {isVoice ? <Microphone size={22} weight="fill" /> : <Play size={22} weight="fill" />}
        </span>
        <span className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-ink/80 px-2 py-0.5 backdrop-blur-sm">
          {isVoice ? (
            <Microphone size={11} weight="fill" className="text-marigold" />
          ) : (
            <VideoCamera size={11} weight="fill" className="text-marigold" />
          )}
          <span className="font-mono text-[0.65rem] tabular-nums text-bone">
            {entry.duration ?? "0:20"}
          </span>
        </span>
      </div>
      {entry.body && (
        <p className="bg-marigold/[0.1] px-3.5 py-2.5 font-serif text-sm leading-snug text-bone/85">
          {entry.body}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Composer({
  letter,
  reduce,
  onSend,
}: {
  letter: Letter;
  reduce: boolean;
  onSend: (entry: LetterEntry) => void;
}) {
  // The Composer mounts fresh per open letter (its parent is keyed by letter
  // id), so useState initializers carry the per-letter reset — no effect needed.
  const [mode, setMode] = useState<ComposeMode>("write");
  const [text, setText] = useState(letter.draftReply ?? "");
  const [capture, setCapture] = useState<CaptureState>("idle");
  const [seconds, setSeconds] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recording timer.
  useEffect(() => {
    if (capture !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [capture]);

  // Grow the textarea with its content so the drafted reply is fully reviewable
  // (capped, then it scrolls). Pure DOM write, so no state churn.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
  }, [text, mode]);

  // Cancel a pending save if the composer unmounts mid-send.
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  function startCapture(m: "film" | "voice") {
    setMode(m);
    setSeconds(0);
    setCapture("recording");
  }

  function stopCapture() {
    const replyMode: ReplyMode = mode === "voice" ? "voice" : "film";
    setCapture("saving");
    saveTimer.current = setTimeout(
      () => {
        onSend({
          id: `${letter.id}-r-${Date.now()}`,
          from: "maker",
          mode: replyMode,
          duration: fmt(Math.max(seconds, 3)),
          at: "Just now",
          body: "",
        });
        setCapture("idle");
      },
      reduce ? 150 : 1200,
    );
  }

  function sendText() {
    const value = text.trim();
    if (!value) return;
    onSend({
      id: `${letter.id}-r-${Date.now()}`,
      from: "maker",
      mode: "text",
      at: "Just now",
      body: value,
    });
  }

  if (capture !== "idle") {
    return (
      <div className="space-y-3">
        {capture === "recording" ? (
          <CaptureStage
            mode={mode === "voice" ? "voice" : "film"}
            seconds={seconds}
            onStop={stopCapture}
            stopLabel="Send this take"
            hint="Answer their question — 20 seconds is plenty"
          />
        ) : (
          <CaptureSaving label="Sending your reply…" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Film-first — the differentiator, even in support. */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => startCapture("film")}
          className="group flex flex-1 items-center gap-3 rounded-2xl bg-marigold px-4 py-3 text-left text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink/15">
            <VideoCamera size={22} weight="fill" />
          </span>
          <span>
            <span className="block font-ui text-sm font-semibold">
              Answer on film
            </span>
            <span className="block font-ui text-xs text-ink/70">
              A 20-second reply — the thing buyers remember
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => startCapture("voice")}
          className="flex items-center gap-2 rounded-2xl px-4 py-3 font-ui text-sm font-medium text-bone/80 ring-1 ring-line transition-colors hover:text-bone hover:ring-bone/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Microphone size={18} weight="fill" className="text-marigold" />
          Voice
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-ui text-xs text-bone/40">or write it</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      {/* Written reply — pre-drafted in the maker's voice where KOL has one. */}
      <div className="rounded-2xl bg-ink ring-1 ring-line focus-within:ring-marigold/40">
        {letter.draftReply && text === letter.draftReply && (
          <p className="flex items-center gap-1.5 px-4 pt-3 font-ui text-xs text-bone/50">
            <PencilSimple size={13} weight="bold" className="text-marigold" />
            Drafted in your voice — edit anything before it goes.
          </p>
        )}
        <label htmlFor="reply" className="sr-only">
          Your reply to {letter.buyerFirst}
        </label>
        <textarea
          id="reply"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={`Write back to ${letter.buyerFirst}…`}
          className="block max-h-48 w-full resize-none overflow-y-auto bg-transparent px-4 py-3 font-serif text-[0.98rem] leading-relaxed text-bone placeholder:text-bone/35 focus:outline-none"
        />
        <div className="flex items-center justify-end px-3 pb-3">
          <button
            type="button"
            onClick={sendText}
            disabled={!text.trim()}
            className="flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <PaperPlaneTilt size={15} weight="fill" />
            Send reply
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function EmptyList({ filter }: { filter: Filter }) {
  const message =
    filter === "needs-reply"
      ? "No letters today. Every buyer has heard back from you."
      : filter === "answered"
        ? "Nothing answered yet — replies you send will settle here."
        : "No letters yet. When a buyer asks about a piece, it lands here.";
  return (
    <div className="mt-4 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-soft text-marigold">
        <EnvelopeSimpleOpen size={26} weight="light" />
      </span>
      <p className="max-w-xs font-serif text-lg leading-snug text-bone/75">
        {message}
      </p>
      <p className="max-w-xs font-ui text-sm text-bone/45">
        You can always answer in your own words, or on film.
      </p>
    </div>
  );
}

function NoSelection() {
  return (
    <div className="hidden min-h-[32rem] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line px-6 text-center lg:flex">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-ink-soft text-bone/50">
        <CaretRight size={22} weight="light" />
      </span>
      <p className="font-serif text-lg text-bone/60">Choose a letter to read it.</p>
    </div>
  );
}

/* ---- loading skeletons ---- */

function ListSkeleton() {
  return (
    <div className="mt-4 space-y-2" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="shimmer-sweep flex items-start gap-3 rounded-2xl p-3 ring-1 ring-line"
        >
          <div className="h-11 w-11 shrink-0 rounded-full bg-ink-raise" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-1/2 rounded bg-ink-raise" />
            <div className="h-2.5 w-1/3 rounded bg-ink-raise" />
            <div className="h-2.5 w-4/5 rounded bg-ink-raise" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div
      className="min-h-[32rem] rounded-3xl border border-line bg-ink-soft/40 p-6"
      aria-hidden
    >
      <div className="shimmer-sweep space-y-6">
        <div className="h-24 w-3/4 rounded-2xl bg-ink-raise" />
        <div className="ml-auto h-32 w-4/5 rounded-2xl bg-ink-raise" />
      </div>
    </div>
  );
}
