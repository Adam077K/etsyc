import { cn } from "@/lib/utils";

/**
 * Empty-as-invitation (block catalog: "Empty ≠ blank"). Live worlds omit
 * truly-empty optional blocks; this ghost prompt is the SELLER-PREVIEW state,
 * tied to the interview beat that fills the block.
 */
export function EmptyPrompt({
  prompt,
  hint,
  className,
}: {
  prompt: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border border-dashed border-line bg-surface/60 px-6 py-8",
        className,
      )}
    >
      <p className="font-display text-h3 text-muted">{prompt}</p>
      {hint ? <p className="max-w-measure text-body text-muted/80">{hint}</p> : null}
    </div>
  );
}
