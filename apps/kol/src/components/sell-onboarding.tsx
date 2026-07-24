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
  ArrowDown,
  X,
  Eye,
  MapPin,
  VideoCamera,
  MagicWand,
  SlidersHorizontal,
  Rocket,
  type Icon,
} from "@phosphor-icons/react";
import { JOURNEY_STEPS, type JourneyIcon } from "@/lib/fixtures/sell";
import { COVER_MAKER } from "@/lib/fixtures/makers";
import { CRAFT_ICON } from "@/lib/icons";
import { rise, stagger, calm, inView } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { MakerFilm } from "./maker-film";

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
      {/* ---- Hero: THE MIRROR — show the maker what a buyer sees. The argument
              sits left; an honest miniature of her page in the issue (the real
              buyer-surface film primitive, real fixture, labelled demo) is the
              evidence on the right. Shown, not told. ---- */}
      <section
        id="top"
        className="relative flex min-h-[100svh] w-full items-center overflow-hidden"
      >
        {/* Cinematic ground, dialled well down so the cover card is the focal
            point — this is the same clay-shape still, now atmosphere not subject. */}
        <div className="absolute inset-0">
          <div className="film-drift absolute inset-0">
            <Image
              src="/media/clay-shape.jpg"
              alt=""
              aria-hidden
              fill
              priority
              sizes="100vw"
              className="object-cover object-center opacity-40"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-ink/40" />
        </div>

        <div className="relative mx-auto grid w-full max-w-issue items-center gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24">
          {/* The argument */}
          <motion.div
            variants={stagger(0.13, 0.12)}
            initial="hidden"
            animate="visible"
          >
            <motion.p variants={item} className="meta mb-6 text-bone-dim">
              For makers · The Maker&#39;s Issue
            </motion.p>

            <motion.h1
              variants={item}
              className="font-display font-extrabold leading-[0.9] text-bone"
              style={{ fontSize: "clamp(2.75rem, 7vw, 6rem)" }}
            >
              You&#39;re the
              <br />
              <span className="font-serif font-normal italic text-marigold-bright">
                cover&nbsp;story.
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-7 max-w-measure font-ui text-lg leading-relaxed text-bone/85 sm:text-xl"
            >
              On KOL a buyer meets the maker before the thing. This is your page in
              the issue — on film, in your words, in colours pulled from your own
              work. Talk to us for ten minutes; we build the rest.
            </motion.p>

            <motion.div
              variants={item}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Magnetic>
                <Link
                  href="/sell/interview"
                  className="press group flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink hover:bg-marigold-bright focus-visible:outline-none"
                >
                  Put yourself on film
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
                className="press group flex items-center gap-2.5 rounded-full border border-bone/30 px-6 py-3.5 font-ui text-base font-medium text-bone hover:border-bone/70 hover:bg-bone/5 focus-visible:outline-none"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-bone/10 text-bone transition-colors group-hover:bg-marigold group-hover:text-ink">
                  <Play size={13} weight="fill" />
                </span>
                Watch how it works
              </button>
            </motion.div>

            <motion.p
              variants={item}
              className="mt-8 font-ui text-sm text-bone/60"
            >
              On film or by voice · your story, your words.
            </motion.p>
          </motion.div>

          {/* The evidence — an honest miniature of her page in the buyer's issue. */}
          <motion.div
            variants={reduce ? calm : rise(40, 1)}
            initial="hidden"
            animate="visible"
            transition={{ delay: reduce ? 0 : 0.35 }}
            className="mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto"
          >
            <CoverEvidence reduce={!!reduce} />
          </motion.div>
        </div>

        {/* Scroll cue to the journey. */}
        <a
          href="#how"
          aria-label="See how a world gets made"
          className="press absolute bottom-6 left-1/2 hidden -translate-x-1/2 rounded-full p-1 text-bone/50 hover:text-bone focus-visible:outline-none md:block"
        >
          <ArrowDown size={22} aria-hidden className="animate-float" />
        </a>
      </section>

      {/* ---- How a world gets made — the maker's own part leads, then the work
              hands to KOL. Not four identical cards: one prominent "your part"
              and a receding spine of "then we take it from here", each rung
              anchored to the piece of HER world it assembles. ---- */}
      <section id="how" className="border-t border-line bg-ink scroll-mt-24">
        <div className="mx-auto max-w-issue px-5 py-24 sm:px-8 sm:py-32">
          <motion.div
            variants={reduce ? calm : rise(28, 0.9)}
            initial="hidden"
            whileInView="visible"
            viewport={inView}
            className="max-w-3xl"
          >
            <p className="meta mb-4 text-bone-dim">How your world gets made</p>
            <h2
              className="font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2rem, 5.5vw, 4rem)" }}
            >
              You do one thing.
              <br className="hidden sm:block" /> We assemble the rest.
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            {/* Step 01 — the maker's part, given full weight. */}
            <YourPart reduce={!!reduce} step={JOURNEY_STEPS[0]!} />

            {/* Steps 02–04 — the work handed to KOL, on a quiet spine. */}
            <motion.ol
              variants={stagger(0.06, 0.12)}
              initial="hidden"
              whileInView="visible"
              viewport={inView}
              className="relative"
            >
              <p className="meta mb-6 text-bone-dim">Then, from what you said…</p>
              {JOURNEY_STEPS.slice(1).map((step, i, arr) => {
                const StepIcon = STEP_ICON[step.icon];
                const last = i === arr.length - 1;
                return (
                  <motion.li
                    key={step.id}
                    variants={reduce ? calm : rise(20, 0.6)}
                    className="group relative grid grid-cols-[auto_1fr] gap-5 pb-8 last:pb-0"
                  >
                    {/* Spine: dot + connector so the steps read as one assembling. */}
                    <div className="flex flex-col items-center">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-ink-soft text-marigold transition-colors group-hover:border-marigold/50">
                        <StepIcon size={20} />
                      </span>
                      {!last && (
                        <span aria-hidden className="mt-1 w-px flex-1 bg-line" />
                      )}
                    </div>
                    <div className="pb-1">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-xs text-bone/45">
                          {step.index}
                        </span>
                        <h3 className="font-display text-xl font-bold text-bone sm:text-2xl">
                          {step.title}
                        </h3>
                      </div>
                      <p className="mt-1.5 max-w-md font-ui text-[0.95rem] leading-relaxed text-bone/65">
                        {step.body}
                      </p>
                      <p className="mt-3 flex items-center gap-2 font-ui text-sm text-bone/80">
                        <ArrowRight
                          size={14}
                          weight="bold"
                          className="shrink-0 text-marigold"
                        />
                        <span className="text-bone-dim">Becomes</span>{" "}
                        {step.becomes}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ol>
          </div>
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
          <p className="meta text-bone-dim">Ready when you are</p>
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

/* The hero evidence — the maker's own tile as a buyer meets it in the issue.
   Built from the SAME film primitive and fixture the buyer feed uses (COVER_MAKER
   / Lena), framed in the "what your buyer sees" honesty-inset house style and
   labelled a demo. Not interactive — it is proof, not navigation. */
function CoverEvidence({ reduce }: { reduce: boolean }) {
  const Icon = CRAFT_ICON[COVER_MAKER.craft];
  return (
    <figure className="overflow-hidden rounded-[1.75rem] border border-line bg-ink-soft/80 p-2.5 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.85)] backdrop-blur-sm">
      {/* Mirror label — the argument, stated on the frame itself. */}
      <figcaption className="flex items-center justify-between gap-3 px-3 pb-2.5 pt-1.5">
        <span className="flex items-center gap-1.5 meta text-bone-dim">
          <Eye size={13} weight="fill" />
          What a buyer sees
        </span>
        <span className="meta text-bone/45">Issue 07 · Your page</span>
      </figcaption>

      {/* The tile — mirrors the buyer feed's EditorialTile treatment. */}
      <div className="group relative aspect-[4/5] w-full overflow-hidden rounded-[1.25rem] ring-1 ring-line">
        <div className="absolute inset-0 saturate-[0.94] brightness-[0.96] transition-[filter] duration-500 ease-out-expo group-hover:saturate-100 group-hover:brightness-[1.05]">
          <MakerFilm
            videoSrc={COVER_MAKER.filmSrc}
            poster={COVER_MAKER.image}
            alt={`${COVER_MAKER.name} — ${COVER_MAKER.discipline}, ${COVER_MAKER.studio}`}
            reduce={reduce}
            sizes="(max-width: 1024px) 24rem, 22rem"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

        {/* Watch chip — the film affordance a buyer taps. */}
        <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 backdrop-blur-sm">
          <Play size={12} weight="fill" className="text-marigold" />
          <span className="meta text-bone">Watch · {COVER_MAKER.duration}</span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="meta mb-2 flex items-center gap-1.5 text-bone-dim">
            <Icon size={14} weight="fill" />
            {COVER_MAKER.discipline}
          </p>
          <h3 className="font-display text-2xl font-bold leading-none text-bone">
            {COVER_MAKER.studio}
          </h3>
          <p className="mt-2 flex items-center gap-1.5 font-ui text-sm text-bone/75">
            <span className="font-medium text-bone">{COVER_MAKER.name}</span>
            <span aria-hidden>·</span>
            <MapPin size={13} className="shrink-0" />
            {COVER_MAKER.place}
          </p>
          {/* The signature marigold underline — wipes in once so the still card
              reads as living even without hover (it is proof, not a link). */}
          <motion.span
            aria-hidden
            className="mt-3 block h-px w-full origin-left bg-marigold"
            initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: reduce ? 0 : 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* Honest provenance — never pass demo material off as a real seller. */}
      <p className="px-3 pb-1.5 pt-3 font-ui text-xs leading-relaxed text-bone/55">
        A demo maker&#39;s page — your real film and words land right here.
      </p>
    </figure>
  );
}

/* Step 01 — the maker's single job, given the weight of the whole left column so
   "you do one thing" is felt, not just claimed. Marigold signals it's the active,
   human step; the three that follow recede onto the spine. */
function YourPart({
  reduce,
  step,
}: {
  reduce: boolean;
  step: (typeof JOURNEY_STEPS)[number];
}) {
  const StepIcon = STEP_ICON[step.icon];
  return (
    <motion.div
      variants={reduce ? calm : rise(24, 0.8)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-marigold/35 bg-marigold/[0.06] p-7 sm:p-9"
    >
      <div>
        <div className="flex items-center justify-between gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-marigold text-ink">
            <StepIcon size={26} weight="fill" />
          </span>
          <span className="rounded-full border border-marigold/40 px-3 py-1 meta text-marigold-bright">
            The only step that&#39;s yours
          </span>
        </div>
        <h3 className="mt-7 font-display text-3xl font-bold leading-[1.02] text-bone sm:text-4xl">
          {step.title}
        </h3>
        <p className="mt-3 max-w-md font-ui text-base leading-relaxed text-bone/75">
          {step.body}
        </p>
      </div>

      <div className="mt-8 border-t border-marigold/20 pt-6">
        <p className="meta text-marigold-bright">You</p>
        <p className="mt-2 font-display text-xl font-bold text-bone">
          {step.makerDoes}.
        </p>
        <p className="mt-4 flex items-start gap-2 font-ui text-sm text-bone/70">
          <ArrowRight
            size={14}
            weight="bold"
            className="mt-1 shrink-0 text-marigold"
          />
          <span>
            <span className="text-bone-dim">Becomes</span> {step.becomes}
          </span>
        </p>
      </div>
    </motion.div>
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
