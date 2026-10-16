/**
 * Axis, scale and domain.
 *
 * This module is the **one** contract for three things that used to be decided
 * by whichever engine happened to draw the pixels:
 *
 *  1. **Axis side** — an ordinary single-axis LUC chart puts its Y axis on the
 *     **right** (`DEFAULT_Y_AXIS_SIDE`). A left axis is a deliberate exception
 *     (a genuine second unit, or a chart whose plate convention is left). It is
 *     never an engine default: ECharts' own default is `left`, which is why
 *     charts used to disagree with the Lightweight lane for no reason a reader
 *     could see.
 *  2. **Scale mode** — `linear` or `log`. A presentation concern: the data is
 *     never transformed upstream. Log is only valid for strictly positive
 *     values, so a requested log mode that the data cannot support falls back
 *     to linear instead of drawing a broken axis.
 *  3. **Display domain** — the numeric range the plot actually covers, with
 *     semantic headroom so an extremum, a stroke or a marker never rides the
 *     plot boundary, and so a flat series still has a readable range.
 *
 * Everything here is pure: values in, numbers out. Nothing computes analytics.
 */

/* -------------------------------------------------------------------------- */
/* Scale                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * How a value axis maps data to pixels. Deliberately small: `symlog`, `power`
 * and `sqrt` are not part of the LUC contract.
 */
export type YScaleMode = "linear" | "log";

/** The side a Y axis is drawn on. */
export type AxisSide = "left" | "right";

/**
 * The default for an ordinary single-Y-axis LUC chart.
 *
 * Percentages are not a reason to move to the left: a drawdown, a funding rate
 * and a moving average all read better with the plate on the right, matching the
 * financial lane. A left axis means "this is a second, genuinely different
 * unit" (or the chart's own documented convention).
 */
export const DEFAULT_Y_AXIS_SIDE: AxisSide = "right";

/** What a chart is allowed to do, and what it does by default. */
export interface ChartScaleCapability {
  allowedScaleModes: readonly YScaleMode[];
  defaultScaleMode: YScaleMode;
}

const LINEAR_ONLY: readonly YScaleMode[] = ["linear"];

/** The capability of a chart that never leaves a linear axis. */
export const LINEAR_SCALE_CAPABILITY: ChartScaleCapability = {
  allowedScaleModes: LINEAR_ONLY,
  defaultScaleMode: "linear",
};

/**
 * Normalise a declared capability.
 *
 * An empty allow-list, a duplicate, or a default outside the allow-list are all
 * caller mistakes that must not produce a broken axis: they collapse to the
 * safe linear-only capability.
 */
export function normalizeScaleCapability(
  input?: { allowed?: readonly YScaleMode[]; default?: YScaleMode } | null,
): ChartScaleCapability {
  if (!input) return LINEAR_SCALE_CAPABILITY;
  const allowed: YScaleMode[] = [];
  for (const mode of input.allowed ?? LINEAR_ONLY) {
    if (mode !== "linear" && mode !== "log") continue;
    if (!allowed.includes(mode)) allowed.push(mode);
  }
  if (allowed.length === 0) return LINEAR_SCALE_CAPABILITY;
  const fallback: YScaleMode = allowed.includes("linear") ? "linear" : allowed[0]!;
  const preferred = input.default;
  return {
    allowedScaleModes: allowed,
    defaultScaleMode: preferred && allowed.includes(preferred) ? preferred : fallback,
  };
}

/** True when every finite value is strictly positive — the only valid log domain. */
export function isLogEligible(values: readonly (number | null | undefined)[]): boolean {
  let seen = false;
  for (const value of values) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    seen = true;
    if (value <= 0) return false;
  }
  return seen;
}

export type ScaleFallbackReason = "not-allowed" | "non-positive-data";

export interface ResolvedScaleMode {
  mode: YScaleMode;
  /** Set when the requested mode could not be honoured. */
  fallback: ScaleFallbackReason | null;
}

