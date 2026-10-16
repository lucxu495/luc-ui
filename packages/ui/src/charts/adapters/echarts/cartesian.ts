/**
 * Cartesian families: line, area, bar, scatter, bubble, composed, candlestick.
 *
 * One builder turns a `ChartSpec` into an ECharts option. Resembling each other
 * is the goal — a bar chart and a line chart in the same dashboard should share
 * an axis weight, a grid rhythm and a tooltip, and they do because they come
 * from here.
 */

import type {
  AxisSpec,
  ChartFormat,
  ChartPointMeta,
  ChartSpec,
  EventMarkerSpec,
  SeriesSpec,
} from "../../types";
import type { ChartTheme } from "../../core/theme";
import { paletteColor, toneColor, withAlpha } from "../../core/theme";
import { cell, extent, seriesValues, toNumber, type NormalizedTabular } from "../../core/data";
import { resolveFormatter } from "../../core/formatters";
import {
  DEFAULT_Y_AXIS_SIDE,
  axisBoundFn,
  normalizeScaleCapability,
  resolveAxisBounds,
  resolveScaleMode,
  type AxisSide,
  type ChartScaleCapability,
  type YScaleMode,
} from "../../core/axis";
import {
  axisFragment,
  baseOption,
  dataZoomFragment,
  gridForSides,
  tooltipShell,
  type AxisBoundInput,
  type MotionBudget,
  type Option,
} from "./option";
import { annotationMarks } from "./marks";
import {
  axisTooltipFormatter,
  escapeHtml,
  tooltipGridHtml,
  tooltipRuleHtml,
  tooltipShellHtml,
  type TooltipSeriesMeta,
} from "../../core/tooltip-html";

export interface CartesianInput {
  spec: ChartSpec<object>;
  theme: ChartTheme;
  motion: MotionBudget;
  normalized: NormalizedTabular;
  xFormat?: ChartFormat;
  /** The loaded extent's span, in ms (used by the tooltip's date header). */
  xSpanMs?: number;
  /**
   * The span the window currently shows, in ms.
   *
   * Drives only the **axis label** granularity: a 2Y view of a 15Y series must
   * label its ticks `Sep 26`, not repeat `2026`. The tooltip keeps the loaded
   * extent's precision, so nothing else about the chart changes.
   */
  xLabelSpanMs?: number;
  ariaLabel?: string;
  ariaDescription?: string;
}

/**
 * The vertical band a bottom series legend occupies, in plot pixels.
 *
 * One row of swatches plus the axis labels beneath it. Enumerated here so the
 * grid and the legend cannot disagree about how much room the control has.
 */
const LEGEND_BAND_PX = 48;

/**
 * Value-axis padding for a **horizontal** ranked bar that prints its numbers.
 *
 * The printed value sits just past the bar's outer end, so the outermost bar
 * needs room for a label, not just for its stroke — otherwise the number lands
 * on top of the category labels in the left gutter. Wide enough for a signed
 * percent at the caption size, and it moves one axis edge only (the zero edge of
 * a one-signed family is still pinned, because a baseline mark must keep its
 * baseline).
 */
const VALUE_LABEL_AXIS_PADDING = 0.18;

function axisIdOf(series: SeriesSpec): string {
  return series.axis ?? "primary";
}

function findAxis(axes: readonly AxisSpec[] | undefined, id: string): AxisSpec {
  return axes?.find((axis) => (axis.id ?? "primary") === id) ?? {};
}

/**
 * The key a point's caller-supplied metadata is stored under.
 *
 * A time axis holds millisecond numbers while the caller keys by the ISO date it
 * reads in the payload, so both resolve to the same `YYYY-MM-DD`; a category or
 * value axis keeps its own string form.
 */
function pointKeyOf(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? String(value) : value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
  }
  return String(value ?? "");
}

/**
 * The declared scale capability for a chart.
 *
 * An axis-level `scaleMode` is the older, single-axis spelling: a chart that
 * declares only a default (no allow-list) is linear-only, exactly as before, and
 * `spec.scale` is what turns the reader's Linear/Log control on. Signed and
 * percentage analytics therefore stay linear unless the product says otherwise.
 */
function scaleCapabilityOf(spec: ChartSpec<object>): ChartScaleCapability {
  if (spec.scale) {
    const declared = normalizeScaleCapability(spec.scale);
    // A chart that names a default but no allow-list is offering both modes —
    // the one useful reading of `{ default: "log" }`.
    if (!spec.scale.allowed) {
      return { allowedScaleModes: ["linear", "log"], defaultScaleMode: declared.defaultScaleMode };
    }
    return declared;
  }
  const axisMode = spec.axes?.find((axis) => axis.scaleMode)?.scaleMode;
  return normalizeScaleCapability(axisMode ? { allowed: [axisMode], default: axisMode } : null);
}

