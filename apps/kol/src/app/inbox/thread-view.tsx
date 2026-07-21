"use client";

/**
 * ThreadView — the shared conversation renderer for Inbox (P15).
 * Used by /inbox (right pane, md+) and /inbox/[thread] (full width).
 * Threads are 1:1 buyer ↔ maker only; two-way, human-authored,
 * persistent, repliable — the deliberate opposite of Notifications.
 */

import { useState } from "react";
import Link from "next/link";
import { getMaker, type MockMessage, type MockThread, type ThreadType } from "@/lib/mock/db";
import { Film } from "@/components/chrome/Film";

export const THREAD_TYPE_LABEL: Record<ThreadType, string> = {
  commission: "Commission",
  question: "Product question",
  order: "Order-related",
};

const WAVE_HEIGHTS = [8, 16, 11, 20, 9, 14, 6, 18, 10, 13];

function Waveform({ bars = WAVE_HEIGHTS }: { bars?: number[] }) {
  return (
    <span aria-hidden className="flex items-center gap-[3px]">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-pill bg-accent"
          style={{ height: `${h}px` }}
        />
      ))}
    </span>
  );
}

function DraftCard({
  message,
  makerSlug,
  makerName,
  filmClass,
}: {
  message: MockMessage;
  makerSlug: string;
  makerName: string;
  filmClass: "v1" | "v2" | "v3" | "v4" | "v5";
}) {
  const latest = message.draftVersion ?? 1;
  const [rev, setRev] = useState<number>(latest);
  const versions = Array.from({ length: latest }, (_, i) => i + 1);

  return (
    <div className="mt-1 overflow-hidden rounded-md border border-line bg-surface shadow-subtle">
      <Film variant={filmClass} aspect="wide" rounded={false}>
        <p className="text-caption uppercase opacity-85">Draft · shared in this thread</p>
        <p className="font-display text-h3 font-bold">
          {rev === latest ? message.body : `Draft v${rev} — earlier revision`}
        </p>
      </Film>
      <div className="p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Draft revisions">
          {versions.map((v) => {
            const current = v === rev;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={current}
                onClick={() => setRev(v)}
                className={`rounded-pill border px-3 py-1 text-caption uppercase tracking-[0.04em] transition-colors duration-state ease-kol ${
                  current
                    ? "border-transparent bg-accent text-accent-ink"
                    : "border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                v{v}
                {v === latest ? " · current" : ""}
              </button>
            );
          })}
        </div>
        {rev !== latest ? (
          <p className="mt-2 text-caption text-muted">
            Superseded by v{latest} — kept so the whole conversation stays visible.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-caption uppercase tracking-[0.04em] text-muted">
            Shared draft · lives in the commission
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/m/${makerSlug}/create`}
              className="rounded-pill border border-line bg-surface px-4 py-2 text-caption uppercase tracking-[0.04em] text-ink transition-colors duration-state ease-kol hover:bg-ground"
            >
              Open commission
            </Link>
            <button
              type="button"
              className="rounded-pill bg-accent-cta px-5 py-2 text-body font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
            >
              Approve v{latest}
            </button>
          </div>
        </div>
        <p className="mt-2 text-caption text-muted">
          Approval is explicit and tied to this exact revision — nothing is made until{" "}
          {makerName} hears yes.
        </p>
      </div>
    </div>
  );
}

function Message({
  message,
  makerName,
  makerSlug,
  filmClass,
}: {
  message: MockMessage;
  makerName: string;
  makerSlug: string;
  filmClass: "v1" | "v2" | "v3" | "v4" | "v5";
}) {
  if (message.from === "you") {
    return (
      <div className="ml-auto max-w-[60ch]">
        <p className="text-right text-caption uppercase tracking-[0.04em] text-muted">
          You · {message.when}
        </p>
        <div className="mt-1 rounded-md bg-accent-cta p-4 text-body text-accent-ink shadow-subtle">
          {message.body}
        </div>
      </div>
    );
  }

  if (message.kind === "audio") {
    const duration = message.body.match(/\((\d+:\d+)\)\s*$/)?.[1] ?? null;
    return (
      <div className="max-w-[60ch]">
        <p className="text-caption uppercase tracking-[0.04em] text-muted">
          {makerName} · {message.when} · voice message
        </p>
        <div className="mt-1 rounded-md border border-line bg-surface p-4 shadow-subtle">
          <button
            type="button"
            className="flex min-h-11 items-center gap-3 rounded-pill border border-line bg-ground px-4 py-2 transition-colors duration-state ease-kol hover:bg-surface"
          >
            <span className="grid h-8 w-8 flex-none place-items-center rounded-pill bg-accent text-caption text-accent-ink">
              ▶
            </span>
            <Waveform />
            {duration ? <span className="font-mono text-caption text-muted">{duration}</span> : null}
          </button>
          <p className="mt-2 text-caption text-muted">{message.body}</p>
        </div>
      </div>
    );
  }

  if (message.kind === "draft") {
    return (
      <div className="max-w-[60ch]">
        <p className="text-caption uppercase tracking-[0.04em] text-muted">
          {makerName} · {message.when} · shared a draft
        </p>
        <DraftCard
          message={message}
          makerSlug={makerSlug}
          makerName={makerName}
          filmClass={filmClass}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[60ch]">
      <p className="text-caption uppercase tracking-[0.04em] text-muted">
        {makerName} · {message.when}
      </p>
      <div className="mt-1 rounded-md border border-line bg-surface p-4 text-body text-ink shadow-subtle">
        {message.body}
      </div>
    </div>
  );
}

export function ThreadView({ thread }: { thread: MockThread }) {
  const maker = getMaker(thread.makerSlug);
  const makerName = maker?.name ?? thread.makerSlug;
  const filmClass = maker?.filmClass ?? "v1";

  return (
    <section
      aria-label={`Conversation with ${makerName}`}
      className="rounded-md border border-line bg-surface p-5 shadow-card"
    >
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <Film
            variant={filmClass}
            aspect="square"
            play={false}
            rounded={false}
            className="w-11 flex-none rounded-pill shadow-none"
          />
          <div>
            <p className="text-body font-semibold text-ink">
              {makerName}
              {maker?.verified ? (
                <span className="ml-2 rounded-pill border border-line bg-ground px-2 py-0.5 text-caption text-muted">
                  ✓ Real Maker
                </span>
              ) : null}
            </p>
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              {THREAD_TYPE_LABEL[thread.type]}
              {maker ? ` · ${maker.craft}` : ""} · this thread is just you two
            </p>
          </div>
        </div>
        {thread.type === "commission" ? (
          <Link
            href={`/m/${thread.makerSlug}/create`}
            className="rounded-pill border border-line bg-ground px-4 py-1.5 text-caption uppercase tracking-[0.04em] text-ink transition-colors duration-state ease-kol hover:bg-surface"
          >
            Open commission
          </Link>
        ) : null}
      </div>

      {/* messages */}
      <div className="flex flex-col gap-5 py-5">
        <p className="text-center text-caption text-muted">{thread.subject}</p>
        {thread.messages.map((m, i) => (
          <Message
            key={i}
            message={m}
            makerName={makerName}
            makerSlug={thread.makerSlug}
            filmClass={filmClass}
          />
        ))}
      </div>

      {/* composer — proof this surface is repliable */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <input
          aria-label={`Reply to ${makerName}`}
          placeholder={`Reply to ${makerName}…`}
          className="min-h-11 min-w-0 flex-1 rounded-pill border border-line bg-ground px-4 font-text text-body text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button
          type="button"
          aria-label="Record a voice reply"
          className="flex min-h-11 items-center gap-2 rounded-pill border border-line bg-ground px-4 text-caption uppercase tracking-[0.04em] text-ink transition-colors duration-state ease-kol hover:bg-surface"
        >
          <Waveform bars={[6, 12, 8, 14, 5]} />
          Record
        </button>
        <button
          type="button"
          className="min-h-11 rounded-pill bg-accent-cta px-6 text-body font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
        >
          Send
        </button>
      </div>
    </section>
  );
}
