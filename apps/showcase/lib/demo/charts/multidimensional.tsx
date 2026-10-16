/*
 * Multidimensional, network and hierarchy.
 *
 * These charts are structure, not magnitude: a flow has to balance, a hierarchy
 * has to nest, a chord matrix is square, and a dendrogram's merge heights are
 * supplied in increasing order because clustering happened somewhere else. Each
 * fixture keeps those invariants visible at a glance — a balanced Sankey, three
 * levels of nesting, eight leaves.
 */

import {
  ChordChart,
  DendrogramChart,
  GraphChart,
  HierarchyTreeChart,
  RadarChart,
  SankeyChart,
  SunburstChart,
  TreemapChart,
  type ChordChartProps,
  type DendrogramChartProps,
  type GraphChartProps,
  type HierarchyTreeChartProps,
  type RadarChartProps,
  type SankeyChartProps,
  type SunburstChartProps,
  type TreemapChartProps,
} from "@luc/ui/charts";
import { demo, type DemoSpec } from "../index";

/* 980 visits → 384 signups → 212 trials → 96 paid. Every node's inflow equals
 * its outflow, which is the invariant a Sankey has to satisfy to be readable. */
const SANKEY_NODES = [
  { name: "Organic", tone: "accent" as const },
  { name: "Paid", tone: "info" as const },
  { name: "Referral", tone: "neutral" as const },
  { name: "Visit" },
  { name: "Signup" },
  { name: "Trial" },
  { name: "Paid plan" },
];

const SANKEY_LINKS = [
  { source: "Organic", target: "Visit", value: 520 },
  { source: "Paid", target: "Visit", value: 310 },
  { source: "Referral", target: "Visit", value: 150 },
  { source: "Visit", target: "Signup", value: 384 },
  { source: "Visit", target: "Trial", value: 96 },
  { source: "Signup", target: "Trial", value: 212 },
  { source: "Trial", target: "Paid plan", value: 96 },
  { source: "Signup", target: "Paid plan", value: 172 },
];

const HIERARCHY = [
  {
    name: "Equity",
    children: [
      { name: "US", value: 32 },
      { name: "Europe", value: 18 },
      { name: "Asia", value: 12 },
    ],
  },
  {
    name: "Fixed income",
    children: [
      { name: "Sovereign", value: 14 },
      { name: "Credit", value: 11 },
    ],
  },
  { name: "Alternatives", value: 9 },
  { name: "Cash", value: 4 },
];

