"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Copy,
  ArrowSquareOut,
  ArrowUpRight,
  Sparkle,
  Clock,
} from "@phosphor-icons/react";
import { COVER_MAKER } from "@/lib/fixtures/makers";
import {
  PUBLISH_SECTIONS,
  PUBLISH_HANDLE,
  PUBLISH_MAKER,
} from "@/lib/fixtures/sell";
import { rise, stagger, calm, easeOut } from "@/lib/motion";
import { Magnetic } from "./magnetic";
import { cn } from "@/lib/utils";

type Phase = "ready" | "publishing" | "live";
// Lena's kiln-clay accent (screens-only demo). WIRING TODO: a real integration
// pass must read the maker's accent selection from the studio state / store
// config instead of hardcoding it here.
const ACCENT = "#AE4328";

export function SellPublish() {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("ready");

  // Required-only denominator, matching the studio's "of 5" fraction. The
  // optional Closing line stays listed below with its dashed/Later treatment.
  const total = PUBLISH_SECTIONS.filter((s) => !s.optional).length;
  const approved = PUBLISH_SECTIONS.filter(
    (s) => !s.optional && s.approved,
  ).length;

  function publish() {
    setPhase("publishing");
    window.setTimeout(() => setPhase("live"), reduce ? 300 : 1900);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <AnimatePresence mode="wait">
        {phase === "live" ? (
          <LiveState key="live" reduce={!!reduce} />
        ) : (
          <motion.div
            key="ready"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
          >
            {/* Heading */}
            <p className="meta text-bone-dim">The final step</p>
            <h1
              className="mt-4 font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)" }}
            >
              Almost live.
            </h1>
            <p className="mt-4 max-w-xl font-ui text-lg leading-relaxed text-bone/75">
              You approved{" "}
              <span className="font-semibold text-bone">
                {approved} of {total} sections
              </span>
              . Here&#39;s everything that&#39;ll go out into the world — review it
              once more, then publish when you&#39;re ready.
            </p>

            {/* Approval summary */}
            <motion.ol
              variants={stagger(0.05, 0.07)}
              initial="hidden"
              animate="visible"
              className="mt-10 space-y-2.5"
            >
              {PUBLISH_SECTIONS.map((s) => (
                <motion.li
                  key={s.id}
                  variants={reduce ? calm : rise(16, 0.5)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border px-4 py-3.5",
                    s.approved
                      ? "border-line bg-ink-soft"
                      : "border-dashed border-bone/20 bg-ink-soft/50",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                      s.approved
                        ? "bg-marigold text-ink"
                        : "border border-bone/25 text-bone/55",
                    )}
                  >
                    {s.approved ? (
                      <Check size={16} weight="bold" />
                    ) : (
                      <Clock size={15} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-ui text-sm font-semibold text-bone">
                      {s.section}
                      {s.optional && !s.approved && (
                        <span className="rounded-full bg-bone/10 px-1.5 py-0.5 font-ui text-[0.6rem] font-normal text-bone/50">
                          optional
                        </span>
                      )}
                    </p>
                    <p className="truncate font-ui text-xs text-bone/55">{s.edit}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-ui text-xs font-medium",
                      s.approved ? "text-marigold" : "text-bone/55",
                    )}
                  >
                    {s.approved ? "Approved" : "Later"}
                  </span>
                </motion.li>
              ))}
            </motion.ol>

            {/* Publish moment */}
            <div className="mt-12 rounded-3xl border border-marigold/25 bg-marigold/[0.06] p-7 text-center sm:p-10">
              <p className="font-ui text-sm text-bone/70">
                Your world will be live at
              </p>
              <p className="mt-2 font-mono text-lg text-bone sm:text-xl">
                {PUBLISH_HANDLE}
              </p>
              <div className="mt-7 flex justify-center">
                <Magnetic>
                  <button
                    type="button"
                    onClick={publish}
                    disabled={phase === "publishing"}
                    className="group flex items-center gap-3 rounded-full bg-marigold px-8 py-4 font-ui text-lg font-semibold text-ink transition-colors hover:bg-marigold-bright disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
                  >
                    {phase === "publishing" ? (
                      <>
                        <PublishingDots />
                        Going live…
                      </>
                    ) : (
                      <>
                        Publish your world
                        <ArrowRight
                          size={21}
                          weight="bold"
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </Magnetic>
              </div>
              <p className="mt-5 font-ui text-xs text-bone/50">
                You can keep editing after you publish — nothing is ever locked.
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/sell/studio"
                className="flex items-center gap-1.5 font-ui text-sm text-bone/60 transition-colors hover:text-bone"
              >
                <ArrowLeft size={15} weight="bold" />
                Back to the studio
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* The celebration — a designed, in-system moment (no confetti-slop). The world
   card blooms up, a LIVE seal stamps, the address underlines. */
function LiveState({ reduce }: { reduce: boolean }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard?.writeText(`https://${PUBLISH_HANDLE}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0.01 : 0.4 }}
      className="flex flex-col items-center text-center"
    >
      {/* World card blooms in */}
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduce ? 0.01 : 0.7, ease: easeOut }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl ring-1 ring-line"
      >
        <div className="relative aspect-[4/3]">
          <Image
            src={COVER_MAKER.image}
            alt={`${PUBLISH_MAKER} — now live`}
            fill
            priority
            sizes="28rem"
            className="object-cover"
          />
          {/* Bottom blends to near-ink so the kicker/title clear AA; the clay
              tint carries mid-card warmth (matches the preview scrim rule). */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, rgba(28,22,19,0.94), ${ACCENT}80 46%, transparent)`,
            }}
          />
          {/* LIVE seal stamps in */}
          <motion.span
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.5, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            transition={{
              delay: reduce ? 0 : 0.4,
              duration: reduce ? 0.01 : 0.5,
              ease: easeOut,
            }}
            className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border-2 border-bone/90 bg-ink/40 px-3 py-1 backdrop-blur-sm"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-bone" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-bone">
              Live
            </span>
          </motion.span>
          <div className="absolute inset-x-0 bottom-0 p-5 text-left">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-bone/80">
              {COVER_MAKER.discipline}
            </p>
            <p className="font-display text-2xl font-extrabold leading-none text-bone">
              {PUBLISH_MAKER}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.25, duration: reduce ? 0.01 : 0.6, ease: easeOut }}
        className="mt-8"
      >
        <p className="flex items-center justify-center gap-2 meta text-bone-dim">
          <Sparkle size={14} weight="fill" />
          You&#39;re published
        </p>
        <h1
          className="mt-4 font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)" }}
        >
          Your world is live.
        </h1>

        {/* Address */}
        <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-line bg-ink-soft py-2 pl-5 pr-2">
          <span className="relative font-mono text-sm text-bone sm:text-base">
            {PUBLISH_HANDLE}
            <motion.span
              className="absolute -bottom-0.5 left-0 h-px w-full origin-left bg-marigold"
              initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: reduce ? 0 : 0.6, duration: 0.6, ease: easeOut }}
            />
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-ui text-xs font-medium text-bone/80 transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft"
          >
            {copied ? (
              <>
                <Check size={13} weight="bold" className="text-marigold" />
                Copied
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy link
              </>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Link
              href="/m/odd-clay"
              className="group flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Visit your world
              <ArrowSquareOut size={18} weight="bold" />
            </Link>
          </Magnetic>
          <Link
            href="/sell/studio?section=voice"
            className="flex items-center gap-2 rounded-full border border-bone/30 px-6 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/70 hover:bg-bone/5"
          >
            Add the closing line
            <ArrowUpRight size={17} weight="bold" />
          </Link>
        </div>

        <p className="mt-8 font-ui text-sm text-bone/50">
          We&#39;ll email you the first time a buyer meets you.
        </p>
      </motion.div>
    </motion.div>
  );
}

function PublishingDots() {
  const reduce = useReducedMotion();
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink"
          animate={reduce ? undefined : { opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
