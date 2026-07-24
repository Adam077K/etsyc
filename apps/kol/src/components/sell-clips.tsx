"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FilmSlate,
  MonitorPlay,
  VideoCamera,
  UploadSimple,
  ArrowClockwise,
  Play,
  Plus,
  Check,
  ArrowRight,
} from "@phosphor-icons/react";
import { MakerFilm } from "@/components/maker-film";
import {
  CLIPS,
  CLIP_GROUPS,
  type Clip,
  type ClipSurface,
} from "@/lib/fixtures/clips";
import {
  CaptureRitual,
  FramingTicks,
  type RitualClip,
} from "@/components/sell-capture";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/* Stable scene numbers — the call sheet reads top to bottom in shooting order,
   so each clip carries the same scene number wherever it appears. */
const SCENE_NO = new Map(CLIPS.map((c, i) => [c.id, i + 1]));
const surfaceLabel = (s: ClipSurface) =>
  CLIP_GROUPS.find((g) => g.id === s)?.label ?? "";

function toRitual(clip: Clip): RitualClip {
  const n = SCENE_NO.get(clip.id);
  return {
    title: clip.title,
    playsOn: clip.playsOn,
    frame: clip.frame,
    keepGoing: clip.keepGoing,
    why: clip.why,
    still: clip.poster ?? clip.hint,
    scene: n ? `Scene ${String(n).padStart(2, "0")} · ${surfaceLabel(clip.surface)}` : undefined,
  };
}

type Filter = "all" | "filmed" | "to-film";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "filmed", label: "Filmed" },
  { id: "to-film", label: "To film" },
];

type ActiveShot = { clip: Clip; re: boolean };

