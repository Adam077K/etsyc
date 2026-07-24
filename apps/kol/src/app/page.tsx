/**
 * DISCOVERY FEED — direction contract (see DESIGN.md for the durable system).
 *
 * THESIS: A living printed magazine of makers-on-film — "The Maker's Issue."
 *   Refuses the uniform product grid (TikTok/Complex) AND the timid
 *   cream+serif+terracotta craft-fair default in equal measure.
 * OWN-WORLD: warm espresso ink ground + brave color-blocked spreads (plum,
 *   clay, sky, bone) at region scale; Bricolage display, Young Serif editorial
 *   accents, Hanken UI, Geist Mono colophon; marigold is the single signal.
 * STORY: a first-time buyer sees these are shoppable humans on film, feels the
 *   warmth, and wants to keep scrolling and tap a maker.
 * FIRST VIEWPORT: full-bleed cover film (hands in clay) with a Kotn-scale
 *   statement over an ink scrim, and a magnetic marigold "Meet the makers" CTA.
 * FORM: brief-pinned direction (warm+human × modern+cinematic) — beats the
 *   concept roll per new-work.md. Signature: liquid ink + warm-bloom hover.
 */

import { Masthead } from "@/components/masthead";
import { HeroSpread } from "@/components/hero-spread";
import { Feed } from "@/components/feed";
import { SiteFooter } from "@/components/site-footer";

export default function DiscoveryFeedPage() {
  return (
    <>
      <Masthead />
      <main>
        <HeroSpread />
        {/* Clean seam into the issue — a quiet gap in the existing rhythm. */}
        <div className="bg-ink py-6 sm:py-8" />
        <Feed />
      </main>
      <SiteFooter />
    </>
  );
}
