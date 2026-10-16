import { cn } from "../utils/cn.js";
import { formatNumber } from "../utils/format.js";
import { NumberTicker } from "../motion/number-ticker.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/data/metric.tsx
const valueSize = {
	sm: "text-title",
	md: "text-heading-sm",
	lg: "text-heading",
	xl: "text-display-sm"
};
function Metric({ className, label, meta, aside, children, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "metric",
		className: cn("flex min-w-0 flex-col gap-1.5", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-micro text-fg-muted uppercase",
					children: label
				}), aside]
			}),
			children,
			meta ? /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-center gap-2 text-caption text-fg-muted",
				children: meta
			}) : null
		]
	});
}
function MetricValue({ className, value, size = "lg", kind = "number", currency, suffix, signed, minimumFractionDigits, maximumFractionDigits, locale, animate = true, variant = "digits", display = true, format, ...props }) {
	const classes = cn(valueSize[size], display && "font-display", "font-semibold text-fg-primary luc-numeric", className);
	if (!animate) return /* @__PURE__ */ jsx("span", {
		"data-slot": "metric-value",
		"data-numeric": true,
		className: classes,
		...props,
		children: format ? value === null || value === void 0 || !Number.isFinite(value) ? "—" : format(value) : formatNumber(value, {
			kind,
			currency,
			suffix,
			signed,
			locale,
			minimumFractionDigits,
			maximumFractionDigits
		})
	});
	return /* @__PURE__ */ jsx(NumberTicker, {
		"data-slot": "metric-value",
		className: classes,
		value,
		kind,
		currency,
		suffix,
		signed,
		locale,
		minimumFractionDigits,
		maximumFractionDigits,
		variant,
		format,
		...props
	});
}
//#endregion
export { Metric, MetricValue };

//# sourceMappingURL=metric.js.map