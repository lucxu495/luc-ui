"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { RiAddLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { IconButton } from "./icon-button";

/**
 * LUC FloatButton — an action that stays reachable.
 *
 * The one thing this component owns is *placement*: a control pinned to a corner
 * of the viewport (or of a positioned ancestor) with the offsets, the layer, the
 * safe-area inset and the stacking that make that safe. The control itself is the
 * existing `IconButton`, so a floating action is the same button as every other
 * icon-only control — same focus ring, same press ink, same disabled and loading
 * contracts — and this does not become a second, subtly different button.
 *
 * Two families of bug are what the details below exist to prevent:
 *
 *  1. **A floating control that covers the thing it acts on.** The offsets clear
 *     the home indicator on a phone (`env(safe-area-inset-*)`) and the layer sits
 *     at `--z-sticky`, deliberately *below* overlays: a sheet or a dialog covers a
 *     floating action rather than fighting it for the top of the stack.
 *  2. **A disclosure that is not a disclosure.** `FloatButtonGroup` opens on a
 *     real button with `aria-expanded` and `aria-controls`, moves focus into the
 *     actions it revealed, closes on Escape with focus returned to the trigger,
 *     and closes on a click outside. It is not a menu and does not claim to be
 *     one: the actions are buttons, each with its own name.
 *
 * The badge is decorative — `aria-hidden` — because a count announced *after* a
 * label ("Notifications, 3") is a different sentence in every language. A caller
 * who wants it announced puts the number in `label`.
 */

export type FloatButtonSide = "bottom-right" | "bottom-left" | "top-right" | "top-left";

/**
 * Corner placement, with the device's own inset respected.
 *
 * `max()` rather than a plain offset: on a phone with a home indicator, 24px
 * from the bottom is inside the gesture area.
 */
const SIDE_CLASS: Record<FloatButtonSide, string> = {
  "bottom-right":
    "bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] items-end",
  "bottom-left":
    "bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] items-start",
  "top-right":
    "top-[max(1.5rem,env(safe-area-inset-top))] right-[max(1.5rem,env(safe-area-inset-right))] items-end",
  "top-left":
    "top-[max(1.5rem,env(safe-area-inset-top))] left-[max(1.5rem,env(safe-area-inset-left))] items-start",
};

export interface FloatButtonProps
  extends Omit<React.ComponentPropsWithRef<"button">, "children" | "aria-label"> {
  icon: ReactNode;
  /** Required: an icon-only control must have an accessible name. */
  label: string;
  /** Which corner of the viewport (or of the positioned ancestor). */
  side?: FloatButtonSide;
  /** `solid` is the neutral action, `accent` the primary one. */
  variant?: "solid" | "accent" | "danger";
  size?: "md" | "lg";
  /**
   * A count on the control. Decorative: put the meaning in `label` if a screen
   * reader has to hear it.
   */
  badge?: number;
  /**
   * Pinned to the viewport (default). `false` positions it inside the nearest
   * `relative` ancestor instead — a canvas, a preview pane, a card.
   */
  fixed?: boolean;
  /** The stack this control belongs to, when one is placed beside another. */
  className?: string;
}

export function FloatButton({
  icon,
  label,
  side = "bottom-right",
  variant = "solid",
  size = "lg",
  badge,
  fixed = true,
  className,
  ...props
}: FloatButtonProps) {
  return (
    <div
      data-slot="float-button"
      data-side={side}
      className={cn(
        "flex flex-col gap-2",
        fixed ? "fixed" : "absolute",
        "z-[var(--z-sticky)]",
        SIDE_CLASS[side],
        className,
      )}
    >
      <span className="relative flex">
        <IconButton
          icon={icon}
          label={label}
          variant={variant}
          size={size}
          className="rounded-full shadow-[var(--layer-2-shadow)]"
          {...props}
        />
        {badge === undefined ? null : (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -top-0.5 -right-0.5 grid min-w-[1.125rem] place-items-center",
              "rounded-full bg-negative px-1 text-micro leading-[1.125rem] font-medium text-fg-on-accent",
            )}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
    </div>
  );
}

export interface FloatButtonAction {
  /** Stable key for the action. */
  id: string;
  icon: ReactNode;
  /** The action's accessible name, and its tooltip. */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface FloatButtonGroupProps {
  /** The trigger's icon while closed. */
  icon?: ReactNode;
  /**
   * The trigger's accessible name — what this stack of actions is for, e.g.
   * "Quick actions". Not a menu title: the trigger is the only thing named.
   */
  label: string;
  side?: FloatButtonSide;
  actions: readonly FloatButtonAction[];
  /** Open on first paint. Rare; useful in a screenshot or a test. */
  defaultOpen?: boolean;
  fixed?: boolean;
  className?: string;
}

export function FloatButtonGroup({
  icon,
  label,
  side = "bottom-right",
  actions,
  defaultOpen = false,
  fixed = true,
  className,
}: FloatButtonGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const panelId = useId();

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  /* Escape closes, and focus goes back to the trigger — the button the reader
   * pressed. A click anywhere else closes without stealing focus. */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target === null) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  /* The reveal moves focus to the first action, so the keyboard path is the same
   * as the pointer one: open, then act. Deferred a frame so the panel exists. */
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])");
      first?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div
      data-slot="float-button-group"
      data-side={side}
      data-open={open}
      className={cn(
        "flex flex-col gap-2",
        /* Bottom corners stack upwards so the trigger keeps its place; the top
         * corners stack downwards for the same reason. */
        side.startsWith("top") ? "flex-col" : "flex-col-reverse",
        fixed ? "fixed" : "absolute",
        "z-[var(--z-sticky)]",
        SIDE_CLASS[side],
        className,
      )}
    >
      <span className="relative flex">
        <IconButton
          ref={triggerRef}
          icon={icon ?? <RiAddLine />}
          label={label}
          variant="solid"
          size="lg"
          aria-expanded={open}
          aria-controls={panelId}
          className={cn(
            "rounded-full shadow-[var(--layer-2-shadow)] luc-transition motion-reduce:transition-none",
            /* The trigger's own icon turns as it opens — the rotation is the
             * only thing that says "this is the same control, opened", and the
             * reduced-motion variant lands on the end state. */
            open && "rotate-45",
          )}
          onClick={() => (open ? close(true) : setOpen(true))}
        />
      </span>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          data-slot="float-button-actions"
          className={cn(
            "flex flex-col gap-2 luc-settle motion-reduce:animate-none",
            side.endsWith("left") ? "items-start" : "items-end",
          )}
        >
          {actions.map((action) => (
            <IconButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              variant="solid"
              size="md"
              className="rounded-full shadow-[var(--layer-2-shadow)]"
              {...(action.onClick === undefined ? {} : { onClick: action.onClick })}
              {...(action.disabled === undefined ? {} : { disabled: action.disabled })}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
