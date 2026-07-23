"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  ArrowDown,
  Handbag,
  Heart,
  ArrowUpRight,
  Play,
  Ruler,
} from "@phosphor-icons/react";
import type { Maker } from "@/lib/fixtures/makers";
import type { MakerWorld as World } from "@/lib/fixtures/worlds";
import { TWODOTS_DEEP, type DeepWallItem } from "@/lib/fixtures/twodots-deep";
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { MakerFilm } from "./maker-film";
import { cn } from "@/lib/utils";
import { useFilm } from "./film/film-context";
import { HERO_TARGET, applyDockFrame, dockClip, dockTop } from "./film/film-geometry";

/**
 * TwoDotsWorld — Sharon's BESPOKE maker world (/m/two-dots only).
 *
 * Where the other five worlds share the MakerWorld template, hers is authored
 * section-by-section: an idea beat, a four-step make arc, a full-bleed film
 * interlude, an expanded wall, and a made-to-measure commissions beat. The one
 * persistent FilmStage (app shell) leads the journey — it opens full-bleed,
 * docks to the corner as you scroll, blooms back full-bleed for the interlude,
 * and narrates a new contextual label per section. D15 chrome stays fixed; what
 * changes is only HER world's internal composition.
 */
export function TwoDotsWorld({ maker, world }: { maker: Maker; world: World }) {
  const reduceRaw = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const reduce = mounted ? reduceRaw : false;
  const heroRef = useRef<HTMLDivElement>(null);
  const deep = TWODOTS_DEEP;

  // The corner film narrates a contextual label per beat; sections set it as they
  // scroll into view, the stage crossfades it (buyer-journey "narration").
  const [label, setLabel] = useState<string>(deep.interludeFilmLabel);

  return (
    <div className="relative bg-ink">
      <WorldChrome maker={maker} />

      <TwoDotsFilm
        maker={maker}
        heroSrc={maker.image}
        heroRef={heroRef}
        reduce={!!reduce}
        label={label}
      />

      {/* Hero — full-bleed film behind, tagline over the scrim. */}
      <section
        ref={heroRef}
        className="relative z-[45] flex h-[100svh] items-end overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-clay to-transparent opacity-40 mix-blend-soft-light" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, ease: easeOut, delay: 0.15 }}
          className="relative mx-auto w-full max-w-issue px-5 pb-16 sm:px-8 sm:pb-20"
        >
          <p className="meta mb-4 text-clay-bright">{maker.discipline}</p>
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
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-bone/50 md:block">
          <ArrowDown size={22} className={reduce ? "" : "animate-float"} />
        </div>
      </section>

      {/* The world scrolls around the docked film. Split around the interlude:
          the interlude must sit ABOVE the film (z-45, like the hero) so its quote
          reads over the bloomed footage; the docked beats sit below (z-10, the
          film is a small corner card there and never covers them). */}
      <div className="relative z-10 bg-ink">
        <IdeaSection reduce={!!reduce} onView={() => setLabel("It starts with an idea")} />
        <ArcSection reduce={!!reduce} onLabel={setLabel} />
      </div>

      <FilmInterlude
        reduce={!!reduce}
        onLabel={setLabel}
        label={deep.interludeFilmLabel}
      />

      <div className="relative z-10 bg-ink">
        <WallSection reduce={!!reduce} onView={() => setLabel("The whole room")} />
        <CommissionsSection
          reduce={!!reduce}
          onView={() => setLabel(deep.commissionsFilmLabel)}
        />
        <ProductsSection
          world={world}
          maker={maker}
          reduce={!!reduce}
          onView={() => setLabel(deep.productsFilmLabel)}
        />
        <VoiceClose world={world} maker={maker} reduce={!!reduce} />
      </div>
    </div>
  );
}

/* ---------- Film driver: hero dock + interlude bloom + per-beat label ---------- */

function dockedTarget(docked: number, clipAmt: number) {
  return {
    scale: docked,
    x: 24,
    y: dockTop(24),
    radius: 64,
    opacity: 1,
    originX: 0,
    originY: 0,
    shadow: 1,
    clip: clipAmt,
  };
}