function axisSideOf(axis: AxisSpec, index: number): AxisSide {
  // An ordinary single-axis chart puts its plate on the right; a genuine second
  // axis keeps the conventional left side so the two units stay visually distinct.
  if (axis.position) return axis.position;
  return index === 0 ? DEFAULT_Y_AXIS_SIDE : "left";
}

/** Should this axis keep zero as a fixed baseline edge? */
function needsZeroBaseline(spec: ChartSpec<object>, family: string, axisId: string): boolean {
  const declared = findAxis(spec.axes, axisId).zeroBaseline;
  if (declared !== undefined) return declared;
  // A histogram's bars and a waterfall's contributions are measured from zero:
  // the baseline is part of the meaning, so it must not float with the padding.
  if (family === "histogram" || family === "waterfall") return true;
  return spec.series.some((series) => {
    if (axisIdOf(series) !== axisId) return false;
    const type = series.type ?? (family === "area" ? "area" : family === "bar" ? "bar" : "line");
    return type === "bar" || type === "area" || type === "boxplot";
  });
}

/**
 * A bound for one edge of one axis.
 *
 * Explicit `min`/`max` win. Otherwise the edge gets the shared domain policy:
 * proportional headroom that follows the *visible* extent (so a zoom keeps its
 * padding instead of freezing the full-history domain), a fixed zero baseline
 * where the marks are measured from zero, and a bounded snap to readable ticks.
 */
function axisBound(
  declared: AxisBoundInput | undefined,
  edge: "min" | "max",
  options: {
    scaleMode: YScaleMode;
    zeroBaseline: boolean;
    marker: boolean;
    padding?: number;
    /** Declared non-data levels (reference lines, y bands) that must stay visible. */
    include?: readonly number[];
  },
): AxisBoundInput | undefined {
  if (declared !== undefined) return declared;
  // A log axis must not be snapped to a zero baseline: `min: 0` is not on a log
  // scale at all.
  const zeroBaseline = options.scaleMode === "log" ? false : options.zeroBaseline;
  return axisBoundFn(edge, {
    scaleMode: options.scaleMode,
    zeroBaseline,
    marker: options.marker,
    padding: options.padding,
    include: options.include,
  });
}

/**
 * The declared levels that belong on one axis.
 *
 * Reference lines and y-bands are part of what a chart says, so the domain
 * grows to include them; a threshold that fell outside the axis would silently
 * disappear. A log axis can only carry positive levels.
 */
function declaredLevels(spec: ChartSpec<object>, axisId: string, scaleMode: YScaleMode): number[] {
  const target = (candidate?: string) => (candidate ?? "primary") === axisId;
  const levels: number[] = [];
  for (const line of spec.annotations?.referenceLines ?? []) {
    if (line.axis === "x" || !target(line.targetAxis)) continue;
    if (typeof line.value === "number" && Number.isFinite(line.value)) levels.push(line.value);
  }
  for (const band of spec.annotations?.referenceBands ?? []) {
    if (band.axis === "x" || !target(band.targetAxis)) continue;
    for (const bound of [band.from, band.to]) {
      if (typeof bound === "number" && Number.isFinite(bound)) levels.push(bound);
    }
  }
  return scaleMode === "log" ? levels.filter((value) => value > 0) : levels;
}

export function seriesColor(theme: ChartTheme, series: SeriesSpec, index: number): string {
  if (series.color) return series.color;
  if (series.palette) return paletteColor(theme, series.palette - 1);
  return toneColor(theme, series.tone, index);
}

/** Presentation-only percentage normalisation for `stackMode: "percent"`. */
function percentStacks(spec: ChartSpec<object>, normalized: NormalizedTabular): Map<string, (number | null)[]> {
  const groups = new Map<string, SeriesSpec[]>();
  for (const series of spec.series) {
    if (series.stackMode !== "percent") continue;
    const key = series.stack ?? "default";
    const list = groups.get(key);
    if (list) list.push(series);
    else groups.set(key, [series]);
  }
  const result = new Map<string, (number | null)[]>();
  for (const group of groups.values()) {
    const values = group.map((series) => seriesValues(series, normalized.rows));
    const totals = normalized.rows.map((_, index) =>
      values.reduce((sum, seriesValuesList) => sum + (seriesValuesList[index] ?? 0), 0),
    );
    group.forEach((series, seriesIndex) => {
      result.set(
        series.key,
        values[seriesIndex]!.map((value, index) => {
          const total = totals[index];
          if (value === null || !total) return null;
          return (value / total) * 100;
        }),
      );
    });
  }
  return result;
}

