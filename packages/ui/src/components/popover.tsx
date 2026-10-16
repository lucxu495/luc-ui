"use client";

import { Popover as RadixPopover } from "radix-ui";
import { cn } from "../utils/cn";

export const PopoverRoot = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;
export const PopoverClose = RadixPopover.Close;

export interface PopoverContentProps
  extends React.ComponentPropsWithRef<typeof RadixPopover.Content> {
  /** Width preset. `auto` lets the content define its own size. */
  width?: "auto" | "sm" | "md" | "lg";
}

const widthClass = {
  auto: "",
  sm: "w-64",
  md: "w-80",
  lg: "w-[26rem]",
} as const;

/**
 * LUC Popover surface. Layout only — compose with `Stack`/`Section` inside.
 * Enter/exit use the shared overlay keyframes so every floating surface in LUC
 * UI arrives the same way.
 */
export function PopoverContent({
  className,
  width = "auto",
  sideOffset = 6,
  align = "center",
  ...props
}: PopoverContentProps) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        data-slot="popover"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-popover)] origin-[var(--radix-popover-content-transform-origin)]",
          "rounded-lg border border-line-default bg-surface-overlay p-3 text-fg-primary luc-float luc-settle",
          "data-[state=open]:animate-[luc-anchored-in_var(--motion-normal)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]",
          widthClass[width],
          className,
        )}
        {...props}
      />
    </RadixPopover.Portal>
  );
}
