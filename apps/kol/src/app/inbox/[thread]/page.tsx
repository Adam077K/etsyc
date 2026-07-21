/**
 * Inbox thread (P15) — /inbox/[thread]. Full-width conversation view
 * for a single 1:1 thread; the small-screen destination for the
 * two-pane /inbox list. Same renderer (ThreadView) as the pane.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { threads } from "@/lib/mock/db";
import { ThreadView } from "../thread-view";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ thread: string }>;
}) {
  const { thread: threadId } = await params;
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) notFound();

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
        <ThreadView thread={thread} />
      </div>
    </main>
  );
}
