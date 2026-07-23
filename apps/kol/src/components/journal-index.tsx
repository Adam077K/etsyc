"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { CRAFT_ICON } from "@/lib/icons";
import {
  ISSUE,
  LEAD_ENTRY,
  ISSUE_ENTRIES,
  NEXT_ISSUE,
  type JournalEntry,
} from "@/lib/fixtures/journal";
import { rise, calm, inView, stagger } from "@/lib/motion";
import { GooDefs, LiquidDivider } from "./liquid";
import { Magnetic } from "./magnetic";
import { cn } from "@/lib/utils";

const GROUND_BG: Record<JournalEntry["ground"], string> = {
  ink: "bg-ink-soft",
  plum: "bg-plum",
  olive: "bg-olive",
  clay: "bg-clay",
  sky: "bg-sky",
  bone: "bg-bone",
};

export function JournalIndex() {
  const reduce = useReducedMotion();
  const v = reduce ? calm : rise(30, 0.9);

  return (
    <main className="bg-ink">
      <GooDefs />

      {/* ── The issue nameplate — the magazine's printed masthead. ───────── */}
      <section className="mx-auto max-w-issue px-5 pb-4 pt-28 sm:px-8 sm:pt-32">
        {/* Running head — the spine of the issue, in the colophon voice. */}
        <div className="flex flex-col gap-2 border-b border-line pb-4 font-mono text-[0.7rem] uppercase tracking-meta text-bone-dim sm:flex-row sm:items-center sm:justify-between">
          <span className="text-marigold">{ISSUE.dateline}</span>
          <span className="hidden sm:block">{ISSUE.runningHead}</span>
          <span>{ISSUE.colophon}</span>
        </div>

        <motion.div
          variants={reduce ? calm : stagger(0.05, 0.12)}
          initial="hidden"
          animate="visible"
          className="grid gap-8 pt-10 md:grid-cols-[1.5fr_1fr] md:items-end md:gap-12"
        >
          <motion.h1
            variants={v}
            className="font-serif leading-[0.86] text-bone"
            style={{ fontSize: "clamp(3.25rem, 11vw, 9rem)" }}
          >
            {ISSUE.wordmark}
          </motion.h1>
          <motion.div variants={v} className="md:pb-3">
            <p
              className="font-display font-bold leading-[1.05] text-bone"
              style={{ fontSize: "clamp(1.15rem, 2vw, 1.6rem)" }}
            >
              {ISSUE.deck}
            </p>
            <p className="mt-5 max-w-md font-ui text-[0.95rem] leading-relaxed text-bone/65">
              {ISSUE.intro}
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* The signature liquid beat — a molten ink seam under the nameplate. */}
      <LiquidDivider className="pointer-events-none mx-auto -mb-2 max-w-issue px-5 opacity-70 sm:px-8" />

      {/* ── Lead feature — the cover story, full-bleed film still. ────────── */}
      <LeadFeature entry={LEAD_ENTRY} reduce={!!reduce} />

      {/* ── The rest of the issue — mixed scale, color-blocked spreads. ───── */}
      <section className="mx-auto max-w-issue px-5 pb-8 pt-24 sm:px-8 sm:pt-28">
        <div className="flex items-baseline justify-between gap-6 border-b border-line pb-6">
          <p className="meta text-marigold">In this issue</p>
          <p className="meta text-bone-dim">Nº 02 — 04</p>
        </div>
      </section>

      <div className="mx-auto flex max-w-issue flex-col gap-6 px-5 sm:gap-8 sm:px-8">
        {/* 02 — plum color-blocked pull-quote spread (a full moment). */}
        <QuoteSpreadEntry entry={ISSUE_ENTRIES[0]!} index={2} reduce={!!reduce} />
        {/* 03 — a wide cinematic film still with the standfirst over a scrim. */}
        <FilmEntry entry={ISSUE_ENTRIES[1]!} index={3} reduce={!!reduce} />
        {/* 04 — olive color-blocked spread, portrait + quote (mirrored). */}
        <QuoteSpreadEntry
          entry={ISSUE_ENTRIES[2]!}
          index={4}
          reduce={!!reduce}
          mirrored
        />
      </div>

      {/* ── In the next issue — honest, small, in the colophon voice. ─────── */}
      <NextIssueStrip reduce={!!reduce} />
    </main>
  );
}

/* The lead feature: a full-bleed film still with the cover-story treatment —
   headline, standfirst and pull-quote sit over a locked ink scrim. */
