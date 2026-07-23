"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkle,
  Check,
  ArrowClockwise,
  ArrowRight,
  Stop,
  Circle,
  SpeakerHigh,
  SquaresFour,
  ArrowsClockwise,
  PaintBrushBroad,
} from "@phosphor-icons/react";
import {
  DRAFT_BLOCKS,
  ACCENT_OPTIONS,
  DRAFT_ACCENT,
  STORY_BEATS,
  PUBLISH_HANDLE,
  type DraftBlock,
} from "@/lib/fixtures/sell";
import type { Ground } from "@/lib/fixtures/makers";
import { SellPreview } from "./sell-preview";
import { rise, calm, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const REQUIRED = DRAFT_BLOCKS.filter((b) => !b.optional).length;
const OPTIONAL = DRAFT_BLOCKS.filter((b) => b.optional).length;

export function SellStudio() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(
    DRAFT_BLOCKS.find((b) => !b.draftApproved)?.id ??
      DRAFT_BLOCKS.at(0)?.id ??
      "hero",
  );
  const [approved, setApproved] = useState<Record<string, boolean>>(
    () => Object.fromEntries(DRAFT_BLOCKS.map((b) => [b.id, b.draftApproved])),
  );
  const [accent, setAccent] = useState<Ground>(DRAFT_ACCENT);
  const [variants, setVariants] = useState<Record<string, string>>(
    () => Object.fromEntries(DRAFT_BLOCKS.map((b) => [b.id, b.swaps[0]!.id])),
  );
  const [voiceovers, setVoiceovers] = useState<Set<string>>(new Set());
  const [clip, setClip] = useState<{ state: "recording" | "saving" } | null>(null);
  const [refreshed, setRefreshed] = useState<Set<string>>(new Set());
  const [seconds, setSeconds] = useState(0);

  // The AI composes the first draft on arrival — a genuine loading beat. As it
  // reveals, honour any deep-link (e.g. publish's "Add the closing line" ->
  // ?section=voice); reading the URL post-mount avoids a hydration mismatch on
  // the statically-prerendered page.
  useEffect(() => {
    const t = setTimeout(
      () => {
        setLoading(false);
        const s = new URLSearchParams(window.location.search).get("section");
        if (s && DRAFT_BLOCKS.some((b) => b.id === s)) setSelectedId(s);
      },
      reduce ? 200 : 1300,
    );
    return () => clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    if (clip?.state !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [clip]);

  const selected = DRAFT_BLOCKS.find((b) => b.id === selectedId)!;
  const accentOpt = ACCENT_OPTIONS.find((a) => a.id === accent)!;
  const approvedRequired = DRAFT_BLOCKS.filter(
    (b) => !b.optional && approved[b.id],
  ).length;
  const allRequired = approvedRequired >= REQUIRED;

  function toggleApprove(id: string) {
    setApproved((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // On approving, glide to the next section still needing review.
      if (!prev[id]) {
        const nextUp = DRAFT_BLOCKS.find((b) => b.id !== id && !next[b.id]);
        if (nextUp) setSelectedId(nextUp.id);
      }
      return next;
    });
  }

  function toggleVoice(key: string) {
    setVoiceovers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function stopClip() {
    if (clip?.state !== "recording") return;
    setClip({ state: "saving" });
    window.setTimeout(
      () => {
        setRefreshed((prev) => new Set(prev).add(selectedId));
        setClip(null);
      },
      reduce ? 200 : 1100,
    );
  }

  if (loading) return <StudioSkeleton />;

  const previewState = {
    accentHex: accentOpt.hex,
    accentOn: accentOpt.onGround,
    variants,
    voiceovers,
    selectedId,
    onSelect: (id: string) => {
      setSelectedId(id);
      if (clip) setClip(null);
    },
  };

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-issue flex-col px-4 pb-28 pt-24 sm:px-6 sm:pt-28">
      {/* intro line */}
      <motion.div
        variants={reduce ? calm : rise(20, 0.7)}
        initial="hidden"
        animate="visible"
        className="mb-5"
      >
        <p className="meta text-bone-dim">Your studio · draft</p>
        <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-bone sm:text-3xl">
          Here&#39;s your world. Make it yours.
        </h1>
        <p className="mt-2 max-w-2xl font-ui text-sm leading-relaxed text-bone/65">
          KOL drafted every section from your interview. Review each one, change
          anything, and approve what you love. Nothing goes live until you publish.
        </p>
      </motion.div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[17rem_1fr_20rem]">
        {/* ---- Section list ---- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <p className="meta mb-3 px-1 text-bone-dim">Sections</p>
          <ol className="space-y-1.5">
            {DRAFT_BLOCKS.map((block, i) => (
              <li key={block.id}>
                <SectionRow
                  block={block}
                  index={i + 1}
                  selected={selectedId === block.id}
                  approved={!!approved[block.id]}
                  onSelect={() => setSelectedId(block.id)}
                  onToggle={() => toggleApprove(block.id)}
                />
              </li>
            ))}
          </ol>
        </aside>

        {/* ---- Live preview ---- */}
        <div className="min-w-0">
          <BrowserFrame handle={PUBLISH_HANDLE}>
            <div className="max-h-[72vh] overflow-y-auto">
              <SellPreview {...previewState} />
            </div>
          </BrowserFrame>
        </div>

        {/* ---- Edit panel ---- */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedId}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: reduce ? 0.01 : 0.3, ease: easeOut }}
              className="rounded-3xl border border-line bg-ink-soft p-5"
            >
              <EditPanel
                block={selected}
                accent={accent}
                onAccent={setAccent}
                variant={variants[selected.id]!}
                onVariant={(v) => setVariants((p) => ({ ...p, [selected.id]: v }))}
                voiceovers={voiceovers}
                onVoice={toggleVoice}
                approved={!!approved[selected.id]}
                onApprove={() => toggleApprove(selected.id)}
                clip={clip}
                seconds={seconds}
                clipRefreshed={refreshed.has(selected.id)}
                onRecord={() => {
                  setSeconds(0);
                  setClip({ state: "recording" });
                }}
                onStopClip={stopClip}
              />
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>

      {/* ---- Publish action bar ---- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-issue items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="hidden h-2 w-40 overflow-hidden rounded-full bg-ink-raise sm:block">
              <motion.div
                className="h-full rounded-full bg-marigold"
                initial={false}
                animate={{ width: `${(approvedRequired / REQUIRED) * 100}%` }}
                transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
              />
            </div>
            <p className="font-ui text-sm text-bone/80">
              <span className="font-semibold text-bone">
                {approvedRequired} of {REQUIRED}
              </span>{" "}
              sections approved
              {OPTIONAL > 0 && (
                <span className="text-bone/55"> · {OPTIONAL} optional</span>
              )}
            </p>
          </div>
          <Link
            href="/sell/publish"
            className={cn(
              "group flex items-center gap-2 rounded-full px-6 py-3 font-ui text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
              allRequired
                ? "bg-marigold text-ink hover:bg-marigold-bright focus-visible:ring-marigold"
                : "border border-bone/25 text-bone hover:border-bone/50 focus-visible:ring-bone",
            )}
          >
            {allRequired ? "Publish your world" : "Review & publish"}
            <ArrowRight
              size={16}
              weight="bold"
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SectionRow({
  block,
  index,
  selected,
  approved,
  onSelect,
  onToggle,
}: {
  block: DraftBlock;
  index: number;
  selected: boolean;
  approved: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const beat = STORY_BEATS.find((b) => b.id === block.fromBeat);
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border px-3 py-2.5 transition-colors",
        selected
          ? "border-marigold/40 bg-marigold/[0.07]"
          : "border-line bg-ink-soft hover:border-bone/20",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-inset rounded-lg"
      >
        <span className="font-mono text-xs text-bone/55 tabular-nums">
          {index.toString().padStart(2, "0")}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-ui text-sm font-medium text-bone">
              {block.section}
            </span>
            {block.optional && (
              <span className="shrink-0 rounded-full bg-bone/10 px-1.5 py-0.5 font-ui text-[0.6rem] text-bone/50">
                optional
              </span>
            )}
          </span>
          <span className="block truncate font-ui text-[0.7rem] text-bone/55">
            Drawn from {beat?.label.toLowerCase()}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={approved}
        aria-label={approved ? `Unapprove ${block.section}` : `Approve ${block.section}`}
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          approved
            ? "border-marigold bg-marigold text-ink"
            : "border-bone/30 text-transparent hover:border-bone/60",
        )}
      >
        <Check size={15} weight="bold" />
      </button>
    </div>
  );
}

function EditPanel({
  block,
  accent,
  onAccent,
  variant,
  onVariant,
  voiceovers,
  onVoice,
  approved,
  onApprove,
  clip,
  seconds,
  clipRefreshed,
  onRecord,
  onStopClip,
}: {
  block: DraftBlock;
  accent: Ground;
  onAccent: (g: Ground) => void;
  variant: string;
  onVariant: (v: string) => void;
  voiceovers: Set<string>;
  onVoice: (key: string) => void;
  approved: boolean;
  onApprove: () => void;
  clip: { state: "recording" | "saving" } | null;
  seconds: number;
  clipRefreshed: boolean;
  onRecord: () => void;
  onStopClip: () => void;
}) {
  const beat = STORY_BEATS.find((b) => b.id === block.fromBeat);
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-bone">{block.section}</h2>
          <p className="mt-0.5 font-ui text-xs text-bone/50">
            Drawn from {beat?.label.toLowerCase()}
          </p>
        </div>
        {approved && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-marigold/15 px-2.5 py-1 font-ui text-xs font-medium text-marigold">
            <Check size={12} weight="bold" />
            Approved
          </span>
        )}
      </div>

      {/* KOL's note */}
      <div className="mt-4 flex gap-2.5 rounded-2xl bg-ink px-3.5 py-3 ring-1 ring-line">
        <Sparkle size={16} weight="fill" className="mt-0.5 shrink-0 text-marigold" />
        <p className="font-ui text-xs leading-relaxed text-bone/75">{block.aiNote}</p>
      </div>

      {/* Swap block */}
      <Control icon={<SquaresFour size={14} />} label="Layout">
        <div className="space-y-1.5">
          {block.swaps.map((swap) => {
            const on = variant === swap.id;
            return (
              <button
                key={swap.id}
                type="button"
                onClick={() => onVariant(swap.id)}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold",
                  on
                    ? "border-marigold/50 bg-marigold/[0.08]"
                    : "border-line hover:border-bone/25",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    on ? "border-marigold bg-marigold" : "border-bone/35",
                  )}
                >
                  {on && <Circle size={7} weight="fill" className="text-ink" />}
                </span>
                <span>
                  <span className="block font-ui text-sm font-medium text-bone">
                    {swap.label}
                  </span>
                  <span className="block font-ui text-[0.7rem] leading-snug text-bone/50">
                    {swap.note}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Control>

      {/* Tweak colour */}
      <Control icon={<PaintBrushBroad size={14} />} label="Your colour">
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_OPTIONS.map((opt) => {
            const on = accent === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onAccent(opt.id)}
                aria-pressed={on}
                aria-label={opt.label}
                title={opt.label}
                className={cn(
                  "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-ink-soft transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-marigold",
                  on ? "ring-bone" : "ring-transparent",
                )}
                style={{ backgroundColor: opt.hex }}
              />
            );
          })}
          <span className="ml-1 font-ui text-xs text-bone/55">
            {ACCENT_OPTIONS.find((a) => a.id === accent)?.label}
          </span>
        </div>
        <p className="mt-2 font-ui text-[0.7rem] leading-snug text-bone/55">
          Applies across your whole world — a starting point, not a limit.
        </p>
      </Control>

      {/* Re-record clip */}
      {block.hasClip && (
        <Control icon={<ArrowsClockwise size={14} />} label="Film clip">
          {clip ? (
            clip.state === "recording" ? (
              <div className="flex items-center gap-2 rounded-xl bg-ink-raise px-3 py-2.5 ring-1 ring-marigold/30">
                <Circle size={10} weight="fill" className="animate-pulse text-error" />
                <span className="font-mono text-xs tabular-nums text-bone">
                  {fmt(seconds)}
                </span>
                <button
                  type="button"
                  onClick={onStopClip}
                  className="ml-auto flex items-center gap-1.5 rounded-full bg-bone px-3 py-1.5 font-ui text-xs font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  <Stop size={12} weight="fill" />
                  Use take
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-ink px-3 py-2.5 ring-1 ring-line">
                <span className="h-2 w-2 animate-pulse rounded-full bg-marigold" />
                <span className="font-ui text-xs text-bone/60">Saving take…</span>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={onRecord}
              className="flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2.5 font-ui text-sm text-bone transition-colors hover:border-marigold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
            >
              <ArrowClockwise size={16} weight="bold" className="text-marigold" />
              Re-record this clip
              {clipRefreshed && (
                <span className="ml-auto flex items-center gap-1 font-ui text-[0.7rem] text-marigold">
                  <Check size={11} weight="bold" />
                  Updated
                </span>
              )}
            </button>
          )}
        </Control>
      )}

      {/* Voiceovers */}
      <Control icon={<SpeakerHigh size={14} />} label="Tap-to-hear voiceovers">
        <div className="flex flex-wrap gap-1.5">
          {block.voiceTargets.map((target) => {
            const key = `${block.id}::${target}`;
            const on = voiceovers.has(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onVoice(key)}
                aria-pressed={on}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-ui text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold",
                  on
                    ? "border-marigold bg-marigold/15 text-marigold"
                    : "border-bone/25 text-bone/70 hover:border-bone/50",
                )}
              >
                {on ? <Check size={11} weight="bold" /> : <SpeakerHigh size={11} />}
                {target}
              </button>
            );
          })}
        </div>
        <p className="mt-2 font-ui text-[0.7rem] leading-snug text-bone/55">
          Add your real voice to an element — buyers tap to hear you say it.
        </p>
      </Control>

      {/* Approve */}
      <button
        type="button"
        onClick={onApprove}
        className={cn(
          "mt-5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-ui text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft",
          approved
            ? "border border-bone/25 text-bone hover:border-bone/50 focus-visible:ring-bone"
            : "bg-marigold text-ink hover:bg-marigold-bright focus-visible:ring-marigold",
        )}
      >
        {approved ? (
          <>
            <ArrowClockwise size={16} weight="bold" />
            Keep editing
          </>
        ) : (
          <>
            <Check size={16} weight="bold" />
            Approve this section
          </>
        )}
      </button>
    </div>
  );
}

