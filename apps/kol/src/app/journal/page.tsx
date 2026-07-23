import type { Metadata } from "next";
import { Masthead } from "@/components/masthead";
import { SiteFooter } from "@/components/site-footer";
import { JournalIndex } from "@/components/journal-index";

export const metadata: Metadata = {
  title: "The Journal — KOL",
  description:
    "The Journal is KOL's editorial magazine: longform stories from the people whose hands make the things. Issue 07 · Summer.",
};

/**
 * The Journal index — the issue's table of contents rendered as a designed
 * editorial object: a printed nameplate, a full-bleed lead feature, mixed-scale
 * color-blocked story spreads, and an honest "in the next issue" contents strip.
 */
export default function JournalPage() {
  return (
    <>
      <Masthead variant="solid" active="Journal" />
      <JournalIndex />
      <SiteFooter />
    </>
  );
}
