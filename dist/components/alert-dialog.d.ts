import { ButtonProps } from "./button-base.js";
import "./button.js";
import { AlertDialog } from "radix-ui";
//#region src/components/alert-dialog.d.ts
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
declare const AlertDialog$1: import("react").FC<AlertDialog.AlertDialogProps>;
export declare const AlertDialogTrigger: import("react").ForwardRefExoticComponent<AlertDialog.AlertDialogTriggerProps & import("react").RefAttributes<HTMLButtonElement>>;
export declare const AlertDialogPortal: import("react").FC<AlertDialog.AlertDialogPortalProps>;
export interface AlertDialogContentProps extends React.ComponentPropsWithRef<typeof AlertDialog.Content> {
  /** Width preset. `sm` is the default: a confirmation is a decision, not a page. */
  width?: "sm" | "md";
}
export declare function AlertDialogContent({ className, children, width, ...props }: AlertDialogContentProps): import("react").JSX.Element;
export declare function AlertDialogTitle({ className, ...props }: React.ComponentPropsWithRef<typeof AlertDialog.Title>): import("react").JSX.Element;
export declare function AlertDialogDescription({ className, ...props }: React.ComponentPropsWithRef<typeof AlertDialog.Description>): import("react").JSX.Element;
export declare function AlertDialogFooter({ className, ...props }: React.ComponentPropsWithRef<"div">): import("react").JSX.Element;
export type AlertDialogCancelProps = React.ComponentPropsWithRef<typeof AlertDialog.Cancel> & Pick<ButtonProps, "variant" | "size">;
/**
 * Cancel. It is the control Radix focuses on open, which is why it renders an
 * ordinary `secondary` button by default and *not* a ghost: the first thing a
 * keyboard user lands on must look like the safe answer.
 */
export declare function AlertDialogCancel({ className, variant, size, children, ...props }: AlertDialogCancelProps): import("react").JSX.Element;
export type AlertDialogActionProps = React.ComponentPropsWithRef<typeof AlertDialog.Action> & Pick<ButtonProps, "variant" | "size"> & {
  /**
   * `danger` is the default because an AlertDialog exists for the irreversible
   * case; pass `primary` for a confirmation that is merely important.
   */
  tone?: "danger" | "primary";
};
export declare function AlertDialogAction({ className, tone, size, children, ...props }: AlertDialogActionProps): import("react").JSX.Element;
//#endregion
export { AlertDialog$1 as AlertDialog };
//# sourceMappingURL=alert-dialog.d.ts.map