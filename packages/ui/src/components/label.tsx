"use client";

import { Label as RadixLabel } from "radix-ui";
import { cn } from "../utils/cn";

/**
 * LUC Label — a standalone form label for a control LUC does not own.
 *
 * `Field` already renders the label for a LUC control, and it also wires the id,
 * the description and the error. This component exists for the other case: a
 * third-party control, a custom widget, or a naked checkbox row where the
 * consumer assembles the ARIA itself. Radix gives us the click-to-focus
 * behaviour without an `htmlFor` (which breaks on a composite widget).
 */

export interface LabelProps extends React.ComponentPropsWithRef<typeof RadixLabel.Root> {
  /** Renders the asterisk *and* marks the control as required for a reader. */
  required?: boolean;
  /** Muted, smaller label for a dense toolbar or a settings row. */
  size?: "sm" | "md";
}

export function Label({
  className,
  children,
  required,
  size = "md",
  "aria-disabled": ariaDisabled,
  ...props
}: LabelProps) {
  return (
    <RadixLabel.Root
      data-slot="label"
      aria-disabled={ariaDisabled}
      className={cn(
        "flex w-fit select-none items-center gap-1.5 font-medium text-fg-secondary",
        size === "sm" ? "text-caption" : "text-label",
        ariaDisabled && "text-fg-disabled",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="text-fg-negative">
          *
        </span>
      ) : null}
    </RadixLabel.Root>
  );
}
