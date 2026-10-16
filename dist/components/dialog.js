"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { useDialogFocusRestore } from "./dialog-focus.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dialog } from "radix-ui";
import { RiCloseLine } from "@remixicon/react";
//#region src/components/dialog.tsx
const DialogRoot = Dialog.Root;
const DialogTrigger = Dialog.Trigger;
const DialogClose = Dialog.Close;
const DialogTitle = Dialog.Title;
const DialogDescription = Dialog.Description;
const widthClass = {
	sm: "max-w-sm",
	md: "max-w-lg",
	lg: "max-w-2xl",
	xl: "max-w-5xl"
};
function DialogContent({ className, children, width = "md", showClose = true, onOpenAutoFocus, onCloseAutoFocus, ...props }) {
	const focusRestore = useDialogFocusRestore({
		onOpenAutoFocus,
		onCloseAutoFocus
	});
	return /* @__PURE__ */ jsxs(Dialog.Portal, { children: [/* @__PURE__ */ jsx(Dialog.Overlay, {
		"data-slot": "dialog-overlay",
		className: cn("fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]", "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]")
	}), /* @__PURE__ */ jsxs(Dialog.Content, {
		"data-slot": "dialog",
		...focusRestore,
		className: cn("fixed top-1/2 left-1/2 z-[var(--z-modal)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2", "rounded-xl border border-line-default bg-surface-overlay luc-float-high", "focus:outline-none", "data-[state=open]:animate-[luc-overlay-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]", widthClass[width], className),
		...props,
		children: [
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-line-strong to-transparent"
			}),
			children,
			showClose ? /* @__PURE__ */ jsx(Dialog.Close, {
				asChild: true,
				children: /* @__PURE__ */ jsx(IconButton, {
					label: "Close dialog",
					variant: "ghost",
					size: "sm",
					icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
					className: "absolute top-3.5 right-3.5"
				})
			}) : null
		]
	})] });
}
function DialogHeader({ className, icon, children, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "dialog-header",
		className: cn("flex gap-3 px-5 pt-5 pb-4", className),
		...props,
		children: [icon ? /* @__PURE__ */ jsx("span", {
			className: "mt-0.5 grid size-8 shrink-0 place-items-center rounded-md border border-line-subtle bg-surface-interactive text-fg-accent",
			children: icon
		}) : null, /* @__PURE__ */ jsx("div", {
			className: "flex min-w-0 flex-col gap-1 pr-8",
			children
		})]
	});
}
function DialogBody({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "dialog-body",
		className: cn("px-5 pb-5 text-body text-fg-secondary", className),
		...props
	});
}
function DialogFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "dialog-footer",
		className: cn("flex flex-wrap items-center justify-end gap-2 border-t border-line-subtle bg-surface-raised/40 px-5 py-3.5", className),
		...props
	});
}
//#endregion
export { DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogRoot, DialogTitle, DialogTrigger };

//# sourceMappingURL=dialog.js.map