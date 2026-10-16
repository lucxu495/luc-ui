"use client";

import { Toolbar as RadixToolbar } from "radix-ui";
import { cn } from "../utils/cn";

/**
 * LUC ButtonGroup / Toolbar — actions that belong to each other.
 *
 * `ButtonGroup` is layout and one joint: the children keep their own variants,
 * the group removes the doubled border between neighbours and squares the inner
 * corners, so a row of three actions reads as one control with three parts
 * rather than three controls that happen to touch. It does **not** restyle the
 * buttons — a `danger` button in a group must still look dangerous.
 *
 * `Toolbar` is the keyboard contract on top: one tab stop for the whole strip,
 * arrow keys between the controls (Radix's roving focus), Home/End, and a
 * `role="toolbar"` that needs a label. That is the difference between a toolbar
 * and a `div` with buttons in it — a screen-reader user should not have to press
 * Tab eleven times to cross a formatting strip.
 */

export interface ButtonGroupProps extends React.ComponentPropsWithRef<"div"> {
  /** Stack vertically. Default `false`. */
  vertical?: boolean;
  /** Attach the group to a `Field`'s accessible description. */
  "aria-describedby"?: string;
}

export function ButtonGroup({ className, vertical = false, ...props }: ButtonGroupProps) {
  return (
    <div
      data-slot="button-group"
      role="group"
      className={cn(
        "inline-flex",
        vertical ? "flex-col" : "flex-row",
        /*
         * The joint. Neighbouring borders collapse, outer corners stay round and
         * the middle ones go square — done with logical properties so an RTL
         * layout is correct without a second rule set.
         */
        "[&>*]:relative [&>*]:z-0",
        "[&>*+*]:z-[1]",
        vertical
          ? "[&>*+*]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none"
          : "[&>*+*]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none",
        className,
      )}
      {...props}
    />
  );
}

/** A hairline divider for a mixed group (a button, then a menu). */
export function ButtonGroupSeparator({ className, ...props }: React.ComponentPropsWithRef<"span">) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      data-slot="button-group-separator"
      className={cn("mx-0.5 w-px shrink-0 self-stretch bg-line-subtle", className)}
      {...props}
    />
  );
}

export type ToolbarProps = React.ComponentPropsWithRef<typeof RadixToolbar.Root>;

/**
 * A toolbar is one tab stop. `label` is required by the type because an unnamed
 * `role="toolbar"` is a real accessibility defect, not a stylistic one.
 */
export function Toolbar({ className, label, ...props }: ToolbarProps & { label: string }) {
  return (
    <RadixToolbar.Root
      data-slot="toolbar"
      aria-label={label}
      className={cn(
        "flex items-center gap-1 rounded-lg border border-line-subtle bg-surface-default p-1 shadow-rest",
        className,
      )}
      {...props}
    />
  );
}

export type ToolbarButtonProps = React.ComponentPropsWithRef<typeof RadixToolbar.Button>;
export const ToolbarButton = RadixToolbar.Button;
export const ToolbarSeparator = RadixToolbar.Separator;
export const ToolbarLink = RadixToolbar.Link;
export const ToolbarToggleGroup = RadixToolbar.ToggleGroup;
export const ToolbarToggleItem = RadixToolbar.ToggleItem;
