"use client";

import { useEffect, useRef, useState } from "react";
import { useChartId, useChartTheme, useLatest } from "../../core/use-chart-theme";
import { useChartSyncBus } from "../../core/sync-context";
import { normalizeCursorX, normalizeRange, type ChartRangeState } from "../../core/sync";
import { watchPlateGesture, type PlateGesture } from "../../core/gesture";
import {
  CHART_PLOT_LAYOUT,
  DEFAULT_Y_AXIS_SIDE,
  type AxisSide,
  type YScaleMode,
} from "../../core/axis";
import type { ChartTheme } from "../../core/theme";
import {
  fromChartTime,
  loadLightweightCharts,
  toChartTime,
  type LightweightChart,
  type LightweightModule,
  type LightweightSeries,
} from "./runtime";
import { useChartArm } from "../../core/use-chart-arm";

export type LightweightSeriesKind = "candlestick" | "line" | "area" | "histogram" | "baseline" | "bar";

export interface LightweightController {
  chart: LightweightChart;
  module: LightweightModule;
  theme: ChartTheme;
  /**
   * Create or update a named series. Calling it again with the same id updates
   * in place, so a theme or data change never resets the visible range.
   */
  upsertSeries: (
    id: string,
    kind: LightweightSeriesKind,
    options: Record<string, unknown>,
    data: readonly unknown[],
    paneIndex?: number,
  ) => LightweightSeries;
  removeSeries: (id: string) => void;
  fit: () => void;
  setVisibleRange: (fromMs: number, toMs: number) => void;
}

export interface LightweightSurfaceProps {
  build: (controller: LightweightController) => void;
  syncGroup?: string | null;
  /**
   * Price at a given millisecond timestamp, used to place a *remote* crosshair.
   * Supplied by the consumer so the surface never reaches into engine data.
   */
  resolvePrice?: (ms: number) => number | null;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  /**
   * Which price scale the plate uses and how it maps values.
   *
   * `mode` is the same `linear` / `log` contract the ECharts lane uses — the
   * engine maps the *same* real values, nothing upstream is transformed. The
   * gutter is reserved at the shared `CHART_PLOT_LAYOUT.axisGutter` width so a
   * stacked research column shares one plot rectangle with the analytical lane
   * instead of each chart sizing its plate from its own longest label.
   */
  priceScale?: {
    side?: AxisSide;
    mode?: YScaleMode;
  };
  /**
   * The unit-aware plate formatters.
   *
   * Lightweight Charts' own price formats are unit-blind (`83402.01`), which is
   * how a currency chart ended up without a `$`. The consumer passes the LUC
   * formatter: `priceFormatter` renders the crosshair/last-value label at full
   * precision, `tickFormatter` renders the axis ticks compactly.
   */
  priceFormatter?: (value: number) => string;
  tickFormatter?: (values: number[]) => string[];
  /**
   * The engine's own pointer position, normalised for a caller that draws an
   * overlay (an event tooltip, a pinned readout).
   *
   * Lightweight Charts has no annotation tooltip: a series marker prints a
   * permanent `text` and nothing else. The cursor is therefore published as a
   * plain value — the timestamp under the pointer plus the pointer's own
   * position in plot pixels — so the *consumer* decides what to show without
   * reaching into engine internals. It never carries data and never triggers a
   * React render of its own.
   */
  onCrosshair?: (position: CrosshairPosition) => void;
  onReady?: (chart: LightweightChart) => void;
  /**
   * Create the engine on mount instead of waiting for proximity/an idle period.
   * See `useChartArm`: the plate is in the layout either way.
   */
  eager?: boolean;
}

/** The pointer's position on the plate, in the chart's own pixel space. */
export interface CrosshairPosition {
  /** The timestamp under the pointer, or `null` when the pointer left. */
  timeMs: number | null;
  /** Pointer x within the plate, in CSS pixels. */
  x: number | null;
  /** Pointer y within the plate, in CSS pixels. */
  y: number | null;
}

