"use client";
import { cn } from "./utils/cn.js";
import "./charts/core/axis.js";
import { ChartEmptyState, ChartErrorState, ChartSkeleton } from "./charts/chart-card.js";
import { toneColor } from "./charts/core/theme.js";
import { formatChartValue, numericAxisFormatter } from "./charts/core/formatters.js";
import { useChartTheme, useLatest } from "./charts/core/use-chart-theme.js";
import { fromChartTime } from "./charts/adapters/lightweight/runtime.js";
import { LightweightSurface } from "./charts/adapters/lightweight/lightweight-surface.js";
import { safeCssColor, tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "./charts/core/tooltip-html.js";
import { resolveFinancialPaneLayout } from "./charts/adapters/lightweight/pane-layout.js";
import { FinancialDataError, prepareCandles, prepareIndicatorSeries, prepareOverlay, preparePriceSeries, prepareVolume, validateFinancialRange } from "./charts/financial/financial-data.js";
import { IndicatorReferenceLines } from "./charts/financial/reference-lines.js";
import { financialTooltipPosition } from "./charts/financial/tooltip-position.js";
import { createLatestFrameBatch, isLocalPointerEvent, subscribeLatestCrosshair } from "./charts/financial/crosshair-subscription.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef } from "react";
//#region src/charts/financial/financial-chart.tsx
const LINE_STYLE = {
	solid: 0,
	dashed: 2,
	dotted: 1
};
function autoPrecision(values) {
	const finite = values.filter((value) => Number.isFinite(value) && value !== 0);
	const reference = finite.length ? Math.abs(finite[finite.length - 1]) : 1;
	if (reference >= 1e3) return {
		precision: 2,
		minMove: .01
	};
	if (reference >= 10) return {
		precision: 3,
		minMove: .001
	};
	if (reference >= 1) return {
		precision: 4,
		minMove: 1e-4
	};
	return {
		precision: 6,
		minMove: 1e-6
	};
}
function seriesLineWidth(value, fallback = 2) {
	return Math.min(4, Math.max(1, Math.round(value ?? fallback)));
}
function indicatorPriceFormat(format) {
	const resolved = format ?? {
		kind: "number",
		decimals: 3
	};
	const decimals = resolved.decimals ?? 3;
	return {
		type: "custom",
		formatter: (value) => formatChartValue(value, resolved),
		tickmarksFormatter: (values) => values.map((value) => formatChartValue(value, resolved)),
		minMove: Number(`1e-${decimals}`)
	};
}
function uniqueId(id, seen, context) {
	if (!id.trim()) throw new FinancialDataError("identity", `${context}: id must not be empty`);
	if (seen.has(id)) throw new FinancialDataError("identity", `${context}: duplicate id "${id}"`);
	seen.add(id);
}
function prepareChartData(input) {
	try {
		if (input.candles && input.series) throw new FinancialDataError("identity", "FinancialChart accepts either candles or series, not both");
		if (!input.candles && !input.series) throw new FinancialDataError("identity", "FinancialChart requires candles or series");
		const preparedCandles = prepareCandles(input.candles ?? []);
		const priceSeries = (input.series ?? []).map(preparePriceSeries);
		const seenSeries = /* @__PURE__ */ new Set();
		priceSeries.forEach((series, index) => uniqueId(series.id, seenSeries, `series[${index}]`));
		const overlays = input.overlays.map((overlay, index) => {
			uniqueId(overlay.id, seenSeries, `overlays[${index}]`);
			const prepared = prepareOverlay(overlay, index);
			return {
				key: `overlay:${overlay.id}`,
				source: overlay,
				data: prepared.data
			};
		});
		const seenIndicatorPanes = /* @__PURE__ */ new Set();
		const indicators = input.indicators.map((pane, paneIndex) => {
			uniqueId(pane.id, seenIndicatorPanes, `indicators[${paneIndex}]`);
			if (pane.stretch !== void 0 && (!Number.isFinite(pane.stretch) || pane.stretch <= 0)) throw new FinancialDataError("value", `indicators[${paneIndex}].stretch: require a finite number greater than zero`);
			const paneSeriesIds = /* @__PURE__ */ new Set();
			return {
				source: pane,
				series: pane.series.map((indicator, seriesIndex) => {
					uniqueId(indicator.id, paneSeriesIds, `indicators[${paneIndex}].series[${seriesIndex}]`);
					return {
						key: `indicator:${pane.id}:${indicator.id}`,
						source: indicator,
						data: prepareIndicatorSeries(indicator, `indicators[${paneIndex}].series[${seriesIndex}]`).data
					};
				})
			};
		});
		const primarySeriesKey = priceSeries.length > 0 ? `price:${priceSeries[0].id}` : "price";
		const closes = [...preparedCandles.rows.map((candle) => candle.close), ...priceSeries.flatMap((series) => series.data.map((point) => point.value).filter((value) => value !== void 0))];
		return {
			error: null,
			data: {
				candleRows: preparedCandles.rows,
				candleData: preparedCandles.data,
				priceSeries,
				primarySeriesKey,
				closes,
				volume: prepareVolume(input.volume),
				overlays,
				indicators
			}
		};
	} catch (error) {
		return {
			data: null,
			error: error instanceof Error ? error : new Error(String(error))
		};
	}
}
function hideTooltip(element) {
	if (!element) return;
	element.hidden = true;
	element.innerHTML = "";
}
function updateTooltip(event, state, seriesById, host, element, lastHtml, size) {
	if (!host || !element || !isLocalPointerEvent(event) || event.time === void 0 || !event.point) {
		hideTooltip(element);
		return;
	}
	const ms = fromChartTime(event.time);
	if (ms === null) {
		hideTooltip(element);
		return;
	}
	const primarySeries = seriesById.get(state.primarySeriesKey);
	if (!primarySeries) {
		hideTooltip(element);
		return;
	}
	const candle = state.mode === "candlestick" ? event.seriesData.get(primarySeries) : void 0;
	const pricePoint = event.seriesData.get(primarySeries);
	const close = candle?.close ?? pricePoint?.value ?? pricePoint?.close ?? null;
	const change = candle ? candle.close - candle.open : null;
	const changePct = candle && candle.open !== 0 ? (candle.close - candle.open) / candle.open * 100 : null;
	const volumeSeries = state.volumeSeriesKey === null ? void 0 : seriesById.get(state.volumeSeriesKey);
	const volumePoint = volumeSeries ? event.seriesData.get(volumeSeries) : void 0;
	const overlayRows = state.overlays.map((overlay) => {
		const series = seriesById.get(overlay.key);
		if (!series) return null;
		const value = event.seriesData.get(series)?.value;
		return value === void 0 ? null : tooltipRowHtml(overlay.label, state.formatPrice(value), overlay.color);
	}).filter((row) => row !== null);
	const gridRows = candle ? [
		[state.labels.open, state.formatPrice(candle.open)],
		[state.labels.high, state.formatPrice(candle.high)],
		[state.labels.low, state.formatPrice(candle.low)],
		[state.labels.close, state.formatPrice(candle.close)]
	] : [];
	const comparisonRows = candle ? "" : state.priceSeries.map((series) => {
		const target = seriesById.get(series.key);
		const value = target ? event.seriesData.get(target)?.value : void 0;
		return value === void 0 ? null : tooltipRowHtml(series.label, state.formatPrice(value), series.color);
	}).filter((row) => row !== null).join("");
	const changeRow = change !== null && changePct !== null ? `<div class="luc-chart-tooltip__rows">${tooltipRowHtml(state.labels.change, `${state.formatPrice(change)}  (${formatChartValue(changePct, {
		kind: "percent",
		signed: true
	})})`)}</div>` : "";
	const volumeRow = volumePoint?.value === void 0 ? "" : `<div class="luc-chart-tooltip__rows">${tooltipRowHtml(state.labels.volume, state.formatVolume(volumePoint.value))}</div>`;
	const overlayBlock = overlayRows.length > 0 ? `<div class="luc-chart-tooltip__rule"></div><div class="luc-chart-tooltip__rows">${overlayRows.join("")}</div>` : "";
	const indicatorRows = state.indicators.map((indicator) => {
		const series = seriesById.get(indicator.key);
		const value = series ? event.seriesData.get(series)?.value : void 0;
		return value === void 0 ? null : tooltipRowHtml(indicator.label, formatChartValue(value, indicator.format ?? {
			kind: "number",
			decimals: 3
		}), indicator.color);
	}).filter((row) => row !== null);
	const indicatorBlock = indicatorRows.length > 0 ? `<div class="luc-chart-tooltip__rule"></div><div class="luc-chart-tooltip__rows">${indicatorRows.join("")}</div>` : "";
	const priceBlock = gridRows.length > 0 ? tooltipGridHtml(gridRows) : `<div class="luc-chart-tooltip__rows">${comparisonRows || tooltipRowHtml(state.labels.close, state.formatPrice(close))}</div>`;
	const html = tooltipShellHtml(formatChartValue(ms, { kind: "date" }), priceBlock + changeRow + volumeRow + overlayBlock + indicatorBlock);
	if (lastHtml.current !== html) {
		element.innerHTML = html;
		lastHtml.current = html;
		element.hidden = false;
		size.current = {
			width: element.offsetWidth || 216,
			height: element.offsetHeight || 120
		};
	}
	element.hidden = false;
	const position = financialTooltipPosition({
		pointerX: event.point.x,
		pointerY: event.point.y,
		hostWidth: host.clientWidth,
		hostHeight: host.clientHeight,
		tooltipWidth: size.current.width,
		tooltipHeight: size.current.height
	});
	element.style.transform = `translate3d(${position.left}px, ${position.top}px, 0)`;
}
/**
* Financial price chart for OHLC candles or clean close/time series.
*
* The component owns no indicator maths: overlays and pane series are
* prepared by the caller. Data is validated, never repaired by interpolation
* or gap filling. Chart creation, dynamic import, attribution, sync and range
* application live in `LightweightSurface`.
*/
function FinancialChart(props) {
	const { candles, series, volume, overlays, indicators, mode = "candlestick", range, priceFormat, volumeFormat, visibleOverlays, showVolume = true, showPriceLine = true, syncGroup, priceScale, state = "ready", height, className, ariaLabel, ariaDescription, showLegend = true, tooltipLabels, themeOverride, onReady, onControllerReady } = props;
	const systemTheme = useChartTheme();
	const theme = themeOverride ?? systemTheme;
	const hostRef = useRef(null);
	const tooltipRef = useRef(null);
	const lastTooltipHtmlRef = useRef("");
	const tooltipSizeRef = useRef({
		width: 216,
		height: 120
	});
	const unsubscribeCrosshairRef = useRef(null);
	const controllerRef = useRef(null);
	const incrementalRuntimeRef = useRef(null);
	const announcedControllerRef = useRef(null);
	const seriesRef = useRef(/* @__PURE__ */ new Map());
	const referenceLinesRef = useRef(new IndicatorReferenceLines());
	const tooltipBatchRef = useRef(null);
	const onReadyRef = useLatest(onReady);
	const onControllerReadyRef = useLatest(onControllerReady);
	const financialController = useMemo(() => ({
		get chart() {
			return incrementalRuntimeRef.current?.controller.chart ?? null;
		},
		get controller() {
			return incrementalRuntimeRef.current?.controller ?? null;
		},
		updatePrice(point) {
			const runtime = incrementalRuntimeRef.current;
			if (!runtime) throw new Error("[luc-ui] FinancialChart is not ready for incremental updates");
			if ("open" in point) {
				if (runtime.data.candleData.length === 0) throw new FinancialDataError("identity", "updatePrice: this chart has no OHLC price series");
				const data = prepareCandles([point]);
				runtime.controller.updateSeries("price", data.data[0]);
				return;
			}
			const primaryId = runtime.data.priceSeries[0]?.id;
			if (!primaryId) throw new FinancialDataError("identity", "updatePrice: this chart has no close-only price series");
			const prepared = preparePriceSeries({
				id: primaryId,
				data: [point]
			}, 0);
			runtime.controller.updateSeries(`price:${primaryId}`, prepared.data[0]);
		},
		updateVolume(point) {
			const runtime = incrementalRuntimeRef.current;
			if (!runtime) throw new Error("[luc-ui] FinancialChart is not ready for incremental updates");
			const prepared = prepareVolume([point]);
			runtime.controller.updateSeries("volume", prepared.data[0]);
		},
		updateOverlay(id, point) {
			const runtime = incrementalRuntimeRef.current;
			if (!runtime) throw new Error("[luc-ui] FinancialChart is not ready for incremental updates");
			const prepared = prepareOverlay({
				id,
				label: id,
				data: [point]
			}, 0);
			runtime.controller.updateSeries(`overlay:${id}`, prepared.data[0]);
		},
		updateIndicator(paneId, seriesId, point) {
			const runtime = incrementalRuntimeRef.current;
			if (!runtime) throw new Error("[luc-ui] FinancialChart is not ready for incremental updates");
			const prepared = prepareIndicatorSeries({
				id: seriesId,
				kind: "line",
				data: [point]
			}, `${paneId}.${seriesId}`);
			runtime.controller.updateSeries(`indicator:${paneId}:${seriesId}`, prepared.data[0]);
		},
		updateSeries(id, item) {
			const runtime = incrementalRuntimeRef.current;
			if (!runtime) throw new Error("[luc-ui] FinancialChart is not ready for incremental updates");
			runtime.controller.updateSeries(id, item);
		},
		setSeriesData(id, data) {
			const runtime = incrementalRuntimeRef.current;
			if (!runtime) throw new Error("[luc-ui] FinancialChart is not ready for incremental updates");
			runtime.controller.setSeriesData(id, data);
		},
		fit() {
			const runtime = incrementalRuntimeRef.current;
			if (!runtime) return;
			runtime.controller.fit();
		}
	}), []);
	const visibleSources = useMemo(() => visibleOverlays ? (overlays ?? []).filter((overlay) => visibleOverlays.includes(overlay.id)) : overlays ?? [], [overlays, visibleOverlays]);
	const dataState = useMemo(() => prepareChartData({
		candles,
		series,
		volume,
		overlays: visibleSources,
		indicators: indicators ?? []
	}), [
		candles,
		indicators,
		series,
		visibleSources,
		volume
	]);
	const prepared = dataState.data;
	const rangeError = useMemo(() => {
		try {
			validateFinancialRange(range);
			return null;
		} catch (error) {
			return error instanceof Error ? error : new Error(String(error));
		}
	}, [range]);
	const priceAt = useMemo(() => {
		const bySecond = /* @__PURE__ */ new Map();
		if (prepared?.candleRows.length) for (const row of prepared.candleRows) bySecond.set(Math.floor(row.ms / 1e3), row.close);
		else if (prepared?.priceSeries[0]) {
			for (const point of prepared.priceSeries[0].data) if (point.value !== void 0) bySecond.set(point.time, point.value);
		}
		return (ms) => bySecond.get(Math.floor(ms / 1e3)) ?? null;
	}, [prepared]);
	const precision = useMemo(() => priceFormat?.decimals !== void 0 ? {
		precision: priceFormat.decimals,
		minMove: Number(`1e-${priceFormat.decimals}`)
	} : autoPrecision(prepared?.closes ?? []), [prepared?.closes, priceFormat]);
	const formatPrice = useCallback((value) => formatChartValue(value, priceFormat), [priceFormat]);
	const formatVolume = useCallback((value) => formatChartValue(value, volumeFormat ?? {
		kind: "compact",
		decimals: 1
	}), [volumeFormat]);
	const platePriceFormatter = useCallback((value) => numericAxisFormatter(priceFormat)(value), [priceFormat]);
	const plateTickFormatter = useCallback((values) => values.map((value) => numericAxisFormatter(priceFormat)(value)), [priceFormat]);
	const usesIndependentAxis = prepared?.indicators.some((pane) => pane.series.length > 0) ?? false;
	const sharedPriceFormatter = usesIndependentAxis ? void 0 : platePriceFormatter;
	const sharedTickFormatter = usesIndependentAxis ? void 0 : plateTickFormatter;
	const scaleSide = priceScale?.side ?? "right";
	const scaleMode = priceScale?.mode ?? "linear";
	const tooltipOverlays = useMemo(() => visibleSources.map((overlay) => ({
		key: `overlay:${overlay.id}`,
		label: overlay.label,
		color: safeCssColor(overlay.color) ?? toneColor(theme, overlay.tone, 1)
	})), [theme, visibleSources]);
	const tooltipPriceSeries = useMemo(() => {
		if (!prepared) return [];
		return prepared.priceSeries.map((priceSeries, index) => ({
			key: `price:${priceSeries.id}`,
			label: priceSeries.label,
			color: safeCssColor(priceSeries.source.color) ?? toneColor(theme, priceSeries.source.tone, index + 1)
		}));
	}, [prepared, theme]);
	const tooltipIndicators = useMemo(() => {
		if (!prepared) return [];
		return prepared.indicators.flatMap((pane, paneOffset) => pane.series.map((indicator) => {
			const source = indicator.source;
			return {
				key: indicator.key,
				label: pane.series.length === 1 ? pane.source.label : `${pane.source.label} · ${source.label ?? source.id}`,
				color: safeCssColor(source.color) ?? toneColor(theme, source.tone, paneOffset + 2),
				format: source.format
			};
		}));
	}, [prepared, theme]);
	const tooltipStateRef = useLatest({
		mode,
		primarySeriesKey: prepared?.primarySeriesKey ?? "price",
		priceSeries: tooltipPriceSeries,
		volumeSeriesKey: showVolume && (prepared?.volume.data.length ?? 0) > 0 ? "volume" : null,
		overlays: tooltipOverlays,
		indicators: tooltipIndicators,
		labels: {
			open: tooltipLabels?.open ?? "Open",
			high: tooltipLabels?.high ?? "High",
			low: tooltipLabels?.low ?? "Low",
			close: tooltipLabels?.close ?? "Close",
			change: tooltipLabels?.change ?? "Change",
			volume: tooltipLabels?.volume ?? "Volume"
		},
		formatPrice,
		formatVolume
	});
	const build = useCallback((controller) => {
		if (!prepared) return;
		const seriesMap = seriesRef.current;
		const keep = /* @__PURE__ */ new Set();
		const lines = referenceLinesRef.current;
		controller.theme = theme;
		const upsert = (key, kind, options, data, paneIndex) => {
			const previous = seriesMap.get(key);
			const next = controller.upsertSeries(key, kind, options, data, paneIndex);
			if (previous && previous !== next) lines.forget(key);
			seriesMap.set(key, next);
			keep.add(key);
			return next;
		};
		const syncLines = (key, target, levels) => {
			if (!levels?.length) {
				lines.sync(key, target, [], theme.reference);
				return;
			}
			lines.sync(key, target, levels, theme.reference);
		};
		const paneLayout = resolveFinancialPaneLayout({
			showVolume,
			hasVolume: prepared.volume.data.length > 0,
			overlays: visibleSources,
			priceSeries: series ?? [],
			indicators: indicators ?? []
		});
		const priceOptions = {
			priceScaleId: scaleSide,
			priceFormat: usesIndependentAxis ? {
				type: "custom",
				formatter: platePriceFormatter,
				tickmarksFormatter: plateTickFormatter,
				minMove: precision.minMove
			} : {
				type: "price",
				...precision
			},
			priceLineVisible: showPriceLine,
			priceLineStyle: 2,
			priceLineColor: theme.reference,
			lastValueVisible: showPriceLine
		};
		if (prepared.candleData.length > 0) upsert("price", mode === "candlestick" ? "candlestick" : mode === "area" ? "area" : "line", {
			...priceOptions,
			...mode === "candlestick" ? {
				upColor: theme.positive,
				downColor: theme.negative,
				borderUpColor: theme.positive,
				borderDownColor: theme.negative,
				wickUpColor: theme.positive,
				wickDownColor: theme.negative,
				borderVisible: false
			} : {
				color: theme.palette[0] ?? theme.accent,
				lineWidth: 2,
				...mode === "area" ? {
					topColor: theme.selection,
					bottomColor: "rgba(0,0,0,0)",
					lineColor: theme.palette[0] ?? theme.accent
				} : {}
			}
		}, mode === "candlestick" ? prepared.candleData : prepared.candleData.map(({ time, close }) => ({
			time,
			value: close
		})), 0);
		prepared.priceSeries.forEach((priceSeries, index) => {
			const key = `price:${priceSeries.id}`;
			const source = priceSeries.source;
			const color = safeCssColor(source.color) ?? toneColor(theme, source.tone, index + 1);
			const kind = priceSeries.kind;
			const paneIndex = (source.paneIndex ?? 0) === 0 ? 0 : paneLayout.priceSeriesPanes.get(source.paneIndex) ?? 0;
			const target = upsert(key, kind, {
				...priceOptions,
				color,
				lineColor: color,
				...kind === "area" ? {
					topColor: theme.selection,
					bottomColor: "rgba(0,0,0,0)"
				} : {},
				lineWidth: seriesLineWidth(source.lineWidth),
				priceLineVisible: index === 0 && showPriceLine,
				lastValueVisible: index === 0 ? showPriceLine : true,
				...kind === "histogram" || kind === "baseline" ? { base: 0 } : {}
			}, priceSeries.data, paneIndex);
			syncLines(key, target, source.referenceLines);
		});
		prepared.overlays.forEach((overlay) => {
			const source = overlay.source;
			const requestedPane = source.paneIndex ?? 0;
			const paneIndex = requestedPane === 0 ? 0 : paneLayout.overlayPanes.get(requestedPane) ?? 0;
			const target = upsert(overlay.key, "line", {
				color: safeCssColor(source.color) ?? toneColor(theme, source.tone, 1),
				lineWidth: seriesLineWidth(source.lineWidth),
				lineStyle: LINE_STYLE[source.lineType ?? "solid"],
				priceLineVisible: false,
				lastValueVisible: false,
				crosshairMarkerVisible: false
			}, overlay.data, paneIndex);
			syncLines(overlay.key, target, source.referenceLines);
		});
		if (showVolume && prepared.volume.data.length > 0 && paneLayout.volumePane !== null) upsert("volume", "histogram", {
			priceScaleId: scaleSide,
			priceFormat: { type: "volume" },
			priceLineVisible: false,
			lastValueVisible: false,
			base: 0
		}, prepared.volume.data.map((point) => ({
			time: point.time,
			value: point.value,
			color: point.colorDirection === "up" ? theme.positive : point.colorDirection === "down" ? theme.negative : theme.neutral
		})), paneLayout.volumePane);
		prepared.indicators.forEach((pane, paneOffset) => {
			const paneIndex = paneLayout.indicatorStart + paneOffset;
			pane.series.forEach((indicator) => {
				const source = indicator.source;
				const target = upsert(indicator.key, source.kind, {
					color: safeCssColor(source.color) ?? toneColor(theme, source.tone, paneOffset + 2),
					lineWidth: seriesLineWidth(source.lineWidth),
					priceFormat: indicatorPriceFormat(source.format),
					priceLineVisible: false,
					lastValueVisible: true,
					...source.kind === "histogram" || source.kind === "baseline" ? { base: 0 } : {}
				}, indicator.data, paneIndex);
				syncLines(indicator.key, target, pane.source.referenceLines);
			});
		});
		for (const [key, oldSeries] of [...seriesMap]) {
			if (keep.has(key)) continue;
			lines.dispose(key, oldSeries);
			controller.removeSeries(key);
			seriesMap.delete(key);
		}
		controller.chart.panes().forEach((pane, index) => {
			pane.setPreserveEmptyPane(false);
			pane.setStretchFactor(paneLayout.paneStretches.get(index) ?? 1);
		});
		controllerRef.current = controller;
		incrementalRuntimeRef.current = {
			controller,
			data: prepared
		};
		if (announcedControllerRef.current !== controller) {
			announcedControllerRef.current = controller;
			onControllerReadyRef.current?.(financialController);
		}
	}, [
		indicators,
		financialController,
		mode,
		onControllerReadyRef,
		precision,
		prepared,
		platePriceFormatter,
		plateTickFormatter,
		usesIndependentAxis,
		scaleSide,
		series,
		showVolume,
		showPriceLine,
		theme,
		visibleSources
	]);
	const handleReady = useCallback((chart) => {
		try {
			unsubscribeCrosshairRef.current?.();
		} catch {}
		unsubscribeCrosshairRef.current = subscribeLatestCrosshair(chart, () => tooltipStateRef.current, (event, tooltipState) => {
			tooltipBatchRef.current?.schedule({
				event,
				state: tooltipState
			});
		});
		onReadyRef.current?.(chart);
	}, [onReadyRef, tooltipStateRef]);
	useEffect(() => {
		const tooltip = tooltipRef.current;
		const tooltipBatch = createLatestFrameBatch(({ event, state }) => {
			updateTooltip(event, state, seriesRef.current, hostRef.current, tooltipRef.current, lastTooltipHtmlRef, tooltipSizeRef);
		});
		tooltipBatchRef.current = tooltipBatch;
		return () => {
			try {
				unsubscribeCrosshairRef.current?.();
			} catch {}
			unsubscribeCrosshairRef.current = null;
			tooltipBatch.cancel();
			tooltipBatchRef.current = null;
			incrementalRuntimeRef.current = null;
			hideTooltip(tooltip);
			lastTooltipHtmlRef.current = "";
			tooltipSizeRef.current = {
				width: 216,
				height: 120
			};
		};
	}, []);
	const controlledRange = useMemo(() => range === void 0 ? void 0 : range === null ? null : {
		fromMs: range.from,
		toMs: range.to
	}, [range]);
	const legendItems = useMemo(() => {
		if (!prepared) return [];
		const items = [];
		if (prepared.candleData.length > 0) items.push({
			id: "price:candles",
			label: mode === "candlestick" ? "Candles" : mode === "area" ? "Price area" : "Price line",
			color: theme.palette[0] ?? theme.accent
		});
		prepared.priceSeries.forEach((priceSeries, index) => {
			items.push({
				id: `price:${priceSeries.id}`,
				label: priceSeries.label,
				color: safeCssColor(priceSeries.source.color) ?? toneColor(theme, priceSeries.source.tone, index + 1)
			});
		});
		prepared.overlays.forEach((overlay) => {
			items.push({
				id: `overlay:${overlay.source.id}`,
				label: overlay.source.label,
				color: safeCssColor(overlay.source.color) ?? toneColor(theme, overlay.source.tone, 1)
			});
		});
		prepared.indicators.forEach((pane) => {
			items.push({
				id: `indicator:${pane.source.id}`,
				label: pane.source.label,
				color: theme.reference
			});
		});
		if (showVolume && prepared.volume.data.length > 0) items.push({
			id: "volume",
			label: "Volume",
			color: theme.neutral
		});
		return items;
	}, [
		mode,
		prepared,
		showVolume,
		theme
	]);
	const box = (node, compact = false) => /* @__PURE__ */ jsx("div", {
		className: cn("relative w-full min-h-0", className),
		style: compact ? void 0 : { height: height ?? "100%" },
		children: node
	});
	if (state === "loading") return box(/* @__PURE__ */ jsx(ChartSkeleton, { height: "100%" }));
	if (dataState.error || rangeError) return box(/* @__PURE__ */ jsx(ChartErrorState, {
		compact: true,
		title: "Invalid financial data",
		description: (dataState.error ?? rangeError).message
	}), true);
	if (state === "error") return box(/* @__PURE__ */ jsx(ChartErrorState, {
		compact: true,
		title: "Price data unavailable",
		description: "The provider returned no rows."
	}), true);
	if (state === "empty" || !prepared || prepared.candleData.length === 0 && prepared.priceSeries.every((priceSeries) => priceSeries.data.length === 0)) return box(/* @__PURE__ */ jsx(ChartEmptyState, {
		compact: true,
		title: "No price history",
		description: "Nothing to plot for this window."
	}), true);
	return box(/* @__PURE__ */ jsxs("div", {
		ref: hostRef,
		className: "relative h-full w-full",
		children: [
			/* @__PURE__ */ jsx(LightweightSurface, {
				build,
				syncGroup,
				resolvePrice: priceAt,
				priceScale: {
					side: scaleSide,
					mode: scaleMode
				},
				priceFormatter: sharedPriceFormatter,
				tickFormatter: sharedTickFormatter,
				themeOverride,
				visibleRange: controlledRange,
				ariaLabel: ariaLabel ?? "Price chart",
				ariaDescription,
				onReady: handleReady
			}),
			showLegend && legendItems.length > 0 ? /* @__PURE__ */ jsx("div", {
				"data-slot": "financial-chart-legend",
				className: "pointer-events-none absolute left-2 top-2 z-[2] flex max-w-[calc(100%-5rem)] flex-wrap gap-x-3 gap-y-1 rounded-md bg-surface-overlay/80 px-2 py-1 text-caption text-fg-muted shadow-sm",
				"aria-label": "Chart legend",
				role: "list",
				children: legendItems.map((item) => /* @__PURE__ */ jsxs("span", {
					className: "inline-flex min-w-0 items-center gap-1.5",
					role: "listitem",
					children: [/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "size-1.5 shrink-0 rounded-full",
						style: { backgroundColor: safeCssColor(item.color) ?? theme.reference }
					}), /* @__PURE__ */ jsx("span", {
						className: "truncate",
						children: item.label
					})]
				}, item.id))
			}) : null,
			/* @__PURE__ */ jsx("div", {
				ref: tooltipRef,
				"data-slot": "financial-chart-tooltip",
				className: "pointer-events-none absolute left-0 top-0 z-10",
				hidden: true
			})
		]
	}));
}
//#endregion
export { FinancialChart, FinancialDataError };

//# sourceMappingURL=financial-chart.js.map