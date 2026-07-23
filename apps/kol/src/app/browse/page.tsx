import { Suspense } from "react";
import type { Metadata } from "next";
import { Masthead } from "@/components/masthead";
import { SiteFooter } from "@/components/site-footer";
import { Browse } from "@/components/browse";

export const metadata: Metadata = {
  title: "Meet the makers — KOL",
  description:
    "Search the issue by name, craft, or place. KOL returns people and their craft — never a shelf of products.",
};

export default function BrowsePage() {
  return (
    <>
      <Masthead variant="solid" active="Makers" />
      <main className="min-h-screen bg-ink">
        {/* useSearchParams (the focus deep-link) needs a Suspense boundary. */}
        <Suspense fallback={<div className="pt-28" aria-hidden />}>
          <Browse />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
