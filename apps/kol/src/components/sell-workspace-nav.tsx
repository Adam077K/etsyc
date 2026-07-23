"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * The shared POST-PUBLISH seller-workspace chrome — KOL's fixed system for a
 * live maker's home. Distinct from arc-4's `sell-masthead` stepper (pre-publish
 * surfaces keep that untouched); this is a flat set of destinations, not a
 * linear path.
 *
 * SELF-CONTAINED by design: no coupling to any page's internals. Adopt it by
 * rendering `<SellWorkspaceNav active="..." />` at the top of a post-publish
 * route — it is the full fixed header, so a page needs nothing else above its
 * <main>. Maker brand never appears here (D15); it lives only inside the world
 * itself, reachable via the world link.
 *
 * Messages & Clips resolve once their sibling routes merge; pre-merge they hit
 * the designed 404, which is acceptable for this screens-only pass.
 */

export type SellWorkspaceRoute =
  | "home"
  | "orders"
  | "messages"
  | "clips"
  | "studio";

const WORKSPACE_NAV: { id: SellWorkspaceRoute; label: string; href: string }[] =
  [
    { id: "home", label: "Home", href: "/sell/home" },
    { id: "orders", label: "Orders", href: "/sell/orders" },
    { id: "messages", label: "Messages", href: "/sell/messages" },
    { id: "clips", label: "Clips", href: "/sell/clips" },
    { id: "studio", label: "Studio", href: "/sell/studio" },
  ];

export function SellWorkspaceNav({
  active,
  worldHref = "/m/odd-clay",
}: {
  /** the current post-publish route — drives the active underline */
  active: SellWorkspaceRoute;
  /** the maker's live world (the one D15 brand touchpoint) */
  worldHref?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-colors duration-500",
        scrolled ? "border-line bg-ink/90" : "border-line/60 bg-ink/80",
      )}
    >
      <div className="mx-auto flex max-w-issue items-center justify-between gap-1.5 px-5 py-4 sm:gap-4 sm:px-8">
        {/* Wordmark — KOL chrome, never the maker's brand. */}
        <div className="flex shrink-0 items-baseline gap-3">
          <Link
            href="/"
            className="font-serif text-2xl leading-none tracking-tight text-bone"
          >
            KOL
          </Link>
          <span className="meta hidden text-bone-dim sm:inline">
            For&nbsp;Makers
          </span>
        </div>

        {/* Destinations — flat, with a marigold underline on the active one.
            Scrollable on the narrowest screens as a graceful safety, so five
            items can never collide with the wordmark or world link. */}
        <nav
          aria-label="Seller workspace"
          className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center justify-start gap-0.5 sm:justify-center sm:gap-2">
            {WORKSPACE_NAV.map((item) => {
              const isActive = item.id === active;
              return (
                <li key={item.id} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative block rounded-full px-1.5 py-2 font-ui text-[0.72rem] transition-colors sm:px-3.5 sm:py-1.5 sm:text-sm",
                      isActive ? "text-bone" : "text-bone/55 hover:text-bone",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-1.5 bottom-1 h-px origin-left bg-marigold transition-transform duration-300 sm:inset-x-3.5 sm:-bottom-0.5",
                        isActive ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* The one brand touchpoint — a way out to the live world. */}
        <Link
          href={worldHref}
          aria-label="View your world"
          className="flex shrink-0 items-center gap-2 rounded-full border border-bone/25 px-2.5 py-2 font-ui text-sm text-bone/85 transition-colors hover:border-bone/60 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink sm:px-4"
        >
          <ArrowUpRight size={16} weight="bold" />
          <span className="hidden sm:inline">View your world</span>
        </Link>
      </div>
    </header>
  );
}
