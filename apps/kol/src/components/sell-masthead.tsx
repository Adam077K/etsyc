"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, FloppyDisk } from "@phosphor-icons/react";
import { SELL_STOPS, type SellStopId } from "@/lib/fixtures/sell";
import { cn } from "@/lib/utils";

/**
 * The live-maker nav (post-publish HQ chrome). Distinct from the journey
 * stepper: a published maker has a home to move around, not a linear path.
 * Messages & Clips resolve after their sibling routes merge; pre-merge they
 * hit the designed 404, which is acceptable for this screens-only pass.
 */
export type SellNavId = "home" | "orders" | "messages" | "studio";

const SELL_NAV: { id: SellNavId; label: string; href: string }[] = [
  { id: "home", label: "Home", href: "/sell/home" },
  { id: "orders", label: "Orders", href: "/sell/orders" },
  { id: "messages", label: "Messages", href: "/sell/messages" },
  { id: "studio", label: "Studio", href: "/sell/studio" },
];

const HQ_WORLD_HREF = "/m/odd-clay";

/**
 * SELLER-JOURNEY chrome — KOL's own fixed system (not the buyer masthead, which
 * a sibling owns). The maker's brand never appears here; it only lives inside the
 * studio preview pane. On the three tool stops it carries a progress stepper and
 * a save-&-exit; on the explainer it's a slim wordmark bar; for a LIVE maker
 * (`nav` set) it becomes a compact seller nav — Home · Orders · Messages · Studio.
 */
export function SellMasthead({
  current,
  nav,
  exitHref = "/sell",
  exitLabel = "Save & exit",
}: {
  current?: SellStopId;
  /** live-maker mode — renders the seller nav instead of the journey stepper */
  nav?: SellNavId;
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
        scrolled || current || nav
          ? "border-b border-line bg-ink/85 backdrop-blur-md"
          : "bg-gradient-to-b from-ink/70 to-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-issue items-center justify-between px-5 py-4 sm:px-8",
          nav ? "gap-2 sm:gap-4" : "gap-4",
        )}
      >
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-serif text-2xl leading-none tracking-tight text-bone"
          >
            KOL
          </Link>
          <span className="meta hidden text-bone-dim sm:inline">For&nbsp;Makers</span>
        </div>

        {nav ? (
          <SellerNav active={nav} />
        ) : current ? (
          <>
            <Stepper currentIndex={currentIndex} />
            {/* Condensed orientation below md, where the full rail is hidden. */}
            <span className="font-mono text-xs text-marigold md:hidden">
              Step {currentIndex + 1} of {SELL_STOPS.length}
              <span className="text-bone/55"> · {SELL_STOPS[currentIndex]?.label}</span>
            </span>
          </>
        ) : (
          <span className="meta hidden text-bone-dim md:inline">
            Your world, built from your story
          </span>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3">
          {nav ? (
            <Link
              href={HQ_WORLD_HREF}
              aria-label="View your world"
              className="flex shrink-0 items-center gap-2 rounded-full border border-bone/25 px-2.5 py-2 font-ui text-sm text-bone/85 transition-colors hover:border-bone/60 hover:text-bone sm:px-4"
            >
              <ArrowUpRight size={16} weight="bold" />
              <span className="hidden sm:inline">View your world</span>
            </Link>
          ) : current ? (
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
                <span className="hidden sm:inline">Start your interview</span>
                <span className="sm:hidden">Start</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* The live-maker seller nav — a flat set of destinations, not a linear path.
   The active item carries a marigold underline; the rest ink in on hover. */
function SellerNav({ active }: { active: SellNavId }) {
  return (
    <nav aria-label="Seller sections" className="min-w-0">
      <ul className="flex items-center gap-0.5 sm:gap-2">
        {SELL_NAV.map((item) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative block rounded-full px-2 py-1.5 font-ui text-[0.75rem] transition-colors sm:px-3.5 sm:text-sm",
                  isActive
                    ? "text-bone"
                    : "text-bone/55 hover:text-bone",
                )}
              >
                {item.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 -bottom-0.5 h-px origin-left bg-marigold transition-transform duration-300 sm:inset-x-3.5",
                    isActive ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
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
            <li
              key={stop.id}
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-1.5"
            >
              {done ? (
                <Link
                  href={stop.href}
                  aria-label={`${stop.label} — done, go back`}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  {inner}
                </Link>
              ) : (
                inner
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