export const chartMultidimensionalDemos: readonly DemoSpec[] = [
  demo<SankeyChartProps>({
    id: "sankey-chart",
    component: "SankeyChart",
    props: {
      nodes: SANKEY_NODES,
      links: SANKEY_LINKS,
      format: { kind: "integer" },
      height: 380,
      ariaLabel: "Acquisition to retention",
    },
    render: (props) => <SankeyChart {...props} />,
    note: "Prepared node and link lists whose flows balance at every node — the chart aggregates nothing.",
  }),
  demo<GraphChartProps>({
    id: "graph-chart",
    component: "GraphChart",
    props: {
      nodes: [
        { id: "ingest", name: "Ingest", group: "Data", value: 3 },
        { id: "store", name: "Store", group: "Data", value: 4 },
        { id: "model", name: "Model", group: "Compute", value: 5 },
        { id: "serve", name: "Serve", group: "Serve", value: 4 },
        { id: "api", name: "API", group: "Serve", value: 3 },
        { id: "web", name: "Web", group: "Serve", value: 2 },
      ],
      links: [
        { source: "ingest", target: "store", value: 2 },
        { source: "store", target: "model", value: 3 },
        { source: "model", target: "serve", value: 3 },
        { source: "serve", target: "api", value: 2 },
        { source: "api", target: "web", value: 2 },
        { source: "store", target: "serve", value: 1 },
      ],
      groups: ["Data", "Compute", "Serve"],
      layout: "force",
      format: { kind: "integer" },
      height: 380,
      ariaLabel: "Pipeline graph",
    },
    render: (props) => <GraphChart {...props} />,
    note: "Six nodes in three groups; the node size is the caller's weight and the layout is a restrained force simulation.",
  }),
  demo<ChordChartProps>({
    id: "chord-chart",
    component: "ChordChart",
    props: {
      labels: ["Equity", "Credit", "Rates", "Commodity"],
      /* Square: `values[source][target]`. Diagonal cells are ignored. */
      values: [
        [0, 42, 18, 9],
        [31, 0, 24, 6],
        [12, 27, 0, 11],
        [8, 5, 14, 0],
      ],
      format: { kind: "integer" },
      height: 380,
      ariaLabel: "Flow between blocks",
    },
    render: (props) => <ChordChart {...props} />,
    note: "A square supplied matrix of cross-flows between four blocks, drawn as ribbons.",
  }),
  demo<DendrogramChartProps>({
    id: "dendrogram-chart",
    component: "DendrogramChart",
    props: {
      leaves: ["EQ", "HY", "IG", "GOLD", "OIL", "FX", "REIT", "TECH"],
      /* Merges in increasing height order, exactly as a clustering produced them. */
      merges: [
        { id: "m1", left: "HY", right: "IG", height: 0.24 },
        { id: "m2", left: "EQ", right: "TECH", height: 0.31 },
        { id: "m3", left: "m1", right: "m2", height: 0.46 },
        { id: "m4", left: "GOLD", right: "OIL", height: 0.38 },
        { id: "m5", left: "m4", right: "m3", height: 0.62 },
        { id: "m6", left: "FX", right: "REIT", height: 0.55 },
        { id: "m7", left: "m6", right: "m5", height: 0.81 },
      ],
      format: { kind: "decimal", decimals: 2 },
      height: 340,
      ariaLabel: "Clustering of eight assets",
    },
    render: (props) => <DendrogramChart {...props} />,
    note: "Merge heights supplied in increasing order: the clustering happened upstream, LUC draws the tree.",
  }),
  demo<HierarchyTreeChartProps>({
    id: "hierarchy-tree-chart",
    component: "HierarchyTreeChart",
    props: {
      root: { name: "Portfolio", children: HIERARCHY },
      orientation: "left-right",
      format: { kind: "percent", decimals: 0 },
      height: 320,
      ariaLabel: "Allocation tree",
    },
    render: (props) => <HierarchyTreeChart {...props} />,
    note: "A three-level tree of the weights the caller supplied; collapse is a view state, never a recompute.",
  }),
  demo<TreemapChartProps>({
    id: "treemap-chart",
    component: "TreemapChart",
    props: { data: HIERARCHY, format: { kind: "percent", decimals: 0 }, height: 340, ariaLabel: "Allocation by block" },
    render: (props) => <TreemapChart {...props} />,
    note: "The same hierarchy as the sunburst, sized by value: area carries the share, and the drill-down is client-side.",
  }),
  demo<SunburstChartProps>({
    id: "sunburst-chart",
    component: "SunburstChart",
    props: { data: HIERARCHY, format: { kind: "percent", decimals: 0 }, height: 340, ariaLabel: "Allocation rings" },
    render: (props) => <SunburstChart {...props} />,
    note: "One ring per level, so depth is readable without a legend for every leaf.",
  }),
  demo<RadarChartProps>({
    id: "radar-chart",
    component: "RadarChart",
    props: {
      indicators: [
        { name: "Return", max: 5 },
        { name: "Volatility", max: 5 },
        { name: "Liquidity", max: 5 },
        { name: "Drawdown", max: 5 },
        { name: "Cost", max: 5 },
      ],
      series: [
        { name: "Current", tone: "accent", values: [4, 3, 4, 2, 3] },
        { name: "Target", tone: "neutral", values: [4, 2, 5, 4, 2] },
      ],
      height: 340,
      ariaLabel: "Profile across five axes",
    },
    render: (props) => <RadarChart {...props} />,
    note: "Five spokes with explicit maxima, two profiles: a radar is a shape comparison, not a ranking.",
  }),
];