function lineTypeOf(series: SeriesSpec): string {
  switch (series.lineType) {
    case "dashed":
      return "dashed";
    case "dotted":
      return "dotted";
    default:
      return "solid";
  }
}

function symbolOf(series: SeriesSpec, pointCount: number): string | boolean {
  if (series.symbol === false || series.symbol === "none") return false;
  if (typeof series.symbol === "string") return series.symbol;
  return series.symbol === true || pointCount <= 60 ? "circle" : false;
}

function seriesFragment(
  series: SeriesSpec,
  index: number,
  input: CartesianInput,
  overrides: { values?: (number | null)[]; categoryX?: boolean; swap?: boolean },
): Option {
  const { theme, normalized } = input;
  const color = seriesColor(theme, series, index);
  const values = overrides.values ?? seriesValues(series, normalized.rows);
  const type = series.type ?? (input.spec.family === "area" ? "area" : "line");

  const data =
    overrides.categoryX || overrides.swap
      ? values
      : values.map((value, rowIndex) => [normalized.x[rowIndex], value]);

  const base: Option = {
    id: series.key,
    name: series.label ?? series.key,
    color,
    data,
    emphasis: { focus: "series" },
    ...(series.opacity !== undefined ? { opacity: series.opacity } : {}),
    ...(series.z !== undefined ? { z: series.z } : {}),
  };

  if (type === "bar") {
    const barMax = 26;
    const horizontal = input.spec.orientation === "horizontal";
    // A horizontal ranked bar prints the number *past the bar end*; a vertical
    // one sits above the cap. The label is the series' own formatted value, so
    // an annual return reads "+95%" and never a raw ratio.
    const valueFormatter = series.valueLabels ? resolveFormatter(series) : null;
    return {
      ...base,
      type: "bar",
      // A signed bar's end is on either side of zero, so the label anchors to
      // the *outer* end of each bar rather than a single series-wide side.
      ...(valueFormatter
        ? {
            data: data.map((entry) => {
              const raw = Array.isArray(entry) ? entry[1] : entry;
              const numeric = typeof raw === "number" ? raw : Number(raw);
              const position = horizontal ? (Number.isFinite(numeric) && numeric < 0 ? "left" : "right") : "top";
              return { value: entry, label: { position } };
            }),
          }
        : {}),
      barMaxWidth: barMax,
      barCategoryGap: "38%",
      itemStyle: {
        color,
        borderRadius: horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0],
      },
      ...(valueFormatter
        ? {
            label: {
              show: true,
              position: horizontal ? "right" : "top",
              distance: 4,
              color: theme.textMuted,
              fontFamily: theme.monoFamily,
              fontSize: theme.fontMicro,
              formatter: (params: { value?: unknown }) => {
                const raw = Array.isArray(params.value) ? params.value[1] : params.value;
                const numeric = typeof raw === "number" ? raw : Number(raw);
                return Number.isFinite(numeric) ? valueFormatter(numeric) : "";
              },
            },
          }
        : {}),
      ...(series.stack ? { stack: series.stack } : {}),
    };
  }

  if (type === "scatter") {
    const bubble = input.spec.family === "bubble";
    const sizes = series.sizeKey
      ? normalized.rows.map((row) => toNumber(cell(row, series.sizeKey!)))
      : null;
    const maxSize = sizes ? Math.max(1, ...sizes.filter((value): value is number => value !== null)) : 1;
    const sizedData = sizes
      ? values.map((value, rowIndex) => [normalized.x[rowIndex], value, sizes[rowIndex] ?? 0])
      : data;
    return {
      ...base,
      type: "scatter",
      data: sizedData,
      symbolSize: sizes
        ? (value: unknown) => {
            const size = Array.isArray(value) ? Number(value[2]) : 0;
            return 5 + (Math.sqrt(Math.max(0, size)) / Math.sqrt(maxSize)) * 20;
          }
        : bubble
          ? 14
          : 9,
      itemStyle: { color, opacity: 0.85, borderColor: withAlpha(color, 0.35), borderWidth: 1 },
      /*
       * Point focus (V1.2): the hovered observation grows, gains a solid halo
       * and keeps a lit border, so a scatter reads as "this point" rather than
       * "a slightly bigger dot".
       */
      emphasis: {
        focus: "series",
        scale: 1.6,
        itemStyle: {
          opacity: 1,
          borderColor: theme.surface,
          borderWidth: 1.5,
          shadowBlur: 16,
          shadowColor: withAlpha(color, 0.55),
        },
      },
    };
  }

  const area = type === "area" || series.area === true;
  const width = series.lineWidth ?? (area ? 1.75 : 2);

  return {
    ...base,
    type: "line",
    smooth: series.smooth ?? false,
    clip: false,
    ...(series.step ? { step: series.step === true ? "end" : series.step } : {}),
    showSymbol: symbolOf(series, values.length),
    symbolSize: 6,
    connectNulls: false,
    lineStyle: {
      color,
      width,
      type: lineTypeOf(series),
      cap: "round",
      join: "round",
    },
    itemStyle: { color, borderWidth: 0 },
    ...(series.stack ? { stack: series.stack, areaStyle: undefined } : {}),
    ...(area
      ? {
          areaStyle: series.areaGradient === false
            ? { color: withAlpha(color, 0.16) }
            : {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: withAlpha(color, 0.26) },
                    { offset: 1, color: withAlpha(color, 0.01) },
                  ],
                },
              },
          // A filled area reads better with a slightly quieter stroke.
          lineStyle: { color, width: series.lineWidth ?? 1.75, type: lineTypeOf(series) },
        }
      : {}),
    /*
     * Series focus (V1.2): the focused stroke thickens and picks up a soft glow.
     * The dimming of the peers is declared once in `baseOption`'s `blur`, so the
     * two halves of the effect can never drift apart between chart families.
     */
    emphasis: {
      focus: "series",
      lineStyle: { width: width + 1.25, shadowBlur: 14, shadowColor: withAlpha(color, 0.5) },
      itemStyle: { borderColor: theme.surface, borderWidth: 1.5 },
      ...(area ? { areaStyle: { opacity: 0.34 } } : {}),
    },
  };
}

