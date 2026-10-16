/*
 * The chart catalogue, as data.
 *
 * One machine-readable source of truth, because two consumers disagree the
 * moment there are two copies: this page renders it, and
 * `scripts/chart-catalog.mjs` verifies every symbol against the package's real
 * exports and refuses a duplicate id. An agent reads the same file to find out
 * what it can import today.
 *
 * The fields are the ones an honest count needs:
 *
 *   id       — a stable slug. A link, a test and an agent refer to a chart by
 *              this, never by its display name.
 *   symbol   — the public component(s) a row names. `·` separates two renderers
 *              of one plot; `+` marks a composition of existing components,
 *              which is an entry but not a plot type of its own.
 *   status   — `public` (a typed component ships today), `engine` (the engine
 *              can draw it and LUC has not wrapped it), `planned`, `blocked`.
 *   engine   — which renderer draws it. `canvas-projection` is an ECharts
 *              custom series whose geometry LUC computes; no WebGL, no
 *              echarts-gl.
 *
 * Ids and symbols are never translated. The names, group descriptions and
 * notes are prose, and they live in the Chinese dictionary keyed by their
 * English source, like every other string in the Showcase.
 */

export type ChartStatus = "public" | "engine" | "planned" | "blocked";
export type ChartEngine = "echarts" | "lightweight-charts" | "canvas-projection";

export interface ChartEntry {
  /** Stable slug: how a link, a test and an agent refer to this chart. */
  id: string;
  name: string;
  symbol: string;
  /** `plot` is a distinct mark; `variant` reuses another plot; `composite` composes two. */
  kind: "plot" | "variant" | "composite";
  status: ChartStatus;
  engine: ChartEngine;
  note?: string;
}

export interface ChartGroup {
  id: string;
  title: string;
  description: string;
  entries: ChartEntry[];
}

