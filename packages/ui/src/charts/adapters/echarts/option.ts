/**
 * Shared ECharts option fragments.
 *
 * Every family builds its option from these helpers, which is what makes twenty
 * different chart types read as one system: one grid rhythm, one axis weight, one
 * animation budget, one tooltip shell. A family that overrides these is making a
 * deliberate exception, not quietly inventing a second style.
 */

import type { ChartTheme } from "../../core/theme";
import type { ChartFormat, ChartInteractionSpec } from "../../types";
import { ECHARTS_GLOBAL_OPTION } from "./echart-init";
import { timeAxisFormatter, timeAxisTickPlan, numericAxisFormatter } from "../../core/formatters";
import {
  AXIS_LABEL_MARGIN,
  resolveChartPlotRect,
  type AxisSide,
} from "../../core/axis";

export type Option = Record<string, unknown>;

export const AXIS_FONT_WEIGHT = 450;

export interface MotionBudget {
  intro: number;
  update: number;
  reduced: boolean;
  /** Hover/emphasis feedback duration (0 when reduced). */
  emphasis?: number;
  /** Whether a universal (morph) transition is allowed at all. */
  universal?: boolean;
}

export interface AnimationOptions {
  /**
   * Opt in to ECharts' universal transition (a morph between two
   * representations of the same data). Requires the caller to have asked for it
   * — a morph implies the two views share an identity.
   */
  universal?: boolean;
  /** Above this many marks ECharts disables per-mark animation. */
  threshold?: number;
}

export function animationFragment(motion: MotionBudget, options: AnimationOptions = {}): Option {
  if (motion.reduced) {
    return {
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      universalTransition: false,
    };
  }
  return {
    animation: true,
    animationDuration: motion.intro,
    animationDurationUpdate: Math.max(140, motion.update),
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicOut",
    // Past the threshold ECharts stops animating individual marks. It is a
    // per-chart budget, not a data change: the same marks are drawn either way.
    animationThreshold: options.threshold ?? 2500,
    ...(options.universal && motion.universal ? { universalTransition: true } : {}),
  };
}

export function baseOption(theme: ChartTheme, motion: MotionBudget, options: AnimationOptions = {}): Option {
  return {
    /*
     * The timezone the axis ticks are chosen in, on every option this library
     * builds — see `echart-init.ts` for the measurement. It travels with the
     * option rather than with `init` because that is where ECharts 6 reads it,
     * so a server-rendered option is correct on its own.
     */
    ...ECHARTS_GLOBAL_OPTION,
    ...animationFragment(motion, options),
    color: [...theme.palette],
    textStyle: {
      fontFamily: theme.fontFamily,
      fontSize: theme.fontCaption,
      color: theme.textPrimary,
    },
    backgroundColor: "transparent",
    /*
     * Hover emphasis is a *reading* aid: the series under the pointer is the one
     * being read, and its peers step back without disappearing. The blur state
     * is declared once here so every family dims by the same amount — an
     * engine-default dim reads differently per chart type.
     */
    emphasis: { focus: "series", blurScope: "coordinateSystem" },
    blur: {
      lineStyle: { opacity: 0.24 },
      itemStyle: { opacity: 0.24 },
      areaStyle: { opacity: 0.1 },
      label: { opacity: 0.35 },
    },
  };
}

export interface GridOverrides {
  left?: number | string;
  right?: number | string;
  top?: number | string;
  bottom?: number | string;
  containLabel?: boolean;
  height?: number | string;
}

/**
 * Default grid for a specialised family.
 *
 * These families (heatmap, correlation matrix, waterfall, distribution,
 * sequence, band, relationship) own their label model — a matrix's header is not
 * a value-axis gutter — so they keep their deliberate rectangle and rely on
 * `containLabel` to fit it. The declarative cartesian path uses
 * `gridForSides` instead, which is what makes a stacked research column share one
 * X domain.
 */
export function gridFragment(overrides: GridOverrides = {}): Option {
  return {
    left: overrides.left ?? 6,
    right: overrides.right ?? 10,
    top: overrides.top ?? 14,
    bottom: overrides.bottom ?? 6,
    containLabel: overrides.containLabel ?? true,
    ...(overrides.height !== undefined ? { height: overrides.height } : {}),
  };
}

/**
 * The shared plot rectangle for an explicit set of Y-axis sides.
 *
 * The rectangle is derived from which sides carry a Y axis, so two stacked
 * charts whose labels differ by a factor of a thousand still share one data
 * area; the gutter is reserved rather than measured. `containLabel` stays off
 * here on purpose.
 */
export function gridForSides(
  sides: readonly AxisSide[],
  overrides: GridOverrides = {},
): Option {
  const base = resolveChartPlotRect(sides);
  return {
    left: overrides.left ?? base.left,
    right: overrides.right ?? base.right,
    top: overrides.top ?? base.top,
    bottom: overrides.bottom ?? base.bottom,
    containLabel: overrides.containLabel ?? base.containLabel,
    ...(overrides.height !== undefined ? { height: overrides.height } : {}),
  };
}

