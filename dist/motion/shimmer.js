"use client";
import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
//#region src/motion/shimmer.tsx
function Shimmer({ className, active = true, speed = 1.9, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		"data-slot": "shimmer",
		className: cn("pointer-events-none absolute inset-0 -translate-x-full overflow-hidden", "bg-linear-to-r from-transparent via-line-default to-transparent", "motion-safe:animate-shimmer", !active && "hidden", className),
		style: { animationDuration: `${speed}s` },
		...props
	});
}
function ShimmerText({ className, children, animate = true, speed = 2.6, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "shimmer-text",
		className: cn("inline-block bg-[length:200%_100%] bg-clip-text text-transparent", "bg-[linear-gradient(100deg,var(--fg-muted)_0%,var(--fg-muted)_38%,var(--fg-primary)_50%,var(--fg-muted)_62%,var(--fg-muted)_100%)]", animate && "motion-safe:animate-[luc-sheen_var(--shimmer-speed)_linear_infinite]", className),
		style: { ["--shimmer-speed"]: `${speed}s` },
		...props,
		children
	});
}
//#endregion
export { Shimmer, ShimmerText };

//# sourceMappingURL=shimmer.js.map