"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  animate,
  type PanInfo,
} from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  ArrowDown,
  Handbag,
  Heart,
  ArrowUpRight,
  Play,
  CaretLeft,
  CaretRight,
  HandTap,
} from "@phosphor-icons/react";
import type { Maker, Ground } from "@/lib/fixtures/makers";
import type { MakerWorld as World } from "@/lib/fixtures/worlds";
import { rise, calm, stagger, inView, easeOut } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { MakerFilm } from "./maker-film";
import { cn } from "@/lib/utils";
import { useFilm } from "./film/film-context";
import { HERO_TARGET, applyDockFrame, dockClip } from "./film/film-geometry";

const ACCENT_BG: Record<Ground, string> = {
  clay: "bg-clay",
  sky: "bg-sky",
  plum: "bg-plum",
  olive: "bg-olive",
  bone: "bg-bone",
  ink: "bg-ink-raise",
};

/** The per-maker accent's stable "bright" tint — a warm, readable hairline/label
    colour that survives the theme-wave remap of the base ground token. */
const ACCENT_BRIGHT: Record<Ground, string> = {
  clay: "text-clay-bright",
  sky: "text-sky",
  plum: "text-plum",
  olive: "text-olive",
  bone: "text-bone-dim",
  ink: "text-bone-dim",
};

function heroDefaultLabel(maker: Maker): string {
  return maker.kind === "film" ? `Now playing · ${maker.duration}` : "On film";
}

/**
 * maker-world (/m/[slug]) — the maker's branded world unfolds AROUND the
 * still-playing film (buyer journey steps 3-5). The film opens full-bleed and
 * DOCKS to a corner as you scroll, staying present while the world scrolls past.
 *
 * Evolved from a stacked-section layout into a film-LED journey: the docked film
 * narrates a contextual label per beat (generalized from the bespoke Two Dots
 * world via `world.filmNarration`), the process becomes a draggable make-reel
 * (the signature interactive moment), and a full-bleed film interlude breaks the
 * rhythm. Per-maker personality lives in imagery, an accent ground, and copy
 * voice — never a broken palette or type (DESIGN.md is the contract).
 */