function TwoDotsFilm({
  maker,
  heroSrc,
  heroRef,
  reduce,
  label,
}: {
  maker: Maker;
  heroSrc: string;
  heroRef: React.RefObject<HTMLDivElement | null>;
  reduce: boolean;
  label: string;
}) {
  const { present, driveTo, snapTo, setInteraction, consumeHandoff, m } = useFilm();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const isMobileRef = useRef(false);
  const enteredRef = useRef(false);
  // While the interlude owns the film (full-bleed), the hero-dock driver must not
  // fight it. The hero useScroll only emits over the hero's own range, but guard
  // anyway so a stray event during the interlude can't re-dock mid-bloom.
  const interludeRef = useRef(false);

  // Present base intent once; grow into the world (or accept a feed handoff).
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
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    snapTo({ originX: 0, originY: 0 });
    if (!consumeHandoff()) {
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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => (isMobileRef.current = mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => (enteredRef.current = true), reduce ? 0 : 720);
    return () => clearTimeout(t);
  }, [reduce]);

  // Expose interlude control to the FilmInterlude section via a window-scoped
  // event bus kept local to this subtree (no global state, no extra context).
  useEffect(() => {
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
      // full-bleed. No bloom yet → nothing to re-dock (also makes the unmount
      // safety-dispatch and the reduced-motion path a no-op until bloomed).
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
    window.addEventListener("twodots:film-bloom", bloom);
    window.addEventListener("twodots:film-redock", redock);
    return () => {
      window.removeEventListener("twodots:film-bloom", bloom);
      window.removeEventListener("twodots:film-redock", redock);
    };
  }, [driveTo]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (interludeRef.current) return;
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
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (reduce) {
      if (v > 0.6) snapTo(dockedTarget(docked, dockClip(vw, vh)));
      else snapTo({ ...HERO_TARGET });
      return;
    }
    if (!enteredRef.current) return;
    applyDockFrame(m, v, docked, dockClip(vw, vh), dockTop(24));
  });

  return null;
}

/* ---------- Reveal ---------- */

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

/* ---------- Chrome ---------- */

