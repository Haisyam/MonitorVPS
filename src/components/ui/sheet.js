import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;

const SheetPortal = Dialog.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

const SheetContent = React.forwardRef(({ className, side = "left", ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed z-50 h-full w-[85vw] max-w-xs border border-border bg-panel-strong/95 p-6 shadow-2xl",
        side === "left" && "left-0 top-0",
        side === "right" && "right-0 top-0",
        className
      )}
      {...props}
    />
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }) => (
  <div className={cn("mb-6 space-y-2", className)} {...props} />
);

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <Dialog.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
SheetTitle.displayName = "SheetTitle";

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <Dialog.Description ref={ref} className={cn("text-sm text-muted", className)} {...props} />
));
SheetDescription.displayName = "SheetDescription";

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
};
