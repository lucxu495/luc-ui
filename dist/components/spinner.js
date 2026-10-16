"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/spinner.tsx
/**
* LUC Spinner — a single confident arc, no gimmicks.
*
* Under `prefers-reduced-motion` the rotation is replaced by a slow pulse, so
* the indicator keeps meaning without travelling. See docs/MOTION_GUIDE.md.
*/
function Spinner({ size = 16, label = "Loading", className, ...props }) {
	const reducedMotion = useReducedMotion();
	return /* @__PURE__ */ jsxs("span", {
		"data-slot": "spinner",
		role: label ? "status" : void 0,
		className: cn("inline-flex shrink-0 items-center justify-center text-fg-accent", className),
		...props,
		children: [/* @__PURE__ */ jsxs("svg", {
			width: size,
			height: size,
			viewBox: "0 0 24 24",
			fill: "none",
			"aria-hidden": "true",
			focusable: "false",
			className: cn(reducedMotion ? "animate-pulse-soft" : "animate-spin-soft", "will-change-transform"),
			"data-motion-essential": true,
			children: [/* @__PURE__ */ jsx("circle", {
				cx: "12",
				cy: "12",
				r: "9",
				stroke: "currentColor",
				strokeOpacity: "0.22",
				strokeWidth: "2.5"
			}), /* @__PURE__ */ jsx("path", {
				d: "M21 12a9 9 0 0 0-9-9",
				stroke: "currentColor",
				strokeWidth: "2.5",
				strokeLinecap: "round"
			})]
		}), label ? /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: label
		}) : null]
	});
}
//#endregion
export { Spinner };

//# sourceMappingURL=spinner.js.map