"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { mergeRefs } from "../utils/refs.js";
import { useSlidingIndicator } from "../hooks/use-sliding-indicator.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { ToggleGroup } from "radix-ui";
import { createContext, useContext, useMemo, useState } from "react";
//#region src/components/segmented-control.tsx
const SegmentedContext = createContext(null);
function SegmentedControl({ className, size = "md", fill = false, value, defaultValue, onValueChange, ref, children, ...props }) {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
	const activeValue = value ?? uncontrolledValue;
	const reducedMotion = useReducedMotion();
	const { containerRef, registerItem, rect } = useSlidingIndicator(activeValue);
	const context = useMemo(() => ({ registerItem }), [registerItem]);
	return /* @__PURE__ */ jsx(SegmentedContext.Provider, {
		value: context,
		children: /* @__PURE__ */ jsxs(ToggleGroup.Root, {
			ref: mergeRefs(containerRef, ref),
			"data-slot": "segmented-control",
			type: "single",
			value,
			defaultValue,
			onValueChange: (next) => {
				if (value === void 0) setUncontrolledValue(next);
				onValueChange?.(next);
			},
			className: cn("relative inline-flex items-center gap-0.5 rounded-md border border-line-subtle bg-surface-sunken p-0.5 shadow-well", size === "sm" && "rounded-[7px] p-0.5", fill && "flex w-full [&>[data-slot=segmented-item]]:flex-1", className),
			...props,
			children: [/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "segmented-thumb",
				className: cn("pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-[6px] border border-line-default bg-surface-raised shadow-layer-2", size === "sm" && "top-px bottom-px rounded-[5px]", !reducedMotion && "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]"),
				style: {
					transform: `translateX(${rect?.left ?? 0}px)`,
					width: rect?.width ?? 0,
					opacity: rect ? 1 : 0
				}
			}), children]
		})
	});
}
function SegmentedItem({ className, children, leadingIcon, value, size = "md", ...props }) {
	const context = useContext(SegmentedContext);
	return /* @__PURE__ */ jsxs(ToggleGroup.Item, {
		ref: context?.registerItem(String(value)),
		"data-slot": "segmented-item",
		value,
		className: cn("relative z-10 inline-flex h-7 items-center justify-center gap-1.5 rounded-[6px] px-2.5", size === "sm" && "h-6 rounded-[5px] px-2 text-micro", "text-caption font-medium text-fg-muted luc-transition luc-focus-inset", "hover:text-fg-secondary data-[state=on]:text-fg-primary", "[&_svg]:size-4 [&_svg]:shrink-0", className),
		...props,
		children: [leadingIcon ? /* @__PURE__ */ jsx("span", {
			className: "inline-flex shrink-0 items-center",
			children: leadingIcon
		}) : null, children]
	});
}
//#endregion
export { SegmentedControl, SegmentedItem };

//# sourceMappingURL=segmented-control.js.map