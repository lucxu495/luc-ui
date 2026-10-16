"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import { cn } from "../utils/cn";

export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps extends Omit<React.ComponentPropsWithRef<typeof RadixTooltip.Root>, "children"> {
  content: React.ReactNode;
  children: React.ReactNode;
  /** Render a small pointer arrow. Default `true`. */
  arrow?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
  /** Extra content under the label, e.g. a keyboard hint. */
  hint?: React.ReactNode;
}

// LUC Tooltip.
//
// Sits on an overlay surface with a hairline and a soft shadow — never the
// browser's native tooltip. Enter/exit are direction aware so the tip reads as
// coming *from* its trigger.
export function Tooltip({
  content,
  children,
  arrow = true,
  side = "top",
  align = "center",
  sideOffset = 7,
  className,
  hint,
  ...props
}: TooltipProps) {
  return (
    <RadixTooltip.Root delayDuration={220} {...props}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          data-slot="tooltip"
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-[var(--z-tooltip)] max-w-64 select-none",
            "rounded-sm border border-line-default bg-surface-overlay px-2 py-1.5",
            "text-caption text-fg-primary luc-float",
            "data-[side=top]:[&[data-state=delayed-open]]:animate-[luc-tip-in-top_var(--motion-fast)_var(--ease-enter)]",
            "data-[side=bottom]:[&[data-state=delayed-open]]:animate-[luc-tip-in-bottom_var(--motion-fast)_var(--ease-enter)]",
            "data-[side=left]:[&[data-state=delayed-open]]:animate-[luc-tip-in-left_var(--motion-fast)_var(--ease-enter)]",
            "data-[side=right]:[&[data-state=delayed-open]]:animate-[luc-tip-in-right_var(--motion-fast)_var(--ease-enter)]",
            className,
          )}
          {...props}
        >
          <span className="flex items-center gap-2">
            {content}
            {hint ? (
              <kbd className="rounded-xs border border-line-default bg-surface-interactive px-1 py-px font-mono text-micro text-fg-muted">
                {hint}
              </kbd>
            ) : null}
          </span>
          {arrow ? (
            <RadixTooltip.Arrow
              width={10}
              height={5}
              style={{ fill: "var(--surface-overlay)", stroke: "var(--line-default)", strokeWidth: 0.5 }}
            />
          ) : null}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
