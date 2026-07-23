/**
 * SELL / INTERVIEW — the adaptive film/voice interview (seller journey step 2).
 *
 * MODE: Operate — the maker completes a conversation. KOL's fixed chrome; the
 *   warmth lives in the AI's voice, not in decoration.
 * STORY: the maker answers fixed story beats (story/craft/workshop/values/brand)
 *   with smart follow-ups, on film or by voice, re-recording freely — and leaves
 *   with everything KOL needs to draft their world. Opens mid-interview.
 * STATES: idle (open question) · recording (live capture stand-in) ·
 *   transcribing (KOL listening) · complete (build-my-world dock).
 */

import { SellMasthead } from "@/components/sell-masthead";
import { SellInterview } from "@/components/sell-interview";

export default function InterviewPage() {
  return (
    <>
      <SellMasthead current="interview" exitLabel="Save & exit" />
      <main className="min-h-screen bg-ink">
        <SellInterview />
      </main>
    </>
  );
}
