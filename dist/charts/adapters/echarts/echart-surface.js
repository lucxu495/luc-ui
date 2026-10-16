"use client";
import { normalizeCursorX, normalizeRange } from "../../core/sync.js";
import { useChartSyncBus } from "../../core/sync-context.js";
import { nearestIndex } from "../../core/data.js";
import { watchPlateGesture } from "../../core/gesture.js";
import { useChartId, useLatest } from "../../core/use-chart-theme.js";
import { ensureSvgRenderer, loadECharts } from "./runtime.js";
import { useChartArm } from "../../core/use-chart-arm.js";
import { axisBandAt, plotRect, scaleValueRange, scaleWindow, windowFractions } from "../../core/axis-drag.js";
import { ECHARTS_GLOBAL_OPTION, ECHARTS_INIT_OPTIONS } from "./echart-init.js";
import { collectChartDiagnostics, serializeDiagnostics } from "../../core/diagnostics.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
//#region src/charts/adapters/echarts/echart-surface.tsx
/**
* The one place ECharts is created, resized, synchronised and disposed.
*
* Chart family components never touch the engine lifecycle: they build an
* option object and hand it here. That keeps cleanup, resize and cross-chart
* synchronisation identical for all ~20 chart types.
*/
function EChartSurface({ option, xValues, syncGroup, className, ariaLabel, ariaDescription, onReady, onEvent, eager = false, onVisibleSpan, renderer = "canvas" }) {
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
	const localYRangeRef = useRef(null);
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
	/**
	* The span the engine currently shows, read back from its own dataZoom model.
	*
	* `dataZoom` state is the engine's truth: a range control, a pan and a pinch
	* all land there, so one reader covers every way the window can change.
	*/
	const reportVisibleSpan = useCallback(() => {
		const chart = chartRef.current;
		const x = xValuesRef.current;
		if (!chart || !x || x.length < 2) return;
		const lo = x[0];
		const full = x[x.length - 1] - lo;
		if (!(full > 0)) return;
		let start = 0;
		let end = 100;
		try {
			const zoom = chart.getOption().dataZoom?.[0];
			if (zoom) {
				start = typeof zoom.start === "number" ? zoom.start : 0;
				end = typeof zoom.end === "number" ? zoom.end : 100;
			}
		} catch {}
		const span = full * (end - start) / 100;
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
			appliedOptionRef.current = latestOption.current;
			setReady(true);
			const groupAtCreate = syncGroupRef.current;
			if (groupAtCreate && bus.hasRange(groupAtCreate)) applyRangeRef.current(normalizeRange(bus.getRange(groupAtCreate)));
			const currentRect = () => {
				const bounds = hostRef.current?.getBoundingClientRect();
				const size = {
					width: bounds?.width ?? sizeRef.current.width,
					height: bounds?.height ?? sizeRef.current.height
				};
				const applied = chart.getOption();
				return {
					rect: plotRect(applied.grid?.[0], size),
					size
				};
			};
			const valueRangeNow = () => {
				const { rect } = currentRect();
				try {
					const top = chart.convertFromPixel({ yAxisIndex: 0 }, rect.top);
					const bottom = chart.convertFromPixel({ yAxisIndex: 0 }, rect.bottom);
					if (Number.isFinite(top) && Number.isFinite(bottom) && top !== bottom) return {
						min: Math.min(top, bottom),
						max: Math.max(top, bottom)
					};
				} catch {}
				return null;
			};
			const applyLocalY = (range) => {
				localYRangeRef.current = range;
				try {
					chart.setOption({ yAxis: range ? {
						min: range.min,
						max: range.max
					} : {
						min: null,
						max: null
					} });
				} catch {}
				hostRef.current?.setAttribute("data-y-range", range ? `${range.min.toFixed(4)},${range.max.toFixed(4)}` : "auto");
			};
			let axisDrag = null;
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
			const onAxisPointerDown = (event) => {
				const host = hostRef.current;
				if (!host || event.button !== 0) return;
				const bounds = host.getBoundingClientRect();
				const { rect, size } = currentRect();
				const band = axisBandAt({
					x: event.clientX - bounds.left,
					y: event.clientY - bounds.top
				}, rect, size);
				if (!band) return;
				if (band === "time") {
					const window = zoomWindow();
					const { anchor } = windowFractions(window, event.clientX - bounds.left, {
						from: rect.left,
						to: rect.right
					});
					axisDrag = {
						kind: "time",
						startX: event.clientX,
						startY: event.clientY,
						window,
						anchor
					};
				} else {
					const range = valueRangeNow();
					if (!range) return;
					let anchorValue = range.min;
					try {
						anchorValue = chart.convertFromPixel({ yAxisIndex: 0 }, event.clientY - bounds.top);
					} catch {}
					axisDrag = {
						kind: "value",
						startX: event.clientX,
						startY: event.clientY,
						range,
						anchorValue
					};
				}
				event.preventDefault();
				host.setPointerCapture?.(event.pointerId);
			};
			const onAxisPointerMove = (event) => {
				const host = hostRef.current;
				if (!host) return;
				const bounds = host.getBoundingClientRect();
				if (!axisDrag) {
					const { rect, size } = currentRect();
					const band = axisBandAt({
						x: event.clientX - bounds.left,
						y: event.clientY - bounds.top
					}, rect, size);
					host.setAttribute("data-axis", band ?? "none");
					host.style.cursor = band === "time" ? "col-resize" : band === "value" ? "row-resize" : "";
					return;
				}
				const { rect } = currentRect();
				if (axisDrag.kind === "time" && axisDrag.window) {
					const next = scaleWindow(axisDrag.window, axisDrag.anchor ?? 50, event.clientX - axisDrag.startX, rect.right - rect.left);
					try {
						chart.dispatchAction({
							type: "dataZoom",
							start: next.start,
							end: next.end
						});
					} catch {}
					return;
				}
				if (axisDrag.kind === "value" && axisDrag.range) applyLocalY(scaleValueRange(axisDrag.range, axisDrag.anchorValue ?? 0, event.clientY - axisDrag.startY, rect.bottom - rect.top));
			};
			const endAxisDrag = () => {
				if (!axisDrag) return;
				axisDrag = null;
			};
			const onAxisDoubleClick = (event) => {
				const host = hostRef.current;
				if (!host) return;
				const bounds = host.getBoundingClientRect();
				const { rect, size } = currentRect();
				const band = axisBandAt({
					x: event.clientX - bounds.left,
					y: event.clientY - bounds.top
				}, rect, size);
				if (band === "value") {
					applyLocalY(null);
					return;
				}
				if (band !== "time") return;
				event.preventDefault();
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
			};
			host.addEventListener("pointerdown", onAxisPointerDown);
			host.addEventListener("pointermove", onAxisPointerMove);
			host.addEventListener("pointerup", endAxisDrag);
			host.addEventListener("pointercancel", endAxisDrag);
			const onAxisPointerLeave = () => {
				host.removeAttribute("data-axis");
				host.style.cursor = "";
			};
			host.addEventListener("pointerleave", onAxisPointerLeave);
			host.addEventListener("dblclick", onAxisDoubleClick);
			axisCleanupRef.current = () => {
				host.removeEventListener("pointerdown", onAxisPointerDown);
				host.removeEventListener("pointermove", onAxisPointerMove);
				host.removeEventListener("pointerup", endAxisDrag);
				host.removeEventListener("pointercancel", endAxisDrag);
				host.removeEventListener("pointerleave", onAxisPointerLeave);
				host.removeEventListener("dblclick", onAxisDoubleClick);
				host.style.cursor = "";
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
		const localY = localYRangeRef.current;
		if (localY) try {
			chart.setOption({ yAxis: {
				min: localY.min,
				max: localY.max
			} });
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