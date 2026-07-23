/**
 * SELL — the maker onboarding explainer (seller journey step 1).
 *
 * MODE: Persuade — the pitch to makers. "Your world, built from your story."
 * OWN-WORLD: KOL's fixed system (this is KOL chrome, not a seller's brand); the
 *   maker's brand only ever appears later, inside the studio preview pane.
 * STORY: a maker lands here unsure and leaves certain that building a world is
 *   easy (you just talk) and limitless (no template, no two shops alike), then
 *   starts the interview.
 * FORM: warm cinematic hero (Ken-Burns stand-in), the four-step journey made
 *   legible, an explainer-film moment (Watch affordance -> lightbox), an
 *   easy/limitless colour-block spread, one CTA into the interview.
 */

import { SellMasthead } from "@/components/sell-masthead";
import { SellOnboarding } from "@/components/sell-onboarding";
import { SiteFooter } from "@/components/site-footer";

export default function SellPage() {
  return (
    <>
      <SellMasthead />
      <main>
        <SellOnboarding />
      </main>
      <SiteFooter />
    </>
  );
}
