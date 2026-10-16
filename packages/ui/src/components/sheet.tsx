"use client";

import { createContext, useContext, useState } from "react";
import { Dialog as RadixDialog } from "radix-ui";
import { RiCloseLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useDialogFocusRestore } from "./dialog-focus";
import { IconButton } from "./icon-button";

/*
 * Whether the panel is open, from the sheet's own root.
 *
 * This exists so `SheetContent` can tell an *opening* render from a *closing*
 * one. Radix injects `data-state` on the content element, but only after our
 * component has already decided which edge to anchor to — too late to be the
 * signal the latch below needs.
 */
const SheetOpenContext = createContext<boolean | undefined>(undefined);

export type SheetRootProps = React.ComponentProps<typeof RadixDialog.Root>;

/**
 * Root of the sheet.
 *
 * A thin wrapper rather than a straight re-export: it mirrors the open state
 * (controlled and uncontrolled) into the context `SheetContent` reads. The
 * `onOpenChange` prop is forwarded untouched, and every other prop reaches
 * Radix unchanged, so this stays a pass-through for callers.
 */
export function SheetRoot({ open, defaultOpen, onOpenChange, children, ...props }: SheetRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const resolvedOpen = open ?? uncontrolledOpen;
  return (
    <SheetOpenContext.Provider value={resolvedOpen}>
      <RadixDialog.Root
        {...(open === undefined ? {} : { open })}
        {...(defaultOpen === undefined ? {} : { defaultOpen })}
        onOpenChange={(next) => {
          setUncontrolledOpen(next);
          onOpenChange?.(next);
        }}
        {...props}
      >
        {children}
      </RadixDialog.Root>
    </SheetOpenContext.Provider>
  );
}

/** Root of the sheet. Aliased as `Sheet` — the name most callers use. */
export const Sheet = SheetRoot;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;
export const SheetTitle = RadixDialog.Title;
export const SheetDescription = RadixDialog.Description;

export type SheetSide = "right" | "left" | "top" | "bottom";
export type SheetSize = "sm" | "md" | "lg" | "xl" | "full";

/**
 * Sheet is a *panel*, not a draggable drawer.
 *
 * It is built on the same Radix Dialog primitive as `Dialog`, so focus trapping,
 * focus restore, Escape, `aria-modal` and the overlay click behaviour are the
 * mature ones LUC UI already ships — nothing here re-implements them. What V0.3
 * adds is a side-anchored layout, a controlled size vocabulary and the LUC motion
 * language. A gesture drawer (grab handle, drag-to-dismiss) is deliberately out
 * of scope; see docs/V0.3 notes and `DESIGN_SYSTEM.md`.
 */

const sideEdge: Record<SheetSide, string> = {
  right: "inset-y-0 right-0 h-full border-l",
  left: "inset-y-0 left-0 h-full border-r",
  top: "inset-x-0 top-0 w-full border-b",
  bottom: "inset-x-0 bottom-0 w-full border-t",
};

/** Widths for the vertical edges, heights for the horizontal ones. */
const sideSize: Record<"vertical" | "horizontal", Record<SheetSize, string>> = {
  vertical: {
    sm: "w-[min(20rem,100vw)]",
    md: "w-[min(26rem,100vw)]",
    lg: "w-[min(32rem,100vw)]",
    xl: "w-[min(40rem,100vw)]",
    full: "w-screen",
  },
  horizontal: {
    sm: "h-[min(16rem,100vh)]",
    md: "h-[min(22rem,100vh)]",
    lg: "h-[min(28rem,100vh)]",
    xl: "h-[min(34rem,100vh)]",
    full: "h-screen",
  },
};

