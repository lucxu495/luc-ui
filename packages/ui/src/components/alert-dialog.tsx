"use client";

import { AlertDialog as RadixAlertDialog } from "radix-ui";
import { cn } from "../utils/cn";
import { Button, type ButtonProps } from "./button";

/**
 * LUC AlertDialog — confirmation for an action that cannot be undone.
 *
 * It is deliberately *not* a `Dialog` with a flag. A confirmation has one job:
 * stop an accidental destructive commit without training people to dismiss
 * dialogs. Three decisions follow from that, and they are the whole reason this
 * component exists:
 *
 *  1. **Cancel takes focus.** Radix focuses the first focusable control on open,
 *     which is why the cancel button is rendered first in the footer — Enter on
 *     a destructive confirmation cancels rather than destroys.
 *  2. **No outside-click dismissal.** Radix's AlertDialog removes
 *     `onPointerDownOutside` / `onInteractOutside` from the Content contract
 *     entirely, so a stray click on the scrim can never half-answer a
 *     confirmation. Escape still closes it.
 *  3. **The action verb is the label.** `confirmLabel` should say what happens
 *     ("Delete dataset"), never "OK".
 *
 * The surface is the Dialog's, one layer higher (`luc-float-high`), so the two
 * families read as one material.
 */

export const AlertDialog = RadixAlertDialog.Root;
export const AlertDialogTrigger = RadixAlertDialog.Trigger;
export const AlertDialogPortal = RadixAlertDialog.Portal;

export interface AlertDialogContentProps
  extends React.ComponentPropsWithRef<typeof RadixAlertDialog.Content> {
  /** Width preset. `sm` is the default: a confirmation is a decision, not a page. */
  width?: "sm" | "md";
}

const widthClass = { sm: "max-w-sm", md: "max-w-md" } as const;

export function AlertDialogContent({
  className,
  children,
  width = "sm",
  ...props
}: AlertDialogContentProps) {
  return (
    <RadixAlertDialog.Portal>
      <RadixAlertDialog.Overlay
        data-slot="alert-dialog-scrim"
        className={cn(
          "fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]",
          "data-[state=open]:animate-[luc-scrim-in_var(--motion-fast)_var(--ease-standard)]",
          "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-standard)]",
        )}
      />
      <RadixAlertDialog.Content
        data-slot="alert-dialog"
        className={cn(
          "fixed top-1/2 left-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-line-default bg-surface-overlay p-5 text-fg-primary luc-float-high",
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
      </RadixAlertDialog.Content>
    </RadixAlertDialog.Portal>
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof RadixAlertDialog.Title>) {
  return (
    <RadixAlertDialog.Title
      data-slot="alert-dialog-title"
      className={cn("text-title text-fg-primary", className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof RadixAlertDialog.Description>) {
  return (
    <RadixAlertDialog.Description
      data-slot="alert-dialog-description"
      className={cn("mt-2 text-label text-fg-secondary", className)}
      {...props}
    />
  );
}

export function AlertDialogFooter({ className, ...props }: React.ComponentPropsWithRef<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("mt-5 flex flex-wrap items-center justify-end gap-2", className)}
      {...props}
    />
  );
}

export type AlertDialogCancelProps = React.ComponentPropsWithRef<typeof RadixAlertDialog.Cancel> &
  Pick<ButtonProps, "variant" | "size">;

/**
 * Cancel. It is the control Radix focuses on open, which is why it renders an
 * ordinary `secondary` button by default and *not* a ghost: the first thing a
 * keyboard user lands on must look like the safe answer.
 */
export function AlertDialogCancel({ className, variant = "secondary", size = "md", children, ...props }: AlertDialogCancelProps) {
  return (
    <RadixAlertDialog.Cancel asChild {...props}>
      <Button variant={variant} size={size} className={className}>
        {children}
      </Button>
    </RadixAlertDialog.Cancel>
  );
}

export type AlertDialogActionProps = React.ComponentPropsWithRef<typeof RadixAlertDialog.Action> &
  Pick<ButtonProps, "variant" | "size"> & {
    /**
     * `danger` is the default because an AlertDialog exists for the irreversible
     * case; pass `primary` for a confirmation that is merely important.
     */
    tone?: "danger" | "primary";
  };

export function AlertDialogAction({
  className,
  tone = "danger",
  size = "md",
  children,
  ...props
}: AlertDialogActionProps) {
  return (
    <RadixAlertDialog.Action asChild {...props}>
      <Button variant={tone === "danger" ? "danger" : "primary"} size={size} className={className}>
        {children}
      </Button>
    </RadixAlertDialog.Action>
  );
}