/**
 * Resolve the mode a chart will actually render.
 *
 * A requested mode that is not allowed, or whose data contains a zero or a
 * negative value, resolves to linear. The caller gets the reason so a
 * development warning can name it; production simply draws the linear chart
 * instead of an axis pinned to `[1, 10]`.
 */
export function resolveScaleMode(options: {
  requested?: YScaleMode | null;
  capability?: ChartScaleCapability;
  values?: readonly (number | null | undefined)[];
}): ResolvedScaleMode {
  const capability = options.capability ?? LINEAR_SCALE_CAPABILITY;
  const requested = options.requested ?? capability.defaultScaleMode;
  if (requested !== "log") return { mode: "linear", fallback: null };
  if (!capability.allowedScaleModes.includes("log")) return { mode: "linear", fallback: "not-allowed" };
  if (options.values && !isLogEligible(options.values)) return { mode: "linear", fallback: "non-positive-data" };
  return { mode: "log", fallback: null };
}

/* -------------------------------------------------------------------------- */
/* Domain                                                                      */
/* -------------------------------------------------------------------------- */

export type AxisDomainPolicy = "auto" | "include-zero" | "fixed";

export interface AxisBounds {
  min: number;
  max: number;
  /**
   * The edge is **display headroom**, not a value the chart reports: it exists so
   * an extreme stroke, halo or glow is drawn inside the plot. An axis must not
   * label it — a `+8.5%` tick on a drawdown would imply positive drawdown data.
   */
  minHeadroom?: boolean;
  maxHeadroom?: boolean;
}

export interface AxisBoundsInput {
  /** The raw data extent — already the *visible* extent when a window applies. */
  extent: AxisBounds;
  /**
   * Values that must stay inside the domain even though they are not data: a
   * reference line (a threshold, a benchmark level) the chart communicates. A
   * declared level that fell outside the axis would be invisible, which reads as
   * "the threshold does not exist".
   */
  include?: readonly number[];
  scaleMode?: YScaleMode;
  /**
   * Keep zero as the fixed baseline edge. Bars, areas and box plots are
   * measured from zero, so their baseline must not float.
   */
  zeroBaseline?: boolean;
  /** Override the headroom, as a fraction of the span (log: of the log span). */
  padding?: number;
  /** A marker (current point, emphasis halo) sits on the extremes. */
  marker?: boolean;
  /** Target number of axis intervals when snapping to readable bounds. */
  splitTarget?: number;
}

/** Headroom for a plain line/area edge, as a fraction of the span. */
export const DEFAULT_AXIS_PADDING = 0.1;
/** Headroom when a symbol, halo or glow is drawn on the extreme value. */
export const MARKER_AXIS_PADDING = 0.16;
/** Headroom for a log edge, as a fraction of the log span. */
export const LOG_AXIS_PADDING = 0.05;

/** Below this share of the centre value a span is treated as flat. */
const MIN_SPAN_RATIO = 0.002;

const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

/**
 * The 1 / 2 / 2.5 / 5 / 10 step at or above `raw`. Exported because a
 * domain-aware custom axis may want the same tick rhythm.
 */
export function niceStep(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  // The tolerance matters: `0.2 / 0.1` is 2.0000000000000004 in binary floating
  // point, which would otherwise skip 2 and pick 2.5.
  const step = NICE_STEPS.find((candidate) => normalized <= candidate + 1e-9) ?? 10;
  return step * magnitude;
}

/** Kill floating-point dust without losing a real magnitude. */
function tidy(value: number): number {
  if (!Number.isFinite(value) || value === 0) return value;
  return Number(value.toPrecision(12));
}

function finiteExtent(extent: AxisBounds): boolean {
  return Number.isFinite(extent.min) && Number.isFinite(extent.max) && extent.max >= extent.min;
}

