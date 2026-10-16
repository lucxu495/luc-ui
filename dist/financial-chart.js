"use client";
import { cn } from "./utils/cn.js";
import "./charts/core/axis.js";
import { ChartEmptyState, ChartErrorState, ChartSkeleton } from "./charts/chart-card.js";
import { toneColor } from "./charts/core/theme.js";
import { formatChartValue, numericAxisFormatter } from "./charts/core/formatters.js";
import { useChartTheme, useLatest } from "./charts/core/use-chart-theme.js";
import { toChartTime } from "./charts/adapters/lightweight/runtime.js";
import { LightweightSurface } from "./charts/adapters/lightweight/lightweight-surface.js";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "./charts/core/tooltip-html.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
//#region src/charts/financial/financial-chart.tsx
const LINE_STYLE = {
	solid: 0,
	dashed: 2,
	dotted: 1
};
function toMs(value) {
	if (value instanceof Date) {
		const time = value.getTime();
		return Number.isNaN(time) ? null : time;
	}
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	const parsed = Date.parse(value);
	return Number.isNaN(parsed) ? null : parsed;
}
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
/**
* Financial price chart.
*
* Candles (or a price line/area), an optional volume pane and any number of
* prepared indicator panes, behind one adapter that owns creation, resize,
* theme, range and crosshair synchronisation. The consumer never sees
* `createChart`.
*
* Calculations are the caller's responsibility: SMA, RSI, MACD and volatility
* arrive as prepared series. This component draws what it is given.
*/
function FinancialChart({ candles, volume, overlays, indicators, mode = "candlestick", range, priceFormat, volumeFormat, visibleOverlays, showVolume = true, syncGroup, priceScale, state = "ready", height, className, ariaLabel, ariaDescription, onReady }) {
	const theme = useChartTheme();
	const hostRef = useRef(null);
	const seriesRef = useRef(/* @__PURE__ */ new Map());
	const [tip, setTip] = useState(null);
	const prepared = useMemo(() => {
		const rows = candles.map((candle) => ({
			...candle,
			ms: toMs(candle.time)
		})).filter((candle) => candle.ms !== null).sort((a, b) => a.ms - b.ms);
		return {
			rows,
			priceData: rows.map((candle) => ({
				time: toChartTime(candle.ms),
				open: candle.open,
				high: candle.high,
				low: candle.low,
				close: candle.close,
				value: candle.close
			})),
			closes: rows.map((candle) => candle.close),
			volumeRows: (volume ?? []).map((point) => ({
				...point,
				ms: toMs(point.time)
			})).filter((point) => point.ms !== null).sort((a, b) => a.ms - b.ms)
		};
	}, [candles, volume]);
	const priceAt = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		prepared.rows.forEach((row) => map.set(Math.floor(row.ms / 1e3), row.close));
		return (ms) => map.get(Math.floor(ms / 1e3)) ?? null;
	}, [prepared.rows]);
	const precision = useMemo(() => priceFormat?.decimals !== void 0 ? {
		precision: priceFormat.decimals,
		minMove: Number(`1e-${priceFormat.decimals}`)
	} : autoPrecision(prepared.closes), [prepared.closes, priceFormat]);
	const formatPrice = useCallback((value) => formatChartValue(value, priceFormat), [priceFormat]);
	const formatVolume = useCallback((value) => formatChartValue(value, volumeFormat ?? {
		kind: "compact",
		decimals: 1
	}), [volumeFormat]);
	const scaleSide = priceScale?.side ?? "right";
	const scaleMode = priceScale?.mode ?? "linear";
	/**
	* The plate labels are abbreviated (`$124.7K`) and the DOM tooltip keeps full
	* precision (`$124,658`). That is not only a readability choice: a compact
	* plate fits the reserved `axisGutter` the analytical lane also uses, which is
	* what lets a stacked research column share one plot rectangle.
	*/
	const platePriceFormatter = useCallback((value) => numericAxisFormatter(priceFormat)(value), [priceFormat]);
	const plateTickFormatter = useCallback((values) => values.map((value) => numericAxisFormatter(priceFormat)(value)), [priceFormat]);
	const visible = useMemo(() => visibleOverlays ? overlays?.filter((overlay) => visibleOverlays.includes(overlay.id)) : overlays, [overlays, visibleOverlays]);
	const build = useCallback((controller) => {
		const { chart } = controller;
		const shades = {
			up: theme.positive,
			down: theme.negative,
			neutral: theme.neutral
		};
		const seriesMap = seriesRef.current;
		const keep = /* @__PURE__ */ new Set();
		const priceOptions = {
			priceScaleId: scaleSide,
			priceFormat: {
				type: "price",
				...precision
			},
			priceLineVisible: true,
			priceLineStyle: 2,
			priceLineColor: theme.reference,
			lastValueVisible: true
		};
		keep.add("price");
		seriesMap.set("price", controller.upsertSeries("price", mode === "candlestick" ? "candlestick" : mode === "area" ? "area" : "line", {
			...priceOptions,
			...mode === "candlestick" ? {
				upColor: shades.up,
				downColor: shades.down,
				borderUpColor: shades.up,
				borderDownColor: shades.down,
				wickUpColor: shades.up,
				wickDownColor: shades.down,
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
		}, prepared.priceData, 0));
		for (const overlay of visible ?? []) {
			keep.add(overlay.id);
			seriesMap.set(overlay.id, controller.upsertSeries(overlay.id, "line", {
				color: overlay.color ?? toneColor(theme, overlay.tone, 1),
				lineWidth: overlay.lineWidth ?? 1.6,
				lineStyle: LINE_STYLE[overlay.lineType ?? "solid"],
				priceLineVisible: false,
				lastValueVisible: false,
				crosshairMarkerVisible: false
			}, overlay.data.map((point) => ({
				ms: toMs(point.time),
				value: point.value
			})).filter((point) => point.ms !== null).map((point) => ({
				time: toChartTime(point.ms),
				value: point.value
			})), overlay.paneIndex ?? 0));
		}
		if (showVolume && prepared.volumeRows.length > 0) {
			keep.add("volume");
			const volumeSeries = controller.upsertSeries("volume", "histogram", {
				priceScaleId: scaleSide,
				priceFormat: { type: "volume" },
				priceLineVisible: false,
				lastValueVisible: false,
				base: 0
			}, prepared.volumeRows.map((point) => ({
				time: toChartTime(point.ms),
				value: point.value,
				color: point.direction === "up" ? theme.positive : point.direction === "down" ? theme.negative : theme.neutral
			})), 1);
			seriesMap.set("volume", volumeSeries);
		}
		indicators?.forEach((pane, paneOffset) => {
			const paneIndex = 2 + paneOffset;
			pane.series.forEach((series) => {
				const key = `${pane.id}:${series.id}`;
				keep.add(key);
				const paneSeries = controller.upsertSeries(key, series.kind, {
					color: series.color ?? toneColor(theme, series.tone, paneOffset + 2),
					lineWidth: series.lineWidth ?? 1.6,
					priceLineVisible: false,
					lastValueVisible: true,
					...series.kind === "histogram" ? { base: 0 } : {}
				}, series.data.map((point) => ({
					ms: toMs(point.time),
					value: point.value
				})).filter((point) => point.ms !== null).map((point) => ({
					time: toChartTime(point.ms),
					value: point.value
				})), paneIndex);
				seriesMap.set(key, paneSeries);
				pane.referenceLines?.forEach((level, levelIndex) => {
					paneSeries.createPriceLine({
						price: level,
						color: theme.reference,
						lineWidth: 1,
						lineStyle: LINE_STYLE.dotted,
						axisLabelVisible: levelIndex === 0,
						title: ""
					});
				});
			});
		});
		for (const key of [...seriesMap.keys()]) if (!keep.has(key)) {
			controller.removeSeries(key);
			seriesMap.delete(key);
		}
		chart.panes().forEach((pane, index) => {
			if (index === 0) pane.setStretchFactor(3);
			else {
				const indicatorPane = indicators?.[index - 2];
				pane.setStretchFactor(indicatorPane?.stretch ?? 1);
			}
		});
		if (range) controller.setVisibleRange(range.from, range.to);
		else controller.fit();
	}, [
		indicators,
		mode,
		precision,
		prepared.priceData,
		prepared.volumeRows,
		range,
		scaleSide,
		showVolume,
		theme,
		visible
	]);
	const onReadyPropRef = useLatest(onReady);
	const handleReady = useCallback((chart) => {
		chart.subscribeCrosshairMove((param) => {
			const host = hostRef.current;
			if (!host) return;
			if (param.time === void 0 || !param.point) {
				setTip(null);
				return;
			}
			const ms = typeof param.time === "number" ? param.time * 1e3 : null;
			if (ms === null) {
				setTip(null);
				return;
			}
			const candle = mode === "candlestick" ? param.seriesData.get(seriesRef.current.get("price")) : void 0;
			const pricePoint = param.seriesData.get(seriesRef.current.get("price"));
			const close = candle?.close ?? pricePoint?.value ?? null;
			const open = candle?.open ?? close;
			const change = close !== null && open !== null ? close - open : null;
			const changePct = change !== null && open ? change / open * 100 : null;
			const volumePoint = param.seriesData.get(seriesRef.current.get("volume"));
			const overlayRows = (visible ?? []).map((overlay) => {
				const series = seriesRef.current.get(overlay.id);
				if (!series) return null;
				const value = param.seriesData.get(series)?.value;
				return value === void 0 ? null : tooltipRowHtml(overlay.label, formatPrice(value), overlay.color ?? toneColor(theme, overlay.tone, 1));
			}).filter((row) => row !== null);
			const ohlcRows = candle ? [
				["Open", formatPrice(candle.open)],
				["High", formatPrice(candle.high)],
				["Low", formatPrice(candle.low)],
				["Close", formatPrice(candle.close)]
			] : [["Close", formatPrice(close)]];
			const changeRow = change !== null && changePct !== null ? `<div class="luc-chart-tooltip__rows">${tooltipRowHtml("Change", `${formatPrice(change)}  (${formatChartValue(changePct, {
				kind: "percent",
				signed: true
			})})`)}</div>` : "";
			const volumeRow = volumePoint?.value === void 0 ? "" : `<div class="luc-chart-tooltip__rows">${tooltipRowHtml("Volume", formatVolume(volumePoint.value))}</div>`;
			const overlayBlock = overlayRows.length ? `<div class="luc-chart-tooltip__rule"></div><div class="luc-chart-tooltip__rows">${overlayRows.join("")}</div>` : "";
			const body = tooltipGridHtml(ohlcRows) + changeRow + volumeRow + overlayBlock;
			const width = host.clientWidth;
			const left = Math.min(Math.max(param.point.x + 16, 8), Math.max(8, width - 216));
			const top = Math.max(param.point.y - 12, 8);
			setTip({
				left,
				top,
				html: tooltipShellHtml(formatChartValue(ms, { kind: "date" }), body)
			});
		});
		onReadyPropRef.current?.(chart);
	}, [
		formatPrice,
		formatVolume,
		mode,
		onReadyPropRef,
		theme,
		visible
	]);
	useEffect(() => {
		return () => setTip(null);
	}, []);
	const box = (node, compact = false) => /* @__PURE__ */ jsx("div", {
		className: cn("relative w-full min-h-0", className),
		style: compact ? void 0 : { height: height ?? "100%" },
		children: node
	});
	if (state === "loading") return box(/* @__PURE__ */ jsx(ChartSkeleton, { height: "100%" }));
	if (state === "error") return box(/* @__PURE__ */ jsx(ChartErrorState, {
		compact: true,
		title: "Price data unavailable",
		description: "The provider returned no rows."
	}), true);
	if (state === "empty" || prepared.rows.length === 0) return box(/* @__PURE__ */ jsx(ChartEmptyState, {
		compact: true,
		title: "No price history",
		description: "Nothing to plot for this window."
	}), true);
	return box(/* @__PURE__ */ jsxs("div", {
		ref: hostRef,
		className: "relative h-full w-full",
		children: [/* @__PURE__ */ jsx(LightweightSurface, {
			build,
			syncGroup,
			resolvePrice: priceAt,
			priceScale: {
				side: scaleSide,
				mode: scaleMode
			},
			priceFormatter: platePriceFormatter,
			tickFormatter: plateTickFormatter,
			ariaLabel: ariaLabel ?? "Price chart",
			ariaDescription,
			onReady: handleReady
		}), tip ? /* @__PURE__ */ jsx("div", {
			className: "pointer-events-none absolute z-10",
			style: {
				left: tip.left,
				top: tip.top
			},
			dangerouslySetInnerHTML: { __html: tip.html }
		}) : null]
	}));
}
//#endregion
export { FinancialChart };

//# sourceMappingURL=financial-chart.js.map