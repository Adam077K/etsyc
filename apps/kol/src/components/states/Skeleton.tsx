import { cn } from "@/lib/utils";

/**
 * Layout-matched skeleton unit (block catalog cross-cutting rules: loading is
 * a skeleton matched to the real layout, NEVER a centered spinner; space is
 * reserved so nothing shifts on resolve). Shimmer is an opacity pulse only —
 * static under prefers-reduced-motion (globals.css).
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("kol-skeleton rounded-sm", className)}
      {...props}
    />
  );
}

/** Shimmer text lines matched to realistic line lengths (catalog: craft-story loading). */
export function SkeletonLines({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  // Deterministic ragged-right widths — real paragraphs don't end flush.
  const widths = ["100%", "94%", "88%", "97%", "62%"];
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: widths[(i === lines - 1 ? 4 : i) % widths.length] }}
        />
      ))}
    </div>
  );
}
