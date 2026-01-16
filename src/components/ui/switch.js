import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border bg-panel transition-colors data-[state=checked]:bg-accent",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-foreground transition-transform data-[state=checked]:translate-x-[1.35rem]"
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = "Switch";

export { Switch };
