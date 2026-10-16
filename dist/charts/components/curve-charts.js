"use client";
import { Chart } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/curve-charts.tsx
/**
* Curves that share an ordered x axis.
*
* Deliberately generic: an interest-rate curve, a volatility smile, a yield
* curve and a factor profile are the same visual problem. Consumers pass
* prepared values; LUC UI never derives a curve.
*/
function CurveComparisonChart({ xLabels, curves, xLabel, yLabel, format, xFormat, annotations, interaction, syncGroup, visibleSeries, scaleMode, allowedScaleModes, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const numericX = xLabels.length > 0 && xLabels.every((label) => typeof label === "number");
	const scaleSpec = useMemo(() => {
		if (!scaleMode && !allowedScaleModes) return void 0;
		const allowed = allowedScaleModes ?? ["linear", "log"];
		return {
			allowed,
			default: allowed[0],
			mode: scaleMode ?? allowed[0]
		};
	}, [allowedScaleModes, scaleMode]);
	const { rows, series } = useMemo(() => {
		return {
			rows: xLabels.map((label, index) => {
				const row = { x: label };
				curves.forEach((curve) => {
					row[curve.name] = curve.values[index] ?? null;
				});
				return row;
			}),
			series: curves.map((curve) => ({
				key: curve.name,
				label: curve.name,
				type: "line",
				tone: curve.tone,
				palette: curve.palette,
				smooth: true,
				symbol: true,
				lineWidth: curve.emphasis ? 2.6 : 1.6,
				lineType: curve.lineType ?? "solid",
				opacity: curve.emphasis ? 1 : .85,
				format
			}))
		};
	}, [
		curves,
		format,
		xLabels
	]);
	return /* @__PURE__ */ jsx(Chart, {
		spec: {
			family: "line",
			data: rows,
			xKey: "x",
			x: {
				type: numericX ? "value" : "category",
				label: xLabel,
				format: numericX ? xFormat ?? format : void 0
			},
			axes: [{
				id: "primary",
				label: yLabel,
				format
			}],
			scale: scaleSpec,
			series,
			annotations,
			interaction: interaction ?? { zoom: "inside" },
			tooltip: { mode: "axis" },
			syncGroup
		},
		state: curves.length === 0 || xLabels.length === 0 ? "empty" : state,
		height,
		className,
		visibleSeries,
		ariaLabel: ariaLabel ?? title ?? "Curve comparison",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
/**
* Term structure (rates, futures, volatility by expiry).
*
* A thin specialisation of the curve chart: the tenor axis is ordered and the
* tooltip names the tenor rather than an index.
*/
function TermStructureChart({ tenors, ...props }) {
	const ordered = useMemo(() => {
		if (!tenors.every((tenor) => typeof tenor === "number")) return [...tenors];
		return [...tenors].sort((a, b) => a - b);
	}, [tenors]);
	return /* @__PURE__ */ jsx(CurveComparisonChart, {
		...props,
		xLabels: ordered,
		xLabel: props.xLabel ?? "Tenor"
	});
}
/**
* Market-depth / order-book depth.
*
* Two prepared cumulative curves around a mid price. Both sides are area series
* on a shared price axis, so the crossing point reads as the spread.
*/
function DepthChart({ bids, asks, mid, priceFormat, sizeFormat, title, description, state = "ready", height, className, syncGroup, ariaLabel, ariaDescription, onReady, onEvent }) {
	const rows = useMemo(() => {
		const data = [];
		bids.forEach((point) => data.push({
			price: point.price,
			bid: point.size,
			ask: null
		}));
		asks.forEach((point) => data.push({
			price: point.price,
			bid: null,
			ask: point.size
		}));
		data.sort((a, b) => Number(a.price) - Number(b.price));
		return data;
	}, [asks, bids]);
	const midPrice = mid ?? (bids[0] && asks[0] ? (bids[0].price + asks[0].price) / 2 : void 0);
	return /* @__PURE__ */ jsx(Chart, {
		spec: {
			family: "area",
			data: rows,
			xKey: "price",
			x: {
				type: "value",
				label: "Price",
				format: priceFormat
			},
			axes: [{
				id: "primary",
				label: "Cumulative size",
				format: sizeFormat
			}],
			series: [{
				key: "bid",
				label: "Bids",
				type: "area",
				tone: "positive",
				smooth: true,
				lineWidth: 1.6
			}, {
				key: "ask",
				label: "Asks",
				type: "area",
				tone: "negative",
				smooth: true,
				lineWidth: 1.6
			}],
			annotations: midPrice ? { referenceLines: [{
				value: midPrice,
				axis: "x",
				label: "Mid",
				tone: "neutral"
			}] } : void 0,
			interaction: { zoom: "none" },
			tooltip: { mode: "axis" },
			syncGroup
		},
		state: rows.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Market depth",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
//#endregion
export { CurveComparisonChart, DepthChart, TermStructureChart };

//# sourceMappingURL=curve-charts.js.map