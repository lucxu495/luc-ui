"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { useSlidingIndicator } from "../hooks/use-sliding-indicator.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/shared-highlight.tsx
function SharedHighlight({ className, items, value, onValueChange, size = "md", variant = "track", fill = false, ariaLabel, itemClassName, onNavigate, ...props }) {
	const reduced = useReducedMotion();
	const { containerRef, registerItem, rect } = useSlidingIndicator(value);
	const underline = variant === "underline";
	const itemClasses = cn("luc-focus relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap text-caption font-medium luc-transition", size === "sm" ? "h-6 rounded-[5px] px-2 text-micro" : "h-7 rounded-[6px] px-2.5", "text-fg-muted hover:text-fg-secondary data-[active=true]:text-fg-primary", itemClassName);
	return /* @__PURE__ */ jsxs("div", {
		ref: containerRef,
		"data-slot": "shared-highlight",
		"data-variant": variant,
		role: items.length > 0 && items.every((item) => item.href) ? "navigation" : "group",
		"aria-label": ariaLabel,
		className: cn("relative inline-flex min-w-0 items-center", underline ? "gap-3 border-b border-line-subtle" : "gap-0.5 rounded-md border border-line-subtle bg-surface-sunken p-0.5 shadow-xs", fill && !underline && "flex w-full [&>*]:flex-1", className),
		...props,
		children: [
			rect && !underline ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "shared-highlight-thumb",
				className: cn("pointer-events-none absolute top-0.5 bottom-0.5 left-0 rounded-[6px] border border-line-default bg-surface-raised shadow-sm", !reduced && "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]"),
				style: {
					transform: `translateX(${rect.left}px)`,
					width: rect.width
				}
			}) : null,
			rect && underline ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "shared-highlight-underline",
				className: cn("pointer-events-none absolute bottom-[-1px] left-0 h-0.5 rounded-full bg-accent-default", !reduced && "[transition:transform_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized)]"),
				style: {
					transform: `translateX(${rect.left}px)`,
					width: rect.width
				}
			}) : null,
			items.map((item) => {
				const active = item.value === value;
				const content = /* @__PURE__ */ jsxs(Fragment, { children: [item.icon, item.label] });
				return item.href ? /* @__PURE__ */ jsx("a", {
					ref: registerItem(item.value),
					href: item.href,
					"data-active": active,
					"aria-current": item.current ?? active ? "page" : void 0,
					onClick: () => onNavigate?.(item.value),
					className: itemClasses,
					children: content
				}, item.value) : /* @__PURE__ */ jsx("button", {
					ref: registerItem(item.value),
					type: "button",
					disabled: item.disabled,
					"data-active": active,
					"aria-pressed": active,
					onClick: () => {
						if (!active) onValueChange?.(item.value);
					},
					className: itemClasses,
					children: content
				}, item.value);
			})
		]
	});
}
//#endregion
export { SharedHighlight };

//# sourceMappingURL=shared-highlight.js.map