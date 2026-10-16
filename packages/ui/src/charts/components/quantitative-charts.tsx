"use client";

import { useMemo } from "react";
import type { ChartFormat } from "../types";
import { useChartMotion, useChartTheme } from "../core/use-chart-theme";
import { formatChartValue, timeSpanMs } from "../core/formatters";
import { seriesColor } from "../core/palette";
import { axisFragment, baseOption, gridFragment, tooltipShell, type Option } from "../adapters/echarts/option";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html";
import { ChartSurface } from "./chart";
import { formatRatio, type FamilyCommonProps } from "./chart-common";
import type { Candle } from "../financial/financial-chart";

/**
 * A candle time, as epoch milliseconds.
 *
 * `Candle.time` accepts a number, a `Date` or an ISO string (it is shared with
 * the Lightweight Charts surface). ECharts wants a number, so the conversion
 * happens once, here, rather than in every accessor.
 */
function candleTime(time: Candle["time"]): number {
  if (typeof time === "number") return time;
  if (time instanceof Date) return time.getTime();
  const parsed = Date.parse(time);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Quantitative finance charts.
 *
 * The rule from `docs/CHART_GUIDE.md` applies with extra force here: **LUC UI
 * never computes a financial metric.** A drawdown is supplied, an implied
 * volatility is supplied, a factor exposure is supplied. Nothing in this file
 * differences a price series, fits a smile or solves an optimisation — those
 * belong to the analysis layer, where they can be reviewed, versioned and tied
 * to a data version. The charts exist to *present* those outputs faithfully.
 */

/* -------------------------------------------------------------------------- */
/* Candlestick / OHLC                                                          */
/* -------------------------------------------------------------------------- */

export interface CandleOverlay {
  label: string;
  /** One value per candle; `null` leaves a gap (never interpolated). */
  values: readonly (number | null)[];
}

export interface CandlestickChartProps extends FamilyCommonProps {
  candles: readonly Candle[];
  /** Overlaid lines (moving averages, bands) — supplied, not computed. */
  overlays?: readonly CandleOverlay[];
  priceFormat?: ChartFormat;
  timeFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Candlestick — the ECharts rendition, alongside the Lightweight Charts one.
 *
 * Two engines, two jobs. `@luc/ui/financial-chart` is the interactive trading
 * surface (pan, zoom, real-time updates, the provider's own scales). This one
 * exists so a candle chart can live *inside* an analytics composition — a grid,
 * a dashboard, a print view — where the Lightweight surface's own scroll model
 * and mandatory attribution logo are the wrong shape. Neither computes
 * anything; both take the same OHLC rows.
 */
export function CandlestickChart({
  candles,
  overlays,
  priceFormat,
  timeFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: CandlestickChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const xSpan = timeSpanMs(candles.map((candle) => candle.time));
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 16, top: 16, bottom: 12 }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const candleEntry = list.find((entry) => (entry as { seriesType?: string }).seriesType === "candlestick") as
            | { value?: number[]; axisValue?: number }
            | undefined;
          if (!candleEntry?.value) return "";
          const [, open = 0, close = 0, low = 0, high = 0] = candleEntry.value;
          const change = close - open;
          return tooltipShellHtml(
            formatChartValue(candleEntry.axisValue, { kind: "date", ...timeFormat }),
            tooltipGridHtml([
              ["Open", formatChartValue(open, priceFormat)],
              ["High", formatChartValue(high, priceFormat)],
              ["Low", formatChartValue(low, priceFormat)],
              ["Close", formatChartValue(close, priceFormat)],
              ["Change", `${change >= 0 ? "+" : ""}${formatChartValue(change, priceFormat)}`],
            ]),
          );
        },
      }),
      xAxis: axisFragment({
        type: "time",
        theme,
        format: timeFormat ?? { kind: "date" },
        ...(xSpan !== undefined ? { spanMs: xSpan } : {}),
      }),
      yAxis: axisFragment({ type: "value", theme, format: priceFormat, scale: true, position: "right" }),
      series: [
        {
          name: "Price",
          type: "candlestick",
          /*
           * The tone pair is the theme's own gain/loss, so a candle never
           * disagrees with a delta or a table cell about which colour means up.
           */
          itemStyle: {
            color: theme.positive,
            color0: theme.negative,
            borderColor: theme.positive,
            borderColor0: theme.negative,
          },
          data: candles.map((candle) => [
            candleTime(candle.time),
            candle.open,
            candle.close,
            candle.low,
            candle.high,
          ]),
          emphasis: { itemStyle: { borderWidth: 2 } },
        },
        ...(overlays ?? []).map((overlay, index) => ({
          name: overlay.label,
          type: "line",
          showSymbol: false,
          smooth: false,
          connectNulls: false,
          lineStyle: { width: 1.4, color: seriesColor(theme, overlay.label, index), opacity: 0.9 },
          itemStyle: { color: seriesColor(theme, overlay.label, index) },
          data: overlay.values.map((value, position) => [
            candles[position] ? candleTime(candles[position].time) : position,
            value,
          ]),
        })),
      ],
    };
  }, [candles, motion, overlays, priceFormat, theme, timeFormat]);

  return (
    <ChartSurface
      option={option}
      xValues={candles.map((candle) => candleTime(candle.time))}
      state={candles.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Candlestick chart"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "No candles", emptyDescription: "No OHLC rows were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Drawdown                                                                    */
/* -------------------------------------------------------------------------- */

export interface DrawdownChartProps extends FamilyCommonProps {
  /** `value` is the supplied drawdown: negative for a loss, 0 at a high. */
  points: readonly { time: number; value: number }[];
  /** Format of an *already ratio-scaled* value. Defaults to percent from ratio. */
  format?: ChartFormat;
  timeFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Underwater (drawdown) curve.
 *
 * The values are the caller's — this component does not difference a price
 * series to find the running peak. The area is anchored at zero and the axis
 * never pads above it, because a percentage *gain* in a drawdown chart is a
 * number that does not exist (see V1.3's headroom rule).
 */
export function DrawdownChart({
  points,
  format,
  timeFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: DrawdownChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    const worst = points.reduce((min, point) => Math.min(min, point.value), 0);
    /*
     * Axis precision follows the *depth* of the drawdown, not each tick.
     *
     * `formatRatio` rounds a value below half a display unit to zero, which is
     * right for a readout — "-0.0 %" is noise — and wrong for an axis. Choosing
     * the decimals per tick meant a shallow 0 … -3.8 % drawdown labelled all
     * five ticks "0 %": every tick was under the 5-unit threshold at zero
     * decimals and collapsed onto the same string. The range decides instead,
     * so a shallow underwater curve reads -3.8 / -2.5 / -1.3 / 0.
     */
    const depth = Math.abs(worst);
    const axisDecimals = depth < 0.01 ? 2 : depth < 0.2 ? 1 : 0;
    const xSpan = timeSpanMs(points.map((point) => point.time));
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 18, top: 16, bottom: 12 }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { value?: [number, number]; axisValue?: number };
          if (!first?.value) return "";
          return tooltipShellHtml(
            formatChartValue(first.axisValue ?? first.value[0], { kind: "date", ...timeFormat }),
            tooltipGridHtml([
              ["Drawdown", format ? formatChartValue(first.value[1], format) : formatRatio(first.value[1])],
              ["Trough", format ? formatChartValue(worst, format) : formatRatio(worst)],
            ]),
          );
        },
      }),
      xAxis: axisFragment({
        type: "time",
        theme,
        format: timeFormat ?? { kind: "date" },
        ...(xSpan !== undefined ? { spanMs: xSpan } : {}),
      }),
      yAxis: {
        ...axisFragment({ type: "value", theme, format, max: 0, min: worst * 1.08, position: "right" }),
        ...(format
          ? {}
          : {
              axisLabel: {
                color: theme.axisLabel,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontCaption,
                formatter: (value: number) => formatRatio(value, axisDecimals),
              },
            }),
      },
      series: [
        {
          name: "Drawdown",
          type: "line",
          showSymbol: false,
          smooth: false,
          lineStyle: { width: 1.6, color: theme.negative },
          itemStyle: { color: theme.negative },
          areaStyle: { color: theme.negative, opacity: 0.16, origin: "start" },
          data: points.map((point) => [point.time, point.value]),
        },
      ],
    };
  }, [format, motion, points, theme, timeFormat]);

  return (
    <ChartSurface
      option={option}
      xValues={points.map((point) => point.time)}
      state={points.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Drawdown"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "No drawdown", emptyDescription: "No drawdown points were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Volatility smile                                                            */
/* -------------------------------------------------------------------------- */

export interface VolatilitySlice {
  /** Label drawn in the legend — an expiry, a tenor, a date. */
  expiry: string;
  points: readonly { strike: number; impliedVol: number }[];
}

export interface VolatilitySmileChartProps extends FamilyCommonProps {
  slices: readonly VolatilitySlice[];
  strikeFormat?: ChartFormat;
  /** Implied volatility, already in the caller's units (e.g. 0.42 or 42). */
  volFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Volatility smile — implied volatility against strike, one curve per expiry.
 *
 * The smile shape is whatever the market supplied; nothing is interpolated or
 * extrapolated between strikes. An empty window simply has fewer points, which
 * is the honest picture a recalibrating surface should give.
 */
export function VolatilitySmileChart({
  slices,
  strikeFormat,
  volFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: VolatilitySmileChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 20, top: 16, bottom: 12 }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { value?: [number, number] } | undefined;
          if (!first?.value) return "";
          const rows = list.map((entry) => {
            const item = entry as { seriesName?: string; value?: [number, number]; color?: string };
            return tooltipRowHtml(item.seriesName ?? "", formatChartValue(item.value?.[1], volFormat), item.color);
          });
          return tooltipShellHtml(
            `Strike ${formatChartValue(first.value[0], strikeFormat)}`,
            `<div>${rows.join("")}</div>`,
          );
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format: strikeFormat, scale: true }),
      yAxis: axisFragment({ type: "value", theme, format: volFormat, scale: true, position: "right" }),
      series: slices.map((slice, index) => ({
        name: slice.expiry,
        type: "line",
        showSymbol: true,
        symbolSize: 6,
        smooth: false,
        connectNulls: false,
        lineStyle: { width: 1.8, color: seriesColor(theme, slice.expiry, index) },
        itemStyle: { color: seriesColor(theme, slice.expiry, index) },
        emphasis: { focus: "series" },
        data: slice.points.map((point) => [point.strike, point.impliedVol]),
      })),
    };
  }, [motion, slices, strikeFormat, theme, volFormat]);

  return (
    <ChartSurface
      option={option}
      state={slices.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Volatility smile"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "No surface", emptyDescription: "No implied-volatility slices were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Efficient frontier                                                          */
/* -------------------------------------------------------------------------- */

export interface FrontierPoint {
  label?: string;
  /** Expected risk (standard deviation or any supplied unit). */
  risk: number;
  /** Expected return, in the same units as the axis format. */
  expectedReturn: number;
}

export interface EfficientFrontierChartProps extends FamilyCommonProps {
  /** Individual assets or portfolios. */
  assets: readonly FrontierPoint[];
  /** The efficient frontier itself, ordered by risk. */
  frontier?: readonly FrontierPoint[];
  /** The currently held portfolio. */
  current?: FrontierPoint;
  riskFormat?: ChartFormat;
  returnFormat?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * Risk/return map with an efficient frontier.
 *
 * LUC does not solve the optimisation: the frontier is supplied as ordered
 * points, so the caller can state the constraints it used. The current
 * portfolio is a marker rather than a second chart, which is what makes "where
 * am I relative to the frontier" a glance instead of an analysis.
 */
export function EfficientFrontierChart({
  assets,
  frontier,
  current,
  riskFormat,
  returnFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: EfficientFrontierChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 20, top: 16, bottom: 12 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { seriesName?: string; value?: [number, number] };
          if (!item.value) return "";
          return tooltipShellHtml(
            item.seriesName,
            tooltipGridHtml([
              ["Risk", formatChartValue(item.value[0], riskFormat)],
              ["Return", formatChartValue(item.value[1], returnFormat)],
            ]),
          );
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format: riskFormat, scale: true }),
      yAxis: axisFragment({ type: "value", theme, format: returnFormat, scale: true, position: "right" }),
      series: [
        ...(frontier
          ? [
              {
                name: "Efficient frontier",
                type: "line",
                showSymbol: false,
                smooth: true,
                lineStyle: { width: 2, color: theme.accent },
                itemStyle: { color: theme.accent },
                data: frontier.map((point) => [point.risk, point.expectedReturn]),
              },
            ]
          : []),
        {
          name: "Assets",
          type: "scatter",
          symbolSize: 9,
          data: assets.map((asset, index) => ({
            name: asset.label,
            value: [asset.risk, asset.expectedReturn],
            itemStyle: { color: seriesColor(theme, asset.label ?? "asset", index), opacity: 0.85 },
          })),
          label: {
            show: true,
            position: "top",
            formatter: (params: unknown) => (params as { name?: string }).name ?? "",
            color: theme.textMuted,
            fontFamily: theme.fontFamily,
            fontSize: theme.fontMicro,
          },
        },
        ...(current
          ? [
              {
                name: current.label ?? "Current portfolio",
                type: "effectScatter",
                rippleEffect: { scale: 2.6, brushType: "stroke" },
                symbolSize: 13,
                data: [[current.risk, current.expectedReturn]],
                itemStyle: { color: theme.marker, borderColor: theme.surface, borderWidth: 1.5 },
              },
            ]
          : []),
      ],
    };
  }, [assets, current, frontier, motion, returnFormat, riskFormat, theme]);

  return (
    <ChartSurface
      option={option}
      state={assets.length === 0 && !frontier ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Risk and return"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No portfolios were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Factor exposure                                                             */
/* -------------------------------------------------------------------------- */

export interface FactorExposureChartProps extends FamilyCommonProps {
  factors: readonly { label: string; value: number }[];
  /** Zero-centred by default: an exposure is a signed quantity. */
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/** Factor exposure — a zero-centred bar per factor, coloured by sign. */
export function FactorExposureChart({
  factors,
  format,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: FactorExposureChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 20 }),
      tooltip: tooltipShell(theme, {
        mode: "item",
        formatter: (params: unknown) => {
          const item = params as { dataIndex?: number; value?: number };
          const factor = factors[item.dataIndex ?? 0];
          if (!factor) return "";
          return tooltipShellHtml(
            factor.label,
            tooltipGridHtml([["Exposure", formatChartValue(factor.value, format)]]),
          );
        },
      }),
      xAxis: axisFragment({ type: "value", theme, format, scale: true }),
      yAxis: {
        type: "category",
        data: factors.map((factor) => factor.label),
        inverse: true,
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      series: [
        {
          name: "Exposure",
          type: "bar",
          barWidth: 14,
          data: factors.map((factor) => ({
            value: factor.value,
            itemStyle: {
              color: factor.value >= 0 ? theme.positive : theme.negative,
              opacity: 0.85,
              borderRadius: factor.value >= 0 ? [0, 3, 3, 0] : [3, 0, 0, 3],
            },
          })),
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: theme.axisLine, width: 1 },
            label: { show: false },
            data: [{ xAxis: 0 }],
          },
        },
      ],
    };
  }, [factors, format, motion, theme]);

  return (
    <ChartSurface
      option={option}
      state={factors.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Factor exposure"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to plot", emptyDescription: "No factor loadings were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* P&L attribution                                                             */
/* -------------------------------------------------------------------------- */

export interface PnlAttributionChartProps extends FamilyCommonProps {
  /** Periods along the axis, e.g. months. */
  periods: readonly string[];
  series: readonly {
    label: string;
    /** One signed contribution per period. */
    values: readonly number[];
  }[];
  /** `stacked` (default) shows the total per period; `grouped` compares them. */
  variant?: "stacked" | "grouped";
  format?: ChartFormat;
  title?: string;
  description?: string;
}

/**
 * P&L attribution — signed contributions by source over time.
 *
 * Because a contribution can be negative, a stacked variant uses ECharts'
 * signed stacking, so a losing factor visibly *subtracts* from the column
 * instead of being drawn on top of the winners.
 */
export function PnlAttributionChart({
  periods,
  series,
  variant = "stacked",
  format,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager,
}: PnlAttributionChartProps) {
  const theme = useChartTheme();
  const motion = useChartMotion(theme);

  const option = useMemo<Option>(() => {
    return {
      ...baseOption(theme, motion),
      grid: gridFragment({ containLabel: true, left: 8, right: 16 }),
      tooltip: tooltipShell(theme, {
        mode: "axis",
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as { name?: string } | undefined;
          const rows = list.map((entry) => {
            const item = entry as { seriesName?: string; value?: number; color?: string };
            return [
              item.seriesName ?? "",
              `${(item.value ?? 0) >= 0 ? "+" : ""}${formatChartValue(item.value, format)}`,
              item.color ?? "",
            ] as const;
          });
          const total = list.reduce((sum, entry) => sum + Number((entry as { value?: number }).value ?? 0), 0);
          return tooltipShellHtml(
            first?.name,
            `<div>${rows
              .map(([label, value, color]) => tooltipRowHtml(label, value, color))
              .join("")}${tooltipRowHtml("Total", `${total >= 0 ? "+" : ""}${formatChartValue(total, format)}`)}</div>`,
          );
        },
      }),
      xAxis: {
        type: "category",
        data: [...periods],
        axisLine: { lineStyle: { color: theme.axisLine } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: theme.axisLabel, fontFamily: theme.fontFamily, fontSize: theme.fontCaption },
      },
      yAxis: axisFragment({ type: "value", theme, format, scale: true }),
      series: series.map((entry, index) => ({
        name: entry.label,
        type: "bar",
        stack: variant === "stacked" ? "pnl" : undefined,
        barMaxWidth: 34,
        itemStyle: {
          color: seriesColor(theme, entry.label, index),
          borderRadius: variant === "grouped" ? [2, 2, 0, 0] : 0,
        },
        emphasis: { focus: "series" },
        data: [...entry.values],
      })),
    };
  }, [format, motion, periods, series, theme, variant]);

  return (
    <ChartSurface
      option={option}
      state={periods.length === 0 || series.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "P&L attribution"}
      ariaDescription={ariaDescription ?? description}
      copy={{ emptyTitle: "Nothing to attribute", emptyDescription: "No contributions were supplied." }}
      onReady={onReady}
      onEvent={onEvent}
      eager={eager}
    />
  );
}
