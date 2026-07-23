"use client";

import { useEffect, useState } from "react";
import {
  MagnifyingGlass,
  Heart,
  User,
  Handbag,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const NAV = ["Discover", "Crafts", "Makers", "Journal"];

export function Masthead() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled
          ? "bg-ink/85 backdrop-blur-md border-b border-line"
          : "bg-gradient-to-b from-ink/70 to-transparent",
      )}
    >
      <div className="mx-auto flex max-w-issue items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-baseline gap-3">
          <a
            href="#top"
            className="font-serif text-2xl leading-none tracking-tight text-bone"
          >
            KOL
          </a>
          <span className="meta hidden text-bone-dim sm:inline">
            The&nbsp;Maker&#39;s&nbsp;Issue
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item, i) => (
            <a
              key={item}
              href="#feed"
              className={cn(
                "font-ui text-sm text-bone/80 transition-colors hover:text-bone",
                i === 0 && "text-bone",
              )}
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            aria-label="Search makers"
            className="grid h-10 w-10 place-items-center rounded-full text-bone/85 transition-colors hover:bg-bone/10 hover:text-bone"
          >
            <MagnifyingGlass size={20} />
          </button>
          <button
            aria-label="Saved makers"
            className="hidden h-10 w-10 place-items-center rounded-full text-bone/85 transition-colors hover:bg-bone/10 hover:text-bone sm:grid"
          >
            <Heart size={20} />
          </button>
          <button
            aria-label="Your account"
            className="hidden h-10 w-10 place-items-center rounded-full text-bone/85 transition-colors hover:bg-bone/10 hover:text-bone sm:grid"
          >
            <User size={20} />
          </button>
          <button className="flex items-center gap-2 rounded-full bg-bone px-4 py-2 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5">
            <Handbag size={18} weight="fill" />
            <span className="hidden sm:inline">Bag</span>
          </button>
        </div>
      </div>
    </header>
  );
}
