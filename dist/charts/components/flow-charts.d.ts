import { ChartFormat, SeriesTone } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ChartState } from "./chart.js";
//#region src/charts/components/flow-charts.d.ts
export interface FlowCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
export interface SankeyNode {
  name: string;
  tone?: SeriesTone;
}
export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}
export interface SankeyChartProps extends FlowCommonProps {
  nodes: readonly SankeyNode[];
  links: readonly SankeyLink[];
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Flow between named stages.
 *
 * Links are deliberately quiet — low opacity, no gradient — so the nodes, which
 * carry the meaning, stay visually dominant. A bright sankey is a decoration.
 */
export declare function SankeyChart({ nodes, links, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: SankeyChartProps): import("react").JSX.Element;
export interface GraphNode {
  id: string;
  name?: string;
  value?: number;
  group?: string;
}
export interface GraphLink {
  source: string;
  target: string;
  value?: number;
}
export interface GraphChartProps extends FlowCommonProps {
  nodes: readonly GraphNode[];
  links: readonly GraphLink[];
  groups?: readonly string[];
  layout?: "force" | "circular";
  format?: ChartFormat;
  title?: string;
  description?: string;
}
/**
 * Network graph.
 *
 * Force layout by default with a restrained repulsion, so the labels stay
 * legible instead of collapsing into a hairball.
 */
export declare function GraphChart({ nodes, links, groups, layout, format, title, description, state, height, className, ariaLabel, ariaDescription, onReady, onEvent }: GraphChartProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=flow-charts.d.ts.map