"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Play,
  ArrowDown,
  ArrowRight,
  Check,
  Prohibit,
} from "@phosphor-icons/react";
import { COVER_MAKER } from "@/lib/fixtures/makers";
import { rise, stagger, calm, inView } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { GooDefs, LiquidDivider } from "./liquid";
import { TrustBadge } from "./trust-badge";
import { MakerFilm } from "./maker-film";

/**
 * HOW KOL WORKS (/how) — the buyer-facing trust/story page.
 *
 * MODE: Explain + convince — the whole product thesis in one scroll, the page a
 *   first-time visitor (or investor) lands on to get the idea.
 * OWN-WORLD: KOL's fixed system (this is KOL chrome, not a seller's brand) —
 *   warm ink ground, brave color-blocked interludes, Bricolage display, Young
 *   Serif accents, marigold the single signal.
 * STORY: the thesis (shopping became a transaction; we made it a relationship
 *   again) -> the buyer journey in three film beats -> the two honest trust
 *   layers at page scale -> the confident anti-deal-grid stance -> two doors out.
 * FORM: cinematic Ken-Burns hero stand-in, alternating film-still acts, the
 *   reused TrustBadge, a plum "not this / instead" spread, a two-CTA close.
 */

interface Act {
  index: string;
  kicker: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  /** honest stand-in caption — every still is a placeholder for live footage. */
  caption: string;
  /** film beats also carry a Play affordance (the clip plays live). */
  film?: boolean;
}

const ACTS: Act[] = [
  {
    index: "01",
    kicker: "Discover",
    title: "Meet a maker, on film.",
    body: "The feed is a magazine of real people making real things — never a wall of identical thumbnails. Tap anyone and their film grows to fill the room. The sound is yours to turn on.",
    image: "/media/clay-wheel.jpg",
    alt: "Lena Okafor throwing stoneware at the wheel, from her film",
    caption: "Film still · the clip plays in the live product",
    film: true,
  },
  {
    index: "02",
    kicker: "Unfold",
    title: "Their whole world opens around the film.",
    body: "Tap again and the maker's shop unfolds around the still-playing video — their pieces, their story, their own colours and type. They walk you through it like a shopkeeper who knows every shelf by heart.",
    image: "/media/clay-shelf.jpg",
    alt: "Wooden cutting boards and ceramic vessels on a studio shelf",
    caption: "Stand-in still · the maker's real shop in the live product",
  },
  {
    index: "03",
    kicker: "Buy",
    title: "Buy from the hands that made it.",
    body: "Open a piece and the film tucks into the corner, still narrating — the maker telling you about the exact thing in front of you. What it's made of, how it's cared for, who stands behind it. Then you buy, direct.",
    image: "/media/plates.jpg",
    alt: "A set of handmade stoneware plates, each a slightly different size",
    caption: "Stand-in still · the maker's real pieces in the live product",
  },
];

const NOT_THIS = [
  "Countdown timers and “almost gone” panic",
  "“23K sold” badges and five-star clutter",
  "A grid of identical thumbnails",
  "A faceless brand behind the buy button",
];

const INSTEAD = [
  "A face, a workshop, a voice",
  "A few pieces, shown large and unhurried",
  "The making and the story, before the price",
  "A real person you can follow and message",
];

