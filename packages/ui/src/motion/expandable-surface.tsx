"use client";

import { motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { spring } from "./tokens";
import type { MotionPropConflicts } from "./types";

interface ExpandableSurfaceContextValue {
  open: boolean;
  setOpen: (next: boolean) => void;
  reduced: boolean;
  layoutId: string;
  contentId: string;
  triggerId: string;
  registerTrigger: (node: HTMLButtonElement | null) => void;
  registerContent: (node: HTMLElement | null) => void;
}

const ExpandableSurfaceContext = createContext<ExpandableSurfaceContextValue | null>(null);

function useExpandableSurface(component: string): ExpandableSurfaceContextValue {
  const context = useContext(ExpandableSurfaceContext);
  if (!context) {
    throw new Error(`<${component}> must be rendered inside <ExpandableSurface>.`);
  }
  return context;
}

export interface ExpandableSurfaceProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * LUC `ExpandableSurface` — a card that becomes the page, in place.
 *
 * `MorphingDialog` solves "open this elsewhere"; this solves "become more, right
 * here". A compact summary and its expanded detail are laid out in the *same*
 * grid cell and share one `layoutId`, so the surface grows from its own
 * rectangle into the full one and settles back — continuity rather than an
 * entrance animation on top of an exit animation.
 *
 * The decisions that matter:
 *
 *  - **No portal, no scroll lock, no focus trap.** The expanded surface is in
 *    flow, so the page keeps its scroll position and a keyboard user keeps their
 *    place in the document. This is the right shape for a dashboard card or a
 *    list item that reveals detail; a modal is the wrong shape for it.
 *  - **The trigger stays mounted.** It is the focus target we return to, and it
 *    is what carries `aria-expanded`/`aria-controls`. It fades rather than
 *    unmounting, which is also what lets the two share one layout identity.
 *  - **Focus is moved deliberately.** Opening focuses the panel (so a keyboard
 *    user lands inside the new content), Escape restores the trigger.
 *  - **Reduced motion drops the shared layout** instead of slowing it: the
 *    surface simply swaps, which is the correct static reading of the same
 *    composition.
 */
export function ExpandableSurface({
  children,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: ExpandableSurfaceProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
  const isOpen = open ?? uncontrolled;
  const reduced = useReducedMotion();
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [onOpenChange, open],
  );

  const value = useMemo<ExpandableSurfaceContextValue>(
    () => ({
      open: isOpen,
      setOpen,
      reduced,
      layoutId: `luc-expandable-${id}`,
      contentId: `luc-expandable-content-${id}`,
      triggerId: `luc-expandable-trigger-${id}`,
      registerTrigger: (node) => {
        triggerRef.current = node;
      },
      registerContent: (node) => {
        contentRef.current = node;
      },
    }),
    [id, isOpen, reduced, setOpen],
  );

  // Move focus with the surface: into it when it opens, back to the trigger
  // when it closes. Only after a real transition — mounting closed must not
  // steal focus from the page.
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (wasOpen.current === isOpen) return;
    wasOpen.current = isOpen;
    if (isOpen) contentRef.current?.focus({ preventScroll: true });
    else triggerRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  return (
    <ExpandableSurfaceContext.Provider value={value}>
      <div
        data-slot="expandable-surface"
        data-state={isOpen ? "open" : "closed"}
        className={cn("grid grid-cols-1 [grid-template-areas:'stack']", className)}
      >
        {children}
      </div>
    </ExpandableSurfaceContext.Provider>
  );
}

export interface ExpandableSurfaceTriggerProps
  extends Omit<React.ComponentPropsWithRef<"button">, MotionPropConflicts | "onClick" | "type"> {
  children: React.ReactNode;
}

/**
 * The collapsed face. It is a real button: `aria-expanded`, `aria-controls` and
 * Enter/Space come from the element, not from a keyboard handler we maintain.
 * While open it is `inert` and invisible, so its interactive content can never
 * be tabbed into behind the expanded panel.
 */
export function ExpandableSurfaceTrigger({
  className,
  children,
  ...props
}: ExpandableSurfaceTriggerProps) {
  const { open, setOpen, reduced, layoutId, contentId, triggerId, registerTrigger } =
    useExpandableSurface("ExpandableSurfaceTrigger");

  return (
    <motion.button
      ref={registerTrigger}
      id={triggerId}
      type="button"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      data-slot="expandable-surface-trigger"
      layoutId={reduced ? undefined : layoutId}
      transition={reduced ? { duration: 0 } : spring.responsive}
      inert={open}
      onClick={() => setOpen(!open)}
      className={cn(
        "block w-full min-w-0 cursor-pointer text-left [grid-area:stack]",
        "transition-opacity duration-[var(--motion-fast)] ease-[var(--ease-standard)]",
        open && "pointer-events-none opacity-0",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export interface ExpandableSurfaceContentProps
  extends Omit<React.ComponentPropsWithRef<"div">, MotionPropConflicts> {
  children: React.ReactNode;
}

export interface ExpandableSurfaceCloseProps
  extends Omit<React.ComponentPropsWithRef<"button">, "onClick" | "type"> {
  children: React.ReactNode;
}

/**
 * Close, from inside the expanded surface.
 *
 * A sibling of `ExpandableSurfaceTrigger` rather than a second trigger: the
 * trigger owns the surface's identity (`layoutId`, `id`, `aria-controls`) and a
 * document may only have one element claiming it. This is the escape hatch for
 * content that wants its own "Collapse" affordance, and it reads the same
 * context so the state stays in one place.
 */
export function ExpandableSurfaceClose({
  className,
  children,
  ...props
}: ExpandableSurfaceCloseProps) {
  const { setOpen } = useExpandableSurface("ExpandableSurfaceClose");
  return (
    <button
      type="button"
      data-slot="expandable-surface-close"
      onClick={() => setOpen(false)}
      className={cn(
        "luc-focus inline-flex h-control-sm items-center rounded-sm px-2 text-caption text-fg-secondary luc-transition",
        "hover:bg-surface-interactive-hover hover:text-fg-primary",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * The expanded face. Mounted only while open (so a closed surface costs nothing
 * and holds no stale DOM), `tabIndex={-1}` so it can receive focus on open, and
 * Escape closes it because a keyboard user should not have to hunt for the way
 * back.
 */
export function ExpandableSurfaceContent({
  className,
  children,
  onKeyDown,
  ...props
}: ExpandableSurfaceContentProps) {
  const { open, setOpen, reduced, layoutId, contentId, triggerId, registerContent } =
    useExpandableSurface("ExpandableSurfaceContent");

  return (
    /*
     * No `<AnimatePresence>` on purpose. Shared-layout continuity does not need
     * an exit animation: when the panel unmounts, motion already knows the last
     * rectangle that carried this `layoutId`, so the trigger grows back out of
     * it. Skipping the exit phase also means a closed surface is *gone* — no
     * hidden `role="region"` left behind and no linger before the trigger is
     * interactive again.
     */
    open ? (
      <motion.div
        ref={registerContent}
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        tabIndex={-1}
        data-slot="expandable-surface-content"
        layoutId={reduced ? undefined : layoutId}
        transition={reduced ? { duration: 0 } : spring.responsive}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === "Escape") {
            event.stopPropagation();
            setOpen(false);
          }
        }}
        /*
         * The panel is a *programmatic* focus target (`tabIndex={-1}`), so it has
         * no ring in the Tab order — but a keyboard user who pressed Enter must
         * still see where the focus went, and `:focus-visible` matches exactly in
         * that case. `luc-focus-inset` is the house replacement for a suppressed
         * outline (Web Interface Guidelines: never `outline: none` without one).
         */
        className={cn("luc-focus-inset min-w-0 [grid-area:stack] focus:outline-none", className)}
        {...props}
      >
        {children}
      </motion.div>
    ) : null
  );
}
