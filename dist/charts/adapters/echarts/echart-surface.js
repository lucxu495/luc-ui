"use client";
import { normalizeCursorX, normalizeRange } from "../../core/sync.js";
import { useChartSyncBus } from "../../core/sync-context.js";
import { nearestIndex } from "../../core/data.js";
import { watchPlateGesture } from "../../core/gesture.js";
import { useChartId, useLatest } from "../../core/use-chart-theme.js";
import { ensureSvgRenderer, loadECharts } from "./runtime.js";
import { useChartArm } from "../../core/use-chart-arm.js";
import { axisTargetAt, plotRect, scaleValueRange, scaleWindow, windowFractions } from "../../core/axis-drag.js";
import { ECHARTS_GLOBAL_OPTION, ECHARTS_INIT_OPTIONS } from "./echart-init.js";
import { collectChartDiagnostics, serializeDiagnostics } from "../../core/diagnostics.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
//#region src/charts/adapters/echarts/echart-surface.tsx
function axesFromOption(option, key) {
	const value = option[key];
	if (Array.isArray(value)) return value;
	return value && typeof value === "object" ? [value] : [];
}
function formatPointerAxisValue(axis, value, gridIndex) {
	if (typeof value !== "number" || !Number.isFinite(value)) return null;
	const formatter = axis.axisPointer?.label?.formatter;
	try {
		if (typeof formatter === "function") {
			const formatted = formatter(value, gridIndex);
			if (formatted === null || formatted === void 0) return null;
			return String(formatted) || null;
		}
	} catch {
		return null;
	}
	if (axis.type === "category" && axis.data) {
		const index = Math.max(0, Math.min(axis.data.length - 1, Math.round(value)));
		return axis.data[index] == null ? null : String(axis.data[index]);
	}
	return String(value);
}
/**
* The one place ECharts is created, resized, synchronised and disposed.
*
* Chart family components never touch the engine lifecycle: they build an
* option object and hand it here. That keeps cleanup, resize and cross-chart
* synchronisation identical for all ~20 chart types.
*/
function EChartSurface({ option, xValues, syncGroup, className, ariaLabel, ariaDescription, onReady, onEvent, eager = false, onVisibleSpan, renderer = "canvas", axisDrag = true }) {
	const hostRef = useRef(null);
	const chartRef = useRef(null);
	const sizeRef = useRef({
		width: 0,
		height: 0
	});
	const applyingRef = useRef(false);
	/**
	* The group's window, applied by this surface.
	*
	* Held in a ref because the engine is created *after* the subscription exists
	* (see `useChartArm`), so the state a late member must adopt has to be
	* applied once the engine is up as well as when the state changes.
	*/
	const applyRangeRef = useRef(() => {});
	/**
	* The reader's own input on this plate (see `core/gesture.ts`).
	*
	* `dataZoom` fires for a wheel, a drag, a slider — and for every programmatic
	* `dispatchAction`, for an option re-apply, and for a `resize`. Only the first
	* group is a reader choosing a window, so only a live gesture may publish.
	*/
	const gestureRef = useRef(null);
	/**
	* The Y range this plate is on because the *reader* dragged the value axis.
	*
	* Local inspection state, deliberately not part of any sync group: two metrics
	* with different units must never share a value scale, and a value-axis drag
	* changes no time range, so it publishes nothing. `null` means autoscale, which
	* is also what a double-click on the axis restores.
	*/
	const localYRangeRef = useRef({});
	/** Detaches the axis-interaction listeners created with the engine. */
	const axisCleanupRef = useRef(null);
	/**
	* The last option object handed to the engine. Used to skip the redundant
	* re-apply that otherwise lands immediately after init and restarts the
	* intro animation (see the option effect below).
	*/
	const appliedOptionRef = useRef(null);
	/**
	* Re-applies a cursor. Kept in a ref so the engine's own pointer events (set up
	* once, below) can re-assert a pinned crosshair without rebuilding the chart.
	*/
	const applyCursorRef = useRef(() => {});
	/**
	* Re-applies a range. Kept in a ref so the surface can adopt a window the
	* group already agreed on *before* this chart subscribed — a range control
	* and a chart mounting in the same commit run their effects in tree order, so
	* the control can publish first and the chart would otherwise miss it and
	* show its full domain under a button that claims a window.
	*/
	const [ready, setReady] = useState(false);
	const bus = useChartSyncBus();
	const id = useChartId("echart");
	const descriptionId = `${id}-description`;
	const syncGroupRef = useLatest(syncGroup);
	const xValuesRef = useLatest(xValues);
	const onEventRef = useLatest(onEvent);
	const onReadyRef = useLatest(onReady);
	const onVisibleSpanRef = useLatest(onVisibleSpan);
	const latestOption = useLatest(option);
	const axisDragRef = useLatest(axisDrag);
	/**
	* The span the engine currently shows, read back from its own dataZoom model.
	*
	* `dataZoom` state is the engine's truth: a range control, a pan and a pinch
	* all land there, so one reader covers every way the window can change.
	*/
	const reportVisibleSpan = useCallback(() => {
		const chart = chartRef.current;
		if (!chart) return;
		let start = 0;
		let end = 100;
		try {
			const zoom = chart.getOption().dataZoom?.[0];
			if (zoom) {
				start = typeof zoom.start === "number" ? zoom.start : 0;
				end = typeof zoom.end === "number" ? zoom.end : 100;
			}
		} catch {}
		const host = hostRef.current;
		if (host) {
			host.dataset.dataZoomStart = String(start);
			host.dataset.dataZoomEnd = String(end);
		}
		const x = xValuesRef.current;
		if (!x || x.length < 2) return;
		const lo = x[0];
		const full = x[x.length - 1] - lo;
		if (!(full > 0)) return;
		const span = full * (end - start) / 100;
		if (host) host.dataset.visibleSpan = String(span > 0 ? span : full);
		onVisibleSpanRef.current?.(span > 0 ? span : full);
	}, [onVisibleSpanRef, xValuesRef]);
	const armed = useChartArm(hostRef, !eager);
	/**
	* Publish the frame's geometry on the host element.
	*
	* Called from the engine's own `finished` event — the moment a frame is really on
	* screen — so QA reads the layout the visitor sees rather than an intermediate
	* one. The attribute is a *reading*: nothing in the library consumes it, and a
	* failure to collect it leaves the attribute absent rather than throwing.
	*/
	const publishDiagnostics = useCallback(() => {
		const chart = chartRef.current;
		const host = hostRef.current;
		if (!chart || !host) return;
		try {
			const serialized = serializeDiagnostics(collectChartDiagnostics(chart));
			if (serialized) host.dataset.lucChartDiagnostics = serialized;
		} catch {}
	}, []);
	useEffect(() => {
		if (!armed) return;
		let disposed = false;
		let observer = null;
		const host = hostRef.current;
		if (!host) return;
		gestureRef.current?.dispose();
		gestureRef.current = watchPlateGesture(host);
		(renderer === "svg" ? ensureSvgRenderer().then(loadECharts) : loadECharts()).then((core) => {
			if (disposed || !hostRef.current) return;
			const chart = core.init(hostRef.current, void 0, {
				renderer,
				...ECHARTS_INIT_OPTIONS
			});
			chartRef.current = chart;
			chart.on("finished", publishDiagnostics);
			chart.setOption({
				...ECHARTS_GLOBAL_OPTION,
				...latestOption.current
			}, { notMerge: true });
			const initialDataZoom = chart.getOption().dataZoom;
			host.dataset.zoomModel = String(initialDataZoom?.length ?? 0);
			if (axisDragRef.current && !initialDataZoom?.length) {
				if (chart.getOption().grid?.length) chart.setOption({ dataZoom: [{
					type: "inside",
					xAxisIndex: [0],
					zoomOnMouseWheel: false,
					moveOnMouseMove: false
				}] });
			}
			appliedOptionRef.current = latestOption.current;
			setReady(true);
			const groupAtCreate = syncGroupRef.current;
			if (groupAtCreate && bus.hasRange(groupAtCreate)) applyRangeRef.current(normalizeRange(bus.getRange(groupAtCreate)));
			const labelLayer = document.createElement("div");
			labelLayer.className = "luc-chart-axis-labels";
			labelLayer.setAttribute("aria-hidden", "true");
			host.appendChild(labelLayer);
			const yLabels = /* @__PURE__ */ new Map();
			const boundsNow = () => {
				const bounds = host.getBoundingClientRect();
				return {
					bounds,
					size: {
						width: bounds.width || sizeRef.current.width,
						height: bounds.height || sizeRef.current.height
					}
				};
			};
			const gridBands = (size) => {
				const applied = chart.getOption();
				const descriptors = applied.grid?.length ? applied.grid : [];
				const model = chart.getModel?.();
				return descriptors.map((descriptor, gridIndex) => {
					const engineRect = model?.getComponent?.("grid", gridIndex)?.coordinateSystem?.getRect?.();
					return {
						gridIndex,
						rect: engineRect ? {
							left: engineRect.x,
							top: engineRect.y,
							right: engineRect.x + engineRect.width,
							bottom: engineRect.y + engineRect.height
						} : plotRect(descriptor, size)
					};
				});
			};
			const graph = () => {
				const { bounds, size } = boundsNow();
				const grids = gridBands(size);
				const yAxes = axesFromOption(latestOption.current, "yAxis");
				return {
					bounds,
					size,
					grids,
					yAxes,
					plates: yAxes.flatMap((axis, axisIndex) => {
						if ((axis.type ?? "value") === "category" || axis.hidden) return [];
						return [{
							axisIndex,
							gridIndex: axis.gridIndex ?? 0,
							side: axis.position === "left" ? "left" : "right"
						}];
					})
				};
			};
			const targetAt = (x, y) => {
				const state = graph();
				return axisDragRef.current ? axisTargetAt({
					x,
					y
				}, state.grids, state.size, state.plates) : null;
			};
			const gridForPoint = (grids, x, y) => grids.find(({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) ?? null;
			const isChartControlAt = (x, y) => {
				try {
					let target = (chart.getZr().handler?.findHover?.(x, y))?.target;
					while (target) {
						const mainType = target.__ecComponentInfo?.mainType;
						if (mainType === "toolbox" || mainType === "legend" || mainType === "dataZoom" || mainType === "brush") return true;
						target = target.parent;
					}
				} catch {}
				return false;
			};
			const setInteractionState = (state) => {
				if (state) host.dataset.crosshairState = state;
				else host.removeAttribute("data-crosshair-state");
			};
			const hideYLabels = () => {
				for (const label of yLabels.values()) label.hidden = true;
				for (const key of Object.keys(host.dataset)) if (key.startsWith("crosshairY")) delete host.dataset[key];
				delete host.dataset.crosshairX;
			};
			const crosshairDrawn = () => latestOption.current.tooltip?.axisPointer?.type !== "none";
			const updateCrosshairLabels = (x, y, activeGrid) => {
				if (!crosshairDrawn()) return;
				const { yAxes } = graph();
				const rect = activeGrid.rect;
				if (!yAxes.some((axis) => axis.axisPointer?.label?.show === false)) return;
				const seen = /* @__PURE__ */ new Set();
				yAxes.forEach((axis, axisIndex) => {
					if ((axis.gridIndex ?? 0) !== activeGrid.gridIndex) return;
					if (axis.hidden || (axis.type ?? "value") === "category") return;
					const formatter = axis.axisPointer?.label?.show === false ? axis.axisPointer.label.formatter : void 0;
					let value;
					try {
						value = chart.convertFromPixel({
							yAxisIndex: axisIndex,
							gridIndex: activeGrid.gridIndex
						}, y);
					} catch {
						return;
					}
					const text = formatPointerAxisValue({
						...axis,
						axisPointer: { label: { formatter } }
					}, value, activeGrid.gridIndex);
					if (!text) return;
					let label = yLabels.get(axisIndex);
					if (!label) {
						label = document.createElement("div");
						label.className = "luc-chart-axis-label";
						labelLayer.appendChild(label);
						yLabels.set(axisIndex, label);
					}
					const side = axis.position === "left" ? "left" : "right";
					label.dataset.side = side;
					label.textContent = text;
					label.style.top = `${Math.min(Math.max(y, 8), rect.bottom - 4)}px`;
					label.hidden = false;
					host.dataset[`crosshairY${axisIndex}`] = text;
					host.dataset[`crosshairYValue${axisIndex}`] = String(value);
					seen.add(axisIndex);
				});
				for (const [index, label] of yLabels) if (!seen.has(index)) {
					label.hidden = true;
					delete host.dataset[`crosshairY${index}`];
					delete host.dataset[`crosshairYValue${index}`];
				}
				const xAxes = axesFromOption(latestOption.current, "xAxis");
				const xAxisIndex = xAxes.findIndex((axis) => (axis.gridIndex ?? 0) === activeGrid.gridIndex);
				if (xAxisIndex < 0) return;
				try {
					const value = chart.convertFromPixel({
						xAxisIndex,
						gridIndex: activeGrid.gridIndex
					}, x);
					const text = formatPointerAxisValue(xAxes[xAxisIndex], value, activeGrid.gridIndex);
					if (text) host.dataset.crosshairX = text;
				} catch {}
			};
			const valueRangeNow = (axisIndex, rect) => {
				try {
					const top = chart.convertFromPixel({ yAxisIndex: axisIndex }, rect.top);
					const bottom = chart.convertFromPixel({ yAxisIndex: axisIndex }, rect.bottom);
					if (Number.isFinite(top) && Number.isFinite(bottom) && top !== bottom) return {
						min: Math.min(top, bottom),
						max: Math.max(top, bottom)
					};
				} catch {}
				return null;
			};
			const reportLocalY = () => {
				axesFromOption(latestOption.current, "yAxis").forEach((_axis, axisIndex) => {
					const range = localYRangeRef.current[axisIndex];
					host.dataset[`yRange${axisIndex}`] = range ? `${range.min.toPrecision(12)},${range.max.toPrecision(12)}` : "auto";
				});
			};
			const applyLocalY = (axisIndex, range) => {
				if (range) localYRangeRef.current[axisIndex] = range;
				else delete localYRangeRef.current[axisIndex];
				const baseAxes = axesFromOption(latestOption.current, "yAxis");
				try {
					chart.setOption({ yAxis: baseAxes.map((axis, index) => {
						if (index !== axisIndex) return {};
						if (range) return {
							min: range.min,
							max: range.max
						};
						return {
							min: axis.min,
							max: axis.max,
							scale: axis.scale
						};
					}) });
				} catch {}
				reportLocalY();
			};
			reportLocalY();
			let axisGesture = null;
			const zoomWindow = () => {
				const zoom = chart.getOption().dataZoom?.[0] ?? {};
				return {
					start: typeof zoom.start === "number" ? zoom.start : 0,
					end: typeof zoom.end === "number" ? zoom.end : 100
				};
			};
			const loadedExtent = () => {
				const x = xValuesRef.current;
				if (!x || x.length < 2) return null;
				const lo = x[0];
				const hi = x[x.length - 1];
				return hi > lo ? {
					lo,
					hi
				} : null;
			};
			const stateForTarget = (target, dragging) => target.kind === "time" ? dragging ? "axis-x-drag" : "axis-x" : dragging ? "axis-y-drag" : "axis-y";
			const onPointerDown = (event) => {
				if (!axisDragRef.current || event.button !== 0 || event.pointerType === "touch") return;
				const { bounds } = boundsNow();
				const x = event.clientX - bounds.left;
				const y = event.clientY - bounds.top;
				if (isChartControlAt(x, y)) return;
				const target = targetAt(x, y);
				if (!target) return;
				const grid = graph().grids.find((entry) => entry.gridIndex === target.gridIndex);
				if (!grid) return;
				const rect = grid.rect;
				if (target.kind === "time") {
					const window = zoomWindow();
					const { anchor } = windowFractions(window, x, {
						from: rect.left,
						to: rect.right
					});
					axisGesture = {
						target,
						startX: event.clientX,
						startY: event.clientY,
						rect,
						pointerId: event.pointerId,
						window,
						anchor
					};
				} else {
					const range = valueRangeNow(target.axisIndex, rect);
					if (!range) return;
					const axis = axesFromOption(latestOption.current, "yAxis")[target.axisIndex];
					let anchorValue = range.min;
					try {
						anchorValue = chart.convertFromPixel({
							yAxisIndex: target.axisIndex,
							gridIndex: target.gridIndex
						}, y);
					} catch {}
					axisGesture = {
						target,
						startX: event.clientX,
						startY: event.clientY,
						rect,
						pointerId: event.pointerId,
						range,
						anchorValue,
						scaleMode: axis?.type === "log" || axis?.scaleMode === "log" ? "log" : "linear"
					};
				}
				setInteractionState(stateForTarget(target, true));
				host.dataset.axis = target.kind;
				host.dataset.axisIndex = String(target.axisIndex);
				hideYLabels();
				event.preventDefault();
				host.setPointerCapture?.(event.pointerId);
			};
			const onPointerMove = (event) => {
				const { bounds } = boundsNow();
				const x = event.clientX - bounds.left;
				const y = event.clientY - bounds.top;
				if (axisGesture) {
					event.preventDefault();
					setInteractionState(stateForTarget(axisGesture.target, true));
					if (axisGesture.target.kind === "time" && axisGesture.window) {
						const next = scaleWindow(axisGesture.window, axisGesture.anchor ?? 50, event.clientX - axisGesture.startX, axisGesture.rect.right - axisGesture.rect.left);
						try {
							chart.dispatchAction({
								type: "dataZoom",
								start: next.start,
								end: next.end
							});
							reportVisibleSpan();
						} catch {}
					} else if (axisGesture.target.kind === "value" && axisGesture.range) applyLocalY(axisGesture.target.axisIndex, scaleValueRange(axisGesture.range, axisGesture.anchorValue ?? 0, event.clientY - axisGesture.startY, axisGesture.rect.bottom - axisGesture.rect.top, { scaleMode: axisGesture.scaleMode }));
					return;
				}
				if (event.pointerType === "touch") {
					setInteractionState(null);
					return;
				}
				if (isChartControlAt(x, y)) {
					setInteractionState(null);
					host.dataset.axis = "none";
					hideYLabels();
					return;
				}
				const target = targetAt(x, y);
				if (target) {
					setInteractionState(stateForTarget(target, false));
					host.dataset.axis = target.kind;
					host.dataset.axisIndex = String(target.axisIndex);
					hideYLabels();
					return;
				}
				host.dataset.axis = "none";
				const state = graph();
				const grid = gridForPoint(state.grids, x, y);
				if (!grid) {
					setInteractionState(null);
					hideYLabels();
					return;
				}
				if (!crosshairDrawn()) {
					setInteractionState(null);
					hideYLabels();
					return;
				}
				const pointerPolicy = latestOption.current.tooltip?.axisPointer;
				host.dataset.crosshairSnap = String(pointerPolicy?.snap ?? true);
				host.dataset.plotRect = `${grid.rect.left},${grid.rect.top},${grid.rect.right},${grid.rect.bottom}`;
				setInteractionState(event.buttons > 0 ? null : "plot");
				updateCrosshairLabels(x, y, grid);
			};
			const finishAxisGesture = (event) => {
				if (!axisGesture) return;
				const pointerId = axisGesture.pointerId;
				axisGesture = null;
				if (host.hasPointerCapture?.(pointerId)) host.releasePointerCapture(pointerId);
				if (event?.pointerType === "touch") {
					setInteractionState(null);
					hideYLabels();
				} else if (event) onPointerMove(event);
				else {
					setInteractionState(null);
					hideYLabels();
				}
			};
			const onPointerUp = (event) => {
				const wasAxisGesture = Boolean(axisGesture);
				finishAxisGesture(event);
				if (event.pointerType === "touch") {
					setInteractionState(null);
					hideYLabels();
				} else if (!wasAxisGesture) onPointerMove(event);
			};
			const onPointerCancel = (event) => {
				finishAxisGesture(event);
				setInteractionState(null);
				hideYLabels();
			};
			const onLostPointerCapture = () => finishAxisGesture();
			const onPointerLeave = () => {
				if (axisGesture) return;
				setInteractionState(null);
				host.dataset.axis = "none";
				hideYLabels();
			};
			const onPlotPointerDown = (event) => {
				if (!axisDragRef.current || event.button !== 0 || event.pointerType === "touch") return;
				const { bounds } = boundsNow();
				const x = event.clientX - bounds.left;
				const y = event.clientY - bounds.top;
				if (targetAt(x, y) || isChartControlAt(x, y)) return;
				if (crosshairDrawn() && gridForPoint(graph().grids, x, y)) setInteractionState(null);
			};
			const onDoubleClick = (event) => {
				const { bounds } = boundsNow();
				const x = event.clientX - bounds.left;
				const y = event.clientY - bounds.top;
				if (isChartControlAt(x, y)) return;
				const target = targetAt(x, y);
				if (!target) return;
				event.preventDefault();
				if (target.kind === "value") {
					applyLocalY(target.axisIndex, null);
					return;
				}
				const extent = loadedExtent();
				try {
					chart.dispatchAction({
						type: "dataZoom",
						start: 0,
						end: 100
					});
				} catch {}
				const group = syncGroupRef.current;
				if (extent && group) bus.publishRange(group, {
					from: extent.lo,
					to: extent.hi
				}, id, { intent: "gesture" });
				reportVisibleSpan();
			};
			host.addEventListener("pointerdown", onPlotPointerDown);
			host.addEventListener("pointerdown", onPointerDown);
			host.addEventListener("pointermove", onPointerMove);
			host.addEventListener("pointerup", onPointerUp);
			host.addEventListener("pointercancel", onPointerCancel);
			host.addEventListener("lostpointercapture", onLostPointerCapture);
			host.addEventListener("pointerleave", onPointerLeave);
			host.addEventListener("dblclick", onDoubleClick);
			axisCleanupRef.current = () => {
				host.removeEventListener("pointerdown", onPlotPointerDown);
				host.removeEventListener("pointerdown", onPointerDown);
				host.removeEventListener("pointermove", onPointerMove);
				host.removeEventListener("pointerup", onPointerUp);
				host.removeEventListener("pointercancel", onPointerCancel);
				host.removeEventListener("lostpointercapture", onLostPointerCapture);
				host.removeEventListener("pointerleave", onPointerLeave);
				host.removeEventListener("dblclick", onDoubleClick);
				labelLayer.remove();
				host.removeAttribute("data-crosshair-state");
				host.removeAttribute("data-axis");
			};
			const measure = () => {
				const rect = hostRef.current?.getBoundingClientRect();
				if (rect) sizeRef.current = {
					width: rect.width,
					height: rect.height
				};
			};
			measure();
			if (typeof ResizeObserver !== "undefined") {
				observer = new ResizeObserver(() => {
					measure();
					chart.resize();
					publishDiagnostics();
				});
				observer.observe(hostRef.current);
			}
			chart.on("updateAxisPointer", (params) => {
				const info = params.axesInfo?.[0];
				if (applyingRef.current || !syncGroupRef.current) return;
				const group = syncGroupRef.current;
				const pinned = bus.getPinned(group);
				if (pinned != null) {
					applyCursorRef.current(pinned);
					return;
				}
				bus.publishCursor(group, normalizeCursorX(info?.value), id);
				onEventRef.current?.({
					type: "cursor",
					value: info?.value,
					raw: params
				});
			});
			chart.on("showTip", (params) => {
				const payload = params;
				onEventRef.current?.({
					type: "tip",
					dataIndex: payload.dataIndex,
					value: payload.value,
					raw: params
				});
			});
			chart.on("hideTip", () => {
				if (applyingRef.current || !syncGroupRef.current) return;
				if (bus.getPinned(syncGroupRef.current) != null) return;
				bus.publishCursor(syncGroupRef.current, null, id);
			});
			chart.getZr().on("globalout", () => {
				if (!axisGesture) {
					setInteractionState(null);
					hideYLabels();
				}
				if (applyingRef.current || !syncGroupRef.current) return;
				if (bus.getPinned(syncGroupRef.current) != null) return;
				bus.publishCursor(syncGroupRef.current, null, id);
			});
			chart.on("dataZoom", (params) => {
				const group = syncGroupRef.current;
				reportVisibleSpan();
				if (!group) return;
				if (!gestureRef.current?.active()) return;
				const first = params.batch?.[0] ?? params;
				const x = xValuesRef.current;
				if (!first || !x || x.length < 2) return;
				const lo = x[0];
				const span = x[x.length - 1] - lo;
				bus.publishRange(group, {
					from: lo + span * (first.start ?? 0) / 100,
					to: lo + span * (first.end ?? 100) / 100
				}, id, { intent: "gesture" });
			});
			onReadyRef.current?.(chart);
		}).catch((error) => {
			console.error("[luc-ui] ECharts failed to load", error);
		});
		return () => {
			disposed = true;
			observer?.disconnect();
			axisCleanupRef.current?.();
			axisCleanupRef.current = null;
			gestureRef.current?.dispose();
			gestureRef.current = null;
			const chart = chartRef.current;
			chartRef.current = null;
			if (chart) try {
				chart.dispose();
			} catch {}
		};
	}, [armed, renderer]);
	useEffect(() => {
		const chart = chartRef.current;
		if (!chart || !ready) return;
		if (appliedOptionRef.current === option) return;
		appliedOptionRef.current = option;
		chart.setOption({
			...ECHARTS_GLOBAL_OPTION,
			...option
		}, {
			notMerge: false,
			replaceMerge: ["series"]
		});
		if (Object.entries(localYRangeRef.current).length > 0) try {
			const axisCount = axesFromOption(option, "yAxis").length;
			chart.setOption({ yAxis: Array.from({ length: axisCount }, (_, index) => {
				const range = localYRangeRef.current[index];
				return range ? {
					min: range.min,
					max: range.max
				} : {};
			}) });
		} catch {}
		publishDiagnostics();
	}, [
		option,
		ready,
		publishDiagnostics
	]);
	useEffect(() => {
		if (!syncGroup) return;
		const applyCursor = (value) => {
			const chart = chartRef.current;
			if (!chart) return;
			applyingRef.current = true;
			try {
				if (value === null) chart.dispatchAction({ type: "hideTip" });
				else {
					const x = xValuesRef.current;
					const index = x && x.length > 0 ? nearestIndex(x, value) : -1;
					if (index >= 0 && x) {
						const pixel = chart.convertToPixel({ xAxisIndex: 0 }, x[index]);
						if (typeof pixel === "number") chart.dispatchAction({
							type: "showTip",
							x: pixel,
							y: Math.max(8, sizeRef.current.height / 2)
						});
					}
				}
			} catch {}
			requestAnimationFrame(() => {
				applyingRef.current = false;
			});
		};
		/**
		* Apply the group's window as a `dataZoom` over this member's own extent.
		*
		* `null` is the `max` state — this member shows its whole loaded domain —
		* so it is a real instruction (zoom 0-100), not a no-op.
		*
		* The window is clamped into the history this member holds. A window that
		* misses this member's history entirely falls back to its whole extent: a
		* blank plate reads as a broken chart, while "this series has nothing in
		* that window" is a fact the member can show honestly. Either way the clamp
		* is local — it is never published, so the group's intent is untouched.
		*/
		const applyRange = (range) => {
			const chart = chartRef.current;
			if (!chart) return;
			const zoom = (start, end) => {
				try {
					chart.dispatchAction({
						type: "dataZoom",
						start,
						end
					});
				} catch {}
				reportVisibleSpan();
			};
			if (!range) {
				zoom(0, 100);
				return;
			}
			const x = xValuesRef.current;
			if (!x || x.length < 2) return;
			const lo = x[0];
			const span = x[x.length - 1] - lo;
			if (span <= 0) return;
			const rawStart = (range.from - lo) / span * 100;
			const rawEnd = (range.to - lo) / span * 100;
			const start = Math.min(100, Math.max(0, rawStart));
			const end = Math.min(100, Math.max(0, rawEnd));
			if (rawEnd < 0 || rawStart > 100 || !Number.isFinite(start) || !Number.isFinite(end) || end - start < .5) {
				zoom(0, 100);
				return;
			}
			zoom(start, end);
		};
		applyCursorRef.current = applyCursor;
		applyRangeRef.current = applyRange;
		return bus.subscribe(syncGroup, {
			id,
			onCursor: (value) => applyCursor(normalizeCursorX(value)),
			onRange: (range) => applyRange(normalizeRange(range))
		});
	}, [
		bus,
		id,
		reportVisibleSpan,
		syncGroup,
		xValuesRef
	]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
		ref: hostRef,
		"data-slot": "echart-surface",
		className: className ? `luc-chart-surface ${className}` : "luc-chart-surface",
		role: ariaLabel ? "img" : void 0,
		"aria-label": ariaLabel,
		"aria-describedby": ariaDescription ? descriptionId : void 0
	}), ariaDescription ? /* @__PURE__ */ jsx("span", {
		id: descriptionId,
		className: "sr-only",
		children: ariaDescription
	}) : null] });
}
//#endregion
export { EChartSurface };

//# sourceMappingURL=echart-surface.js.map