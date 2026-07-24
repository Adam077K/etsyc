"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Play, ArrowDown, ArrowRight } from "@phosphor-icons/react";
import { HERO_MAKER } from "@/lib/fixtures/makers";
import { WORLDS } from "@/lib/fixtures/worlds";
import { rise, stagger, calm } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { MakerFilm } from "./maker-film";
import { useFilm } from "./film/film-context";
import { HERO_TARGET } from "./film/film-geometry";

/**
 * Home hero — the cover of the issue. HERO_MAKER (Sharon, Two Dots) leads in
 * person: a 9:16 face-to-camera talking-head. A full-bleed wide crop would cut
 * a portrait clip to a forehead band, so the cover is composed as an editorial
 * split instead (Founder-approved): a right-anchored portrait film panel with
 * the statement type on the ink ground. Type-on-ink is bone-on-ink (~13:1),
 * stronger AA than the old type-over-film. Tapping the panel enters her world
 * on the persistent film stage (buyer journey step 2/3), same proven handoff.
 */
export function HeroSpread() {
  const reduce = useReducedMotion();
  const router = useRouter();
  const film = useFilm();
  const item = reduce ? calm : rise(28, 0.9);
  const coverVideoRef = useRef<HTMLVideoElement | null>(null);
  const hasWorld = HERO_MAKER.id in WORLDS;

  // Tap the cover panel to enter Sharon's world — hand the film to the
  // persistent stage (seeded to the panel clip's playhead) before navigating,
  // so it plays right through the route change instead of re-mounting from black.
  function enterHeroWorld() {
    if (!hasWorld) return;
    const seedTime = coverVideoRef.current?.currentTime;
    film.beginHandoff();
    film.present({
      makerId: HERO_MAKER.id,
      videoSrc: HERO_MAKER.filmSrc,
      poster: HERO_MAKER.image,
      alt: `${HERO_MAKER.name} — ${HERO_MAKER.discipline}, ${HERO_MAKER.studio}`,
      chip: "now-playing",
      seedTime: seedTime && Number.isFinite(seedTime) ? seedTime : undefined,
    });
    film.snapTo({ ...HERO_TARGET, opacity: 0, scale: reduce ? 1 : 1.06 });
    film.driveTo({ opacity: 1, scale: 1 }, { reduce: !!reduce, duration: 0.6 });
    router.push(`/m/${HERO_MAKER.id}`);
  }

  return (
    <section
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden bg-ink"
    >
      {/* Warm ink ground — a faint glow anchors the portrait side without a
          full-bleed film competing with the statement type. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_15%,rgba(46,36,30,0.9),transparent_60%)]"
      />

      <div className="relative mx-auto grid min-h-[100svh] max-w-issue grid-cols-1 items-center gap-10 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-20 lg:pt-32">
        {/* Statement column — type on ink. */}
        <motion.div
          variants={stagger(0.12, 0.11)}
          initial="hidden"
          animate="visible"
          className="order-2 lg:order-1"
        >
          <motion.p variants={item} className="meta mb-6 text-bone-dim">
            312 makers · filmed by hand
          </motion.p>

          <motion.h1
            variants={item}
            className="font-display font-extrabold leading-[0.9] text-bone"
            style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)" }}
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
            Real people making real things. Watch them work, hear the story, and
            buy from the hands that made it.
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
        </motion.div>

        {/* Cover panel — Sharon in person, portrait-composed. The whole panel is
            the affordance: tap to enter her world on film. */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduce ? 0.2 : 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="order-1 w-full lg:order-2 lg:-mr-8 lg:w-auto lg:justify-self-end"
        >
          <button
            type="button"
            onClick={enterHeroWorld}
            disabled={!hasWorld}
            aria-label={`Enter ${HERO_MAKER.studio} — ${HERO_MAKER.name} on film`}
            className="press group relative block w-full overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-default lg:w-[504px] lg:rounded-r-none"
          >
            <div className="relative aspect-[4/5] w-full sm:aspect-[3/4]">
              <div className="absolute inset-0 saturate-[0.94] brightness-[0.96] transition-[transform,filter] duration-[900ms] ease-out-expo group-hover:scale-[1.03] group-hover:saturate-100 group-hover:brightness-100">
                <MakerFilm
                  videoSrc={HERO_MAKER.filmSrc}
                  poster={HERO_MAKER.image}
                  alt={`${HERO_MAKER.name} — ${HERO_MAKER.discipline}, ${HERO_MAKER.studio}`}
                  reduce={!!reduce}
                  priority
                  sizes="(max-width: 1024px) 100vw, 440px"
                  className="object-cover"
                  videoRef={coverVideoRef}
                  // First video frame matches the poster still (0:06), so the
                  // panel opens on her mid-expression, not a between-words frame.
                  initialTime={HERO_MAKER.filmSeed}
                />
              </div>

              {/* Bottom-up ink scrim carries the credit over the film. Solid ink
                  through the bottom 30% (the whole credit block) so the text
                  stays AA on ANY video frame, not just Sharon's dark clip; fades
                  out above so her face reads clear. */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink from-30% via-ink/40 via-55% to-transparent to-[85%]" />

              <span className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 backdrop-blur-sm">
                <Play size={13} weight="fill" className="text-marigold" />
                <span className="meta text-bone">Watch · {HERO_MAKER.duration}</span>
              </span>

              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="meta text-bone-dim">On the cover</p>
                <p className="mt-2 font-display text-2xl font-bold leading-none text-bone">
                  {HERO_MAKER.name}
                </p>
                <p className="mt-2 flex items-center gap-1.5 font-ui text-sm text-bone/75">
                  {HERO_MAKER.discipline}
                  <span aria-hidden>·</span>
                  {HERO_MAKER.place}
                </p>
                {hasWorld && (
                  <span className="mt-4 flex items-center gap-2 font-ui text-sm font-semibold text-marigold-bright">
                    Enter the world
                    <ArrowRight
                      size={16}
                      weight="bold"
                      className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1"
                    />
                  </span>
                )}
              </div>
            </div>
          </button>
        </motion.div>
      </div>

      {/* Scroll cue — a real keyboard-navigable link to the feed. */}
      <a
        href="#feed"
        aria-label="Scroll to the feed"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full p-1 text-bone/50 transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink md:block"
      >
        <ArrowDown size={22} aria-hidden className="animate-float" />
      </a>
    </section>
  );
}
