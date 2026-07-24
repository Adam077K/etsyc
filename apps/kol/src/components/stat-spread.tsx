"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useInView, animate } from "framer-motion";
import { ISSUE_STATS } from "@/lib/fixtures/makers";
import { rise, calm, inView, stagger } from "@/lib/motion";

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
    <section className="col-span-2 -mx-5 md:col-span-6 lg:col-span-12 sm:-mx-8">
      {/* Full-bleed clay stat spread — edge-to-edge, no card. */}
      <motion.div
        variants={v}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className="relative overflow-hidden bg-clay px-6 py-14 text-center sm:px-12 sm:py-20"
      >
        {/* Inner stagger: the two figures arrive one after the other, then the
            closing line — an authored count-in on top of each number's climb. */}
        <motion.div
          variants={reduce ? calm : stagger(0.15, 0.14)}
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          className="relative"
        >
          <div className="flex flex-wrap items-baseline justify-center gap-x-10 gap-y-6">
            <motion.div variants={reduce ? calm : rise(22, 0.7)}>
              <Counter
                to={ISSUE_STATS.makers}
                className="block font-display font-extrabold leading-none text-bone [font-size:clamp(3.5rem,9vw,7rem)]"
              />
              <p className="meta mt-3 text-bone">makers on film</p>
            </motion.div>
            <span className="hidden h-20 w-px bg-bone/25 sm:block" />
            <motion.div variants={reduce ? calm : rise(22, 0.7)}>
              <Counter
                to={ISSUE_STATS.countries}
                className="block font-display font-extrabold leading-none text-bone [font-size:clamp(3.5rem,9vw,7rem)]"
              />
              <p className="meta mt-3 text-bone">countries</p>
            </motion.div>
          </div>

          <motion.p
            variants={reduce ? calm : rise(16, 0.7)}
            className="mx-auto mt-10 max-w-2xl font-serif text-xl leading-snug text-bone sm:text-2xl"
          >
            {ISSUE_STATS.line}
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
}
