import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/timeline.tsx
const dotClass = {
	neutral: "border-line-default bg-surface-raised text-fg-muted",
	accent: "border-line-accent bg-accent-soft text-fg-accent",
	positive: "border-positive-line bg-positive-soft text-fg-positive",
	negative: "border-negative-line bg-negative-soft text-fg-negative",
	warning: "border-warning-line bg-warning-soft text-fg-warning",
	info: "border-info-line bg-info-soft text-fg-info"
};
function Timeline({ className, items, variant = "rail", density = "default", ...props }) {
	return /* @__PURE__ */ jsx("ol", {
		"data-slot": "timeline",
		"data-variant": variant,
		className: cn("relative flex flex-col", className),
		...props,
		children: items.map((item, index) => {
			const last = index === items.length - 1;
			return /* @__PURE__ */ jsxs("li", {
				"data-slot": "timeline-item",
				"data-tone": item.tone ?? "neutral",
				className: cn("relative flex gap-3", density === "compact" ? "pb-3" : "pb-5", last && "pb-0", item.muted && "text-fg-muted"),
				children: [/* @__PURE__ */ jsxs("div", {
					className: "relative flex shrink-0 flex-col items-center",
					children: [/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						"data-slot": "timeline-marker",
						className: cn("z-[1] grid shrink-0 place-items-center rounded-full border", "shadow-rest", item.icon ? "size-7" : "size-3", density === "compact" && !item.icon && "size-2.5", dotClass[item.tone ?? "neutral"], "[&_svg]:size-3.5"),
						children: item.icon
					}), variant === "rail" && !last ? /* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						"data-slot": "timeline-rail",
						className: "w-px grow bg-line-subtle"
					}) : null]
				}), /* @__PURE__ */ jsxs("div", {
					className: cn("min-w-0 flex-1", !item.icon && "pt-0.5"),
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1",
							children: [/* @__PURE__ */ jsx("span", {
								className: cn("text-label font-medium", item.muted ? "text-fg-muted" : "text-fg-primary"),
								children: item.title
							}), item.meta ? /* @__PURE__ */ jsx("span", {
								className: "text-micro text-fg-muted luc-numeric",
								children: item.meta
							}) : null]
						}),
						item.description ? /* @__PURE__ */ jsx("p", {
							className: "mt-1 text-caption text-fg-secondary",
							children: item.description
						}) : null,
						item.detail ? /* @__PURE__ */ jsx("div", {
							className: "mt-2",
							children: item.detail
						}) : null
					]
				})]
			}, item.id);
		})
	});
}
//#endregion
export { Timeline };

//# sourceMappingURL=timeline.js.map