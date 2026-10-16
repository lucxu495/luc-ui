import { cn } from "../utils/cn.js";
import { Card } from "../components/card.js";
import { Delta } from "./delta.js";
import { MetricValue } from "./metric.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/data/stat-card.tsx
function StatCard({ className, label, value, delta, deltaLabel, invertDelta = false, icon, aside, visual, footer, size = "lg", kind, currency, suffix, minimumFractionDigits, maximumFractionDigits, selected = false, interactive = false, ...props }) {
	return /* @__PURE__ */ jsxs(Card, {
		"data-slot": "stat-card",
		variant: "raised",
		selected,
		interactive,
		className: cn("gap-3 p-4", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ jsxs("span", {
					className: "flex items-center gap-2 text-micro text-fg-muted uppercase",
					children: [icon ? /* @__PURE__ */ jsx("span", {
						className: "text-fg-disabled [&_svg]:size-3.5",
						children: icon
					}) : null, label]
				}), aside]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5",
				children: [/* @__PURE__ */ jsx(MetricValue, {
					value,
					size,
					kind,
					currency,
					suffix,
					minimumFractionDigits,
					maximumFractionDigits
				}), delta !== void 0 ? /* @__PURE__ */ jsxs("span", {
					className: "flex items-center gap-1.5 pb-1",
					children: [/* @__PURE__ */ jsx(Delta, {
						value: delta,
						invert: invertDelta
					}), deltaLabel ? /* @__PURE__ */ jsx("span", {
						className: "text-caption text-fg-muted",
						children: deltaLabel
					}) : null]
				}) : null]
			}),
			visual ? /* @__PURE__ */ jsx("div", {
				className: "min-h-0",
				children: visual
			}) : null,
			footer ? /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-center gap-2 border-t border-line-subtle pt-2.5 text-caption text-fg-muted",
				children: footer
			}) : null
		]
	});
}
//#endregion
export { StatCard };

//# sourceMappingURL=stat-card.js.map