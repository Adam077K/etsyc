"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  animate,
  type PanInfo,
} from "framer-motion";
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
import { useFilm } from "./film/film-context";
import { cornerTarget } from "./film/film-geometry";
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
  const accentText = ACCENT_TEXT[world.accent];

  // The PiP must never trap the content beneath it. Start collapsed on small
  // screens (it would cover a gallery thumbnail), and auto-collapse once the
  // trust badge — the D7 proof — scrolls into view on any width. (Track A owns
  // the FilmStage-driven PiP mount/geometry; ProductPage only drives collapse.)
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
                className="press flex items-center gap-2 rounded-full border border-bone/25 px-5 py-2.5 font-ui text-sm font-medium text-bone hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
              >
                <Cube size={18} weight="fill" className={accentText} />
                View in 3D
              </button>
              <Link
                href={`/m/${maker.id}`}
                className="press flex items-center gap-2 rounded-full border border-bone/25 px-5 py-2.5 font-ui text-sm font-medium text-bone hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
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
                    "press flex items-center gap-2.5 rounded-full px-7 py-3.5 font-ui text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
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
                  className="press group flex items-center gap-2 rounded-full border border-bone/30 px-6 py-3.5 font-ui text-base font-medium text-bone hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
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
                    "press grid h-12 w-12 place-items-center rounded-full border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
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
          className="press group flex items-center gap-2 rounded-full bg-ink-soft px-4 py-2 font-ui text-sm text-bone hover:bg-ink-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
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
          className="press flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          <Handbag size={18} weight="fill" />
          <span className="hidden sm:inline">Bag</span>
        </Link>
      </div>
    </header>
  );
}

/* Gallery — a drag-to-peek carousel: swipe the hero with momentum (velocity-aware
   snap), or step it with the thumbnail strip / arrow keys. The whole track is one
   physical object you can throw; keyboard and thumbnails drive the same motion so
   nothing is drag-only. Reduced motion drops the drag + drift and jumps instantly. */
