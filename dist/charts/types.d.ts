import { AxisSide, YScaleMode } from "./core/axis.js";
import { NumericFormatKind } from "../utils/format.js";
//#region src/charts/types.d.ts
export type ChartEngine = "echarts" | "lightweight-charts" | "visx" | "svg";
/**
 * The drawing layer an engine paints into.
 *
 * Distinct from {@link ChartEngine}: an engine is *what computes the picture*
 * (ECharts, Lightweight Charts), a renderer is *how it is laid down* (raster
 * pixels or vector elements). Only ECharts offers both. The distinction matters
 * to a capture pipeline — vector output stays sharp in a PDF, raster output
 * does not — and to nobody else, which is why it is one optional property
 * rather than a per-component mode flag.
 */
export type ChartRenderer = "canvas" | "svg";
/** Broad shape of a chart. Families group the components, not the engines. */
export type ChartFamily = "line" | "area" | "bar" | "waterfall" | "scatter" | "bubble" | "histogram" | "boxplot" | "heatmap" | "pie" | "treemap" | "sunburst" | "funnel" | "sankey" | "graph" | "radar" | "gauge" | "composed" | "candlestick" | "depth" | "curve";
/** Legacy union kept for `ChartDefinition` compatibility; widened for V0.2. */
export type ChartType = ChartFamily | "table";
/**
 * Semantic roles. A tone maps to a token, never to a literal colour, so a
 * product theme can re-point it. `accent`/`info`/`neutral` are categorical;
 * `positive`/`negative`/`warning` carry direction and are never used for
 * arbitrary series.
 */
export type SeriesTone = "accent" | "positive" | "negative" | "warning" | "info" | "neutral";
export type ChartFormatKind = NumericFormatKind | "bps" | "ratio" | "integer" | "date" | "datetime" | "duration";
/**
 * Presentation-only description of a value. Charts never convert units — a
 * formatter renders what it is given. See `charts/core/formatters.ts`.
 */
export interface ChartFormat {
  kind?: ChartFormatKind;
  /** ISO-4217 code for `kind: "currency"`. */
  currency?: string;
  decimals?: number;
  compact?: boolean;
  signed?: boolean;
  suffix?: string;
  prefix?: string;
  locale?: string;
  /** IANA zone for date kinds. Defaults to UTC so screenshots are stable. */
  timeZone?: string;
}
/**
 * A cell value. Every chart input is one of these.
 */
export type ChartValue = string | number | null | undefined | Date;
/**
 * One row of a tabular data feed. Values are already prepared by the caller.
 *
 * Row types are constrained to `object` rather than to `ChartRow`, because a
 * concrete interface (`interface Quote { close: number }`) has no index
 * signature and would otherwise not be accepted. The adapters read cells
 * defensively, so the looser constraint costs nothing at runtime.
 */
export type ChartRow = Record<string, ChartValue>;
/** `[x, y]` pairs for scatter/line data that is not keyed off rows. */
export type ChartPoint = readonly [number | string | Date, number | null];
export type ChartXValue = number | string | Date;
/**
 * Per-point display metadata supplied by the caller.
 *
 * A chart's x values are data — a timestamp, a period end, a code. Sometimes the
 * caller also knows a *better label* for one of them (a fiscal identity such as
 * `FY26 Q1` for the date the period ended) and a few extra context rows worth
 * reading on hover (the period end, the form that carried it, when it became
 * public). The engine attaches the label and draws the rows; it assigns them no
 * meaning and never interprets the value behind them.
 *
 * Keyed by the point's x value in its canonical string form: the ISO date
 * (`YYYY-MM-DD`) for a time axis, the raw value for a category axis.
 */
export interface ChartPointMeta {
  /** The text the axis prints for this point. Absent keeps the axis's own label. */
  label?: string;
  /** Extra `[label, value]` rows appended to this point's tooltip. */
  detail?: readonly (readonly [string, string])[];
}
/**
 * A chart's animation budget.
 *
 * - `none` — render the final frame immediately (print, export, a chart whose
 *   motion would compete with a neighbour).
 * - `subtle` — a short draw; the default for dense or secondary charts.
 * - `standard` — the default: a readable entrance, an immediate update.
 * - `emphasized` — one focal chart on a page may draw with more intent.
 *
 * Nothing here enables *continuous* motion: a chart animates on draw, on an
 * update, and on hover. Never on a loop.
 */
