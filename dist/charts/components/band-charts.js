"use client";
import { withAlpha } from "../core/theme.js";
import { formatChartValue, timeSpanMs } from "../core/formatters.js";
import { fanPalette, seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, dataZoomFragment, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { annotationMarks } from "../adapters/echarts/marks.js";
import { tooltipGridHtml, tooltipRuleHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/band-charts.tsx
/**
* RangeBandChart — a line with an interval around it.
*
* The honest picture of an estimate with uncertainty: the centre is a line, the
* interval is one translucent band (never two more lines, which reads as four
* series). Consumers pass prepared bounds; LUC UI never computes an interval.
*/
function RangeBandChart({ points, format, bandLabel = "Range", annotations, interaction, syncGroup, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, "standard", points.length);
	const center = seriesColor(theme, "primary");
	const option = useMemo(() => {
		const times = points.map((point) => new Date(point.t).getTime());
		const xSpan = timeSpanMs(times);
		const base = times.map((time, index) => [time, points[index].lower]);
		const height = times.map((time, index) => [time, Math.max(0, points[index].upper - points[index].lower)]);
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 18,
				right: 14,
				bottom: 6
			}),
			xAxis: axisFragment({
				theme,
				type: "time",
				showGrid: false,
				...xSpan !== void 0 ? { spanMs: xSpan } : {}
			}),
			yAxis: axisFragment({
				theme,
				type: "value",
				position: "right",
				format,
				scale: true
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const point = points[(Array.isArray(params) ? params : [params])[0]?.dataIndex ?? -1];
					if (!point) return "";
					return tooltipShellHtml(new Date(point.t).toISOString().slice(0, 10), tooltipGridHtml([
						["Center", formatChartValue(point.center, format)],
						[bandLabel, `${formatChartValue(point.lower, format)} – ${formatChartValue(point.upper, format)}`],
						["Width", formatChartValue(point.upper - point.lower, format)]
					]), tooltipRuleHtml());
				}
			}),
			series: [
				{
					id: "band-base",
					type: "line",
					stack: "band",
					silent: true,
					symbol: "none",
					lineStyle: { opacity: 0 },
					areaStyle: { opacity: 0 },
					data: base
				},
				{
					id: "band",
					name: bandLabel,
					type: "line",
					stack: "band",
					silent: true,
					symbol: "none",
					lineStyle: { opacity: 0 },
					areaStyle: { color: withAlpha(center, theme.mode === "dark" ? .24 : .18) },
					data: height
				},
				{
					id: "center",
					name: "Center",
					type: "line",
					symbol: "none",
					smooth: false,
					lineStyle: {
						color: center,
						width: 2
					},
					emphasis: { focus: "series" },
					data: times.map((time, index) => [time, points[index].center]),
					...annotationMarks(theme, annotations)
				}
			],
			...dataZoomFragment({
				theme,
				interaction
			}).length ? { dataZoom: dataZoomFragment({
				theme,
				interaction
			}) } : {}
		};
	}, [
		annotations,
		bandLabel,
		center,
		format,
		interaction,
		motion,
		points,
		theme
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		xValues: points.map((point) => new Date(point.t).getTime()),
		syncGroup,
		state: points.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Range band chart",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
/**
* FanChart — nested quantile bands around a median.
*
* The canonical uncertainty visualisation: a Monte-Carlo path cloud, a bootstrap
* interval, a forecast cone. Bands are one hue at layered opacity (see
* `fanPalette`), because five hues would read as five unrelated series; the
* shared hue says "this is all the same estimate".
*
* Every quantile arrives prepared. LUC UI does not simulate.
*/
function FanChart({ x, bands, median, format, medianMode = "line", annotations, syncGroup, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme, "standard", x.length);
	const ramp = useMemo(() => fanPalette(theme, bands.length), [theme, bands.length]);
	const medianColor = seriesColor(theme, "primary");
	const option = useMemo(() => {
		const times = x.map((value) => new Date(value).getTime());
		const xSpan = timeSpanMs(times);
		const bandSeries = bands.flatMap((band, index) => {
			const fill = ramp[index] ?? withAlpha(medianColor, .2);
			const base = times.map((time, pointIndex) => [time, band.lower[pointIndex] ?? null]);
			const span = times.map((time, pointIndex) => {
				const low = band.lower[pointIndex];
				const high = band.upper[pointIndex];
				return [time, low === void 0 || high === void 0 ? null : Math.max(0, high - low)];
			});
			return [{
				id: `fan-base-${index}`,
				type: "line",
				stack: `fan-${index}`,
				silent: true,
				symbol: "none",
				lineStyle: { opacity: 0 },
				areaStyle: { opacity: 0 },
				data: base
			}, {
				id: `fan-band-${index}`,
				name: band.label,
				type: "line",
				stack: `fan-${index}`,
				silent: true,
				symbol: "none",
				lineStyle: { opacity: 0 },
				areaStyle: { color: fill },
				data: span
			}];
		});
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				top: 18,
				right: 14,
				bottom: 6
			}),
			legend: { show: false },
			xAxis: axisFragment({
				theme,
				type: "time",
				showGrid: false,
				...xSpan !== void 0 ? { spanMs: xSpan } : {}
			}),
			yAxis: axisFragment({
				theme,
				type: "value",
				position: "right",
				format,
				scale: true
			}),
			tooltip: tooltipShell(theme, {
				mode: "axis",
				formatter: (params) => {
					const index = (Array.isArray(params) ? params : [params])[0]?.dataIndex ?? -1;
					if (index < 0) return "";
					const rows = [];
					const medianValue = median[index];
					if (medianValue !== void 0) rows.push(["Median", formatChartValue(medianValue, format)]);
					for (const band of bands) {
						const low = band.lower[index];
						const high = band.upper[index];
						if (low === void 0 || high === void 0) continue;
						rows.push([band.label, `${formatChartValue(low, format)} – ${formatChartValue(high, format)}`]);
					}
					const stamp = x[index];
					return tooltipShellHtml(stamp === void 0 ? "" : new Date(stamp).toISOString().slice(0, 10), tooltipGridHtml(rows));
				}
			}),
			series: [...bandSeries, {
				id: "fan-median",
				name: "Median",
				type: "line",
				symbol: "none",
				lineStyle: {
					color: medianColor,
					width: 2.25
				},
				...medianMode === "area" ? { areaStyle: { color: withAlpha(medianColor, theme.mode === "dark" ? .16 : .12) } } : {},
				data: times.map((time, index) => [time, median[index] ?? null]),
				...annotationMarks(theme, annotations)
			}]
		};
	}, [
		annotations,
		bands,
		format,
		median,
		medianColor,
		medianMode,
		motion,
		ramp,
		theme,
		x
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		xValues: x.map((value) => new Date(value).getTime()),
		syncGroup,
		state: x.length === 0 || bands.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Fan chart",
		ariaDescription: ariaDescription ?? description,
		onReady,
		onEvent
	});
}
//#endregion
export { FanChart, RangeBandChart };

//# sourceMappingURL=band-charts.js.map