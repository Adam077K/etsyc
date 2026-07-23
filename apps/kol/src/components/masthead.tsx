"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MagnifyingGlass,
  Heart,
  User,
  Handbag,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Discover", href: "/" },
  { label: "Crafts", href: "/#feed" },
  { label: "Makers", href: "/browse" },
  { label: "Journal", href: "/journal" },
] as const;

/**
 * Global masthead — the fixed KOL chrome that ties the whole issue together.
 *
 * `variant="overlay"` (default) is the cover treatment: transparent over the
 * hero film, inking to solid on scroll — used on the Discovery Feed. `"solid"`
 * starts opaque for interior surfaces (browse, account) that open on the ink
 * ground with no hero behind the bar. `active` highlights the current section.
 */
export function Masthead({
  variant = "overlay",
  active = "Discover",
}: {
  variant?: "overlay" | "solid";
  active?: string;
}) {
  const [scrolled, setScrolled] = useState(variant === "solid");

  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const solid = variant === "solid" || scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        solid
          ? "bg-ink/85 backdrop-blur-md border-b border-line"
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
          <span className="meta hidden text-bone-dim sm:inline">
            The&nbsp;Maker&#39;s&nbsp;Issue
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active === item.label ? "page" : undefined}
              className={cn(
                "font-ui text-sm text-bone/80 transition-colors hover:text-bone",
                active === item.label && "text-bone",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link
            href="/sign-in"
            className="hidden font-ui text-sm text-bone/80 transition-colors hover:text-bone lg:inline"
          >
            Sign in
          </Link>
          <Link
            href="/browse?focus=1"
            aria-label="Search makers"
            className="grid h-10 w-10 place-items-center rounded-full text-bone/85 transition-colors hover:bg-bone/10 hover:text-bone"
          >
            <MagnifyingGlass size={20} />
          </Link>
          <Link
            href="/account#saved"
            aria-label="Saved pieces"
            className="hidden h-10 w-10 place-items-center rounded-full text-bone/85 transition-colors hover:bg-bone/10 hover:text-bone sm:grid"
          >
            <Heart size={20} />
          </Link>
          <Link
            href="/account"
            aria-label="Your account"
            className="hidden h-10 w-10 place-items-center rounded-full text-bone/85 transition-colors hover:bg-bone/10 hover:text-bone sm:grid"
          >
            <User size={20} />
          </Link>
          <Link
            href="/checkout"
            aria-label="Your bag"
            className="flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
          >
            <Handbag size={18} weight="fill" />
            <span className="hidden sm:inline">Bag</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
