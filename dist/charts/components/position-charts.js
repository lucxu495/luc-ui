"use client";
import { cn } from "../../utils/cn.js";
import { ChartEmptyState } from "../chart-card.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId } from "react";
//#region src/charts/components/position-charts.tsx
const DEFAULT_TICKS = [
	10,
	25,
	50,
	75,
	90
];
/**
* How close to an end the marker may be before the readout stops centring on it
* and aligns to the container edge instead. Twelve percent is roughly the width
* of "78th percentile" at this type size.
*/
const EDGE_PERCENT = 12;
const TONE_VAR = {
	accent: "var(--chart-series-1)",
	positive: "var(--chart-positive)",
	negative: "var(--chart-negative)",
	neutral: "var(--chart-neutral)",
	warning: "var(--chart-warning, var(--chart-neutral))"
};
function clampPercentile(value) {
	if (value === null || value === void 0) return null;
	if (!Number.isFinite(value)) return null;
	return Math.max(0, Math.min(100, value));
}
function HistoricalPositionChart({ percentile, value, ticks = DEFAULT_TICKS, percentileLabel, tone = "accent", height = 96, ariaLabel, ariaDescription, className }) {
	const position = clampPercentile(percentile);
	const label = ariaLabel ?? "Historical position";
	const descriptionId = useId();
	if (position === null) return /* @__PURE__ */ jsx("div", {
		className: cn("w-full", className),
		style: { height },
		children: /* @__PURE__ */ jsx(ChartEmptyState, {
			title: "No percentile",
			description: "This reading has no historical position yet."
		})
	});
	const markerColor = TONE_VAR[tone];
	const summary = [percentileLabel, value].filter((entry) => Boolean(entry)).join(" · ");
	const description = ariaDescription ?? (summary || `${Math.round(position)} percent`);
	return /* @__PURE__ */ jsxs("div", {
		role: "img",
		"aria-label": label,
		"aria-describedby": descriptionId,
		"data-slot": "historical-position",
		className: cn("relative w-full select-none", className),
		style: { height },
		children: [
			/* @__PURE__ */ jsx("span", {
				id: descriptionId,
				className: "sr-only",
				children: description
			}),
			/* @__PURE__ */ jsx("div", {
				className: "absolute inset-x-0 top-[46%] h-2 -translate-y-1/2 overflow-hidden rounded-full bg-line-subtle",
				children: /* @__PURE__ */ jsx("div", {
					"aria-hidden": "true",
					className: "h-full rounded-full",
					style: {
						width: `${position}%`,
						background: markerColor,
						opacity: .28
					}
				})
			}),
			ticks.map((tick) => /* @__PURE__ */ jsxs("div", {
				className: "absolute top-[46%] -translate-y-1/2",
				style: { left: `${Math.max(0, Math.min(100, tick))}%` },
				children: [/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: "block h-3 w-px -translate-x-1/2 bg-line-strong"
				}), /* @__PURE__ */ jsx("span", {
					className: "absolute left-0 top-4 -translate-x-1/2 text-micro text-fg-muted luc-numeric",
					children: tick
				})]
			}, tick)),
			/* @__PURE__ */ jsx("div", {
				"aria-hidden": "true",
				className: "absolute top-[46%] -translate-x-1/2 -translate-y-1/2",
				style: { left: `${position}%` },
				children: /* @__PURE__ */ jsx("span", {
					className: "block h-4 w-4 rounded-full border-2 border-surface-raised shadow-sm",
					style: { background: markerColor }
				})
			}),
			(value || percentileLabel) && /* @__PURE__ */ jsxs("div", {
				className: "absolute bottom-[54%] whitespace-nowrap",
				style: { ...position < EDGE_PERCENT ? {
					left: 0,
					textAlign: "left"
				} : position > 88 ? {
					right: 0,
					textAlign: "right"
				} : {
					left: `${position}%`,
					transform: "translateX(-50%)",
					textAlign: "center"
				} },
				children: [value ? /* @__PURE__ */ jsx("span", {
					className: "block text-caption font-medium text-fg-primary luc-numeric",
					children: value
				}) : null, percentileLabel ? /* @__PURE__ */ jsx("span", {
					className: "block text-micro text-fg-muted",
					children: percentileLabel
				}) : null]
			})
		]
	});
}
//#endregion
export { HistoricalPositionChart };

//# sourceMappingURL=position-charts.js.map