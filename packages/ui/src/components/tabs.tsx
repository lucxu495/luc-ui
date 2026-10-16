"use client";

import { Tabs as RadixTabs } from "radix-ui";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useSlidingIndicator } from "../hooks/use-sliding-indicator";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { mergeRefs } from "../utils/refs";

export type TabsVariant = "line" | "surface";
export type TabsSize = "sm" | "md" | "lg";

interface TabsContextValue {
  value: string | undefined;
  variant: TabsVariant;
  size: TabsSize;
  registerItem: (value: string) => (node: HTMLElement | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  rect: { left: number; width: number } | null;
  reducedMotion: boolean;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`<Tabs.${component}> must be rendered inside <Tabs>.`);
  return context;
}

const triggerSize: Record<TabsSize, string> = {
  sm: "h-7 px-2.5 text-caption",
  md: "h-8 px-3 text-label",
  lg: "h-10 px-3.5 text-body",
};

export interface TabsProps extends React.ComponentPropsWithRef<typeof RadixTabs.Root> {
  variant?: TabsVariant;
  size?: TabsSize;
}

// LUC Tabs.
//
// The active state is carried by one shared indicator that slides *and*
// resizes. Labels keep a precise hierarchy: active is primary text, everything
// else stays quiet until hovered.
function TabsRoot({
  className,
  variant = "line",
  size = "md",
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(defaultValue);
  const activeValue = value ?? uncontrolledValue;
  const reducedMotion = useReducedMotion();
  const { containerRef, registerItem, rect } = useSlidingIndicator<HTMLDivElement>(activeValue);

  const context = useMemo<TabsContextValue>(
    () => ({ value: activeValue, variant, size, registerItem, containerRef, rect, reducedMotion }),
    [activeValue, containerRef, rect, reducedMotion, registerItem, size, variant],
  );

  return (
    <TabsContext.Provider value={context}>
      <RadixTabs.Root
        data-slot="tabs"
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => {
          if (value === undefined) setUncontrolledValue(next);
          onValueChange?.(next);
        }}
        className={cn("flex min-w-0 flex-col gap-4", className)}
        {...props}
      >
        {children}
      </RadixTabs.Root>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.ComponentPropsWithRef<typeof RadixTabs.List> {
  /** Stretch triggers to fill the available width. */
  fill?: boolean;
}

function TabsList({ className, fill = false, children, ref, ...props }: TabsListProps) {
  const { variant, containerRef } = useTabsContext("List");

  return (
    <RadixTabs.List
      ref={mergeRefs(containerRef, ref)}
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "relative flex select-none items-center",
        variant === "line" && "gap-0.5 border-b border-line-subtle pb-px",
        variant === "surface" &&
          "gap-0.5 rounded-lg border border-line-subtle bg-surface-sunken p-1 shadow-well",
        fill && "[&>[role=tab]]:flex-1",
        className,
      )}
      {...props}
    >
      {children}
      <TabsIndicator />
    </RadixTabs.List>
  );
}

function TabsIndicator() {
  const { variant, rect, reducedMotion } = useTabsContext("Indicator");

  return (
    <span
      aria-hidden="true"
      data-slot="tabs-indicator"
      className={cn(
        "pointer-events-none absolute",
        variant === "line" && "bottom-0 left-0 h-[2px] rounded-full bg-accent-default shadow-[0_0_10px_-2px_var(--accent-default)]",
        variant === "surface" &&
          "top-1 bottom-1 left-0 rounded-md border border-line-default bg-surface-raised shadow-layer-2",
        !reducedMotion && "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]",
      )}
      style={{
        transform: `translateX(${rect?.left ?? 0}px)`,
        width: rect?.width ?? 0,
        opacity: rect ? 1 : 0,
      }}
    />
  );
}

export interface TabsTriggerProps extends React.ComponentPropsWithRef<typeof RadixTabs.Trigger> {
  leadingIcon?: ReactNode;
}

function TabsTrigger({ className, leadingIcon, children, value, ...props }: TabsTriggerProps) {
  const { size, variant, registerItem } = useTabsContext("Trigger");

  return (
    <RadixTabs.Trigger
      ref={registerItem(String(value))}
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative z-10 inline-flex items-center justify-center gap-1.5 rounded-sm font-medium",
        "luc-transition luc-focus-inset",
        "text-fg-muted hover:text-fg-secondary",
        "data-[state=active]:text-fg-primary",
        /*
         * A disabled trigger is visible and inert.
         *
         * It had no disabled styling at all, so the "Notes" tab on
         * `/components/tabs` — a real `<button disabled>` with `data-disabled` —
         * looked and hovered exactly like the three beside it, which reads as a
         * tab that is broken rather than one that is unavailable. Radix renders
         * the native attribute, so `disabled:` is the honourable selector; the
         * muted tone separates it from the *active* label rather than from the
         * resting one, which is the distinction the reader needs.
         */
        "disabled:pointer-events-none disabled:text-fg-disabled",
        variant === "surface" && "hover:bg-surface-interactive-hover data-[state=active]:hover:bg-transparent",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        triggerSize[size],
        className,
      )}
      {...props}
    >
      {leadingIcon ? <span className="inline-flex shrink-0 items-center">{leadingIcon}</span> : null}
      {children}
    </RadixTabs.Trigger>
  );
}

function TabsContent({ className, ...props }: React.ComponentPropsWithRef<typeof RadixTabs.Content>) {
  return (
    <RadixTabs.Content
      data-slot="tabs-content"
      className={cn(
        "luc-focus min-w-0 outline-none",
        "data-[state=active]:animate-[luc-enter-fade_var(--motion-normal)_var(--ease-enter)]",
        className,
      )}
      {...props}
    />
  );
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
  Indicator: TabsIndicator,
});
