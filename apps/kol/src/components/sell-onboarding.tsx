"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "framer-motion";
import {
  Play,
  ArrowRight,
  X,
  VideoCamera,
  MagicWand,
  SlidersHorizontal,
  Rocket,
  Quotes,
  type Icon,
} from "@phosphor-icons/react";
import { JOURNEY_STEPS, type JourneyIcon } from "@/lib/fixtures/sell";
import { rise, stagger, calm, inView } from "@/lib/motion";
import { Magnetic } from "./magnetic";

const STEP_ICON: Record<JourneyIcon, Icon> = {
  interview: VideoCamera,
  draft: MagicWand,
  edit: SlidersHorizontal,
  publish: Rocket,
};

export function SellOnboarding() {
  const reduce = useReducedMotion();
  const item = reduce ? calm : rise(34, 1);
  const [watching, setWatching] = useState(false);

  return (
    <>
      {/* ---- Hero: the pitch to makers ---- */}
      <section
        id="top"
        className="relative flex min-h-[100svh] w-full items-end overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="film-drift absolute inset-0">
            <Image
              src="/media/clay-shape.jpg"
              alt="A maker's hands finishing a bowl on the wheel"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/25 to-transparent" />
        </div>

        <motion.div
          variants={stagger(0.15, 0.12)}
          initial="hidden"
          animate="visible"
          className="relative mx-auto w-full max-w-issue px-5 pb-16 pt-32 sm:px-8 sm:pb-24"
        >
          <motion.p variants={item} className="meta mb-6 text-marigold">
            For makers · The Maker&#39;s Issue
          </motion.p>

          <motion.h1
            variants={item}
            className="max-w-5xl font-display font-extrabold leading-[0.9] text-bone"
            style={{ fontSize: "clamp(2.75rem, 8vw, 6.75rem)" }}
          >
            Your world, built
            <br />
            from{" "}
            <span className="font-serif font-normal italic text-marigold-bright">
              your&nbsp;story.
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-7 max-w-measure font-ui text-lg leading-relaxed text-bone/85 sm:text-xl"
          >
            Talk to us for ten minutes about what you make and why. We&#39;ll turn
            it into a whole shop — on film, in your words, in colours drawn from
            your own work. You stay the author. We take the slack.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Link
                href="/sell/interview"
                className="group flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright"
              >
                Start your interview
                <ArrowRight
                  size={20}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Magnetic>
            <button
              type="button"
              onClick={() => setWatching(true)}
              className="group flex items-center gap-2.5 rounded-full border border-bone/30 px-6 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/70 hover:bg-bone/5"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-bone/10 text-bone transition-colors group-hover:bg-marigold group-hover:text-ink">
                <Play size={13} weight="fill" />
              </span>
              Watch how it works
            </button>
          </motion.div>

          <motion.p
            variants={item}
            className="mt-12 flex items-center gap-2 font-ui text-sm text-bone/60"
          >
            No design skills. No templates. No two shops alike.
          </motion.p>
        </motion.div>
      </section>

      {/* ---- The four-step journey ---- */}
      <section className="border-t border-line bg-ink">
        <div className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32">
          <motion.div
            variants={reduce ? calm : rise(28, 0.9)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="max-w-3xl"
          >
            <p className="meta mb-4 text-marigold">How a world gets made</p>
            <h2
              className="font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
            >
              Four steps. You do the first
              <br className="hidden sm:block" /> one — we do the rest.
            </h2>
          </motion.div>

          <motion.ol
            variants={stagger(0.05, 0.12)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="mt-16 space-y-4"
          >
            {JOURNEY_STEPS.map((step) => {
              const StepIcon = STEP_ICON[step.icon];
              return (
                <motion.li
                  key={step.id}
                  variants={reduce ? calm : rise(24, 0.7)}
                  className="group grid gap-6 rounded-3xl border border-line bg-ink-soft p-7 transition-colors hover:border-bone/25 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-10 sm:p-9"
                >
                  <div className="flex items-center gap-5">
                    <span className="font-mono text-sm text-marigold">
                      {step.index}
                    </span>
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-ink-raise text-marigold transition-colors group-hover:bg-marigold group-hover:text-ink">
                      <StepIcon size={26} />
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl font-bold text-bone sm:text-3xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-xl font-ui text-base leading-relaxed text-bone/70">
                      {step.body}
                    </p>
                  </div>

                  <dl className="flex shrink-0 gap-8 border-t border-line pt-5 sm:border-l sm:border-t-0 sm:pl-10 sm:pt-0">
                    <div>
                      <dt className="meta text-bone-dim">You</dt>
                      <dd className="mt-2 max-w-[9rem] font-ui text-sm leading-snug text-bone">
                        {step.makerDoes}
                      </dd>
                    </div>
                    <div>
                      <dt className="meta text-marigold">KOL</dt>
                      <dd className="mt-2 max-w-[9rem] font-ui text-sm leading-snug text-bone/80">
                        {step.kolDoes}
                      </dd>
                    </div>
                  </dl>
                </motion.li>
              );
            })}
          </motion.ol>
        </div>
      </section>

      {/* ---- Explainer film panel ---- */}
      <section className="bg-ink px-5 pb-24 sm:px-8 sm:pb-32">
        <motion.button
          type="button"
          onClick={() => setWatching(true)}
          variants={reduce ? calm : rise(28, 0.9)}
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          className="group relative mx-auto block aspect-[16/9] w-full max-w-issue overflow-hidden rounded-[2rem] ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
          aria-label="Watch the 90-second explainer film"
        >
          <div className="film-drift absolute inset-0">
            <Image
              src="/media/clay-wheel.jpg"
              alt="A maker at the wheel, from the explainer film"
              fill
              sizes="100vw"
              className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.03]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/40" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-bone/95 text-ink shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] transition-transform duration-500 ease-out-expo group-hover:scale-110">
              <Play size={30} weight="fill" className="translate-x-0.5" />
            </span>
            <div>
              <p className="font-display text-2xl font-bold text-bone sm:text-3xl">
                See it happen, start to finish
              </p>
              <p className="mt-2 font-ui text-sm text-bone/70">
                90 seconds · Lena builds Odd Clay Studio
              </p>
            </div>
          </div>
          <span className="meta absolute bottom-5 left-6 text-bone/70">
            Explainer film · stand-in still
          </span>
        </motion.button>
      </section>

      {/* ---- Easy + limitless spread ---- */}
      <section className="bg-clay">
        <div className="mx-auto grid max-w-issue gap-12 px-5 py-24 sm:px-8 sm:py-32 md:grid-cols-2 md:gap-20">
          <Reassurance
            reduce={!!reduce}
            kicker="Easy"
            title="You just talk. That's the whole job."
            body="No dashboards to learn, no blank canvas to fear, no theme to fight. If you can tell a friend why you make what you make, you can build a world here."
          />
          <Reassurance
            reduce={!!reduce}
            kicker="Limitless"
            title="Yours down to the last grain."
            body="Your colours, your clips, your voice — literally, if you record one. Nothing about your shop is borrowed from a template, because there isn't one. No two makers land in the same world."
          />
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="border-t border-line bg-ink">
        <motion.div
          variants={reduce ? calm : rise(28, 0.9)}
          initial="hidden"
          whileInView="visible"
          viewport={inView}
          className="mx-auto max-w-issue px-5 py-24 text-center sm:px-8 sm:py-32"
        >
          <p className="meta text-marigold">Ready when you are</p>
          <h2
            className="mx-auto mt-6 max-w-4xl font-display font-extrabold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(2.25rem, 6vw, 5rem)" }}
          >
            Meet your buyers before
            <br className="hidden sm:block" /> they meet the thing.
          </h2>
          <div className="mt-10 flex justify-center">
            <Magnetic>
              <Link
                href="/sell/interview"
                className="group flex items-center gap-2.5 rounded-full bg-marigold px-8 py-4 font-ui text-lg font-semibold text-ink transition-colors hover:bg-marigold-bright"
              >
                Start your interview
                <ArrowRight
                  size={21}
                  weight="bold"
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </Magnetic>
          </div>
          <p className="mt-6 font-ui text-sm text-bone/55">
            Takes about ten minutes · nothing goes live until you say so
          </p>
        </motion.div>
      </section>

      <ExplainerLightbox open={watching} onClose={() => setWatching(false)} />
    </>
  );
}