export function MakerWorld({ maker, world }: { maker: Maker; world: World }) {
  // `useReducedMotion` resolves to the client's true preference immediately, but
  // the server always renders as `false` — so reduce-conditional DOM (the docked
  // film swaps to a whole different static tree) would hydration-mismatch. Gate
  // on mount: first client paint matches the server, then reduced motion applies.
  const reduceRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // Intentional mount flag: flip once after hydration so the first client paint
  // matches the server (reduce=false) and reduced motion only applies afterward.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const reduce = mounted ? reduceRaw : false;
  const heroRef = useRef<HTMLDivElement>(null);
  const textOnAccent = world.accent === "bone" ? "text-ink" : "text-bone";
  const accentBright = ACCENT_BRIGHT[world.accent];

  // The corner film narrates a contextual label per beat; sections set it as they
  // scroll into view and the stage crossfades it (buyer-journey "narration").
  const nar = world.filmNarration;
  const [label, setLabel] = useState<string>(
    nar?.hero ?? heroDefaultLabel(maker),
  );

  return (
    <div className="relative bg-ink">
      <WorldChrome />
      {/* Hero film: driven by the persistent app-shell FilmStage (never
          re-mounted from black on entry). A world may open on a different frame
          via `heroFilm`; the feed tile + feed↔expanded morph stay untouched. */}
      <WorldFilm
        maker={maker}
        heroSrc={world.heroFilm ?? maker.image}
        heroRef={heroRef}
        reduce={!!reduce}
        label={label}
        hasInterlude={!!world.interlude}
      />

      {/* Hero — the film plays full-bleed behind (fixed, z-40); the scrim + text
          sit above it (z-45) and scroll away, letting the film dock. */}
      <section
        ref={heroRef}
        className="relative z-[45] flex h-[100svh] items-end overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light",
            `bg-gradient-to-tr ${accentGrad(world.accent)}`,
          )}
        />
        <motion.div
          // Reduced-motion + hydration safe: `initial` is CONSTANT (never
          // reduce-dependent) so SSR and client render the same first paint (no
          // hydration mismatch), and `animate` always resolves to opacity:1 so
          // the hero text is never stranded invisible. Reduced motion only drops
          // the transition to an instant settle (no movement, no fade).
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, ease: easeOut, delay: 0.15 }}
          className="relative mx-auto w-full max-w-issue px-5 pb-16 sm:px-8 sm:pb-20"
        >
          <p className="meta mb-4 text-bone-dim">{maker.discipline}</p>
          <h1
            className="font-display font-extrabold leading-[0.9] text-bone"
            style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
          >
            {maker.studio}
          </h1>
          <p className="mt-5 max-w-xl font-serif text-2xl italic leading-snug text-bone/90 sm:text-3xl">
            {world.tagline}
          </p>
          <p className="mt-6 flex items-center gap-2 font-ui text-base text-bone/80">
            <span className="font-semibold text-bone">{maker.name}</span>
            <span aria-hidden>·</span>
            <MapPin size={15} className="shrink-0" />
            {maker.place}
          </p>
        </motion.div>
        <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-bone/50">
          <ArrowDown size={22} className={reduce ? "" : "animate-float"} />
        </div>
      </section>

      {/* The world, scrolling around the docked film. Split around the interlude:
          the interlude sits ABOVE the film (z-45, like the hero) so its quote
          reads over the bloomed footage; the docked beats sit below (z-10). */}
      <div className="relative z-10 bg-ink">
        <StorySection
          world={world}
          maker={maker}
          reduce={!!reduce}
          accentBright={accentBright}
          onView={() => nar?.story && setLabel(nar.story)}
        />
        {world.wall && world.wall.length > 0 && (
          <GalleryWall world={world} reduce={!!reduce} />
        )}
        <MakeReel
          world={world}
          reduce={!!reduce}
          accentBright={accentBright}
          onLabel={setLabel}
        />
      </div>

      {world.interlude && (
        <WorldInterlude
          quote={world.interlude.quote}
          attribution={`${maker.name} · ${maker.studio}`}
          label={nar?.interlude ?? nar?.hero ?? heroDefaultLabel(maker)}
          accentBright={accentBright}
          reduce={!!reduce}
          onLabel={setLabel}
        />
      )}

      <div className="relative z-10 bg-ink">
        <ProductsSection
          world={world}
          maker={maker}
          reduce={!!reduce}
          onView={() => nar?.products && setLabel(nar.products)}
        />

        {/* Studio — the per-maker accent color-block, with a slow parallax lift. */}
        <StudioBlock
          world={world}
          reduce={!!reduce}
          onView={() => nar?.studio && setLabel(nar.studio)}
        />

        {/* Voice — accent-drenched close. */}
        <Reveal reduce={!!reduce}>
          <section className={cn("px-6 py-24 text-center sm:py-32", ACCENT_BG[world.accent])}>
            <p
              className={cn(
                "mx-auto max-w-3xl font-serif leading-[1.15]",
                textOnAccent,
              )}
              style={{ fontSize: "clamp(1.75rem, 4vw, 3.25rem)" }}
            >
              {world.voice}
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <button
                className={cn(
                  "press flex items-center gap-2.5 rounded-full px-7 py-3.5 font-ui text-base font-semibold hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  world.accent === "bone"
                    ? "bg-ink text-bone focus-visible:ring-ink focus-visible:ring-offset-bone"
                    : "bg-bone text-ink focus-visible:ring-bone focus-visible:ring-offset-ink",
                )}
              >
                <Heart size={18} weight="fill" />
                Follow {maker.studio}
              </button>
              <Link
                href="/#feed"
                className={cn(
                  "press rounded-full border px-7 py-3.5 font-ui text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  world.accent === "bone"
                    ? "border-ink/30 text-ink hover:bg-ink/5 focus-visible:ring-ink focus-visible:ring-offset-bone"
                    : "border-bone/40 text-bone hover:bg-bone/10 focus-visible:ring-bone focus-visible:ring-offset-ink",
                )}
              >
                Back to the feed
              </Link>
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  );
}

