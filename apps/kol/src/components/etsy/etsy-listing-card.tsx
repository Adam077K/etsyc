"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Star } from "@phosphor-icons/react";
import type { EtsyListing } from "@/lib/etsy-listings";

/**
 * A single marketplace listing card in the OLD grid format — the pitch's
 * "grid villain". Deliberately flat and transactional: photo, favourite heart,
 * truncated title, shop line, star row, price, free-shipping tag. This is the
 * format KOL exists to replace, shown here with our OWN real products so the
 * contrast with the film feed lands. NOT bound by the KOL design contract.
 */
export function EtsyListingCard({ listing }: { listing: EtsyListing }) {
  const [faved, setFaved] = useState(false);

  return (
    <article className="group relative">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        <button
          type="button"
          onClick={() => setFaved((v) => !v)}
          aria-pressed={faved}
          aria-label={faved ? `Remove ${listing.title} from favourites` : `Add ${listing.title} to favourites`}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white text-neutral-700 shadow-[0_1px_4px_rgba(0,0,0,0.18)] transition hover:scale-105 hover:text-[#F1641E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F1641E] focus-visible:ring-offset-2"
        >
          <Heart size={18} weight={faved ? "fill" : "regular"} className={faved ? "text-[#F1641E]" : ""} />
        </button>
      </div>

      <div className="mt-2.5">
        <h3 className="line-clamp-2 text-sm leading-snug text-neutral-800">
          {listing.title}
          {listing.note ? <span className="text-neutral-500"> — {listing.note}</span> : null}
        </h3>

        <div className="mt-1 flex items-center gap-1.5">
          <span className="flex items-center" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={13} weight="fill" className="text-[#F1641E]" />
            ))}
          </span>
          <span className="text-xs text-neutral-500">
            ({listing.reviewCount})
          </span>
          <span className="sr-only">Rated {listing.rating} out of 5 from {listing.reviewCount} reviews</span>
        </div>

        <p className="mt-1 truncate text-xs text-neutral-500">
          {listing.shopName}
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-semibold text-neutral-900">
            {listing.price}
          </span>
          {listing.freeShipping && (
            <span className="rounded-sm bg-[#EAF4E9] px-1.5 py-0.5 text-[0.68rem] font-semibold text-[#177A3E]">
              Free shipping
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