function Control({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 border-t border-line pt-4">
      <p className="mb-2.5 flex items-center gap-1.5 font-ui text-xs font-semibold uppercase tracking-wide text-bone/50">
        <span className="text-marigold">{icon}</span>
        {label}
      </p>
      {children}
    </div>
  );
}

function BrowserFrame({
  handle,
  children,
}: {
  handle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-ink-soft shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-bone/20" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 font-mono text-[0.65rem] text-bone/55">
            {handle}
          </span>
        </div>
        <span className="meta hidden text-[0.6rem] text-bone/55 sm:inline">Preview</span>
      </div>
      {children}
    </div>
  );
}

function StudioSkeleton() {
  return (
    <div className="mx-auto max-w-issue px-4 pb-28 pt-24 sm:px-6 sm:pt-28">
      <div className="mb-5 flex items-center gap-3">
        <span className="h-2 w-2 animate-pulse rounded-full bg-marigold" />
        <p className="font-ui text-sm text-bone/70">Composing your world from the interview…</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[17rem_1fr_20rem]">
        <div className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="shimmer-sweep h-14 rounded-2xl bg-[#3A2E26] ring-1 ring-line"
            />
          ))}
        </div>
        <div className="shimmer-sweep h-[60vh] rounded-3xl bg-[#3A2E26] ring-1 ring-line" />
        <div className="shimmer-sweep h-[28rem] rounded-3xl bg-[#3A2E26] ring-1 ring-line" />
      </div>
    </div>
  );
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