function annotationFragment(input: CartesianInput): Option {
  const primary = input.spec.series[0];
  const primaryValues = primary ? seriesValues(primary, input.normalized.rows) : [];
  const markerY = extent(primaryValues)?.[1] ?? 0;
  /*
   * A marker's x extent is what an `auto` label anchor is measured against, so
   * the marks builder can keep an edge marker's label inside the plot. A
   * category axis has no numeric extent — its markers stay centred.
   */
  const xExtent = extent(input.normalized.numericX);
  return annotationMarks(input.theme, input.spec.annotations, markerY, xExtent);
}

/** The numeric x an annotation marker sits on, whatever type its `at` is. */
function markerX(value: number | string | Date): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The tooltip block an event annotation contributes at its own date.
 *
 * A compact marker (one that carries `detail`) draws no permanent label, so the
 * exact event has to be readable somewhere. It belongs in the chart's existing
 * tooltip: hovering the date of a halving, a cycle high or a cycle low appends
 * that event's own served fields under the series rows. Nothing is derived — the
 * chart formats the caller's rows — and an ordinary date contributes nothing.
 */
function eventDetailFooter(
  markers: readonly EventMarkerSpec[],
): ((params: unknown) => string) | undefined {
  const detailed = markers.filter((marker) => (marker.detail?.length ?? 0) > 0);
  if (detailed.length === 0) return undefined;
  const positioned = detailed
    .map((marker) => ({ marker, x: markerX(marker.at) }))
    .filter((entry): entry is { marker: EventMarkerSpec; x: number } => entry.x !== null)
    .sort((left, right) => left.x - right.x);
  if (positioned.length === 0) return undefined;
  return (params: unknown) => {
    const items = (Array.isArray(params) ? params : [params]) as Array<{ axisValue?: unknown }>;
    const raw = items[0]?.axisValue;
    const x = raw instanceof Date ? raw.getTime() : typeof raw === "number" ? raw : Number.NaN;
    if (!Number.isFinite(x)) return "";
    /*
     * The axis pointer snaps to the nearest *observation*, which for a dense
     * daily series is a sub-pixel column: requiring the hovered date to equal the
     * event date exactly would make the detail fire only when the pointer lands
     * on that one column. The event that is within `EVENT_DETAIL_TOLERANCE_MS` of
     * the hovered date is therefore the one reported — the marker is at most a
     * few bars away — and the nearest of several candidates wins.
     */
    const nearest = positioned.reduce<{ marker: EventMarkerSpec; x: number; distance: number } | null>(
      (best, entry) => {
        const distance = Math.abs(entry.x - x);
        if (distance > EVENT_DETAIL_TOLERANCE_MS) return best;
        if (best && best.distance <= distance) return best;
        return { ...entry, distance };
      },
      null,
    );
    if (!nearest) return "";
    return [nearest.marker]
      .map(
        (marker) =>
          tooltipRuleHtml() +
          `<span class="luc-chart-tooltip__subtitle">${escapeHtml(marker.label)}</span>` +
          tooltipGridHtml(marker.detail ?? []),
      )
      .join("");
  };
}

