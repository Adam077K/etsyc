"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  FilmSlate,
  MonitorPlay,
  VideoCamera,
  UploadSimple,
  ArrowClockwise,
  Play,
  Plus,
  Check,
} from "@phosphor-icons/react";
import { MakerFilm } from "@/components/maker-film";
import {
  CLIPS,
  CLIP_GROUPS,
  type Clip,
  type ClipSurface,
} from "@/lib/fixtures/clips";
import { CaptureStage, CaptureSaving, fmt } from "@/components/sell-capture";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Filter = "all" | "filmed" | "to-film";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "filmed", label: "Filmed" },
  { id: "to-film", label: "To film" },
];

export function SellClips() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState<Clip[]>(CLIPS);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), reduce ? 0 : 500);
    return () => clearTimeout(t);
  }, [reduce]);

  const filmedCount = clips.filter((c) => c.filmed).length;
  const toFilmCount = clips.length - filmedCount;

  const counts: Record<Filter, number> = {
    all: clips.length,
    filmed: filmedCount,
    "to-film": toFilmCount,
  };

  const shown = useMemo(
    () =>
      clips.filter((c) =>
        filter === "all"
          ? true
          : filter === "filmed"
            ? c.filmed
            : !c.filmed,
      ),
    [clips, filter],
  );

  const groups = CLIP_GROUPS.map((g) => ({
    ...g,
    clips: shown.filter((c) => c.surface === g.id),
  })).filter((g) => g.clips.length > 0);

  function markFilmed(id: string, duration: string) {
    setClips((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              filmed: true,
              duration,
              poster: c.poster ?? c.hint ?? "/media/clay-shape.jpg",
            }
          : c,
      ),
    );
  }

  function bumpDuration(id: string, duration: string) {
    setClips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, duration } : c)),
    );
  }

  return (
    <div className="mx-auto max-w-issue px-5 pb-20 pt-24 sm:px-8 sm:pt-28">
      <Header filmed={filmedCount} toFilm={toFilmCount} loading={loading} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <FilterBar filter={filter} onChange={setFilter} counts={counts} />
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Uploads open once your shop is live"
          className="flex items-center gap-2 rounded-full border border-bone/20 px-4 py-2 font-ui text-sm font-medium text-bone/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <UploadSimple size={17} weight="bold" className="text-marigold/60" />
          Add a film
        </button>
      </div>

      {loading ? (
        <LibrarySkeleton />
      ) : groups.length === 0 ? (
        <EmptyLibrary filter={filter} />
      ) : (
        <div className="mt-10 space-y-14">
          {groups.map((group) => (
            <section key={group.id} aria-label={group.label}>
              <div className="max-w-measure">
                <h2 className="font-display text-2xl font-bold text-bone">
                  {group.label}
                </h2>
                <p className="mt-1.5 font-serif text-[0.98rem] leading-snug text-bone/60">
                  {group.note}
                </p>
              </div>
              <div className={groupGridClass(group.id, group.clips.length)}>
                {group.clips.map((clip, i) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    index={i}
                    reduce={!!reduce}
                    onFilmed={markFilmed}
                    onReRecorded={bumpDuration}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* Each surface gets its own footprint — never one uniform grid across the page.
   A lone clip fills a right-sized single column instead of orphaning an empty one. */
function groupGridClass(surface: ClipSurface, count: number): string {
  if (count === 1) {
    return surface === "cover"
      ? "mt-5 grid grid-cols-1 max-w-2xl"
      : "mt-5 grid grid-cols-1 max-w-sm";
  }
  switch (surface) {
    case "cover":
      return "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr]";
    case "studio":
    case "after-sale":
      return "mt-5 grid gap-4 sm:grid-cols-2";
    default:
      return "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3";
  }
}

/* ------------------------------------------------------------------ */

function Header({
  filmed,
  toFilm,
  loading,
}: {
  filmed: number;
  toFilm: number;
  loading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <p className="meta text-marigold">Your films</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[0.95] text-bone sm:text-5xl">
          The film library
        </h1>
      </div>
      <p className="max-w-sm font-serif text-lg leading-snug text-bone/70">
        {loading
          ? "Rounding up your footage…"
          : toFilm > 0
            ? `${filmed} filmed, ${toFilm} still to shoot. Every clip below plays somewhere a buyer will see it.`
            : `All ${filmed} clips are filmed. Your world is fully on film.`}
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
    <div role="group" aria-label="Filter films" className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((f) => {
        const on = filter === f.id;
        return (
          <button
            key={f.id}
            aria-pressed={on}
            onClick={() => onChange(f.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-3.5 py-1.5 font-ui text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              on ? "bg-bone text-ink" : "text-bone/60 ring-1 ring-line hover:text-bone",
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

/* ------------------------------------------------------------------ */

type CardCapture =
  | { kind: "idle" }
  | { kind: "recording"; mode: "film" | "voice"; re: boolean }
  | { kind: "saving"; re: boolean };

function ClipCard({
  clip,
  index,
  reduce,
  onFilmed,
  onReRecorded,
}: {
  clip: Clip;
  index: number;
  reduce: boolean;
  onFilmed: (id: string, duration: string) => void;
  onReRecorded: (id: string, duration: string) => void;
}) {
  const [cap, setCap] = useState<CardCapture>({ kind: "idle" });
  const [seconds, setSeconds] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (cap.kind !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [cap.kind]);

  // Cancel a pending save if the card unmounts mid-save (e.g. filter change).
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  function start(mode: "film" | "voice", re: boolean) {
    setSeconds(0);
    setCap({ kind: "recording", mode, re });
  }

  function stop() {
    if (cap.kind !== "recording") return;
    const wasRe = cap.re;
    setCap({ kind: "saving", re: wasRe });
    saveTimer.current = setTimeout(
      () => {
        const dur = fmt(Math.max(seconds, 4));
        if (wasRe) onReRecorded(clip.id, dur);
        else onFilmed(clip.id, dur);
        setCap({ kind: "idle" });
      },
      reduce ? 150 : 1200,
    );
  }

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.5, delay: index * 0.05, ease: easeOut }}
    >
      {cap.kind !== "idle" ? (
        <div className="rounded-2xl border border-marigold/30 bg-ink-soft p-3">
          {cap.kind === "recording" ? (
            <CaptureStage
              mode={cap.mode}
              seconds={seconds}
              onStop={stop}
              stopLabel="Use this take"
              hint={`${clip.title} — talk to the lens`}
            />
          ) : (
            <CaptureSaving label={cap.re ? "Refreshing your clip…" : "Saving your clip…"} />
          )}
        </div>
      ) : clip.filmed ? (
        <FilmedCard clip={clip} reduce={reduce} onReRecord={(m) => start(m, true)} />
      ) : (
        <SlotCard clip={clip} onFilm={(m) => start(m, false)} />
      )}
    </motion.div>
  );
}

function FilmedCard({
  clip,
  reduce,
  onReRecord,
}: {
  clip: Clip;
  reduce: boolean;
  onReRecord: (mode: "film" | "voice") => void;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl bg-ink-soft ring-1 ring-line transition-colors hover:ring-marigold/30">
      <div className="relative aspect-[4/3] overflow-hidden">
        <MakerFilm
          videoSrc={clip.filmSrc}
          poster={clip.poster ?? "/media/clay-shape.jpg"}
          alt={`${clip.title} — a clip from Odd Clay Studio`}
          reduce={reduce}
          sizes="(max-width: 640px) 100vw, 28rem"
          drift={!clip.filmSrc}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        {!clip.filmSrc && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-bone/90 text-ink transition-transform group-hover:scale-105">
              <Play size={22} weight="fill" />
            </span>
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-ink/80 px-2 py-0.5 backdrop-blur-sm">
          <VideoCamera size={11} weight="fill" className="text-marigold" />
          <span className="font-mono text-[0.65rem] tabular-nums text-bone">
            {clip.duration}
          </span>
        </span>
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-marigold/90 px-2 py-0.5 font-ui text-[0.65rem] font-semibold text-ink">
          <Check size={11} weight="bold" />
          Filmed
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-ui text-[0.95rem] font-semibold text-bone">
          {clip.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 font-ui text-xs text-bone/55">
          <MonitorPlay size={14} className="shrink-0 text-marigold" />
          <span>Plays on: {clip.playsOn}</span>
        </p>
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => onReRecord("film")}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-ui text-xs font-medium text-marigold transition-colors hover:bg-marigold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <ArrowClockwise size={13} weight="bold" />
            Re-record
          </button>
        </div>
      </div>
    </div>
  );
}

function SlotCard({
  clip,
  onFilm,
}: {
  clip: Clip;
  onFilm: (mode: "film" | "voice") => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-bone/20 bg-ink-soft/40 transition-colors hover:border-marigold/40">
      <div className="relative aspect-[4/3] overflow-hidden">
        {clip.hint && (
          <Image
            src={clip.hint}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 28rem"
            className="object-cover opacity-20 grayscale"
          />
        )}
        <div className="absolute inset-0 bg-ink/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/70 text-marigold ring-1 ring-marigold/25">
            <VideoCamera size={20} weight="light" />
          </span>
          <p className="font-ui text-sm font-semibold text-bone">Not filmed yet</p>
          <p className="max-w-[15rem] font-ui text-xs leading-snug text-bone/60">
            Two minutes with your phone is all it takes.
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-ui text-[0.95rem] font-semibold text-bone">
          {clip.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 font-ui text-xs text-bone/55">
          <MonitorPlay size={14} className="shrink-0 text-marigold" />
          <span>Plays on: {clip.playsOn}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={() => onFilm("film")}
            className="flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1.5 font-ui text-xs font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <VideoCamera size={14} weight="fill" />
            Film it
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Uploads open once your shop is live"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-ui text-xs font-medium text-bone/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <UploadSimple size={14} weight="bold" />
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function EmptyLibrary({ filter }: { filter: Filter }) {
  const message =
    filter === "filmed"
      ? "Nothing filmed yet. Every slot is waiting for its first take."
      : "Every slot is filmed. Your whole world is on film.";
  return (
    <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line px-6 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-ink-soft text-marigold">
        {filter === "filmed" ? (
          <VideoCamera size={26} weight="light" />
        ) : (
          <FilmSlate size={26} weight="light" />
        )}
      </span>
      <p className="max-w-xs font-serif text-lg leading-snug text-bone/75">{message}</p>
      {filter === "filmed" && (
        <button
          type="button"
          className="mt-1 flex items-center gap-2 rounded-full bg-marigold px-5 py-2.5 font-ui text-sm font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Plus size={15} weight="bold" />
          Film your first clip
        </button>
      )}
    </div>
  );
}

/* ---- loading skeleton ---- */

function LibrarySkeleton() {
  return (
    <div className="mt-10 space-y-10" aria-hidden>
      {[0, 1].map((g) => (
        <div key={g}>
          <div className="shimmer-sweep h-6 w-40 rounded bg-ink-raise" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="shimmer-sweep overflow-hidden rounded-2xl ring-1 ring-line"
              >
                <div className="aspect-[4/3] bg-ink-raise" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-2/3 rounded bg-ink-raise" />
                  <div className="h-2.5 w-4/5 rounded bg-ink-raise" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
