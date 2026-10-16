import { ChartFormat, SeriesTone } from "../types.js";
import { FamilyCommonProps } from "./chart-common.js";
//#region src/charts/components/scientific-charts.d.ts
/**
 * Scientific charts — geometry, fields and spectra.
 *
 * These families exist because a scientific reader needs a shape that a
 * business chart cannot express: a phase portrait, a field of arrows, a
 * spectrogram, a ternary composition. Every one of them takes **prepared**
 * data. Where a transform is unavoidable (a streamgraph's own layout) it is
 * delegated to the engine and named in the contract, never invented here.
 *
 * Three of them are the "custom series" family: contour, ternary and hexbin.
 * They share one rendering discipline — a polygon per datum, tone from the
 * theme, no engine default that could drift from the rest of the system.
 */
export interface ParallelAxisSpec {
  /** Key into each row. */
  key: string;
  label: string;
  /** Optional fixed bounds; omit to let the engine use the data extent. */
  min?: number;
  max?: number;
  format?: ChartFormat;
  invert?: boolean;
}
export interface ParallelCoordinatesChartProps extends FamilyCommonProps {
  axes: readonly ParallelAxisSpec[];
  /** One entry per observation. Missing keys leave the polyline discontinuous. */
  rows: readonly Record<string, number>[];
  /** Optional per-row tone resolved by the caller (e.g. its cluster or class). */
  rowTone?: (row: Record<string, number>, index: number) => SeriesTone | undefined;
  /** Fade the polylines so overlapping observations stay readable. */
  opacity?: number;
  /** Colour lines by a numeric key instead of by a flat tone. */
  visualKey?: string;
  title?: string;
  description?: string;
}
/**
 * Parallel coordinates — the readable alternative to a scatterplot matrix past
 * four dimensions.
 *
 * Each axis is independent, so an observation is a polyline through its own
 * values. The component brushes nothing on its own: brushing is `onEvent`
 * territory in a caller that owns selection state, and pretending otherwise
 * would silently couple this chart to one interaction model.
 */
