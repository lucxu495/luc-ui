"use client";

import { motion } from "motion/react";
import { Dialog as RadixDialog } from "radix-ui";
import { createContext, useContext, useId, useMemo, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { spring } from "./tokens";
import type { MotionDivProps, MotionPropConflicts } from "./types";

export const MorphingDialogClose = RadixDialog.Close;
export const MorphingDialogTitle = RadixDialog.Title;
export const MorphingDialogDescription = RadixDialog.Description;

interface MorphingDialogContextValue {
  open: boolean;
  reduced: boolean;
  layoutId: string;
}

const MorphingDialogContext = createContext<MorphingDialogContextValue | null>(null);

function useMorphingDialog(component: string): MorphingDialogContextValue {
  const context = useContext(MorphingDialogContext);
  if (!context) throw new Error(`<${component}> must be rendered inside <MorphingDialog>.`);
  return context;
}

export interface MorphingDialogProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * LUC MorphingDialog — a dialog that grows *out of* the thing you clicked.
 *
 * Radix still owns every hard part: the focus trap and restore, Escape,
 * outside-click, scroll lock, `role="dialog"`, `aria-modal` and — critically —
 * unmounting the panel when it closes, so a closed dialog never leaves a hidden
 * `role="dialog"` region behind. Motion contributes exactly one thing: a shared
 * `layoutId`, so opening projects the trigger's rectangle onto the panel instead
 * of cutting to a centred box. Enter/exit themselves use the same CSS keyframes
 * as every other LUC overlay, so a morphing dialog and a plain dialog arrive
 * identically.
 *
 * Under reduced motion the shared geometry is skipped entirely (no `layoutId`),
 * not slowed down.
 */
export function MorphingDialog({ children, open, defaultOpen, onOpenChange }: MorphingDialogProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isOpen = open ?? uncontrolled;
  const reduced = useReducedMotion();
  const id = useId();
  const value = useMemo<MorphingDialogContextValue>(
    () => ({ open: isOpen, reduced, layoutId: `luc-morph-dialog-${id}` }),
    [id, isOpen, reduced],
  );

  return (
    <MorphingDialogContext.Provider value={value}>
      <RadixDialog.Root
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next) => {
          if (open === undefined) setUncontrolled(next);
          onOpenChange?.(next);
        }}
      >
        {children}
      </RadixDialog.Root>
    </MorphingDialogContext.Provider>
  );
}

export type MorphingDialogTriggerProps = MotionDivProps;

/**
 * The source of the shared geometry. It renders `children` unchanged and hides
 * itself while the dialog is open, so the panel appears to have taken its place.
 *
 * It is a real control, not a decorated `div`: Radix attaches `aria-haspopup`
 * and `aria-expanded` here, and those are only valid on an element with a role
 * (axe fails the page otherwise). `role="button"` + Enter/Space activation also
 * gives the trigger the keyboard behaviour a mouse click already had.
 */
export function MorphingDialogTrigger({ className, children, ...props }: MorphingDialogTriggerProps) {
  const { open, layoutId, reduced } = useMorphingDialog("MorphingDialogTrigger");
  return (
    <RadixDialog.Trigger asChild>
      <motion.div
        data-slot="morphing-dialog-trigger"
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
    </RadixDialog.Trigger>
  );
}

type MotionCompatibleProps = Omit<
  React.ComponentPropsWithRef<typeof RadixDialog.Content>,
  MotionPropConflicts | "children"
>;

export interface MorphingDialogContentProps extends MotionCompatibleProps {
  children: React.ReactNode;
  /** Extra classes for the panel itself (not the centring wrapper). */
  panelClassName?: string;
  /**
   * Layout for the centring wrapper, when the framing depends on a measurement
   * rather than a breakpoint (a panel that fills a shell's workspace has to set
   * its own insets). Plain CSS properties only — motion owns the animated ones.
   */
  frameStyle?: React.CSSProperties;
  /**
   * Layout for the panel box itself.
   *
   * A resizable panel owns its own width/height as inline style (a `dvh`-based
   * class cannot express "whatever the reader dragged to"), and the style has to
   * land on the panel rather than on the centring frame so the box the reader
   * sees is the box the geometry describes.
   */
  panelStyle?: React.CSSProperties;
  /**
   * `data-slot` for the panel box itself. The wrapper keeps `morphing-dialog`,
   * so a caller can name the box it actually sizes (`h-…`/`w-…` land on the
   * panel, not on the full-viewport centring frame).
   */
  panelSlot?: string;
  /** Panel width preset. `none` lets the panel (or its own classes) decide. */
  width?: "sm" | "md" | "lg" | "xl" | "none";
}

const widthClass = {
  none: "",
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function MorphingDialogContent({
  className,
  panelClassName,
  frameStyle,
  panelStyle,
  panelSlot,
  width = "md",
  children,
  ...props
}: MorphingDialogContentProps) {
  const { reduced, layoutId } = useMorphingDialog("MorphingDialogContent");

  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        data-slot="morphing-dialog-overlay"
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]",
          "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]",
        )}
      />
      <RadixDialog.Content asChild>
        <motion.div
          data-slot="morphing-dialog"
          tabIndex={-1}
          /*
           * The *frame* does not morph; it only fades.
           *
           * `layoutId` used to sit here, on the `fixed inset-0` centring frame,
           * together with `luc-overlay-in` — which animates `transform`. Motion's
           * layout projection writes `transform` from the rect it measures, so
           * the two fought: the frame settled at the *trigger's* width (416px)
           * instead of the viewport's, stayed pinned to the top-left corner, and
           * the panel it centres — `items-center justify-center` inside a 416px
           * box — appeared as a narrow column of text hard against the left edge
           * of a dimmed page. That is the defect the independent audit
           * photographed (C-03).
           *
           * A fade is opacity-only, so it cannot collide with any projection;
           * the geometry now belongs to the panel below, which is the thing a
           * reader is supposed to see grow out of the trigger.
           */
          className={cn(
            "fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 focus:outline-none",
            "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]",
            "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]",
            className,
          )}
          style={frameStyle}
          {...props}
        >
          <motion.div
            data-slot={panelSlot ?? "morphing-dialog-panel"}
            /* The morph: trigger rect → centred panel. */
            layoutId={reduced ? undefined : layoutId}
            transition={reduced ? { duration: 0 } : spring.soft}
            /* A caller that owns the panel's own size (a resizable inspector)
               passes it here, so the box the reader dragged is the box the
               geometry describes. `frameStyle` stays on the centring frame. */
            style={panelStyle}
            className={cn(
              "w-full overflow-hidden rounded-xl border border-line-default bg-surface-overlay shadow-overlay",
              widthClass[width],
              panelClassName,
            )}
          >
            {children}
          </motion.div>
        </motion.div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
