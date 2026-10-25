import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
        secondary:
          "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        destructive:
          "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
        warning:
          "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
        success:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
        info:
          "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300",
        outline:
          "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