export function SellClips() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState<Clip[]>(CLIPS);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<ActiveShot | null>(null);
  // Focus restoration: remember the control that opened the ritual so focus
  // returns to it (or its equivalent) on exit — the card may have swapped
  // slot→filmed while the ritual was open, so we fall back to a stable trigger.
  const invokerRef = useRef<HTMLElement | null>(null);
  const restoreIdRef = useRef<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), reduce ? 0 : 500);
    return () => clearTimeout(t);
  }, [reduce]);

  // When the ritual closes, return focus to the invoking control if it's still
  // in the DOM, else re-query the equivalent trigger for that clip.
  useEffect(() => {
    if (active) return;
    const id = restoreIdRef.current;
    if (!id) return;
    restoreIdRef.current = null;
    const invoker = invokerRef.current;
    invokerRef.current = null;
    requestAnimationFrame(() => {
      if (invoker?.isConnected) {
        invoker.focus();
        return;
      }
      document
        .querySelector<HTMLElement>(`[data-shot-trigger="${id}"]`)
        ?.focus();
    });
  }, [active]);

  const filmedCount = clips.filter((c) => c.filmed).length;
  const toFilmCount = clips.length - filmedCount;
  const toFilm = clips.filter((c) => !c.filmed);

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

  function openShot(clip: Clip, re: boolean) {
    invokerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    restoreIdRef.current = clip.id;
    setActive({ clip, re });
  }

  function keepTake(duration: string) {
    if (!active) return;
    const { clip, re } = active;
    setClips((prev) =>
      prev.map((c) =>
        c.id === clip.id
          ? re
            ? { ...c, duration }
            : {
                ...c,
                filmed: true,
                duration,
                poster: c.poster ?? c.hint ?? "/media/clay-shape.jpg",
              }
          : c,
      ),
    );
    setActive(null);
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
              <SceneHeading group={group} />
              {/* The lone cover otherwise strands the right half of the first
                  viewport; pair it with a compact "still to film" call sheet so
                  the remaining slots are visible immediately (the full, actionable
                  shot cards still live in their surface sections below). */}
              {group.id === "cover" &&
              group.clips.length === 1 &&
              filter === "all" &&
              toFilm.length > 0 ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="grid grid-cols-1">
                    {group.clips.map((clip, i) => (
                      <ClipCard
                        key={clip.id}
                        clip={clip}
                        index={i}
                        reduce={!!reduce}
                        onOpen={openShot}
                      />
                    ))}
                  </div>
                  <StillToFilm clips={toFilm} onOpen={openShot} />
                </div>
              ) : (
                <div className={groupGridClass(group.id, group.clips.length)}>
                  {group.clips.map((clip, i) => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      index={i}
                      reduce={!!reduce}
                      onOpen={openShot}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && (
          <CaptureRitual
            key={active.clip.id}
            clip={toRitual(active.clip)}
            onKeep={(_mode, duration) => keepTake(duration)}
            onClose={() => setActive(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* The call-sheet scene heading for each surface group. */
function SceneHeading({
  group,
}: {
  group: { id: ClipSurface; label: string; note: string; clips: Clip[] };
}) {
  const filmed = group.clips.filter((c) => c.filmed).length;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-line pb-3">
      <div className="max-w-measure">
        <h2 className="font-display text-2xl font-bold text-bone">
          {group.label}
        </h2>
        <p className="mt-1.5 font-serif text-[0.98rem] leading-snug text-bone/60">
          {group.note}
        </p>
      </div>
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-bone-dim">
        {filmed}/{group.clips.length} in the can
      </p>
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

/* The call sheet, in miniature — the un-filmed shots as a numbered shooting
   list beside the lone cover so the first viewport reads as a plan, not a
   half-empty grid. Each row jumps straight into the viewfinder ritual. */
function StillToFilm({
  clips,
  onOpen,
}: {
  clips: Clip[];
  onOpen: (clip: Clip, re: boolean) => void;
}) {
  return (
    <aside className="flex flex-col rounded-3xl border border-dashed border-bone/20 bg-ink-soft/30 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="meta text-bone-dim">Call sheet</p>
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-marigold">
          {clips.length} to shoot
        </span>
      </div>
      <p className="mt-2 font-serif text-lg leading-snug text-bone/80">
        Every shot below plays somewhere a buyer will see it. Pick one and step
        into the frame.
      </p>
      <ul className="mt-4 space-y-1.5">
        {clips.map((clip) => (
          <li key={clip.id}>
            <button
              type="button"
              onClick={() => onOpen(clip, false)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-bone/15 bg-ink/40 px-3 py-2.5 text-left transition-colors hover:border-marigold/40 hover:bg-ink/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-soft font-mono text-[0.7rem] font-semibold tabular-nums text-marigold">
                {String(SCENE_NO.get(clip.id) ?? 0).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-ui text-sm font-medium text-bone/90">
                  {clip.title}
                </span>
                <span className="block truncate font-ui text-xs text-bone/55">
                  {clip.playsOn}
                </span>
              </span>
              <ArrowRight
                size={15}
                weight="bold"
                className="shrink-0 text-bone/30 transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-marigold"
              />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
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
  const total = filmed + toFilm;
  const pct = total ? Math.round((filmed / total) * 100) : 0;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
      <div>
        <p className="meta text-marigold">Call sheet · Odd Clay Studio</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[0.95] text-bone sm:text-5xl">
          The film library
        </h1>
        <p className="mt-3 max-w-md font-serif text-lg leading-snug text-bone/70">
          {loading
            ? "Rounding up your footage…"
            : toFilm > 0
              ? `${filmed} in the can, ${toFilm} still to shoot. Every clip here plays somewhere a buyer will see it.`
              : `All ${filmed} shots are in the can. Your world is fully on film.`}
        </p>
      </div>

      {/* Progress — the reel filling up, effort made legible. */}
      {!loading && (
        <div className="w-full max-w-[15rem]">
          <div className="flex items-baseline justify-between font-mono text-[0.7rem] uppercase tracking-[0.14em] text-bone-dim">
            <span>In the can</span>
            <span className="text-bone">
              {filmed}<span className="text-bone/40"> / {total}</span>
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-raise">
            <div
              className="h-full rounded-full bg-marigold transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
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

function ClipCard({
  clip,
  index,
  reduce,
  onOpen,
}: {
  clip: Clip;
  index: number;
  reduce: boolean;
  onOpen: (clip: Clip, re: boolean) => void;
}) {
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.5, delay: index * 0.05, ease: easeOut }}
      className="h-full"
    >
      {clip.filmed ? (
        <FilmedCard clip={clip} reduce={reduce} onReRecord={() => onOpen(clip, true)} />
      ) : (
        <SlotCard clip={clip} onFilm={() => onOpen(clip, false)} />
      )}
    </motion.div>
  );
}

/* The scene-number slate — a small clapperboard chip shared by every card so
   the library reads as one ordered shooting plan. */
function SceneSlate({ clip, tone }: { clip: Clip; tone: "filmed" | "slot" }) {
  const n = SCENE_NO.get(clip.id);
  if (!n) return null;
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] backdrop-blur-sm",
        tone === "filmed"
          ? "bg-marigold/90 text-ink"
          : "bg-ink/75 text-marigold ring-1 ring-marigold/30",
      )}
    >
      {tone === "filmed" ? (
        <Check size={11} weight="bold" />
      ) : (
        <FilmSlate size={11} weight="fill" />
      )}
      Scene {String(n).padStart(2, "0")}
    </span>
  );
}

function FilmedCard({
  clip,
  reduce,
  onReRecord,
}: {
  clip: Clip;
  reduce: boolean;
  onReRecord: () => void;
}) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl bg-ink-soft ring-1 ring-line transition-colors hover:ring-marigold/30">
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
        {/* Framing ticks bloom marigold on hover — the viewfinder signature,
            carried quietly onto the finished shot (subtle at rest). */}
        <div className="opacity-40 transition-opacity duration-500 group-hover:opacity-0">
          <FramingTicks inset="inset-2.5" />
        </div>
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <FramingTicks inset="inset-2.5" active />
        </div>
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
        <span className="absolute left-2.5 top-2.5">
          <SceneSlate clip={clip} tone="filmed" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-ui text-[0.95rem] font-semibold text-bone">
          {clip.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 font-ui text-xs text-bone/55">
          <MonitorPlay size={14} className="shrink-0 text-marigold" />
          <span>Plays on: {clip.playsOn}</span>
        </p>
        {clip.why && (
          <p className="mt-2 font-serif text-[0.9rem] leading-snug text-bone/55">
            {clip.why}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={onReRecord}
            data-shot-trigger={clip.id}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-ui text-xs font-medium text-marigold transition-colors hover:bg-marigold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <ArrowClockwise size={13} weight="bold" />
            Film another take
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
  onFilm: () => void;
}) {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-dashed border-bone/20 bg-ink-soft/40 transition-colors hover:border-marigold/40">
      <button
        type="button"
        onClick={onFilm}
        aria-label={`Film ${clip.title}`}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-marigold"
      >
        {clip.hint && (
          <Image
            src={clip.hint}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 28rem"
            className="object-cover opacity-20 grayscale transition-opacity duration-500 group-hover:opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-ink/40" />
        {/* The empty slot wears the viewfinder ticks — an invitation to frame,
            not an error. Marigold on hover as the frame "arms". */}
        <div className="opacity-60 transition-opacity duration-500 group-hover:opacity-0">
          <FramingTicks inset="inset-3" />
        </div>
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <FramingTicks inset="inset-3" active />
        </div>
        <span className="absolute left-2.5 top-2.5">
          <SceneSlate clip={clip} tone="slot" />
        </span>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-ink/70 text-marigold ring-1 ring-marigold/25 transition-transform duration-500 group-hover:scale-105">
            <VideoCamera size={20} weight="light" />
          </span>
          <p className="font-ui text-sm font-semibold text-bone">Ready when you are</p>
          <p className="max-w-[15rem] font-ui text-xs leading-snug text-bone/60">
            Step into the frame — two minutes with your phone is all it takes.
          </p>
        </div>
      </button>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-ui text-[0.95rem] font-semibold text-bone">
          {clip.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 font-ui text-xs text-bone/55">
          <MonitorPlay size={14} className="shrink-0 text-marigold" />
          <span>Plays on: {clip.playsOn}</span>
        </p>
        {clip.why && (
          <p className="mt-2 font-serif text-[0.9rem] leading-snug text-bone/70">
            {clip.why}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={onFilm}
            data-shot-trigger={clip.id}
            className="flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1.5 font-ui text-xs font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <VideoCamera size={14} weight="fill" />
            Step into the frame
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
