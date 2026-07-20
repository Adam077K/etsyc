"use client";

import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Quiet, inline, recoverable error (block catalog cross-cutting rules) —
 * spoken in the interface's voice, never a blocking wall, never chrome that
 * competes with the maker's film.
 */
export function ErrorInline({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 text-body text-muted",
        className,
      )}
    >
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-pill px-3 py-1 font-text text-caption uppercase tracking-[0.04em] text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
