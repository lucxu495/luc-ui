"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { spring } from "./tokens.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Dialog } from "radix-ui";
import { createContext, useContext, useId, useMemo, useState } from "react";
import { motion } from "motion/react";
//#region src/motion/morphing-dialog.tsx
const MorphingDialogClose = Dialog.Close;
const MorphingDialogTitle = Dialog.Title;
const MorphingDialogDescription = Dialog.Description;
const MorphingDialogContext = createContext(null);
function useMorphingDialog(component) {
	const context = useContext(MorphingDialogContext);
	if (!context) throw new Error(`<${component}> must be rendered inside <MorphingDialog>.`);
	return context;
}
/**
* LUC MorphingDialog — a dialog that grows *out of* the thing you clicked.
*
* Radix still owns every hard part: the focus trap and restore, Escape,
* outside-click, scroll lock, `role="dialog"`, `aria-modal` and — critically —
* unmounting the panel when it closes, so a closed dialog never leaves a hidden
* `role="dialog"` region behind. Motion contributes exactly one thing: a shared
* `layoutId`, so opening projects the trigger's rectangle onto the panel instead
* of cutting to a centred box. Enter/exit themselves use the same CSS keyframes
* as every other LUC overlay, so a morphing dialog and a plain dialog arrive
* identically.
*
* Under reduced motion the shared geometry is skipped entirely (no `layoutId`),
* not slowed down.
*/
function MorphingDialog({ children, open, defaultOpen, onOpenChange }) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
	const isOpen = open ?? uncontrolled;
	const reduced = useReducedMotion();
	const id = useId();
	const value = useMemo(() => ({
		open: isOpen,
		reduced,
		layoutId: `luc-morph-dialog-${id}`
	}), [
		id,
		isOpen,
		reduced
	]);
	return /* @__PURE__ */ jsx(MorphingDialogContext.Provider, {
		value,
		children: /* @__PURE__ */ jsx(Dialog.Root, {
			open,
			defaultOpen,
			onOpenChange: (next) => {
				if (open === void 0) setUncontrolled(next);
				onOpenChange?.(next);
			},
			children
		})
	});
}
/**
* The source of the shared geometry. It renders `children` unchanged and hides
* itself while the dialog is open, so the panel appears to have taken its place.
*
* It is a real control, not a decorated `div`: Radix attaches `aria-haspopup`
* and `aria-expanded` here, and those are only valid on an element with a role
* (axe fails the page otherwise). `role="button"` + Enter/Space activation also
* gives the trigger the keyboard behaviour a mouse click already had.
*/
function MorphingDialogTrigger({ className, children, ...props }) {
	const { open, layoutId, reduced } = useMorphingDialog("MorphingDialogTrigger");
	return /* @__PURE__ */ jsx(Dialog.Trigger, {
		asChild: true,
		children: /* @__PURE__ */ jsx(motion.div, {
			"data-slot": "morphing-dialog-trigger",
			layoutId: reduced ? void 0 : layoutId,
			role: "button",
			tabIndex: 0,
			onKeyDown: (event) => {
				if (event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				event.currentTarget.click();
			},
			className: cn("min-w-0 cursor-pointer", className),
			style: { opacity: open ? 0 : 1 },
			transition: reduced ? { duration: 0 } : spring.responsive,
			...props,
			children
		})
	});
}
const widthClass = {
	none: "",
	sm: "max-w-sm",
	md: "max-w-lg",
	lg: "max-w-2xl",
	xl: "max-w-4xl"
};
function MorphingDialogContent({ className, panelClassName, frameStyle, panelStyle, panelSlot, width = "md", children, ...props }) {
	const { reduced, layoutId } = useMorphingDialog("MorphingDialogContent");
	return /* @__PURE__ */ jsxs(Dialog.Portal, { children: [/* @__PURE__ */ jsx(Dialog.Overlay, {
		"data-slot": "morphing-dialog-overlay",
		className: cn("fixed inset-0 z-[var(--z-overlay)] bg-surface-scrim backdrop-blur-[2px]", "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]")
	}), /* @__PURE__ */ jsx(Dialog.Content, {
		asChild: true,
		children: /* @__PURE__ */ jsx(motion.div, {
			"data-slot": "morphing-dialog",
			tabIndex: -1,
			className: cn("fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 focus:outline-none", "data-[state=open]:animate-[luc-scrim-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-scrim-out_var(--motion-fast)_var(--ease-exit)]", className),
			style: frameStyle,
			...props,
			children: /* @__PURE__ */ jsx(motion.div, {
				"data-slot": panelSlot ?? "morphing-dialog-panel",
				layoutId: reduced ? void 0 : layoutId,
				transition: reduced ? { duration: 0 } : spring.soft,
				style: panelStyle,
				className: cn("w-full overflow-hidden rounded-xl border border-line-default bg-surface-overlay shadow-overlay", widthClass[width], panelClassName),
				children
			})
		})
	})] });
}
//#endregion
export { MorphingDialog, MorphingDialogClose, MorphingDialogContent, MorphingDialogDescription, MorphingDialogTitle, MorphingDialogTrigger };

//# sourceMappingURL=morphing-dialog.js.map