"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as RadixToggle, ToggleGroup as RadixToggleGroup } from "radix-ui";
import { cn } from "../utils/cn";

/**
 * LUC Toggle / ToggleGroup — independent on/off controls.
 *
 * Explicitly *not* `SegmentedControl` with a `multiple` prop. They answer
 * different questions and they must not share a contract:
 *
 *   SegmentedControl  one of N, with a sliding indicator  (a value)
 *   ToggleGroup       any of N, each independently pressed (a set of options)
 *
 * So a ToggleGroup has no sliding thumb, its items keep their own pressed
 * state, and the group is a `toolbar`-like roving-focus composite rather than a
 * radio group. Radix supplies the roving focus and `aria-pressed`; LUC supplies
 * the pressed surface — the same "settled into the panel" depth the Slider
 * thumb and the selected Table row use.
 */

export const toggleVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-label font-medium select-none",
    "border luc-transition luc-focus luc-press luc-numeric",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    /*
     * Pressed reads as *depth*, not as a colour flip: the control keeps its
     * surface and sinks into it (inset well + accent ink), which is why a
     * toggle and a segmented control never look like the same control.
     */
    "data-[state=on]:border-line-accent data-[state=on]:bg-surface-selected",
    "data-[state=on]:text-fg-accent data-[state=on]:shadow-well",
    "disabled:pointer-events-none disabled:text-fg-disabled disabled:shadow-none",
  ],
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-transparent text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
        outline:
          "border-line-default bg-surface-default text-fg-secondary shadow-rest hover:border-line-strong hover:bg-surface-interactive-hover hover:text-fg-primary data-[state=on]:shadow-well",
        soft: "border-transparent bg-surface-interactive text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary",
      },
      size: {
        sm: "h-control-sm rounded-sm px-2",
        md: "h-control-md rounded-md px-3",
        lg: "h-control-lg rounded-md px-4",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "outline", size: "md", block: false },
  },
);

export interface ToggleProps
  extends React.ComponentPropsWithRef<typeof RadixToggle.Root>,
    VariantProps<typeof toggleVariants> {
  /** Required for an icon-only toggle; ignored when children carry text. */
  label?: string;
}

export function Toggle({ className, variant, size, block, label, ...props }: ToggleProps) {
  return (
    <RadixToggle.Root
      data-slot="toggle"
      aria-label={label}
      className={cn(toggleVariants({ variant, size, block }), className)}
      {...props}
    />
  );
}

export type ToggleGroupProps = React.ComponentPropsWithRef<typeof RadixToggleGroup.Root>;

export function ToggleGroup({ className, ...props }: ToggleGroupProps) {
  return (
    <RadixToggleGroup.Root
      data-slot="toggle-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  );
}

export interface ToggleGroupItemProps
  extends React.ComponentPropsWithRef<typeof RadixToggleGroup.Item>,
    VariantProps<typeof toggleVariants> {
  label?: string;
}

export function ToggleGroupItem({ className, variant, size, label, ...props }: ToggleGroupItemProps) {
  return (
    <RadixToggleGroup.Item
      data-slot="toggle-group-item"
      aria-label={label}
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  );
}
