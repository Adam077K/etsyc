"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import {
  Check,
  CheckCircle,
  Package,
  ArrowRight,
  Quotes,
} from "@phosphor-icons/react";
import {
  resolveBag,
  bagTotals,
  gbp,
  MOCK_ORDER,
  thankYouFor,
} from "@/lib/fixtures/commerce";
import type { Maker } from "@/lib/fixtures/makers";
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { useFilm } from "./film/film-context";
import { HERO_TARGET, applyDockFrame, dockClip } from "./film/film-geometry";

/**
 * Thank-you — buyer journey step 8, and the payoff of the continuous film. The
 * maker's personal thank-you clip is the SAME persistent film that carried the
 * buyer from the feed: it grows from the checkout corner into a full-bleed
 * payoff (never re-mounted from black), carries her words over it, then docks to
 * a quiet corner as the receipt scrolls up. Warm and human without tipping into
 * saccharine — the maker speaks, the receipt stays quiet.
 */
export function ThankYou() {
  const reduce = useReducedMotion();
  const lines = resolveBag();
  const totals = bagTotals(lines);
  const makers = Array.from(new Map(lines.map((l) => [l.maker.id, l.maker])).values());
  const primary = makers[0];
  const others = makers.slice(1);
  const primaryNote = primary ? thankYouFor(primary.id) : undefined;
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative min-h-screen bg-ink">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-issue items-center justify-center px-5 py-4 sm:px-8">
          <Link href="/" className="font-serif text-2xl leading-none text-bone">
            KOL
          </Link>
        </div>
      </header>

      {/* The payoff — the maker's thank-you film, full-bleed, her words over it. */}
      {primary && primaryNote && (
        <ThankYouFilm primary={primary} clip={primaryNote.clip} filmSrc={primaryNote.filmSrc} heroRef={heroRef} />
      )}
      <section
        ref={heroRef}
        className="relative z-[45] flex h-[92svh] items-end justify-center overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/45" />
        {primary && primaryNote ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.9, ease: easeOut, delay: 0.2 }}
            className="relative mx-auto w-full max-w-3xl px-5 pb-14 text-center sm:px-8 sm:pb-20"
          >
            <p className="meta mb-4 flex items-center justify-center gap-2 text-bone-dim">
              <Check size={15} weight="bold" />
              Order {MOCK_ORDER.number}
            </p>
            <h1
              className="mx-auto max-w-2xl font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4rem)" }}
            >
              It&rsquo;s being made for you.
            </h1>
            <figure className="mx-auto mt-8 max-w-2xl">
              {/* The Quotes glyph is the quotation mark — no doubled entity quotes. */}
              <Quotes size={24} weight="fill" aria-hidden className="mx-auto mb-3 text-marigold/70" />
              <blockquote
                className="font-serif leading-[1.2] text-bone"
                style={{ fontSize: "clamp(1.3rem, 3vw, 2.2rem)" }}
              >
                {primaryNote.line}
              </blockquote>
              <figcaption className="mt-5 font-ui text-sm text-bone/80">
                <span className="font-semibold text-bone">{primary.name}</span>
                {" · "}
                {primary.studio}
              </figcaption>
            </figure>
            <p className="mx-auto mt-6 max-w-md font-ui text-sm text-bone/60">
              Confirmation is on its way to {MOCK_ORDER.email}.
            </p>
          </motion.div>
        ) : (
          <div className="relative mx-auto w-full max-w-2xl px-5 pb-20 text-center">
            <p className="meta mb-4 flex items-center justify-center gap-2 text-bone-dim">
              <Check size={15} weight="bold" />
              Order {MOCK_ORDER.number}
            </p>
            <h1
              className="font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2.25rem, 5.5vw, 4rem)" }}
            >
              It&rsquo;s being made for you.
            </h1>
          </div>
        )}
      </section>

      <main className="relative z-10 mx-auto max-w-4xl bg-ink px-5 pb-16 pt-12 sm:px-8 sm:pb-24">
        {/* A shorter note from any other maker in the order. */}
        {others.map((m) => {
          const note = thankYouFor(m.id);
          if (!note) return null;
          return (
            <Reveal reduce={!!reduce} key={m.id}>
              <figure className="mt-5 flex items-center gap-5 rounded-3xl border border-line bg-ink-soft p-6 sm:p-7">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
                  <Image src={m.image} alt={m.name} fill sizes="64px" className="object-cover" />
                </span>
                <div>
                  <blockquote className="font-serif text-lg italic leading-snug text-bone/90">
                    &ldquo;{note.line}&rdquo;
                  </blockquote>
                  <figcaption className="mt-2 font-ui text-sm text-bone-dim">
                    {m.name} · {m.studio}
                  </figcaption>
                </div>
              </figure>
            </Reveal>
          );
        })}

        {/* Order summary. */}
        <Reveal reduce={!!reduce}>
          <section
            aria-label="Order summary"
            className="mt-12 overflow-hidden rounded-3xl border border-line bg-ink-soft"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-6 py-4">
              <p className="meta text-bone-dim">Order summary</p>
              <p className="meta text-bone-dim">{MOCK_ORDER.date}</p>
            </div>
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={line.product.id} className="flex gap-4 px-6 py-5">
                  <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                    <Image
                      src={line.product.gallery[0]!}
                      alt={line.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </span>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <span className="font-ui text-sm font-semibold text-bone">
                        {line.product.name}
                      </span>
                      <span className="font-ui text-sm font-semibold text-bone">
                        {gbp(line.lineTotal)}
                      </span>
                    </div>
                    <p className="mt-1 font-ui text-xs text-bone-dim">
                      Made by {line.maker.name.split(" ").at(0) ?? line.maker.name} ·{" "}
                      {line.maker.place.split(" → ").at(-1) ?? line.maker.place}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between border-t border-line px-6 py-4">
              <span className="font-ui text-base font-semibold text-bone">Total paid</span>
              <span className="font-display text-2xl font-bold text-bone">
                {gbp(totals.total)}
              </span>
            </div>
            <p className="flex items-center gap-2 border-t border-line px-6 py-4 font-ui text-sm text-bone-dim">
              <Package size={17} weight="fill" className="text-sky" />
              {MOCK_ORDER.deliveryEstimate}. We&rsquo;ll email you the moment each maker ships.
            </p>
          </section>
        </Reveal>

        {/* Saved to account. */}
        <Reveal reduce={!!reduce}>
          <div className="mt-5 flex flex-col items-start gap-4 rounded-3xl border border-olive/40 bg-olive/10 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-center gap-3">
              <CheckCircle size={26} weight="fill" className="shrink-0 text-olive" />
              <div>
                <p className="font-ui text-sm font-semibold text-bone">
                  Saved to your account
                </p>
                <p className="mt-0.5 font-ui text-sm text-bone-dim">
                  Order {MOCK_ORDER.number} is in your history under {MOCK_ORDER.email}.
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2 rounded-full bg-bone px-6 py-3 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Back to the feed
              <ArrowRight size={17} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </main>
    </div>
  );
}

