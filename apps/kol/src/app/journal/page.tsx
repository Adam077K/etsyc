import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PenNib } from "@phosphor-icons/react/dist/ssr";
import { Masthead } from "@/components/masthead";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "The Journal — KOL",
  description:
    "The Journal is between issues. Longform maker stories are being set — meanwhile, the feed is always turning.",
};

/**
 * The Journal — a designed "between issues" interstitial rather than a dead nav
 * link. Longform maker stories aren't part of this build, so the register from
 * not-found is reused here, kept on the locked ink ground with full chrome.
 */
export default function JournalPage() {
  return (
    <>
      <Masthead variant="solid" active="Journal" />
      <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center px-6 pb-24 pt-28 text-center">
        <span className="mb-8 grid h-16 w-16 place-items-center rounded-full bg-ink-raise text-marigold">
          <PenNib size={30} />
        </span>
        <p className="meta text-marigold">The Journal</p>
        <h1
          className="mt-5 max-w-3xl font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
        >
          We&rsquo;re between issues.
        </h1>
        <p className="mt-6 max-w-lg font-serif text-xl italic leading-snug text-bone/75">
          The longform maker stories are still being set by hand &mdash; the same
          way everything here is made. The next issue lands soon; until then, the
          feed is always turning.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/#feed"
            className="group flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Back to the feed
            <ArrowRight
              size={20}
              weight="bold"
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
          <Link
            href="/browse"
            className="rounded-full border border-bone/25 px-7 py-3.5 font-ui text-base font-medium text-bone transition-colors hover:border-bone/60 hover:bg-bone/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            Meet the makers
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
