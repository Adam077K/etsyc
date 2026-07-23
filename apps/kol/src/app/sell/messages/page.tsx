/**
 * SELL / MESSAGES — the Ask-the-Maker inbox (post-publish seller tooling).
 *
 * MODE: Operate — the maker answers real buyers running their live shop. KOL's
 *   fixed chrome frames the tool (D15); the correspondence itself is the maker's
 *   own voice. This is the seller side of the buyer's "Ask {maker}" affordance
 *   on the product page (concept-lock D16-3 / D16-6).
 * STORY: buyer questions arrive as letters about specific pieces — never support
 *   tickets. The maker reads one, answers in her own words or on film (KOL's
 *   differentiator, even in support), and the letter is marked answered.
 * STATES: loading (warm skeleton) · default (letters + one open thread) ·
 *   answered (mark-answered) · empty ("No letters today.").
 */

import type { Metadata } from "next";
import { SellWorkspaceNav } from "@/components/sell-workspace-nav";
import { SellMessages } from "@/components/sell-messages";

export const metadata: Metadata = {
  title: "Your letters · KOL for Makers",
  description: "Answer buyer questions in your own words, or on film.",
};

export default function MessagesPage() {
  return (
    <>
      <SellWorkspaceNav active="messages" />
      <main className="min-h-screen bg-ink">
        <SellMessages />
      </main>
    </>
  );
}
