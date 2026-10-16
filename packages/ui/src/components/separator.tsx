"use client";

import { Separator as RadixSeparator } from "radix-ui";
import { cn } from "../utils/cn";

export interface SeparatorProps extends React.ComponentPropsWithRef<typeof RadixSeparator.Root> {
  /** `line` for hairlines, `ornament` for a short centred rule. */
  variant?: "line" | "ornament";
}

export function Separator({ className, orientation = "horizontal", variant = "line", ...props }: SeparatorProps) {
  if (variant === "ornament") {
    return (
      <div
        role="separator"
        data-slot="separator"
        data-orientation={orientation}
        className={cn("flex items-center justify-center gap-3 text-fg-disabled", className)}
        {...props}
      >
        <span className="h-px w-8 bg-line-default" />
        <span className="size-1 rounded-full bg-line-strong" />
        <span className="h-px w-8 bg-line-default" />
      </div>
    );
  }

  return (
    <RadixSeparator.Root
      data-slot="separator"
      decorative={props.decorative ?? true}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line-default",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
