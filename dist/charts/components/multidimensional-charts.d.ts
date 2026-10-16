import { ChartFormat } from "../types.js";
import { FamilyCommonProps } from "./chart-common.js";
//#region src/charts/components/multidimensional-charts.d.ts
/**
 * Multidimensional, hierarchical and geographic charts.
 *
 * The three here share a property the rest of the catalogue does not have: they
 * all need something *outside* the rows — a shared scale, a parent/child
 * relation, a map. Each one therefore states exactly what the caller must
 * supply, and refuses to guess.
 */
export interface ScatterMatrixChartProps extends FamilyCommonProps {
  /** Variables in the order they should appear on both axes. */
  variables: readonly {
    key: string;
    label: string;
    format?: ChartFormat;
  }[];
  /** One row per observation, keyed by variable. */
  rows: readonly Record<string, number>[];
  /** Point colour, resolved by the caller (e.g. its cluster). */
  pointTone?: (row: Record<string, number>, index: number) => string | undefined;
  /** Cell height in px. The grid grows to fit. Default 120. */
  cellSize?: number;
  title?: string;
  description?: string;
}
/**
 * Scatterplot matrix (SPLOM).
 *
 * `n × (n − 1)` grids for `n` variables — the pairs *without* the diagonal,
 * because a variable plotted against itself carries no information and a
 * diagonal of histograms would double the render cost for a decoration. Cells
 * share an axis per row and column, which is what makes a correlation visible
 * as a slope.
 *
 * Past roughly six variables a parallel-coordinates plot is the better tool;
 * the Showcase's chart guidance says so, and this component will still render
 * (it just gets small).
 */
export declare function ScatterMatrixChart({ variables, rows, pointTone, cellSize, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ScatterMatrixChartProps): import("react").JSX.Element;
export interface HierarchyTreeNode {
  name: string;
  value?: number;
  children?: readonly HierarchyTreeNode[];
  /** Optional tone key; resolved through the theme's series palette. */
  tone?: string;
  /** Collapse this subtree on first render. */
  collapsed?: boolean;
}
export interface HierarchyTreeChartProps extends FamilyCommonProps {
  /** The root. A dendrogram of one leaf is a label, not a chart. */
  root: HierarchyTreeNode;
  /** `left-right` is a dendrogram; `radial` is an org chart. Default `left-right`. */
  orientation?: "left-right" | "right-left" | "top-bottom" | "bottom-top" | "radial";
  /** Path of labels drawn on the edges. */
  edgeShape?: "curve" | "polyline";
  /** Show the leaf labels. Default `true`. */
  labels?: boolean;
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Hierarchy tree — a dendrogram, a file tree or an org chart.
 *
 * ECharts' own `tree` series supplies the layout and the collapse interaction,
 * which is the right division: the layout is geometry, not a statistic. The
 * component's job is the label model and the tone contract — a leaf takes its
 * colour from its own `tone` so an editing tree and a JSON inspector can colour
 * the same shape differently without forking the component.
 */
export declare function HierarchyTreeChart({ root, orientation, edgeShape, labels, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: HierarchyTreeChartProps): import("react").JSX.Element;
export interface GeoPoint {
  name: string;
  /** `[longitude, latitude]` in WGS-84. */
  coordinates: readonly [number, number];
  value: number;
}
export interface GeoScatterChartProps extends FamilyCommonProps {
  /**
   * A map name registered with `registerEChartsMap`.
   *
   * LUC ships **no map data**: a world or country boundary file is tens to
   * hundreds of kilobytes, it has a licence, and bundling one would impose a
   * political boundary set on every consumer. Registration is therefore the
   * caller's explicit step.
   */
  mapName: string;
  points: readonly GeoPoint[];
  valueFormat?: ChartFormat;
  /** Symbol size in px for the largest value. Default 22. */
  maxSymbolSize?: number;
  /** Draw the map's own region fills under the points. Default `true`. */
  showRegions?: boolean;
  /**
   * Geographic bounds of the registered map, `[[west, north], [east, south]]`.
   *
   * ECharts normally derives the view rectangle from the registered regions. A
   * map whose GeoJSON carries no projection metadata (a hand-built fixture, a
   * grid, a synthetic test map) can leave that rectangle undefined, and the
   * engine then fails inside its own view-coordinate update. Passing the bounds
   * explicitly is the documented escape hatch.
   */
  boundingCoords?: readonly [readonly [number, number], readonly [number, number]];
  /** `scatter` over a map, or `effectScatter` for a live feed. */
  variant?: "scatter" | "effect";
  title?: string;
  description?: string;
}
/**
 * Geographic scatter — one point per location on a caller-registered map.
 *
 * This is the honest half of the geographic brief. A point map needs only a
 * base map for context, so it works the moment a consumer registers one; a
 * *choropleth* additionally needs a value per region, which is a different
 * contract (see the ecosystem roadmap — `MapChart` is blocked on shipping or
 * requiring region data, not on engine support).
 */
export declare function GeoScatterChart({ mapName, points, valueFormat, maxSymbolSize, showRegions, boundingCoords, variant, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: GeoScatterChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=multidimensional-charts.d.ts.map