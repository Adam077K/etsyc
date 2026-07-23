"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FilmSlate, Play } from "@phosphor-icons/react";

/**
 * THE MONEY MOMENT — a band of KOL's dark, cinematic register punched through
 * the fluorescent-light Etsy grid. This is the pitch's pivot: the same
 * marketplace, but here the maker is a human on film, not a thumbnail. The whole
 * band links to `/` (the KOL discovery feed). Rendered in KOL's world on purpose
 * (ink ground, bone text, Bricolage display, marigold signal) so the contrast
 * with the surrounding Etsy chrome is felt, not explained.
 */
export function KolEntryBanner() {
  return (
    <section aria-label="KOL — meet the makers on film" className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <Link
        href="/"
        className="group relative block overflow-hidden rounded-2xl bg-[#1C1613] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1641E] focus-visible:ring-offset-2"
      >
        {/* Film still, warm-graded, so the band reads as a frame of footage. */}
        <div className="absolute inset-0">
          <Image
            src="/media/clay-wheel.jpg"
            alt=""
            fill
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="object-cover object-center opacity-70 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          />
          {/* Left-weighted scrim so the copy clears AA over the film. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C1613] via-[#1C1613]/85 to-[#1C1613]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1613]/70 to-transparent" />
        </div>

        <div className="relative flex flex-col gap-5 px-6 py-10 sm:px-12 sm:py-14 lg:py-16">
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-[#F1641E] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white">
              <FilmSlate size={13} weight="fill" />
              New on Etsy
            </span>
            <span
              className="text-xs uppercase tracking-[0.22em] text-[#CDBFA6]"
              style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
            >
              KOL · The Maker&rsquo;s Issue
            </span>
          </span>

          <h2
            className="max-w-2xl font-extrabold leading-[0.95] text-[#EFE6D6]"
            style={{
              fontFamily: "var(--font-display), system-ui, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.75rem)",
            }}
          >
            Meet the maker
            <br />
            before the thing.
          </h2>

          <p className="max-w-xl text-base leading-relaxed text-[#EFE6D6]/80 sm:text-lg">
            The same makers you&rsquo;re scrolling past — filmed in the room where
            they work. Step out of the grid and into the workshop.
          </p>

          <span className="mt-1 inline-flex w-fit items-center gap-2.5 rounded-full bg-[#F1641E] px-6 py-3 text-base font-semibold text-[#1C1613]">
            <Play size={18} weight="fill" />
            Enter KOL
            <ArrowRight size={18} weight="bold" className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </section>
  );
}
