"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play, ArrowUpRight, MapPin } from "@phosphor-icons/react";
import type { Maker, Span, Ground } from "@/lib/fixtures/makers";
import { CRAFT_ICON } from "@/lib/icons";
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SPAN_CLASS: Record<Span, string> = {
  hero: "col-span-2 md:col-span-6 lg:col-span-12",
  wide: "col-span-2 md:col-span-6 lg:col-span-7",
  tall: "col-span-2 md:col-span-6 lg:col-span-5",
  portrait: "col-span-1 md:col-span-3 lg:col-span-4",
  square: "col-span-1 md:col-span-3 lg:col-span-4",
  product: "col-span-1 md:col-span-3 lg:col-span-4",
};

const ASPECT_CLASS: Record<Span, string> = {
  hero: "aspect-[16/9]",
  wide: "aspect-[4/3] md:aspect-[16/10]",
  tall: "aspect-[4/5] md:aspect-[3/4]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  product: "aspect-[5/6]",
};

const GROUND_BG: Record<Ground, string> = {
  ink: "bg-ink-raise",
  plum: "bg-plum",
  olive: "bg-olive",
  clay: "bg-clay",
  sky: "bg-sky",
  bone: "bg-bone",
};

const SIZES =
  "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw";

export function MakerTile({
  maker,
  index,
  onOpen,
}: {
  maker: Maker;
  index: number;
  /** When provided, the tile opens the expanded-video overlay (feed use).
      Without it the tile is a plain link to the maker's world route. */
  onOpen?: () => void;
}) {
  const reduce = useReducedMotion();
  const Icon = CRAFT_ICON[maker.craft];
  const isObject = Boolean(maker.ground);

  const inner = isObject ? (
    <ObjectTile maker={maker} Icon={Icon} reduce={reduce} />
  ) : (
    <EditorialTile maker={maker} Icon={Icon} reduce={reduce} />
  );

  const ringCls =
    "block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

  return (
    <motion.article
      variants={reduce ? calm : rise(30, 0.8)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      transition={{ delay: (index % 6) * 0.05 }}
      className={cn("group", SPAN_CLASS[maker.span])}
    >
      {onOpen ? (
        <button type="button" onClick={onOpen} className={ringCls}>
          {inner}
        </button>
      ) : (
        <Link href={`/m/${maker.id}`} className={ringCls}>
          {inner}
        </Link>
      )}
    </motion.article>
  );
}

/* Full-bleed film / portrait — text lives over an ink scrim. */
function EditorialTile({
  maker,
  Icon,
  reduce,
}: {
  maker: Maker;
  Icon: (typeof CRAFT_ICON)[keyof typeof CRAFT_ICON];
  reduce: boolean | null;
}) {
  return (
    <motion.div
      layoutId={`film-${maker.id}`}
      transition={{ duration: reduce ? 0.2 : 0.6, ease: easeOut }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-ink-soft ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)]",
        ASPECT_CLASS[maker.span],
      )}
    >
      <div
        className={cn(
          "absolute inset-0 transition-[transform,filter] duration-[900ms] ease-out-expo",
          "saturate-[0.92] brightness-[0.94] group-hover:scale-[1.05] group-hover:saturate-100 group-hover:brightness-100 group-focus-within:scale-[1.05]",
          maker.kind === "film" && !reduce && "film-drift",
        )}
      >
        <Image
          src={maker.image}
          alt={`${maker.name} — ${maker.discipline}, ${maker.studio}`}
          fill
          sizes={SIZES}
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

      {maker.kind === "film" && (
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 backdrop-blur-sm">
          <Play size={13} weight="fill" className="text-marigold" />
          <span className="meta text-bone">Watch · {maker.duration}</span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <p className="meta mb-2 flex items-center gap-1.5 text-marigold">
          <Icon size={14} weight="fill" />
          {maker.discipline}
        </p>
        <h3 className="font-display text-2xl font-bold leading-none text-bone">
          {maker.studio}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 font-ui text-sm text-bone/75">
          <span className="font-medium text-bone">{maker.name}</span>
          <span aria-hidden>·</span>
          <MapPin size={13} className="shrink-0" />
          {maker.place}
        </p>

        {/* Blurb inks in on hover/focus. */}
        <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-500 ease-out-expo group-hover:mt-3 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
          <p className="overflow-hidden font-serif text-[0.95rem] italic leading-snug text-bone/90">
            “{maker.blurb}”
          </p>
        </div>

        <span className="mt-3 block h-px w-full origin-left scale-x-0 bg-marigold transition-transform duration-500 ease-out-expo group-hover:scale-x-100 group-focus-within:scale-x-100" />
      </div>

      <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-bone text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <ArrowUpRight size={18} weight="bold" />
      </span>
    </motion.div>
  );
}

/* Product still floated on a visible KOL color field, caption on an ink strip.
   The product sits in a rounded inner frame so the color ground reads as a mat
   (the "product on a color field" beat) — never text raw over the photo. */
function ObjectTile({
  maker,
  Icon,
  reduce,
}: {
  maker: Maker;
  Icon: (typeof CRAFT_ICON)[keyof typeof CRAFT_ICON];
  reduce: boolean | null;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)]",
        ASPECT_CLASS[maker.span],
      )}
    >
      <div
        className={cn(
          "relative flex-1 p-4 sm:p-5",
          GROUND_BG[maker.ground as Ground],
        )}
      >
        {/* layoutId sits on the IMAGE only, so the mat + caption strip don't
            flash inside the expanding overlay frame (clean morph). */}
        <motion.div
          layoutId={`film-${maker.id}`}
          transition={{ duration: reduce ? 0.2 : 0.6, ease: easeOut }}
          className="relative h-full w-full overflow-hidden rounded-xl"
        >
          <Image
            src={maker.image}
            alt={`${maker.name} — ${maker.discipline}, ${maker.studio}`}
            fill
            sizes={SIZES}
            className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]"
          />
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full bg-ink/72 px-2.5 py-1 backdrop-blur-sm">
            <Icon size={13} weight="fill" className="text-marigold" />
            <span className="meta text-bone">{maker.discipline}</span>
          </span>
          <span className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-bone text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <ArrowUpRight size={18} weight="bold" />
          </span>
        </motion.div>
      </div>

      <div className="bg-ink px-4 py-3.5">
        <h3 className="font-display text-lg font-bold leading-none text-bone">
          {maker.studio}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 font-ui text-[0.8rem] text-bone/70">
          <span className="text-bone/90">{maker.name}</span>
          <span aria-hidden>·</span>
          {maker.place}
        </p>
      </div>
    </div>
  );
}
