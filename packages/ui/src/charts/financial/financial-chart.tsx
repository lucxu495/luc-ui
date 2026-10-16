"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import {
  ChartEmptyState,
  ChartErrorState,
  ChartSkeleton,
} from "../chart-card";
import { useChartTheme, useLatest } from "../core/use-chart-theme";
import { formatChartValue, numericAxisFormatter } from "../core/formatters";
import { toneColor } from "../core/theme";
import { DEFAULT_Y_AXIS_SIDE, type AxisSide, type YScaleMode } from "../core/axis";
import type { ChartFormat, SeriesTone } from "../types";
import {
  LightweightSurface,
  type LightweightController,
  type LightweightSeriesKind,
} from "../adapters/lightweight/lightweight-surface";
import { toChartTime, type LightweightSeries } from "../adapters/lightweight/runtime";
import { tooltipGridHtml, tooltipRowHtml, tooltipShellHtml } from "../core/tooltip-html";

export interface Candle {
  /** Epoch milliseconds, a `Date`, or an ISO date string. */
  time: number | string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumePoint {
  time: number | string | Date;
  value: number;
  direction?: "up" | "down" | "neutral";
}

export interface OverlayPoint {
  time: number | string | Date;
  value: number | null;
}

export interface FinancialOverlay {
  id: string;
  label: string;
  data: readonly OverlayPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
  lineType?: "solid" | "dashed" | "dotted";
  /** Draw the same scale as price (default) or its own overlay scale. */
  paneIndex?: number;
}

export interface IndicatorSeries {
  id: string;
  label?: string;
  kind: Extract<LightweightSeriesKind, "line" | "area" | "histogram" | "bar">;
  data: readonly OverlayPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
}

export interface IndicatorPane {
  id: string;
  label: string;
  series: readonly IndicatorSeries[];
  /** Horizontal guides, e.g. 30/70 for an oscillator. */
  referenceLines?: readonly number[];
  /** Share of the chart height. Price pane defaults to 3. */
  stretch?: number;
}

export interface FinancialChartProps {
  candles: readonly Candle[];
  volume?: readonly VolumePoint[];
  overlays?: readonly FinancialOverlay[];
  indicators?: readonly IndicatorPane[];
  mode?: "candlestick" | "line" | "area";
  /** Trailing window. `null` fits all data; changing it never refetches. */
  range?: { from: number; to: number } | null;
  priceFormat?: ChartFormat;
  volumeFormat?: ChartFormat;
  visibleOverlays?: readonly string[];
  showVolume?: boolean;
  syncGroup?: string | null;
  /**
   * Which plate the price uses and how it maps values. `linear` / `log` is the
   * same presentation contract as the analytical lane: the same real candles are
   * mapped either way, and nothing is transformed upstream.
   */
  priceScale?: {
    side?: AxisSide;
    mode?: YScaleMode;
  };
  state?: "ready" | "loading" | "empty" | "error";
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: unknown) => void;
}

const LINE_STYLE: Record<"solid" | "dashed" | "dotted", number> = {
  solid: 0,
  dashed: 2,
  dotted: 1,
};

