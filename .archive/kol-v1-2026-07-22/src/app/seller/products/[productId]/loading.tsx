import { Skeleton, SkeletonLines } from "@/components/states/Skeleton";

/** Layout-matched skeleton for the piece form — never a bare spinner. */
export default function ProductFormLoading() {
  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[var(--space-4)] px-[var(--space-2)] py-[var(--space-4)] md:px-[var(--space-6)]"
      aria-busy="true"
    >
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-16 w-80 max-w-full" />
      <div className="flex w-full max-w-[720px] flex-col gap-[var(--space-4)]">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-11 w-full rounded-md" />
            <SkeletonLines lines={2} />
          </div>
        ))}
        <Skeleton className="h-11 w-36 rounded-pill" />
      </div>
      <p className="sr-only" role="status">
        Loading the piece
      </p>
    </main>
  );
}
