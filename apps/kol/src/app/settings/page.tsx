"use client";

/**
 * /settings — Settings (P2). Mirrors docs/10-page-mockups/settings.html.
 *
 * HYGIENE surface — carries no mission load. Deliberately plain, legible,
 * unglamorous: no film, no colour blocks, no motion drama. People arrive to
 * flip one switch and leave. Restraint here is the correct craft.
 */

import Link from "next/link";
import { useState } from "react";
import type { NotificationType } from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";

/* the six B16 notification types, human-labelled */
const NOTIFICATION_TYPES: { type: NotificationType; label: string; defaultOn: boolean }[] = [
  { type: "maker-update", label: "A maker you follow posts a new film or update", defaultOn: true },
  { type: "order", label: "Order status & shipping updates", defaultOn: true },
  { type: "reply", label: "A maker replied to your question or message", defaultOn: true },
  { type: "release", label: "A release or restock from a maker you follow", defaultOn: true },
  { type: "commission-milestone", label: "A commission milestone (draft, approval, progress)", defaultOn: true },
  { type: "community", label: "Activity in a community you've joined", defaultOn: false },
];

const SECTIONS = [
  { id: "account", label: "Account info" },
  { id: "notifications", label: "Notifications" },
  { id: "payment", label: "Payment methods" },
  { id: "privacy", label: "Privacy" },
  { id: "recs", label: "Recommendations" },
  { id: "community", label: "Community permissions" },
  { id: "data", label: "Your data" },
];

const rowClass = "flex items-center justify-between gap-4 p-4";
const cardClass = "divide-y divide-line rounded-lg border border-line bg-surface";
const btnClass =
  "rounded-pill border border-line bg-surface px-4 py-1.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground";

