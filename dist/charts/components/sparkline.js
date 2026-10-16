"use client";
import { cn } from "../../utils/cn.js";
import { clamp } from "../../utils/format.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useMemo } from "react";
//#region src/charts/components/sparkline.tsx
const TONE_VAR = {
	accent: "var(--accent-default)",
	positive: "var(--positive)",
	negative: "var(--negative)",
	warning: "var(--warning)",
	neutral: "var(--fg-muted)"
};
function buildGeometry(values, width, height, pad) {
	const finite = values.filter((value) => typeof value === "number" && Number.isFinite(value));
	if (finite.length < 2) return {
		segments: [],
		last: null
	};
	const min = Math.min(...finite);
	const span = Math.max(...finite) - min || 1;
	const stepX = values.length > 1 ? width / (values.length - 1) : width;
	const segments = [];
	let current = [];
	values.forEach((value, index) => {
		if (typeof value !== "number" || !Number.isFinite(value)) {
			if (current.length > 1) segments.push({ points: current });
			current = [];
			return;
		}
		const x = index * stepX;
		const y = pad + (1 - (value - min) / span) * (height - pad * 2);
		current.push([x, y]);
	});
	if (current.length > 1) segments.push({ points: current });
	const lastSegment = segments[segments.length - 1];
	return {
		segments,
		last: lastSegment?.points[lastSegment.points.length - 1] ?? null
	};
}
function toPath(points) {
	return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}
/**
* Sparkline.
*
* No engine, no axis, no interaction: 8–60 points drawn as an SVG path. Keeping
* this out of ECharts means a table of sixty rows costs sixty cheap SVG paths
* rather than sixty chart instances.
*/
function Sparkline({ values, tone = "accent", autoTone = false, fill = false, marker = false, strokeWidth = 1.5, width = 240, height = 48, className, ariaLabel }) {
	const gradientId = useId();
	const pad = strokeWidth + 1;
	const resolvedTone = useMemo(() => {
		if (!autoTone) return tone;
		const finite = values.filter((value) => typeof value === "number" && Number.isFinite(value));
		const first = finite[0];
		const last = finite[finite.length - 1];
		if (first === void 0 || last === void 0) return "neutral";
		if (last > first) return "positive";
		if (last < first) return "negative";
		return "neutral";
	}, [
		autoTone,
		tone,
		values
	]);
	const { segments, last } = useMemo(() => buildGeometry(values, width, height, pad), [
		height,
		pad,
		values,
		width
	]);
	if (segments.length === 0) return /* @__PURE__ */ jsx("div", {
		className: cn("h-12 w-full rounded-sm bg-surface-sunken", className),
		"aria-hidden": "true"
	});
	const color = TONE_VAR[resolvedTone];
	const areaPath = fill && segments.length === 1 ? `${toPath(segments[0].points)} L${width} ${height} L0 ${height} Z` : null;
	return /* @__PURE__ */ jsxs("svg", {
		viewBox: `0 0 ${width} ${height}`,
		preserveAspectRatio: "none",
		className: cn("w-full", className),
		style: { height },
		role: ariaLabel ? "img" : void 0,
		"aria-label": ariaLabel,
		"aria-hidden": ariaLabel ? void 0 : true,
		children: [
			/* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", {
				id: gradientId,
				x1: "0",
				y1: "0",
				x2: "0",
				y2: "1",
				children: [/* @__PURE__ */ jsx("stop", {
					offset: "0%",
					stopColor: color,
					stopOpacity: "0.24"
				}), /* @__PURE__ */ jsx("stop", {
					offset: "100%",
					stopColor: color,
					stopOpacity: "0"
				})]
			}) }),
			areaPath ? /* @__PURE__ */ jsx("path", {
				d: areaPath,
				fill: `url(#${gradientId})`
			}) : null,
			segments.map((segment, index) => /* @__PURE__ */ jsx("path", {
				d: toPath(segment.points),
				fill: "none",
				stroke: color,
				strokeWidth,
				strokeLinecap: "round",
				strokeLinejoin: "round",
				vectorEffect: "non-scaling-stroke"
			}, index)),
			marker && last ? /* @__PURE__ */ jsx("circle", {
				cx: last[0],
				cy: last[1],
				r: 2.4,
				fill: color
			}) : null
		]
	});
}
/** Sparkline with a soft fill — the stat-card default. */
function SparkArea(props) {
	return /* @__PURE__ */ jsx(Sparkline, {
		...props,
		fill: true,
		marker: props.marker ?? true
	});
}
/**
* Mini bar chart for watchlist rows and table cells. Values are scaled from
* zero, because a bar chart with a non-zero baseline lies.
*/
function MiniBar({ values, tone = "accent", autoTone = false, height = 32, className, ariaLabel, gap = .28 }) {
	const finite = useMemo(() => values.map((value) => typeof value === "number" && Number.isFinite(value) ? value : null), [values]);
	const max = useMemo(() => Math.max(0, ...finite.map((value) => value ?? 0)), [finite]);
	const min = useMemo(() => Math.min(0, ...finite.map((value) => value ?? 0)), [finite]);
	const span = max - min || 1;
	const barWidth = 100 / Math.max(1, finite.length);
	const resolvedTone = useMemo(() => {
		if (!autoTone) return tone;
		const first = finite.findIndex((value) => value !== null);
		const lastIndex = [...finite].reverse().findIndex((value) => value !== null);
		const firstValue = first >= 0 ? finite[first] ?? null : null;
		const lastValue = lastIndex >= 0 ? finite[finite.length - 1 - lastIndex] ?? null : null;
		if (firstValue === null || lastValue === null) return "neutral";
		if (lastValue > firstValue) return "positive";
		if (lastValue < firstValue) return "negative";
		return "neutral";
	}, [
		autoTone,
		finite,
		tone
	]);
	if (finite.every((value) => value === null)) return /* @__PURE__ */ jsx("div", {
		className: cn("w-full rounded-sm bg-surface-sunken", className),
		style: { height },
		"aria-hidden": "true"
	});
	return /* @__PURE__ */ jsx("svg", {
		viewBox: "0 0 100 100",
		preserveAspectRatio: "none",
		className: cn("w-full", className),
		style: { height },
		role: ariaLabel ? "img" : void 0,
		"aria-label": ariaLabel,
		"aria-hidden": ariaLabel ? void 0 : true,
		children: finite.map((value, index) => {
			if (value === null) return null;
			const top = (1 - clamp((value - min) / span, 0, 1)) * 100;
			const baseline = (1 - clamp((0 - min) / span, 0, 1)) * 100;
			const y = Math.min(top, baseline);
			const h = Math.max(1.5, Math.abs(baseline - top));
			return /* @__PURE__ */ jsx("rect", {
				x: index * barWidth + barWidth * gap / 2,
				y,
				width: barWidth * (1 - gap),
				height: h,
				rx: 1.2,
				fill: TONE_VAR[resolvedTone],
				opacity: .85
			}, index);
		})
	});
}
//#endregion
export { MiniBar, SparkArea, Sparkline };

//# sourceMappingURL=sparkline.js.map