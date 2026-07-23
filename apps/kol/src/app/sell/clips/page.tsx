/**
 * SELL / CLIPS — the film library (post-publish seller tooling).
 *
 * MODE: Operate — the maker manages every clip in their world. KOL's fixed
 *   chrome frames the tool (D15); the footage is the maker's own. This surface
 *   makes KOL's video-first thesis tangible on the seller side: each clip knows
 *   WHERE IT PLAYS (concept-lock D5, one video engine across every surface).
 * STORY: the maker sees their footage grouped by where it plays — cover,
 *   process, shop, studio, thank-you — re-records what's filmed, and fills the
 *   honest gaps ("Not filmed yet — 2 minutes with your phone").
 * STATES: loading (warm skeleton) · default (grouped library) · hover (card
 *   lift + play) · empty per-slot (the "missing clip" designed state) + a
 *   filtered page-level empty.
 */

import type { Metadata } from "next";
import { SellWorkspaceNav } from "@/components/sell-workspace-nav";
import { SellClips } from "@/components/sell-clips";

export const metadata: Metadata = {
  title: "Your films · KOL for Makers",
  description: "Every clip in your world, and where each one plays.",
};

export default function ClipsPage() {
  return (
    <>
      <SellWorkspaceNav active="clips" />
      <main className="min-h-screen bg-ink">
        <SellClips />
      </main>
    </>
  );
}
