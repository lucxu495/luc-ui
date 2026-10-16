import { ChartFormat } from "../types.js";
import { FamilyCommonProps } from "./chart-common.js";
//#region src/charts/components/geo-charts.d.ts
/**
 * Geographic charts.
 *
 * LUC ships **no map data**: a boundary file is large, licensed and makes a
 * political statement on every consumer's behalf. A choropleth therefore takes
 * the *name* of a map the application registered with `registerEChartsMap`, and
 * the region identifiers it wants coloured. Everything else — the projection,
 * the simplification, the disputed names — stays the application's decision.
 */
export interface ChoroplethRegion {
  /** The value of `nameProperty` for this region in the registered GeoJSON. */
  id: string;
  /** `null` marks "no data" and is drawn in the missing colour, never as zero. */
  value: number | null;
}
export interface ChoroplethChartProps extends FamilyCommonProps {
  /** The name passed to `registerEChartsMap`. */
  mapName: string;
  regions: readonly ChoroplethRegion[];
  /** GeoJSON property that carries the region id. Default `"name"`. */
  nameProperty?: string;
  format?: ChartFormat;
  /** Legend caption, e.g. "Population per km²". */
  valueLabel?: string;
  /** Which ramp encodes the value. */
  ramp?: "sequential" | "diverging";
  title?: string;
  description?: string;
}
export declare function ChoroplethChart({ mapName, regions, nameProperty, format, valueLabel, ramp, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ChoroplethChartProps): import("react").JSX.Element;
export interface GeoTrajectoryPoint {
  /** Longitude in degrees. */
  x: number;
  /** Latitude in degrees. */
  y: number;
  /** Optional timestamp or step index, shown in the tooltip. */
  t?: number;
}
export interface GeoTrajectory {
  id: string;
  label: string;
  points: readonly GeoTrajectoryPoint[];
  /** Draw with an animated emphasis — useful for a single highlighted route. */
  highlight?: boolean;
}
export interface GeoTrajectoryChartProps extends FamilyCommonProps {
  trajectories: readonly GeoTrajectory[];
  /**
   * Unwrap paths that cross the ±180° meridian by shifting a segment by a full
   * turn, so a route from 179°E to 179°W is drawn as a short hop instead of a
   * line across the whole chart. A display transform only: tooltips still
   * report the longitude the caller supplied.
   */
  unwrap?: boolean;
  xLabel?: string;
  yLabel?: string;
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/** Shift a longitude sequence so a meridian crossing becomes a small step. */
export declare function unwrapLongitudes(points: readonly GeoTrajectoryPoint[]): GeoTrajectoryPoint[];
export declare function GeoTrajectoryChart({ trajectories, unwrap, xLabel, yLabel, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: GeoTrajectoryChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=geo-charts.d.ts.map