export type ChartAnimationPreset = "none" | "subtle" | "standard" | "emphasized";
export interface AxisSpec {
  /** Axis id. `primary` and `secondary` are conventional, not special-cased. */
  id?: string;
  /**
   * Axis kind. `"log"` is the legacy spelling of `scaleMode: "log"` and is still
   * honoured; prefer `scaleMode`.
   */
  type?: "value" | "time" | "category" | "log";
  /**
   * Which side the axis plate sits on. Defaults to `"right"` for an ordinary
   * single-axis chart — see `DEFAULT_Y_AXIS_SIDE`. Use `"left"` only for a
   * genuinely different second unit or a documented plate convention.
   */
  position?: AxisSide;
  /**
   * Presentation scale. Nothing upstream is transformed: the adapter maps the
   * same real values linearly or logarithmically. A log request over data that
   * contains a zero or a negative falls back to linear.
   */
  scaleMode?: YScaleMode;
  label?: string;
  format?: ChartFormat;
  min?: number | "dataMin";
  max?: number | "dataMax";
  /** Let the engine pick round bounds. Defaults to true. */
  nice?: boolean;
  /**
   * Keep zero as a fixed baseline edge (bars, areas, box plots, and signed
   * metrics whose zero is meaningful). Never pads across zero.
   */
  zeroBaseline?: boolean;
  /** Display headroom as a fraction of the span. Defaults to the axis policy. */
  padding?: number;
  /** A marker (current point, halo) sits on the extreme values. */
  marker?: boolean;
  /** Hide the axis line/labels entirely (sparkline-style small multiples). */
  hidden?: boolean;
}
export type ChartSeriesType = "line" | "area" | "bar" | "scatter" | "candlestick" | "boxplot";
export interface SeriesSpec {
  /** Key into a row object (tabular data) or a stable id for inline data. */
  key: string;
  label?: string;
  type?: ChartSeriesType;
  /** Axis id. Defaults to `primary`. */
  axis?: string;
  tone?: SeriesTone;
  /** Explicit palette slot (1–12) when tone is not expressive enough. */
  palette?: number;
  /** Resolved colour. Escape hatch — prefer `tone`/`palette`. */
  color?: string;
  stack?: string;
  /** Stack normalisation: `"percent"` renders a 100% stacked series. */
  stackMode?: "normal" | "percent";
  smooth?: boolean;
  step?: boolean | "start" | "middle" | "end";
  area?: boolean;
  /** Fade the area fill toward the axis. Defaults to true for `type: "area"`. */
  areaGradient?: boolean;
  symbol?: boolean | "none" | "circle" | "rect" | "triangle" | "diamond";
  lineWidth?: number;
  lineType?: "solid" | "dashed" | "dotted";
  opacity?: number;
  /**
   * Draw order inside the plot. The engine default is 2; a **context** series
   * (a faint price trajectory behind a measurement) passes `1` so it never
   * covers the series it exists to contextualise while still sitting above the
   * grid.
   */
  z?: number;
  visibleByDefault?: boolean;
  format?: ChartFormat;
  formatter?: (value: number) => string;
  /** Prepared inline data. Rows are used when this is omitted. */
  data?: readonly unknown[];
  /** Bubble family: row field that supplies the symbol size. */
  sizeKey?: string;
  /**
   * Draw this series with more weight than its peers (thicker stroke, full
   * opacity, its own symbols). For the one series a chart is actually about —
   * never for more than one series, or nothing stands out.
   */
  emphasis?: boolean;
  /**
   * Whether this series appears in the engine legend (default `true`).
   *
   * A **context** series — a quiet price trajectory drawn behind a measurement
   * on its own hidden axis — is not one of the chart's comparable quantities, so
   * it stays out of the legend: its own switch belongs to the chart chrome, and
   * a legend entry would put it on equal footing with the analytical series it
   * exists to contextualise.
   */
  legend?: boolean;
  /**
   * Mark the *latest* observation with a bright core and a halo.
   *
   * V1.2 addition. Honest by construction: it always sits on a real last value,
   * is never a forecast, and only one series should carry it. The ambient ripple
   * is suppressed under reduced motion, where the point stays a static dot.
   */
  currentPoint?: boolean;
  /**
   * Bars only: print each bar's value at its end (right of a horizontal bar,
   * above a vertical one), using the series' own format.
   *
   * A ranked/categorical bar chart (calendar years of returns) is read by the
   * *number*, not only by the bar length, so the value is a first-class label
   * rather than hover-only detail. Off by default: a dense time-series bar chart
   * would become noise.
   */
  valueLabels?: boolean;
}
export interface ReferenceLineSpec {
  id?: string;
  /** Value on `axis`, or an x value when `axis: "x"`. */
  value: number | string | Date;
  axis?: "x" | "y";
  label?: string;
  tone?: SeriesTone;
  color?: string;
  lineType?: "solid" | "dashed" | "dotted";
  /** Print the value where the line meets the axis. */
  axisLabel?: boolean;
  /** Axis id the line applies to. Defaults to `primary`. */
  targetAxis?: string;
}
export interface ReferenceBandSpec {
  id?: string;
  axis?: "x" | "y";
  from: number | string | Date;
  to: number | string | Date;
  label?: string;
  tone?: SeriesTone;
  color?: string;
  opacity?: number;
  targetAxis?: string;
}
export interface EventMarkerSpec {
  id?: string;
  /** x value (timestamp or category). */
  at: number | string | Date;
  label: string;
  tone?: SeriesTone;
  color?: string;
  /** Draw a vertical guide from the axis to the marker. */
  line?: boolean;
  /**
   * The marker's glyph.
   *
   * - `dot` / `pin` / `flag` — the original vocabulary. `flag` also prints the
   *   label beside the marker, which is right for a handful of events on a
   *   sparse axis.
   * - `square` — a neutral reference event (a protocol milestone).
   * - `triangle-up` — an upside landmark (a cycle low).
   * - `triangle-down` — a downside landmark (a cycle high).
   *
   * A marker that carries `detail` never prints a permanent label, whatever its
   * shape: the plotting area stays a plot, and the exact event is read on hover.
   */
  shape?: "dot" | "flag" | "pin" | "square" | "triangle-up" | "triangle-down";
  /**
   * The event's exact fields, shown on hover/tap: `[["Date", "2024-04-20"], …]`.
   *
   * Supplying rows suppresses the marker's permanent label and turns the marker
   * into the trigger for a detail tooltip, so a dense event layer never covers
   * the data with text. The rows are the caller's own served metadata — the
   * chart formats them, it does not derive them.
   */
  detail?: readonly (readonly [string, string])[];
  /**
   * How the label is horizontally aligned against its marker.
   *
   * - `center` (default) — the label is centred on the marker, exactly as it
   *   always was. An event sitting on the plot's first or last data point then
   *   pushes half of its text past the plot edge, where the canvas clips it.
   * - `auto` — a marker inside the edge band of the x extent is anchored
   *   **inward** instead (left edge grows rightwards, right edge grows
   *   leftwards); a marker with room around it stays centred.
   * - `start` / `end` — the same inward anchors, always.
   *
   * It is a label-placement instruction, never a value: the marker's `at`
   * coordinate is what it is in every mode.
   */
  labelAlign?: "auto" | "center" | "start" | "end";
}
export interface AnnotationSpec {
  referenceLines?: readonly ReferenceLineSpec[];
  referenceBands?: readonly ReferenceBandSpec[];
  markers?: readonly EventMarkerSpec[];
}
export interface ChartRangeSpec {
  ranges: readonly string[];
  default: string;
  /** Explicit span (ms) per range token. Unknown tokens fall back to `all`. */
  durations?: Readonly<Record<string, number>>;
}
export interface ChartTooltipSpec {
  mode?: "axis" | "item" | "none";
  /** Sort rows by value, largest first. */
  sort?: "none" | "asc" | "desc";
  /** Print a total row for stacked series. */
  total?: boolean;
  /** Always render the tooltip header, even with one series. */
  showTitle?: boolean;
}
/**
 * Cartesian crosshair policy.
 *
 * The crosshair follows the pointer on Y while X snaps to an observation by
 * default, so the Tooltip and its date label always describe the same point.
 * Set `snap: false` when the X label and both pointer lines should follow the
 * continuous pointer position; the Tooltip still reads the nearest real row.
 */
