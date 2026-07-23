"use client";

import Link from "next/link";
import {
  MagnifyingGlass,
  Heart,
  ShoppingCartSimple,
  User,
  Gift,
  FilmSlate,
} from "@phosphor-icons/react";
import { ETSY_CATEGORIES } from "@/lib/etsy-listings";

/**
 * Etsy-register site chrome — light ground, orange wordmark, rounded search,
 * category strip. Recreated VISUAL LANGUAGE only (no ripped logo asset — the
 * wordmark is text). The one non-Etsy element is the KOL entry tab, which
 * deliberately breaks the chrome to advertise the film feed (links to `/`).
 */
export function EtsyHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        {/* Wordmark — typographic, not a logo asset. */}
        <Link href="/etsy" className="shrink-0" aria-label="Etsy home (concept demo)">
          <span
            className="text-3xl font-bold lowercase tracking-tight text-[#F1641E]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Etsy
          </span>
        </Link>

        {/* Search — the rounded Etsy bar. */}
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="flex min-w-0 flex-1 items-center rounded-full border-2 border-neutral-800 bg-white pl-4 pr-1.5 focus-within:border-[#F1641E]"
        >
          <label htmlFor="etsy-search" className="sr-only">
            Search for anything
          </label>
          <input
            id="etsy-search"
            type="search"
            placeholder="Search for anything"
            suppressHydrationWarning
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F1641E] text-white transition hover:bg-[#d9531090] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1641E] focus-visible:ring-offset-1"
          >
            <MagnifyingGlass size={17} weight="bold" />
          </button>
        </form>

        {/* Account rail. */}
        <nav aria-label="Account" className="flex shrink-0 items-center gap-1 sm:gap-2">
          {[
            { Icon: Gift, label: "Gift mode" },
            { Icon: User, label: "Sign in" },
            { Icon: Heart, label: "Favourites" },
            { Icon: ShoppingCartSimple, label: "Cart" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className="hidden h-10 w-10 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1641E] sm:grid"
            >
              <Icon size={22} />
            </button>
          ))}
          <button
            type="button"
            aria-label="Cart"
            className="grid h-10 w-10 place-items-center rounded-full text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1641E] sm:hidden"
          >
            <ShoppingCartSimple size={22} />
          </button>
        </nav>
      </div>

      {/* Category strip — the KOL entry tab sits inside it, breaking the register. */}
      <div className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 py-2 text-sm [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          {/* THE MONEY MOMENT (1/2): a KOL tab inside Etsy's own nav. */}
          <Link
            href="/"
            className="group mr-1 flex shrink-0 items-center gap-1.5 rounded-full bg-[#1C1613] px-3.5 py-1.5 font-semibold text-[#EFE6D6] transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1641E] focus-visible:ring-offset-1"
          >
            <FilmSlate size={16} weight="fill" className="text-[#FF7A3C]" />
            Meet the makers — on film
            <span className="rounded-full bg-[#F1641E] px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
              New
            </span>
          </Link>
          {ETSY_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1641E]"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