export declare function ParallelCoordinatesChart({ axes, rows, rowTone, opacity, visualKey, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ParallelCoordinatesChartProps): import("react").JSX.Element;
export interface PolarRoseChartProps extends FamilyCommonProps {
  data: readonly {
    name: string;
    value: number;
  }[];
  /** `rose` (Nightingale) varies the radius; `radius` varies the radius too but
   *  keeps the slices even. `pie` is the flat composition for comparison. */
  variant?: "rose" | "pie" | "donut";
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/** Nightingale rose — a composition where the angle is not the measurement. */
export declare function PolarRoseChart({ data, variant, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: PolarRoseChartProps): import("react").JSX.Element;
export interface WindRoseChartProps extends FamilyCommonProps {
  /** Compass or sector labels, in order. */
  directions: readonly string[];
  series: readonly {
    label: string;
    /** One value per direction. */
    values: readonly number[];
    tone?: SeriesTone;
  }[];
  format?: ChartFormat;
  /** Start the first sector at the top rather than at 3 o'clock. Default `true`. */
  northUp?: boolean;
  title?: string;
  description?: string;
}
/** Wind rose — a stacked polar histogram of speed bins per direction. */
export declare function WindRoseChart({ directions, series, format, northUp, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: WindRoseChartProps): import("react").JSX.Element;
export interface TernaryPoint {
  /** Share of the first vertex, 0–1. */
  a: number;
  /** Share of the second vertex, 0–1. */
  b: number;
  /** Share of the third vertex, 0–1. */
  c: number;
  label?: string;
}
export interface TernaryChartProps extends FamilyCommonProps {
  points: readonly TernaryPoint[];
  /** Vertex labels, anticlockwise from the top. */
  corners?: readonly [string, string, string];
  /** Draw the 10% grid. Default `true`. */
  grid?: boolean;
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Ternary (triangle) plot — a composition where the three shares sum to one.
 *
 * The mapping from barycentric coordinates to the plot is the only maths in the
 * component, and it is exact: `a` is the top vertex, `b` bottom-right, `c`
 * bottom-left. A point whose shares do not sum to 1 is drawn where its
 * *normalised* shares put it, and the tooltip reports the shares it was given —
 * the chart never rewrites a caller's data.
 */
export declare function TernaryChart({ points, corners, grid, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: TernaryChartProps): import("react").JSX.Element;
export interface VectorFieldChartProps extends FamilyCommonProps {
  /** One arrow per sample: a tail at `(x, y)` and a direction `(u, v)`. */
  vectors: readonly {
    x: number;
    y: number;
    u: number;
    v: number;
  }[];
  /** Arrow length multiplier. 1 keeps the raw magnitude. */
  scale?: number;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Vector field / quiver plot.
 *
 * Draws the arrows it is given, at the magnitude it is given — no
 * normalisation, no autoscaling that would hide a weak region. `scale` is the
 * caller's explicit choice and is reported in the tooltip so a reader is never
 * misled about magnitude.
 */
export declare function VectorFieldChart({ vectors, scale, xFormat, yFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: VectorFieldChartProps): import("react").JSX.Element;
export interface ContourLevel {
  /** The iso value this ring marks. Drawn in the label. */
  level: number;
  /** Closed rings at that level; each ring is a list of `[x, y]`. */
  rings: readonly (readonly [number, number][])[];
}
export interface ContourChartProps extends FamilyCommonProps {
  levels: readonly ContourLevel[];
  /** The sampled surface, drawn under the lines as a field. */
  surface?: readonly {
    x: number;
    y: number;
    z: number;
  }[];
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  zFormat?: ChartFormat;
  /** Label the iso lines. Default `true`. */
  labels?: boolean;
  title?: string;
  description?: string;
}
/**
 * Contour / iso-line plot.
 *
 * The rings are supplied by the caller (a marching-squares pass in the analysis
 * layer). LUC draws them at the level they claim and can print that level on the
 * line, so a reader can tell two adjacent contours apart without a legend.
 */
export declare function ContourChart({ levels, surface, xFormat, yFormat, zFormat, labels, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ContourChartProps): import("react").JSX.Element;
export interface SpectrogramChartProps extends FamilyCommonProps {
  /** Time or frame labels along the horizontal axis. */
  xValues: readonly (string | number)[];
  /** Frequency bins, low to high or high to low — drawn in the order given. */
  yValues: readonly (string | number)[];
  /** `magnitude[y][x]`, typically dB. */
  values: readonly (readonly number[])[];
  /** Decibel reference drawn in the tooltip, e.g. `"dBFS"`. */
  unit?: string;
  /** Fix the colour ramp. Omit to use the observed extent. */
  range?: {
    min: number;
    max: number;
  };
  title?: string;
  description?: string;
}
/**
 * Spectrogram / scalogram — a time–frequency heatmap.
 *
 * It is a heatmap by construction, but its contract is a *spectrum*: two signed
 * axes in physical order, a fixed dB range so two spectrograms are comparable,
 * and a tooltip that names the unit. A generic heatmap cannot state any of that.
 */
export declare function SpectrogramChart({ xValues, yValues, values, unit, range, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: SpectrogramChartProps): import("react").JSX.Element;
export interface ThemeRiverEvent {
  /** `YYYY-MM-DD` or any string the axis can order. */
  date: string;
  name: string;
  value: number;
}
export interface ThemeRiverChartProps extends FamilyCommonProps {
  events: readonly ThemeRiverEvent[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Theme river — a stacked stream over time.
 *
 * The band layout (a symmetric silhouette around a moving baseline) is the
 * engine's, because it is a *layout* algorithm rather than a statistic: the
 * areas are the caller's numbers, placed so the whole shape can be read at
 * once. That is exactly the line between "a chart may place data" and "a chart
 * must not estimate it".
 */
export declare function ThemeRiverChart({ events, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ThemeRiverChartProps): import("react").JSX.Element;
export interface RidgelineGroup {
  label: string;
  /** Position along the value axis. */
  x: number;
  /** Density or frequency at that position, supplied. */
  density: number;
  tone?: SeriesTone;
}
export interface RidgelineChartProps extends FamilyCommonProps {
  /** Groups drawn top to bottom, each one stepped down by `overlap`. */
  groups: readonly {
    label: string;
    points: readonly RidgelineGroup[];
    tone?: SeriesTone;
  }[];
  /** Vertical step as a fraction of a row. 0.5 is a classic joyplot. */
  overlap?: number;
  xFormat?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Ridgeline (joyplot) — many distributions stacked along one axis.
 *
 * The vertical offset is a *drawing* transform (the same category as a log
 * scale): the heights inside each ridge are the caller's densities, and the
 * overlap never changes a value. Overlap is capped at 1 so one row can never
 * fully hide the one beneath it.
 */
export declare function RidgelineChart({ groups, overlap, xFormat, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: RidgelineChartProps): import("react").JSX.Element;
export interface HexbinCell {
  /** Bin centre. */
  x: number;
  y: number;
  /** The aggregated value (count, mean, sum — whatever the caller binned). */
  value: number;
  /** Optional label for the tooltip. */
  label?: string;
}
export interface HexbinChartProps extends FamilyCommonProps {
  cells: readonly HexbinCell[];
  /** Hex radius in axis units (the smoothing is done by the caller). */
  radius: number;
  valueFormat?: ChartFormat;
  xFormat?: ChartFormat;
  yFormat?: ChartFormat;
  /** Semantic name for the aggregated value, e.g. "Samples". */
  valueLabel?: string;
  title?: string;
  description?: string;
}
/**
 * Hexbin — density over a plane without overplotting.
 *
 * The bins are the caller's: hexbinning is an aggregation, and an aggregation
 * changes the answer, so the caller owns it. LUC owns the geometry (a regular
 * hexagon at `radius`), the ramp and the tooltip.
 */
export declare function HexbinChart({ cells, radius, valueFormat, xFormat, yFormat, valueLabel, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: HexbinChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=scientific-charts.d.ts.map