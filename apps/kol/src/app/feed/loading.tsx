import { FeedMagazineSkeleton } from "@/components/feed/FeedMagazine";
import { Skeleton } from "@/components/states/Skeleton";

/**
 * Route-level loading state (W3-B1b — screen-specs §1.5): the spread
 * geometry paints immediately, skeletons at the exact slot aspects, no
 * spinner, no CLS — the shell classes mirror page.tsx exactly so nothing
 * shifts when the selection resolves.
 */
export default function FeedLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[var(--space-4)] px-[var(--space-2)] py-[var(--space-4)] md:px-[var(--space-6)]">
      <div className="flex items-center justify-end" aria-hidden="true">
        {/* account strip placeholder at the signed-out strip's height */}
        <Skeleton className="h-4 w-16" />
      </div>
      <FeedMagazineSkeleton />
    </main>
  );
}
