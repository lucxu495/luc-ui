"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { RiAddLine } from "@remixicon/react";
//#region src/components/float-button.tsx
/**
* Corner placement, with the device's own inset respected.
*
* `max()` rather than a plain offset: on a phone with a home indicator, 24px
* from the bottom is inside the gesture area.
*/
const SIDE_CLASS = {
	"bottom-right": "bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] items-end",
	"bottom-left": "bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] items-start",
	"top-right": "top-[max(1.5rem,env(safe-area-inset-top))] right-[max(1.5rem,env(safe-area-inset-right))] items-end",
	"top-left": "top-[max(1.5rem,env(safe-area-inset-top))] left-[max(1.5rem,env(safe-area-inset-left))] items-start"
};
function FloatButton({ icon, label, side = "bottom-right", variant = "solid", size = "lg", badge, fixed = true, className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "float-button",
		"data-side": side,
		className: cn("flex flex-col gap-2", fixed ? "fixed" : "absolute", "z-[var(--z-sticky)]", SIDE_CLASS[side], className),
		children: /* @__PURE__ */ jsxs("span", {
			className: "relative flex",
			children: [/* @__PURE__ */ jsx(IconButton, {
				icon,
				label,
				variant,
				size,
				className: "rounded-full shadow-[var(--layer-2-shadow)]",
				...props
			}), badge === void 0 ? null : /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("pointer-events-none absolute -top-0.5 -right-0.5 grid min-w-[1.125rem] place-items-center", "rounded-full bg-negative px-1 text-micro leading-[1.125rem] font-medium text-fg-on-accent"),
				children: badge > 99 ? "99+" : badge
			})]
		})
	});
}
function FloatButtonGroup({ icon, label, side = "bottom-right", actions, defaultOpen = false, fixed = true, className }) {
	const [open, setOpen] = useState(defaultOpen);
	const triggerRef = useRef(null);
	const panelRef = useRef(null);
	const panelId = useId();
	const close = useCallback((returnFocus) => {
		setOpen(false);
		if (returnFocus) triggerRef.current?.focus();
	}, []);
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (event) => {
			if (event.key !== "Escape") return;
			event.stopPropagation();
			close(true);
		};
		const onPointerDown = (event) => {
			const target = event.target;
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
	useEffect(() => {
		if (!open) return;
		const frame = requestAnimationFrame(() => {
			(panelRef.current?.querySelector("button:not([disabled])"))?.focus({ preventScroll: true });
		});
		return () => cancelAnimationFrame(frame);
	}, [open]);
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "float-button-group",
		"data-side": side,
		"data-open": open,
		className: cn("flex flex-col gap-2", side.startsWith("top") ? "flex-col" : "flex-col-reverse", fixed ? "fixed" : "absolute", "z-[var(--z-sticky)]", SIDE_CLASS[side], className),
		children: [/* @__PURE__ */ jsx("span", {
			className: "relative flex",
			children: /* @__PURE__ */ jsx(IconButton, {
				ref: triggerRef,
				icon: icon ?? /* @__PURE__ */ jsx(RiAddLine, {}),
				label,
				variant: "solid",
				size: "lg",
				"aria-expanded": open,
				"aria-controls": panelId,
				className: cn("rounded-full shadow-[var(--layer-2-shadow)] luc-transition motion-reduce:transition-none", open && "rotate-45"),
				onClick: () => open ? close(true) : setOpen(true)
			})
		}), open ? /* @__PURE__ */ jsx("div", {
			ref: panelRef,
			id: panelId,
			"data-slot": "float-button-actions",
			className: cn("flex flex-col gap-2 luc-settle motion-reduce:animate-none", side.endsWith("left") ? "items-start" : "items-end"),
			children: actions.map((action) => /* @__PURE__ */ jsx(IconButton, {
				icon: action.icon,
				label: action.label,
				variant: "solid",
				size: "md",
				className: "rounded-full shadow-[var(--layer-2-shadow)]",
				...action.onClick === void 0 ? {} : { onClick: action.onClick },
				...action.disabled === void 0 ? {} : { disabled: action.disabled }
			}, action.id))
		}) : null]
	});
}
//#endregion
export { FloatButton, FloatButtonGroup };

//# sourceMappingURL=float-button.js.map