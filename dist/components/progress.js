"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
import { Progress } from "radix-ui";
//#region src/components/progress.tsx
const toneClass = {
	accent: "bg-accent-default",
	positive: "bg-positive",
	negative: "bg-negative",
	warning: "bg-warning"
};
/**
* LUC Progress — determinate by default; an indeterminate sweep is available
* for operations whose length is genuinely unknown.
*/
function Progress$1({ className, value, tone = "accent", size = "md", ...props }) {
	const indeterminate = value === null || value === void 0;
	return /* @__PURE__ */ jsx(Progress.Root, {
		"data-slot": "progress",
		value: indeterminate ? null : value,
		className: cn("relative w-full overflow-hidden rounded-full bg-surface-interactive", "luc-well", size === "sm" ? "h-1" : "h-1.5", className),
		...props,
		children: indeterminate ? /* @__PURE__ */ jsx("span", {
			"data-motion-essential": true,
			className: cn("absolute inset-y-0 w-1/3 rounded-full luc-indeterminate", toneClass[tone])
		}) : /* @__PURE__ */ jsx(Progress.Indicator, {
			className: cn("h-full rounded-full luc-transition-slow", "[transition-property:width,background-color]", toneClass[tone]),
			style: { width: `${Math.min(Math.max(value ?? 0, 0), 100)}%` }
		})
	});
}
//#endregion
export { Progress$1 as Progress };

//# sourceMappingURL=progress.js.map