function WorldChrome({ maker }: { maker: Maker }) {
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

/* ---------- Sections ---------- */

function IdeaSection({ reduce, onView }: { reduce: boolean; onView: () => void }) {
  const d = TWODOTS_DEEP;
  return (
    <section className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32">
      <Reveal reduce={reduce} onView={onView}>
        <div className="grid gap-10 md:grid-cols-[1fr_1.05fr] md:gap-16">
          <div className="flex flex-col justify-center">
            <p className="meta mb-5 text-clay-bright">{d.ideaKicker}</p>
            <h2
              className="mb-6 font-display font-bold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
            >
              {d.ideaTitle}
            </h2>
            <div className="space-y-5">
              {d.ideaBody.map((p, i) => (
                <p
                  key={i}
                  className={cn(
                    "font-serif leading-relaxed text-bone/90",
                    i === 0 ? "text-xl sm:text-2xl" : "text-lg text-bone/75",
                  )}
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-line md:aspect-auto">
            <Image
              src={d.ideaImage}
              alt={d.ideaImageAlt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function ArcSection({
  reduce,
  onLabel,
}: {
  reduce: boolean;
  onLabel: (l: string) => void;
}) {
  const d = TWODOTS_DEEP;
  return (
    <section className="mx-auto max-w-issue px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal reduce={reduce}>
        <p className="meta mb-3 text-clay-bright">{d.arcKicker}</p>
        <h2
          className="mb-14 max-w-3xl font-display font-bold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          {d.arcTitle}
        </h2>
      </Reveal>
      <div className="flex flex-col gap-6 sm:gap-8">
        {d.arc.map((step, i) => (
          <Reveal
            key={step.kicker}
            reduce={reduce}
            onView={() => onLabel(step.filmLabel)}
          >
            <article
              className={cn(
                "group grid items-stretch gap-5 overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line sm:gap-6 md:grid-cols-[0.9fr_1.1fr]",
                i % 2 === 1 && "md:[&>*:first-child]:order-2",
              )}
            >
              <div className="relative aspect-[16/11] overflow-hidden md:aspect-auto md:min-h-[300px]">
                {step.filmSrc ? (
                  <MakerFilm
                    videoSrc={step.filmSrc}
                    poster={step.image}
                    alt={step.alt}
                    reduce={reduce}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    drift={false}
                  />
                ) : (
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-105"
                  />
                )}
                <span className="absolute left-4 top-4 font-display text-5xl font-bold leading-none text-bone/85 [text-shadow:0_2px_12px_rgba(28,22,19,0.8)]">
                  {step.kicker}
                </span>
                {step.filmSrc && (
                  <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 backdrop-blur-sm">
                    <Play size={11} weight="fill" className="text-clay-bright" />
                    <span className="meta text-[0.62rem] text-bone">On film</span>
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-center gap-3 p-7 sm:p-10">
                <p className="meta text-clay-bright">{step.title}</p>
                <p className="font-serif text-xl leading-snug text-bone/90 sm:text-2xl">
                  {step.body}
                </p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FilmInterlude({
  reduce,
  onLabel,
  label,
}: {
  reduce: boolean;
  onLabel: (l: string) => void;
  label: string;
}) {
  const d = TWODOTS_DEEP;
  const ref = useRef<HTMLDivElement>(null);

  // When the interlude is centred, the persistent film blooms back to full-bleed
  // behind this quote; on leave it re-docks to the corner. Driven by IO events
  // the TwoDotsFilm driver listens for (keeps geometry ownership in one place).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.intersectionRatio >= 0.55) {
          onLabel(label);
          window.dispatchEvent(new Event("twodots:film-bloom"));
        } else {
          window.dispatchEvent(new Event("twodots:film-redock"));
        }
      },
      { threshold: [0, 0.55, 1] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      // Safety: never leave the film bloomed if this unmounts mid-view.
      window.dispatchEvent(new Event("twodots:film-redock"));
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
        <Play size={30} weight="fill" className="mx-auto mb-6 text-clay-bright" />
        <p
          className="font-serif italic leading-[1.15] text-bone"
          style={{ fontSize: "clamp(1.9rem, 4.5vw, 3.5rem)" }}
        >
          &ldquo;{d.interludeQuote}&rdquo;
        </p>
        <footer className="mt-8 meta text-bone-dim">— {d.interludeAttribution}</footer>
      </motion.blockquote>
    </section>
  );
}

const WALL_RATIO: Record<DeepWallItem["ratio"], string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  tall: "aspect-[3/4]",
  landscape: "aspect-[5/4]",
  video: "aspect-[16/10]",
};

function WallSection({ reduce, onView }: { reduce: boolean; onView: () => void }) {
  const d = TWODOTS_DEEP;
  return (
    <section className="mx-auto max-w-issue px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal reduce={reduce} onView={onView}>
        <div className="mb-10 border-t border-clay-bright/30 pt-8">
          <p className="meta mb-3 text-clay-bright">{d.wallKicker}</p>
          <h2
            className="max-w-2xl font-display font-bold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
          >
            {d.wallTitle}
          </h2>
        </div>
      </Reveal>
      <div className="gap-4 [column-gap:1rem] sm:columns-2 lg:columns-3">
        {d.wall.map((item, i) => (
          <Reveal key={item.src + i} reduce={reduce} className="mb-4 break-inside-avoid">
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

function CommissionsSection({
  reduce,
  onView,
}: {
  reduce: boolean;
  onView: () => void;
}) {
  const d = TWODOTS_DEEP;
  return (
    <section className="relative overflow-hidden bg-clay">
      <div className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32">
        <Reveal reduce={reduce} onView={onView}>
          <div className="max-w-3xl">
            <p className="meta mb-3 flex items-center gap-2 text-bone">
              <Ruler size={15} weight="fill" />
              {d.commissionsKicker}
            </p>
            <h2
              className="font-display font-bold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(1.9rem, 4.5vw, 3.25rem)" }}
            >
              {d.commissionsTitle}
            </h2>
            <p className="mt-5 max-w-xl font-serif text-xl italic leading-snug text-bone/90">
              {d.commissionsLead}
            </p>
          </div>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {d.commissions.map((c, i) => (
            <Reveal key={c.title} reduce={reduce}>
              <div className="flex h-full flex-col gap-3 rounded-3xl bg-ink/25 p-7 ring-1 ring-bone/20 backdrop-blur-sm">
                <span className="font-display text-3xl font-bold text-bone">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl font-bold text-bone">{c.title}</h3>
                <p className="font-ui text-sm leading-relaxed text-bone/85">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
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
    <section className="mx-auto max-w-issue px-5 pt-24 pb-[260px] sm:px-8 sm:pt-32 sm:pb-[260px]">
      <Reveal reduce={reduce} onView={onView}>
        <p className="meta mb-3 text-clay-bright">The work</p>
        <h2
          className="mb-12 max-w-2xl font-display font-bold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          {world.shopSectionHeader}
        </h2>
      </Reveal>
      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        {world.products.map((product) => (
          <Reveal reduce={reduce} key={product.id}>
            <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line">
              <div className="relative aspect-[4/3] overflow-hidden">
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
              <div className="flex flex-1 flex-col gap-4 p-7 sm:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-2xl font-bold text-bone">
                    <Link
                      href={`/m/${world.slug}/p/${product.id}`}
                      className="transition-colors hover:text-clay-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <span className="font-display text-2xl font-bold text-bone">
                    {product.price}
                  </span>
                </div>
                <p className="font-serif text-lg italic leading-snug text-bone/80">
                  {product.blurb}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-2">
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

function VoiceClose({
  world,
  maker,
  reduce,
}: {
  world: World;
  maker: Maker;
  reduce: boolean;
}) {
  return (
    <Reveal reduce={reduce}>
      <section className="bg-clay px-6 py-24 text-center sm:py-32">
        <p
          className="mx-auto max-w-3xl font-serif leading-[1.15] text-bone"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3.25rem)" }}
        >
          {world.voice}
        </p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <button className="press flex items-center gap-2.5 rounded-full bg-bone px-7 py-3.5 font-ui text-base font-semibold text-ink hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bone focus-visible:ring-offset-2 focus-visible:ring-offset-ink">
            <Heart size={18} weight="fill" />
            Follow {maker.studio}
          </button>
          <Link
            href="/#feed"
            className="press rounded-full border border-bone/40 px-7 py-3.5 font-ui text-base font-medium text-bone hover:bg-bone/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bone focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Back to the feed
          </Link>
        </div>
      </section>
    </Reveal>
  );
}
