"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { mergeRefs } from "../utils/refs.js";
import { useSlidingIndicator } from "../hooks/use-sliding-indicator.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Tabs as Tabs$1 } from "radix-ui";
import { createContext, useContext, useMemo, useState } from "react";
//#region src/components/tabs.tsx
const TabsContext = createContext(null);
function useTabsContext(component) {
	const context = useContext(TabsContext);
	if (!context) throw new Error(`<Tabs.${component}> must be rendered inside <Tabs>.`);
	return context;
}
const triggerSize = {
	sm: "h-7 px-2.5 text-caption",
	md: "h-8 px-3 text-label",
	lg: "h-10 px-3.5 text-body"
};
function TabsRoot({ className, variant = "line", size = "md", value, defaultValue, onValueChange, children, ...props }) {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
	const activeValue = value ?? uncontrolledValue;
	const reducedMotion = useReducedMotion();
	const { containerRef, registerItem, rect } = useSlidingIndicator(activeValue);
	const context = useMemo(() => ({
		value: activeValue,
		variant,
		size,
		registerItem,
		containerRef,
		rect,
		reducedMotion
	}), [
		activeValue,
		containerRef,
		rect,
		reducedMotion,
		registerItem,
		size,
		variant
	]);
	return /* @__PURE__ */ jsx(TabsContext.Provider, {
		value: context,
		children: /* @__PURE__ */ jsx(Tabs$1.Root, {
			"data-slot": "tabs",
			value,
			defaultValue,
			onValueChange: (next) => {
				if (value === void 0) setUncontrolledValue(next);
				onValueChange?.(next);
			},
			className: cn("flex min-w-0 flex-col gap-4", className),
			...props,
			children
		})
	});
}
function TabsList({ className, fill = false, children, ref, ...props }) {
	const { variant, containerRef } = useTabsContext("List");
	return /* @__PURE__ */ jsxs(Tabs$1.List, {
		ref: mergeRefs(containerRef, ref),
		"data-slot": "tabs-list",
		"data-variant": variant,
		className: cn("relative flex select-none items-center", variant === "line" && "gap-0.5 border-b border-line-subtle pb-px", variant === "surface" && "gap-0.5 rounded-lg border border-line-subtle bg-surface-sunken p-1 shadow-well", fill && "[&>[role=tab]]:flex-1", className),
		...props,
		children: [children, /* @__PURE__ */ jsx(TabsIndicator, {})]
	});
}
function TabsIndicator() {
	const { variant, rect, reducedMotion } = useTabsContext("Indicator");
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		"data-slot": "tabs-indicator",
		className: cn("pointer-events-none absolute", variant === "line" && "bottom-0 left-0 h-[2px] rounded-full bg-accent-default shadow-[0_0_10px_-2px_var(--accent-default)]", variant === "surface" && "top-1 bottom-1 left-0 rounded-md border border-line-default bg-surface-raised shadow-layer-2", !reducedMotion && "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]"),
		style: {
			transform: `translateX(${rect?.left ?? 0}px)`,
			width: rect?.width ?? 0,
			opacity: rect ? 1 : 0
		}
	});
}
function TabsTrigger({ className, leadingIcon, children, value, ...props }) {
	const { size, variant, registerItem } = useTabsContext("Trigger");
	return /* @__PURE__ */ jsxs(Tabs$1.Trigger, {
		ref: registerItem(String(value)),
		"data-slot": "tabs-trigger",
		value,
		className: cn("relative z-10 inline-flex items-center justify-center gap-1.5 rounded-sm font-medium", "luc-transition luc-focus-inset", "text-fg-muted hover:text-fg-secondary", "data-[state=active]:text-fg-primary", "disabled:pointer-events-none disabled:text-fg-disabled", variant === "surface" && "hover:bg-surface-interactive-hover data-[state=active]:hover:bg-transparent", "[&_svg]:size-4 [&_svg]:shrink-0", triggerSize[size], className),
		...props,
		children: [leadingIcon ? /* @__PURE__ */ jsx("span", {
			className: "inline-flex shrink-0 items-center",
			children: leadingIcon
		}) : null, children]
	});
}
function TabsContent({ className, ...props }) {
	return /* @__PURE__ */ jsx(Tabs$1.Content, {
		"data-slot": "tabs-content",
		className: cn("luc-focus min-w-0 outline-none", "data-[state=active]:animate-[luc-enter-fade_var(--motion-normal)_var(--ease-enter)]", className),
		...props
	});
}
const Tabs = Object.assign(TabsRoot, {
	List: TabsList,
	Trigger: TabsTrigger,
	Content: TabsContent,
	Indicator: TabsIndicator
});
//#endregion
export { Tabs };

//# sourceMappingURL=tabs.js.map