function accentGrad(accent: Ground): string {
  const map: Record<Ground, string> = {
    clay: "from-clay to-transparent",
    sky: "from-sky to-transparent",
    plum: "from-plum to-transparent",
    olive: "from-olive to-transparent",
    bone: "from-bone to-transparent",
    ink: "from-ink to-transparent",
  };
  return map[accent];
}

/* Slim world chrome — back to the feed, wordmark, bag. Gains a solid ground on
   scroll so the story headline never collides with the pills (esp. mobile). */
function WorldChrome() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "border-b border-line bg-ink/80 backdrop-blur-md"
          : "bg-gradient-to-b from-ink/90 via-ink/45 to-transparent",
      )}
    >
      <div className="mx-auto flex max-w-issue items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href="/#feed"
          className="press group flex items-center gap-2 rounded-full bg-ink/60 px-4 py-2 font-ui text-sm text-bone backdrop-blur-sm hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <ArrowLeft size={17} weight="bold" className="transition-transform group-hover:-translate-x-0.5" />
          The issue
        </Link>
        <Link href="/" className="font-serif text-2xl leading-none text-bone">
          KOL
        </Link>
        <button
          aria-label="Your bag"
          className="press flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Handbag size={18} weight="fill" />
          <span className="hidden sm:inline">Bag</span>
        </button>
      </div>
    </header>
  );
}

function dockedTarget(docked: number, clipAmt: number) {
  return {
    scale: docked,
    x: -24,
    y: -24,
    radius: 64,
    opacity: 1,
    originX: 100,
    originY: 100,
    shadow: 1,
    clip: clipAmt,
  };
}

/**
 * WorldFilm — drives the persistent app-shell FilmStage for the maker world.
 * It renders nothing itself; the film lives in <FilmStage> (app shell) and never
 * re-mounts on entry. This component (a) presents the maker's film intent and
 * re-narrates its contextual label per beat, (b) plays the "grow into the world"
 * entrance when arriving directly, (c) binds the hero's scroll progress to the
 * stage's shared transform so the film docks to the corner, and (d) blooms the
 * film back to full-bleed for the interlude beat, then re-docks — all backed by
 * one continuous element. When docked it grants the stage a tap-to-top action.
 */
