"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
//#region src/motion/data-change-flash.tsx
const TONE_CLASS = {
	positive: "bg-[color-mix(in_oklab,var(--positive)_16%,transparent)]",
	negative: "bg-[color-mix(in_oklab,var(--negative)_16%,transparent)]",
	neutral: "bg-[color-mix(in_oklab,var(--accent-default)_14%,transparent)]"
};
function DataChangeFlash({ className, value, tone = "neutral", duration = 720, children, ...props }) {
	const reduced = useReducedMotion();
	const previous = useRef(value);
	const [flashing, setFlashing] = useState(false);
	useEffect(() => {
		const before = previous.current;
		previous.current = value;
		if (before === void 0 || reduced) return;
		if (before === value || typeof before === "number" && typeof value === "number" && Number.isNaN(before) && Number.isNaN(value)) return;
		setFlashing(true);
		const timer = window.setTimeout(() => setFlashing(false), duration);
		return () => window.clearTimeout(timer);
	}, [
		value,
		duration,
		reduced
	]);
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "data-change-flash",
		"data-tone": tone,
		"data-flashing": flashing ? "true" : void 0,
		className: cn("relative min-w-0", className),
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			"data-slot": "data-change-flash-tint",
			className: cn("pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity", TONE_CLASS[tone], flashing && "opacity-100 duration-150", !flashing && "duration-[600ms]")
		}), /* @__PURE__ */ jsx("span", {
			className: "relative",
			children
		})]
	});
}
//#endregion
export { DataChangeFlash };

//# sourceMappingURL=data-change-flash.js.map