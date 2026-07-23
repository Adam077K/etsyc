import { cn } from "@/lib/utils";

/** Loading state — warm shimmer placeholders in the issue's editorial rhythm. */
const SHAPES = [
  "col-span-2 md:col-span-6 lg:col-span-7 aspect-[4/3] md:aspect-[16/10]",
  "col-span-2 md:col-span-6 lg:col-span-5 aspect-[4/5] md:aspect-[3/4]",
  "col-span-1 md:col-span-3 lg:col-span-4 aspect-[3/4]",
  "col-span-1 md:col-span-3 lg:col-span-4 aspect-square",
  "col-span-1 md:col-span-3 lg:col-span-4 aspect-[5/6]",
  "col-span-2 md:col-span-6 lg:col-span-7 aspect-[4/3] md:aspect-[16/10]",
  "col-span-1 md:col-span-3 lg:col-span-4 aspect-[3/4]",
  "col-span-1 md:col-span-3 lg:col-span-4 aspect-square",
];

export function FeedSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-6 lg:grid-cols-12"
      aria-hidden
    >
      {SHAPES.map((shape, i) => (
        <div
          key={i}
          className={cn(
            "shimmer-sweep rounded-2xl bg-[#3A2E26] ring-1 ring-line",
            shape,
          )}
        />
      ))}
    </div>
  );
}
