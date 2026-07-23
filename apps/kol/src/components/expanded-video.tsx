"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Play,
  MapPin,
  ArrowRight,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import type { Maker } from "@/lib/fixtures/makers";
import { WORLDS } from "@/lib/fixtures/worlds";
import { easeOut } from "@/lib/motion";

/**
 * expanded-video — the feed tile grows into a focused film view (buyer journey
 * step 2). Built as an in-feed overlay so the feed→film transition is a true
 * shared-element morph (Framer `layoutId`) — the product's signature motion,
 * which a route change cannot do cleanly. `openedId` is fixed for the life of
 * the overlay so the layout frame morphs back to the tile it came from; paging
 * next/prev crossfades the inner content instead. "Enter the world" hands off
 * to the /m/[slug] route (step 3).
 */
export function ExpandedVideo({
  list,
  openedId,
  index,
  onIndex,
  onClose,
}: {
  list: Maker[];
  openedId: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const maker = list[index];
  const hasWorld = maker ? maker.id in WORLDS : false;

  const next = () => onIndex((index + 1) % list.length);
  const prev = () => onIndex((index - 1 + list.length) % list.length);

  // Keyboard: Esc closes, up/down page. Lock body scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") next();
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, list.length]);

  if (!maker) return null;

  function enterWorld() {
    if (maker && hasWorld) router.push(`/m/${maker.id}`);
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-ink/92 backdrop-blur-xl lg:flex-row lg:overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${maker.studio} — expanded film`}
    >
      {/* Close + counter chrome */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-5 sm:p-7">
        <span className="meta pointer-events-auto text-bone-dim">
          {String(index + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
        </span>
        <button
          onClick={onClose}
          aria-label="Back to the feed"
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-bone text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      {/* The film — shared-element frame (morphs from the tile). */}
      <div className="flex shrink-0 items-center justify-center p-4 pt-20 sm:p-8 lg:w-[58%] lg:pt-8">
        <motion.div
          layoutId={`film-${openedId}`}
          className="relative aspect-[4/5] w-full max-w-[560px] overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line sm:aspect-[3/4]"
          transition={{ duration: reduce ? 0.2 : 0.6, ease: easeOut }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={maker.id}
              className={reduce ? "absolute inset-0" : "film-drift absolute inset-0"}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: easeOut }}
            >
              <Image
                src={maker.image}
                alt={`${maker.name} — ${maker.discipline}, ${maker.studio}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 backdrop-blur-sm">
            <Play size={13} weight="fill" className="text-marigold" />
            <span className="meta text-bone">
              {maker.kind === "film" ? `Watch ${maker.duration}` : "On film"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Meta + actions */}
      <div className="flex flex-1 flex-col justify-center gap-8 px-6 pb-16 sm:px-10 lg:pb-8 lg:pr-16">
        <motion.div
          key={`meta-${maker.id}`}
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.05 }}
        >
          <p className="meta mb-4 text-marigold">{maker.discipline}</p>
          <h2
            className="font-display font-extrabold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4.25rem)" }}
          >
            {maker.studio}
          </h2>
          <p className="mt-4 flex items-center gap-2 font-ui text-base text-bone/80">
            <span className="font-semibold text-bone">{maker.name}</span>
            <span aria-hidden>·</span>
            <MapPin size={15} className="shrink-0" />
            {maker.place}
          </p>
          <p className="mt-6 max-w-md font-serif text-xl italic leading-snug text-bone/90">
            “{maker.blurb}”
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={enterWorld}
              disabled={!hasWorld}
              className="group flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              {hasWorld ? `Enter ${maker.studio}'s world` : "World coming soon"}
              {hasWorld && (
                <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-bone/30 px-7 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Back to the feed
            </button>
          </div>
        </motion.div>

        {/* Page through other films */}
        <div className="flex items-center gap-3 border-t border-line pt-6">
          <span className="meta text-bone-dim">More on film</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={prev}
              aria-label="Previous maker"
              className="grid h-11 w-11 place-items-center rounded-full border border-bone/25 text-bone transition-colors hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <CaretUp size={18} weight="bold" />
            </button>
            <button
              onClick={next}
              aria-label="Next maker"
              className="grid h-11 w-11 place-items-center rounded-full border border-bone/25 text-bone transition-colors hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <CaretDown size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