interface Binding {
  kind: LightweightSeriesKind;
  series: LightweightSeries;
  paneIndex: number;
}

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

function chartOptions(
  theme: ChartTheme,
  priceScale?: LightweightSurfaceProps["priceScale"],
  formatters?: {
    priceFormatter?: (value: number) => string;
    tickFormatter?: (values: number[]) => string[];
  },
) {
  const side: AxisSide = priceScale?.side ?? DEFAULT_Y_AXIS_SIDE;
  // Lightweight Charts uses a numeric enum, not our contract: Normal = 0,
  // Logarithmic = 1.
  const mode = priceScale?.mode === "log" ? 1 : 0;
  const plate = {
    borderColor: theme.borderSubtle,
    textColor: theme.axisLabel,
    mode,
    // A reserved gutter is what keeps two stacked charts' data areas identical
    // (and what matches the analytical lane's fixed grid).
    minimumWidth: CHART_PLOT_LAYOUT.axisGutter,
  };
  return {
    autoSize: true,
    layout: {
      background: { type: "solid" as const, color: "transparent" },
      textColor: theme.axisLabel,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontMicro,
      // Required by the library licence ("attribution notice"). Never disable.
      attributionLogo: true,
      panes: {
        separatorColor: theme.borderSubtle,
        separatorHoverColor: theme.border,
        enableResize: false,
      },
    },
    grid: {
      vertLines: { color: theme.grid },
      horzLines: { color: theme.grid },
    },
    crosshair: {
      mode: 0,
      vertLine: { color: theme.crosshair, width: 1, style: 0, labelBackgroundColor: theme.crosshairLabelBg },
      horzLine: { color: theme.crosshair, width: 1, style: 0, labelBackgroundColor: theme.crosshairLabelBg },
    },
    /*
     * `scaleMargins` is the financial lane's equivalent of the analytical
     * lane's domain headroom: the engine autoscales to the visible range and
     * then insets the drawing, so an extreme value never rides the boundary.
     */
    rightPriceScale: {
      ...plate,
      visible: side === "right",
      scaleMargins: { top: 0.12, bottom: 0.12 },
    },
    leftPriceScale: {
      ...plate,
      visible: side === "left",
    },
    timeScale: {
      borderColor: theme.borderSubtle,
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 3,
      barSpacing: 7,
      minBarSpacing: 1.5,
      /*
       * Keep the visible range inside the data domain (Phase 6.1 §J1). Without
       * these a reader can drag a research chart into empty history or empty
       * future space until the canvas is mostly blank, which reads as "the data
       * stopped" rather than "you scrolled past the end". Zoom and pan *within*
       * the loaded window are untouched; `rightOffset` still provides the small
       * breathing space a price chart wants.
       */
      fixLeftEdge: true,
      fixRightEdge: true,
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      /*
       * Axis drags are the native TradingView-style scale interaction: dragging
       * the time axis compresses/expands the visible time span, dragging the
       * price axis scales the value range. Both are **reader gestures**, so the
       * time-axis one arrives as a range change while a pointer gesture is in
       * flight and is published by the handler below (the group follows); the
       * price-axis one changes no time range at all and is therefore local to
       * this plate by construction.
       */
      axisPressedMouseMove: { time: true, price: true },
      mouseWheel: true,
      pinch: true,
      /*
       * Double-click reset: the **price** axis resets to autoscale natively (local
       * only, nothing to publish). The **time** axis is deliberately left off and
       * handled by this surface instead, because the native reset changes the
       * visible range outside a gesture window: the plate would jump to a full
       * window while the group still held the reader's old one — exactly the
       * partially-synchronized state ADR-035 forbids. The surface's own handler
       * fits the content *and publishes that as a reader gesture*, so the whole
       * group moves together.
       */
      axisDoubleClickReset: { price: true, time: false },
    },
    localization: {
      locale: "en-US",
      ...(formatters?.priceFormatter ? { priceFormatter: formatters.priceFormatter } : {}),
      ...(formatters?.tickFormatter ? { tickmarksPriceFormatter: formatters.tickFormatter } : {}),
    },
  };
}

