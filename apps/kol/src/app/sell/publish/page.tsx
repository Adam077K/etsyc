"use client";

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
 *
 * `published` is lifted here so the fixed chrome (masthead stepper) can flip the
 * final "Go live" stop to done the moment the world goes live — SellPublish owns
 * the phase and signals up via onPublished.
 */

import { useState } from "react";
import { SellMasthead } from "@/components/sell-masthead";
import { SellPublish } from "@/components/sell-publish";

export default function PublishPage() {
  const [published, setPublished] = useState(false);
  return (
    <>
      <SellMasthead
        current="publish"
        exitLabel="Save & exit"
        published={published}
      />
      <main className="min-h-screen bg-ink">
        <SellPublish onPublished={() => setPublished(true)} />
      </main>
    </>
  );
}
