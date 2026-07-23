import { Skeleton } from "@/components/states/Skeleton";

/** Layout-matched skeleton for the pieces ledger — never a bare spinner. */
export default function ProductListLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[var(--space-4)] px-[var(--space-2)] py-[var(--space-4)] md:px-[var(--space-6)]"
      aria-busy="true"
    >
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-16 w-72 max-w-full" />
        <Skeleton className="h-11 w-32 rounded-pill" />
      </div>
      <div className="flex flex-col">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex items-baseline gap-6 border-t border-line py-5 last:border-b"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-56 max-w-full" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="hidden h-6 w-24 rounded-pill sm:block" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
      <p className="sr-only" role="status">
        Loading your pieces
      </p>
    </main>
  );
}