export interface AxisFragmentOptions {
  type: "category" | "time" | "value" | "log";
  theme: ChartTheme;
  /** Axis id, referenced by series. `0`/`1` index order is derived from this. */
  name?: string;
  /**
   * Where the axis *name* sits: at an end of the plate, or beside its middle.
   *
   * A name at the end lands in the corner the first tick label also occupies —
   * the bump chart's "Rank" printed on top of "Q1" until it moved to the middle,
   * which the renderer diagnostics measured rather than a screenshot guess.
   */
  nameLocation?: "start" | "middle" | "end";
  /** Distance from the plate to the name. ECharts' default is 15. */
  nameGap?: number;
  /**
   * Which side the plate sits on. Omitted means the engine's own default (left);
   * a cartesian `ChartSpec` always resolves it through `DEFAULT_Y_AXIS_SIDE`
   * before it gets here, so "no side" is only reachable from a family that
   * deliberately owns its geometry.
   */
  position?: AxisSide;
  format?: ChartFormat;
  /** The loaded extent's span, in ms. */
  spanMs?: number;
  /**
   * The span the window currently shows, in ms — what a time axis labels.
   *
   * Falls back to `spanMs`, which is the correct answer whenever the reader is
   * on MAX (the loaded extent *is* the visible window).
   */
  labelSpanMs?: number;
  /**
   * A caller-supplied display label for a point on the axis.
   *
   * It is consulted *before* the span-based date formatting, so an axis whose
   * caller knows a better name for a tick (a fiscal identity over a period-end
   * date) prints that name while every tick the caller did not name keeps the
   * engine's own label. The engine never inspects the string.
   */
  pointLabel?: (value: number) => string | undefined;
  /**
   * Fixed bound, or a function ECharts calls with the *visible* extent (so a
   * padded domain follows a zoom instead of freezing at the full history).
   */
  min?: AxisBoundInput;
  max?: AxisBoundInput;
  nice?: boolean;
  /**
   * Fit the axis to the data instead of forcing zero into the range.
   * `false` for anything whose mark is measured from a baseline.
   */
  scale?: boolean;
  /** Show a hairline on the axis itself (used by bar charts' baseline). */
  baseline?: boolean;
  showGrid?: boolean;
  splitNumber?: number;
  /**
   * Suppress the label on an extreme tick that is display headroom rather than a
   * value the chart reports. The tick and its split line stay; only the number
   * goes, so a padded drawdown cannot show a `+8.5%` tick.
   */
  hideMinLabel?: boolean;
  hideMaxLabel?: boolean;
  hidden?: boolean;
  logBase?: number;
}

/**
 * An axis bound: a fixed value, `"dataMin"` / `"dataMax"`, or a function of the
 * *visible* extent (which is what keeps display headroom after a zoom).
 */
export type AxisBoundInput =
  | number
  | "dataMin"
  | "dataMax"
  | ((extent: { min: number; max: number }) => number);

export function axisFragment(options: AxisFragmentOptions): Option {
  const { theme, type } = options;
  /*
   * A hidden axis keeps its **type**.
   *
   * `show: false` is what makes the plate invisible, but the axis object still
   * has to scale the series bound to it: a quiet context line drawn on a hidden
   * *log* scale must not silently fall back to a linear value axis (a 15-year
   * price trajectory would then live in the first two pixels of the plot).
   */
  if (options.hidden) return { show: false, type };

  /*
   * A time axis decides two things that have to agree: how much of a date each
   * tick prints, and how many ticks there are. Deriving only the first from the
   * span (which is what this did) let ECharts size the axis from the canvas
   * width, so a wide plot of a four-month series drew twelve ticks under a
   * month-name formatter and read "Jan Jan Feb Feb …".
   * `timeAxisTickPlan` returns both decisions from the one span; the label
   * formatter is then built from the same scale the tick count assumes.
   */
  const timeSpan = options.labelSpanMs ?? options.spanMs ?? 365 * 86_400_000;
  const tickPlan = type === "time" ? timeAxisTickPlan(timeSpan) : null;
  const labelFormatter =
    type === "time"
      ? timeAxisFormatter(timeSpan)
      : type === "category"
        ? null
        : numericAxisFormatter(options.format);
  /*
   * The tick's text: the caller's own point label when it has one, otherwise the
   * axis's own formatter. A category axis carries its labels as data and takes no
   * tick formatter (its `categoryLabels` already hold the caller's labels).
   */
  const tickFormatter =
    type === "category"
      ? null
      : options.pointLabel
        ? (value: number) => options.pointLabel!(value) ?? labelFormatter?.(value) ?? String(value)
        : labelFormatter
          ? (value: number) => labelFormatter(value)
          : null;

  return {
    type,
    ...(options.name ? { name: options.name } : {}),
    ...(options.nameLocation ? { nameLocation: options.nameLocation } : {}),
    ...(options.nameGap !== undefined ? { nameGap: options.nameGap } : {}),
    ...(options.position ? { position: options.position } : {}),
    ...(options.min !== undefined ? { min: options.min } : {}),
    ...(options.max !== undefined ? { max: options.max } : {}),
    ...(options.nice !== undefined ? { nice: options.nice } : {}),
    ...(options.scale !== undefined ? { scale: options.scale } : {}),
    ...(type === "log" ? { logBase: options.logBase ?? 10 } : {}),
    ...(options.splitNumber
      ? { splitNumber: options.splitNumber }
      : tickPlan
        ? { splitNumber: tickPlan.splitNumber }
        : {}),
    boundaryGap: type === "category",
    axisLine: {
      show: options.baseline ?? false,
      lineStyle: { color: theme.axisLine, width: 1 },
    },
    axisTick: { show: false },
    axisLabel: {
      show: true,
      color: theme.axisLabel,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontMicro,
      fontWeight: AXIS_FONT_WEIGHT,
      hideOverlap: true,
      margin: AXIS_LABEL_MARGIN,
      ...(options.hideMinLabel ? { showMinLabel: false } : {}),
      ...(options.hideMaxLabel ? { showMaxLabel: false } : {}),
      ...(tickFormatter ? { formatter: tickFormatter } : {}),
    },
    splitLine: {
      show: options.showGrid ?? (type === "value" || type === "log"),
      lineStyle: { color: theme.grid, width: 1 },
    },
    axisPointer: {
      lineStyle: { color: theme.crosshair, width: 1 },
      label: axisPointerLabel(theme),
    },
  };
}

