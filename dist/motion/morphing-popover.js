"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { spring } from "./tokens.js";
import { jsx } from "react/jsx-runtime";
import { Popover } from "radix-ui";
import { createContext, useContext, useId, useMemo, useState } from "react";
import { motion } from "motion/react";
//#region src/motion/morphing-popover.tsx
const MorphingPopoverClose = Popover.Close;
const MorphingPopoverAnchor = Popover.Anchor;
const MorphingPopoverContext = createContext(null);
function useMorphingPopover(component) {
	const context = useContext(MorphingPopoverContext);
	if (!context) throw new Error(`<${component}> must be rendered inside <MorphingPopover>.`);
	return context;
}
/**
* LUC MorphingPopover — the lighter sibling of `MorphingDialog`.
*
* The same shared-geometry idea at popover scale: a metric detail, a chart
* setting, a context preview. Radix keeps the focus/dismiss/placement contract
* *and* the unmount-after-exit behaviour; Motion carries one `layoutId` between
* the trigger and the panel so the surface reads as *that* element expanding
* rather than a new box appearing.
*/
function MorphingPopover({ children, open, defaultOpen, onOpenChange }) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen ?? false);
	const isOpen = open ?? uncontrolled;
	const reduced = useReducedMotion();
	const id = useId();
	const value = useMemo(() => ({
		open: isOpen,
		reduced,
		layoutId: `luc-morph-popover-${id}`
	}), [
		id,
		isOpen,
		reduced
	]);
	return /* @__PURE__ */ jsx(MorphingPopoverContext.Provider, {
		value,
		children: /* @__PURE__ */ jsx(Popover.Root, {
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
* The popover's trigger, as a real control for the same reason as the dialog
* trigger: Radix puts `aria-haspopup` / `aria-expanded` here, which is only
* valid on an element that has a role, and Enter/Space must open it.
*/
function MorphingPopoverTrigger({ className, children, ...props }) {
	const { open, layoutId, reduced } = useMorphingPopover("MorphingPopoverTrigger");
	return /* @__PURE__ */ jsx(Popover.Trigger, {
		asChild: true,
		children: /* @__PURE__ */ jsx(motion.div, {
			"data-slot": "morphing-popover-trigger",
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
	auto: "",
	sm: "w-64",
	md: "w-80",
	lg: "w-[26rem]"
};
function MorphingPopoverContent({ className, panelClassName, width = "auto", sideOffset = 6, align = "center", children, ...props }) {
	const { reduced, layoutId } = useMorphingPopover("MorphingPopoverContent");
	return /* @__PURE__ */ jsx(Popover.Portal, { children: /* @__PURE__ */ jsx(Popover.Content, {
		asChild: true,
		align,
		sideOffset,
		children: /* @__PURE__ */ jsx(motion.div, {
			"data-slot": "morphing-popover",
			layoutId: reduced ? void 0 : layoutId,
			transition: reduced ? { duration: 0 } : spring.responsive,
			className: cn("z-[var(--z-popover)] origin-[var(--radix-popover-content-transform-origin)] focus:outline-none", "data-[state=open]:animate-[luc-overlay-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-overlay-out_var(--motion-fast)_var(--ease-exit)]", widthClass[width], className),
			...props,
			children: /* @__PURE__ */ jsx("div", {
				className: cn("overflow-hidden rounded-lg border border-line-default bg-surface-overlay p-3 text-fg-primary shadow-overlay", panelClassName),
				children
			})
		})
	}) });
}
//#endregion
export { MorphingPopover, MorphingPopoverAnchor, MorphingPopoverClose, MorphingPopoverContent, MorphingPopoverTrigger };

//# sourceMappingURL=morphing-popover.js.map