function WorldFilm({
  maker,
  heroSrc,
  heroRef,
  reduce,
  label,
  hasInterlude,
}: {
  maker: Maker;
  heroSrc: string;
  heroRef: React.RefObject<HTMLDivElement | null>;
  reduce: boolean;
  label: string;
  hasInterlude: boolean;
}) {
  const film = useFilm();
  const { present, driveTo, snapTo, setInteraction, consumeHandoff, m } = film;
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // While the interlude owns the film (full-bleed), the hero-dock driver must not
  // fight it. The hero useScroll only emits over the hero's own range, but guard
  // anyway so a stray event during the interlude can't re-dock mid-bloom.
  const interludeRef = useRef(false);

  // Present the film + settle the entrance. Three arrival paths, disambiguated
  // by an explicit handoff flag (not an opacity heuristic):
  //   • feed/cover handoff  → the caller is already animating it in; just lock
  //     the hero origin so we don't restart/cancel that animation.
  //   • direct nav          → grow it in from a touch oversized.
  //   • back-nav from a product (film docked in the corner, PiP open) → drive it
  //     back to the full-bleed hero so it isn't left frozen in the corner.
  // Runs once per maker; the film controls (present/drive/…) are stable.
  useEffect(() => {
    present({
      makerId: maker.id,
      videoSrc: maker.filmSrc,
      poster: heroSrc,
      alt: `${maker.name} — ${maker.discipline}, ${maker.studio}`,
      clipLabel: label,
      chip: "now-playing",
      // Cold/direct entry only: open a low-framed portrait clip on its action
      // (applied once on the film node's first mount; the feed→world carry wins
      // when arriving via a handoff). Omitted makers open at 0:00 as before.
      seedTime: maker.filmSeed,
    });
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (consumeHandoff()) {
      // The feed/cover is animating the entrance — just lock the hero origin.
      snapTo({ originX: 100, originY: 100 });
    } else {
      // Direct nav or back-nav from a product: settle to the full-bleed hero.
      snapTo({ originX: 100, originY: 100 });
      driveTo({ ...HERO_TARGET }, { reduce: prefersReduced, duration: 0.55 });
    }
    return () => setInteraction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maker.id]);

  // Update just the narrated label as beats scroll by (idempotent present()).
  useEffect(() => {
    present({
      makerId: maker.id,
      videoSrc: maker.filmSrc,
      poster: heroSrc,
      alt: `${maker.name} — ${maker.discipline}, ${maker.studio}`,
      clipLabel: label,
      chip: "now-playing",
      seedTime: maker.filmSeed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  // Mobile caps the dock smaller so it never occludes the Add-to-bag corner.
  const isMobileRef = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => {
      isMobileRef.current = mq.matches;
    };
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Bind the hero scroll to the stage transform — the dock settle, unchanged.
  // Gated by `entered` so the entrance grow isn't overridden on the first paint.
  const enteredRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => (enteredRef.current = true), reduce ? 0 : 720);
    return () => clearTimeout(t);
  }, [reduce]);

  // Interlude bloom/redock — the interlude section dispatches these as it enters
  // and leaves centre; geometry ownership stays here (one place drives the film).
  // Only wired when the world actually has an interlude beat.
  useEffect(() => {
    if (!hasInterlude) return;
    const bloom = () => {
      interludeRef.current = true;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      driveTo({ ...HERO_TARGET }, { reduce: prefersReduced, duration: 0.6 });
    };
    const redock = () => {
      // Only re-dock if a bloom actually happened. The interlude IO fires a
      // mandatory initial callback at ratio 0 on cold load, which dispatches
      // redock BEFORE any bloom — without this guard it would cancel the mount
      // driveTo(HERO_TARGET) one frame in and open the world docked instead of
      // full-bleed. No bloom yet → nothing to re-dock.
      if (!interludeRef.current) return;
      interludeRef.current = false;
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const docked = isMobileRef.current ? 0.2 : 0.26;
      driveTo(dockedTarget(docked, dockClip(vw, vh)), {
        reduce: prefersReduced,
        duration: 0.6,
      });
    };
    window.addEventListener("world:film-bloom", bloom);
    window.addEventListener("world:film-redock", redock);
    return () => {
      window.removeEventListener("world:film-bloom", bloom);
      window.removeEventListener("world:film-redock", redock);
    };
  }, [driveTo, hasInterlude]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (interludeRef.current) return;
    // Docked state → grant / retire the tap-to-top interaction.
    if (v > 0.88) {
      setInteraction({
        onActivate: () =>
          window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }),
        label: "Back to top of the world",
      });
    } else {
      setInteraction(null);
    }
    const docked = isMobileRef.current ? 0.2 : 0.26;
    if (reduce) {
      // Reduced motion: presence WITHOUT motion. Hold the film full-bleed over
      // the hero, then SNAP it to the docked corner past the hero so it never
      // covers the world content the buyer needs to read (no per-frame move).
      if (v > 0.6) {
        snapTo(dockedTarget(docked, dockClip(window.innerWidth, window.innerHeight)));
      } else {
        snapTo({ ...HERO_TARGET });
      }
      return;
    }
    if (!enteredRef.current) return;
    // Shared hero→dock settle (lands by 72%, insets 24px, linear shadow); the
    // clip crops the dock to a landscape card on portrait phones so it never
    // buries the world copy it scrolls past.
    applyDockFrame(m, v, docked, dockClip(window.innerWidth, window.innerHeight));
  });

  return null;
}