function LeadFeature({ entry, reduce }: { entry: JournalEntry; reduce: boolean }) {
  const Icon = CRAFT_ICON[entry.craft];
  return (
    <motion.section
      variants={reduce ? calm : rise(30, 0.9)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="mx-auto max-w-issue px-5 pt-10 sm:px-8"
    >
      <Link
        href={`/journal/${entry.slug}`}
        className="group relative block overflow-hidden rounded-3xl ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
      >
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[2/1]">
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.04]",
              !reduce && "film-drift",
            )}
          >
            <Image
              src={entry.image}
              alt={`${entry.makerName} — ${entry.studio}, ${entry.place}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 90vw"
              className="object-cover saturate-[0.94]"
            />
          </div>
          {/* Locked scrim — text never sits raw over the film. */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 lg:p-16">
            <div className="max-w-3xl">
              <p className="meta mb-5 flex items-center gap-2 text-marigold">
                <Icon size={15} weight="fill" />
                {entry.kicker}
              </p>
              <h2
                className="font-display font-extrabold leading-[0.9] text-bone"
                style={{ fontSize: "clamp(2.5rem, 6.5vw, 6rem)" }}
              >
                {entry.title}
              </h2>
              <p className="mt-6 max-w-2xl font-serif text-xl italic leading-snug text-bone/85 sm:text-2xl">
                “{entry.pullQuote}”
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className="inline-flex items-center gap-2.5 rounded-full bg-marigold px-6 py-3 font-ui text-base font-semibold text-ink transition-colors group-hover:bg-marigold-bright">
                  Read the feature
                  <ArrowRight
                    size={19}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-1"
                  />
                </span>
                <span className="font-ui text-sm text-bone/70">
                  {entry.makerName} · {entry.studio} · {entry.readTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.section>
  );
}

/* A color-blocked pull-quote spread (plum / olive) — a whole editorial moment,
   printed on a ground the feed underuses. Honestly tagged "in the next issue". */
function QuoteSpreadEntry({
  entry,
  index,
  reduce,
  mirrored = false,
}: {
  entry: JournalEntry;
  index: number;
  reduce: boolean;
  mirrored?: boolean;
}) {
  const Icon = CRAFT_ICON[entry.craft];
  return (
    <motion.article
      variants={reduce ? calm : rise(30, 0.9)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
    >
      <div
        className={cn(
          "grid overflow-hidden rounded-3xl md:grid-cols-[1fr_1.1fr]",
          GROUND_BG[entry.ground],
        )}
      >
        <div className={cn("relative min-h-[300px]", mirrored && "md:order-2")}>
          <Image
            src={entry.image}
            alt={`${entry.makerName} — ${entry.studio}, ${entry.place}`}
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover grayscale"
          />
          <div
            className={cn(
              "absolute inset-0",
              GROUND_BG[entry.ground],
              "opacity-45 mix-blend-multiply",
            )}
          />
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t to-transparent",
              entry.ground === "plum" ? "from-plum/70" : "from-olive/70",
              mirrored ? "md:bg-gradient-to-l" : "md:bg-gradient-to-r",
            )}
          />
        </div>

        <div className="flex flex-col justify-center gap-6 p-8 sm:p-12 lg:p-16">
          <div className="flex items-center justify-between gap-4">
            {/* Marigold rides the icon (a non-text accent); the label stays
                bone so it clears AA on the olive ground as well as plum. */}
            <p className="meta flex items-center gap-2 text-bone">
              <Icon size={14} weight="fill" className="text-marigold-bright" />
              {entry.kicker}
            </p>
            <span className="meta text-bone/85">Nº 0{index}</span>
          </div>

          <h3
            className="font-display font-bold leading-[0.95] text-bone"
            style={{ fontSize: "clamp(1.9rem, 3.6vw, 3.4rem)" }}
          >
            {entry.title}
          </h3>

          <blockquote
            className="font-serif leading-[1.2] text-bone"
            style={{ fontSize: "clamp(1.4rem, 2.4vw, 2.1rem)" }}
          >
            “{entry.pullQuote}”
          </blockquote>

          <p className="max-w-md font-ui text-[0.95rem] leading-relaxed text-bone/90">
            {entry.standfirst}
          </p>

          <NextIssueTag entry={entry} onGround />
        </div>
      </div>
    </motion.article>
  );
}

/* A wide cinematic film still, standfirst over an ink scrim (mixed scale). */
function FilmEntry({
  entry,
  index,
  reduce,
}: {
  entry: JournalEntry;
  index: number;
  reduce: boolean;
}) {
  const Icon = CRAFT_ICON[entry.craft];
  return (
    <motion.article
      variants={reduce ? calm : rise(30, 0.9)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="group relative overflow-hidden rounded-3xl ring-1 ring-line"
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.04]",
            !reduce && "film-drift",
          )}
        >
          <Image
            src={entry.image}
            alt={`${entry.makerName} — ${entry.studio}, ${entry.place}`}
            fill
            sizes="(max-width: 1024px) 100vw, 90vw"
            className="object-cover saturate-[0.94]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/10 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end gap-4 p-6 sm:p-12">
          <div className="flex items-center justify-between gap-4">
            <p className="meta flex items-center gap-2 text-marigold">
              <Icon size={14} weight="fill" />
              {entry.kicker}
            </p>
            <span className="meta text-bone/60">Nº 0{index}</span>
          </div>
          <div className="max-w-2xl">
            <h3
              className="font-display font-bold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(1.9rem, 4vw, 3.8rem)" }}
            >
              {entry.title}
            </h3>
            <p className="mt-4 max-w-xl font-serif text-lg italic leading-snug text-bone/85 sm:text-xl">
              “{entry.pullQuote}”
            </p>
            <div className="mt-5">
              <NextIssueTag entry={entry} />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* The honest "in the next issue" affordance per entry — small, never the old
   interstitial. Links to the real maker's world so it never dead-ends. */
function NextIssueTag({
  entry,
  onGround = false,
}: {
  entry: JournalEntry;
  onGround?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-meta",
          onGround
            ? "bg-ink/25 text-bone"
            : "bg-ink/50 text-bone backdrop-blur-sm",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
        In the next issue
      </span>
      <Link
        href={`/m/${entry.makerId}`}
        className={cn(
          "group/link inline-flex items-center gap-1.5 font-ui text-sm font-medium underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          onGround ? "text-bone hover:text-marigold-bright" : "text-bone hover:text-marigold",
        )}
      >
        Meet {entry.makerName} now
        <ArrowUpRight
          size={16}
          weight="bold"
          className="transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
        />
      </Link>
    </div>
  );
}

/* The "in the next issue" contents strip — the magazine's back page, mono. */
function NextIssueStrip({ reduce }: { reduce: boolean }) {
  return (
    <motion.section
      variants={reduce ? calm : rise(28, 0.9)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      className="mx-auto mt-24 max-w-issue px-5 pb-24 sm:mt-28 sm:px-8"
    >
      <div className="rounded-3xl border border-line bg-ink-soft p-8 sm:p-12">
        <div className="flex flex-col gap-2 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="meta text-marigold">Still being set</p>
            <h2
              className="mt-4 font-display font-bold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
            >
              In the next issue
            </h2>
          </div>
          <p className="max-w-xs font-ui text-sm leading-relaxed text-bone/60">
            Four more makers are being written up now. Meet them in the feed
            while the ink dries.
          </p>
        </div>

        <ul className="mt-4">
          {NEXT_ISSUE.map((item, i) => (
            <li key={item.makerId}>
              <Link
                href={`/m/${item.makerId}`}
                className="group flex flex-col gap-3 border-b border-line py-6 transition-colors last:border-b-0 hover:bg-bone/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:flex-row sm:items-baseline sm:gap-8"
              >
                <span className="meta w-16 shrink-0 text-bone-dim">
                  0{i + 1} / {item.craft}
                </span>
                <span className="flex-1">
                  <span className="block font-display text-xl font-bold leading-tight text-bone transition-colors group-hover:text-marigold sm:text-2xl">
                    {item.studio}
                  </span>
                  <span className="mt-1.5 block max-w-2xl font-ui text-sm leading-relaxed text-bone/65">
                    {item.line}
                  </span>
                </span>
                <span className="hidden shrink-0 items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-meta text-bone/50 transition-colors group-hover:text-marigold sm:inline-flex">
                  Visit
                  <ArrowUpRight size={14} weight="bold" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Magnetic strength={0.2}>
            <Link
              href="/#feed"
              className="group inline-flex items-center gap-2.5 rounded-full border border-bone/25 px-7 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Back to the feed
              <ArrowRight
                size={18}
                weight="bold"
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </Magnetic>
        </div>
      </div>
    </motion.section>
  );
}
