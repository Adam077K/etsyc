/**
 * HOW KOL WORKS (/how) — the buyer-facing trust/story page.
 *
 * MODE: Explain + convince — the product thesis in one scroll, the page a
 *   first-time visitor (or investor) lands on to get the whole idea.
 * OWN-WORLD: KOL's fixed system (this is KOL chrome, not a seller's brand).
 * STORY: shopping became a transaction; we made it a relationship again ->
 *   the buyer journey in three film beats -> the two honest trust layers at
 *   page scale (concept-lock D7) -> the confident anti-deal-grid stance ->
 *   two doors out (meet the makers / become one).
 * FORM: overlay masthead over a cinematic hero, then the HowStory scroll.
 */

import type { Metadata } from "next";
import { Masthead } from "@/components/masthead";
import { HowStory } from "@/components/how-story";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "How KOL works — The Maker's Issue",
  description:
    "Shopping became a transaction; KOL makes it a relationship again. Meet a maker on film, watch their world unfold, and buy from the hands that made the thing — never a deal grid.",
};

export default function HowPage() {
  return (
    <>
      {/* Overlay chrome inks in on scroll over the cinematic hero. No nav item
          maps to /how, so `active` intentionally matches nothing. */}
      <Masthead variant="overlay" active="How KOL works" />
      <main>
        <HowStory />
      </main>
      <SiteFooter />
    </>
  );
}
