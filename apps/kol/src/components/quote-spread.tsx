"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Quotes } from "@phosphor-icons/react";
import { FEATURED_QUOTE } from "@/lib/fixtures/makers";
import { rise, calm, inView, stagger } from "@/lib/motion";

export function QuoteSpread() {
  const reduce = useReducedMotion();

  return (
    <section className="col-span-2 -mx-5 md:col-span-6 lg:col-span-12 sm:-mx-8">
      {/* Full-bleed plum spread — breaks the tile rhythm edge-to-edge, no card. */}
      <div className="grid overflow-hidden bg-plum md:grid-cols-[1fr_1.15fr]">
        <div className="relative min-h-[280px] overflow-hidden">
          {/* Portrait settles from a touch oversized as the spread lands — a
              slow editorial reveal, transform-only, grayscale held. */}
          <motion.div
            initial={reduce ? false : { scale: 1.08 }}
            whileInView={reduce ? undefined : { scale: 1 }}
            viewport={inView}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={FEATURED_QUOTE.image}
              alt={`Portrait of ${FEATURED_QUOTE.attribution}, ${FEATURED_QUOTE.studio}`}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover grayscale"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-transparent to-transparent md:bg-gradient-to-r" />
        </div>

        <motion.div
          variants={reduce ? calm : stagger(0.1, 0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          className="flex flex-col justify-center p-8 sm:p-12 lg:p-16"
        >
          <figure className="m-0">
            <motion.div variants={reduce ? calm : rise(16, 0.6)}>
              <Quotes size={40} weight="fill" className="mb-6 text-marigold" />
            </motion.div>
            <motion.blockquote
              variants={reduce ? calm : rise(24, 0.8)}
              className="font-serif leading-[1.15] text-bone"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.9rem)" }}
            >
              {FEATURED_QUOTE.quote}
            </motion.blockquote>
            <motion.figcaption
              variants={reduce ? calm : rise(14, 0.55)}
              className="mt-8 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-marigold" />
              <span className="font-ui text-base font-semibold text-bone">
                {FEATURED_QUOTE.attribution}
              </span>
              <span className="meta text-bone-dim">
                {FEATURED_QUOTE.studio}
              </span>
            </motion.figcaption>
          </figure>
        </motion.div>
      </div>
    </section>
  );
}
