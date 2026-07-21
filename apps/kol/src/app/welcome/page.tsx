"use client";

/**
 * /welcome — Buyer onboarding, a one-time FLOW (B18).
 * Mirrors docs/10-page-mockups/onboarding.html.
 *
 * Hard ACs honoured here:
 * - Step 1 is FACES FIRST: real makers on film the buyer reacts to
 *   (follow / not for me) — a face before a field, literally.
 * - Explicit preference input stays minimal (chips + optional budget/location).
 * - Persistent, prominent "Skip all" on EVERY step; no step is a gate — the
 *   feed works regardless. A non-zero skip rate is healthy.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Film } from "@/components/chrome/Film";
import { getMaker, type MockMaker } from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";

const STEP_MAKER_SLUGS = ["sena", "tomas", "mira", "noor"];

const VIBES = ["Earthy", "Bold colour", "Quiet / minimal", "Story-led", "Sculptural"];
const BUDGETS = ["Under $50", "$50–150", "$150–400", "No ceiling — show me the special ones"];
const CONTACT = [
  { id: "quiet", label: "Browse quietly", hint: "Films and worlds, no conversation" },
  { id: "sometimes", label: "Say hi sometimes", hint: "A question here, a thank-you there" },
  { id: "full", label: "I want the full relationship", hint: "Commissions, drafts, voice notes" },
];

const STEP_LABELS = ["React to makers", "A little taste", "How much contact"];

export default function WelcomePage() {
  const router = useRouter();
  const session = useKolSession();

  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [vibes, setVibes] = useState<string[]>([]);
  const [budget, setBudget] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState<string | null>(null);

  const stepMakers: MockMaker[] = STEP_MAKER_SLUGS.flatMap((slug) => {
    const m = getMaker(slug);
    return m ? [m] : [];
  });

  const skipAll = () => router.push("/");

  const toggleVibe = (v: string) =>
    setVibes((vs) => (vs.includes(v) ? vs.filter((x) => x !== v) : [...vs, v]));

  const finish = () => {
    session.completeOnboarding({
      vibes,
      budget,
      location: location.trim() || undefined,
    });
    router.push("/");
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-[var(--space-16)]">
      {/* ---- slim rail: progress + the persistent, prominent skip ---- */}
      <header className="pt-[var(--space-6)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption uppercase text-muted">Setting up · one time only</p>
          <button
            type="button"
            onClick={skipAll}
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-caption uppercase text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            Skip all — take me to the feed
          </button>
        </div>
        {/* progress dots */}
        <div className="mt-3 flex items-center gap-2" aria-label={`Step ${step + 1} of 3`}>
          {STEP_LABELS.map((label, i) => (
            <span key={label} className="flex items-center gap-2">
              <span
                aria-hidden
                className={`h-2 w-2 rounded-pill transition-colors duration-state ease-kol ${
                  i === step ? "bg-accent" : i < step ? "bg-ink" : "bg-line"
                }`}
              />
              <span
                className={`text-caption uppercase ${i === step ? "text-ink" : "text-muted"}`}
              >
                {i + 1} · {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <span aria-hidden className="mx-1 h-px w-6 bg-line" />
              )}
            </span>
          ))}
        </div>
        <p className="mt-2 text-caption text-muted">
          Skipping is fine — the feed works either way, and it never starts empty.
        </p>
      </header>

      {/* ================= STEP 1 · FACES FIRST ================= */}
      {step === 0 && (
        <section className="pt-[var(--space-6)]" aria-label="Meet a few real makers">
          <h1 className="max-w-measure font-display text-h1 text-ink">
            First, meet a few real makers.
          </h1>
          <p className="mt-2 max-w-measure text-body-lg text-muted">
            No questions yet. Watch a second of each, then tell us who you&rsquo;d want to hear
            more from. This is how KOL learns — by what you <em>do</em>, not what you claim.
          </p>

          {/* a react-stack, one maker at a time — deliberately not a uniform grid */}
          <div className="mt-[var(--space-4)] flex flex-col gap-4">
            {stepMakers.map((m) => {
              const following = session.isFollowing(m.slug);
              const notForMe = dismissed.includes(m.slug);
              return (
                <div
                  key={m.slug}
                  className={`overflow-hidden rounded-lg border border-line bg-surface shadow-card transition-opacity duration-state ease-kol ${
                    notForMe ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-stretch md:flex-row">
                    <Link href={`/m/${m.slug}`} className="block min-w-0 flex-1">
                      <Film
                        variant={m.filmClass}
                        aspect="wide"
                        craft={`${m.craft} · ${m.location}`}
                        title={m.name}
                        rounded={false}
                        className="h-full shadow-none"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col justify-center p-4 md:p-5">
                      <span
                        className={`self-start rounded-pill border px-2.5 py-0.5 text-caption ${
                          m.verified
                            ? "border-accent bg-accent/10 text-ink"
                            : "border-line bg-ground text-muted"
                        }`}
                      >
                        {m.verified ? "✓ Real Maker" : "Verification pending"}
                      </span>
                      <p className="mt-2 max-w-measure text-body text-ink">
                        &ldquo;{m.bio}&rdquo;
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => session.toggleFollow(m.slug)}
                          aria-pressed={following}
                          className={`inline-flex min-h-11 items-center rounded-pill px-5 text-caption uppercase transition-transform duration-tap ease-kol active:scale-[0.98] ${
                            following
                              ? "border border-accent bg-accent/10 text-ink"
                              : "bg-accent text-accent-ink hover:bg-accent/90"
                          }`}
                        >
                          {following ? `Following ${m.name} ✓` : `＋ Follow ${m.name}`}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDismissed((d) =>
                              d.includes(m.slug)
                                ? d.filter((x) => x !== m.slug)
                                : [...d, m.slug],
                            )
                          }
                          aria-pressed={notForMe}
                          className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
                        >
                          {notForMe ? "Changed my mind" : "Not for me"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-[var(--space-5)] flex items-center justify-between">
            <button
              onClick={skipAll}
              className="inline-flex min-h-11 items-center text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
            >
              Skip this step
            </button>
            <button
              onClick={() => setStep(1)}
              className="inline-flex min-h-11 items-center rounded-pill bg-accent px-8 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
            >
              Next
            </button>
          </div>
        </section>
      )}

      {/* ================= STEP 2 · A LITTLE TASTE ================= */}
      {step === 1 && (
        <section className="pt-[var(--space-6)]" aria-label="A little taste">
          <h1 className="max-w-measure font-display text-h1 text-ink">
            Anything you&rsquo;re drawn to?
          </h1>
          <p className="mt-2 max-w-measure text-body-lg text-muted">
            A few taps, not a form. Tap what pulls you — or don&rsquo;t. We already learned more
            from your follows than any of these could tell us.
          </p>

          <p id="taste-label" className="mt-[var(--space-4)] text-caption uppercase text-muted">
            Taste
          </p>
          <div role="group" aria-labelledby="taste-label" className="mt-1 flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => toggleVibe(v)}
                aria-pressed={vibes.includes(v)}
                className={`inline-flex min-h-11 items-center rounded-pill border px-4 text-caption transition-colors duration-state ease-kol ${
                  vibes.includes(v)
                    ? "border-accent bg-accent/10 text-ink"
                    : "border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="mt-[var(--space-4)] rounded-lg border border-line bg-surface p-4">
            {/* a group of toggles, not a single form control — labelled as a
                group so the caption isn't an orphan <label for="…"> */}
            <span id="budget-label" className="text-caption uppercase text-muted">
              Comfortable spend (optional)
            </span>
            <div
              role="group"
              aria-labelledby="budget-label"
              className="mt-2 flex flex-wrap gap-2"
            >
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBudget((cur) => (cur === b ? undefined : b))}
                  aria-pressed={budget === b}
                  className={`inline-flex min-h-11 items-center rounded-pill border px-4 text-caption transition-colors duration-state ease-kol ${
                    budget === b
                      ? "border-accent bg-accent/10 text-ink"
                      : "border-line bg-surface text-muted hover:text-ink"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-line bg-surface p-4">
            <label htmlFor="loc" className="text-caption uppercase text-muted">
              Roughly where are you? (optional · helps surface local makers)
            </label>
            <input
              id="loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or region — or leave blank"
              className="mt-2 w-full rounded-sm border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>

          <div className="mt-[var(--space-5)] flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="inline-flex min-h-11 items-center text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
            >
              Skip this step
            </button>
            <button
              onClick={() => setStep(2)}
              className="inline-flex min-h-11 items-center rounded-pill bg-accent px-8 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
            >
              Next
            </button>
          </div>
        </section>
      )}

      {/* ================= STEP 3 · HOW MUCH MAKER CONTACT ================= */}
      {step === 2 && (
        <section className="pt-[var(--space-6)]" aria-label="How much maker contact">
          <h1 className="max-w-measure font-display text-h1 text-ink">
            How much maker contact do you want?
          </h1>
          <p className="mt-2 max-w-measure text-body-lg text-muted">
            Every answer is a fine answer — makers here respect quiet browsers as much as
            commissioners.
          </p>

          <div className="mt-[var(--space-4)] flex flex-col gap-3" role="radiogroup" aria-label="Contact preference">
            {CONTACT.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={contact === c.id}
                onClick={() => setContact(c.id)}
                className={`flex items-baseline justify-between gap-4 rounded-lg border p-4 text-left transition-colors duration-state ease-kol ${
                  contact === c.id
                    ? "border-accent bg-accent/10"
                    : "border-line bg-surface hover:bg-ground"
                }`}
              >
                <span className="text-body-lg text-ink">{c.label}</span>
                <span className="text-caption text-muted">{c.hint}</span>
              </button>
            ))}
          </div>

          <div className="mt-[var(--space-5)] flex items-center justify-between">
            <button
              onClick={skipAll}
              className="inline-flex min-h-11 items-center text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
            >
              Skip — I&rsquo;ll leave it blank
            </button>
            <button
              onClick={finish}
              className="inline-flex min-h-11 items-center rounded-pill bg-accent px-8 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
            >
              Done — enter KOL
            </button>
          </div>
        </section>
      )}

      {/* ---- the load-bearing promise ---- */}
      <div className="mt-[var(--space-10)] rounded-lg bg-block-b p-[var(--space-6)] text-on-block-b md:p-[var(--space-8)]">
        <p className="text-caption uppercase opacity-85">The guarantee</p>
        <h2 className="mt-2 max-w-[22ch] font-display text-h2">
          Skip every step and you still land in a working feed.
        </h2>
        <p className="mt-3 max-w-measure text-body-lg opacity-90">
          Nothing here is a gate. A brand-new buyer who taps &ldquo;Skip all&rdquo; gets the
          same editorial Discover feed as everyone else — populated from what makers filmed
          today, not from a profile you were forced to fill in. The feed gets more{" "}
          <em>yours</em> as you watch, follow, and buy. It never starts empty.
        </p>
      </div>
    </main>
  );
}
