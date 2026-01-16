import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-panel text-foreground",
        success: "bg-success/20 text-success border-success/30",
        warning: "bg-warning/20 text-warning border-warning/30",
        danger: "bg-danger/20 text-danger border-danger/30",
        info: "bg-accent/20 text-accent border-accent/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />
));
Badge.displayName = "Badge";

export { Badge, badgeVariants };