/**
 * Give an extent its display headroom and readable bounds.
 *
 * Rules, in order:
 *
 * - **A zero edge is a boundary.** If the data is non-negative the low edge
 *   stays at the data minimum (never padded below zero); if the data is
 *   non-positive the high edge stays at the data maximum. A drawdown can
 *   therefore never show a positive tick, and volatility can never show a
 *   negative one.
 * - **Every other edge gets proportional headroom**, so the extreme value, its
 *   stroke and any marker are drawn inside the plot rather than on its border.
 * - **Flat and near-flat series** get a minimum visual span instead of a
 *   zero-height domain.
 * - **The interior ticks stay round** because the engine computes its own tick
 *   interval from the extent; the padded edges are *headroom* and are marked as
 *   such (`minHeadroom` / `maxHeadroom`) so no axis labels them.
 */
export function resolveAxisBounds(input: AxisBoundsInput): AxisBounds {
  const include = input.include?.filter((value) => Number.isFinite(value)) ?? [];
  const raw: AxisBounds = include.length
    ? { min: Math.min(input.extent.min, ...include), max: Math.max(input.extent.max, ...include) }
    : input.extent;
  if (!finiteExtent(raw)) return { ...raw, minHeadroom: false, maxHeadroom: false };

  const scaleMode = input.scaleMode ?? "linear";
  const padding = input.padding ?? (input.marker ? MARKER_AXIS_PADDING : DEFAULT_AXIS_PADDING);

  if (scaleMode === "log") {
    // A log domain only exists over strictly positive values; the caller is
    // responsible for falling back first, but staying total here means a
    // mis-wired axis degrades to a positive sliver instead of a broken chart.
    const low = raw.min > 0 ? raw.min : Number.MIN_VALUE;
    const high = raw.max > 0 ? Math.max(raw.max, low * 1.000001) : low * 10;
    const logLow = Math.log10(low);
    const logHigh = Math.log10(high);
    const pad = (logHigh - logLow) * (input.padding ?? LOG_AXIS_PADDING);
    return {
      min: tidy(10 ** (logLow - pad)),
      max: tidy(10 ** (logHigh + pad)),
      minHeadroom: pad > 0,
      maxHeadroom: pad > 0,
    };
  }

  let low = raw.min;
  let high = raw.max;

  const span = high - low;
  if (!(span > 0)) {
    // A constant series: centre it on a span that is readable rather than
    // degenerate (a constant 0 becomes [-1, 1], a constant 100 becomes [95, 105]).
    const half = niceStep(Math.abs(low) * 0.05 || 1);
    low -= half;
    high += half;
  } else {
    const centre = (low + high) / 2;
    const minimumSpan = niceStep(Math.abs(centre) * MIN_SPAN_RATIO);
    if (span < minimumSpan) {
      low = centre - minimumSpan / 2;
      high = centre + minimumSpan / 2;
    }
  }

  const paddedSpan = high - low;
  const pad = paddedSpan * padding;
  let padLow = pad;
  let padHigh = pad;
  /*
   * A baseline mark is measured *from* zero, so zero is one of its two bounds
   * and must not move: padding below a positive bar would lift it off the axis.
   * Every other edge — including the zero ceiling of a drawdown — takes the
   * headroom, because the alternative is a stroke that rides the plot boundary.
   */
  if (input.zeroBaseline && raw.min >= 0) {
    low = 0;
    padLow = 0;
  }
  if (input.zeroBaseline && raw.max <= 0) {
    high = 0;
    padHigh = 0;
  }
  let min = low - padLow;
  let max = high + padHigh;
  /*
   * A one-signed metric never grows a plot band into the direction its values
   * cannot take: volatility has no negative part, and a return that starts at
   * zero has no positive part. So that edge is clamped to zero — which is a
   * real, legitimate axis value and keeps its label — *unless* it is the edge the
   * data itself touches (a drawdown's 0% ceiling), where the headroom is exactly
   * what keeps the crest off the boundary and the label is dropped instead.
   */
  let minIsFloor = false;
  let maxIsCeiling = false;
  if (raw.min > 0 && min < 0) {
    min = 0;
    minIsFloor = true;
  }
  if (raw.max < 0 && max > 0) {
    max = 0;
    maxIsCeiling = true;
  }
  const semanticMin = input.zeroBaseline && raw.min >= 0 ? 0 : raw.min;
  const semanticMax = input.zeroBaseline && raw.max <= 0 ? 0 : raw.max;
  return {
    min: tidy(min),
    max: tidy(max),
    minHeadroom: !minIsFloor && min < semanticMin,
    maxHeadroom: !maxIsCeiling && max > semanticMax,
  };
}

