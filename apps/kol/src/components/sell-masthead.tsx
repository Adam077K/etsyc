"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FloppyDisk } from "@phosphor-icons/react";
import { SELL_STOPS, type SellStopId } from "@/lib/fixtures/sell";
import { cn } from "@/lib/utils";

/**
 * SELLER-JOURNEY chrome — KOL's own fixed system (not the buyer masthead, which
 * a sibling owns). The maker's brand never appears here; it only lives inside the
 * studio preview pane. On the three tool stops it carries a progress stepper and
 * a save-&-exit; on the explainer it's a slim wordmark bar.
 */
export function SellMasthead({
  current,
  exitHref = "/sell",
  exitLabel = "Save & exit",
}: {
  current?: SellStopId;
  exitHref?: string;
  exitLabel?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const currentIndex = current
    ? SELL_STOPS.findIndex((s) => s.id === current)
    : -1;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled || current
          ? "border-b border-line bg-ink/85 backdrop-blur-md"
          : "bg-gradient-to-b from-ink/70 to-transparent",
      )}
    >
      <div className="mx-auto flex max-w-issue items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-serif text-2xl leading-none tracking-tight text-bone"
          >
            KOL
          </Link>
          <span className="meta hidden text-bone-dim sm:inline">For&nbsp;Makers</span>
        </div>

        {current ? (
          <Stepper currentIndex={currentIndex} />
        ) : (
          <span className="meta hidden text-bone-dim md:inline">
            Your world, built from your story
          </span>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3">
          {current ? (
            <Link
              href={exitHref}
              className="flex items-center gap-2 rounded-full border border-bone/25 px-4 py-2 font-ui text-sm text-bone/85 transition-colors hover:border-bone/60 hover:text-bone"
            >
              <FloppyDisk size={17} />
              <span className="hidden sm:inline">{exitLabel}</span>
              <span className="sm:hidden">Save</span>
            </Link>
          ) : (
            <>
              <Link
                href="/"
                className="hidden items-center gap-1.5 font-ui text-sm text-bone/80 transition-colors hover:text-bone sm:flex"
              >
                <ArrowLeft size={16} weight="bold" />
                The issue
              </Link>
              <Link
                href="/sell/interview"
                className="rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Start
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* The three-stop progress rail — done / current / upcoming. */
function Stepper({ currentIndex }: { currentIndex: number }) {
  return (
    <nav aria-label="Progress" className="hidden items-center gap-1.5 md:flex">
      <ol className="flex items-center gap-1.5">
        {SELL_STOPS.map((stop, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const inner = (
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-1.5 font-ui text-sm transition-colors",
                active && "bg-marigold/15 text-bone",
                done && "text-bone/80 hover:text-bone",
                !done && !active && "text-bone/55",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold tabular-nums",
                  active && "bg-marigold text-ink",
                  done && "bg-marigold/25 text-marigold",
                  !done && !active && "border border-bone/30 text-bone/55",
                )}
              >
                {done ? <Check size={12} weight="bold" /> : i + 1}
              </span>
              {stop.label}
            </span>
          );
          return (
            <li key={stop.id} className="flex items-center gap-1.5">
              {done ? (
                <Link
                  href={stop.href}
                  aria-label={`${stop.label} — done, go back`}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  {inner}
                </Link>
              ) : (
                <span aria-current={active ? "step" : undefined}>{inner}</span>
              )}
              {i < SELL_STOPS.length - 1 && (
                <span aria-hidden className="h-px w-4 bg-bone/20" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