/* Reveal wrapper — scroll-in, reduced-motion safe, optional in-view callback. */
function Reveal({
  children,
  reduce,
  className,
  onView,
}: {
  children: React.ReactNode;
  reduce: boolean;
  className?: string;
  onView?: () => void;
}) {
  return (
    <motion.div
      variants={reduce ? calm : rise(28, 0.8)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      onViewportEnter={onView}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StorySection({
  world,
  maker,
  reduce,
  accentBright,
  onView,
}: {
  world: World;
  maker: Maker;
  reduce: boolean;
  accentBright: string;
  onView: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Slow parallax lift on the portrait — transform only, cancelled on reduce.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [34, -34]);

  return (
    <section
      ref={ref}
      className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32"
    >
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
        <motion.div
          className="flex flex-col justify-center"
          variants={reduce ? calm : stagger(0.05, 0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          onViewportEnter={onView}
        >
          <motion.p
            variants={reduce ? calm : rise(18, 0.7)}
            className={cn("meta mb-5", accentBright)}
          >
            The maker
          </motion.p>
          <div className="space-y-6">
            {world.story.map((para, i) => (
              <motion.p
                key={i}
                variants={reduce ? calm : rise(22, 0.8)}
                className={cn(
                  "font-serif leading-relaxed text-bone/90",
                  i === 0 ? "text-2xl sm:text-[1.7rem]" : "text-lg text-bone/75",
                )}
              >
                {para}
              </motion.p>
            ))}
          </div>
        </motion.div>
        <Reveal reduce={reduce}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-line">
            <motion.div style={{ y }} className="absolute inset-[-6%]">
              <Image
                src={world.storyImage}
                alt={world.storyImageAlt ?? `${maker.name}, ${maker.studio}`}
                fill
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
            </motion.div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const WALL_RATIO: Record<
  NonNullable<World["wall"]>[number]["ratio"],
  string
> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  tall: "aspect-[3/4]",
  landscape: "aspect-[5/4]",
  video: "aspect-[16/10]",
};

/**
 * GalleryWall — the maker's whole room, pinned to the wall: a dense editorial
 * masonry (CSS columns, never a uniform grid) of her real stills and woven films.
 * Present only for a maker with a deep media library. Films play muted/looped
 * through the SAME MakerFilm primitive as the rest of the build.
 */
function GalleryWall({ world, reduce }: { world: World; reduce: boolean }) {
  const wall = world.wall!;
  return (
    <section className="mx-auto max-w-issue px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal reduce={reduce}>
        <div className="mb-10 border-t border-clay-bright/30 pt-8">
          {world.wallSectionKicker && (
            <p className="meta mb-3 text-clay-bright">{world.wallSectionKicker}</p>
          )}
          <h2
            className="max-w-2xl font-display font-bold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            {world.wallSectionHeader}
          </h2>
        </div>
      </Reveal>

      {/* Masonry — packs tiles of different heights tight, like a pinboard. */}
      <div className="gap-4 [column-gap:1rem] sm:columns-2 lg:columns-3">
        {wall.map((item, i) => (
          <Reveal
            key={item.src + i}
            reduce={reduce}
            className="mb-4 break-inside-avoid"
          >
            <figure
              className={cn(
                "group/w relative w-full overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line",
                WALL_RATIO[item.ratio],
              )}
            >
              <div className="absolute inset-0 saturate-[0.94] transition-[transform,filter] duration-[900ms] ease-out-expo group-hover/w:scale-[1.04] group-hover/w:saturate-100">
                {item.filmSrc ? (
                  <MakerFilm
                    videoSrc={item.filmSrc}
                    poster={item.src}
                    alt={item.alt}
                    reduce={reduce}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    drift={false}
                  />
                ) : (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                )}
              </div>
              {item.filmSrc && (
                <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 backdrop-blur-sm">
                  <Play size={11} weight="fill" className="text-clay-bright" />
                  <span className="meta text-[0.62rem] text-bone">On film</span>
                </span>
              )}
              {item.caption && (
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent p-4 pt-10">
                  <span className="meta text-bone">{item.caption}</span>
                </figcaption>
              )}
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/**
 * MakeReel — the making, frame by frame: the maker's process as a single physical
 * filmstrip you throw. Drag it with momentum, step it with the arrow buttons or
 * the left/right keys — the same active frame drives all three, so nothing is
 * drag-only. As each frame becomes active, the corner-docked film re-narrates its
 * contextual label, so the film reads the process while you rummage through it.
 * This replaces the old stacked 3-up card grid (the "reads like a website" beat).
 * Reduced motion drops the throw + spring and jumps instantly; keyboard and the
 * arrow buttons still work, so the reel is never motion-dependent.
 */
function MakeReel({
  world,
  reduce,
  accentBright,
  onLabel,
}: {
  world: World;
  reduce: boolean;
  accentBright: string;
  onLabel: (l: string) => void;
}) {
  const steps = world.process;
  const n = steps.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const x = useMotionValue(0);
  const metricsRef = useRef<{ offsets: number[]; max: number }>({
    offsets: [],
    max: 0,
  });
  // `max` is also mirrored to state because dragConstraints is read during render
  // (a ref read there is stale + lint-flagged); the ref carries offsets for the
  // drag-settle handler, which runs outside render.
  const [maxScroll, setMaxScroll] = useState(0);
  const [ready, setReady] = useState(false);

  // Measure each card's left offset + the max scroll, so snap targets are exact
  // even with unequal card widths. ResizeObserver keeps them right on resize.
  useEffect(() => {
    const measure = () => {
      const vp = viewportRef.current;
      const track = trackRef.current;
      if (!vp || !track) return;
      const base = track.getBoundingClientRect().left;
      const offsets = cardRefs.current.map((c) =>
        c ? c.getBoundingClientRect().left - base : 0,
      );
      const max = Math.max(0, track.scrollWidth - vp.clientWidth);
      metricsRef.current = { offsets, max };
      setMaxScroll(max);
      setReady(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [n]);

  const targetFor = (i: number) => {
    const { offsets, max } = metricsRef.current;
    const raw = offsets[i] ?? 0;
    return -Math.min(raw, max);
  };

  const goTo = (i: number, animateIt = true) => {
    const next = Math.max(0, Math.min(n - 1, i));
    setActive(next);
    const target = targetFor(next);
    if (reduce || !animateIt) {
      x.set(target);
      return;
    }
    animate(x, target, { type: "spring", stiffness: 260, damping: 36 });
  };

  // Keep the track parked on the active card once measured (and on resize).
  useEffect(() => {
    if (!ready) return;
    x.set(targetFor(active));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Narrate the active frame's label to the corner film — but ONLY once the reel
  // has actually scrolled into view. Without this guard the effect fires on mount
  // (active=0) and stomps the authored hero narration on cold load, so every world
  // would open showing process step-1's label instead of its hero line. The Reveal
  // onView below owns the entry label; this effect owns per-frame updates after.
  const inViewRef = useRef(false);
  useEffect(() => {
    if (!inViewRef.current) return;
    const l = steps[active]?.filmLabel ?? world.filmNarration?.process;
    if (l) onLabel(l);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function settle(info: PanInfo) {
    const cur = x.get();
    const { offsets, max } = metricsRef.current;
    let best = 0;
    let bestD = Infinity;
    offsets.forEach((off, i) => {
      const d = Math.abs(-Math.min(off, max) - cur);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    // Velocity-aware: a fast flick advances even on a short drag (momentum).
    if (info.velocity.x < -420) best = Math.min(best + 1, n - 1);
    else if (info.velocity.x > 420) best = Math.max(best - 1, 0);
    goTo(best);
  }

  const multi = n > 1;
  const atStart = active === 0;
  const atEnd = active === n - 1;

  return (
    <section className="mx-auto max-w-issue px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal
        reduce={reduce}
        onView={() => {
          inViewRef.current = true;
          const l = steps[active]?.filmLabel ?? world.filmNarration?.process;
          if (l) onLabel(l);
        }}
      >
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className={cn("meta mb-3", accentBright)}>How it&#39;s made</p>
            <h2
              className="max-w-2xl font-display font-bold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              {world.processSectionHeader}
            </h2>
          </div>
          {multi && (
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <span className="mr-1 flex items-center gap-1.5 font-ui text-xs text-bone-dim">
                <HandTap size={15} weight="regular" />
                Drag the reel
              </span>
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                disabled={atStart}
                aria-label="Previous step"
                className="press grid h-11 w-11 place-items-center rounded-full border border-bone/25 text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                disabled={atEnd}
                aria-label="Next step"
                className="press grid h-11 w-11 place-items-center rounded-full border border-bone/25 text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <CaretRight size={18} weight="bold" />
              </button>
            </div>
          )}
        </div>
      </Reveal>

      <div
        ref={viewportRef}
        tabIndex={multi ? 0 : -1}
        role={multi ? "group" : undefined}
        aria-roledescription={multi ? "carousel" : undefined}
        aria-label={
          multi
            ? `How it's made — step ${active + 1} of ${n}. Use the left and right arrow keys or drag to browse.`
            : undefined
        }
        onKeyDown={
          multi
            ? (e) => {
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  goTo(active + 1);
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  goTo(active - 1);
                }
              }
            : undefined
        }
        className="-mx-5 touch-pan-y overflow-hidden px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-4 focus-visible:ring-offset-ink sm:mx-0 sm:px-0"
      >
        <motion.div
          ref={trackRef}
          className="flex gap-4 sm:gap-6"
          style={{ x }}
          drag={multi && !reduce ? "x" : false}
          dragConstraints={{ left: -maxScroll, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => settle(info)}
        >
          {steps.map((step, i) => (
            <div
              key={step.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={cn(
                "w-[80vw] shrink-0 overflow-hidden rounded-3xl bg-ink-soft ring-1 transition-[opacity,box-shadow] duration-500 sm:w-[52vw] lg:w-[38vw] lg:max-w-[520px]",
                i === active
                  ? "opacity-100 ring-bone/25"
                  : "opacity-70 ring-line",
              )}
            >
              <div className="group/r relative aspect-[16/11] overflow-hidden">
                {step.filmSrc ? (
                  <MakerFilm
                    videoSrc={step.filmSrc}
                    poster={step.image}
                    alt={step.title}
                    reduce={reduce}
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 52vw, 38vw"
                    className="object-cover"
                    drift={false}
                  />
                ) : (
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 52vw, 38vw"
                    className="pointer-events-none select-none object-cover transition-transform duration-[900ms] ease-out-expo group-hover/r:scale-105"
                  />
                )}
                <span className="absolute left-4 top-4 font-display text-5xl font-bold leading-none text-bone/85 [text-shadow:0_2px_12px_rgba(28,22,19,0.8)]">
                  {step.label}
                </span>
                {step.filmSrc && (
                  <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 backdrop-blur-sm">
                    <Play size={11} weight="fill" className={accentBright} />
                    <span className="meta text-[0.62rem] text-bone">On film</span>
                  </span>
                )}
              </div>
              <div className="p-6 sm:p-7">
                <h3 className="font-display text-xl font-bold text-bone">{step.title}</h3>
                <p className="mt-2 font-ui text-sm leading-relaxed text-bone/70">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Progress rail — a physical readout of where the reel sits, and a second
          non-drag control (each segment steps to its frame). */}
      {multi && (
        <div className="mt-6 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" role="tablist" aria-label="Steps">
            {steps.map((step, i) => (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Step ${i + 1}: ${step.title}`}
                onClick={() => goTo(i)}
                // 44px tall hit area (team tap-target floor) with the visual rail
                // kept at h-1 and centred — the touch zone grows, the rail doesn't.
                className="press group/seg flex h-11 flex-1 items-center focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "block h-1 w-full rounded-full transition-colors duration-300 group-focus-visible/seg:ring-2 group-focus-visible/seg:ring-marigold group-focus-visible/seg:ring-offset-2 group-focus-visible/seg:ring-offset-ink",
                    i === active ? "bg-marigold" : "bg-bone/20 group-hover/seg:bg-bone/40",
                  )}
                />
              </button>
            ))}
          </div>
          <span className="shrink-0 font-mono text-[0.7rem] tabular-nums text-bone-dim">
            {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
        </div>
      )}
      {multi && (
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          Step {active + 1} of {n}: {steps[active]?.title}
        </span>
      )}
    </section>
  );
}

/**
 * WorldInterlude — a full-bleed film beat between the making and the shop: the
 * persistent film blooms back to full-bleed behind a single line pulled from the
 * maker's own story, then re-docks on leave. Driven by IO events the WorldFilm
 * driver listens for, so film geometry stays owned in one place. The cinematic
 * interruption that breaks the stacked-section rhythm.
 */
function WorldInterlude({
  quote,
  attribution,
  label,
  accentBright,
  reduce,
  onLabel,
}: {
  quote: string;
  attribution: string;
  label: string;
  accentBright: string;
  reduce: boolean;
  onLabel: (l: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.intersectionRatio >= 0.55) {
          onLabel(label);
          window.dispatchEvent(new Event("world:film-bloom"));
        } else {
          window.dispatchEvent(new Event("world:film-redock"));
        }
      },
      { threshold: [0, 0.55, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      // Safety: never leave the film bloomed if this unmounts mid-view.
      window.dispatchEvent(new Event("world:film-redock"));
    };
  }, [onLabel, label]);

  return (
    <section
      ref={ref}
      className="relative z-[45] flex min-h-[92svh] items-center justify-center overflow-hidden py-24"
    >
      {/* The film plays behind (app-shell FilmStage, z-40); this section is z-45 so
          its scrim + quote sit above the bloomed footage and stay legible. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/70" />
      <motion.blockquote
        variants={reduce ? calm : rise(28, 0.9)}
        initial="hidden"
        whileInView="visible"
        viewport={inView}
        className="relative z-[45] mx-auto max-w-4xl px-6 text-center"
      >
        <Play size={30} weight="fill" className={cn("mx-auto mb-6", accentBright)} />
        <p
          className="font-serif italic leading-[1.15] text-bone"
          style={{ fontSize: "clamp(1.9rem, 4.5vw, 3.5rem)" }}
        >
          &ldquo;{quote}&rdquo;
        </p>
        <footer className="mt-8 meta text-bone-dim">— {attribution}</footer>
      </motion.blockquote>
    </section>
  );
}

function StudioBlock({
  world,
  reduce,
  onView,
}: {
  world: World;
  reduce: boolean;
  onView: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);

  return (
    <Reveal reduce={reduce} onView={onView}>
      <section
        ref={ref}
        className={cn("relative overflow-hidden", ACCENT_BG[world.accent])}
      >
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          <motion.div style={{ y }} className="absolute inset-[-8%]">
            <Image
              src={world.studioImage}
              alt={world.studioCaption}
              fill
              sizes="100vw"
              className="object-cover opacity-90 mix-blend-multiply"
            />
          </motion.div>
          {/* Locked scrim rule — caption never sits raw over the image. */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/75 to-transparent" />
          <div className="absolute inset-0 flex items-end p-6 sm:p-12">
            <p className="meta text-bone">{world.studioCaption}</p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

function ProductsSection({
  world,
  maker,
  reduce,
  onView,
}: {
  world: World;
  maker: Maker;
  reduce: boolean;
  onView: () => void;
}) {
  return (
    <section className="mx-auto max-w-issue px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal reduce={reduce} onView={onView}>
        <p className="meta mb-3 text-bone-dim">The work</p>
        <h2
          className="mb-12 max-w-2xl font-display font-bold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          {world.shopSectionHeader}
        </h2>
      </Reveal>
      <div className="space-y-5 sm:space-y-6">
        {world.products.map((product, i) => (
          <Reveal reduce={reduce} key={product.id}>
            <article
              className={cn(
                "group grid overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line md:grid-cols-2",
                i % 2 === 1 && "md:[&>*:first-child]:order-2",
              )}
            >
              <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[360px]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-105"
                />
                {product.note && (
                  <span className="absolute left-4 top-4 rounded-full bg-ink/72 px-3 py-1 backdrop-blur-sm">
                    <span className="meta text-bone">{product.note}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-center gap-5 p-8 sm:p-12">
                <div>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-display text-2xl font-bold text-bone sm:text-3xl">
                      <Link
                        href={`/m/${world.slug}/p/${product.id}`}
                        className="transition-colors hover:text-marigold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    <span className="font-display text-2xl font-bold text-bone">
                      {product.price}
                    </span>
                  </div>
                  <p className="mt-4 max-w-md font-serif text-lg italic leading-snug text-bone/80">
                    {product.blurb}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Magnetic strength={0.2}>
                    <Link
                      href={`/m/${world.slug}/p/${product.id}`}
                      className="press flex items-center gap-2.5 rounded-full bg-marigold px-6 py-3 font-ui text-base font-semibold text-ink hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      View the piece
                      <ArrowUpRight size={18} weight="bold" />
                    </Link>
                  </Magnetic>
                  <button
                    aria-label={`Save ${product.name}`}
                    className="press grid h-12 w-12 place-items-center rounded-full border border-bone/25 text-bone hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                  >
                    <Heart size={20} />
                  </button>
                </div>
                <p className="font-ui text-xs text-bone-dim">
                  Made by {maker.name} · {maker.place}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