const enterExit: Record<SheetSide, string> = {
  right:
    "data-[state=open]:animate-[luc-sheet-in-right_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-right_var(--motion-normal)_var(--ease-exit)]",
  left: "data-[state=open]:animate-[luc-sheet-in-left_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-left_var(--motion-normal)_var(--ease-exit)]",
  top: "data-[state=open]:animate-[luc-sheet-in-top_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-top_var(--motion-normal)_var(--ease-exit)]",
  bottom:
    "data-[state=open]:animate-[luc-sheet-in-bottom_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-bottom_var(--motion-normal)_var(--ease-exit)]",
};

export interface SheetContentProps extends React.ComponentPropsWithRef<typeof RadixDialog.Content> {
  /** Edge the panel is anchored to. Default `right`. */
  side?: SheetSide;
  /** Width (vertical edges) or height (horizontal edges). Default `md`. */
  size?: SheetSize;
  /** Show the built-in close affordance. Default `true`. */
  showClose?: boolean;
}

export function SheetContent({
  className,
  children,
  side = "right",
  size = "md",
  showClose = true,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: SheetContentProps) {
  const open = useContext(SheetOpenContext);
  /*
   * A panel must exit from the edge it entered.
   *
   * `side` is routinely derived from the very state that closes the panel —
   * `side={open ? "left" : "right"}` is the obvious way to write a single
   * sheet that can be anchored several ways — and by the time the exit
   * animation starts, that expression has already flipped to its fallback. The
   * panel would then teleport to another edge and slide away from there, which
   * reads as "the sheet stayed on screen and jumped" rather than as a
   * dismissal.
   *
   * So the edge and the size are latched: a change is adopted while the panel
   * is open or fully closed, and ignored for the one render that matters — the
   * closing one. Adjusting derived state during render is React's documented
   * pattern for exactly this, and it converges in one extra render.
   */
  const [anchor, setAnchor] = useState({ side, size });
  if (open !== false && (anchor.side !== side || anchor.size !== size)) {
    setAnchor({ side, size });
  }
  const resolvedSide = anchor.side;
  const resolvedSize = anchor.size;

  const vertical = resolvedSide === "right" || resolvedSide === "left";
  const focusRestore = useDialogFocusRestore({ onOpenAutoFocus, onCloseAutoFocus });
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        data-slot="sheet-overlay"
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]",
          "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]",
        )}
      />
      <RadixDialog.Content
        data-slot="sheet"
        data-side={resolvedSide}
        {...focusRestore}
        className={cn(
          "fixed z-[var(--z-modal)] flex flex-col gap-0 overflow-hidden",
          "border-line-default bg-surface-overlay luc-float-high",
          "focus:outline-none",
          sideEdge[resolvedSide],
          sideSize[vertical ? "vertical" : "horizontal"][resolvedSize],
          enterExit[resolvedSide],
          className,
        )}
        {...props}
      >
        {/* A single hairline on the leading edge reads as "panel", not "modal". */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bg-linear-to-b from-transparent via-line-strong to-transparent",
            vertical ? "inset-y-8 w-px" : "inset-x-8 h-px",
            vertical
              ? resolvedSide === "right"
                ? "left-0"
                : "right-0"
              : resolvedSide === "bottom"
                ? "top-0"
                : "bottom-0",
          )}
        />
        {children}
        {showClose ? (
          <RadixDialog.Close asChild>
            <IconButton
              label="Close panel"
              variant="ghost"
              size="sm"
              icon={<RiCloseLine />}
              className="absolute top-3.5 right-3.5"
            />
          </RadixDialog.Close>
        ) : null}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export interface SheetHeaderProps extends React.ComponentPropsWithRef<"div"> {
  icon?: React.ReactNode;
}

export function SheetHeader({ className, icon, children, ...props }: SheetHeaderProps) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex shrink-0 gap-3 border-b border-line-subtle bg-surface-raised/50 px-5 py-4",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-accent">
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1 pr-8">{children}</div>
    </div>
  );
}

/** The scrolling region. Header and footer stay put while this moves. */
export function SheetBody({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="sheet-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 text-body text-fg-secondary", className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line-subtle bg-surface-raised/50 px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}
