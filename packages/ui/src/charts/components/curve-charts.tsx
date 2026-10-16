"use client";

import { useMemo } from "react";
import type {
  AnnotationSpec,
  ChartFormat,
  ChartInteractionSpec,
  ChartRow,
  SeriesSpec,
  SeriesTone,
} from "../types";
import type { YScaleMode } from "../core/axis";
import { Chart, type ChartState } from "./chart";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";

export interface CurveDefinition {
  name: string;
  values: readonly (number | null)[];
  tone?: SeriesTone;
  /**
   * Pinned palette slot (1-based). A series that keeps one identity across
   * several charts — an era, a benchmark, a historical cycle — takes the same
   * slot everywhere, so colour stays a name rather than an accident of order.
   */
  palette?: number;
  /** The curve to emphasise: thicker stroke, full opacity. */
  emphasis?: boolean;
  lineType?: "solid" | "dashed" | "dotted";
}

export interface CurveComparisonChartProps {
  xLabels: readonly (string | number)[];
  curves: readonly CurveDefinition[];
  xLabel?: string;
  yLabel?: string;
  format?: ChartFormat;
  /**
   * The format of a **numeric** x axis, when it is not the value format.
   *
   * A term structure's tenor is a count of years and a cycle path's x is a count
   * of days: both are numbers, and neither should inherit the y axis' percent or
   * currency format. Absent, the numeric x keeps the value format (a curve whose
   * two axes are the same measure).
   */
  xFormat?: ChartFormat;
  annotations?: AnnotationSpec;
  interaction?: ChartInteractionSpec;
  syncGroup?: string;
  visibleSeries?: readonly string[];
  /**
   * The **presentation** scale of the shared y axis.
   *
   * A multi-cycle indexed price path, a growth curve and a long-horizon price
   * model are read across orders of magnitude, where a linear axis flattens
   * everything before the latest move. Switching the scale re-maps the same
   * served values; nothing upstream is transformed, and a window holding a
   * non-positive value falls back to linear rather than dropping it.
   */
  scaleMode?: YScaleMode;
  /**
   * Which scale modes the caller may offer. Absent with no `scaleMode` keeps the
   * chart linear-only (the historical behaviour).
   */
  allowedScaleModes?: readonly YScaleMode[];
  title?: string;
  description?: string;
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

/**
 * Curves that share an ordered x axis.
 *
 * Deliberately generic: an interest-rate curve, a volatility smile, a yield
 * curve and a factor profile are the same visual problem. Consumers pass
 * prepared values; LUC UI never derives a curve.
 */
export function CurveComparisonChart({
  xLabels,
  curves,
  xLabel,
  yLabel,
  format,
  xFormat,
  annotations,
  interaction,
  syncGroup,
  visibleSeries,
  scaleMode,
  allowedScaleModes,
  title,
  description,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: CurveComparisonChartProps) {
  const numericX = xLabels.length > 0 && xLabels.every((label) => typeof label === "number");
  /*
   * The scale capability the caller declares. Two curves in one plot can never
   * disagree about their axis, so the mode is one chart-wide choice; naming a
   * mode without an allow-list offers both, exactly as the engine reads it.
   */
  const scaleSpec = useMemo(() => {
    if (!scaleMode && !allowedScaleModes) return undefined;
    const allowed = allowedScaleModes ?? (["linear", "log"] as const);
    return { allowed, default: allowed[0]!, mode: scaleMode ?? allowed[0]! };
  }, [allowedScaleModes, scaleMode]);

  const { rows, series } = useMemo(() => {
    const data: ChartRow[] = xLabels.map((label, index) => {
      const row: ChartRow = { x: label };
      curves.forEach((curve) => {
        row[curve.name] = curve.values[index] ?? null;
      });
      return row;
    });
    const definitions: SeriesSpec[] = curves.map((curve) => ({
      key: curve.name,
      label: curve.name,
      type: "line",
      tone: curve.tone,
      palette: curve.palette,
      smooth: true,
      symbol: true,
      lineWidth: curve.emphasis ? 2.6 : 1.6,
      lineType: curve.lineType ?? "solid",
      opacity: curve.emphasis ? 1 : 0.85,
      format,
    }));
    return { rows: data, series: definitions };
  }, [curves, format, xLabels]);

  return (
    <Chart
      spec={{
        family: "line",
        data: rows,
        xKey: "x",
        x: {
          type: numericX ? "value" : "category",
          label: xLabel,
          format: numericX ? (xFormat ?? format) : undefined,
        },
        axes: [{ id: "primary", label: yLabel, format }],
        scale: scaleSpec,
        series,
        annotations,
        interaction: interaction ?? { zoom: "inside" },
        tooltip: { mode: "axis" },
        syncGroup,
      }}
      state={curves.length === 0 || xLabels.length === 0 ? "empty" : state}
      height={height}
      className={className}
      visibleSeries={visibleSeries}
      ariaLabel={ariaLabel ?? title ?? "Curve comparison"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}

export interface TermStructureChartProps extends Omit<CurveComparisonChartProps, "xLabels"> {
  /** Tenors: years, month counts or expiry labels. Sorted ascending internally. */
  tenors: readonly (string | number)[];
}

/**
 * Term structure (rates, futures, volatility by expiry).
 *
 * A thin specialisation of the curve chart: the tenor axis is ordered and the
 * tooltip names the tenor rather than an index.
 */
export function TermStructureChart({ tenors, ...props }: TermStructureChartProps) {
  const ordered = useMemo(() => {
    const numeric = tenors.every((tenor) => typeof tenor === "number");
    if (!numeric) return [...tenors];
    return [...(tenors as number[])].sort((a, b) => a - b);
  }, [tenors]);
  return <CurveComparisonChart {...props} xLabels={ordered} xLabel={props.xLabel ?? "Tenor"} />;
}

export interface DepthPoint {
  price: number;
  /** Cumulative size available at or better than this price. */
  size: number;
}

export interface DepthChartProps {
  bids: readonly DepthPoint[];
  asks: readonly DepthPoint[];
  mid?: number;
  priceFormat?: ChartFormat;
  sizeFormat?: ChartFormat;
  title?: string;
  description?: string;
  state?: ChartState;
  height?: number | string;
  className?: string;
  syncGroup?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

/**
 * Market-depth / order-book depth.
 *
 * Two prepared cumulative curves around a mid price. Both sides are area series
 * on a shared price axis, so the crossing point reads as the spread.
 */
export function DepthChart({
  bids,
  asks,
  mid,
  priceFormat,
  sizeFormat,
  title,
  description,
  state = "ready",
  height,
  className,
  syncGroup,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
}: DepthChartProps) {
  const rows = useMemo(() => {
    const data: ChartRow[] = [];
    bids.forEach((point) => data.push({ price: point.price, bid: point.size, ask: null }));
    asks.forEach((point) => data.push({ price: point.price, bid: null, ask: point.size }));
    data.sort((a, b) => Number(a.price) - Number(b.price));
    return data;
  }, [asks, bids]);

  const midPrice = mid ?? (bids[0] && asks[0] ? (bids[0].price + asks[0].price) / 2 : undefined);

  return (
    <Chart
      spec={{
        family: "area",
        data: rows,
        xKey: "price",
        x: { type: "value", label: "Price", format: priceFormat },
        axes: [{ id: "primary", label: "Cumulative size", format: sizeFormat }],
        series: [
          { key: "bid", label: "Bids", type: "area", tone: "positive", smooth: true, lineWidth: 1.6 },
          { key: "ask", label: "Asks", type: "area", tone: "negative", smooth: true, lineWidth: 1.6 },
        ],
        annotations: midPrice
          ? { referenceLines: [{ value: midPrice, axis: "x", label: "Mid", tone: "neutral" }] }
          : undefined,
        interaction: { zoom: "none" },
        tooltip: { mode: "axis" },
        syncGroup,
      }}
      state={rows.length === 0 ? "empty" : state}
      height={height}
      className={className}
      ariaLabel={ariaLabel ?? title ?? "Market depth"}
      ariaDescription={ariaDescription ?? description}
      onReady={onReady}
      onEvent={onEvent}
    />
  );
}
