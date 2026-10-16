"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { useDialogFocusRestore } from "./dialog-focus.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dialog } from "radix-ui";
import { createContext, useContext, useState } from "react";
import { RiCloseLine } from "@remixicon/react";
//#region src/components/sheet.tsx
const SheetOpenContext = createContext(void 0);
/**
* Root of the sheet.
*
* A thin wrapper rather than a straight re-export: it mirrors the open state
* (controlled and uncontrolled) into the context `SheetContent` reads. The
* `onOpenChange` prop is forwarded untouched, and every other prop reaches
* Radix unchanged, so this stays a pass-through for callers.
*/
function SheetRoot({ open, defaultOpen, onOpenChange, children, ...props }) {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
	const resolvedOpen = open ?? uncontrolledOpen;
	return /* @__PURE__ */ jsx(SheetOpenContext.Provider, {
		value: resolvedOpen,
		children: /* @__PURE__ */ jsx(Dialog.Root, {
			...open === void 0 ? {} : { open },
			...defaultOpen === void 0 ? {} : { defaultOpen },
			onOpenChange: (next) => {
				setUncontrolledOpen(next);
				onOpenChange?.(next);
			},
			...props,
			children
		})
	});
}
/** Root of the sheet. Aliased as `Sheet` — the name most callers use. */
const Sheet = SheetRoot;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;
const SheetTitle = Dialog.Title;
const SheetDescription = Dialog.Description;
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
const sideEdge = {
	right: "inset-y-0 right-0 h-full border-l",
	left: "inset-y-0 left-0 h-full border-r",
	top: "inset-x-0 top-0 w-full border-b",
	bottom: "inset-x-0 bottom-0 w-full border-t"
};
/** Widths for the vertical edges, heights for the horizontal ones. */
const sideSize = {
	vertical: {
		sm: "w-[min(20rem,100vw)]",
		md: "w-[min(26rem,100vw)]",
		lg: "w-[min(32rem,100vw)]",
		xl: "w-[min(40rem,100vw)]",
		full: "w-screen"
	},
	horizontal: {
		sm: "h-[min(16rem,100vh)]",
		md: "h-[min(22rem,100vh)]",
		lg: "h-[min(28rem,100vh)]",
		xl: "h-[min(34rem,100vh)]",
		full: "h-screen"
	}
};
const enterExit = {
	right: "data-[state=open]:animate-[luc-sheet-in-right_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-right_var(--motion-normal)_var(--ease-exit)]",
	left: "data-[state=open]:animate-[luc-sheet-in-left_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-left_var(--motion-normal)_var(--ease-exit)]",
	top: "data-[state=open]:animate-[luc-sheet-in-top_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-top_var(--motion-normal)_var(--ease-exit)]",
	bottom: "data-[state=open]:animate-[luc-sheet-in-bottom_var(--motion-slow)_var(--ease-enter)] data-[state=closed]:animate-[luc-sheet-out-bottom_var(--motion-normal)_var(--ease-exit)]"
};
function SheetContent({ className, children, side = "right", size = "md", showClose = true, onOpenAutoFocus, onCloseAutoFocus, ...props }) {
	const open = useContext(SheetOpenContext);
	const [anchor, setAnchor] = useState({
		side,
		size
	});
	if (open !== false && (anchor.side !== side || anchor.size !== size)) setAnchor({
		side,
		size
	});
	const resolvedSide = anchor.side;
	const resolvedSize = anchor.size;
	const vertical = resolvedSide === "right" || resolvedSide === "left";
	const focusRestore = useDialogFocusRestore({
		onOpenAutoFocus,
		onCloseAutoFocus
	});
	return /* @__PURE__ */ jsxs(Dialog.Portal, { children: [/* @__PURE__ */ jsx(Dialog.Overlay, {
		"data-slot": "sheet-overlay",
		className: cn("fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]", "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]")
	}), /* @__PURE__ */ jsxs(Dialog.Content, {
		"data-slot": "sheet",
		"data-side": resolvedSide,
		...focusRestore,
		className: cn("fixed z-[var(--z-modal)] flex flex-col gap-0 overflow-hidden", "border-line-default bg-surface-overlay luc-float-high", "focus:outline-none", sideEdge[resolvedSide], sideSize[vertical ? "vertical" : "horizontal"][resolvedSize], enterExit[resolvedSide], className),
		...props,
		children: [
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("pointer-events-none absolute bg-linear-to-b from-transparent via-line-strong to-transparent", vertical ? "inset-y-8 w-px" : "inset-x-8 h-px", vertical ? resolvedSide === "right" ? "left-0" : "right-0" : resolvedSide === "bottom" ? "top-0" : "bottom-0")
			}),
			children,
			showClose ? /* @__PURE__ */ jsx(Dialog.Close, {
				asChild: true,
				children: /* @__PURE__ */ jsx(IconButton, {
					label: "Close panel",
					variant: "ghost",
					size: "sm",
					icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
					className: "absolute top-3.5 right-3.5"
				})
			}) : null
		]
	})] });
}
function SheetHeader({ className, icon, children, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "sheet-header",
		className: cn("flex shrink-0 gap-3 border-b border-line-subtle bg-surface-raised/50 px-5 py-4", className),
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
/** The scrolling region. Header and footer stay put while this moves. */
function SheetBody({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "sheet-body",
		className: cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 text-body text-fg-secondary", className),
		...props
	});
}
function SheetFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "sheet-footer",
		className: cn("flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line-subtle bg-surface-raised/50 px-5 py-3.5", className),
		...props
	});
}
//#endregion
export { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetRoot, SheetTitle, SheetTrigger };

//# sourceMappingURL=sheet.js.map