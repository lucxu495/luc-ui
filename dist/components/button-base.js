"use client";
import { cn } from "../utils/cn.js";
import { mergeRefs } from "../utils/refs.js";
import { usePointerGlow } from "../hooks/use-pointer-glow.js";
import { RippleLayer, usePressRipple } from "../motion/press-ripple.js";
import { Spinner } from "./spinner.js";
import { buttonVariants } from "./button-variants.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/button-base.tsx
function Button({ className, variant, size, block, leadingIcon, trailingIcon, loading = false, loadingLabel = "Working", tactile = true, disabled, children, onClick, type = "button", onPointerDown, onPointerMove, onPointerEnter, onPointerLeave, ref, ...props }) {
	const ripple = usePressRipple({
		rings: 2,
		disabled: !tactile || loading || disabled
	});
	const glow = usePointerGlow({ disabled: !tactile });
	return /* @__PURE__ */ jsxs("button", {
		ref: mergeRefs(glow.ref, ref),
		"data-slot": "button",
		"data-loading": loading || void 0,
		type,
		"aria-busy": loading || void 0,
		disabled,
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
		className: cn(buttonVariants({
			variant,
			size,
			block
		}), loading && "pointer-events-none", loading && variant === "primary" && "shadow-rest", className),
		...props,
		children: [
			tactile ? /* @__PURE__ */ jsx(RippleLayer, { ripples: ripple.ripples }) : null,
			loading ? /* @__PURE__ */ jsxs("span", {
				className: "absolute inset-0 grid place-items-center",
				children: [/* @__PURE__ */ jsx(Spinner, {
					size: size === "lg" ? 18 : 16,
					label: null,
					className: "text-current opacity-90"
				}), /* @__PURE__ */ jsx("span", {
					className: "sr-only",
					children: loadingLabel
				})]
			}) : null,
			/* @__PURE__ */ jsxs("span", {
				className: cn("inline-flex items-center gap-[inherit] transition-opacity duration-[var(--motion-fast)]", loading ? "opacity-0" : "opacity-100"),
				children: [
					leadingIcon ? /* @__PURE__ */ jsx("span", {
						"data-slot": "icon",
						className: "inline-flex -ml-0.5 items-center",
						children: leadingIcon
					}) : null,
					children,
					trailingIcon ? /* @__PURE__ */ jsx("span", {
						"data-slot": "icon",
						className: "inline-flex -mr-0.5 items-center",
						children: trailingIcon
					}) : null
				]
			})
		]
	});
}
//#endregion
export { Button };

//# sourceMappingURL=button-base.js.map