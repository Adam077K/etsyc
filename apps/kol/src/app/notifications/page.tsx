"use client";

/**
 * Notifications (B16) — /notifications. The relationship re-entry
 * surface. Rows are maker-attributed and human-voiced ("Sena fired a
 * new batch"), grouped by maker then time, and strictly READ-ONLY:
 * they deep-link but never carry a reply affordance. Unread is a
 * quiet accent dot + slightly stronger surface — never a red count
 * badge, never urgency chrome.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
// Type-only (erased) — the live seam loads lazily in a browser-only effect.
import type { Maker, Notification } from "@/lib/data";
import { useKolSession } from "@/lib/mock/session";
import { Film } from "@/components/chrome/Film";
import { Skeleton } from "@/components/states/Skeleton";

function typeCaption(type: Notification["type"]): string {
  return type.replace(/-/g, " ");
}

type NotificationsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; notifications: Notification[]; makers: Map<string, Maker> };

export default function NotificationsPage() {
  // Read/unread still rides on the local session (buyer_signals stand-in) — the
  // notifications themselves now come from the live seam.
  const session = useKolSession();
  const [state, setState] = useState<NotificationsState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        // Lazy import — browser-only effect, so `@/lib/data` resolves to the
        // browser client and stays out of the SSR module graph.
        const { getData } = await import("@/lib/data");
        const data = getData();
        const [notes, makerList] = await Promise.all([
          data.listNotifications(),
          data.listMakers(),
        ]);
        if (!active) return;
        setState({
          status: "ready",
          notifications: notes,
          makers: new Map(makerList.map((m) => [m.slug, m])),
        });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const notifications = state.status === "ready" ? state.notifications : [];
  const getMaker = (slug: string): Maker | null =>
    state.status === "ready" ? (state.makers.get(slug) ?? null) : null;

  // group by maker (first-appearance order == most-recent-first), then time
  const groups: { slug: string; items: Notification[] }[] = [];
  for (const n of notifications) {
    const g = groups.find((x) => x.slug === n.makerSlug);
    if (g) g.items.push(n);
    else groups.push({ slug: n.makerSlug, items: [n] });
  }

  const isUnread = (n: Notification) => !session.readNotifications.includes(n.id);
  const anyUnread = notifications.some(isUnread);

  return (
    <main className="mx-auto w-full max-w-[900px] px-6 pb-24">
      {/* header */}
      <header className="py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-caption uppercase tracking-[0.08em] text-muted">Notifications</p>
            <h1 className="mt-2 font-display text-h1 text-ink">
              What the makers you follow have been up to
            </h1>
          </div>
          <button
            type="button"
            onClick={() => session.markAllRead(notifications.map((n) => n.id))}
            aria-disabled={!anyUnread || undefined}
            className="min-h-11 rounded-pill border border-line bg-surface px-5 text-caption uppercase tracking-[0.04em] text-ink transition-colors duration-state ease-kol hover:bg-ground aria-disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>

        {/* load-bearing contrast note: one-way, NOT the Inbox */}
        <div className="mt-4 rounded-md border border-dashed border-line bg-surface/60 p-4">
          <p className="max-w-measure text-body text-ink">
            These are <b>maker-voiced</b> — &ldquo;Sena fired a new batch,&rdquo; never
            &ldquo;New product available.&rdquo; They&rsquo;re <b>one-way</b>: read-only
            updates you can tap to open, but not reply to. To write back, open the{" "}
            <Link
              href="/inbox"
              className="border-b border-accent text-ink transition-colors duration-state ease-kol hover:text-accent"
            >
              Inbox
            </Link>{/* inline prose link — exempt from the 44px target rule */}{" "}
            — that&rsquo;s where conversation lives.
          </p>
        </div>
      </header>

      {state.status === "loading" ? (
        /* loading — quiet skeleton rows, never a spinner */
        <section aria-hidden="true" className="mt-8 overflow-hidden rounded-md border border-line shadow-subtle">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-line" : ""}`}>
              <Skeleton className="h-2 w-2 rounded-pill" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="mt-1.5 h-3 w-1/4" />
              </div>
            </div>
          ))}
        </section>
      ) : state.status === "error" ? (
        <section className="mt-8 rounded-md border border-line bg-surface px-6 py-12 text-center">
          <p className="text-caption uppercase text-muted">Couldn’t load your updates</p>
          <p className="mx-auto mt-2 max-w-measure text-body text-ink">
            Something went wrong reaching your notifications. Refresh the page to try again.
          </p>
        </section>
      ) : notifications.length === 0 ? (
        /* designed first-run empty state — never a blank page */
        <section
          aria-label="Nothing yet"
          className="rounded-lg border border-dashed border-line bg-surface/60 px-6 py-14 text-center"
        >
          <p className="font-display text-h3 text-ink">Nothing yet — and that&rsquo;s fine</p>
          <p className="mx-auto mt-3 max-w-measure text-body text-muted">
            Follow a maker or place a commission, and this is where you&rsquo;ll see them come
            back to you — a new batch out of the kiln, a reply on your draft, your order on
            its way.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 text-body font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
            >
              Find a maker to follow
            </Link>
            <Link
              href="/me/collections"
              className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-6 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
            >
              See your saves
            </Link>
          </div>
        </section>
      ) : (
        groups.map(({ slug, items }) => {
          const maker = getMaker(slug);
          return (
            <section key={slug} aria-label={`Updates from ${maker?.name ?? slug}`} className="mt-8">
              {/* maker header */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/m/${slug}`}
                  aria-label={`Open ${maker?.name ?? slug}’s world`}
                  className="flex-none"
                >
                  <Film
                    variant={maker?.filmClass ?? "v1"}
                    aspect="square"
                    play={false}
                    rounded={false}
                    className="w-11 rounded-pill shadow-none"
                  />
                </Link>
                <div>
                  <p className="text-body font-semibold text-ink">
                    {maker?.name ?? slug}
                    {maker?.verified ? (
                      <span className="ml-2 rounded-pill border border-line bg-surface px-2 py-0.5 text-caption text-muted">
                        ✓ Real Maker
                      </span>
                    ) : null}
                  </p>
                  {maker ? (
                    <p className="text-caption text-muted">
                      {maker.craft} · {maker.location}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* rows — read-only, deep-link only, no reply affordance */}
              <div className="mt-3 overflow-hidden rounded-md border border-line shadow-subtle">
                {items.map((n, i) => {
                  const unread = isUnread(n);
                  const opensInInbox = n.deepLink.startsWith("/inbox");
                  return (
                    <Link
                      key={n.id}
                      href={n.deepLink}
                      onClick={() => session.markRead(n.id)}
                      className={`flex items-baseline justify-between gap-4 p-4 transition-colors duration-state ease-kol hover:bg-ground ${
                        i > 0 ? "border-t border-line" : ""
                      } ${unread ? "bg-surface" : "bg-surface/50"}`}
                    >
                      <span className="flex min-w-0 items-baseline gap-3">
                        {unread ? (
                          <span
                            aria-label="unread"
                            className="inline-block h-2 w-2 flex-none translate-y-[-1px] rounded-pill bg-accent"
                          />
                        ) : null}
                        <span className="min-w-0">
                          <span
                            className={`block text-body ${
                              unread ? "font-semibold text-ink" : "text-muted"
                            }`}
                          >
                            {n.line}
                            {opensInInbox ? (
                              <span className="ml-2 text-caption font-normal text-muted">
                                opens in Inbox →
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block text-caption uppercase tracking-[0.04em] text-muted">
                            {typeCaption(n.type)}
                          </span>
                        </span>
                      </span>
                      <span className="flex-none text-caption text-muted">{n.when}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