export interface ChartCrosshairSpec {
  enabled?: boolean;
  snap?: boolean;
}
export interface ChartInteractionSpec {
  zoom?: "none" | "inside" | "slider";
  pan?: boolean;
  brush?: boolean;
  /** Show the reset affordance once the user has zoomed. */
  resetZoom?: boolean;
  /** Auto-zoom to the trailing window on first paint. */
  autoRange?: boolean;
  /**
   * Professional X/Y crosshair for declarative Cartesian charts.
   *
   * Defaults to enabled. `false` keeps the Tooltip but removes the pointer
   * lines and axis labels; the object form only changes the X snap policy.
   */
  crosshair?: boolean | ChartCrosshairSpec;
  /**
   * TradingView-style drag scaling on the time and value axes.
   *
   * Defaults to enabled for Cartesian charts. Touch always keeps its native
   * gesture behaviour; this option owns pointer/mouse axis drags only.
   */
  axisDrag?: boolean;
}
export interface ChartSpec<TRow extends object = ChartRow> {
  id?: string;
  family: ChartFamily;
  title?: string;
  description?: string;
  /** Field that supplies the x value for tabular data. */
  xKey?: string;
  x?: AxisSpec;
  /** Extra axes beyond the primary one. */
  axes?: readonly AxisSpec[];
  /**
   * Scale capability and current mode.
   *
   * `allowed` is what the *product* declares it may offer (a signed drawdown is
   * linear-only); `default` is what it opens on; `mode` is what the reader has
   * chosen. Absent means linear-only.
   */
  scale?: {
    allowed?: readonly YScaleMode[];
    default?: YScaleMode;
    mode?: YScaleMode;
  };
  series: readonly SeriesSpec[];
  data?: readonly TRow[];
  /**
   * Per-point display metadata, keyed by the x value's canonical string form.
   *
   * A generic hook for a caller whose x values carry a better label or extra
   * hover context than the axis can derive on its own — a fiscal identity over a
   * period-end date, a human name over a code. The engine prints the label it is
   * given (tick sparsification still applies, so this never forces every point
   * to be labelled) and appends the detail rows to the tooltip of that point;
   * it never interprets either. Absent means every point keeps the axis's own
   * formatting, exactly as before.
   */
  points?: Readonly<Record<string, ChartPointMeta>>;
  legend?: boolean;
  tooltip?: ChartTooltipSpec;
  ranges?: ChartRangeSpec;
  annotations?: AnnotationSpec;
  interaction?: ChartInteractionSpec;
  /** Bar family only: which way the bars grow. Defaults to `vertical`. */
  orientation?: "vertical" | "horizontal";
  syncGroup?: string;
  engine?: ChartEngine;
  /**
   * Drawing layer. Defaults to `canvas`.
   *
   * Set `svg` when the chart is going to be captured rather than read: vector
   * output survives PDF export and scales without a density choice. Ignored by
   * engines that cannot paint vectors (Lightweight Charts is canvas-only).
   */
  renderer?: ChartRenderer;
  /** Animation budget. Defaults to `standard`. */
  animation?: ChartAnimationPreset;
  /**
   * Morph the *same data* between two representations (a histogram ↔ a ranked
   * bar, a stacked ↔ a grouped bar). Opt-in, because a morph between charts
   * that do not share a data identity misleads. Only honoured by ECharts.
   */
  universalTransition?: boolean;
  /**
   * The number of plotted points, when the caller already knows it. Used only
   * to *reduce* animation for a large series; it never changes what is drawn.
   */
  pointCount?: number;
  unit?: string;
  /** Advanced: mutate the assembled engine option. Clearly not the normal path. */
  extendOption?: (option: unknown) => void;
}
/** Identity helper that preserves literal types for config-driven charts. */
export declare function defineChartSpec<TRow extends object>(spec: ChartSpec<TRow>): ChartSpec<TRow>;
export interface ChartSeriesDefinition {
  id: string;
  label: string;
  /** Semantic tone, not a literal colour: engines map tone → palette. */
  tone?: SeriesTone;
  /** Axis the series belongs to. */
  axis?: string;
  /** e.g. "currency", "percent", "ratio". */
  format?: string;
  visibleByDefault?: boolean;
}
export interface ChartDefinition<TData = unknown> {
  id: string;
  title: string;
  description?: string;
  type: ChartType;
  engine: ChartEngine;
  series: ChartSeriesDefinition[];
  defaultVisibleSeries: string[];
  defaultRange: string;
  supportedRanges: string[];
  /** Unit shown next to values and axis ticks. */
  unit?: string;
  formatter?: (value: number) => string;
  /**
   * Charts sharing a `syncGroup` share a crosshair and a visible range. This is
   * the hook that makes a research terminal feel like one instrument.
   */
  syncGroup?: string;
  data?: TData;
}
/** Identity helper that preserves literal types for config-driven charts. */
export declare function defineChart<TData>(definition: ChartDefinition<TData>): ChartDefinition<TData>;
/** Minimal in-memory registry: 80% declarative charts, 20% escape hatch. */
export declare class ChartRegistry {
  private readonly charts;
  register(definition: ChartDefinition): this;
  get(id: string): ChartDefinition | undefined;
  list(): ChartDefinition[];
  listBySyncGroup(group: string): ChartDefinition[];
}
//#endregion
//# sourceMappingURL=types.d.ts.map