function Reassurance({
  reduce,
  kicker,
  title,
  body,
}: {
  reduce: boolean;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      variants={reduce ? calm : rise(24, 0.8)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
    >
      <p className="meta text-bone/70">{kicker}</p>
      <h3
        className="mt-5 font-display font-bold leading-[1.02] text-bone"
        style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
      >
        {title}
      </h3>
      <p className="mt-5 max-w-md font-ui text-lg leading-relaxed text-bone/85">
        {body}
      </p>
    </motion.div>
  );
}

/* The explainer "video" — Ken-Burns still stands in for the clip (video CDNs
   are blocked in this environment; the honest pattern is a poster + affordance).
   Keyboard: Escape closes, focus lands on the dialog, backdrop click closes. */
function ExplainerLightbox({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => closeRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0]!;
        const last = nodes[nodes.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.01 : 0.25 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-sm sm:p-8"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Explainer film"
        >
          <motion.div
            ref={dialogRef}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 16 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: reduce ? 0.01 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-[1.5rem] ring-1 ring-bone/20"
          >
            <div className="film-drift absolute inset-0">
              <Image
                src="/media/clay-wheel.jpg"
                alt="A maker at the wheel — explainer film stand-in"
                fill
                sizes="(max-width: 1024px) 100vw, 64rem"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-ink/30" />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
              <span className="grid h-20 w-20 animate-pulse place-items-center rounded-full bg-bone/95 text-ink">
                <Play size={30} weight="fill" className="translate-x-0.5" />
              </span>
              <p className="font-ui text-sm text-bone/85">
                The film plays here in the live product
              </p>
            </div>

            <p className="meta absolute bottom-5 left-6 text-bone/80">
              KOL · How a world gets made
            </p>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close explainer"
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-ink/70 text-bone backdrop-blur-sm transition-colors hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <X size={20} weight="bold" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
