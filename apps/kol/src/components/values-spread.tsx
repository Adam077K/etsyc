"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Leaf } from "@phosphor-icons/react";
import { MAKERS } from "@/lib/fixtures/makers";
import { stagger, rise, calm, inView, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Olive "Shop by your values" spread (backlog: surface the previously-dead
 * `Maker.values[]` data as a Faire-style values index). A full-bleed colour
 * block that breaks the tile rhythm; each value is a live chip that re-filters
 * the whole issue by that value. Motion is transform/opacity only, the chips
 * ink-in on a stagger, and the active value fills marigold.
 */
export function ValuesSpread({
  active,
  onSelect,
}: {
  /** The currently-selected value, or null when browsing by craft. */
  active: string | null;
  onSelect: (value: string) => void;
}) {
  const reduce = useReducedMotion();

  // Unique values with a maker count, most-common first — the index of the issue.
  const values = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of MAKERS)
      for (const v of m.values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  return (
    <section className="col-span-2 -mx-5 md:col-span-6 lg:col-span-12 sm:-mx-8">
      <motion.div
        variants={reduce ? calm : rise(30, 0.9)}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className="bg-olive px-5 py-14 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-issue">
          <p className="meta flex items-center gap-2 text-bone/70">
            <Leaf size={14} weight="fill" />
            Values
          </p>
          <h2
            className="mt-4 max-w-3xl font-display font-bold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
          >
            Shop by your values.
          </h2>

          <motion.div
            variants={reduce ? calm : stagger(0.1, 0.04)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="mt-9 flex flex-wrap gap-2.5 sm:gap-3"
          >
            {values.map(([value, count]) => {
              const isActive = active === value;
              return (
                <motion.button
                  key={value}
                  type="button"
                  variants={reduce ? calm : rise(12, 0.5)}
                  onClick={() => onSelect(value)}
                  aria-pressed={isActive}
                  className={cn(
                    "press group/chip flex items-center gap-2 rounded-full border px-4 py-2.5 font-ui text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bone focus-visible:ring-offset-2 focus-visible:ring-offset-olive sm:text-base",
                    isActive
                      ? "border-marigold bg-marigold text-ink"
                      : "border-bone/30 text-bone hover:border-bone hover:bg-bone/10",
                  )}
                >
                  {value}
                  <span
                    className={cn(
                      "font-mono text-[0.65rem] tabular-nums transition-colors",
                      isActive ? "text-ink/70" : "text-bone/75 group-hover/chip:text-bone",
                    )}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {active && (
            <motion.button
              type="button"
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: easeOut }}
              onClick={() => onSelect(active)}
              className="press mt-6 inline-flex items-center font-ui text-sm text-bone/75 underline decoration-bone/30 underline-offset-4 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bone focus-visible:ring-offset-2 focus-visible:ring-offset-olive"
            >
              Clear filter — show the whole issue
            </motion.button>
          )}
        </div>
      </motion.div>
    </section>
  );
}
