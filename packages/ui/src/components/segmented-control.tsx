"use client";

import { ToggleGroup as RadixToggleGroup } from "radix-ui";
import { createContext, useContext, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { useSlidingIndicator } from "../hooks/use-sliding-indicator";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { mergeRefs } from "../utils/refs";

export interface SegmentedControlProps
  extends Omit<RadixToggleGroup.ToggleGroupSingleProps, "type" | "rovingFocus"> {
  /** Match the item size. `sm` is for toolbars and topbars. */
  size?: "sm" | "md";
  fill?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

interface SegmentedContextValue {
  registerItem: (value: string) => (node: HTMLElement | null) => void;
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

// LUC SegmentedControl.
//
// A view switcher, not navigation: built on Radix ToggleGroup for correct
// single-selection semantics, styled as a recessed track with one raised thumb.
export function SegmentedControl({
  className,
  size = "md",
  fill = false,
  value,
  defaultValue,
  onValueChange,
  ref,
  children,
  ...props
}: SegmentedControlProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const activeValue = value ?? uncontrolledValue;
  const reducedMotion = useReducedMotion();
  const { containerRef, registerItem, rect } = useSlidingIndicator<HTMLDivElement>(activeValue);
  const context = useMemo(() => ({ registerItem }), [registerItem]);

  return (
    <SegmentedContext.Provider value={context}>
      <RadixToggleGroup.Root
        ref={mergeRefs(containerRef, ref)}
        data-slot="segmented-control"
        type="single"
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => {
          if (value === undefined) setUncontrolledValue(next);
          onValueChange?.(next);
        }}
        className={cn(
          "relative inline-flex items-center gap-0.5 rounded-md border border-line-subtle bg-surface-sunken p-0.5 shadow-well",
          size === "sm" && "rounded-[7px] p-0.5",
          fill && "flex w-full [&>[data-slot=segmented-item]]:flex-1",
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          data-slot="segmented-thumb"
          className={cn(
            "pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-[6px] border border-line-default bg-surface-raised shadow-layer-2",
            size === "sm" && "top-px bottom-px rounded-[5px]",
            !reducedMotion &&
              "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]",
          )}
          style={{
            transform: `translateX(${rect?.left ?? 0}px)`,
            width: rect?.width ?? 0,
            opacity: rect ? 1 : 0,
          }}
        />
        {children}
      </RadixToggleGroup.Root>
    </SegmentedContext.Provider>
  );
}

export interface SegmentedItemProps
  extends React.ComponentPropsWithRef<typeof RadixToggleGroup.Item> {
  leadingIcon?: React.ReactNode;
  size?: "sm" | "md";
}

export function SegmentedItem({
  className,
  children,
  leadingIcon,
  value,
  size = "md",
  ...props
}: SegmentedItemProps) {
  const context = useContext(SegmentedContext);
  return (
    <RadixToggleGroup.Item
      ref={context?.registerItem(String(value))}
      data-slot="segmented-item"
      value={value}
      className={cn(
        "relative z-10 inline-flex h-7 items-center justify-center gap-1.5 rounded-[6px] px-2.5",
        /*
         * `sm` is 24 px, not 22: the toolbar variant is the one place items sit
         * edge to edge with a 2 px gap, so the "undersized target with enough
         * spacing" exception does not apply and 22 px failed SC 2.5.8 outright.
         */
        size === "sm" && "h-6 rounded-[5px] px-2 text-micro",
        "text-caption font-medium text-fg-muted luc-transition luc-focus-inset",
        "hover:text-fg-secondary data-[state=on]:text-fg-primary",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {leadingIcon ? <span className="inline-flex shrink-0 items-center">{leadingIcon}</span> : null}
      {children}
    </RadixToggleGroup.Item>
  );
}
