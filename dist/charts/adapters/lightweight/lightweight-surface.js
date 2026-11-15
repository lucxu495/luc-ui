"use client";
import { CHART_PLOT_LAYOUT } from "../../core/axis.js";
import { normalizeCursorX, normalizeRange } from "../../core/sync.js";
import { useChartSyncBus } from "../../core/sync-context.js";
import { watchPlateGesture } from "../../core/gesture.js";
import { useChartId, useChartTheme, useLatest } from "../../core/use-chart-theme.js";
import { fromChartTime, loadLightweightCharts, toChartTime } from "./runtime.js";
import { useChartArm } from "../../core/use-chart-arm.js";
import { createLightweightController } from "./chart-controller.js";
import { resolveVisibleRangeAction, visibleRangeKey } from "./range-application.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
//#region src/charts/adapters/lightweight/lightweight-surface.tsx
/**
* How tall the time-axis band is, in CSS pixels.
*
* Lightweight Charts draws the time axis as the bottom strip of the plate
* (about 26px at its default font size). A double-click anywhere in it means
* "reset the time scale", which is the interaction the reader asked for; the
* band is generous because the alternative — a 4px invisible strip — is what
* makes an axis feel dead.
*/
const TIME_AXIS_BAND_PX = 34;
const INTERACTION_DESCRIPTION = "Interactive financial chart. Use the arrow keys to pan, plus and minus to zoom, Home to reset the viewport, and Escape to clear the crosshair.";
function buildLightweightChartOptions(theme, priceScale, formatters) {
	const side = priceScale?.side ?? "right";
	const mode = priceScale?.mode === "log" ? 1 : 0;
	const plate = {
		borderColor: theme.borderSubtle,
		textColor: theme.axisLabel,
		mode,
		minimumWidth: CHART_PLOT_LAYOUT.axisGutter
	};
	return {
		autoSize: true,
		layout: {
			background: {
				type: "solid",
				color: "transparent"
			},
			textColor: theme.axisLabel,
			fontFamily: theme.fontFamily,
			fontSize: theme.fontMicro,
			attributionLogo: true,
			panes: {
				separatorColor: theme.borderSubtle,
				separatorHoverColor: theme.border,
				enableResize: false
			}
		},
		grid: {
			vertLines: { color: theme.grid },
			horzLines: { color: theme.grid }
		},
		crosshair: {
			mode: 0,
			vertLine: {
				color: theme.crosshair,
				width: 1,
				style: 0,
				labelBackgroundColor: theme.crosshairLabelBg
			},
			horzLine: {
				color: theme.crosshair,
				width: 1,
				style: 0,
				labelBackgroundColor: theme.crosshairLabelBg
			}
		},
		rightPriceScale: {
			...plate,
			visible: side === "right",
			scaleMargins: {
				top: .12,
				bottom: .12
			}
		},
		leftPriceScale: {
			...plate,
			visible: side === "left"
		},
		timeScale: {
			borderColor: theme.borderSubtle,
			timeVisible: true,
			secondsVisible: false,
			rightOffset: 3,
			barSpacing: 7,
			minBarSpacing: 1.5,
			fixLeftEdge: true,
			fixRightEdge: true
		},
		handleScroll: {
			mouseWheel: true,
			pressedMouseMove: true,
			horzTouchDrag: true,
			vertTouchDrag: false
		},
		handleScale: {
			axisPressedMouseMove: {
				time: true,
				price: true
			},
			mouseWheel: true,
			pinch: true,
			axisDoubleClickReset: {
				price: true,
				time: false
			}
		},
		localization: {
			locale: "en-US",
			...formatters?.priceFormatter ? { priceFormatter: formatters.priceFormatter } : {},
			...formatters?.tickFormatter ? { tickmarksPriceFormatter: formatters.tickFormatter } : {}
		}
	};
}
function applyVisibleRange(chart, action) {
	if (action.kind === "preserve") return;
	try {
		if (action.kind === "fit") chart.timeScale().fitContent();
		else chart.timeScale().setVisibleRange({
			from: toChartTime(action.fromMs),
			to: toChartTime(action.toMs)
		});
	} catch {}
}
/**
* The one place Lightweight Charts is created, synchronised and disposed.
*
* `build` runs on mount and again whenever the consumer's data or theme
* changes. It updates series in place, so a theme flip keeps the user's zoom
* and never flashes. Pointer handling stays inside the engine and reaches the
* sync bus as a normalised cursor — a mousemove never triggers a React render.
*/
function LightweightSurface({ build, syncGroup, resolvePrice, className, ariaLabel, ariaDescription, priceScale, priceFormatter, tickFormatter, onCrosshair, onReady, themeOverride, visibleRange, eager = false }) {
	const hostRef = useRef(null);
	const chartRef = useRef(null);
	const controllerRef = useRef(null);
	const bindingsRef = useRef(/* @__PURE__ */ new Map());
	const unsubscribeRef = useRef(null);
	const applyingRef = useRef(false);
	const lastRangeKeyRef = useRef(null);
	const skipNextBuildEffectRef = useRef(false);
	/**
	* The reader's own input on this plate.
	*
	* `LightweightSurface` publishes a visible range **only** while this is
	* active (see `core/gesture.ts`): an engine that fits itself on mount, is
	* clamped to shorter history, is resized, has a series replaced or rebuilds
	* after new data is not a reader choosing a window, and a group must not
	* follow it. This is also why the range path needs no `applying` guard: a
	* remote window applied by this surface is never published, because no
	* gesture is in flight.
	*/
	const gestureRef = useRef(null);
	/** Re-applies a cursor from the engine's own crosshair subscription. */
	const applyCursorRef = useRef(() => {});
	const [ready, setReady] = useState(false);
	const systemTheme = useChartTheme();
	const theme = themeOverride ?? systemTheme;
	const bus = useChartSyncBus();
	const id = useChartId("lw-chart");
	const descriptionId = `${id}-description`;
	const interactionDescriptionId = `${id}-interaction-description`;
	const priceScaleSide = priceScale?.side ?? "right";
	const priceScaleMode = priceScale?.mode ?? "linear";
	const plateRef = useLatest({
		side: priceScaleSide,
		mode: priceScaleMode
	});
	const formatterRef = useLatest({
		priceFormatter,
		tickFormatter
	});
	const visibleRangeRef = useLatest(visibleRange);
	const buildRef = useLatest(build);
	const resolvePriceRef = useLatest(resolvePrice);
	const syncGroupRef = useLatest(syncGroup);
	const themeRef = useLatest(theme);
	const onReadyRef = useLatest(onReady);
	const onCrosshairRef = useLatest(onCrosshair);
	const armed = useChartArm(hostRef, !eager);
	useEffect(() => {
		if (!armed) return;
		let disposed = false;
		const host = hostRef.current;
		if (!host) return;
		gestureRef.current?.dispose();
		gestureRef.current = watchPlateGesture(host);
		loadLightweightCharts().then((module) => {
			if (disposed || !hostRef.current) return;
			const chart = module.createChart(hostRef.current, buildLightweightChartOptions(themeRef.current, {
				side: plateRef.current.side,
				mode: plateRef.current.mode
			}, formatterRef.current));
			chartRef.current = chart;
			const { controller, bindings: controllerBindings } = createLightweightController(chart, module, themeRef.current);
			bindingsRef.current = controllerBindings;
			controllerRef.current = controller;
			buildRef.current(controller);
			lastRangeKeyRef.current = visibleRangeKey(visibleRangeRef.current);
			applyVisibleRange(chart, resolveVisibleRangeAction(visibleRangeRef.current, null, false));
			const groupAtCreate = syncGroupRef.current;
			if (groupAtCreate && bus.hasRange(groupAtCreate)) try {
				const stored = normalizeRange(bus.getRange(groupAtCreate));
				if (!stored) chart.timeScale().fitContent();
				else chart.timeScale().setVisibleRange({
					from: toChartTime(stored.from),
					to: toChartTime(stored.to)
				});
			} catch {}
			skipNextBuildEffectRef.current = true;
			setReady(true);
			onReadyRef.current?.(chart);
			const onCrosshairMove = (param) => {
				onCrosshairRef.current?.({
					timeMs: param.time === void 0 ? null : normalizeCursorX(fromChartTime(param.time)),
					x: param.point?.x ?? null,
					y: param.point?.y ?? null
				});
				const group = syncGroupRef.current;
				if (applyingRef.current || !group) return;
				const pinned = bus.getPinned(group);
				if (pinned != null) {
					applyCursorRef.current(pinned);
					return;
				}
				if (param.time === void 0) {
					bus.publishCursor(group, null, id);
					return;
				}
				bus.publishCursor(group, normalizeCursorX(fromChartTime(param.time)), id);
			};
			chart.subscribeCrosshairMove(onCrosshairMove);
			const scale = chart.timeScale();
			const onLogicalRange = () => {
				const group = syncGroupRef.current;
				if (!group) return;
				if (!gestureRef.current?.active()) return;
				const range = scale.getVisibleRange();
				if (!range) return;
				const from = fromChartTime(range.from);
				const to = fromChartTime(range.to);
				if (from === null || to === null || to <= from) return;
				bus.publishRange(group, {
					from,
					to
				}, id, { intent: "gesture" });
			};
			scale.subscribeVisibleLogicalRangeChange(onLogicalRange);
			const onAxisDoubleClick = (event) => {
				const host = hostRef.current;
				if (!host) return;
				const bounds = host.getBoundingClientRect();
				if (!(event.clientY - bounds.top >= bounds.height - TIME_AXIS_BAND_PX)) return;
				const priceSide = plateRef.current.side;
				let priceGutter = 0;
				try {
					priceGutter = chart.priceScale(priceSide).width();
				} catch {
					priceGutter = 0;
				}
				if (priceSide === "left" ? event.clientX < bounds.left + priceGutter : event.clientX > bounds.right - priceGutter) return;
				event.preventDefault();
				try {
					scale.fitContent();
					const range = scale.getVisibleRange();
					const group = syncGroupRef.current;
					if (!range || !group) return;
					const from = fromChartTime(range.from);
					const to = fromChartTime(range.to);
					if (from === null || to === null || to <= from) return;
					bus.publishRange(group, {
						from,
						to
					}, id, { intent: "gesture" });
				} catch {}
			};
			host.addEventListener("dblclick", onAxisDoubleClick);
			const publishCurrentRange = () => {
				const group = syncGroupRef.current;
				if (!group) return;
				const range = scale.getVisibleRange();
				if (!range) return;
				const from = fromChartTime(range.from);
				const to = fromChartTime(range.to);
				if (from === null || to === null || to <= from) return;
				bus.publishRange(group, {
					from,
					to
				}, id, { intent: "gesture" });
			};
			const onKeyDown = (event) => {
				if (event.target !== host || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
				const logical = scale.getVisibleLogicalRange();
				if (!logical) return;
				const span = logical.to - logical.from;
				const middle = logical.from + span / 2;
				if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
					const move = span * (event.shiftKey ? .25 : .1);
					const delta = event.key === "ArrowLeft" ? -move : move;
					scale.setVisibleLogicalRange({
						from: logical.from + delta,
						to: logical.to + delta
					});
				} else if (event.key === "+" || event.key === "=") {
					const next = span * .8;
					scale.setVisibleLogicalRange({
						from: middle - next / 2,
						to: middle + next / 2
					});
				} else if (event.key === "-" || event.key === "_") {
					const next = span * 1.25;
					scale.setVisibleLogicalRange({
						from: middle - next / 2,
						to: middle + next / 2
					});
				} else if (event.key === "Home" || event.key === "0") scale.fitContent();
				else if (event.key === "Escape") {
					event.preventDefault();
					chart.clearCrosshairPosition();
					return;
				} else return;
				event.preventDefault();
				publishCurrentRange();
			};
			host.addEventListener("keydown", onKeyDown);
			unsubscribeRef.current = () => {
				scale.unsubscribeVisibleLogicalRangeChange(onLogicalRange);
				chart.unsubscribeCrosshairMove(onCrosshairMove);
				host.removeEventListener("dblclick", onAxisDoubleClick);
				host.removeEventListener("keydown", onKeyDown);
			};
		}).catch((error) => {
			console.error("[luc-ui] Lightweight Charts failed to load", error);
		});
		return () => {
			disposed = true;
			unsubscribeRef.current?.();
			unsubscribeRef.current = null;
			gestureRef.current?.dispose();
			gestureRef.current = null;
			const chart = chartRef.current;
			chartRef.current = null;
			controllerRef.current = null;
			bindingsRef.current.clear();
			if (chart) try {
				chart.remove();
			} catch {}
		};
	}, [armed]);
	useEffect(() => {
		const controller = controllerRef.current;
		if (!controller || !ready) return;
		if (skipNextBuildEffectRef.current) {
			skipNextBuildEffectRef.current = false;
			return;
		}
		controller.theme = theme;
		controller.chart.applyOptions(buildLightweightChartOptions(theme, {
			side: priceScaleSide,
			mode: priceScaleMode
		}, {
			priceFormatter,
			tickFormatter
		}));
		build(controller);
	}, [
		build,
		ready,
		theme,
		priceScaleSide,
		priceScaleMode,
		priceFormatter,
		tickFormatter
	]);
	const currentRangeKey = visibleRangeKey(visibleRange);
	useEffect(() => {
		const chart = chartRef.current;
		if (!chart || !ready) return;
		const action = resolveVisibleRangeAction(visibleRangeRef.current, lastRangeKeyRef.current, true);
		lastRangeKeyRef.current = currentRangeKey;
		applyVisibleRange(chart, action);
	}, [
		currentRangeKey,
		ready,
		visibleRangeRef
	]);
	useEffect(() => {
		if (!syncGroup) return;
		const applyCursor = (value) => {
			const chart = chartRef.current;
			if (!chart) return;
			applyingRef.current = true;
			try {
				if (value === null) chart.clearCrosshairPosition();
				else {
					const prime = bindingsRef.current.get("price") ?? [...bindingsRef.current.values()][0];
					const price = resolvePriceRef.current?.(value) ?? null;
					if (prime && price !== null) chart.setCrosshairPosition(price, toChartTime(value), prime.series);
				}
			} catch {}
			requestAnimationFrame(() => {
				applyingRef.current = false;
			});
		};
		/**
		* Apply the group's window.
		*
		* `null` is not "nothing to do": it is the `max` state, and it means this
		* member shows its whole loaded domain. Treating it as a no-op is what made
		* a `max` click leave the previous window on screen.
		*
		* The engine clamps a window that reaches past the history this member
		* holds (its own `fixLeftEdge`/`fixRightEdge`): the clamp is local and is
		* never published, so the group's intent survives a chart with a shorter
		* series.
		*/
		const applyRange = (range) => {
			const chart = chartRef.current;
			if (!chart) return;
			try {
				if (!range) chart.timeScale().fitContent();
				else chart.timeScale().setVisibleRange({
					from: toChartTime(range.from),
					to: toChartTime(range.to)
				});
			} catch {}
		};
		applyCursorRef.current = applyCursor;
		return bus.subscribe(syncGroup, {
			id,
			onCursor: (value) => applyCursor(normalizeCursorX(value)),
			onRange: (range) => applyRange(normalizeRange(range))
		});
	}, [
		bus,
		id,
		syncGroup,
		resolvePriceRef
	]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("div", {
			ref: hostRef,
			"data-slot": "lightweight-surface",
			className: className ? `luc-chart-surface ${className}` : "luc-chart-surface",
			role: "application",
			"aria-roledescription": "chart",
			tabIndex: 0,
			"aria-label": ariaLabel,
			"aria-keyshortcuts": "ArrowLeft ArrowRight + - Home Escape",
			"aria-describedby": ariaDescription ? `${descriptionId} ${interactionDescriptionId}` : interactionDescriptionId
		}),
		/* @__PURE__ */ jsx("span", {
			id: interactionDescriptionId,
			className: "sr-only",
			children: INTERACTION_DESCRIPTION
		}),
		ariaDescription ? /* @__PURE__ */ jsx("span", {
			id: descriptionId,
			className: "sr-only",
			children: ariaDescription
		}) : null
	] });
}
//#endregion
export { LightweightSurface, buildLightweightChartOptions };

//# sourceMappingURL=lightweight-surface.js.map