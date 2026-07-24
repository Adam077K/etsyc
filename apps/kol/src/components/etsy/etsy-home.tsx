import { EtsyHeader } from "./etsy-header";
import { EtsyFooter } from "./etsy-footer";
import { KolEntryBanner } from "./kol-entry-banner";
import { EtsyListingCard } from "./etsy-listing-card";
import { ETSY_LISTINGS } from "@/lib/etsy-listings";

/**
 * /etsy — a concept recreation of the Etsy home page in Etsy's own light UI
 * register, populated with KOL's OWN makers' products in the old flat grid
 * format (the pitch's "grid villain"). The demo journey STARTS here and steps
 * INTO the KOL film feed via the nav tab and the hero banner (both → `/`).
 * One-way: nothing here is linked from the KOL app. Deliberately OUTSIDE the KOL
 * design contract — this must read as Etsy today, not as KOL.
 */
export function EtsyHome() {
  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ colorScheme: "light" }}>
      <EtsyHeader />

      {/* Thin Etsy-style promo strip. */}
      <div className="bg-[#FDEBD2]">
        <div className="mx-auto max-w-[1400px] px-4 py-2.5 text-center text-sm text-[#442C0E] sm:px-6">
          Free shipping on eligible orders · Deals refreshed daily —{" "}
          <span className="font-semibold underline">shop the edit</span>
        </div>
      </div>

      {/* Hero-adjacent money moment. */}
      <KolEntryBanner />

      {/* The grid villain: our real products, trapped in the old format. */}
      <main className="mx-auto max-w-[1400px] px-4 pb-4 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-xl font-semibold text-neutral-900 sm:text-2xl">
            Popular right now
          </h1>
          <span className="cursor-default text-sm font-medium text-[#0873B9] hover:underline">
            See more
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Handpicked from independent makers around the world
        </p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {ETSY_LISTINGS.map((listing) => (
            <EtsyListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </main>

      <EtsyFooter />
    </div>
  );
}
