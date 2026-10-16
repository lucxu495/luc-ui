"use client";

import { motion } from "motion/react";
import { Popover as RadixPopover } from "radix-ui";
import { createContext, useContext, useId, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { spring } from "./tokens";
import type { MotionDivProps, MotionPropConflicts } from "./types";

export const MorphingPopoverClose = RadixPopover.Close;
export const MorphingPopoverAnchor = RadixPopover.Anchor;

interface MorphingPopoverContextValue {
  open: boolean;
  reduced: boolean;
  layoutId: string;
}

const MorphingPopoverContext = createContext<MorphingPopoverContextValue | null>(null);

function useMorphingPopover(component: string): MorphingPopoverContextValue {
  const context = useContext(MorphingPopoverContext);
  if (!context) throw new Error(`<${component}> must be rendered inside <MorphingPopover>.`);
  return context;
}

export interface MorphingPopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * LUC MorphingPopover — the lighter sibling of `MorphingDialog`.
 *
 * The same shared-geometry idea at popover scale: a metric detail, a chart
 * setting, a context preview. Radix keeps the focus/dismiss/placement contract
 * *and* the unmount-after-exit behaviour; Motion carries one `layoutId` between
 * the trigger and the panel so the surface reads as *that* element expanding
 * rather than a new box appearing.
 */
export function MorphingPopover({ children, open, defaultOpen, onOpenChange }: MorphingPopoverProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isOpen = open ?? uncontrolled;
  const reduced = useReducedMotion();
  const id = useId();
  const value = useMemo<MorphingPopoverContextValue>(
    () => ({ open: isOpen, reduced, layoutId: `luc-morph-popover-${id}` }),
    [id, isOpen, reduced],
  );

  return (
    <MorphingPopoverContext.Provider value={value}>
      <RadixPopover.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next) => {
          if (open === undefined) setUncontrolled(next);
          onOpenChange?.(next);
        }}
      >
        {children}
      </RadixPopover.Root>
    </MorphingPopoverContext.Provider>
  );
}

export type MorphingPopoverTriggerProps = MotionDivProps;

/**
 * The popover's trigger, as a real control for the same reason as the dialog
 * trigger: Radix puts `aria-haspopup` / `aria-expanded` here, which is only
 * valid on an element that has a role, and Enter/Space must open it.
 */
export function MorphingPopoverTrigger({ className, children, ...props }: MorphingPopoverTriggerProps) {
  const { open, layoutId, reduced } = useMorphingPopover("MorphingPopoverTrigger");
  return (
    <RadixPopover.Trigger asChild>
      <motion.div
        data-slot="morphing-popover-trigger"
        layoutId={reduced ? undefined : layoutId}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          event.currentTarget.click();
        }}
        className={cn("min-w-0 cursor-pointer", className)}
        style={{ opacity: open ? 0 : 1 }}
        transition={reduced ? { duration: 0 } : spring.responsive}
        {...props}
      >
        {children}
      </motion.div>
    </RadixPopover.Trigger>
  );
}

type MotionCompatibleProps = Omit<
  React.ComponentPropsWithRef<typeof RadixPopover.Content>,
  MotionPropConflicts | "children"
>;

export interface MorphingPopoverContentProps extends MotionCompatibleProps {
  children: React.ReactNode;
  /** Extra classes for the panel itself. */
  panelClassName?: string;
  width?: "auto" | "sm" | "md" | "lg";
}

const widthClass = {
  auto: "",
  sm: "w-64",
  md: "w-80",
  lg: "w-[26rem]",
} as const;

export function MorphingPopoverContent({
  className,
  panelClassName,
  width = "auto",
  sideOffset = 6,
  align = "center",
  children,
  ...props
}: MorphingPopoverContentProps) {
  const { reduced, layoutId } = useMorphingPopover("MorphingPopoverContent");

  return (
    <RadixPopover.Portal>
      <RadixPopover.Content asChild align={align} sideOffset={sideOffset}>
        <motion.div
          data-slot="morphing-popover"
          layoutId={reduced ? undefined : layoutId}
          transition={reduced ? { duration: 0 } : spring.responsive}
          className={cn(
            "z-[var(--z-popover)] origin-[var(--radix-popover-content-transform-origin)] focus:outline-none",
            "data-[state=open]:animate-[luc-overlay-in_var(--motion-normal)_var(--ease-enter)]",
            "data-[state=closed]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]",
            widthClass[width],
            className,
          )}
          {...props}
        >
          <div
            className={cn(
              "overflow-hidden rounded-lg border border-line-default bg-surface-overlay p-3 text-fg-primary shadow-overlay",
              panelClassName,
            )}
          >
            {children}
          </div>
        </motion.div>
      </RadixPopover.Content>
    </RadixPopover.Portal>
  );
}
