"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";
import { cn } from "../utils/cn";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import { duration, easing } from "./tokens";

/**
 * LUC Collapse — a disclosure that opens with height *and* opacity.
 *
 * Height alone snaps the content into place; opacity alone clips it. Together
 * they read as the panel unfolding. The trigger is a real `<button>` with
 * `aria-expanded` / `aria-controls`, so keyboard and screen-reader behaviour
 * comes for free, and reduced motion jumps straight to the open state.
 */
export interface CollapseProps extends Omit<React.ComponentPropsWithRef<"div">, "children" | "title"> {
  open: boolean;
  /**
   * Called when the reader activates the trigger. The component stays fully
   * controlled — the caller owns `open` — so a disclosure can be driven by URL
   * state, a keyboard shortcut or a parent, not only by its own click.
   */
  onOpenChange?: (open: boolean) => void;
  /** Heading shown in the trigger. */
  title: React.ReactNode;
  /** Optional second line under the trigger. */
  description?: React.ReactNode;
  /** Right-aligned trigger slot (a value, a badge). */
  aside?: React.ReactNode;
  children: React.ReactNode;
  /** `sm` is for inline disclosures, `md` for research sections. */
  size?: "sm" | "md";
  /** Start the panel padded (a bordered card) or flush. */
  variant?: "plain" | "card";
}

export function Collapse({
  className,
  open,
  onOpenChange,
  title,
  description,
  aside,
  children,
  size = "md",
  variant = "plain",
  ...props
}: CollapseProps) {
  const reduced = useReducedMotion();
  const contentId = useId();

  return (
    <div
      data-slot="collapse"
      data-state={open ? "open" : "closed"}
      className={cn(
        "min-w-0",
        variant === "card" && "rounded-lg border border-line-subtle bg-surface-default",
        className,
      )}
      {...props}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => onOpenChange?.(!open)}
        // A disclosure is a native `<details>`-shaped affordance; the button is
        // rendered here rather than inside a `details` element so the animation
        // can own the height.
        className={cn(
          "luc-focus luc-transition flex w-full items-center justify-between gap-3 text-left",
          size === "sm" ? "px-3 py-2" : "px-4 py-3",
          "text-label font-medium text-fg-secondary hover:text-fg-primary",
        )}
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate">{title}</span>
          {description ? <span className="text-caption font-normal text-fg-muted">{description}</span> : null}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          {aside}
          <motion.span
            aria-hidden="true"
            className="text-fg-muted"
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduced ? { duration: 0 } : { duration: duration.fast, ease: easing.standard }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 6.5 8 10.5l4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={contentId}
            data-slot="collapse-content"
            key="content"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { height: { duration: duration.slow, ease: easing.enter }, opacity: { duration: duration.fast } }
            }
            className="overflow-hidden"
          >
            <div className={cn(size === "sm" ? "px-3 pb-2" : "px-4 pb-4", "min-w-0")}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