export const chartGroups: ChartGroup[] = [
  {
    id: "general",
    title: "General",
    description: "The shapes every product needs, on the declarative ChartSpec path.",
    entries: [
      { id: "line", name: "Line", symbol: "LineChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "area", name: "Area", symbol: "AreaChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "bar", name: "Bar", symbol: "BarChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "composed", name: "Composed", symbol: "ComposedChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "scatter", name: "Scatter", symbol: "ScatterChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "bubble", name: "Bubble", symbol: "BubbleChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "pie-donut", name: "Pie / donut", symbol: "PieChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "histogram", name: "Histogram", symbol: "HistogramChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "waterfall", name: "Waterfall", symbol: "WaterfallChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "funnel", name: "Funnel", symbol: "FunnelChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "range-band", name: "Range band", symbol: "RangeBandChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "fan-band", name: "Fan band", symbol: "FanChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "sparkline", name: "Sparkline", symbol: "Sparkline", kind: "plot", status: "public", engine: "echarts" },
      { id: "small-multiples", name: "Small multiples", symbol: "SmallMultiples", kind: "plot", status: "public", engine: "echarts" },
    ],
  },
  {
    id: "statistical",
    title: "Statistical",
    description: "Distributions, agreement and uncertainty — all from prepared values.",
    entries: [
      { id: "ecdf", name: "ECDF", symbol: "EcdfChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "q-q-plot", name: "Q–Q plot", symbol: "QqPlotChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "violin", name: "Violin", symbol: "ViolinChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "density-kde", name: "Density / KDE", symbol: "DistributionChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "box-plot", name: "Box plot", symbol: "BoxPlotChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "confidence-interval", name: "Confidence interval", symbol: "ErrorBarChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "regression-residual", name: "Regression & residual", symbol: "ScatterRegressionChart · ResidualChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "correlation-matrix", name: "Correlation matrix", symbol: "CorrelationMatrix", kind: "plot", status: "public", engine: "echarts" },
      { id: "roc-curve", name: "ROC curve", symbol: "RocCurveChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "calibration", name: "Calibration", symbol: "CalibrationChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "confusion-matrix", name: "Confusion matrix", symbol: "ConfusionMatrixChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "quadrant-scatter", name: "Quadrant scatter", symbol: "QuadrantScatterChart", kind: "plot", status: "public", engine: "echarts" },
    ],
  },
  {
    id: "scientific",
    title: "Scientific & mathematical",
    description: "Fields, geometry and spectra for scientific readers.",
    entries: [
      { id: "parallel-coordinates", name: "Parallel coordinates", symbol: "ParallelCoordinatesChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "scatterplot-matrix", name: "Scatterplot matrix", symbol: "ScatterMatrixChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "polar-rose", name: "Polar rose", symbol: "PolarRoseChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "wind-rose", name: "Wind rose", symbol: "WindRoseChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "ternary", name: "Ternary", symbol: "TernaryChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "vector-field-quiver", name: "Vector field / quiver", symbol: "VectorFieldChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "contour-iso-lines", name: "Contour / iso-lines", symbol: "ContourChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "hexbin", name: "Hexbin", symbol: "HexbinChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "spectrogram", name: "Spectrogram", symbol: "SpectrogramChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "theme-river-stream", name: "Theme river / stream", symbol: "ThemeRiverChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "ridgeline", name: "Ridgeline", symbol: "RidgelineChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "3d-surface", name: "3D surface", symbol: "Surface3DChart", kind: "plot", status: "public", engine: "canvas-projection", note: "orthographic projection + painter's algorithm — no WebGL, no echarts-gl" },
    ],
  },
  {
    id: "diagnostics",
    title: "Diagnostics, ML & risk",
    description: "The figures that answer “is this sane?” — all from values the caller computed.",
    entries: [
      { id: "autocorrelation-pacf", name: "Autocorrelation / PACF", symbol: "AutocorrelationChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "survival-curve-kaplan-meier", name: "Survival curve (Kaplan–Meier)", symbol: "SurvivalCurveChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "precision-recall", name: "Precision–recall", symbol: "PrecisionRecallChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "feature-importance", name: "Feature importance", symbol: "FeatureImportanceChart", kind: "plot", status: "public", engine: "echarts" },
    ],
  },
  {
    id: "financial",
    title: "Financial & quantitative",
    description: "Presentation only: not one metric here is computed by the library.",
    entries: [
      {
        id: "candlestick-ohlc",
        name: "Candlestick / OHLC",
        symbol: "CandlestickChart · FinancialChart",
        kind: "plot",
        status: "public",
        // One plot, two renderers: the ECharts candlestick and the Lightweight
        // Charts financial chart. The second is what makes this entry span both
        // engine adapters.
        engine: "lightweight-charts",
        note: "two renderers of one plot — CandlestickChart on ECharts, FinancialChart on Lightweight Charts",
      },
      { id: "drawdown", name: "Drawdown", symbol: "DrawdownChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "term-structure", name: "Term structure", symbol: "TermStructureChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "curve-comparison", name: "Curve comparison", symbol: "CurveComparisonChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "volatility-smile", name: "Volatility smile", symbol: "VolatilitySmileChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "efficient-frontier", name: "Efficient frontier", symbol: "EfficientFrontierChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "factor-exposure", name: "Factor exposure", symbol: "FactorExposureChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "p-l-attribution", name: "P&L attribution", symbol: "PnlAttributionChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "market-depth", name: "Market depth", symbol: "DepthChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "historical-position", name: "Historical position", symbol: "HistoricalPositionChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "volatility-surface", name: "Volatility surface", symbol: "VolatilitySurfaceChart", kind: "plot", status: "public", engine: "canvas-projection", note: "a gridded surface; interpolating quotes into a grid stays the caller's job" },
    ],
  },
  {
    id: "multidimensional",
    title: "Multidimensional, network & hierarchy",
    description: "When the relationship, not the value, is the finding.",
    entries: [
      { id: "radar", name: "Radar", symbol: "RadarChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "sankey", name: "Sankey", symbol: "SankeyChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "graph-network", name: "Graph / network", symbol: "GraphChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "treemap", name: "Treemap", symbol: "TreemapChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "sunburst", name: "Sunburst", symbol: "SunburstChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "tree", name: "Tree", symbol: "HierarchyTreeChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "chord", name: "Chord", symbol: "ChordChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "dendrogram-clustering", name: "Dendrogram (clustering)", symbol: "DendrogramChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "parallel-sets-alluvial", name: "Parallel sets / alluvial", symbol: "—", kind: "plot", status: "planned", engine: "echarts", note: "categorical flows across dimensions; Sankey covers the explicit-link case today" },
    ],
  },
  {
    id: "workflow",
    title: "Workflow & operations",
    description: "Sequence, schedule, comparison and attribution.",
    entries: [
      { id: "gantt-schedule", name: "Gantt / schedule", symbol: "GanttChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "dumbbell", name: "Dumbbell", symbol: "DumbbellChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "lollipop", name: "Lollipop", symbol: "LollipopChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "bullet", name: "Bullet", symbol: "BulletChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "slope", name: "Slope", symbol: "SlopeChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "bump-rank", name: "Bump / rank", symbol: "BumpChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "mekko-mosaic", name: "Mekko / mosaic", symbol: "MekkoChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "segmented-bars", name: "Segmented bars", symbol: "ComposedChart", kind: "variant", status: "public", engine: "echarts", note: "a reading of ComposedChart, not a second plot" },
    ],
  },
  {
    id: "time",
    title: "Time series & sequence",
    description: "Regimes, events and calendars over a shared inspection cursor.",
    entries: [
      { id: "regime-strip", name: "Regime strip", symbol: "RegimeStrip", kind: "plot", status: "public", engine: "echarts" },
      { id: "event-timeline", name: "Event timeline", symbol: "EventTimeline", kind: "plot", status: "public", engine: "echarts" },
      { id: "calendar-heatmap", name: "Calendar heatmap", symbol: "CalendarHeatmap", kind: "plot", status: "public", engine: "echarts" },
      { id: "heatmap", name: "Heatmap", symbol: "HeatmapChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "gauge", name: "Gauge", symbol: "GaugeChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "rolling-measure", name: "Rolling measure", symbol: "LineChart", kind: "variant", status: "public", engine: "echarts", note: "a supplied window over a supplied series — the same plot, read over time" },
    ],
  },
  {
    id: "geographic",
    title: "Geographic",
    description: "Maps are the caller's: LUC ships no boundary data and no political set.",
    entries: [
      { id: "geographic-scatter", name: "Geographic scatter", symbol: "GeoScatterChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "route-trajectory", name: "Route / trajectory", symbol: "GeoTrajectoryChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "choropleth", name: "Choropleth", symbol: "ChoroplethChart", kind: "plot", status: "public", engine: "echarts" },
      { id: "spatial-density", name: "Spatial density", symbol: "HexbinChart + GeoScatterChart", kind: "composite", status: "public", engine: "echarts", note: "a composition of two public components, not a third plot" },
      { id: "3d-globe-extruded-map", name: "3D globe / extruded map", symbol: "—", kind: "plot", status: "blocked", engine: "echarts", note: "echarts-gl only — the boundary this library declines to cross" },
    ],
  },
];
export const chartVariants: ChartVariant[] = [
  { name: "Adjacency matrix", of: "CorrelationMatrix", note: "a generic matrix of counts, directed or not, with degree totals" },
  { name: "Alluvial", of: "SankeyChart", note: "categorical stages instead of explicit links" },
  { name: "Volatility surface (2D)", of: "HeatmapChart", note: "a projection, and it must be labelled as one" },
  { name: "Density ridgelines", of: "RidgelineChart", note: "complementary / mirrored mode" },
  { name: "Rolling risk panel", of: "LineChart", note: "a ratio axis plus supplied windows" },
];


/*
 * Variants, not types.
 *
 * This list exists so the count above stays honest: an adjacency matrix is the
 * matrix renderer with count semantics, an alluvial chart is a Sankey with
 * categorical nodes, and a 2D heatmap of implied volatility is not a 3D
 * surface. Counting those as separate plot types would inflate the catalogue
 * without adding a capability, which is the trade this page refuses.
 */
export interface ChartVariant {
  name: string;
  of: string;
  note: string;
}

/** Every distinct public component named by at least one public entry. */
export function publicChartSymbols(groups: ChartGroup[]): string[] {
  const symbols = new Set<string>();
  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.status !== "public") continue;
      for (const part of entry.symbol.split(/·|\+/).map((piece) => piece.trim())) {
        if (/^[A-Za-z][A-Za-z0-9]*$/.test(part)) symbols.add(part);
      }
    }
  }
  return [...symbols].sort();
}

/** Public entries that name one plot rather than a composition of two. */
export function distinctPublicPlots(groups: ChartGroup[]): ChartEntry[] {
  return groups.flatMap((group) =>
    group.entries.filter((entry) => entry.status === "public" && !entry.symbol.includes("+")),
  );
}

/** Public entries whose renderer is not the default ECharts adapter. */
export function alternateEngineEntries(groups: ChartGroup[]): ChartEntry[] {
  return groups.flatMap((group) =>
    group.entries.filter((entry) => entry.status === "public" && entry.engine !== "echarts"),
  );
}

export function chartStatusCounts(groups: ChartGroup[]): Record<ChartStatus, number> {
  const counts: Record<ChartStatus, number> = { public: 0, engine: 0, planned: 0, blocked: 0 };
  for (const group of groups) for (const entry of group.entries) counts[entry.status] += 1;
  return counts;
}
