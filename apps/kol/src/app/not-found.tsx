import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

/** Editorial 404 — the "between issues" register. A quiet studio still sits
    behind the locked ink ground (same pattern as the sign-in panel) so the page
    reads finished rather than empty; text always sits on the ink scrim. */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center">
      {/* Full-bleed still, dimmed, under a locked ink scrim (never raw over the
          image — DESIGN.md scrim rule). */}
      <Image
        src="/media/clay-shelf.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-[0.35]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />

      <div className="relative z-10 flex flex-col items-center">
        <Link href="/" className="font-serif text-3xl leading-none text-bone">
          KOL
        </Link>
        <p className="meta mt-10 text-bone-dim">Page not found</p>
        <h1
          className="mt-5 max-w-2xl font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          This page is between issues.
        </h1>
        <p className="mt-5 max-w-md font-serif text-xl italic leading-snug text-bone/75">
          The maker you were looking for may have moved on, or the link has gone
          cold. The feed, though, is always turning.
        </p>
        <Link
          href="/#feed"
          className="group mt-10 flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Back to the feed
          <ArrowRight
            size={20}
            weight="bold"
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </main>
  );
}
