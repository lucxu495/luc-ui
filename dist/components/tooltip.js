"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Tooltip } from "radix-ui";
//#region src/components/tooltip.tsx
const TooltipProvider = Tooltip.Provider;
function Tooltip$1({ content, children, arrow = true, side = "top", align = "center", sideOffset = 7, className, hint, ...props }) {
	return /* @__PURE__ */ jsxs(Tooltip.Root, {
		delayDuration: 220,
		...props,
		children: [/* @__PURE__ */ jsx(Tooltip.Trigger, {
			asChild: true,
			children
		}), /* @__PURE__ */ jsx(Tooltip.Portal, { children: /* @__PURE__ */ jsxs(Tooltip.Content, {
			"data-slot": "tooltip",
			side,
			align,
			sideOffset,
			className: cn("z-[var(--z-tooltip)] max-w-64 select-none", "rounded-sm border border-line-default bg-surface-overlay px-2 py-1.5", "text-caption text-fg-primary luc-float", "data-[side=top]:[&[data-state=delayed-open]]:animate-[luc-tip-in-top_var(--motion-fast)_var(--ease-enter)]", "data-[side=bottom]:[&[data-state=delayed-open]]:animate-[luc-tip-in-bottom_var(--motion-fast)_var(--ease-enter)]", "data-[side=left]:[&[data-state=delayed-open]]:animate-[luc-tip-in-left_var(--motion-fast)_var(--ease-enter)]", "data-[side=right]:[&[data-state=delayed-open]]:animate-[luc-tip-in-right_var(--motion-fast)_var(--ease-enter)]", className),
			...props,
			children: [/* @__PURE__ */ jsxs("span", {
				className: "flex items-center gap-2",
				children: [content, hint ? /* @__PURE__ */ jsx("kbd", {
					className: "rounded-xs border border-line-default bg-surface-interactive px-1 py-px font-mono text-micro text-fg-muted",
					children: hint
				}) : null]
			}), arrow ? /* @__PURE__ */ jsx(Tooltip.Arrow, {
				width: 10,
				height: 5,
				style: {
					fill: "var(--surface-overlay)",
					stroke: "var(--line-default)",
					strokeWidth: .5
				}
			}) : null]
		}) })]
	});
}
//#endregion
export { Tooltip$1 as Tooltip, TooltipProvider };

//# sourceMappingURL=tooltip.js.map