export function HowStory() {
  const reduce = useReducedMotion();
  const item = reduce ? calm : rise(34, 1);

  return (
    <>
      <GooDefs />

      {/* ---- Cinematic opener: the thesis ---- */}
      <section
        id="top"
        className="relative flex min-h-[100svh] w-full items-end overflow-hidden"
      >
        <div className="absolute inset-0">
          {/* Human-presence hero: Lena at the wheel — the real clip autoplays
              (odd-clay proof) and falls back to the hands-in-process still.
              MakerFilm drifts the still; a live clip never Ken-Burns on itself. */}
          <MakerFilm
            videoSrc={COVER_MAKER.filmSrc}
            poster="/media/clay-wheel.jpg"
            alt="Lena Okafor throwing stoneware at Odd Clay Studio"
            reduce={!!reduce}
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Ink scrims: bottom-up for legibility, left-in for the statement. */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/25 to-ink/30" />
        </div>

        <motion.div
          variants={stagger(0.15, 0.12)}
          initial="hidden"
          animate="visible"
          className="relative mx-auto w-full max-w-issue px-5 pb-16 pt-32 sm:px-8 sm:pb-24"
        >
          <motion.p variants={item} className="meta mb-6 text-marigold">
            How KOL works · The Maker&#39;s Issue
          </motion.p>

          <motion.h1
            variants={item}
            className="max-w-5xl font-display font-extrabold leading-[0.9] text-bone"
            style={{ fontSize: "clamp(2.5rem, 7.5vw, 6.5rem)" }}
          >
            Shopping became a transaction.
            <br />
            <span className="font-serif font-normal italic text-marigold-bright">
              We made it a relationship again.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-measure font-ui text-lg leading-relaxed text-bone/85 sm:text-xl"
          >
            KOL is a magazine of makers on film. You meet the human, watch them
            work, and buy from the hands that made the thing — the whole reason a
            marketplace can feel like a relationship instead of a checkout.
          </motion.p>

          <motion.div variants={item} className="mt-9">
            <Magnetic>
              <a
                href="#journey"
                className="group flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                See how it works
                <ArrowDown
                  size={20}
                  weight="bold"
                  className="transition-transform group-hover:translate-y-0.5"
                />
              </a>
            </Magnetic>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-12 flex items-center gap-2 font-ui text-sm text-bone/60"
          >
            Every maker in this issue is a real person. Demo content for now —
            real makers coming soon.
          </motion.p>
        </motion.div>
      </section>

      {/* Signature liquid-ink seam — the same beat that fuses the feed's cover
          into the issue, tying /how to the product it explains. */}
      <div className="relative bg-ink py-4 sm:py-6">
        <LiquidDivider className="mx-auto max-w-issue px-5 opacity-[0.62] sm:px-8" />
      </div>

      {/* ---- The journey, in three film beats ---- */}
      <section id="journey" className="bg-ink">
        <div className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32">
          <motion.div
            variants={reduce ? calm : rise(28, 0.9)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="max-w-3xl"
          >
            <p className="meta mb-4 text-marigold">The buyer&#39;s journey</p>
            <h2
              className="font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
            >
              Three taps from a face
              <br className="hidden sm:block" /> to the thing on your table.
            </h2>
          </motion.div>

          <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-24">
            {ACTS.map((act, i) => (
              <Beat key={act.index} act={act} flip={i % 2 === 1} reduce={!!reduce} />
            ))}
          </div>
        </div>
      </section>

      {/* ---- Trust at page scale (concept-lock D7) ---- */}
      <section className="border-t border-line bg-ink">
        <div className="mx-auto grid max-w-issue gap-12 px-5 py-24 sm:px-8 sm:py-32 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20">
          <motion.div
            variants={reduce ? calm : rise(28, 0.9)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
          >
            <p className="meta mb-4 text-marigold">Trust is the conversion</p>
            <h2
              className="font-display font-extrabold leading-[0.98] text-bone"
              style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
            >
              Two honest layers. Nothing we can&#39;t prove.
            </h2>
            <p className="mt-6 max-w-measure font-ui text-lg leading-relaxed text-bone/80">
              Every maker here is a real person, anchored by their own voice on
              film. And where AI helped — drafting a layout, tidying a line of
              copy — we say so plainly. The object, the film, and the voice are
              always the maker&#39;s own. We never claim what we can&#39;t back.
            </p>
          </motion.div>

          <motion.div
            variants={reduce ? calm : rise(28, 0.9)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
          >
            {/* Display-scale mono masthead — an entry point into the badge that
                names the promise before the two layers spell it out. */}
            <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-marigold">
              Every maker · Every claim · Real
            </p>
            <TrustBadge maker={COVER_MAKER} />
          </motion.div>
        </div>
      </section>

      {/* ---- What KOL is NOT — the anti-deal-grid stance ---- */}
      <section className="bg-plum">
        <div className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32">
          <motion.div
            variants={reduce ? calm : rise(28, 0.9)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="max-w-3xl"
          >
            <p className="meta mb-4 text-marigold-bright">
              What you won&#39;t find here
            </p>
            <h2
              className="font-display font-extrabold leading-[0.98] text-bone"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
            >
              Not a deal grid.
              <br className="hidden sm:block" /> Never a race to the bottom.
            </h2>
            <p className="mt-6 max-w-measure font-ui text-lg leading-relaxed text-bone/80">
              The dense, urgent marketplace you already know sells things by the
              thousand and forgets the maker entirely. We built the opposite on
              purpose.
            </p>
          </motion.div>

          <motion.div
            variants={stagger(0.05, 0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="mt-14 grid gap-8 sm:mt-16 md:grid-cols-2 md:gap-12"
          >
            <motion.div
              variants={reduce ? calm : rise(22, 0.7)}
              className="rounded-3xl border border-bone/20 p-7 sm:p-8"
            >
              <p className="meta mb-6 text-bone/60">The old way</p>
              <ul>
                {NOT_THIS.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3.5 border-t border-bone/10 py-3.5 first:border-t-0 first:pt-0"
                  >
                    <Prohibit
                      size={20}
                      weight="bold"
                      aria-hidden
                      className="mt-0.5 shrink-0 text-bone/40"
                    />
                    <span className="font-ui text-base leading-snug text-bone/60">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              variants={reduce ? calm : rise(22, 0.7)}
              className="rounded-3xl border border-marigold/40 bg-ink/25 p-7 sm:p-8"
            >
              <p className="meta mb-6 text-marigold-bright">The KOL way</p>
              <ul>
                {INSTEAD.map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-3.5 border-t border-bone/10 py-3.5 first:border-t-0 first:pt-0"
                  >
                    <Check
                      size={20}
                      weight="bold"
                      aria-hidden
                      className="mt-0.5 shrink-0 text-marigold-bright"
                    />
                    <span className="font-ui text-base leading-snug text-bone">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---- Close: two doors out ---- */}
      <section className="border-t border-line bg-ink">
        <motion.div
          variants={reduce ? calm : rise(28, 0.9)}
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          className="mx-auto max-w-issue px-5 py-24 text-center sm:px-8 sm:py-32"
        >
          <p className="meta text-marigold">Two ways in</p>
          <h2
            className="mx-auto mt-6 max-w-4xl font-display font-extrabold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
          >
            Meet the makers, or
            <br className="hidden sm:block" /> become one.
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Magnetic>
              <Link
                href="/#feed"
                className="group flex items-center gap-2.5 rounded-full bg-marigold px-8 py-4 font-ui text-lg font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                Meet the makers
                <ArrowRight
                  size={21}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Magnetic>
            <Link
              href="/sell"
              className="rounded-full border border-bone/30 px-8 py-4 font-ui text-lg font-medium text-bone transition-colors hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Become a maker
            </Link>
          </div>
          <p className="mt-6 font-ui text-sm text-bone/55">
            Free to browse · the feed reshuffles every visit
          </p>
        </motion.div>
      </section>
    </>
  );
}

function Beat({
  act,
  flip,
  reduce,
}: {
  act: Act;
  flip: boolean;
  reduce: boolean;
}) {
  return (
    <motion.div
      variants={stagger(0.08, 0.12)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="grid items-center gap-8 md:grid-cols-2 md:gap-14 lg:gap-20"
    >
      {/* Film still — a living Ken-Burns stand-in; the real clip plays here in
          the product. Ordered second on flipped rows at md+. */}
      <motion.figure
        variants={reduce ? calm : rise(28, 0.9)}
        className={`group relative m-0 aspect-[4/3] overflow-hidden rounded-[1.75rem] ring-1 ring-line ${
          flip ? "md:order-2" : ""
        }`}
      >
        <div className="film-drift absolute inset-0">
          <Image
            src={act.image}
            alt={act.alt}
            fill
            sizes="(max-width: 768px) 100vw, 46vw"
            className="object-cover"
          />
        </div>
        {act.film && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/10" />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-bone/95 text-ink shadow-[0_16px_40px_-16px_rgba(0,0,0,0.7)] transition-transform duration-500 ease-out-expo group-hover:scale-110">
              <Play aria-hidden size={24} weight="fill" className="translate-x-0.5" />
            </span>
          </>
        )}
        {/* Caption scrim + honest stand-in label on every beat (symmetry with
            the film beat). The scrim floors AA for the label over any photo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/75 to-transparent"
        />
        <figcaption className="meta absolute bottom-4 left-5 text-bone/75">
          {act.caption}
        </figcaption>
      </motion.figure>

      <motion.div variants={reduce ? calm : rise(28, 0.9)}>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-marigold">{act.index}</span>
          <span className="h-px w-10 bg-line" />
          <span className="meta text-bone-dim">{act.kicker}</span>
        </div>
        <h3
          className="mt-5 font-display font-bold leading-[1.02] text-bone"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
        >
          {act.title}
        </h3>
        <p className="mt-5 max-w-md font-ui text-lg leading-relaxed text-bone/80">
          {act.body}
        </p>
      </motion.div>
    </motion.div>
  );
}
