"use client";

import { Dialog as RadixDialog } from "radix-ui";
import { RiCloseLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useDialogFocusRestore } from "./dialog-focus";
import { IconButton } from "./icon-button";

export const DialogRoot = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;

export interface DialogContentProps extends React.ComponentPropsWithRef<typeof RadixDialog.Content> {
  /** Width preset. */
  width?: "sm" | "md" | "lg" | "xl";
  /** Show the built-in close affordance. Default `true`. */
  showClose?: boolean;
}

const widthClass = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  /*
   * `xl` exists for a dialog whose *content* is the point — an image the reader
   * is meant to inspect. A caller that needs a viewport-relative box still passes
   * its own `max-w-[…]`; this is the step between "a form" and "the whole screen".
   */
  xl: "max-w-5xl",
} as const;

// LUC Dialog.
//
// One foundation, done properly: restrained scrim, smooth entrance, correct
// focus trap and restore, Escape and outside-click handled by Radix. Reduced
// motion collapses the entrance to a fade via the global CSS clamp.
export function DialogContent({
  className,
  children,
  width = "md",
  showClose = true,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: DialogContentProps) {
  const focusRestore = useDialogFocusRestore({ onOpenAutoFocus, onCloseAutoFocus });
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        data-slot="dialog-overlay"
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]",
          "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]",
        )}
      />
      <RadixDialog.Content
        data-slot="dialog"
        {...focusRestore}
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-line-default bg-surface-overlay luc-float-high",
          "focus:outline-none",
          "data-[state=open]:animate-[luc-overlay-in_var(--motion-normal)_var(--ease-enter)]",
          "data-[state=closed]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]",
          widthClass[width],
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-line-strong to-transparent"
        />
        {children}
        {showClose ? (
          <RadixDialog.Close asChild>
            <IconButton
              label="Close dialog"
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

export interface DialogHeaderProps extends React.ComponentPropsWithRef<"div"> {
  icon?: React.ReactNode;
}

export function DialogHeader({ className, icon, children, ...props }: DialogHeaderProps) {
  return (
    <div data-slot="dialog-header" className={cn("flex gap-3 px-5 pt-5 pb-4", className)} {...props}>
      {icon ? (
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-accent">
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1 pr-8">{children}</div>
    </div>
  );
}

export function DialogBody({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return <div data-slot="dialog-body" className={cn("px-5 pb-5 text-body text-fg-secondary", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t border-line-subtle bg-surface-raised/40 px-5 py-3.5",
        className,
      )}
      {...props}
    />
  );
}
