import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn badge re-mapped to KOL tokens. Caption type role, pill radius.
 * Color is never the only state indicator — badges always carry text.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-text text-caption uppercase tracking-[0.04em]",
  {
    variants: {
      variant: {
        outline: "border-line bg-surface text-muted",
        accent: "border-transparent bg-accent-cta text-accent-ink",
        ink: "border-transparent bg-ink text-ground",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
