import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn button re-mapped to KOL tokens — accent/ground/ink instead of the
 * stock --primary/--secondary set. Pill radius is the Faire/Cuberto shared
 * modern signal (design-system §1.3); tap feedback is the §4.1 tactile
 * scale-[0.98] on :active. 44px minimum touch target.
 */
const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-pill font-text text-body font-medium transition-[color,background-color,transform] duration-state ease-kol focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** The one high-emphasis accent action per world (e.g. add-to-cart). */
        accent: "bg-accent text-accent-ink hover:bg-accent/90",
        /** Quiet default — relationship, not conversion pressure. */
        quiet: "border border-line bg-surface text-ink hover:bg-ground",
        /** Ghost for chrome inside media/colored grounds; inherits ink. */
        ghost: "text-current hover:bg-ink/5",
      },
      size: {
        default: "px-6 py-2.5",
        sm: "px-4 py-2 text-caption uppercase tracking-[0.04em]",
        lg: "px-8 py-3 text-body-lg",
      },
    },
    defaultVariants: { variant: "quiet", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
