"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useInView, animate } from "framer-motion";
import { ISSUE_STATS } from "@/lib/fixtures/makers";
import { rise, calm, inView } from "@/lib/motion";
import { LiquidDivider } from "./liquid";

// Counts up when it scrolls into view, so the visitor watches the number climb.
function Counter({ to, className }: { to: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!seen || reduce) return;
    // animate() schedules onUpdate asynchronously — no sync setState in effect.
    const controls = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [seen, to, reduce]);

  return (
    <span ref={ref} className={className}>
      {val}
    </span>
  );
}

export function StatSpread() {
  const reduce = useReducedMotion();
  const v = reduce ? calm : rise(30, 0.9);

  return (
    <section className="col-span-2 md:col-span-6 lg:col-span-12">
      <motion.div
        variants={v}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className="relative overflow-hidden rounded-3xl bg-clay px-6 py-14 text-center sm:px-12 sm:py-20"
      >
        <LiquidDivider className="pointer-events-none absolute inset-x-0 top-0 opacity-[0.55]" />

        <div className="relative">
          <div className="flex flex-wrap items-baseline justify-center gap-x-10 gap-y-6">
            <div>
              <Counter
                to={ISSUE_STATS.makers}
                className="block font-display font-extrabold leading-none text-bone [font-size:clamp(3.5rem,9vw,7rem)]"
              />
              <p className="meta mt-3 text-bone/80">makers on film</p>
            </div>
            <span className="hidden h-20 w-px bg-bone/25 sm:block" />
            <div>
              <Counter
                to={ISSUE_STATS.countries}
                className="block font-display font-extrabold leading-none text-bone [font-size:clamp(3.5rem,9vw,7rem)]"
              />
              <p className="meta mt-3 text-bone/80">countries</p>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-2xl font-serif text-xl leading-snug text-bone sm:text-2xl">
            {ISSUE_STATS.line}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
