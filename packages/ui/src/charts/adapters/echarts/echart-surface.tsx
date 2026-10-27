"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useChartId, useLatest } from "../../core/use-chart-theme";
import { useChartSyncBus } from "../../core/sync-context";
import { nearestIndex } from "../../core/data";
import { normalizeCursorX, normalizeRange, type ChartRangeState } from "../../core/sync";
import { watchPlateGesture, type PlateGesture } from "../../core/gesture";
import {
  axisTargetAt,
  plotRect,
  scaleValueRange,
  scaleWindow,
  windowFractions,
  type AxisPlate,
  type AxisTarget,
  type GridBand,
} from "../../core/axis-drag";
import { ensureSvgRenderer, loadECharts, type EChartsInstance } from "./runtime";
import { ECHARTS_GLOBAL_OPTION, ECHARTS_INIT_OPTIONS } from "./echart-init";
import { useChartArm } from "../../core/use-chart-arm";
import { collectChartDiagnostics, serializeDiagnostics } from "../../core/diagnostics";
import type { ChartRenderer } from "../../types";

export interface EChartEvent {
  type: string;
  dataIndex?: number;
  value?: unknown;
  raw?: unknown;
}

export interface EChartSurfaceProps {
  option: Record<string, unknown>;
  /** Time values in ms, used to translate a shared cursor into a data index. */
  xValues?: readonly number[];
  syncGroup?: string | null;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  /** Advanced: receive the live instance (export, custom actions). */
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  /**
   * The span the engine currently shows, in ms (`null` while unknown).
   *
   * Reported on init, on a programmatic range apply and on a reader's own
   * pan/zoom — a time axis has to label the window on screen, not the loaded
   * history. The caller decides how coarse a change is worth re-rendering for.
   */
  onVisibleSpan?: (spanMs: number | null) => void;
  /**
   * Create the engine on mount instead of waiting for proximity/an idle period.
   *
   * The default is deferred (see `useChartArm`): the surface still renders its
   * box immediately, so layout never shifts, and the engine follows a moment
   * later unless the surface is already near the viewport.
   */
  eager?: boolean;
  /** Drawing layer. Defaults to `canvas`; only ECharts honours `svg`. */
  renderer?: ChartRenderer;
  /** Enable pointer/mouse trading-terminal axis drag scaling. */
  axisDrag?: boolean;
}

interface RuntimeAxisOption {
  type?: string;
  position?: string;
  gridIndex?: number;
  hidden?: boolean;
  scaleMode?: string;
  data?: unknown[];
  axisPointer?: {
    label?: {
      show?: boolean;
      formatter?: unknown;
    };
  };
}

function axesFromOption(option: Record<string, unknown>, key: "xAxis" | "yAxis"): RuntimeAxisOption[] {
  const value = option[key];
  if (Array.isArray(value)) return value as RuntimeAxisOption[];
  return value && typeof value === "object" ? [value as RuntimeAxisOption] : [];
}