function toMs(value: number | string | Date): number | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function autoPrecision(values: readonly number[]): { precision: number; minMove: number } {
  const finite = values.filter((value) => Number.isFinite(value) && value !== 0);
  const reference = finite.length ? Math.abs(finite[finite.length - 1]!) : 1;
  if (reference >= 1000) return { precision: 2, minMove: 0.01 };
  if (reference >= 10) return { precision: 3, minMove: 0.001 };
  if (reference >= 1) return { precision: 4, minMove: 0.0001 };
  return { precision: 6, minMove: 0.000001 };
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
export function FinancialChart({
  candles,
  volume,
  overlays,
  indicators,
  mode = "candlestick",
  range,
  priceFormat,
  volumeFormat,
  visibleOverlays,
  showVolume = true,
  syncGroup,
  priceScale,
  state = "ready",
  height,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
}: FinancialChartProps) {
  const theme = useChartTheme();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef(new Map<string, LightweightSeries>());
  const [tip, setTip] = useState<{ left: number; top: number; html: string } | null>(null);

  const prepared = useMemo(() => {
    const rows = candles
      .map((candle) => ({ ...candle, ms: toMs(candle.time) }))
      .filter((candle): candle is Candle & { ms: number } => candle.ms !== null)
      .sort((a, b) => a.ms - b.ms);
    const priceData = rows.map((candle) => ({
      time: toChartTime(candle.ms),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      value: candle.close,
    }));
    const closes = rows.map((candle) => candle.close);
    const volumeRows = (volume ?? [])
      .map((point) => ({ ...point, ms: toMs(point.time) }))
      .filter((point): point is VolumePoint & { ms: number } => point.ms !== null)
      .sort((a, b) => a.ms - b.ms);
    return { rows, priceData, closes, volumeRows };
  }, [candles, volume]);

  const priceAt = useMemo(() => {
    const map = new Map<number, number>();
    prepared.rows.forEach((row) => map.set(Math.floor(row.ms / 1000), row.close));
    return (ms: number) => map.get(Math.floor(ms / 1000)) ?? null;
  }, [prepared.rows]);

  const precision = useMemo(
    () =>
      priceFormat?.decimals !== undefined
        ? { precision: priceFormat.decimals, minMove: Number(`1e-${priceFormat.decimals}`) }
        : autoPrecision(prepared.closes),
    [prepared.closes, priceFormat],
  );

  const formatPrice = useCallback(
    (value: number | null | undefined) => formatChartValue(value, priceFormat),
    [priceFormat],
  );
  const formatVolume = useCallback(
    (value: number | null | undefined) =>
      formatChartValue(value, volumeFormat ?? { kind: "compact", decimals: 1 }),
    [volumeFormat],
  );
  const scaleSide: AxisSide = priceScale?.side ?? DEFAULT_Y_AXIS_SIDE;
  const scaleMode: YScaleMode = priceScale?.mode ?? "linear";
  /*
   * One plate formatter pair for the whole chart. The axis ticks are abbreviated
   * (`$124.7K`) so the reserved gutter holds them; the crosshair and the last
   * value keep full precision. Both come from the same unit, so an axis and its
   * tooltip can never disagree about what the numbers are.
   */
  /**
   * The plate labels are abbreviated (`$124.7K`) and the DOM tooltip keeps full
   * precision (`$124,658`). That is not only a readability choice: a compact
   * plate fits the reserved `axisGutter` the analytical lane also uses, which is
   * what lets a stacked research column share one plot rectangle.
   */
  const platePriceFormatter = useCallback(
    (value: number) => numericAxisFormatter(priceFormat)(value),
    [priceFormat],
  );
  const plateTickFormatter = useCallback(
    (values: number[]) => values.map((value) => numericAxisFormatter(priceFormat)(value)),
    [priceFormat],
  );

  const visible = useMemo(
    () => (visibleOverlays ? overlays?.filter((overlay) => visibleOverlays.includes(overlay.id)) : overlays),
    [overlays, visibleOverlays],
  );

  const build = useCallback(
    (controller: LightweightController) => {
      const { chart } = controller;
      const shades = {
        up: theme.positive,
        down: theme.negative,
        neutral: theme.neutral,
      };
      const seriesMap = seriesRef.current;
      const keep = new Set<string>();

      const priceOptions = {
        priceScaleId: scaleSide,
        priceFormat: { type: "price" as const, ...precision },
        priceLineVisible: true,
        priceLineStyle: 2,
        priceLineColor: theme.reference,
        lastValueVisible: true,
      };
      keep.add("price");
      seriesMap.set(
        "price",
        controller.upsertSeries(
          "price",
          mode === "candlestick" ? "candlestick" : mode === "area" ? "area" : "line",
          {
            ...priceOptions,
            ...(mode === "candlestick"
              ? {
                  upColor: shades.up,
                  downColor: shades.down,
                  borderUpColor: shades.up,
                  borderDownColor: shades.down,
                  wickUpColor: shades.up,
                  wickDownColor: shades.down,
                  borderVisible: false,
                }
              : {
                  color: theme.palette[0] ?? theme.accent,
                  lineWidth: 2,
                  ...(mode === "area"
                    ? {
                        topColor: theme.selection,
                        bottomColor: "rgba(0,0,0,0)",
                        lineColor: theme.palette[0] ?? theme.accent,
                      }
                    : {}),
                }),
          },
          prepared.priceData,
          0,
        ),
      );

      for (const overlay of visible ?? []) {
        keep.add(overlay.id);
        seriesMap.set(
          overlay.id,
          controller.upsertSeries(
            overlay.id,
            "line",
            {
              color: overlay.color ?? toneColor(theme, overlay.tone, 1),
              lineWidth: (overlay.lineWidth ?? 1.6) as never,
              lineStyle: LINE_STYLE[overlay.lineType ?? "solid"],
              priceLineVisible: false,
              lastValueVisible: false,
              crosshairMarkerVisible: false,
            },
            overlay.data
              .map((point) => ({ ms: toMs(point.time), value: point.value }))
              .filter((point): point is { ms: number; value: number | null } => point.ms !== null)
              .map((point) => ({ time: toChartTime(point.ms), value: point.value })),
            overlay.paneIndex ?? 0,
          ),
        );
      }

      if (showVolume && prepared.volumeRows.length > 0) {
        keep.add("volume");
        const volumeSeries = controller.upsertSeries(
          "volume",
          "histogram",
          {
            priceScaleId: scaleSide,
            priceFormat: { type: "volume" },
            priceLineVisible: false,
            lastValueVisible: false,
            base: 0,
          },
          prepared.volumeRows.map((point) => ({
            time: toChartTime(point.ms),
            value: point.value,
            color:
              point.direction === "up"
                ? theme.positive
                : point.direction === "down"
                  ? theme.negative
                  : theme.neutral,
          })),
          1,
        );
        seriesMap.set("volume", volumeSeries);
      }

      indicators?.forEach((pane, paneOffset) => {
        const paneIndex = 2 + paneOffset;
        pane.series.forEach((series) => {
          const key = `${pane.id}:${series.id}`;
          keep.add(key);
          const paneSeries = controller.upsertSeries(
            key,
            series.kind,
            {
              color: series.color ?? toneColor(theme, series.tone, paneOffset + 2),
              lineWidth: (series.lineWidth ?? 1.6) as never,
              priceLineVisible: false,
              lastValueVisible: true,
              ...(series.kind === "histogram" ? { base: 0 } : {}),
            },
            series.data
              .map((point) => ({ ms: toMs(point.time), value: point.value }))
              .filter((point): point is { ms: number; value: number | null } => point.ms !== null)
              .map((point) => ({ time: toChartTime(point.ms), value: point.value })),
            paneIndex,
          );
          seriesMap.set(key, paneSeries);
          pane.referenceLines?.forEach((level, levelIndex) => {
            paneSeries.createPriceLine({
              price: level,
              color: theme.reference,
              lineWidth: 1,
              lineStyle: LINE_STYLE.dotted,
              axisLabelVisible: levelIndex === 0,
              title: "",
            });
          });
        });
      });

      for (const key of [...seriesMap.keys()]) {
        if (!keep.has(key)) {
          controller.removeSeries(key);
          seriesMap.delete(key);
        }
      }

      // Pane proportions: price dominates, everything else is a strip.
      const panes = chart.panes();
      panes.forEach((pane, index) => {
        if (index === 0) pane.setStretchFactor(3);
        else {
          const indicatorPane = indicators?.[index - 2];
          pane.setStretchFactor(indicatorPane?.stretch ?? 1);
        }
      });

      if (range) controller.setVisibleRange(range.from, range.to);
      else controller.fit();
    },
    [
      indicators,
      mode,
      precision,
      prepared.priceData,
      prepared.volumeRows,
      range,
      scaleSide,
      showVolume,
      theme,
      visible,
    ],
  );

  const onReadyPropRef = useLatest(onReady);

  const handleReady = useCallback(
    (chart: unknown) => {
      const api = chart as {
        subscribeCrosshairMove: (
          handler: (param: {
            time?: unknown;
            point?: { x: number; y: number };
            seriesData: Map<LightweightSeries, unknown>;
          }) => void,
        ) => void;
      };
      api.subscribeCrosshairMove((param) => {
        const host = hostRef.current;
        if (!host) return;
        if (param.time === undefined || !param.point) {
          setTip(null);
          return;
        }
        const ms = typeof param.time === "number" ? param.time * 1000 : null;
        if (ms === null) {
          setTip(null);
          return;
        }
        const candle =
          mode === "candlestick"
            ? (param.seriesData.get(seriesRef.current.get("price")!) as
                | { open: number; high: number; low: number; close: number }
                | undefined)
            : undefined;
        const pricePoint = param.seriesData.get(seriesRef.current.get("price")!) as
          | { value?: number }
          | { close?: number }
          | undefined;
        const close = candle?.close ?? (pricePoint as { value?: number } | undefined)?.value ?? null;
        const open = candle?.open ?? close;
        const change = close !== null && open !== null ? close - open : null;
        const changePct = change !== null && open ? (change / open) * 100 : null;

        const volumePoint = param.seriesData.get(seriesRef.current.get("volume")!) as
          | { value?: number }
          | undefined;

        const overlayRows = (visible ?? [])
          .map((overlay) => {
            const series = seriesRef.current.get(overlay.id);
            if (!series) return null;
            const value = (param.seriesData.get(series) as { value?: number } | undefined)?.value;
            return value === undefined
              ? null
              : tooltipRowHtml(overlay.label, formatPrice(value), overlay.color ?? toneColor(theme, overlay.tone, 1));
          })
          .filter((row): row is string => row !== null);

        const ohlcRows: Array<[string, string]> = candle
          ? [
              ["Open", formatPrice(candle.open)],
              ["High", formatPrice(candle.high)],
              ["Low", formatPrice(candle.low)],
              ["Close", formatPrice(candle.close)],
            ]
          : [["Close", formatPrice(close)]];

        const changeRow =
          change !== null && changePct !== null
            ? `<div class="luc-chart-tooltip__rows">${tooltipRowHtml(
                "Change",
                `${formatPrice(change)}  (${formatChartValue(changePct, { kind: "percent", signed: true })})`,
              )}</div>`
            : "";
        const volumeRow =
          volumePoint?.value === undefined
            ? ""
            : `<div class="luc-chart-tooltip__rows">${tooltipRowHtml("Volume", formatVolume(volumePoint.value))}</div>`;
        const overlayBlock = overlayRows.length
          ? `<div class="luc-chart-tooltip__rule"></div><div class="luc-chart-tooltip__rows">${overlayRows.join("")}</div>`
          : "";

        const body =
          tooltipGridHtml(ohlcRows) +
          changeRow +
          volumeRow +
          overlayBlock;

        const width = host.clientWidth;
        const left = Math.min(Math.max(param.point.x + 16, 8), Math.max(8, width - 216));
        const top = Math.max(param.point.y - 12, 8);
        setTip({ left, top, html: tooltipShellHtml(formatChartValue(ms, { kind: "date" }), body) });
      });
      onReadyPropRef.current?.(chart);
    },
    [formatPrice, formatVolume, mode, onReadyPropRef, theme, visible],
  );

  useEffect(() => {
    return () => setTip(null);
  }, []);

  const box = (node: React.ReactNode, compact = false) => (
    <div
      className={cn("relative w-full min-h-0", className)}
      style={compact ? undefined : { height: height ?? "100%" }}
    >
      {node}
    </div>
  );

  if (state === "loading") return box(<ChartSkeleton height="100%" />);
  if (state === "error") {
    return box(
      <ChartErrorState
        compact
        title="Price data unavailable"
        description="The provider returned no rows."
      />,
      true,
    );
  }
  if (state === "empty" || prepared.rows.length === 0) {
    return box(
      <ChartEmptyState
        compact
        title="No price history"
        description="Nothing to plot for this window."
      />,
      true,
    );
  }

  return box(
    <div ref={hostRef} className="relative h-full w-full">
      <LightweightSurface
        build={build}
        syncGroup={syncGroup}
        resolvePrice={priceAt}
        priceScale={{ side: scaleSide, mode: scaleMode }}
        priceFormatter={platePriceFormatter}
        tickFormatter={plateTickFormatter}
        ariaLabel={ariaLabel ?? "Price chart"}
        ariaDescription={ariaDescription}
        onReady={handleReady}
      />
      {tip ? (
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: tip.left, top: tip.top }}
          dangerouslySetInnerHTML={{ __html: tip.html }}
        />
      ) : null}
    </div>,
  );
}
