import { cn } from "../utils/cn.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/skeleton.tsx
/**
* LUC Skeleton — the default loading treatment for content and data.
*
* A skeleton communicates *shape*; a spinner only communicates *waiting*.
* Prefer skeletons for pages and panels, spinners for small actions.
*/
function Skeleton({ className, variant = "block", shimmer = true, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "skeleton",
		"aria-hidden": "true",
		className: cn("relative isolate overflow-hidden bg-surface-interactive", variant === "text" && "h-3 w-full rounded-sm", variant === "block" && "min-h-8 w-full rounded-md", variant === "circle" && "size-8 rounded-full", shimmer && "after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-line-default after:to-transparent motion-safe:after:animate-shimmer", className),
		...props
	});
}
function SkeletonText({ lines = 3, widths, className, ...props }) {
	const defaultWidths = [
		"100%",
		"92%",
		"78%",
		"88%",
		"64%"
	];
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "skeleton-text",
		className: cn("flex flex-col gap-2", className),
		children: Array.from({ length: lines }).map((_, index) => /* @__PURE__ */ jsx(Skeleton, {
			variant: "text",
			style: { width: widths?.[index] ?? defaultWidths[index % defaultWidths.length] },
			...props
		}, index))
	});
}
//#endregion
export { Skeleton, SkeletonText };

//# sourceMappingURL=skeleton.js.map