/**
 * The one place Lightweight Charts is created, synchronised and disposed.
 *
 * `build` runs on mount and again whenever the consumer's data or theme
 * changes. It updates series in place, so a theme flip keeps the user's zoom
 * and never flashes. Pointer handling stays inside the engine and reaches the
 * sync bus as a normalised cursor — a mousemove never triggers a React render.
 */
export function LightweightSurface({
  build,
  syncGroup,
  resolvePrice,
  className,
  ariaLabel,
  ariaDescription,
  priceScale,
  priceFormatter,
  tickFormatter,
  onCrosshair,
  onReady,
  eager = false,
}: LightweightSurfaceProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<LightweightChart | null>(null);
  const controllerRef = useRef<LightweightController | null>(null);
  const bindingsRef = useRef(new Map<string, Binding>());
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const applyingRef = useRef(false);
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
  const gestureRef = useRef<PlateGesture | null>(null);
  /** Re-applies a cursor from the engine's own crosshair subscription. */
  const applyCursorRef = useRef<(value: number | null) => void>(() => {});
  const [ready, setReady] = useState(false);
  const theme = useChartTheme();
  const bus = useChartSyncBus();
  const id = useChartId("lw-chart");
  const descriptionId = `${id}-description`;
  // The plate is described by two primitives, so a caller that passes an inline
  // object literal never re-creates the chart on every render.
  const priceScaleSide: AxisSide = priceScale?.side ?? DEFAULT_Y_AXIS_SIDE;
  const priceScaleMode: YScaleMode = priceScale?.mode ?? "linear";
  // The chart is created once, so its first frame reads the plate from a ref;
  // every later change goes through the restyle effect below.
  const plateRef = useLatest({ side: priceScaleSide, mode: priceScaleMode });
  const formatterRef = useLatest({ priceFormatter, tickFormatter });

  const buildRef = useLatest(build);
  const resolvePriceRef = useLatest(resolvePrice);
  const syncGroupRef = useLatest(syncGroup);
  const themeRef = useLatest(theme);
  const onReadyRef = useLatest(onReady);
  const onCrosshairRef = useLatest(onCrosshair);
  // The plate is already in the layout; the engine waits for a good moment.
  const armed = useChartArm(hostRef, !eager);

  // ---------------------------------------------------------------- lifecycle
  useEffect(() => {
    if (!armed) return;
    let disposed = false;
    const host = hostRef.current;
    const bindings = bindingsRef.current;
    if (!host) return;
    gestureRef.current?.dispose();
    gestureRef.current = watchPlateGesture(host);

    loadLightweightCharts()
      .then((module) => {
        if (disposed || !hostRef.current) return;
        const chart = module.createChart(
          hostRef.current,
          chartOptions(
            themeRef.current,
            { side: plateRef.current.side, mode: plateRef.current.mode },
            formatterRef.current,
          ) as never,
        );
        chartRef.current = chart;
        const definitions: Record<LightweightSeriesKind, unknown> = {
          candlestick: module.CandlestickSeries,
          line: module.LineSeries,
          area: module.AreaSeries,
          histogram: module.HistogramSeries,
          baseline: module.BaselineSeries,
          bar: module.BarSeries,
        };

        const controller: LightweightController = {
          chart,
          module,
          theme: themeRef.current,
          upsertSeries(seriesId, kind, options, data, paneIndex = 0) {
            let binding = bindings.get(seriesId);
            if (binding && (binding.kind !== kind || binding.paneIndex !== paneIndex)) {
              chart.removeSeries(binding.series);
              bindings.delete(seriesId);
              binding = undefined;
            }
            if (!binding) {
              const series = chart.addSeries(definitions[kind] as never, options as never, paneIndex);
              binding = { kind, series, paneIndex };
              bindings.set(seriesId, binding);
            } else {
              binding.series.applyOptions(options as never);
            }
            binding.series.setData(data as never);
            return binding.series;
          },
          removeSeries(seriesId) {
            const binding = bindings.get(seriesId);
            if (!binding) return;
            chart.removeSeries(binding.series);
            bindings.delete(seriesId);
          },
          fit() {
            chart.timeScale().fitContent();
          },
          setVisibleRange(fromMs, toMs) {
            chart.timeScale().setVisibleRange({ from: toChartTime(fromMs), to: toChartTime(toMs) });
          },
        };
        controllerRef.current = controller;

        buildRef.current(controller);
        chart.timeScale().fitContent();
        /*
         * A surface mounting into a group that is already on a window shows that
         * window, not its own fitted extent.
         *
         * The subscription below also delivers the group's state, but it may have
         * run before this engine existed (the engine is created only once the
         * surface is near the viewport), so the state is consumed here as well.
         * Both paths apply the same value, which is what makes a late mount join
         * the group instead of quietly starting its own window.
         */
        const groupAtCreate = syncGroupRef.current;
        if (groupAtCreate && bus.hasRange(groupAtCreate)) {
          try {
            const stored = normalizeRange(bus.getRange(groupAtCreate));
            if (!stored) chart.timeScale().fitContent();
            else chart.timeScale().setVisibleRange({ from: toChartTime(stored.from), to: toChartTime(stored.to) });
          } catch {
            /* the engine may be mid-layout; the fitted frame still applies */
          }
        }
        setReady(true);
        onReadyRef.current?.(chart);

        chart.subscribeCrosshairMove((param) => {
          /*
           * The overlay callback fires on every pointer move, before the sync
           * bus's own early exits: an event tooltip is local to this plate and
           * has nothing to do with whether the chart belongs to a sync group.
           */
          onCrosshairRef.current?.({
            timeMs:
              param.time === undefined ? null : normalizeCursorX(fromChartTime(param.time)),
            x: param.point?.x ?? null,
            y: param.point?.y ?? null,
          });
          const group = syncGroupRef.current;
          if (applyingRef.current || !group) return;
          const pinned = bus.getPinned(group);
          if (pinned != null) {
            // A pin outranks the pointer: keep the inspection where it was set.
            applyCursorRef.current(pinned);
            return;
          }
          if (param.time === undefined) {
            bus.publishCursor(group, null, id);
            return;
          }
          bus.publishCursor(group, normalizeCursorX(fromChartTime(param.time)), id);
        });

        const scale = chart.timeScale();
        const onLogicalRange = () => {
          const group = syncGroupRef.current;
          if (!group) return;
          // Only a reader's own gesture may move the group (see `gestureRef`).
          if (!gestureRef.current?.active()) return;
          const range = scale.getVisibleRange();
          if (!range) return;
          const from = fromChartTime(range.from);
          const to = fromChartTime(range.to);
          if (from === null || to === null || to <= from) return;
          bus.publishRange(group, { from, to }, id, { intent: "gesture" });
        };
        scale.subscribeVisibleLogicalRangeChange(onLogicalRange);

        /*
         * Reset the time scale by double-clicking it.
         *
         * TradingView's own convention, and the reader asked for it explicitly.
         * The native `axisDoubleClickReset.time` is off on purpose (see
         * `chartOptions`): it would change the visible range outside a gesture
         * window, leaving the plate on a full history while the group still held
         * the reader's old window — a half-synchronized state. So the reset is
         * performed here and **published as a reader gesture**, which is the
         * same channel a wheel zoom uses: the group adopts the full window
         * (`max`), and every peer with shorter history clamps locally.
         *
         * The price axis keeps its native reset, which is local by construction:
         * it changes no time range and publishes nothing.
         */
        const onAxisDoubleClick = (event: MouseEvent) => {
          const host = hostRef.current;
          if (!host) return;
          const bounds = host.getBoundingClientRect();
          const withinTimeBand = event.clientY - bounds.top >= bounds.height - TIME_AXIS_BAND_PX;
          if (!withinTimeBand) return;
          // The bottom-right corner is the price scale, not the time axis.
          const priceSide = plateRef.current.side;
          let priceGutter = 0;
          try {
            priceGutter = chart.priceScale(priceSide).width();
          } catch {
            priceGutter = 0;
          }
          const inPriceGutter =
            priceSide === "left"
              ? event.clientX < bounds.left + priceGutter
              : event.clientX > bounds.right - priceGutter;
          if (inPriceGutter) return;
          event.preventDefault();
          try {
            scale.fitContent();
            const range = scale.getVisibleRange();
            const group = syncGroupRef.current;
            if (!range || !group) return;
            const from = fromChartTime(range.from);
            const to = fromChartTime(range.to);
            if (from === null || to === null || to <= from) return;
            bus.publishRange(group, { from, to }, id, { intent: "gesture" });
          } catch {
            /* the engine may be mid-dispose; the previous window stands */
          }
        };
        host.addEventListener("dblclick", onAxisDoubleClick);
        unsubscribeRef.current = () => {
          scale.unsubscribeVisibleLogicalRangeChange(onLogicalRange);
          host.removeEventListener("dblclick", onAxisDoubleClick);
        };
      })
      .catch((error: unknown) => {
        console.error("[luc-ui] Lightweight Charts failed to load", error);
      });

    return () => {
      disposed = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      gestureRef.current?.dispose();
      gestureRef.current = null;
      const chart = chartRef.current;
      const controller = controllerRef.current;
      chartRef.current = null;
      controllerRef.current = null;
      bindings.clear();
      if (chart && controller) {
        try {
          chart.remove();
        } catch {
          /* already removed */
        }
      }
    };
    // Created once per mount; data and theme changes re-run `build` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed]);

  // ------------------------------------------- restyle/rebuild on theme+data
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || !ready) return;
    controller.theme = theme;
    controller.chart.applyOptions(
      chartOptions(theme, { side: priceScaleSide, mode: priceScaleMode }, { priceFormatter, tickFormatter }) as never,
    );
    build(controller);
  }, [build, ready, theme, priceScaleSide, priceScaleMode, priceFormatter, tickFormatter]);

  // --------------------------------------------------------------------- sync
  useEffect(() => {
    if (!syncGroup) return;

    const applyCursor = (value: number | null) => {
      const chart = chartRef.current;
      if (!chart) return;
      applyingRef.current = true;
      try {
        if (value === null) {
          chart.clearCrosshairPosition();
        } else {
          const prime =
            bindingsRef.current.get("price") ?? [...bindingsRef.current.values()][0];
          const price = resolvePriceRef.current?.(value) ?? null;
          if (prime && price !== null) {
            chart.setCrosshairPosition(price, toChartTime(value), prime.series);
          }
        }
      } catch {
        /* engine may still be initialising */
      }
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
    const applyRange = (range: ChartRangeState | null) => {
      const chart = chartRef.current;
      if (!chart) return;
      try {
        if (!range) {
          chart.timeScale().fitContent();
        } else {
          chart.timeScale().setVisibleRange({
            from: toChartTime(range.from),
            to: toChartTime(range.to),
          });
        }
      } catch {
        /* ignore a race with dispose */
      }
    };

    applyCursorRef.current = applyCursor;

    return bus.subscribe(syncGroup, {
      id,
      onCursor: (value) => applyCursor(normalizeCursorX(value)),
      onRange: (range) => applyRange(normalizeRange(range)),
    });
  }, [bus, id, syncGroup, resolvePriceRef]);

  return (
    <>
      <div
        ref={hostRef}
        data-slot="lightweight-surface"
        className={className ? `luc-chart-surface ${className}` : "luc-chart-surface"}
        /*
         * `figure`, not `img`: the library's canvas is focusable and the
         * attribution notice is a link, so the box legitimately contains
         * interactive content and `img` would be a nested-interactive defect.
         */
        role="figure"
        aria-roledescription="chart"
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? descriptionId : undefined}
      />
      {ariaDescription ? (
        <span id={descriptionId} className="sr-only">
          {ariaDescription}
        </span>
      ) : null}
    </>
  );
}
