"use client";

/**
 * Inbox (P15) — /inbox. Two-pane on md+ (thread list + selected
 * conversation); list-only below md, where each thread links to
 * /inbox/[thread]. Threads are typed (commission | question | order)
 * and 1:1 buyer ↔ maker only. Unread is a quiet accent dot — never
 * a red count badge.
 */

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { getMaker, threads } from "@/lib/mock/db";
import { Film } from "@/components/chrome/Film";
import { ThreadView, THREAD_TYPE_LABEL } from "./thread-view";

export default function InboxPage() {
  const first = threads[0];
  const [selectedId, setSelectedId] = useState<string | null>(first?.id ?? null);
  const selected = threads.find((t) => t.id === selectedId) ?? first;

  // On md+ the list drives the right pane; below md the link navigates.
  function handleSelect(e: MouseEvent<HTMLAnchorElement>, id: string) {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      e.preventDefault();
      setSelectedId(id);
    }
  }

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-24">
      {/* header + the deliberate contrast note */}
      <header className="flex flex-wrap items-start justify-between gap-4 py-10">
        <div>
          <p className="text-caption uppercase tracking-[0.08em] text-muted">
            Inbox · your conversations
          </p>
          <h1 className="mt-2 font-display text-h1 text-ink">Talk to the maker directly.</h1>
        </div>
        <div className="max-w-[40ch] rounded-md border border-line bg-surface p-4 shadow-subtle">
          <p className="text-caption uppercase tracking-[0.04em] text-accent-2">
            Not to be confused with Notifications
          </p>
          <p className="mt-1 text-body text-ink">
            Notifications are one-way pings the system sends you.{" "}
            <b>Inbox is the opposite</b>: two-way, written by a real person, kept forever, and
            you can reply.
          </p>
        </div>
      </header>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* thread list */}
        <aside
          aria-label="Conversations"
          className="overflow-hidden rounded-md border border-line bg-surface shadow-subtle"
        >
          {threads.map((t, i) => {
            const maker = getMaker(t.makerSlug);
            const active = selected?.id === t.id;
            const last = t.messages[t.messages.length - 1];
            return (
              <Link
                key={t.id}
                href={`/inbox/${t.id}`}
                onClick={(e) => handleSelect(e, t.id)}
                aria-current={active ? "true" : undefined}
                className={`block p-4 transition-colors duration-state ease-kol hover:bg-ground ${
                  i > 0 ? "border-t border-line" : ""
                } ${active ? "md:bg-ground" : ""}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="rounded-pill border border-line bg-ground px-2.5 py-0.5 text-caption uppercase tracking-[0.06em] text-muted">
                    {THREAD_TYPE_LABEL[t.type]}
                  </span>
                  <span className="flex items-center gap-2">
                    {t.unread ? (
                      <span
                        aria-label="unread"
                        className="inline-block h-2 w-2 rounded-pill bg-accent"
                      />
                    ) : null}
                    <span className="text-caption text-muted">
                      {last?.when ?? ""}
                    </span>
                  </span>
                </span>
                <span className="mt-2 flex items-center gap-3">
                  <Film
                    variant={maker?.filmClass ?? "v1"}
                    aspect="square"
                    play={false}
                    rounded={false}
                    className="w-10 flex-none rounded-pill shadow-none"
                  />
                  <span className="min-w-0">
                    <span
                      className={`block text-body text-ink ${t.unread ? "font-semibold" : ""}`}
                    >
                      {maker?.name ?? t.makerSlug}
                    </span>
                    <span className="block truncate text-caption text-muted">{t.subject}</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </aside>

        {/* conversation pane — md+ only; below md, threads open their own route */}
        <div className="hidden md:block">
          {selected ? (
            <ThreadView key={selected.id} thread={selected} />
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-surface/60 px-6 py-12 text-center">
              <p className="font-display text-h3 text-ink">No conversations yet</p>
              <p className="mx-auto mt-2 max-w-measure text-body text-muted">
                Ask a maker a question or start a commission, and the whole back-and-forth
                lives here — yours to keep.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
