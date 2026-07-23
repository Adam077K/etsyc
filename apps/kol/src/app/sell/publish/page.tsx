/**
 * SELL / PUBLISH — approve & go live (seller journey step 5).
 *
 * MODE: Operate -> a designed moment. KOL's fixed chrome; the celebration is
 *   in-system and restrained (no confetti-slop).
 * STORY: the maker sees a section-by-section approval summary ("5 of 6"),
 *   publishes, watches their world go live, and lands on their real address
 *   (kol.world/odd-clay) with a way to visit the world buyers will meet.
 * STATES: ready (summary + publish) · publishing (going-live beat) ·
 *   live (celebration) · optional-left (the 6th section saved for later).
 */

import { SellMasthead } from "@/components/sell-masthead";
import { SellPublish } from "@/components/sell-publish";

export default function PublishPage() {
  return (
    <>
      <SellMasthead current="publish" exitLabel="Save & exit" />
      <main className="min-h-screen bg-ink">
        <SellPublish />
      </main>
    </>
  );
}
