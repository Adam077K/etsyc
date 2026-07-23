"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Handbag,
  Play,
  Check,
  Cube,
  Ruler,
  ArrowRight,
  MapPin,
  Heart,
  ChatCircle,
  Minus,
  CaretUp,
} from "@phosphor-icons/react";
import type { Maker, Ground } from "@/lib/fixtures/makers";
import type { MakerWorld as World } from "@/lib/fixtures/worlds";
import type { ProductDetail } from "@/lib/fixtures/commerce";
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { TrustBadge } from "./trust-badge";
import { ReviewStory } from "./review-story";
import { cn } from "@/lib/utils";

// AA-safe accent text/icon tints (small meta kickers need ≥4.5:1 on ink).
const ACCENT_TEXT: Record<Ground, string> = {
  clay: "text-clay-bright",
  sky: "text-sky-bright",
  plum: "text-bone-dim",
  olive: "text-bone-dim",
  bone: "text-bone",
  ink: "text-bone",
};

/**
 * product page (/m/[slug]/p/[product]) — buyer journey steps 5-7. Going deeper
 * shrinks the leading film to a persistent corner PiP that keeps "playing" the
 * RIGHT clip for this product (contextual narration, mocked via the clip label).
 * The page itself is KOL chrome carrying the maker's accent + voice: human-scale
 * imagery, description in her words, the concept-locked trust badge, structured
 * "exactly what to expect" specs, and story-led reviews (no star clutter).
 */
