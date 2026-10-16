"use client";
import { cn } from "../utils/cn.js";
import { Button } from "./button-base.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertDialog } from "radix-ui";
//#region src/components/alert-dialog.tsx
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
const AlertDialog$1 = AlertDialog.Root;
const AlertDialogTrigger = AlertDialog.Trigger;
const AlertDialogPortal = AlertDialog.Portal;
const widthClass = {
	sm: "max-w-sm",
	md: "max-w-md"
};
function AlertDialogContent({ className, children, width = "sm", ...props }) {
	return /* @__PURE__ */ jsxs(AlertDialog.Portal, { children: [/* @__PURE__ */ jsx(AlertDialog.Overlay, {
		"data-slot": "alert-dialog-scrim",
		className: cn("fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]", "data-[state=open]:animate-[luc-scrim-in_var(--motion-fast)_var(--ease-standard)]", "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-standard)]")
	}), /* @__PURE__ */ jsxs(AlertDialog.Content, {
		"data-slot": "alert-dialog",
		className: cn("fixed top-1/2 left-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2", "rounded-xl border border-line-default bg-surface-overlay p-5 text-fg-primary luc-float-high", "focus:outline-none", "data-[state=open]:animate-[luc-overlay-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]", widthClass[width], className),
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-line-strong to-transparent"
		}), children]
	})] });
}
function AlertDialogTitle({ className, ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Title, {
		"data-slot": "alert-dialog-title",
		className: cn("text-title text-fg-primary", className),
		...props
	});
}
function AlertDialogDescription({ className, ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Description, {
		"data-slot": "alert-dialog-description",
		className: cn("mt-2 text-label text-fg-secondary", className),
		...props
	});
}
function AlertDialogFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "alert-dialog-footer",
		className: cn("mt-5 flex flex-wrap items-center justify-end gap-2", className),
		...props
	});
}
/**
* Cancel. It is the control Radix focuses on open, which is why it renders an
* ordinary `secondary` button by default and *not* a ghost: the first thing a
* keyboard user lands on must look like the safe answer.
*/
function AlertDialogCancel({ className, variant = "secondary", size = "md", children, ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Cancel, {
		asChild: true,
		...props,
		children: /* @__PURE__ */ jsx(Button, {
			variant,
			size,
			className,
			children
		})
	});
}
function AlertDialogAction({ className, tone = "danger", size = "md", children, ...props }) {
	return /* @__PURE__ */ jsx(AlertDialog.Action, {
		asChild: true,
		...props,
		children: /* @__PURE__ */ jsx(Button, {
			variant: tone === "danger" ? "danger" : "primary",
			size,
			className,
			children
		})
	});
}
//#endregion
export { AlertDialog$1 as AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger };

//# sourceMappingURL=alert-dialog.js.map