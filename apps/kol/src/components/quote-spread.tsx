"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Quotes } from "@phosphor-icons/react";
import { FEATURED_QUOTE } from "@/lib/fixtures/makers";
import { rise, calm } from "@/lib/motion";

export function QuoteSpread() {
  const reduce = useReducedMotion();
  const v = reduce ? calm : rise(30, 0.9);

  return (
    <section className="col-span-2 md:col-span-6 lg:col-span-12">
      <div className="grid overflow-hidden rounded-3xl bg-plum md:grid-cols-[1fr_1.15fr]">
        <div className="relative min-h-[280px]">
          <Image
            src={FEATURED_QUOTE.image}
            alt={FEATURED_QUOTE.attribution}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-plum/70 via-transparent to-transparent md:bg-gradient-to-r" />
        </div>

        <motion.div
          variants={v}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center p-8 sm:p-12 lg:p-16"
        >
          <Quotes size={40} weight="fill" className="mb-6 text-marigold" />
          <blockquote
            className="font-serif leading-[1.15] text-bone"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.9rem)" }}
          >
            {FEATURED_QUOTE.quote}
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3">
            <span className="h-px w-8 bg-marigold" />
            <span className="font-ui text-base font-semibold text-bone">
              {FEATURED_QUOTE.attribution}
            </span>
            <span className="meta text-marigold-bright">
              {FEATURED_QUOTE.studio}
            </span>
          </figcaption>
        </motion.div>
      </div>
    </section>
  );
}
