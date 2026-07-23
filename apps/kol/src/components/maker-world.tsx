"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  cubicBezier,
} from "framer-motion";
import {
  ArrowLeft,
  Play,
  MapPin,
  ArrowDown,
  Handbag,
  Heart,
  ArrowUpRight,
} from "@phosphor-icons/react";
import type { Maker, Ground } from "@/lib/fixtures/makers";
import type { MakerWorld as World } from "@/lib/fixtures/worlds";
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
 * maker-world (/m/[slug]) — the maker's branded world unfolds AROUND the
 * still-playing film (buyer journey steps 3-5). The film opens full-bleed and
 * DOCKS to a corner as you scroll, staying present while the world scrolls past.
 * Per-maker personality lives in imagery, an accent ground (clay vs sky), and
 * copy voice — never in a broken palette or type (DESIGN.md is the contract).
 */
export function MakerWorld({ maker, world }: { maker: Maker; world: World }) {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const textOnAccent = world.accent === "bone" ? "text-ink" : "text-bone";

  return (
    <div className="relative bg-ink">
      <WorldChrome />
      <DockedFilm maker={maker} heroRef={heroRef} reduce={!!reduce} />

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
          initial={reduce ? undefined : { opacity: 0, y: 30 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.15 }}
          className="relative mx-auto w-full max-w-issue px-5 pb-16 sm:px-8 sm:pb-20"
        >
          <p className="meta mb-4 text-marigold">{maker.discipline}</p>
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

      {/* The world, scrolling around the docked film. */}
      <div className="relative z-10 bg-ink">
        <StorySection world={world} maker={maker} reduce={!!reduce} />
        <ProcessSection world={world} reduce={!!reduce} />
        <ProductsSection world={world} maker={maker} reduce={!!reduce} />

        {/* Studio — the per-maker accent color-block. */}
        <Reveal reduce={!!reduce}>
          <section className={cn("relative overflow-hidden", ACCENT_BG[world.accent])}>
            <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
              <Image
                src={world.studioImage}
                alt={world.studioCaption}
                fill
                sizes="100vw"
                className="object-cover opacity-90 mix-blend-multiply"
              />
              {/* Locked scrim rule — caption never sits raw over the image
                  (illegible over the near-white indigo vat otherwise). */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/75 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6 sm:p-12">
                <p className="meta text-bone">{world.studioCaption}</p>
              </div>
            </div>
          </section>
        </Reveal>

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
                  "flex items-center gap-2.5 rounded-full px-7 py-3.5 font-ui text-base font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
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
                  "rounded-full border px-7 py-3.5 font-ui text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
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
          className="group flex items-center gap-2 rounded-full bg-ink/60 px-4 py-2 font-ui text-sm text-bone backdrop-blur-sm transition-colors hover:bg-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <ArrowLeft size={17} weight="bold" className="transition-transform group-hover:-translate-x-0.5" />
          The issue
        </Link>
        <Link href="/" className="font-serif text-2xl leading-none text-bone">
          KOL
        </Link>
        <button
          aria-label="Your bag"
          className="flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Handbag size={18} weight="fill" />
          <span className="hidden sm:inline">Bag</span>
        </button>
      </div>
    </header>
  );
}

/* The persistent film — full-bleed hero that docks to a corner on scroll. */
function DockedFilm({
  maker,
  heroRef,
  reduce,
}: {
  maker: Maker;
  heroRef: React.RefObject<HTMLDivElement | null>;
  reduce: boolean;
}) {
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const ease = cubicBezier(0.16, 1, 0.3, 1);
  // The dock LANDS: it reaches docked size by 72% of the hero scroll (settle in
  // the last 28%) on the locked ease curve. Mobile caps smaller so it never
  // occludes the Add-to-bag corner (read via ref so scroll frames see current).
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
  const scale = useTransform(scrollYProgress, (v) => {
    const p = ease(Math.min(v / 0.72, 1));
    const target = isMobileRef.current ? 0.2 : 0.26;
    return 1 + (target - 1) * p;
  });
  const x = useTransform(scrollYProgress, [0, 0.72], [0, -20], { ease });
  const y = useTransform(scrollYProgress, [0, 0.72], [0, -20], { ease });
  const radius = useTransform(scrollYProgress, [0, 0.55], [0, 64], { ease });
  const shadow = useTransform(
    scrollYProgress,
    [0, 0.5, 0.9],
    ["0 0 0 rgba(0,0,0,0)", "0 0 0 rgba(0,0,0,0)", "0 30px 60px -20px rgba(0,0,0,0.8)"],
  );

  // When docked, the film becomes a tap-to-top control (pays off persistence).
  const [docked, setDocked] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setDocked(v > 0.88));
  const toTop = () =>
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });

  // Reduced motion: a static in-flow hero film, no docking.
  if (reduce) {
    return (
      <div className="pointer-events-none absolute inset-0 z-40">
        <div className="relative h-[100svh] w-full">
          <Image
            src={maker.image}
            alt={`${maker.name} — ${maker.discipline}, ${maker.studio}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <FilmChip maker={maker} />
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <motion.div
        style={{
          scale,
          x,
          y,
          borderRadius: radius,
          boxShadow: shadow,
          transformOrigin: "100% 100%",
        }}
        onClick={docked ? toTop : undefined}
        onKeyDown={
          docked
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toTop();
                }
              }
            : undefined
        }
        role={docked ? "button" : undefined}
        tabIndex={docked ? 0 : -1}
        aria-label={docked ? "Back to top of the world" : undefined}
        className={cn(
          "film-drift relative h-full w-full overflow-hidden",
          docked &&
            "pointer-events-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        )}
      >
        <Image
          src={maker.image}
          alt={`${maker.name} — ${maker.discipline}, ${maker.studio}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <FilmChip maker={maker} />
      </motion.div>
    </div>
  );
}

function FilmChip({ maker }: { maker: Maker }) {
  return (
    <div className="absolute left-5 top-20 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 backdrop-blur-sm sm:left-8">
      <Play size={13} weight="fill" className="text-marigold" />
      <span className="meta text-bone">
        {maker.kind === "film" ? `Now playing · ${maker.duration}` : "On film"}
      </span>
    </div>
  );
}

/* Reveal wrapper — scroll-in, reduced-motion safe. */
function Reveal({
  children,
  reduce,
  className,
}: {
  children: React.ReactNode;
  reduce: boolean;
  className?: string;
}) {
  return (
    <motion.div
      variants={reduce ? calm : rise(28, 0.8)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
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
}: {
  world: World;
  maker: Maker;
  reduce: boolean;
}) {
  return (
    <section className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32">
      <Reveal reduce={reduce}>
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <div className="flex flex-col justify-center">
            <p className="meta mb-5 text-marigold">The maker</p>
            <div className="space-y-6">
              {world.story.map((para, i) => (
                <p
                  key={i}
                  className={cn(
                    "font-serif leading-relaxed text-bone/90",
                    i === 0 ? "text-2xl sm:text-[1.7rem]" : "text-lg text-bone/75",
                  )}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-line">
            <Image
              src={world.storyImage}
              alt={`${maker.name}, ${maker.studio}`}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function ProcessSection({ world, reduce }: { world: World; reduce: boolean }) {
  return (
    <section className="mx-auto max-w-issue px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal reduce={reduce}>
        <p className="meta mb-3 text-marigold">How it&#39;s made</p>
        <h2
          className="mb-12 max-w-2xl font-display font-bold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          {world.processSectionHeader}
        </h2>
      </Reveal>
      <div
        className={cn(
          "grid gap-5 sm:gap-6",
          world.process.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3",
        )}
      >
        {world.process.map((step) => (
          <Reveal reduce={reduce} key={step.id}>
            <article className="group overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-105"
                />
                <span className="meta absolute left-4 top-4 text-bone/80">
                  {step.label}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-bold text-bone">{step.title}</h3>
                <p className="mt-2 font-ui text-sm leading-relaxed text-bone/70">
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

function ProductsSection({
  world,
  maker,
  reduce,
}: {
  world: World;
  maker: Maker;
  reduce: boolean;
}) {
  return (
    <section className="mx-auto max-w-issue px-5 pb-24 sm:px-8 sm:pb-32">
      <Reveal reduce={reduce}>
        <p className="meta mb-3 text-marigold">The work</p>
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
                    <span className="font-display text-2xl font-bold text-marigold">
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
                      className="flex items-center gap-2.5 rounded-full bg-marigold px-6 py-3 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                    >
                      View the piece
                      <ArrowUpRight size={18} weight="bold" />
                    </Link>
                  </Magnetic>
                  <button
                    aria-label={`Save ${product.name}`}
                    className="grid h-12 w-12 place-items-center rounded-full border border-bone/25 text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
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
