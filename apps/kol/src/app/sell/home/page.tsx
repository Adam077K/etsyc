/**
 * SELL / HOME — the Seller HQ (post-publish home for a live maker).
 *
 * MODE: Operate — a published maker's day at a glance, in KOL's warm editorial
 *   register (NOT a SaaS dashboard). KOL's fixed chrome frames it; the maker's
 *   own brand appears only in the world-preview film thumbnail (D15).
 * STORY: Lena's world is live. She sees her cover film leading the frame, the
 *   human numbers of her week in KOL's voice, what needs her (orders + buyer
 *   questions), and quick ways back into the studio.
 * STATES: loading (warm skeleton) · default (populated) · empty (?state=empty —
 *   a fresh maker with no week yet) · error (?state=error).
 */

import { SellMasthead } from "@/components/sell-masthead";
import { SellHome } from "@/components/sell-home";

export default function SellHomePage() {
  return (
    <>
      <SellMasthead nav="home" />
      <main className="min-h-screen bg-ink">
        <SellHome />
      </main>
    </>
  );
}