export function ProductPage({
  maker,
  world,
  product,
}: {
  maker: Maker;
  world: World;
  product: ProductDetail;
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [show3d, setShow3d] = useState(false);
  const [pipOpen, setPipOpen] = useState(true);
  const trustRef = useRef<HTMLDivElement>(null);
  const hero = product.gallery[active] ?? product.gallery[0]!;
  const accentText = ACCENT_TEXT[world.accent];

  // The PiP must never trap the content beneath it. Start collapsed on small
  // screens (it would cover a gallery thumbnail), and auto-collapse once the
  // trust badge — the D7 proof — scrolls into view on any width.
  useEffect(() => {
    // Defer the mobile check a frame so it isn't a synchronous setState.
    const raf = requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 639px)").matches) setPipOpen(false);
    });
    const el = trustRef.current;
    let io: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.intersectionRatio >= 0.4) setPipOpen(false);
        },
        { threshold: [0.4] },
      );
      io.observe(el);
    }
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-ink">
      <ProductChrome maker={maker} />
      <ContextualFilm
        maker={maker}
        product={product}
        reduce={!!reduce}
        open={pipOpen}
        onOpenChange={setPipOpen}
      />

      <main className="mx-auto max-w-issue px-5 pb-24 pt-24 sm:px-8 sm:pt-28">
        {/* Where you are — back into the maker's world. */}
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 font-ui text-sm">
          <Link
            href={`/m/${maker.id}`}
            className="text-bone-dim transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            {maker.studio}
          </Link>
          <span aria-hidden className="text-bone/30">/</span>
          <span className="text-bone">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <Gallery
            gallery={product.gallery}
            active={active}
            onActive={setActive}
            hero={hero}
            name={product.name}
            note={product.note}
            reduce={!!reduce}
          />

          {/* Details */}
          <motion.div
            variants={reduce ? calm : rise(24, 0.8)}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
          >
            <p className={cn("meta mb-4", accentText)}>{maker.discipline}</p>
            <h1
              className="font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)" }}
            >
              {product.name}
            </h1>

            <div className="mt-5 flex items-baseline gap-4">
              <span className="font-display text-3xl font-bold text-marigold">
                {product.price}
              </span>
              <span className="font-ui text-sm text-bone-dim">
                Made to order · free UK shipping
              </span>
            </div>

            <div className="mt-7 space-y-4">
              {product.description.map((para, i) => (
                <p
                  key={i}
                  className={cn(
                    "font-serif leading-relaxed text-bone/90",
                    i === 0 ? "text-xl sm:text-2xl" : "text-lg text-bone/75",
                  )}
                >
                  {para}
                </p>
              ))}
            </div>

            {/* 3D + Ask the maker — deeper affordances (mocked). */}
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                onClick={() => setShow3d((v) => !v)}
                aria-expanded={show3d}
                className="flex items-center gap-2 rounded-full border border-bone/25 px-5 py-2.5 font-ui text-sm font-medium text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <Cube size={18} weight="fill" className={accentText} />
                View in 3D
              </button>
              <Link
                href={`/m/${maker.id}`}
                className="flex items-center gap-2 rounded-full border border-bone/25 px-5 py-2.5 font-ui text-sm font-medium text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <ChatCircle size={18} weight="fill" className={accentText} />
                Ask {maker.name.split(" ").at(0) ?? maker.name}
              </Link>
            </div>
            {show3d && (
              <div className="mt-4 overflow-hidden rounded-3xl border border-line bg-ink-soft">
                <div className="relative grid aspect-[16/10] place-items-center overflow-hidden">
                  <Image
                    src={product.gallery[0]!}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover opacity-30 blur-[1px]"
                  />
                  <div className="absolute inset-6 rounded-2xl border border-dashed border-bone/25" />
                  <div className="relative flex flex-col items-center gap-3 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-ink/70 backdrop-blur-sm">
                      <Cube size={26} weight="light" className={accentText} />
                    </span>
                    <p className="font-ui text-sm font-semibold text-bone">
                      3D preview coming soon
                    </p>
                    <p className="max-w-xs px-6 font-ui text-xs leading-relaxed text-bone-dim">
                      Makers upload a rotatable model per piece — you&rsquo;ll turn
                      it in the light before you buy.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Buy */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic strength={0.18}>
                <button
                  onClick={() => setAdded(true)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-full px-7 py-3.5 font-ui text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                    added
                      ? "bg-olive text-bone focus-visible:ring-olive"
                      : "bg-marigold text-ink hover:bg-marigold-bright focus-visible:ring-marigold-bright",
                  )}
                >
                  {added ? (
                    <>
                      <Check size={18} weight="bold" />
                      Added to your bag
                    </>
                  ) : (
                    <>
                      <Handbag size={18} weight="fill" />
                      Add to bag
                    </>
                  )}
                </button>
              </Magnetic>
              {added ? (
                <Link
                  href="/checkout"
                  className="group flex items-center gap-2 rounded-full border border-bone/30 px-6 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  Go to checkout
                  <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
                </Link>
              ) : (
                <button
                  onClick={() => setSaved((v) => !v)}
                  aria-pressed={saved}
                  aria-label={saved ? `Saved ${product.name}` : `Save ${product.name}`}
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                    saved
                      ? "border-marigold/60 bg-marigold/10 text-marigold"
                      : "border-bone/25 text-bone hover:border-bone/60 hover:bg-bone/5",
                  )}
                >
                  <Heart size={20} weight={saved ? "fill" : "regular"} />
                </button>
              )}
            </div>
            <p className="mt-4 flex items-center gap-2 font-ui text-sm text-bone-dim">
              <MapPin size={15} className="shrink-0" />
              Made by {maker.name} in {maker.place.split(" → ").at(-1) ?? maker.place}
            </p>

            {/* Trust — concept-locked. */}
            <div ref={trustRef} className="mt-8">
              <TrustBadge maker={maker} />
            </div>

            {/* Exactly what to expect (D16-4). */}
            <section aria-labelledby="specs-heading" className="mt-8">
              <h2
                id="specs-heading"
                className="mb-4 flex items-center gap-2 font-ui text-sm font-semibold text-bone"
              >
                <Ruler size={17} weight="fill" className={accentText} />
                Exactly what to expect
              </h2>
              <dl className="overflow-hidden rounded-3xl border border-line">
                {product.specs.map((spec, i) => (
                  <div
                    key={spec.label}
                    className={cn(
                      "grid grid-cols-[9rem_1fr] gap-4 px-6 py-3.5 sm:grid-cols-[11rem_1fr]",
                      i % 2 === 0 ? "bg-ink-soft" : "bg-ink",
                    )}
                  >
                    <dt className="font-ui text-sm text-bone-dim">{spec.label}</dt>
                    <dd className="font-ui text-sm text-bone">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </motion.div>
        </div>

        {/* Reviews — stories, no stars. */}
        <section aria-labelledby="reviews-heading" className="mt-24 sm:mt-32">
          <motion.div
            variants={reduce ? calm : rise(24, 0.8)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
          >
            <p className={cn("meta mb-3", accentText)}>In their words</p>
            <h2
              id="reviews-heading"
              className="mb-10 max-w-2xl font-display font-bold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              What people who own it say.
            </h2>
          </motion.div>
          {product.reviews.length > 0 ? (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
              {product.reviews.map((review) => (
                <motion.div
                  key={review.id}
                  variants={reduce ? calm : rise(24, 0.8)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={inView}
                >
                  <ReviewStory review={review} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="rounded-3xl border border-line bg-ink-soft px-8 py-12 text-center font-serif text-xl italic text-bone/70">
              No stories yet — you could be the first to live with this piece.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}

/* KOL chrome for the product surface — back to the world, wordmark, bag. */
function ProductChrome({ maker }: { maker: Maker }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-issue items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link
          href={`/m/${maker.id}`}
          className="group flex items-center gap-2 rounded-full bg-ink-soft px-4 py-2 font-ui text-sm text-bone transition-colors hover:bg-ink-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <ArrowLeft size={17} weight="bold" className="transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">Back to {maker.studio}</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <Link href="/" className="font-serif text-2xl leading-none text-bone">
          KOL
        </Link>
        <Link
          href="/checkout"
          aria-label="Your bag"
          className="flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Handbag size={18} weight="fill" />
          <span className="hidden sm:inline">Bag</span>
        </Link>
      </div>
    </header>
  );
}

/* Gallery — human-scale main image with a thumbnail strip. */
function Gallery({
  gallery,
  active,
  onActive,
  hero,
  name,
  note,
  reduce,
}: {
  gallery: string[];
  active: number;
  onActive: (i: number) => void;
  hero: string;
  name: string;
  note?: string;
  reduce: boolean;
}) {
  return (
    <motion.div
      variants={reduce ? calm : rise(24, 0.8)}
      initial="hidden"
      animate="visible"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line">
        <Image
          key={hero}
          src={hero}
          alt={name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          className={cn("object-cover", reduce ? "" : "film-drift")}
        />
        {note && (
          <span className="absolute left-4 top-4 rounded-full bg-ink/72 px-3 py-1 backdrop-blur-sm">
            <span className="meta text-bone">{note}</span>
          </span>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          {gallery.map((src, i) => (
            <button
              key={src}
              onClick={() => onActive(i)}
              aria-label={`View image ${i + 1} of ${name}`}
              aria-current={i === active}
              className={cn(
                "relative aspect-square overflow-hidden rounded-2xl ring-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
                i === active
                  ? "ring-2 ring-marigold"
                  : "ring-line opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(max-width: 1024px) 33vw, 18vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* The leading film, shrunk to a persistent corner PiP playing the RIGHT clip
   for this product (journey step 5). Collapsible so it never traps the content
   beneath it; tap the frame to return to the maker's world. */
function ContextualFilm({
  maker,
  product,
  reduce,
  open,
  onOpenChange,
}: {
  maker: Maker;
  product: ProductDetail;
  reduce: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();

  const liveDot = (
    <span
      className={cn("h-1.5 w-1.5 rounded-full bg-marigold", reduce ? "" : "animate-float")}
    />
  );

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
      <AnimatePresence mode="wait" initial={false}>
        {open ? (
          <motion.div
            key="expanded"
            initial={reduce ? false : { opacity: 0, scale: 0.7, y: 16 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="w-32 overflow-hidden rounded-2xl bg-ink-soft ring-1 ring-line shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] sm:w-44"
          >
            <button
              type="button"
              onClick={() => router.push(`/m/${maker.id}`)}
              aria-label={`Now playing: ${product.clipLabel}. Return to ${maker.studio}'s world.`}
              className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                <Image
                  src={maker.image}
                  alt=""
                  fill
                  sizes="176px"
                  className={cn(
                    "object-cover transition-transform duration-700 group-hover:scale-105",
                    reduce ? "" : "film-drift",
                  )}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-transparent to-ink/20" />
                <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-ink/75 px-2 py-1 backdrop-blur-sm">
                  {liveDot}
                  <span className="meta text-[0.6rem] text-bone">Now playing</span>
                </div>
                <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-bone/90 text-ink">
                  <Play size={11} weight="fill" />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="font-ui text-[0.72rem] font-semibold leading-tight text-bone">
                    {product.clipLabel}
                  </p>
                  <p className="meta mt-1 text-[0.6rem] text-bone-dim">
                    {maker.studio} · {product.clipDuration}
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Minimise the film"
              className="group/min absolute right-0 top-0 grid h-11 w-11 place-items-center focus-visible:outline-none"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink/75 text-bone backdrop-blur-sm transition-colors group-hover/min:bg-ink group-focus-visible/min:ring-2 group-focus-visible/min:ring-marigold">
                <Minus size={13} weight="bold" />
              </span>
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            type="button"
            onClick={() => onOpenChange(true)}
            aria-label={`Expand the film — now playing ${product.clipLabel}`}
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="flex items-center gap-2 rounded-full bg-ink-soft py-2 pl-3 pr-2.5 ring-1 ring-line shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
          >
            {liveDot}
            <span className="meta text-[0.6rem] text-bone">Now playing</span>
            <CaretUp size={13} weight="bold" className="text-bone-dim" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
