"use client";

import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, Storefront } from "@phosphor-icons/react";
import type { Ground } from "@/lib/fixtures/makers";
import type {
  JournalStory,
  StoryBlock,
  Inline,
} from "@/lib/fixtures/journal";
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { cn } from "@/lib/utils";

const ACCENT_BG: Record<Ground, string> = {
  clay: "bg-clay",
  sky: "bg-sky",
  plum: "bg-plum",
  olive: "bg-olive",
  bone: "bg-bone",
  ink: "bg-ink-raise",
};

/**
 * journal-story (/journal/[slug]) — a longform maker feature set to the locked
 * type system: Bricolage subheads, Young Serif pull-quotes and drop cap, Hanken
 * body on a comfortable measure, film stills breaking the column with scrimmed
 * captions, and inline product mentions that link into the maker's world.
 */
export function JournalStoryView({ story }: { story: JournalStory }) {
  const reduce = useReducedMotion();

  return (
    <div className="bg-ink">
      {/* ── Hero — full-bleed film still, cover-story treatment. ─────────── */}
      <header className="relative flex min-h-[92svh] items-end overflow-hidden">
        <div
          className={cn(
            "absolute inset-0",
            !reduce && "film-drift",
          )}
        >
          <Image
            src={story.heroImage}
            alt={story.heroAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {/* Locked scrim — the headline never sits raw over the film. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.15 }}
          className="relative mx-auto w-full max-w-[52rem] px-5 pb-16 sm:px-8 sm:pb-24"
        >
          <p className="meta mb-5 text-bone-dim">{story.kicker}</p>
          <h1
            className="font-display font-extrabold leading-[0.9] text-bone"
            style={{ fontSize: "clamp(2.5rem, 7.5vw, 6.5rem)" }}
          >
            {story.title}
          </h1>
          <p className="mt-7 max-w-2xl font-serif text-xl italic leading-snug text-bone/85 sm:text-2xl">
            {story.standfirst}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.7rem] uppercase tracking-meta text-bone-dim">
            <span className="text-bone">{story.byline}</span>
            <span aria-hidden>·</span>
            <span>{story.dateline}</span>
            <span aria-hidden>·</span>
            <span className="text-marigold">{story.readTime}</span>
          </div>
        </motion.div>
      </header>

      {/* ── The article body. Each block carries its own measure: text on a
             comfortable column, pull-quotes a touch wider, figures wider still
             (never a viewport-margin hack). ───────────────────────────────── */}
      <article className="mx-auto max-w-issue px-5 py-20 sm:px-8 sm:py-28">
        {story.blocks.map((block, i) => (
          <Block key={i} block={block} worldSlug={story.worldSlug} accent={story.accent} reduce={!!reduce} />
        ))}
      </article>

      {/* ── Colophon — the magazine's data voice, in Geist Mono. ─────────── */}
      <Colophon story={story} reduce={!!reduce} />
    </div>
  );
}

function Block({
  block,
  worldSlug,
  accent,
  reduce,
}: {
  block: StoryBlock;
  worldSlug: string;
  accent: Ground;
  reduce: boolean;
}) {
  const rise8 = reduce ? calm : rise(20, 0.7);
  // The reading column — text sits on a comfortable measure; wider elements
  // (pull-quotes, figures) set their own below.
  const measure = "mx-auto max-w-[44rem]";

  if (block.type === "subhead") {
    return (
      <motion.h2
        variants={rise8}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className={cn(measure, "mb-5 mt-14 font-display text-2xl font-bold leading-tight text-bone sm:text-3xl")}
      >
        {block.text}
      </motion.h2>
    );
  }

  if (block.type === "para") {
    return (
      <motion.p
        variants={rise8}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className={cn(
          measure,
          "mb-6 font-ui text-[1.075rem] leading-[1.75] text-bone/85 sm:text-[1.15rem]",
          block.dropCap &&
            "first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-serif first-letter:text-[3.75rem] first-letter:leading-[0.72] first-letter:text-marigold sm:first-letter:text-[4.5rem]",
        )}
      >
        {block.content.map((node, i) => (
          <InlineNode key={i} node={node} worldSlug={worldSlug} />
        ))}
      </motion.p>
    );
  }

  if (block.type === "pull") {
    // A featured pull-quote is drenched in the story's accent ground; a plain
    // one is a large Young Serif line with a marigold rule.
    if (block.feature) {
      return (
        <motion.figure
          variants={rise8}
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          className={cn(
            "mx-auto my-12 max-w-[52rem] overflow-hidden rounded-3xl px-8 py-12 text-center sm:px-14 sm:py-16",
            ACCENT_BG[accent],
          )}
        >
          <blockquote
            className="mx-auto max-w-2xl font-serif leading-[1.15] text-bone"
            style={{ fontSize: "clamp(1.6rem, 3.4vw, 2.6rem)" }}
          >
            “{block.text}”
          </blockquote>
        </motion.figure>
      );
    }
    return (
      <motion.figure
        variants={rise8}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className={cn(measure, "my-11 border-l-2 border-marigold pl-6 sm:pl-8")}
      >
        <blockquote
          className="font-serif leading-[1.2] text-bone"
          style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
        >
          “{block.text}”
        </blockquote>
      </motion.figure>
    );
  }

  // figure — breaks the measure with a film still + scrimmed mono caption.
  return (
    <motion.figure
      variants={rise8}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className={cn(
        "group relative mx-auto my-12 overflow-hidden rounded-2xl ring-1 ring-line",
        // "full" figures break wide of the measure; "wide" sit a step wider
        // than the reading column. Both stay contained (no viewport-margin hack).
        block.span === "full" ? "max-w-[64rem]" : "max-w-[52rem]",
      )}
    >
      <div
        className={cn(
          "relative w-full",
          block.span === "full" ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[4/3] sm:aspect-[16/9]",
        )}
      >
        <Image
          src={block.image}
          alt={block.alt}
          fill
          sizes={block.span === "full" ? "(max-width: 768px) 100vw, 64rem" : "(max-width: 768px) 100vw, 52rem"}
          className={cn(
            "object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.03]",
            !reduce && "film-drift",
          )}
        />
        {/* Locked scrim — caption never sits raw over the still. */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/85 to-transparent" />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-5">
          <span className="h-px w-6 bg-marigold" />
          <span className="meta text-bone">{block.caption}</span>
        </figcaption>
      </div>
    </motion.figure>
  );
}

/* Inline prose node — plain text, or a marigold-underlined product mention that
   links into the maker's world (/m/[worldSlug]/p/[productId]). */
function InlineNode({ node, worldSlug }: { node: Inline; worldSlug: string }) {
  if (typeof node === "string") return <Fragment>{node}</Fragment>;
  return (
    <Link
      href={`/m/${worldSlug}/p/${node.productId}`}
      className="text-bone underline decoration-marigold decoration-2 underline-offset-[3px] transition-colors hover:text-marigold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
    >
      {node.label}
    </Link>
  );
}

/* The colophon footer — set in Geist Mono, the magazine's data voice. Pays off
   the story with a route back into the issue and into the maker's world. */
function Colophon({ story, reduce }: { story: JournalStory; reduce: boolean }) {
  const rows: [string, string][] = [
    ["Words", story.colophon.words],
    ["Field notes", story.colophon.fieldNotes],
    ["Film stills", story.colophon.stills],
    ["Typeset in", story.colophon.typeset],
    ["Issue", story.colophon.issue],
  ];

  return (
    <motion.section
      variants={reduce ? calm : rise(28, 0.9)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="border-t border-line bg-ink-soft"
    >
      <div className="mx-auto max-w-[52rem] px-5 py-16 sm:px-8 sm:py-20">
        <p className="meta text-bone-dim">Colophon</p>

        <dl className="mt-8 divide-y divide-line border-y border-line">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <dt className="w-40 shrink-0 font-mono text-[0.68rem] uppercase tracking-meta text-bone-dim">
                {label}
              </dt>
              <dd className="font-mono text-[0.8rem] leading-relaxed text-bone/85">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Magnetic strength={0.2}>
            <Link
              href={`/m/${story.worldSlug}`}
              className="group inline-flex items-center gap-2.5 rounded-full bg-marigold px-6 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <Storefront size={19} weight="fill" />
              Visit the studio
              <ArrowUpRight
                size={18}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </Magnetic>
          <Link
            href="/journal"
            className="group inline-flex items-center gap-2.5 rounded-full border border-bone/25 px-6 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <ArrowLeft
              size={18}
              weight="bold"
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Back to the Journal
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
