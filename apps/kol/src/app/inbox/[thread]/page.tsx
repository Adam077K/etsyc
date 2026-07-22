"use client";

/**
 * Inbox thread (P15) — /inbox/[thread]. Full-width conversation view
 * for a single 1:1 thread; the small-screen destination for the
 * two-pane /inbox list. Same renderer (ThreadView) as the pane.
 *
 * Client component so the live data seam is loaded lazily inside a
 * browser-only effect (never a static import), matching the reference
 * pattern in src/app/page.tsx.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Maker, Thread } from "@/lib/data";
import { Skeleton } from "@/components/states/Skeleton";
import { ThreadView } from "../thread-view";

type ThreadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "missing" }
  | { status: "ready"; thread: Thread; maker: Maker | null };

export default function ThreadPage({
  params,
}: {
  params: Promise<{ thread: string }>;
}) {
  const { thread: threadId } = use(params);
  const [state, setState] = useState<ThreadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        // Lazy import — useEffect is browser-only, so `@/lib/data` resolves to
        // the browser client and never enters the SSR module graph.
        const { getData } = await import("@/lib/data");
        const data = getData();
        const thread = await data.getThread(threadId);
        if (!active) return;
        if (!thread) {
          setState({ status: "missing" });
          return;
        }
        const maker = await data.getMaker(thread.makerSlug);
        if (!active) return;
        setState({ status: "ready", thread, maker });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, [threadId]);

  if (state.status === "missing") notFound();

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-24">
      <div className="py-8">
        <Link
          href="/inbox"
          className="text-caption uppercase tracking-[0.08em] text-muted transition-colors duration-state ease-kol hover:text-ink"
        >
          ← All conversations
        </Link>
      </div>
      <div className="mx-auto max-w-[840px]">
        {state.status === "loading" ? (
          <div className="rounded-md border border-line bg-surface p-5 shadow-card">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-4 h-40 rounded-md" />
          </div>
        ) : state.status === "error" ? (
          <div className="rounded-md border border-line bg-surface px-6 py-12 text-center">
            <p className="text-caption uppercase text-muted">Couldn’t load this conversation</p>
            <p className="mx-auto mt-2 max-w-measure text-body text-ink">
              Something went wrong reaching this thread. Refresh the page to try again.
            </p>
          </div>
        ) : state.status === "ready" ? (
          <ThreadView thread={state.thread} maker={state.maker} />
        ) : null}
      </div>
    </main>
  );
}
