"use client";

import { HoverCard as RadixHoverCard } from "radix-ui";
import { cn } from "../utils/cn";

/**
 * LUC HoverCard — a rich preview on hover, for a *pointer*.
 *
 * The distinction from Tooltip is the whole reason this exists:
 *
 *   Tooltip    a short label for one control      ~500ms, keyboard-focusable
 *   HoverCard  a preview with content and actions ~700ms, pointer only
 *
 * A HoverCard is never the only way to reach its content: the trigger is
 * focusable and the card follows focus, and anything the card offers must also
 * exist on the page it previews. That is why `openDelay` defaults high — a
 * preview that fires while the pointer crosses a list is worse than none.
 */

export const HoverCard = RadixHoverCard.Root;
export const HoverCardTrigger = RadixHoverCard.Trigger;
export const HoverCardPortal = RadixHoverCard.Portal;

export interface HoverCardContentProps
  extends React.ComponentPropsWithRef<typeof RadixHoverCard.Content> {
  width?: "sm" | "md" | "lg";
}

const widthClass = { sm: "w-64", md: "w-80", lg: "w-96" } as const;

export function HoverCardContent({
  className,
  width = "md",
  align = "center",
  sideOffset = 8,
  ...props
}: HoverCardContentProps) {
  return (
    <RadixHoverCard.Portal>
      <RadixHoverCard.Content
        data-slot="hover-card"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-popover)] overflow-hidden rounded-lg border border-line-default p-4 text-fg-primary",
          "bg-surface-overlay luc-float luc-settle",
          "origin-[var(--radix-hover-card-content-transform-origin)]",
          "data-[state=open]:animate-[luc-anchored-in_var(--motion-fast)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-anchored-out_var(--motion-fast)_var(--ease-exit)]",
          widthClass[width],
          className,
        )}
        {...props}
      />
    </RadixHoverCard.Portal>
  );
}
