"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Compass, ArrowLeft } from "@phosphor-icons/react";
import { rise, calm } from "@/lib/motion";

/** Empty state — composed, never a dead end. Reached via a craft with no makers. */
export function FeedEmpty({
  craftLabel,
  onReset,
}: {
  craftLabel: string;
  onReset: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? calm : rise(24, 0.7)}
      initial="hidden"
      animate="visible"
      className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-24 text-center"
    >
      <span className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-ink-raise text-marigold">
        <Compass size={30} />
      </span>
      <p className="meta text-bone-dim">No {craftLabel} in this issue — yet</p>
      <h3
        className="mt-4 max-w-xl font-display font-bold leading-tight text-bone"
        style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
      >
        This shelf is between issues.
      </h3>
      <p className="mt-4 max-w-md font-ui text-base leading-relaxed text-bone/70">
        We&#39;re still filming {craftLabel.toLowerCase()} makers worth your time.
        New faces are added every week — meanwhile, the whole issue is waiting.
      </p>
      <button
        onClick={onReset}
        className="group mt-8 flex items-center gap-2.5 rounded-full bg-marigold px-6 py-3 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright"
      >
        <ArrowLeft
          size={18}
          weight="bold"
          className="transition-transform group-hover:-translate-x-1"
        />
        Back to all makers
      </button>
    </motion.div>
  );
}
