"use client";
import { cn } from "../../utils/cn.js";
import { formatChartValue } from "../core/formatters.js";
import { rampColor, sequentialPalette } from "../core/palette.js";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme.js";
import { baseOption, gridFragment, tooltipShell } from "../adapters/echarts/option.js";
import { tooltipGridHtml, tooltipShellHtml } from "../core/tooltip-html.js";
import { ChartSurface } from "./chart.js";
import { jsx } from "react/jsx-runtime";
import { useCallback, useMemo, useRef, useState } from "react";
//#region src/charts/components/surface3d-charts.tsx
const DEFAULT_VIEW = {
	azimuth: -34,
	elevation: 28
};
/** The caller's own axis label when it has one, otherwise the formatted index. */
function axisLabelText(labels, index, format) {
	const label = labels?.[index];
	if (typeof label === "string") return label;
	if (typeof label === "number") return formatChartValue(label, format);
	return formatChartValue(index, format);
}
/**
* The light, in *view* space: upper-left, in front of the surface.
*
* View space here is the frame the projection produces — `x` to the right,
* `y` up the screen (the projection flips it), `z` towards the viewer — so the
* shading follows the surface as the reader rotates it without the light moving.
*/
const VIEW_LIGHT = (() => {
	const [x, y, z] = [
		-.4,
		.5,
		.75
	];
	const length = Math.hypot(x, y, z) || 1;
	return [
		x / length,
		y / length,
		z / length
	];
})();
/**
* Lambert term for one quad, 0…1.
*
* The normal is computed in data space from two edge vectors and then rotated by
* the same yaw and pitch the projection applies, so a face tilted away from the
* light is darker whichever way the chart is turned. Faces seen from behind (a
* folded surface) are flipped so they are shaded as the front of the sheet.
*/
function quadIntensity(world, view) {
	const [a, b, c] = world;
	if (!a || !b || !c) return .55;
	const u = [
		b[0] - a[0],
		b[1] - a[1],
		b[2] - a[2]
	];
	const v = [
		c[0] - a[0],
		c[1] - a[1],
		c[2] - a[2]
	];
	let normal = [
		u[1] * v[2] - u[2] * v[1],
		u[2] * v[0] - u[0] * v[2],
		u[0] * v[1] - u[1] * v[0]
	];
	const length = Math.hypot(normal[0], normal[1], normal[2]);
	if (!(length > 0)) return .55;
	normal = [
		normal[0] / length,
		normal[1] / length,
		normal[2] / length
	];
	if (normal[2] < 0) normal = [
		-normal[0],
		-normal[1],
		-normal[2]
	];
	const azimuth = view.azimuth * Math.PI / 180;
	const elevation = view.elevation * Math.PI / 180;
	const x1 = normal[0] * Math.cos(azimuth) - normal[1] * Math.sin(azimuth);
	const y1 = normal[0] * Math.sin(azimuth) + normal[1] * Math.cos(azimuth);
	const y2 = y1 * Math.cos(elevation) - normal[2] * Math.sin(elevation);
	const z2 = y1 * Math.sin(elevation) + normal[2] * Math.cos(elevation);
	const intensity = x1 * VIEW_LIGHT[0] + -y2 * VIEW_LIGHT[1] + z2 * VIEW_LIGHT[2];
	return Math.max(0, Math.min(1, intensity));
}
function project(x, y, z, view) {
	const azimuth = view.azimuth * Math.PI / 180;
	const elevation = view.elevation * Math.PI / 180;
	const x1 = x * Math.cos(azimuth) - y * Math.sin(azimuth);
	const y1 = x * Math.sin(azimuth) + y * Math.cos(azimuth);
	const y2 = y1 * Math.cos(elevation) - z * Math.sin(elevation);
	const depth = y1 * Math.sin(elevation) + z * Math.cos(elevation);
	return {
		sx: x1,
		sy: -y2,
		depth
	};
}
function Surface3DChart({ z, xLabels, yLabels, xLabel = "x", yLabel = "y", zLabel = "z", azimuth, elevation, onViewChange, mode = "surface", zScale = .72, xFormat, yFormat, zFormat, title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const theme = useChartTheme();
	const motion = useChartMotion(theme);
	const controlled = azimuth !== void 0 || elevation !== void 0;
	const [internal, setInternal] = useState(DEFAULT_VIEW);
	const view = useMemo(() => ({
		azimuth: azimuth ?? internal.azimuth,
		elevation: elevation ?? internal.elevation
	}), [
		azimuth,
		elevation,
		internal.azimuth,
		internal.elevation
	]);
	const dragRef = useRef(null);
	const applyView = useCallback((next) => {
		const clamped = {
			azimuth: (next.azimuth % 360 + 360) % 360,
			elevation: Math.min(Math.max(next.elevation, -85), 85)
		};
		if (!controlled) setInternal(clamped);
		onViewChange?.(clamped);
	}, [controlled, onViewChange]);
	const rows = z.length;
	const columns = rows > 0 ? Math.max(...z.map((row) => row.length)) : 0;
	/** One reading per finite cell — what the pointer can interrogate. */
	const samples = useMemo(() => {
		const points = [];
		for (let row = 0; row < z.length; row += 1) for (let column = 0; column < (z[row]?.length ?? 0); column += 1) {
			const value = z[row]?.[column];
			if (typeof value !== "number" || !Number.isFinite(value)) continue;
			points.push([
				column,
				row,
				value
			]);
		}
		return points;
	}, [z]);
	const { flat, minZ, maxZ } = useMemo(() => {
		let min = Number.POSITIVE_INFINITY;
		let max = Number.NEGATIVE_INFINITY;
		const values = [];
		for (const row of z) for (const value of row) {
			if (typeof value !== "number" || !Number.isFinite(value)) continue;
			values.push(value);
			if (value < min) min = value;
			if (value > max) max = value;
		}
		if (values.length === 0) return {
			flat: [],
			minZ: 0,
			maxZ: 1
		};
		return {
			flat: values,
			minZ: min,
			maxZ: max
		};
	}, [z]);
	const option = useMemo(() => {
		const span = maxZ - minZ || 1;
		const ramp = sequentialPalette(theme, 9);
		const normalizeZ = (value) => (value - minZ) / span * zScale;
		return {
			...baseOption(theme, motion),
			grid: gridFragment({
				left: 0,
				right: 0,
				top: 0,
				bottom: 0,
				containLabel: false
			}),
			tooltip: tooltipShell(theme, {
				mode: "item",
				formatter: (params) => {
					const cell = params.value;
					if (!cell) return "";
					const [column = 0, row = 0, value = 0] = cell;
					return tooltipShellHtml(`${xLabel} ${axisLabelText(xLabels, column, xFormat)} · ${yLabel} ${axisLabelText(yLabels, row, yFormat)}`, tooltipGridHtml([[zLabel, formatChartValue(value, zFormat)]]));
				}
			}),
			xAxis: {
				type: "value",
				min: -1,
				max: 1,
				show: false
			},
			yAxis: {
				type: "value",
				min: -1,
				max: 1,
				show: false
			},
			series: [{
				name: zLabel,
				type: "custom",
				z: 1,
				silent: true,
				tooltip: { show: false },
				data: [[0]],
				renderItem: (_params, api) => {
					const helpers = api;
					const width = helpers.getWidth();
					const heightPx = helpers.getHeight();
					const scale = Math.min(width, heightPx) / 2 * .78;
					const centerX = width / 2 - 22;
					const centerY = heightPx / 2 + heightPx * .08;
					const toPixel = (x, y, zv) => {
						const point = project(x, y, zv, view);
						return [centerX + point.sx * scale, centerY + point.sy * scale];
					};
					const gridX = (column) => columns <= 1 ? 0 : column / (columns - 1) * 2 - 1;
					const gridY = (row) => rows <= 1 ? 0 : 1 - row / (rows - 1) * 2;
					const at = (row, column) => z[row]?.[column] ?? NaN;
					const quads = [];
					for (let row = 0; row < rows - 1; row += 1) for (let column = 0; column < columns - 1; column += 1) {
						const a = at(row, column);
						const b = at(row, column + 1);
						const c = at(row + 1, column + 1);
						const d = at(row + 1, column);
						if (![
							a,
							b,
							c,
							d
						].every((value) => Number.isFinite(value))) continue;
						const x0 = gridX(column);
						const x1 = gridX(column + 1);
						const y0 = gridY(row);
						const y1 = gridY(row + 1);
						const corners = [
							toPixel(x0, y0, normalizeZ(a)),
							toPixel(x1, y0, normalizeZ(b)),
							toPixel(x1, y1, normalizeZ(c)),
							toPixel(x0, y1, normalizeZ(d))
						];
						const depths = [
							project(x0, y0, normalizeZ(a ?? 0), view).depth,
							project(x1, y0, normalizeZ(b ?? 0), view).depth,
							project(x1, y1, normalizeZ(c ?? 0), view).depth,
							project(x0, y1, normalizeZ(d ?? 0), view).depth
						];
						const mean = ((a ?? 0) + (b ?? 0) + (c ?? 0) + (d ?? 0)) / 4;
						quads.push({
							corners,
							world: [
								[
									x0,
									y0,
									normalizeZ(a ?? 0)
								],
								[
									x1,
									y0,
									normalizeZ(b ?? 0)
								],
								[
									x1,
									y1,
									normalizeZ(c ?? 0)
								],
								[
									x0,
									y1,
									normalizeZ(d ?? 0)
								]
							],
							depth: ((depths[0] ?? 0) + (depths[1] ?? 0) + (depths[2] ?? 0) + (depths[3] ?? 0)) / 4,
							t: (mean - minZ) / span,
							row,
							column
						});
					}
					quads.sort((left, right) => left.depth - right.depth);
					const axisColor = theme.grid;
					const frameFont = `${theme.fontMicro}px ${theme.fontFamily}`;
					const frame = [];
					for (let column = 0; column < columns; column += 1) {
						const x = gridX(column);
						frame.push({
							type: "polyline",
							shape: { points: [toPixel(x, -1, 0), toPixel(x, 1, 0)] },
							style: {
								...helpers.style(),
								fill: "none",
								stroke: axisColor,
								lineWidth: .6,
								opacity: .45
							}
						});
					}
					for (let row = 0; row < rows; row += 1) {
						const y = gridY(row);
						frame.push({
							type: "polyline",
							shape: { points: [toPixel(-1, y, 0), toPixel(1, y, 0)] },
							style: {
								...helpers.style(),
								fill: "none",
								stroke: axisColor,
								lineWidth: .6,
								opacity: .45
							}
						});
					}
					const sampleArea = [];
					for (let column = 0; column < columns; column += 1) {
						const [x, y] = toPixel(gridX(column), -1, 0);
						sampleArea.push({
							type: "text",
							x,
							y: y + 16,
							style: {
								...helpers.style(),
								text: axisLabelText(xLabels, column, xFormat),
								fill: theme.textMuted,
								font: frameFont,
								align: "center",
								verticalAlign: "top"
							}
						});
					}
					for (let row = 0; row < rows; row += 1) {
						const [x, y] = toPixel(-1, gridY(row), 0);
						sampleArea.push({
							type: "text",
							x: x - 10,
							y,
							style: {
								...helpers.style(),
								text: axisLabelText(yLabels, row, yFormat),
								fill: theme.textMuted,
								font: frameFont,
								align: "right",
								verticalAlign: "middle"
							}
						});
					}
					const zBase = toPixel(1, 1, 0);
					const zTop = toPixel(1, 1, zScale);
					sampleArea.push({
						type: "polyline",
						shape: { points: [zBase, zTop] },
						style: {
							...helpers.style(),
							fill: "none",
							stroke: axisColor,
							lineWidth: 1,
							opacity: .8
						}
					});
					for (const fraction of [
						0,
						.5,
						1
					]) {
						const [x, y] = toPixel(1, 1, fraction * zScale);
						sampleArea.push({
							type: "polyline",
							shape: { points: [[x, y], [x + 6, y]] },
							style: {
								...helpers.style(),
								fill: "none",
								stroke: axisColor,
								lineWidth: 1
							}
						});
						sampleArea.push({
							type: "text",
							x: x + 11,
							y,
							style: {
								...helpers.style(),
								text: formatChartValue(minZ + (maxZ - minZ) * fraction, zFormat),
								fill: theme.textMuted,
								font: frameFont,
								align: "left",
								verticalAlign: "middle"
							}
						});
					}
					sampleArea.push({
						type: "text",
						x: 10,
						y: 12,
						style: {
							...helpers.style(),
							text: zLabel,
							fill: theme.textMuted,
							font: frameFont,
							align: "left",
							verticalAlign: "top"
						}
					});
					return {
						type: "group",
						children: [
							{
								type: "polygon",
								shape: { points: [
									toPixel(-1, 1, 0),
									toPixel(1, 1, 0),
									toPixel(1, -1, 0),
									toPixel(-1, -1, 0)
								] },
								style: {
									...helpers.style(),
									fill: theme.surfaceRaised,
									opacity: .5,
									stroke: "none"
								}
							},
							...quads.flatMap((quad) => {
								const base = {
									type: "polygon",
									shape: { points: quad.corners },
									style: {
										...helpers.style(),
										fill: mode === "wireframe" ? "none" : rampColor(ramp, quad.t),
										opacity: mode === "wireframe" ? 1 : .92,
										stroke: mode === "wireframe" ? theme.grid : theme.surface,
										lineWidth: mode === "wireframe" ? 1 : .5
									}
								};
								if (mode === "wireframe") return [base];
								const delta = quadIntensity(quad.world, view) - .55;
								return [base, {
									type: "polygon",
									shape: { points: quad.corners },
									silent: true,
									style: {
										...helpers.style(),
										fill: delta >= 0 ? "#ffffff" : "#000000",
										opacity: Math.min(.34, Math.abs(delta) * .9),
										stroke: "none"
									}
								}];
							}),
							...frame,
							...sampleArea
						]
					};
				}
			}, {
				name: `${xLabel} / ${yLabel}`,
				type: "custom",
				z: 2,
				data: samples,
				renderItem: (params, api) => {
					const helpers = api;
					const width = helpers.getWidth();
					const heightPx = helpers.getHeight();
					const scale = Math.min(width, heightPx) / 2 * .82;
					const centerX = width / 2;
					const centerY = heightPx / 2 + heightPx * .08;
					const column = helpers.value(0);
					const row = helpers.value(1);
					const value = helpers.value(2);
					const point = project(columns <= 1 ? 0 : column / (columns - 1) * 2 - 1, rows <= 1 ? 0 : 1 - row / (rows - 1) * 2, (value - minZ) / (maxZ - minZ || 1) * zScale, view);
					return {
						type: "circle",
						shape: {
							cx: centerX + point.sx * scale,
							cy: centerY + point.sy * scale,
							r: 2.4
						},
						style: {
							...helpers.style(),
							fill: theme.surface,
							stroke: theme.accent,
							lineWidth: 1.2
						}
					};
				}
			}]
		};
	}, [
		columns,
		maxZ,
		minZ,
		mode,
		motion,
		rows,
		samples,
		theme,
		view,
		xFormat,
		xLabel,
		xLabels,
		yFormat,
		yLabel,
		yLabels,
		z,
		zFormat,
		zLabel,
		zScale
	]);
	const interactive = !controlled;
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "surface-3d",
		tabIndex: interactive ? 0 : -1,
		role: "group",
		"aria-label": interactive ? "Interactive 3D surface. Use the arrow keys to rotate, Shift with the arrows to change elevation." : void 0,
		onKeyDown: interactive ? (event) => {
			const step = event.shiftKey ? 6 : 12;
			if (event.key === "ArrowLeft") applyView({
				...view,
				azimuth: view.azimuth - step
			});
			else if (event.key === "ArrowRight") applyView({
				...view,
				azimuth: view.azimuth + step
			});
			else if (event.key === "ArrowUp") applyView({
				...view,
				elevation: view.elevation + step
			});
			else if (event.key === "ArrowDown") applyView({
				...view,
				elevation: view.elevation - step
			});
			else if (event.key === "Home") applyView(DEFAULT_VIEW);
			else return;
			event.preventDefault();
		} : void 0,
		onPointerDown: interactive ? (event) => {
			event.currentTarget.setPointerCapture?.(event.pointerId);
			dragRef.current = {
				...view,
				x: event.clientX,
				y: event.clientY
			};
		} : void 0,
		onPointerMove: interactive ? (event) => {
			const start = dragRef.current;
			if (!start) return;
			applyView({
				azimuth: start.azimuth + (event.clientX - start.x) * .5,
				elevation: start.elevation - (event.clientY - start.y) * .4
			});
		} : void 0,
		onPointerUp: () => {
			dragRef.current = null;
		},
		onPointerCancel: () => {
			dragRef.current = null;
		},
		className: cn("h-full min-h-0", className),
		children: /* @__PURE__ */ jsx(ChartSurface, {
			option,
			state: flat.length === 0 || rows < 2 || columns < 2 ? "empty" : state,
			height: height ?? 360,
			ariaLabel: ariaLabel ?? title ?? `${zLabel} surface`,
			ariaDescription: ariaDescription ?? description ?? `A projected gridded surface. Azimuth ${Math.round(view.azimuth)}°, elevation ${Math.round(view.elevation)}°.`,
			copy: {
				emptyTitle: "Nothing to plot",
				emptyDescription: "A surface needs at least a 2 × 2 grid of finite values."
			},
			onReady,
			onEvent,
			eager
		})
	});
}
/**
* A volatility surface from a **supplied grid** of implied volatilities.
*
* The grid shape is deliberate. Turning a scatter of (strike, maturity, IV)
* quotes into a surface needs interpolation or a fitted parameterisation, and
* that is exactly the kind of hidden modelling this library refuses to do: the
* number under the pointer would no longer be a quote. A caller that has quotes
* fits its own surface, on its own terms, and passes the grid in — so the chart
* can only ever show volatilities somebody actually computed.
*/
function VolatilitySurfaceChart({ strikes, maturities, vols, strikeLabel = "Strike", maturityLabel = "Maturity", percent = true, azimuth, elevation, onViewChange, mode = "surface", title, description, state = "ready", height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }) {
	const scaler = percent ? 100 : 1;
	const scaled = useMemo(() => vols.map((row) => row.map((value) => Number.isFinite(value) ? value * scaler : NaN)), [scaler, vols]);
	return /* @__PURE__ */ jsx(Surface3DChart, {
		z: scaled,
		xLabels: strikes,
		yLabels: maturities,
		xLabel: strikeLabel,
		yLabel: maturityLabel,
		zLabel: "Implied volatility",
		azimuth,
		elevation,
		onViewChange,
		mode,
		xFormat: {
			kind: "number",
			decimals: 2
		},
		yFormat: {
			kind: "number",
			decimals: 2
		},
		zFormat: percent ? {
			kind: "percent",
			decimals: 2
		} : {
			kind: "number",
			decimals: 4
		},
		title,
		description: description ?? "Each cell is an implied volatility the caller computed; the library interpolates nothing.",
		state,
		height,
		className,
		ariaLabel: ariaLabel ?? title ?? "Volatility surface",
		ariaDescription,
		onReady,
		onEvent,
		eager
	});
}
//#endregion
export { Surface3DChart, VolatilitySurfaceChart };

//# sourceMappingURL=surface3d-charts.js.map