/**
 * SELL / STUDIO — the co-edit editor (seller journey steps 3-4).
 *
 * MODE: Operate — the maker reviews and shapes their AI-drafted world in a
 *   block editor. KOL's fixed chrome frames the tool; the maker's own brand
 *   lives only inside the live preview pane (D15).
 * STORY: the maker sees their whole world drafted from the interview, edits it
 *   section by section — swap a layout, nudge the colour, re-record a clip, add a
 *   voiceover — and approves what they love, on the way to publish.
 * STATES: loading (AI composing the draft) · default (populated editor) ·
 *   empty (a section hidden/emptied, e.g. the shop) · hover/selected (per block).
 */

import { SellMasthead } from "@/components/sell-masthead";
import { SellStudio } from "@/components/sell-studio";

export default function StudioPage() {
  return (
    <>
      <SellMasthead current="studio" exitLabel="Save draft" />
      <main className="min-h-screen bg-ink">
        <SellStudio />
      </main>
    </>
  );
}