function formatPointerAxisValue(
  axis: RuntimeAxisOption,
  value: unknown,
  gridIndex: number,
): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const formatter = axis.axisPointer?.label?.formatter;
  try {
    if (typeof formatter === "function") {
      const formatted = (formatter as (input: number, index: number) => unknown)(value, gridIndex);
      if (formatted === null || formatted === undefined) return null;
      const text = String(formatted);
      return text || null;
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
export function EChartSurface({
  option,
  xValues,
  syncGroup,
  className,
  ariaLabel,
  ariaDescription,
  onReady,
  onEvent,
  eager = false,
  onVisibleSpan,
  renderer = "canvas",
  axisDrag = true,
}: EChartSurfaceProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsInstance | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const applyingRef = useRef(false);
  /**
   * The group's window, applied by this surface.
   *
   * Held in a ref because the engine is created *after* the subscription exists
   * (see `useChartArm`), so the state a late member must adopt has to be
   * applied once the engine is up as well as when the state changes.
   */
  const applyRangeRef = useRef<(range: ChartRangeState | null) => void>(() => {});
  /**
   * The reader's own input on this plate (see `core/gesture.ts`).
   *
   * `dataZoom` fires for a wheel, a drag, a slider — and for every programmatic
   * `dispatchAction`, for an option re-apply, and for a `resize`. Only the first
   * group is a reader choosing a window, so only a live gesture may publish.
   */
  const gestureRef = useRef<PlateGesture | null>(null);
  /**
   * The Y range this plate is on because the *reader* dragged the value axis.
   *
   * Local inspection state, deliberately not part of any sync group: two metrics
   * with different units must never share a value scale, and a value-axis drag
   * changes no time range, so it publishes nothing. `null` means autoscale, which
   * is also what a double-click on the axis restores.
   */
  const localYRangeRef = useRef<Record<number, { min: number; max: number }>>({});
  /** Detaches the axis-interaction listeners created with the engine. */
  const axisCleanupRef = useRef<(() => void) | null>(null);
  /**
   * The last option object handed to the engine. Used to skip the redundant
   * re-apply that otherwise lands immediately after init and restarts the
   * intro animation (see the option effect below).
   */
  const appliedOptionRef = useRef<Record<string, unknown> | null>(null);
  /**
   * Re-applies a cursor. Kept in a ref so the engine's own pointer events (set up
   * once, below) can re-assert a pinned crosshair without rebuilding the chart.
   */
  const applyCursorRef = useRef<(value: number | null) => void>(() => {});
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
      const applied = chart.getOption() as { dataZoom?: Array<{ start?: number; end?: number }> };
      const zoom = applied.dataZoom?.[0];
      if (zoom) {
        start = typeof zoom.start === "number" ? zoom.start : 0;
        end = typeof zoom.end === "number" ? zoom.end : 100;
      }
    } catch {
      /* the engine may still be initialising */
    }
    const host = hostRef.current;
    if (host) {
      host.dataset.dataZoomStart = String(start);
      host.dataset.dataZoomEnd = String(end);
    }
    const x = xValuesRef.current;
    if (!x || x.length < 2) return;
    const lo = x[0]!;
    const hi = x[x.length - 1]!;
    const full = hi - lo;
    if (!(full > 0)) return;
    const span = (full * (end - start)) / 100;
    if (host) host.dataset.visibleSpan = String(span > 0 ? span : full);
    onVisibleSpanRef.current?.(span > 0 ? span : full);
  }, [onVisibleSpanRef, xValuesRef]);
  /*
   * The engine waits for a good moment to exist.
   *
   * The host box is already in the layout, so deferring this costs nothing
   * visually and keeps twenty sibling charts from initialising in the same
   * commit the reader is waiting on.
   */
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
    } catch {
      /* Diagnostics are a convenience, never a reason for a chart to fail. */
    }
  }, []);

  // ---------------------------------------------------------------- lifecycle
  useEffect(() => {
    if (!armed) return;
    let disposed = false;
    let observer: ResizeObserver | null = null;
    const host = hostRef.current;
    if (!host) return;
    gestureRef.current?.dispose();
    gestureRef.current = watchPlateGesture(host);

    /*
     * The SVG painter is a second drawing layer and is only downloaded when a
     * surface actually asks for it, so the vector path costs interactive
     * consumers nothing.
     */
    const ready = renderer === "svg" ? ensureSvgRenderer().then(loadECharts) : loadECharts();

    ready
      .then((core) => {
        if (disposed || !hostRef.current) return;
        /*
         * The engine's init options live in one place (`echart-init.ts`).
         *
         * `useDirtyRect: false` — zrender's dirty-rectangle mode repaints only
         * the regions an element reported as changed. A series whose intro
         * animation starts from a degenerate shape (the box plot collapses every
         * box onto its median) can then be left unpainted: the canvas keeps the
         * collapsed frame and the box only appears when a pointer event repaints
         * its region — the exact V0.6 bug report. It reproduced on a theme flip
         * too, so it is not limited to first paint. Correctness first: a full
         * repaint per frame is what the rest of the charting world does anyway.
         *
         * `ECHARTS_GLOBAL_OPTION` (the `useUTC` half) is applied where the
         * option is, below — it is an option, not an init flag.
         */
        const chart = core.init(hostRef.current, undefined, { renderer, ...ECHARTS_INIT_OPTIONS });
        chartRef.current = chart;
        /*
         * `finished` fires once a frame is actually painted, which is the only
         * moment at which the display list and the screen agree — including after
         * the intro animation settles. Publishing there (rather than after
         * `setOption` returns) is what makes the digest describe what a visitor
         * sees.
         */
        chart.on("finished", publishDiagnostics);
        /*
         * The engine's own global options go on first, so a family that builds
         * its option by hand (the specialised charts do not use `baseOption`)
         * still gets them, and a family that sets them itself wins.
         */
        chart.setOption({ ...ECHARTS_GLOBAL_OPTION, ...latestOption.current }, { notMerge: true });
        const initialDataZoom = (chart.getOption() as { dataZoom?: unknown[] }).dataZoom;
        host.dataset.zoomModel = String(initialDataZoom?.length ?? 0);
        if (axisDragRef.current && !initialDataZoom?.length) {
          /*
           * Specialised Cartesian families build their options by hand and may
           * not have a DataZoom component. Add only a range model: wheel and
           * plot drag stay exactly as that family declared them.
           */
          const applied = chart.getOption() as { grid?: unknown[] };
          if (applied.grid?.length) {
            chart.setOption({
              dataZoom: [{
                type: "inside",
                xAxisIndex: [0],
                zoomOnMouseWheel: false,
                moveOnMouseMove: false,
              }],
            });
          }
        }
        appliedOptionRef.current = latestOption.current;
        setReady(true);
        /*
         * Adopt the group's window as soon as the engine exists.
         *
         * A member that mounts into a group already on a window (a chart below
         * the fold scrolling into range, a remount, a tab) must join that window
         * rather than start on its own full extent. The subscription delivers the
         * same value when it is registered after the engine; a `null` window is
         * `max`, i.e. this member's whole extent.
         */
        const groupAtCreate = syncGroupRef.current;
        if (groupAtCreate && bus.hasRange(groupAtCreate)) {
          applyRangeRef.current(normalizeRange(bus.getRange(groupAtCreate)));
        }

        /*
         * ---------------------------------------------------------------
         * Direct axis manipulation (the reader grabs an axis, not the plot)
         * ---------------------------------------------------------------
         *
         * ECharts' inside `dataZoom` handles wheel zoom and drag-*pan* inside the
         * plot, but it has no equivalent of TradingView's axis drag. So the two
         * axis bands are read from the engine's own grid rectangle, and:
         *
         *  - a horizontal drag on the **time axis** scales the visible window
         *    around the grabbed value and dispatches `dataZoom`. That runs while
         *    the pointer is down, i.e. inside a real gesture, so the *existing*
         *    gesture-gated `dataZoom` handler publishes it to the group. No new
         *    range state, no second channel — ADR-035 intact.
         *  - a vertical drag on the **value axis** scales only this plate's value
         *    range (`yAxis.min/max`). It touches no `dataZoom`, so it publishes
         *    nothing and no peer is affected: value scales are local by units.
         *  - a double-click on the value axis restores autoscale; a double-click
         *    on the time axis resets the window to the whole loaded domain *and
         *    publishes that as a reader gesture*, so the group follows instead of
         *    drifting into a half-synchronized state.
         */
        const labelLayer = document.createElement("div");
        labelLayer.className = "luc-chart-axis-labels";
        labelLayer.setAttribute("aria-hidden", "true");
        host.appendChild(labelLayer);
        const yLabels = new Map<number, HTMLDivElement>();

        const boundsNow = () => {
          const bounds = host.getBoundingClientRect();
          const size = {
            width: bounds.width || sizeRef.current.width,
            height: bounds.height || sizeRef.current.height,
          };
          return { bounds, size };
        };
        const gridBands = (size: { width: number; height: number }): GridBand[] => {
          const applied = chart.getOption() as { grid?: Array<Record<string, unknown>> };
          const descriptors = applied.grid?.length ? applied.grid : [];
          const model = (
            chart as unknown as {
              getModel?: () => {
                getComponent?: (type: string, index: number) => {
                  coordinateSystem?: { getRect?: () => { x: number; y: number; width: number; height: number } };
                } | null;
              };
            }
          ).getModel?.();
          return descriptors.map((descriptor, gridIndex) => {
            const engineRect = model?.getComponent?.("grid", gridIndex)?.coordinateSystem?.getRect?.();
            const rect = engineRect
              ? {
                  left: engineRect.x,
                  top: engineRect.y,
                  right: engineRect.x + engineRect.width,
                  bottom: engineRect.y + engineRect.height,
                }
              : plotRect(descriptor, size);
            return { gridIndex, rect };
          });
        };
        const graph = () => {
          const { bounds, size } = boundsNow();
          const grids = gridBands(size);
          const yAxes = axesFromOption(latestOption.current, "yAxis");
          const plates: AxisPlate[] = yAxes.flatMap((axis, axisIndex) => {
            if ((axis.type ?? "value") === "category" || axis.hidden) return [];
            return [{
              axisIndex,
              gridIndex: axis.gridIndex ?? 0,
              side: axis.position === "left" ? "left" : "right",
            }];
          });
          return { bounds, size, grids, yAxes, plates };
        };
        const targetAt = (x: number, y: number): AxisTarget | null => {
          const state = graph();
          return axisDragRef.current
            ? axisTargetAt({ x, y }, state.grids, state.size, state.plates)
            : null;
        };
        const gridForPoint = (grids: readonly GridBand[], x: number, y: number) =>
          grids.find(
            ({ rect }) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom,
          ) ?? null;
        const isChartControlAt = (x: number, y: number): boolean => {
          try {
            const hovered = (
              chart.getZr() as unknown as {
                handler?: { findHover?: (x: number, y: number) => { target?: unknown } };
              }
            ).handler?.findHover?.(x, y);
            let target = hovered?.target as
              | {
                  parent?: unknown;
                  __ecComponentInfo?: { mainType?: string };
                }
              | undefined;
            while (target) {
              const mainType = target.__ecComponentInfo?.mainType;
              if (
                mainType === "toolbox" ||
                mainType === "legend" ||
                mainType === "dataZoom" ||
                mainType === "brush"
              ) {
                return true;
              }
              target = target.parent as typeof target;
            }
          } catch {
            /* Hover inspection is an affordance, never a reason to fail input. */
          }
          return false;
        };
        const setInteractionState = (state: string | null) => {
          if (state) host.dataset.crosshairState = state;
          else host.removeAttribute("data-crosshair-state");
        };
        const hideYLabels = () => {
          for (const label of yLabels.values()) label.hidden = true;
          for (const key of Object.keys(host.dataset)) {
            if (key.startsWith("crosshairY")) delete host.dataset[key];
          }
          delete host.dataset.crosshairX;
        };
        const crosshairDrawn = () =>
          (
            latestOption.current.tooltip as
              | { axisPointer?: { type?: string } }
              | undefined
          )?.axisPointer?.type !== "none";
        const updateCrosshairLabels = (x: number, y: number, activeGrid: GridBand) => {
          if (!crosshairDrawn()) return;
          const { yAxes } = graph();
          const rect = activeGrid.rect;
          const labelsEnabled = yAxes.some(
            (axis) => axis.axisPointer?.label?.show === false,
          );
          if (!labelsEnabled) return;
          const seen = new Set<number>();
          yAxes.forEach((axis, axisIndex) => {
            if ((axis.gridIndex ?? 0) !== activeGrid.gridIndex) return;
            if (axis.hidden || (axis.type ?? "value") === "category") return;
            const formatter =
              axis.axisPointer?.label?.show === false
                ? axis.axisPointer.label.formatter
                : undefined;
            let value: unknown;
            try {
              value = chart.convertFromPixel({ yAxisIndex: axisIndex, gridIndex: activeGrid.gridIndex }, y);
            } catch {
              return;
            }
            const text = formatPointerAxisValue(
              { ...axis, axisPointer: { label: { formatter } } },
              value,
              activeGrid.gridIndex,
            );
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
          for (const [index, label] of yLabels) {
            if (!seen.has(index)) {
              label.hidden = true;
              delete host.dataset[`crosshairY${index}`];
              delete host.dataset[`crosshairYValue${index}`];
            }
          }

          const xAxes = axesFromOption(latestOption.current, "xAxis");
          const xAxisIndex = xAxes.findIndex((axis) => (axis.gridIndex ?? 0) === activeGrid.gridIndex);
          if (xAxisIndex < 0) return;
          try {
            const value = chart.convertFromPixel({ xAxisIndex, gridIndex: activeGrid.gridIndex }, x);
            const text = formatPointerAxisValue(xAxes[xAxisIndex]!, value, activeGrid.gridIndex);
            if (text) host.dataset.crosshairX = text;
          } catch {
            /* A non-Cartesian family has no x conversion; the native hover stays. */
          }
        };

        const valueRangeNow = (axisIndex: number, rect: GridBand["rect"]) => {
          try {
            const top = chart.convertFromPixel({ yAxisIndex: axisIndex }, rect.top) as number;
            const bottom = chart.convertFromPixel({ yAxisIndex: axisIndex }, rect.bottom) as number;
            if (Number.isFinite(top) && Number.isFinite(bottom) && top !== bottom) {
              return { min: Math.min(top, bottom), max: Math.max(top, bottom) };
            }
          } catch {
            /* the engine may be mid-init */
          }
          return null;
        };
        const reportLocalY = () => {
          const yAxes = axesFromOption(latestOption.current, "yAxis");
          yAxes.forEach((_axis, axisIndex) => {
            const range = localYRangeRef.current[axisIndex];
            host.dataset[`yRange${axisIndex}`] = range
              ? `${range.min.toPrecision(12)},${range.max.toPrecision(12)}`
              : "auto";
          });
        };
        const applyLocalY = (
          axisIndex: number,
          range: { min: number; max: number } | null,
        ) => {
          if (range) localYRangeRef.current[axisIndex] = range;
          else delete localYRangeRef.current[axisIndex];
          const baseAxes = axesFromOption(latestOption.current, "yAxis");
          try {
            chart.setOption({
              yAxis: baseAxes.map((axis, index) => {
                if (index !== axisIndex) return {};
                if (range) return { min: range.min, max: range.max };
                /*
                 * A generated Cartesian axis has a function bound. Re-applying
                 * that original descriptor restores Auto Scale/headroom rather
                 * than replacing it with a naive min/max pair.
                 */
                return {
                  min: (axis as unknown as { min?: unknown }).min,
                  max: (axis as unknown as { max?: unknown }).max,
                  scale: (axis as unknown as { scale?: unknown }).scale,
                };
              }),
            });
          } catch {
            /* the engine may be mid-dispose */
          }
          reportLocalY();
        };
        reportLocalY();

        let axisGesture: {
          target: AxisTarget;
          startX: number;
          startY: number;
          rect: GridBand["rect"];
          pointerId: number;
          window?: { start: number; end: number };
          anchor?: number;
          range?: { min: number; max: number };
          anchorValue?: number;
          scaleMode?: "linear" | "log";
        } | null = null;

        const zoomWindow = () => {
          const applied = chart.getOption() as { dataZoom?: Array<{ start?: number; end?: number }> };
          const zoom = applied.dataZoom?.[0] ?? {};
          return {
            start: typeof zoom.start === "number" ? zoom.start : 0,
            end: typeof zoom.end === "number" ? zoom.end : 100,
          };
        };
        const loadedExtent = () => {
          const x = xValuesRef.current;
          if (!x || x.length < 2) return null;
          const lo = x[0]!;
          const hi = x[x.length - 1]!;
          return hi > lo ? { lo, hi } : null;
        };
        const stateForTarget = (target: AxisTarget, dragging: boolean) =>
          target.kind === "time"
            ? dragging
              ? "axis-x-drag"
              : "axis-x"
            : dragging
              ? "axis-y-drag"
              : "axis-y";

        const onPointerDown = (event: PointerEvent) => {
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
            const { anchor } = windowFractions(window, x, { from: rect.left, to: rect.right });
            axisGesture = {
              target,
              startX: event.clientX,
              startY: event.clientY,
              rect,
              pointerId: event.pointerId,
              window,
              anchor,
            };
          } else {
            const range = valueRangeNow(target.axisIndex, rect);
            if (!range) return;
            const axis = axesFromOption(latestOption.current, "yAxis")[target.axisIndex];
            let anchorValue = range.min;
            try {
              anchorValue = chart.convertFromPixel(
                { yAxisIndex: target.axisIndex, gridIndex: target.gridIndex },
                y,
              ) as number;
            } catch {
              /* keep the range's own minimum */
            }
            axisGesture = {
              target,
              startX: event.clientX,
              startY: event.clientY,
              rect,
              pointerId: event.pointerId,
              range,
              anchorValue,
              scaleMode: axis?.type === "log" || axis?.scaleMode === "log" ? "log" : "linear",
            };
          }
          setInteractionState(stateForTarget(target, true));
          host.dataset.axis = target.kind;
          host.dataset.axisIndex = String(target.axisIndex);
          hideYLabels();
          event.preventDefault();
          host.setPointerCapture?.(event.pointerId);
        };

        const onPointerMove = (event: PointerEvent) => {
          const { bounds } = boundsNow();
          const x = event.clientX - bounds.left;
          const y = event.clientY - bounds.top;
          if (axisGesture) {
            event.preventDefault();
            setInteractionState(stateForTarget(axisGesture.target, true));
            if (axisGesture.target.kind === "time" && axisGesture.window) {
              const next = scaleWindow(
                axisGesture.window,
                axisGesture.anchor ?? 50,
                event.clientX - axisGesture.startX,
                axisGesture.rect.right - axisGesture.rect.left,
              );
              try {
                chart.dispatchAction({ type: "dataZoom", start: next.start, end: next.end });
                reportVisibleSpan();
              } catch {
                /* the engine may be mid-dispose */
              }
            } else if (axisGesture.target.kind === "value" && axisGesture.range) {
              applyLocalY(
                axisGesture.target.axisIndex,
                scaleValueRange(
                  axisGesture.range,
                  axisGesture.anchorValue ?? 0,
                  event.clientY - axisGesture.startY,
                  axisGesture.rect.bottom - axisGesture.rect.top,
                  { scaleMode: axisGesture.scaleMode },
                ),
              );
            }
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
          const pointerPolicy = (
            latestOption.current.tooltip as
              | { axisPointer?: { snap?: boolean } }
              | undefined
          )?.axisPointer;
          host.dataset.crosshairSnap = String(pointerPolicy?.snap ?? true);
          host.dataset.plotRect =
            `${grid.rect.left},${grid.rect.top},${grid.rect.right},${grid.rect.bottom}`;
          /*
           * While a plot drag is in progress, ZRender already switches between
           * grab/grabbing for DataZoom and crosshair for Brush. Leaving the
           * cursor unowned here preserves whichever mode the reader activated.
           */
          setInteractionState(event.buttons > 0 ? null : "plot");
          updateCrosshairLabels(x, y, grid);
        };

        const finishAxisGesture = (event?: PointerEvent) => {
          if (!axisGesture) return;
          const pointerId = axisGesture.pointerId;
          axisGesture = null;
          if (host.hasPointerCapture?.(pointerId)) host.releasePointerCapture(pointerId);
          if (event?.pointerType === "touch") {
            setInteractionState(null);
            hideYLabels();
          } else if (event) {
            onPointerMove(event);
          } else {
            setInteractionState(null);
            hideYLabels();
          }
        };

        const onPointerUp = (event: PointerEvent) => {
          const wasAxisGesture = Boolean(axisGesture);
          finishAxisGesture(event);
          if (event.pointerType === "touch") {
            setInteractionState(null);
            hideYLabels();
          } else if (!wasAxisGesture) {
            onPointerMove(event);
          }
        };
        const onPointerCancel = (event: PointerEvent) => {
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
        const onPlotPointerDown = (event: PointerEvent) => {
          if (!axisDragRef.current || event.button !== 0 || event.pointerType === "touch") return;
          const { bounds } = boundsNow();
          const x = event.clientX - bounds.left;
          const y = event.clientY - bounds.top;
          if (targetAt(x, y) || isChartControlAt(x, y)) return;
          if (crosshairDrawn() && gridForPoint(graph().grids, x, y)) {
            setInteractionState(null);
          }
        };
        const onDoubleClick = (event: MouseEvent) => {
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
            chart.dispatchAction({ type: "dataZoom", start: 0, end: 100 });
          } catch {
            /* the engine may be mid-dispose */
          }
          const group = syncGroupRef.current;
          if (extent && group) {
            bus.publishRange(group, { from: extent.lo, to: extent.hi }, id, { intent: "gesture" });
          }
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
          if (rect) sizeRef.current = { width: rect.width, height: rect.height };
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

        chart.on("updateAxisPointer", (params: unknown) => {
          const info = (params as { axesInfo?: Array<{ value?: unknown }> }).axesInfo?.[0];
          if (applyingRef.current || !syncGroupRef.current) return;
          const group = syncGroupRef.current;
          const pinned = bus.getPinned(group);
          if (pinned != null) {
            // The pin owns the crosshair: holding the pointer over the chart
            // must not walk the inspection away from where it was pinned.
            applyCursorRef.current(pinned);
            return;
          }
          bus.publishCursor(group, normalizeCursorX(info?.value as number), id);
          onEventRef.current?.({ type: "cursor", value: info?.value, raw: params });
        });
        chart.on("showTip", (params: unknown) => {
          const payload = params as { dataIndex?: number; value?: unknown };
          onEventRef.current?.({ type: "tip", dataIndex: payload.dataIndex, value: payload.value, raw: params });
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
        chart.on("dataZoom", (params: unknown) => {
          const group = syncGroupRef.current;
          // A reader's own pan/zoom changes the window (and therefore the label
          // granularity) whether or not this chart is in a sync group.
          reportVisibleSpan();
          if (!group) return;
          // Programmatic zooms (`applyRange`, an option re-apply, a resize) are
          // not the reader's window and must never move the group.
          if (!gestureRef.current?.active()) return;
          const batch = (params as { batch?: Array<{ start?: number; end?: number }> }).batch;
          const first = batch?.[0] ?? (params as { start?: number; end?: number });
          const x = xValuesRef.current;
          if (!first || !x || x.length < 2) return;
          const lo = x[0]!;
          const hi = x[x.length - 1]!;
          const span = hi - lo;
          bus.publishRange(
            group,
            {
              from: lo + (span * (first.start ?? 0)) / 100,
              to: lo + (span * (first.end ?? 100)) / 100,
            },
            id,
            { intent: "gesture" },
          );
        });

        onReadyRef.current?.(chart);
      })
      .catch((error: unknown) => {
        // Never let a renderer problem take the page down.
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
      if (chart) {
        try {
          chart.dispose();
        } catch {
          /* already disposed */
        }
      }
    };
    // The engine is created once per mount; option/theme changes are applied below.
    //
    // `renderer` is in the list on purpose: zrender binds a painter when the
    // instance is constructed, so a renderer change is a re-creation, not a
    // re-render. Everything else about the engine is applied through the option
    // effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, renderer]);

  // ------------------------------------------------------------------- option
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !ready) return;
    // The init above already applied the current option; re-applying the same
    // object after `ready` flips would restart the intro animation for nothing.
    if (appliedOptionRef.current === option) return;
    appliedOptionRef.current = option;
    // `replaceMerge` on series means a toggle that removes a series actually
    // removes it, without throwing away the user's zoom on every re-render.
    chart.setOption({ ...ECHARTS_GLOBAL_OPTION, ...option }, { notMerge: false, replaceMerge: ["series"] });
    /*
     * A reader-dragged value scale survives a re-render.
     *
     * The option a caller re-applies never mentions `yAxis.min/max` (autoscale is
     * the engine's job), so an ordinary merge would keep the drag by luck. Making
     * it explicit costs one comparison and removes the luck: if the reader is on
     * a manual value range, that range is re-asserted after the option lands.
     */
    const localY = Object.entries(localYRangeRef.current);
    if (localY.length > 0) {
      try {
        const axisCount = axesFromOption(option, "yAxis").length;
        chart.setOption({
          yAxis: Array.from({ length: axisCount }, (_, index) => {
            const range = localYRangeRef.current[index];
            return range ? { min: range.min, max: range.max } : {};
          }),
        });
      } catch {
        /* the engine may be mid-dispose */
      }
    }
    publishDiagnostics();
  }, [option, ready, publishDiagnostics]);

  // --------------------------------------------------------------------- sync
  useEffect(() => {
    if (!syncGroup) return;
    const applyCursor = (value: number | null) => {
      const chart = chartRef.current;
      if (!chart) return;
      applyingRef.current = true;
      try {
        if (value === null) {
          chart.dispatchAction({ type: "hideTip" });
        } else {
          const x = xValuesRef.current;
          const index = x && x.length > 0 ? nearestIndex(x, value) : -1;
          if (index >= 0 && x) {
            const pixel = chart.convertToPixel({ xAxisIndex: 0 }, x[index]!);
            if (typeof pixel === "number") {
              chart.dispatchAction({
                type: "showTip",
                x: pixel,
                y: Math.max(8, sizeRef.current.height / 2),
              });
            }
          }
        }
      } catch {
        /* the chart may still be initialising */
      }
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
    const applyRange = (range: ChartRangeState | null) => {
      const chart = chartRef.current;
      if (!chart) return;
      const zoom = (start: number, end: number) => {
        try {
          chart.dispatchAction({ type: "dataZoom", start, end });
        } catch {
          /* ignore a race with dispose */
        }
        // The axis labels follow the window the engine just applied.
        reportVisibleSpan();
      };
      if (!range) {
        zoom(0, 100);
        return;
      }
      const x = xValuesRef.current;
      if (!x || x.length < 2) return;
      const lo = x[0]!;
      const hi = x[x.length - 1]!;
      const span = hi - lo;
      if (span <= 0) return;
      const rawStart = ((range.from - lo) / span) * 100;
      const rawEnd = ((range.to - lo) / span) * 100;
      const start = Math.min(100, Math.max(0, rawStart));
      const end = Math.min(100, Math.max(0, rawEnd));
      const disjoint = rawEnd < 0 || rawStart > 100;
      if (disjoint || !Number.isFinite(start) || !Number.isFinite(end) || end - start < 0.5) {
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
      onRange: (range) => applyRange(normalizeRange(range)),
    });
  }, [bus, id, reportVisibleSpan, syncGroup, xValuesRef]);

  /*
   * A chart joining an existing group adopts its window through the subscription
   * itself: `subscribe` hands the current state to a late subscriber (including
   * a published `null`, which is `max`), so there is no separate adoption pass
   * and no frame of the previous window.
   */

  return (
    <>
      <div
        ref={hostRef}
        data-slot="echart-surface"
        className={className ? `luc-chart-surface ${className}` : "luc-chart-surface"}
        // `img` needs a name; without one, the honest thing is no role at all.
        role={ariaLabel ? "img" : undefined}
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
