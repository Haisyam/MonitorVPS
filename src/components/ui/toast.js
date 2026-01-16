import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed right-4 top-4 z-[100] flex max-h-screen w-[360px] flex-col gap-3",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-panel-strong/95 p-4 shadow-2xl ring-1 ring-white/5",
  {
    variants: {
      variant: {
        default: "text-foreground",
        success: "border-success/30 text-foreground",
        warning: "border-warning/30 text-foreground",
        danger: "border-danger/30 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef(({ className, variant, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={cn(toastVariants({ variant }), className)}
    {...props}
  />
));
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-xs text-muted", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

const ToastClose = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "rounded-full border border-border bg-panel/60 px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-panel",
      className
    )}
    {...props}
  >
    Dismiss
  </ToastPrimitives.Close>
));
ToastClose.displayName = "ToastClose";

const ToastAction = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "rounded-full border border-border bg-panel/60 px-3 py-1 text-xs font-semibold text-foreground transition hover:bg-panel",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = "ToastAction";

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