export function axisPointerLabel(theme: ChartTheme): Option {
  return {
    backgroundColor: theme.crosshairLabelBg,
    color: theme.crosshairLabelFg,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontMicro,
    fontWeight: AXIS_FONT_WEIGHT,
    borderRadius: 4,
    padding: [3, 6],
  };
}

export function tooltipShell(
  theme: ChartTheme,
  options: {
    formatter: (params: unknown) => string;
    mode?: "axis" | "item" | "none";
    pointer?: boolean;
  },
): Option {
  if (options.mode === "none") return { show: false };
  return {
    show: true,
    trigger: options.mode ?? "axis",
    renderMode: "html",
    confine: true,
    appendToBody: false,
    transitionDuration: 0,
    className: "luc-chart-tooltip-shell",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
    padding: 0,
    textStyle: { color: theme.textPrimary, fontFamily: theme.fontFamily },
    extraCssText: "pointer-events:none;box-shadow:none;background:transparent;border:0;padding:0;",
    formatter: options.formatter,
    axisPointer:
      options.mode === "item"
        ? { type: "none" }
        : {
            type: "line",
            lineStyle: { color: theme.crosshair, width: 1, type: "solid" },
            label: axisPointerLabel(theme),
          },
  };
}

export interface ZoomOptions {
  interaction?: ChartInteractionSpec;
  /** Axis ids the zoom applies to. Omitted means all cartesian axes. */
  axisIndices?: number[];
  theme: ChartTheme;
  /** Trailing window as a percentage pair, e.g. `{ start: 60, end: 100 }`. */
  start?: number;
}

export function dataZoomFragment(options: ZoomOptions): Option[] {
  const zoom = options.interaction?.zoom ?? "inside";
  if (zoom === "none") return [];
  const theme = options.theme;
  const shared: Option = {
    ...(options.axisIndices ? { xAxisIndex: options.axisIndices } : {}),
    ...(options.start !== undefined ? { start: options.start, end: 100 } : {}),
  };
  if (zoom === "slider") {
    return [
      { type: "inside", ...shared, zoomOnMouseWheel: true, moveOnMouseMove: true },
      {
        type: "slider",
        ...shared,
        height: 20,
        bottom: 4,
        borderColor: "transparent",
        backgroundColor: theme.surfaceRaised,
        fillerColor: theme.selection,
        handleStyle: { color: theme.axisLabel, borderColor: "transparent" },
        moveHandleStyle: { color: theme.border },
        dataBackground: {
          lineStyle: { color: theme.border, width: 1 },
          areaStyle: { color: theme.borderSubtle },
        },
        selectedDataBackground: {
          lineStyle: { color: theme.accent, width: 1 },
          areaStyle: { color: theme.selection },
        },
        textStyle: { color: theme.textMuted, fontSize: theme.fontMicro },
        labelFormatter: () => "",
      },
    ];
  }
  return [{ type: "inside", ...shared, zoomOnMouseWheel: true, moveOnMouseMove: true }];
}

/** Series ids are the chart's public keys; engine index order is an adapter detail. */
export function optionSeriesId(specId: string): string {
  return specId;
}

export function ariaFragment(label: string | undefined, description: string | undefined): Option {
  if (!label && !description) return {};
  return {
    aria: {
      enabled: true,
      label: { enabled: true, description: description ?? label },
      decal: { show: false },
    },
  };
}
