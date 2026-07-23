"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Play, ArrowDown, ArrowRight } from "@phosphor-icons/react";
import { COVER_MAKER } from "@/lib/fixtures/makers";
import { WORLDS } from "@/lib/fixtures/worlds";
import { rise, stagger, calm } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { MakerFilm } from "./maker-film";
import { useFilm } from "./film/film-context";
import { HERO_TARGET } from "./film/film-geometry";

export function HeroSpread() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const film = useFilm();
  const item = reduce ? calm : rise(34, 1);
  const coverVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasWorld = COVER_MAKER.id in WORLDS;

  // Tap the cover to enter Lena's world — hand the film to the persistent stage
  // (seeded to the cover clip's playhead) before navigating, so it plays right
  // through the route change instead of re-mounting from black.
  function enterCoverWorld() {
    if (!hasWorld) return;
    const seedTime = coverVideoRef.current?.currentTime;
    // Claim the entrance so the world route doesn't restart it on mount.
    film.beginHandoff();
    film.present({
      makerId: COVER_MAKER.id,
      videoSrc: COVER_MAKER.filmSrc,
      poster: COVER_MAKER.image,
      alt: `${COVER_MAKER.name} — ${COVER_MAKER.discipline}, ${COVER_MAKER.studio}`,
      chip: "now-playing",
      seedTime: seedTime && Number.isFinite(seedTime) ? seedTime : undefined,
    });
    film.snapTo({ ...HERO_TARGET, opacity: 0, scale: reduce ? 1 : 1.06 });
    film.driveTo({ opacity: 1, scale: 1 }, { reduce: !!reduce, duration: 0.6 });
    router.push(`/m/${COVER_MAKER.id}`);
  }

  return (
    <section id="top" className="relative min-h-[100svh] w-full overflow-hidden">
      {/* Cover film — a living still (Ken-Burns drift stands in for the clip). */}
      <div className="absolute inset-0">
        {/* No wrapper drift — MakerFilm drifts the still, and a real clip must
            never Ken-Burns on top of its own motion. */}
        <div className="absolute inset-0">
          <MakerFilm
            videoSrc={COVER_MAKER.filmSrc}
            poster={COVER_MAKER.image}
            alt={`${COVER_MAKER.name} throwing stoneware at ${COVER_MAKER.studio}`}
            reduce={!!reduce}
            priority
            sizes="100vw"
            className="object-cover object-center"
            videoRef={coverVideoRef}
          />
        </div>
        {/* Ink scrims: bottom-up for the credit, left-in for the statement. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/25 to-transparent" />
      </div>

      <motion.div
        variants={stagger(0.15, 0.12)}
        initial="hidden"
        animate="visible"
        className="relative mx-auto flex min-h-[100svh] max-w-issue flex-col justify-end px-5 pb-16 pt-32 sm:px-8 sm:pb-20"
      >
        <motion.p variants={item} className="meta mb-6 text-marigold">
          Issue 07 · Summer · 312 makers on film
        </motion.p>

        <motion.h1
          variants={item}
          className="font-display font-extrabold leading-[0.9] text-bone"
          style={{ fontSize: "clamp(3rem, 8.5vw, 7rem)" }}
        >
          The makers,
          <br />
          <span className="font-serif font-normal italic text-marigold-bright">
            on&nbsp;film.
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-7 max-w-measure font-ui text-lg leading-relaxed text-bone/85 sm:text-xl"
        >
          A magazine of real people making real things. Watch them work, hear the
          story, and buy from the hands that made it — never from a grid.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Magnetic>
            <a
              href="#feed"
              className="press group flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink hover:bg-marigold-bright"
            >
              Meet the makers
              <ArrowRight
                size={20}
                weight="bold"
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
          </Magnetic>
          <a
            href="/how"
            className="press rounded-full border border-bone/30 px-7 py-3.5 font-ui text-base font-medium text-bone hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            How KOL works
          </a>
        </motion.div>

        {/* Cover credit + film affordance — tap to enter Lena's world on film. */}
        <motion.div
          variants={item}
          className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-5"
        >
          <button
            type="button"
            onClick={enterCoverWorld}
            disabled={!hasWorld}
            aria-label={`Enter ${COVER_MAKER.studio} — ${COVER_MAKER.name} on film`}
            className="group flex items-center gap-4 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-default"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-bone/40 text-bone transition-colors group-hover:border-marigold group-hover:bg-marigold group-hover:text-ink">
              <Play size={18} weight="fill" />
            </span>
            <div>
              <p className="meta text-bone-dim">On the cover</p>
              <p className="mt-1.5 font-ui text-sm text-bone">
                <span className="font-semibold">{COVER_MAKER.name}</span>
                <span className="text-bone/60">
                  {" "}
                  — {COVER_MAKER.discipline}, {COVER_MAKER.place}
                </span>
              </p>
            </div>
          </button>
          <span className="meta flex items-center gap-2 text-bone-dim">
            {hasWorld ? (
              <span className="flex items-center gap-2 text-bone">
                Enter the world
                <ArrowRight size={14} weight="bold" />
              </span>
            ) : (
              <>Watch {COVER_MAKER.duration}</>
            )}
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll cue — a real keyboard-navigable link to the feed. */}
      <a
        href="#feed"
        aria-label="Scroll to the feed"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full p-1 text-bone/50 transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink md:block"
      >
        <ArrowDown size={22} aria-hidden className={reduce ? "" : "animate-float"} />
      </a>
    </section>
  );
}
