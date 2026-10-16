"use client";
import { cn } from "../utils/cn.js";
import { mergeRefs } from "../utils/refs.js";
import { usePointerGlow } from "../hooks/use-pointer-glow.js";
import { RippleLayer, usePressRipple } from "../motion/press-ripple.js";
import { Spinner } from "./spinner.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
//#region src/components/icon-button.tsx
const iconButtonVariants = cva([
	"relative isolate inline-grid place-items-center select-none",
	"luc-transition luc-focus luc-press luc-cursor-light",
	"disabled:pointer-events-none disabled:opacity-45"
], {
	variants: {
		variant: {
			solid: "bg-surface-interactive text-fg-secondary border border-line-default hover:border-line-strong hover:text-fg-primary hover:bg-surface-interactive-hover shadow-rest hover:shadow-hover",
			ghost: "text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
			accent: "bg-accent-soft text-fg-accent hover:bg-accent-soft-hover hover:text-accent-strong border border-transparent hover:border-line-accent",
			danger: "text-fg-muted hover:bg-negative-soft hover:text-fg-negative"
		},
		size: {
			sm: "size-control-sm rounded-sm [&_svg]:size-4",
			md: "size-control-md rounded-md [&_svg]:size-[18px]",
			lg: "size-control-lg rounded-md [&_svg]:size-5"
		}
	},
	defaultVariants: {
		variant: "ghost",
		size: "md"
	}
});
function IconButton({ className, variant, size, label, icon, loading = false, showTooltip = true, tactile = true, type = "button", title, onClick, onPointerDown, onPointerEnter, onPointerMove, onPointerLeave, ref, ...props }) {
	const ripple = usePressRipple({
		rings: 1,
		disabled: !tactile || loading
	});
	const glow = usePointerGlow({ disabled: !tactile });
	return /* @__PURE__ */ jsxs("button", {
		ref: mergeRefs(glow.ref, ref),
		"data-slot": "icon-button",
		type,
		"aria-label": label,
		"aria-busy": loading || void 0,
		title: showTooltip ? title ?? label : title,
		onPointerEnter: (event) => {
			glow.handlers.onPointerEnter(event);
			onPointerEnter?.(event);
		},
		onPointerMove: (event) => {
			glow.handlers.onPointerMove(event);
			onPointerMove?.(event);
		},
		onPointerLeave: (event) => {
			glow.handlers.onPointerLeave();
			onPointerLeave?.(event);
		},
		onPointerDown: (event) => {
			ripple.onPointerDown(event);
			onPointerDown?.(event);
		},
		onClick: (event) => {
			if (loading) {
				event.preventDefault();
				return;
			}
			onClick?.(event);
		},
		className: cn(iconButtonVariants({
			variant,
			size
		}), loading && "pointer-events-none", className),
		...props,
		children: [
			tactile ? /* @__PURE__ */ jsx(RippleLayer, { ripples: ripple.ripples }) : null,
			/* @__PURE__ */ jsx("span", {
				className: cn("[&_svg]:size-full", loading && "opacity-0"),
				children: icon
			}),
			loading ? /* @__PURE__ */ jsx("span", {
				className: "absolute inset-0 grid place-items-center",
				children: /* @__PURE__ */ jsx(Spinner, {
					size: 16,
					label: null,
					className: "text-current"
				})
			}) : null
		]
	});
}
//#endregion
export { IconButton, iconButtonVariants };

//# sourceMappingURL=icon-button.js.map