import { ChartFormat } from "../types.js";
import { FamilyCommonProps } from "./chart-common.js";
//#region src/charts/components/network-charts.d.ts
/**
 * Network and hierarchy charts.
 *
 * Both components here do exactly one thing the engine cannot: they compute a
 * **layout** from numbers the caller already owns. A chord layout turns a
 * supplied square matrix into angles; a dendrogram turns supplied merges into a
 * tree. Neither invents a statistic — there is no clustering, no correlation,
 * no linkage and no thresholding anywhere in this file.
 */
export interface ChordArc {
  index: number;
  label: string;
  /** Full angular span of the group, radians, counter-clockwise from 3 o'clock. */
  start: number;
  end: number;
  /** The sub-arc this group *sends* from. */
  sourceStart: number;
  sourceEnd: number;
  /** The sub-arc this group *receives* on. */
  targetStart: number;
  targetEnd: number;
  /** `outgoing + incoming` for this group. */
  total: number;
}
export interface ChordRibbon {
  source: number;
  target: number;
  value: number;
  sourceStart: number;
  sourceEnd: number;
  targetStart: number;
  targetEnd: number;
}
export interface ChordLayout {
  arcs: ChordArc[];
  ribbons: ChordRibbon[];
  /** Sum of every cell. `0` when the matrix is empty. */
  total: number;
}
/**
 * Turn a square matrix into chord geometry.
 *
 * The convention is the standard one and is worth stating because a chord
 * diagram is easy to misread: group `i` occupies an arc proportional to its
 * *row sum plus column sum* (what it sends plus what it receives), the first
 * part of that arc is its outgoing side and the rest is its incoming side. So
 * the matrix must already mean something — flows, transitions, co-occurrence —
 * and the caller's row/column order is preserved exactly.
 *
 * Pure, total and exported: the geometry is testable without a browser, and a
 * consumer can build its own rendering from the same numbers.
 */
export declare function chordLayout(values: readonly (readonly number[])[], options?: {
  gapAngle?: number;
  startAngle?: number;
}): ChordLayout;
export interface ChordChartProps extends FamilyCommonProps {
  /** Group names. The order is the matrix order. */
  labels: readonly string[];
  /** Square matrix: `values[source][target]`. Non-finite and negative cells are ignored. */
  values: readonly (readonly number[])[];
  /** Radial gap between groups, radians. Default 0.022. */
  gapAngle?: number;
  /** Inner radius as a share of the outer radius. Default 0.72. */
  innerRatio?: number;
  /** Ribbon opacity. Default 0.42. */
  ribbonOpacity?: number;
  format?: ChartFormat;
  title?: string;
  description?: string;
}
export declare function ChordChart({ labels, values, gapAngle, innerRatio, ribbonOpacity, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: ChordChartProps): import("react").JSX.Element;
export interface DendrogramMerge {
  /** Identifies this internal node; must not collide with a leaf label. */
  id: string;
  left: string;
  right: string;
  /** The height the two branches join at — supplied, never derived. */
  height: number;
}
export interface DendrogramChartProps extends FamilyCommonProps {
  /** Leaf labels, left to right. */
  leaves: readonly string[];
  /** Merges in increasing height order, as the caller's own clustering produced them. */
  merges: readonly DendrogramMerge[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * A hierarchical clustering tree.
 *
 * LUC draws the tree; it does not cluster. `merges` is the linkage the caller
 * computed — the id, the two children and the join height — which means the
 * picture cannot disagree with the analysis, and a different linkage method is
 * a different set of merges rather than a hidden option here.
 */
export declare function DendrogramChart({ leaves, merges, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent, eager }: DendrogramChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=network-charts.d.ts.map