/**
 * How far, in milliseconds, an event may sit from the hovered observation.
 *
 * Three days covers the neighbouring bars of a daily or weekly chronology
 * without reaching the next event on the same axis (a halving and a cycle
 * extreme are never that close).
 */
const EVENT_DETAIL_TOLERANCE_MS = 3 * 86_400_000;

export function buildCartesianOption(input: CartesianInput): Option {
  const { spec, theme, motion, normalized } = input;
  const family = spec.family;
  const swap = family === "bar" && spec.orientation === "horizontal";
  const axisIds = [...new Set(spec.series.map(axisIdOf))];
  const percent = percentStacks(spec, normalized);
  const stackedPercent = percent.size > 0;

  const xKind = normalized.kind;
  /*
   * Positional x means "place the mark at this number on the axis" (depth,
   * scatter, curves with a numeric x). Otherwise a numeric x is an ordering —
   * which is what a line chart over an index wants.
   */
  const positionalX =
    xKind === "time" ||
    (xKind === "value" && spec.x?.type === "value") ||
    family === "scatter" ||
    family === "bubble";
  const categoryX = !positionalX;
  /*
   * The axis type follows the *decision*, not the inferred kind.
   *
   * These were derived separately and disagreed: `positionalX` above decides
   * that a numeric x which is not declared positional is an *ordering*, so the
   * series carry plain values and the axis carries the labels — but the axis was
   * still built as `type: "value"` whenever the inferred kind was `"value"`. A
   * value axis ignores `axis.data`, and it reads a plain number as a coordinate
   * pair, so the marks were plotted at `(y, y)`: a straight diagonal from the
   * minimum to the maximum of the series, with an axis that agreed with itself
   * and with nothing else. Silent, plausible and wrong — the worst kind.
   *
   * A horizontal bar swaps the roles instead of using a category x (its
   * categories live on the y plate), so `swap` keeps the value axis here.
   */
  const xAxisType: "time" | "category" | "value" =
    xKind === "time" ? "time" : categoryX && !swap ? "category" : "value";

  /*
   * The caller's per-point display metadata, if any: a better axis label for a
   * point and extra tooltip rows. The engine only looks them up by the point's
   * own x value; it never interprets the strings.
   */
  const pointMeta = spec.points;
  const metaFor = (value: unknown): ChartPointMeta | undefined =>
    pointMeta ? pointMeta[pointKeyOf(value)] : undefined;

  /*
   * A category axis needs its labels supplied explicitly. Omitting `data` makes
   * ECharts label the axis with the series index, which is the single most
   * common way a chart silently ends up mislabelled.
   */
  const categoryLabels = normalized.x.map((value) =>
    metaFor(value)?.label ??
    (value instanceof Date ? value.toISOString().slice(0, 10) : String(value)),
  );
  const hasCategoryAxis = categoryX || swap;

  const xAxisBase: Option = {
    ...axisFragment({
      theme,
      type: xAxisType,
      format: input.xFormat,
      spanMs: input.xSpanMs,
      labelSpanMs: input.xLabelSpanMs,
      baseline: family === "bar" || family === "waterfall",
      showGrid: family === "scatter" || family === "bubble",
      // A time axis prints the caller's own label for a tick it names (a fiscal
      // identity), and the engine's date otherwise.
      pointLabel: pointMeta ? (value: number) => metaFor(value)?.label : undefined,
    }),
    ...(hasCategoryAxis ? { data: categoryLabels } : {}),
  };

  /*
   * The scale capability is resolved once, with one requested mode for the whole
   * chart: two series in one plot can never disagree about their axis. Log is
   * only honoured for strictly positive data; anything else falls back to linear
   * and says so in development rather than drawing an axis pinned to `[1, 10]`.
   */
  const capability = scaleCapabilityOf(spec);
  const axisValues = spec.series.flatMap((series) =>
    percent.get(series.key) ?? seriesValues(series, normalized.rows),
  );
  const declaredLog = Boolean(
    spec.axes?.some((axis) => axis.type === "log" || axis.scaleMode === "log"),
  );
  const requested: YScaleMode | null =
    spec.scale?.mode ?? spec.scale?.default ?? (declaredLog ? "log" : null);
  const resolvedScale = resolveScaleMode({ requested, capability, values: axisValues });
  if (resolvedScale.fallback === "non-positive-data" && process.env.NODE_ENV !== "production") {
    console.warn(
      `[luc-ui] chart "${spec.id ?? spec.family}" requested a log scale over data that is not ` +
        `strictly positive; falling back to linear. Log is only valid for positive levels.`,
    );
  }

  const yAxes: Option[] = axisIds.map((id, index) => {
    const axisSpec = findAxis(spec.axes, id);
    const firstSeries = spec.series.find((series) => axisIdOf(series) === id);
    const zeroBaseline = needsZeroBaseline(spec, family, id);
    /*
     * A single-axis chart is linear or log as a whole. A declared multi-axis
     * chart keeps log to the axis that asked for it (a log price beside a linear
     * volume, never a log oscillator).
     */
    const axisScaleMode: YScaleMode =
      resolvedScale.mode === "log" &&
      (axisIds.length === 1 || axisSpec.type === "log" || axisSpec.scaleMode === "log")
        ? "log"
        : "linear";
    const boundOptions = {
      scaleMode: axisScaleMode,
      zeroBaseline,
      // Marker headroom matters only where a marker is actually drawn on this axis.
      marker: spec.series.some(
        (series) => axisIdOf(series) === id && series.currentPoint === true,
      ),
      /*
       * A horizontal ranked bar prints each value past its own bar end, so the
       * axis that carries those values reserves the extra headroom the numbers
       * need. A declared padding still wins.
       */
      padding:
        axisSpec.padding ??
        (spec.orientation === "horizontal" && spec.series.some((series) => series.valueLabels)
          ? VALUE_LABEL_AXIS_PADDING
          : undefined),
      include: declaredLevels(spec, id, axisScaleMode),
    };
    /*
     * The label visibility is decided from the *full* extent, once, so the two
     * axis plates of a stack keep the same label rhythm. The bounds themselves
     * are functions, so a zoom still keeps its headroom.
     */
    const axisValuesForAxis = spec.series
      .filter((series) => axisIdOf(series) === id)
      .flatMap((series) => percent.get(series.key) ?? seriesValues(series, normalized.rows));
    const dataExtent = extent(axisValuesForAxis);
    const labels = dataExtent
      ? resolveAxisBounds({
          ...boundOptions,
          extent: {
            min: Math.min(dataExtent[0], ...boundOptions.include),
            max: Math.max(dataExtent[1], ...boundOptions.include),
          },
        })
      : null;
    return {
      ...axisFragment({
        theme,
        type: axisScaleMode === "log" ? "log" : "value",
        name: axisSpec.label,
        position: axisSideOf(axisSpec, index),
        format: axisSpec.format ?? (stackedPercent ? { kind: "percent" } : firstSeries?.format),
        min: stackedPercent ? (axisSpec.min ?? 0) : axisBound(axisSpec.min, "min", boundOptions),
        max: stackedPercent ? (axisSpec.max ?? 100) : axisBound(axisSpec.max, "max", boundOptions),
        // A padded edge is headroom, not a reported value: keep its tick, drop
        // its number. A declared bound is a real value and keeps its label.
        hideMinLabel: !stackedPercent && axisSpec.min === undefined && (labels?.minHeadroom ?? false),
        hideMaxLabel: !stackedPercent && axisSpec.max === undefined && (labels?.maxHeadroom ?? false),
        hidden: axisSpec.hidden,
      }),
      ...(index > 0 ? { splitLine: { show: false } } : {}),
    };
  });

  const categoryAxisFragment: Option = {
    ...axisFragment({
      theme,
      type: "category",
      // Used as the Y axis of a horizontal bar chart, where the category labels
      // belong on the left and the value plate keeps the right side.
      position: "left",
      baseline: true,
      showGrid: false,
    }),
    data: categoryLabels,
  };

  const xAxes: Option[] = swap ? [{ ...yAxes[0] }] : [xAxisBase];
  const finalYAxes: Option[] = swap
    ? [categoryAxisFragment, ...yAxes.slice(1)]
    : yAxes.length
      ? yAxes
      : [
          axisFragment({
            theme,
            type: "value",
            position: DEFAULT_Y_AXIS_SIDE,
            format: spec.series[0]?.format,
          }),
        ];

  const metaById = new Map<string, TooltipSeriesMeta>();
  spec.series.forEach((series, index) => {
    // A tooltip row inherits the format of the axis its series is bound to, so a
    // funding rate on a percent axis reads "0.04%" in the axis, the legend and
    // the tooltip instead of drifting into a compact "-0".
    const axisFormat = findAxis(spec.axes, axisIdOf(series)).format;
    metaById.set(series.key, {
      id: series.key,
      label: series.label ?? series.key,
      color: seriesColor(theme, series, index),
      format: resolveFormatter(series, axisFormat ?? spec.series[0]?.format),
    });
  });

  const targetAxisIndex = (series: SeriesSpec): number => {
    const id = axisIdOf(series);
    const index = axisIds.indexOf(id);
    if (swap) return 0;
    return index < 0 ? 0 : index;
  };

  const seriesOptions = spec.series.map((series, index) => {
    const fragment = seriesFragment(series, index, input, {
      values: percent.get(series.key),
      categoryX: categoryX && !swap,
      swap,
    });
    const annotation = index === 0 ? annotationFragment(input) : {};
    return {
      ...fragment,
      xAxisIndex: 0,
      yAxisIndex: targetAxisIndex(series),
      ...annotation,
    };
  });

  /*
   * The current-point layer.
   *
   * A `line` series can show a symbol on hover, but "where are we now" should be
   * visible without interaction. We append one `effectScatter` series holding a
   * single real coordinate — the latest non-null observation of whichever series
   * asked for it — which draws a bright core plus a ripple halo. It is a
   * separate series on purpose: it never joins the tooltip's axis readout, never
   * affects the axis extent and never touches the data it marks.
   *
   * The ripple is an ambient loop, so it is only enabled when the resolved chart
   * motion allows it; reduced motion keeps the core and drops the ripple.
   */
  const currentPointSeries = spec.series.flatMap((series, index) => {
    if (!series.currentPoint) return [];
    const values = percent.get(series.key) ?? seriesValues(series, normalized.rows);
    let lastIndex = -1;
    for (let cursor = values.length - 1; cursor >= 0; cursor -= 1) {
      if (values[cursor] !== null && Number.isFinite(values[cursor] as number)) {
        lastIndex = cursor;
        break;
      }
    }
    if (lastIndex < 0) return [];
    const color = seriesColor(theme, series, index);
    const x = categoryX && !swap ? categoryLabels[lastIndex] : normalized.x[lastIndex];
    const point = [x, values[lastIndex] as number];
    return [
      {
        id: `${series.key}__current`,
        type: "effectScatter",
        name: `${series.label ?? series.key} (current)`,
        color,
        data: [point],
        xAxisIndex: 0,
        yAxisIndex: targetAxisIndex(series),
        symbolSize: 9,
        itemStyle: { color, borderColor: theme.surface, borderWidth: 2 },
        rippleEffect: {
          scale: 3.2,
          brushType: "stroke",
          period: 2.6,
          color,
        },
        // `render` starts the ripple immediately; hover-only keeps it calm.
        showEffectOn: (motion.emphasis ?? 0) > 0 ? "render" : "emphasis",
        silent: true,
        z: 8,
        tooltip: { show: false },
        emphasis: { disabled: true },
      },
    ];
  });

  const tooltip =
    spec.tooltip?.mode === "none"
      ? tooltipShell(theme, { formatter: () => "", mode: "none" })
      : tooltipShell(theme, {
          mode: spec.tooltip?.mode ?? (family === "scatter" || family === "bubble" ? "item" : "axis"),
          formatter:
            family === "scatter" || family === "bubble"
              ? itemScatterFormatter(input)
              : axisTooltipFormatter({
                  theme,
                  metaById,
                  xFormat: input.xFormat,
                  xIsTime: normalized.kind === "time",
                  spanMs: input.xSpanMs,
                  sort: spec.tooltip?.sort,
                  total: spec.tooltip?.total,
                  // The caller's own point context (a period end, a filing form)
                  // is appended to the tooltip of the point it names.
                  pointDetail: pointMeta
                    ? (item) => {
                        const index = item.dataIndex;
                        if (typeof index !== "number") return undefined;
                        return metaFor(normalized.x[index])?.detail;
                      }
                    : undefined,
                  // A compact event marker (a halving, a cycle high/low) has no
                  // permanent label, so its served fields are appended to the
                  // tooltip of its own date instead.
                  footer: eventDetailFooter(spec.annotations?.markers ?? []),
                }),
        });

  const zoom = dataZoomFragment({
    theme,
    interaction: spec.interaction,
    axisIndices: categoryX ? [0] : [0],
  });

  /*
   * The **series legend** — one control, two jobs (read the series, change which
   * are drawn).
   *
   * A multi-series chart is unreadable while every series is drawn at once: a
   * price and three moving averages, an ADX with its two directional lines, a
   * MACD pair. The engine already knows which mark belongs to which series, so
   * the legend is expressed *in the engine* rather than as a parallel control a
   * caller would have to keep in sync with the plot.
   *
   * The data list is the **declared series** only, so an engine-appended
   * companion mark — the never-tooltipped "current point" marker — can never
   * appear as a toggle. Toggling is `multiple` (any subset may be hidden), which
   * is the honest model: the reader is choosing what to look at, and no
   * combination is a claim about the data. Nothing here touches the values;
   * hiding a series is a view state inside the engine.
   */
  const legendNames = spec.series
    // A context series (a price trajectory behind a measurement) opts out: its
    // switch lives in the chart chrome, not in the legend of comparable series.
    .filter((series) => series.legend !== false)
    .map((series) => series.label ?? series.key)
    .filter((name, index, names) => names.indexOf(name) === index);
  const showLegend = spec.legend === true && legendNames.length >= 2;
  const legendFragment: Option = showLegend
    ? {
        legend: {
          show: true,
          data: legendNames,
          type: "scroll",
          bottom: 0,
          left: "center",
          padding: [6, 0, 0, 0],
          itemGap: 14,
          itemWidth: 10,
          itemHeight: 10,
          icon: "roundRect",
          // A hidden series stays legible (and re-selectable) rather than
          // vanishing from the control that would bring it back.
          inactiveColor: theme.textMuted,
          textStyle: { color: theme.textMuted, fontSize: theme.fontCaption, fontFamily: theme.fontFamily },
          pageTextStyle: { color: theme.textMuted },
          pageIconColor: theme.accent,
          pageIconInactiveColor: theme.textMuted,
          selectedMode: "multiple",
        },
      }
    : {};

  const option: Option = {
    ...baseOption(theme, motion, {
      universal: spec.universalTransition,
      threshold: spec.pointCount !== undefined && spec.pointCount > 4000 ? 1 : undefined,
    }),
    /*
     * One plot rectangle per chart, derived from which sides carry a Y axis.
     * That is what makes a stacked column share one X domain: the gutter is
     * reserved for the axis, not measured from whatever label happens to render.
     */
    grid: gridForSides(
      finalYAxes.map((axis) => ((axis.position as AxisSide | undefined) ?? DEFAULT_Y_AXIS_SIDE)),
      // The legend lives in the plot's own rectangle, so the reading area has to
      // give up the band it occupies — otherwise the control covers the axis.
      showLegend ? { bottom: LEGEND_BAND_PX } : {},
    ),
    xAxis: xAxes,
    yAxis: finalYAxes,
    series: [...seriesOptions, ...currentPointSeries],
    tooltip,
    ...legendFragment,
    ...(zoom.length ? { dataZoom: zoom } : {}),
    ...(spec.interaction?.brush
      ? {
          brush: {
            toolbox: ["rect", "clear"],
            xAxisIndex: 0,
            brushStyle: { borderWidth: 1, color: theme.band, borderColor: theme.accent },
          },
        }
      : {}),
  };

  spec.extendOption?.(option);
  return option;
}

/** Scatter/bubble tooltip: x, y and (for bubbles) the third dimension. */
function itemScatterFormatter(input: CartesianInput): (params: unknown) => string {
  const { spec } = input;
  const formats = spec.series.map((series) => resolveFormatter(series, spec.series[0]?.format));
  return (params: unknown) => {
    const item = (Array.isArray(params) ? params[0] : params) as {
      seriesIndex?: number;
      seriesId?: string;
      seriesName?: string;
      value?: unknown;
      dataIndex?: number;
    };
    const value = item.value;
    const seriesIndex = spec.series.findIndex((series) => series.key === item.seriesId);
    const format = formats[seriesIndex >= 0 ? seriesIndex : 0] ?? formats[0];
    const rows: Array<[string, string]> = [];
    if (Array.isArray(value)) {
      rows.push(["X", String(value[0])]);
      rows.push(["Y", format?.(Number(value[1])) ?? String(value[1])]);
      if (value.length > 2) rows.push(["Size", String(value[2])]);
    } else {
      rows.push(["Value", format?.(Number(value)) ?? String(value)]);
    }
    const label = spec.series[seriesIndex]?.label ?? item.seriesName;
    return tooltipShellHtml(label, tooltipGridHtml(rows));
  };
}
