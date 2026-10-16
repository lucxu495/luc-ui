"use client";
import { formatChartValue } from "../core/formatters.js";
import { seriesColor } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { axisFragment, baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/charts/components/geo-charts.tsx
function ChoroplethChart({ mapName, regions, nameProperty = "name", format, valueLabel = "Value", ramp = "sequential", title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const option = useMemo(() => {
		const values = regions.map((region) => region.value).filter((value) => typeof value === "number");
		const min = values.length > 0 ? Math.min(...values) : 0;
		const max = values.length > 0 ? Math.max(...values) : 1;
		const anchors = ramp === "diverging" ? theme.divergingAnchors : theme.sequentialAnchors;
		const bound = Math.max(Math.abs(min), Math.abs(max));
		const rampMin = ramp === "diverging" ? -bound : min;
		const rampMax = ramp === "diverging" ? bound : max;
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				containLabel: false,
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const item = params;
					const value = regions.find((region) => region.id === item.name)?.value ?? null;
					return tooltipShellHtml(item.name ?? "Region", tooltipGridHtml([[valueLabel, value === null ? "No data" : formatChartValue(value, format)]]));
				}
			}),
			visualMap: {
				type: "continuous",
				min: rampMin,
				max: rampMax,
				inRange: { color: [...anchors] },
				outOfRange: { color: [theme.borderSubtle] },
				text: [formatChartValue(rampMax, format), formatChartValue(rampMin, format)],
				textStyle: {
					color: theme.textMuted,
					fontFamily: theme.fontFamily,
					fontSize: theme.fontCaption
				},
				left: 8,
				bottom: 8,
				itemWidth: 10,
				itemHeight: 90,
				calculable: false,
				formatter: (value) => formatChartValue(value, format)
			},
			series: [{
				name: valueLabel,
				type: "map",
				map: mapName,
				nameProperty,
				roam: true,
				scaleLimit: {
					min: 1,
					max: 8
				},
				selectedMode: false,
				data: regions.map((region) => ({
					name: region.id,
					value: region.value ?? NaN
				})),
				itemStyle: {
					borderColor: theme.surface,
					borderWidth: .6,
					areaColor: theme.borderSubtle
				},
				emphasis: {
					label: {
						show: true,
						color: theme.textPrimary,
						fontSize: theme.fontCaption
					},
					itemStyle: { areaColor: theme.accent }
				},
				select: { disabled: true }
			}]
		};
	}, [
		format,
		mapName,
		motion,
		nameProperty,
		ramp,
		regions,
		theme,
		valueLabel
	]);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: regions.length === 0 ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Choropleth map",
		ariaDescription: ariaDescription ?? description ?? `Regions come from the "${mapName}" map the application registered; regions without a value are drawn as no-data.`,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: `No regions were supplied for the "${mapName}" map.`
		},
		onReady,
		onEvent,
		eager
	});
}
/** Shift a longitude sequence so a meridian crossing becomes a small step. */
function unwrapLongitudes(points) {
	let offset = 0;
	let previousX = null;
	return points.map((point, index) => {
		if (index > 0 && previousX !== null) {
			const delta = point.x + offset - previousX;
			if (delta > 180) offset -= 360;
			else if (delta < -180) offset += 360;
		}
		const x = point.x + offset;
		previousX = x;
		return {
			...point,
			x
		};
	});
}
function GeoTrajectoryChart({ trajectories, unwrap = true, xLabel = "Longitude", yLabel = "Latitude", format, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const prepared = useMemo(() => trajectories.map((trajectory) => ({
		...trajectory,
		points: unwrap ? unwrapLongitudes(trajectory.points) : [...trajectory.points]
	})), [trajectories, unwrap]);
	const option = useMemo(() => {
		const lons = prepared.flatMap((trajectory) => trajectory.points.map((point) => point.x));
		const lats = prepared.flatMap((trajectory) => trajectory.points.map((point) => point.y));
		const bounds = (values) => {
			if (values.length === 0) return [0, 1];
			const min = Math.min(...values);
			const max = Math.max(...values);
			const pad = (max - min || 1) * .08;
			return [min - pad, max + pad];
		};
		const [xMin, xMax] = bounds(lons);
		const [yMin, yMax] = bounds(lats);
		return {
			...baseOption(theme, motion),
			grid: gridFragment({ containLabel: true }),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const route = prepared[params.seriesIndex ?? 0];
					const first = route?.points[0];
					if (!route || !first) return "";
					return tooltipShellHtml(route.label, tooltipGridHtml([
						[xLabel, formatChartValue(first.x, format)],
						[yLabel, formatChartValue(first.y, format)],
						["Points", String(route.points.length)]
					]));
				}
			}),
			xAxis: axisFragment({
				type: "value",
				theme,
				min: xMin,
				max: xMax,
				scale: true
			}),
			yAxis: axisFragment({
				type: "value",
				theme,
				position: "right",
				min: yMin,
				max: yMax,
				scale: true
			}),
			series: prepared.map((trajectory, index) => ({
				name: trajectory.label,
				type: "custom",
				z: trajectory.highlight ? 3 : 2,
				data: [[index]],
				renderItem: (params, api) => {
					const helpers = api;
					const raw = trajectory.points;
					if (raw.length < 2) return {
						type: "group",
						children: []
					};
					const pathData = raw.map((point) => helpers.coord([point.x, point.y])).map(([x, y], position) => `${position === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
					const color = seriesColor(theme, trajectory.id, index);
					return {
						type: "path",
						shape: { pathData },
						style: {
							...helpers.style(),
							fill: "none",
							stroke: color,
							lineWidth: trajectory.highlight ? 2.4 : 1.6,
							opacity: trajectory.highlight ? 1 : .72
						},
						emphasis: { style: {
							lineWidth: 3,
							opacity: 1
						} }
					};
				}
			}))
		};
	}, [
		format,
		motion,
		prepared,
		theme,
		xLabel,
		yLabel
	]);
	const empty = prepared.every((trajectory) => trajectory.points.length < 2);
	return /* @__PURE__ */ jsx(ChartSurface, {
		option,
		state: empty ? "empty" : state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Geographic trajectories",
		ariaDescription: ariaDescription ?? description ?? `${yLabel} against ${xLabel}${unwrap ? "; paths crossing the antimeridian are unwrapped for display" : ""}.`,
		copy: {
			emptyTitle: "Nothing to plot",
			emptyDescription: "Every route needs at least two coordinates."
		},
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { ChoroplethChart, GeoTrajectoryChart, unwrapLongitudes };

//# sourceMappingURL=geo-charts.js.map