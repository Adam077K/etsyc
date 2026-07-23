import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Careers — KOL",
  description: "We're a small team building KOL in the open. No open roles yet.",
};

/** Careers — the between-issues register: honest, brief, a real route so the
    footer link resolves (no prefetch 404) rather than falling to not-found. */
export default function CareersPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center">
      <Link href="/" className="font-serif text-3xl leading-none text-bone">
        KOL
      </Link>
      <p className="meta mt-10 text-bone-dim">Careers</p>
      <h1
        className="mt-5 max-w-2xl font-display font-extrabold leading-[0.95] text-bone"
        style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
      >
        No roles open — yet.
      </h1>
      <p className="mt-5 max-w-md font-serif text-xl italic leading-snug text-bone/75">
        We&rsquo;re a small team building KOL in the open. When we hire, it&rsquo;ll
        be for people who care about makers as much as we do — write to us and
        we&rsquo;ll remember you.
      </p>
      <a
        href="mailto:hello@kol.example"
        className="group mt-10 flex items-center gap-2.5 rounded-full bg-marigold px-7 py-3.5 font-ui text-base font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        Introduce yourself
        <ArrowRight
          size={20}
          weight="bold"
          className="transition-transform group-hover:translate-x-1"
        />
      </a>
    </main>
  );
}