/** `resolveAxisBounds` over a value list, or `null` when nothing is plottable. */
export function resolveAxisDomain(
  values: readonly (number | null | undefined)[],
  options: Omit<AxisBoundsInput, "extent"> = {},
): AxisBounds | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === Number.POSITIVE_INFINITY) return null;
  return resolveAxisBounds({ ...options, extent: { min, max } });
}

/**
 * A bound function shaped for ECharts' `axis.min` / `axis.max`.
 *
 * ECharts calls it with the extent of the **currently visible** data, so the
 * headroom survives a zoom or a range change instead of freezing the axis at the
 * full-history domain.
 */
export type AxisBoundFn = (extent: { min: number; max: number }) => number;

export function axisBoundFn(
  edge: "min" | "max",
  options: Omit<AxisBoundsInput, "extent"> = {},
): AxisBoundFn {
  return (extent) => {
    if (!Number.isFinite(extent.min) || !Number.isFinite(extent.max)) return extent[edge];
    const bounds = resolveAxisBounds({ ...options, extent });
    return edge === "min" ? bounds.min : bounds.max;
  };
}

/* -------------------------------------------------------------------------- */
/* Plot geometry                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The plot rectangle every LUC chart shares.
 *
 * The point is that a stacked research stack shares one X domain: the data area
 * starts at the same inset on both sides whether the axis carries `$124.7K`,
 * `-33.1%` or nothing at all. The formatter classes therefore change *nothing*
 * about the geometry — the axis gutter is reserved, not measured per chart.
 *
 * The financial lane (Lightweight Charts) reaches the same geometry with
 * `minimumWidth` on its price scale; its own `scaleMargins` are the equivalent
 * of the value headroom `resolveAxisBounds` adds.
 */
export interface ChartPlotLayout {
  /** Distance from the canvas to the data area on a side without an axis. */
  edgeInset: number;
  /** Reserved width for a Y axis and its labels. */
  axisGutter: number;
  /** Headroom above the plot: room for an extreme tick, a halo or a glow. */
  topInset: number;
  /** Footroom below the plot: room for the axis line and the last tick. */
  bottomInset: number;
}

export const CHART_PLOT_LAYOUT: ChartPlotLayout = {
  edgeInset: 6,
  axisGutter: 60,
  topInset: 16,
  bottomInset: 12,
};

export interface ChartPlotRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  containLabel: false;
}

/**
 * Resolve the ECharts `grid` rectangle for a set of axis sides.
 *
 * `containLabel` stays **off**: letting ECharts grow the grid to fit whatever
 * labels a chart happens to render is exactly what made two stacked charts share
 * a crosshair but not a plot width.
 */
export function resolveChartPlotRect(
  yAxisSides: readonly AxisSide[],
  layout: ChartPlotLayout = CHART_PLOT_LAYOUT,
): ChartPlotRect {
  const hasLeft = yAxisSides.includes("left");
  const hasRight = yAxisSides.includes("right");
  return {
    left: hasLeft ? layout.axisGutter : layout.edgeInset,
    right: hasRight ? layout.axisGutter : layout.edgeInset,
    top: layout.topInset,
    bottom: layout.bottomInset,
    containLabel: false,
  };
}

/** The label margin inside a reserved gutter, in px. */
export const AXIS_LABEL_MARGIN = 8;
