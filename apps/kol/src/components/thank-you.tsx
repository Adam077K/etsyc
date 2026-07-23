"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Play,
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
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Thank-you — buyer journey step 8. The personal thank-you moment: a Ken-Burns
 * stand-in for the maker's own thank-you clip, carrying her voice in copy, then
 * the order summary and the "saved to your account" affordance. Warm and human
 * without tipping into saccharine — the makers speak, the receipt is quiet.
 */
export function ThankYou() {
  const reduce = useReducedMotion();
  const lines = resolveBag();
  const totals = bagTotals(lines);
  const makers = Array.from(new Map(lines.map((l) => [l.maker.id, l.maker])).values());
  const primary = makers[0];
  const others = makers.slice(1);
  const primaryNote = primary ? thankYouFor(primary.id) : undefined;

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-issue items-center justify-center px-5 py-4 sm:px-8">
          <Link href="/" className="font-serif text-2xl leading-none text-bone">
            KOL
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        {/* Confirmation line. */}
        <motion.div
          variants={reduce ? calm : rise(24, 0.7)}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <p className="meta mb-4 flex items-center justify-center gap-2 text-marigold">
            <Check size={15} weight="bold" />
            Order {MOCK_ORDER.number}
          </p>
          <h1
            className="mx-auto max-w-2xl font-display font-extrabold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(2.25rem, 5.5vw, 4rem)" }}
          >
            It&rsquo;s being made for you.
          </h1>
          <p className="mx-auto mt-5 max-w-md font-serif text-lg italic leading-snug text-bone/75">
            Confirmation is on its way to {MOCK_ORDER.email}. Now the best part —
            a word from the bench.
          </p>
        </motion.div>

        {/* The personal thank-you video moment. */}
        {primary && primaryNote && (
          <motion.figure
            variants={reduce ? calm : rise(28, 0.9)}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="relative mt-12 overflow-hidden rounded-[2rem] ring-1 ring-line"
          >
            <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
              <Image
                src={primary.image}
                alt={`${primary.name}, ${primary.studio}`}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className={cn("object-cover", reduce ? "" : "film-drift")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />

              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 backdrop-blur-sm sm:left-7 sm:top-7">
                <Play size={13} weight="fill" className="text-marigold" />
                <span className="meta text-bone">
                  Personal thank-you · {primaryNote.clip}
                </span>
              </div>

              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
                <Quotes size={24} weight="fill" aria-hidden className="mb-3 text-marigold/70" />
                <blockquote
                  className="max-w-xl font-serif leading-[1.2] text-bone"
                  style={{ fontSize: "clamp(1.4rem, 3.2vw, 2.35rem)" }}
                >
                  &ldquo;{primaryNote.line}&rdquo;
                </blockquote>
                <p className="mt-5 font-ui text-sm text-bone/80">
                  <span className="font-semibold text-bone">{primary.name}</span>
                  {" · "}
                  {primary.studio}
                </p>
              </figcaption>
            </div>
          </motion.figure>
        )}

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
              <span className="font-display text-2xl font-bold text-marigold">
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