function Gallery({
  gallery,
  active,
  onActive,
  name,
  note,
  reduce,
}: {
  gallery: string[];
  active: number;
  onActive: (i: number) => void;
  name: string;
  note?: string;
  reduce: boolean;
}) {
  const n = gallery.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);

  // Measure the viewport so drag distance / snap targets are in real pixels.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const set = () => setWidth(el.clientWidth);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the track parked on the active slide — thumbnails, arrow keys and a
  // settled drag all funnel through `active`, so this is the single source of
  // truth for where the track sits.
  useEffect(() => {
    const target = -active * width;
    if (reduce || width === 0) {
      x.set(target);
      return;
    }
    const controls = animate(x, target, {
      type: "spring",
      stiffness: 320,
      damping: 40,
    });
    return () => controls.stop();
  }, [active, width, reduce, x]);

  function settle(info: PanInfo) {
    const { offset, velocity } = info;
    const threshold = width * 0.2;
    let next = active;
    // Velocity-aware: a fast flick advances even on a short drag (momentum).
    if (offset.x < -threshold || velocity.x < -450) next = active + 1;
    else if (offset.x > threshold || velocity.x > 450) next = active - 1;
    onActive(Math.max(0, Math.min(n - 1, next)));
  }

  const multi = n > 1;

  return (
    <motion.div
      variants={reduce ? calm : rise(24, 0.8)}
      initial="hidden"
      animate="visible"
    >
      <div
        ref={viewportRef}
        tabIndex={multi ? 0 : -1}
        role={multi ? "group" : undefined}
        aria-roledescription={multi ? "carousel" : undefined}
        aria-label={
          multi
            ? `${name} — image ${active + 1} of ${n}. Use the left and right arrow keys or drag to browse.`
            : undefined
        }
        onKeyDown={
          multi
            ? (e) => {
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  onActive(Math.min(active + 1, n - 1));
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  onActive(Math.max(active - 1, 0));
                }
              }
            : undefined
        }
        className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-3xl bg-ink-soft ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        <motion.div
          className="flex h-full"
          style={{ x, width: `${n * 100}%` }}
          drag={multi && !reduce ? "x" : false}
          dragConstraints={{ left: -width * (n - 1), right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => settle(info)}
        >
          {gallery.map((src, i) => (
            <div
              key={src}
              className="relative h-full shrink-0"
              style={{ width: `${100 / n}%` }}
            >
              <Image
                src={src}
                alt={i === 0 ? name : `${name} — view ${i + 1}`}
                fill
                priority={i === 0}
                draggable={false}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className={cn(
                  "pointer-events-none select-none object-cover",
                  // Drift only the active slide. Not gated on `reduce` in JSX —
                  // that would hydration-mismatch (SSR renders reduce=false); the
                  // globals.css reduced-motion media query disables the animation.
                  i === active && "film-drift",
                )}
              />
            </div>
          ))}
        </motion.div>

        {note && (
          // Deeper ground: over near-white product photography backdrop-blur
          // bleeds the bright image through a light pill, so the note needs a
          // solid-enough ink ground to hold AA against text-bone.
          <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-ink/85 px-3 py-1 backdrop-blur-sm">
            <span className="meta text-bone">{note}</span>
          </span>
        )}
        {multi && (
          <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-ink/85 px-2.5 py-1 font-mono text-[0.65rem] tabular-nums text-bone backdrop-blur-sm">
            {active + 1} / {n}
          </span>
        )}
      </div>
      {/* Screen-reader announcement of the active slide (the visible counter is
          aria-hidden decoration; this polite live region is what's announced). */}
      {multi && (
        <span aria-live="polite" aria-atomic="true" className="sr-only">
          Image {active + 1} of {n}
        </span>
      )}
      {multi && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
          {gallery.map((src, i) => (
            <button
              key={src}
              onClick={() => onActive(i)}
              aria-label={`View image ${i + 1} of ${name}`}
              aria-current={i === active}
              className={cn(
                "press relative aspect-square overflow-hidden rounded-2xl ring-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
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

/* The leading film, shrunk to a persistent corner PiP that keeps "playing" the
   RIGHT clip for this product (journey step 5). The film itself is the app-shell
   FilmStage — it arrives already playing from the maker's world (never re-mounted
   from black) and docks into this corner; this component drives its geometry and
   renders the contextual chrome. The label slides in as the clip swaps (the
   mocked contextual narration). Collapsible so it never traps the content
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
  const { present, driveTo, setInteraction } = useFilm();
  // The card footprint — matches the stage's uniform-scaled corner film so the
  // chrome overlays it exactly. Recomputed on mount + resize.
  const [card, setCard] = useState({ width: 200, margin: 24, ratio: 16 / 10 });

  // Present the product's contextual clip. videoSrc falls back to the maker's
  // clip so the SAME video node keeps playing across the world→product seam.
  // Runs once per product; `present` is stable.
  useEffect(() => {
    present({
      makerId: maker.id,
      videoSrc: product.filmSrc ?? maker.filmSrc,
      poster: maker.image,
      alt: `${maker.name} — ${maker.studio}`,
      clipLabel: product.clipLabel,
      chip: "now-playing",
      stageChip: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maker.id, product.id]);

  // Drive the corner geometry on open/collapse, and keep it on resize. Collapse
  // fades the film out (presence remains — the frame never vanishes abruptly).
  useEffect(() => {
    const apply = () => {
      const mobile = window.matchMedia("(max-width: 639px)").matches;
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = mobile ? 148 : 208;
      const margin = mobile ? 16 : 24;
      setCard({ width, margin, ratio: vw / vh });
      if (open) {
        driveTo(cornerTarget(vw, vh, { width, margin, radius: 18 }), {
          reduce: prefersReduced,
          duration: 0.55,
        });
        setInteraction({
          onActivate: () => router.push(`/m/${maker.id}`),
          label: `Return to ${maker.studio}'s world`,
        });
      } else {
        driveTo({ opacity: 0 }, { reduce: prefersReduced, duration: 0.3 });
        setInteraction(null);
      }
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      setInteraction(null);
    };
  }, [open, driveTo, setInteraction, router, maker.id, maker.studio]);

  const liveDot = (
    <span
      className="h-1.5 w-1.5 rounded-full bg-marigold animate-float"
    />
  );

  return (
    <>
      {/* Chrome overlaying the stage's corner film (pointer-events fall through
          to the film for tap-to-return; only the buttons capture clicks). */}
      {open && (
        <div
          className="pointer-events-none fixed z-[41]"
          style={{
            right: card.margin,
            bottom: card.margin,
            width: card.width,
            aspectRatio: String(card.ratio),
          }}
        >
          <div className="relative h-full w-full">
            {/* Contextual label — slides in as the clip swaps (step 5). */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.clipLabel}
                initial={reduce ? false : { opacity: 0, x: 18 }}
                animate={reduce ? undefined : { opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -18 }}
                transition={{ duration: 0.4, ease: easeOut }}
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-2.5 pb-2.5 pt-6"
              >
                <p className="flex items-center gap-1.5">
                  {liveDot}
                  <span className="meta text-[0.58rem] text-bone">Now playing</span>
                </p>
                <p className="mt-1 font-ui text-[0.72rem] font-semibold leading-tight text-bone">
                  {product.clipLabel}
                </p>
                <p className="meta mt-1 text-[0.55rem] text-bone-dim">
                  {maker.studio} · {product.clipDuration}
                </p>
              </motion.div>
            </AnimatePresence>
            <span className="pointer-events-none absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-bone/90 text-ink">
              <Play size={11} weight="fill" />
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Minimise the film"
              className="group/min pointer-events-auto absolute right-0 top-0 grid h-11 w-11 place-items-center focus-visible:outline-none"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink/75 text-bone backdrop-blur-sm transition-colors group-hover/min:bg-ink group-focus-visible/min:ring-2 group-focus-visible/min:ring-marigold">
                <Minus size={13} weight="bold" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsed cue — the film fades to a pill but keeps playing underneath.
          On phones the labelled pill is wide enough that, parked bottom-right, it
          clips the tail of the (left-aligned) product H1; so <sm it shrinks to a
          compact round play control that clears heading tails, and the labelled
          pill returns at sm+ (desktop geometry unchanged). The accessible name is
          identical at every width — the "Now playing" label lives in aria-label. */}
      {!open && (
        <div className="fixed bottom-4 right-4 z-[41] sm:bottom-6 sm:right-6">
          <motion.button
            type="button"
            onClick={() => onOpenChange(true)}
            aria-label={`Expand the film — now playing ${product.clipLabel}`}
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="flex items-center gap-2 rounded-full bg-ink-soft p-3.5 ring-1 ring-line shadow-[0_20px_40px_-16px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold sm:py-2 sm:pl-3 sm:pr-2.5"
          >
            <Play size={16} weight="fill" className="text-marigold sm:hidden" />
            <span className="hidden items-center gap-2 sm:flex">
              {liveDot}
              <span className="meta text-[0.6rem] text-bone">Now playing</span>
              <CaretUp size={13} weight="bold" className="text-bone-dim" />
            </span>
          </motion.button>
        </div>
      )}
    </>
  );
}