/**
 * ThankYouFilm — drives the persistent FilmStage for the payoff. The film grows
 * from wherever it arrived (the checkout corner) into a full-bleed thank-you
 * hero, then docks to the corner on scroll so it stays present through the
 * receipt. Renders nothing itself — the film is the app-shell stage.
 */
function ThankYouFilm({
  primary,
  clip,
  filmSrc,
  heroRef,
}: {
  primary: Maker;
  clip: string;
  filmSrc?: string;
  heroRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { present, driveTo, snapTo, m } = useFilm();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const isMobileRef = useRef(false);
  const enteredRef = useRef(false);

  // Runs once per maker; the film controls are stable.
  useEffect(() => {
    present({
      makerId: primary.id,
      videoSrc: filmSrc ?? primary.filmSrc,
      poster: primary.image,
      alt: `${primary.name}, ${primary.studio}`,
      clipLabel: `Personal thank-you · ${clip}`,
      chip: "personal",
    });
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    isMobileRef.current = window.matchMedia("(max-width: 767px)").matches;
    // Grow from the arriving corner into the full-bleed payoff.
    snapTo({ originX: 100, originY: 100 });
    driveTo({ ...HERO_TARGET }, { reduce: prefersReduced, duration: 0.8 });
    const t = setTimeout(() => (enteredRef.current = true), prefersReduced ? 0 : 820);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary.id]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || !enteredRef.current) return;
    // Dock to the corner as the receipt scrolls up — shared settle with the
    // world; clip crops it to a landscape card on portrait phones.
    applyDockFrame(
      m,
      v,
      isMobileRef.current ? 0.22 : 0.28,
      dockClip(window.innerWidth, window.innerHeight),
    );
  });

  return null;
}

function Reveal({
  children,
  reduce,
}: {
  children: React.ReactNode;
  reduce: boolean;
}) {
  return (
    <motion.div
      variants={reduce ? calm : rise(24, 0.8)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      transition={{ ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