export default function SettingsPage() {
  const session = useKolSession();

  const [notif, setNotif] = useState<Record<NotificationType, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_TYPES.map((n) => [n.type, n.defaultOn])) as Record<
      NotificationType,
      boolean
    >,
  );
  const [profilePublic, setProfilePublic] = useState(false);
  const [tastePublic, setTastePublic] = useState(false); // off by default — opt-in
  const [resetStage, setResetStage] = useState<"idle" | "confirm" | "done">("idle");

  // Honest reset: this prototype's "learned" model IS your follows + saves,
  // so resetting clears exactly those — nothing pretended, nothing hidden.
  const resetLearned = () => {
    session.follows.forEach((slug) => session.toggleFollow(slug));
    session.saves.forEach((id) => session.toggleSave(id));
    setResetStage("done");
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-[var(--space-16)]">
      <header className="pt-[var(--space-8)]">
        <p className="text-caption uppercase text-muted">Account</p>
        <h1 className="mt-1 font-display text-h1 text-ink">Settings</h1>
      </header>

      <div className="mt-[var(--space-6)] flex flex-col gap-8 md:flex-row md:items-start">
        {/* ---- left anchor nav ---- */}
        <aside className="top-24 hidden w-48 flex-none md:sticky md:block">
          <nav className="flex flex-col" aria-label="Settings sections">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="py-1.5 text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* ---- sections ---- */}
        <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-8)]">
          {/* ACCOUNT — decorative rows */}
          <section id="account" className="scroll-mt-24">
            <h2 className="font-display text-h3 text-ink">Account info</h2>
            <div className={`mt-3 ${cardClass}`}>
              <div className={rowClass}>
                <div>
                  <p className="text-caption uppercase text-muted">Name</p>
                  <p className="text-body text-ink">Rowan Ellison</p>
                </div>
                <button className={btnClass}>Edit</button>
              </div>
              <div className={rowClass}>
                <div>
                  <p className="text-caption uppercase text-muted">Email</p>
                  <p className="text-body text-ink">rowan@example.com</p>
                </div>
                <button className={btnClass}>Edit</button>
              </div>
              <div className={rowClass}>
                <div>
                  <p className="text-caption uppercase text-muted">Password</p>
                  <p className="text-body text-ink">Last changed 3 months ago</p>
                </div>
                <button className={btnClass}>Change</button>
              </div>
            </div>
          </section>

          {/* NOTIFICATIONS — per-type toggles matching the six B16 types */}
          <section id="notifications" className="scroll-mt-24">
            <h2 className="font-display text-h3 text-ink">Notifications</h2>
            <p className="mt-1 text-body text-muted">
              Per-type. Turn off anything that isn&rsquo;t useful — nothing here is required.
            </p>
            <div className={`mt-3 ${cardClass}`}>
              {NOTIFICATION_TYPES.map((n) => (
                <label key={n.type} className={`${rowClass} cursor-pointer`}>
                  <span className="text-body text-ink">{n.label}</span>
                  <input
                    type="checkbox"
                    checked={notif[n.type]}
                    onChange={(e) => setNotif((s) => ({ ...s, [n.type]: e.target.checked }))}
                    className="h-4 w-4 flex-none accent-accent"
                  />
                </label>
              ))}
            </div>
          </section>

          {/* PAYMENT — Stripe test mode */}
          <section id="payment" className="scroll-mt-24">
            <h2 className="font-display text-h3 text-ink">Payment methods</h2>
            <span className="mt-2 inline-block rounded-pill border border-line bg-ground px-2.5 py-0.5 text-caption text-muted">
              Stripe · TEST MODE — no live charges in this prototype
            </span>
            <div className={`mt-3 ${cardClass}`}>
              <div className={rowClass}>
                <div>
                  <p className="text-body text-ink">Visa ···· 4242</p>
                  <p className="text-caption text-muted">Expires 04/29 · default</p>
                </div>
                <button className={btnClass}>Remove</button>
              </div>
            </div>
            <button className={`mt-3 ${btnClass}`}>＋ Add a card</button>
          </section>

          {/* PRIVACY — profile visibility + public taste identity */}
          <section id="privacy" className="scroll-mt-24">
            <h2 className="font-display text-h3 text-ink">Privacy</h2>
            <div className={`mt-3 ${cardClass}`}>
              <label className={`${rowClass} cursor-pointer`}>
                <span>
                  <span className="block text-body text-ink">Profile visibility</span>
                  <span className="block text-caption text-muted">
                    {profilePublic
                      ? "Public — your name and follows can be found"
                      : "Private — only you can see your profile"}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={profilePublic}
                  onChange={(e) => setProfilePublic(e.target.checked)}
                  aria-label="Make profile public"
                  className="h-4 w-4 flex-none accent-accent"
                />
              </label>
              <label className={`${rowClass} cursor-pointer`}>
                <span>
                  <span className="block text-body text-ink">Public taste identity</span>
                  <span className="block text-caption text-muted">
                    Off by default. Shows the makers and crafts you gravitate toward — never
                    purchases, addresses, or order history.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={tastePublic}
                  onChange={(e) => setTastePublic(e.target.checked)}
                  aria-label="Make taste identity public"
                  className="h-4 w-4 flex-none accent-accent"
                />
              </label>
            </div>
          </section>

          {/* RECOMMENDATIONS — prefs + honest reset + redo onboarding */}
          <section id="recs" className="scroll-mt-24">
            <h2 className="font-display text-h3 text-ink">Recommendation preferences</h2>
            <div className={`mt-3 ${cardClass}`}>
              <div className={rowClass}>
                <span className="text-body text-muted">Taste you told us</span>
                <span className="text-body text-ink">
                  {session.prefs.vibes.length > 0 ? session.prefs.vibes.join(" · ") : "Not set"}
                </span>
              </div>
              <div className={rowClass}>
                <span className="text-body text-muted">Comfortable spend</span>
                <span className="text-body text-ink">{session.prefs.budget ?? "Not set"}</span>
              </div>
              <div className={rowClass}>
                <span className="text-body text-muted">Roughly where</span>
                <span className="text-body text-ink">{session.prefs.location ?? "Not set"}</span>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body text-ink">Reset what KOL has learned</p>
                  <p className="text-caption text-muted">
                    In this prototype that means clearing your follows and saves — that&rsquo;s
                    all it has learned about you here.
                  </p>
                </div>
                {resetStage === "idle" && (
                  <button onClick={() => setResetStage("confirm")} className={btnClass}>
                    Reset
                  </button>
                )}
                {resetStage === "confirm" && (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-caption text-muted">
                      Clears {session.follows.length} follows + {session.saves.length} saves.
                      Sure?
                    </span>
                    <button
                      onClick={resetLearned}
                      className="rounded-pill bg-accent px-4 py-1.5 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
                    >
                      Yes, reset
                    </button>
                    <button onClick={() => setResetStage("idle")} className={btnClass}>
                      Keep it
                    </button>
                  </span>
                )}
                {resetStage === "done" && (
                  <span className="text-caption text-muted" role="status">
                    Done — the feed starts fresh from here.
                  </span>
                )}
              </div>
            </div>

            <Link href="/welcome" className={`mt-3 inline-block ${btnClass}`}>
              Redo onboarding →
            </Link>
          </section>

          {/* COMMUNITY PERMISSIONS */}
          <section id="community" className="scroll-mt-24">
            <h2 className="font-display text-h3 text-ink">Community permissions</h2>
            <div className={`mt-3 ${cardClass}`}>
              <div className={rowClass}>
                <label htmlFor="who-can-message" className="text-body text-ink">
                  Who can message me
                </label>
                <select
                  id="who-can-message"
                  defaultValue="Makers I follow"
                  className="rounded-sm border border-line bg-surface px-3 py-1.5 text-body text-ink focus:border-accent focus:outline-none"
                >
                  <option>Makers I follow</option>
                  <option>Any verified maker</option>
                  <option>No one</option>
                </select>
              </div>
              <label className={`${rowClass} cursor-pointer`}>
                <span className="text-body text-ink">
                  Let makers @mention me in their community
                </span>
                <input type="checkbox" defaultChecked className="h-4 w-4 flex-none accent-accent" />
              </label>
            </div>
          </section>

          {/* YOUR DATA — decorative export/delete */}
          <section id="data" className="scroll-mt-24">
            <h2 className="font-display text-h3 text-ink">Your data</h2>
            <div className={`mt-3 ${cardClass}`}>
              <div className={rowClass}>
                <div>
                  <p className="text-body text-ink">Export your data</p>
                  <p className="text-caption text-muted">
                    A copy of your profile, orders, and messages.
                  </p>
                </div>
                <button className={btnClass}>Request export</button>
              </div>
              <div className={rowClass}>
                <div>
                  <p className="text-body text-ink">Delete your account</p>
                  <p className="text-caption text-muted">
                    Permanent. We&rsquo;ll ask you to confirm.
                  </p>
                </div>
                <button className={btnClass}>Delete…</button>
              </div>
            </div>
          </section>

          {/* designer's note — why this page is plain on purpose */}
          <section className="rounded-lg border border-dashed border-line p-4">
            <p className="text-caption uppercase text-muted">Designer&rsquo;s note</p>
            <p className="mt-1 max-w-measure text-body text-muted">
              This surface is deliberately plain, legible, and unglamorous — no film, no colour
              blocks, no motion drama. Settings is hygiene: people arrive to flip one switch and
              leave. Making it &ldquo;beautiful&rdquo; would fight that job and add cost for
              zero mission value. Restraint here is the correct craft.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
