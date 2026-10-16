/*
 * Which pages mount a Playground, and which adapter each one mounts.
 *
 * One string per entry, and that string is the whole interface: the generator
 * copies it into the registry, `Playground` (or `ChartPlayground`) resolves it
 * through the adapter registry, and `tests/unit/playground-wiring.test.ts`
 * checks both directions — a wired id must resolve, and a registered adapter
 * must be reachable from a page. Without that test a stale string renders
 * `null`, which looks exactly like "this component has no Playground", and a
 * reader would never know a panel was missing.
 *
 * Two registries, one per client boundary, because a chart adapter pulls a
 * rendering engine with it: `entry.playground` is resolved by `Playground` for
 * most entries and by `ChartPlayground` for a chart page.
 */

export const ENTRY_PLAYGROUNDS: Record<string, string> = {
  /*
   * Primitives and composition.
   *
   * `card` used to keep a panel here, on the grounds that `selected` is only
   * meaningful when `interaction` is `selectable` and a disabled control with its
   * reason (WB-004) states that dependency better than an example can. The
   * Navigation review overruled it: an ordinary component page is examples and
   * nothing else, and the dependency is now a Guidelines row on
   * `/components/cards` — the panel's four variants, three interaction modes and
   * padding scale all fit in the examples. `adapters/card.tsx` went with it.
   *
   * `button` and `profile-hero` were *wired but never mounted*: their pages pass
   * no `PlaygroundSection`, and a curated page is the only thing that can mount
   * one, so the two adapters were dead code that the wiring test could not see —
   * it checks that a row resolves to an adapter, not that a page renders it. The
   * Feedback review removed them for the same reason Card went: an ordinary
   * component page demonstrates its props with examples, and `/components/buttons`
   * has covered variants, sizes, states, loading and icon composition for two
   * batches. `qa/playground.mjs` reports both routes as `no-playground`, which is
   * now the truth rather than a stale promise.
   *
   * What remains is the case a panel is actually for: a surface whose
   * configuration changes something the reader is looking at.
   */
  "kinetic-headline": "kinetic-headline",
  /* The AI surface. */
  ai: "chat-message",
  /* Charts — resolved through `registry.charts.ts` by `ChartPlayground`. */
  "line-chart": "line-chart",
  "violin-chart": "violin-chart",
  /*
   * The rest of the chart catalogue.
   *
   * A chart page mounts the *generated* chart panel
   * (`registry.charts.ts` → `generatedChartPlayground`), which is built from the
   * Live Demo's own fixture: the same props object the page renders, with
   * controls for the three props every family declares (height, state and the
   * accessible name). `line-chart` and `violin-chart` keep the hand-written
   * adapters above, which offer more.
   *
   * Wiring a chart before its demo exists is what the wiring test forbids — the
   * panel would silently resolve to `undefined` — so this list is only ever true
   * while `tests/audit/demo-coverage.test.ts` is green.
   */
"area-chart": "area-chart",
  "autocorrelation-chart": "autocorrelation-chart",
  "bar-chart": "bar-chart",
  "box-plot-chart": "box-plot-chart",
  "bubble-chart": "bubble-chart",
  "bullet-chart": "bullet-chart",
  "bump-chart": "bump-chart",
  "calendar-heatmap": "calendar-heatmap",
  "calibration-chart": "calibration-chart",
  "candlestick-chart": "candlestick-chart",
  "chord-chart": "chord-chart",
  "composed-chart": "composed-chart",
  "confusion-matrix-chart": "confusion-matrix-chart",
  "contour-chart": "contour-chart",
  "correlation-matrix": "correlation-matrix",
  "curve-comparison-chart": "curve-comparison-chart",
  "dendrogram-chart": "dendrogram-chart",
  "depth-chart": "depth-chart",
  "distribution-chart": "distribution-chart",
  "drawdown-chart": "drawdown-chart",
  "dumbbell-chart": "dumbbell-chart",
  "ecdf-chart": "ecdf-chart",
  "efficient-frontier-chart": "efficient-frontier-chart",
  "error-bar-chart": "error-bar-chart",
  "event-timeline": "event-timeline",
  "factor-exposure-chart": "factor-exposure-chart",
  "fan-chart": "fan-chart",
  "feature-importance-chart": "feature-importance-chart",
  "funnel-chart": "funnel-chart",
  "gantt-chart": "gantt-chart",
  "gauge-chart": "gauge-chart",
  "graph-chart": "graph-chart",
  "heatmap-chart": "heatmap-chart",
  "hexbin-chart": "hexbin-chart",
  "hierarchy-tree-chart": "hierarchy-tree-chart",
  "histogram-chart": "histogram-chart",
  "historical-position-chart": "historical-position-chart",
  "lollipop-chart": "lollipop-chart",
  "mekko-chart": "mekko-chart",
  "parallel-coordinates-chart": "parallel-coordinates-chart",
  "pie-chart": "pie-chart",
  "pnl-attribution-chart": "pnl-attribution-chart",
  "polar-rose-chart": "polar-rose-chart",
  "precision-recall-chart": "precision-recall-chart",
  "qq-plot-chart": "qq-plot-chart",
  "quadrant-scatter-chart": "quadrant-scatter-chart",
  "radar-chart": "radar-chart",
  "range-band-chart": "range-band-chart",
  "regime-strip": "regime-strip",
  "ridgeline-chart": "ridgeline-chart",
  "roc-curve-chart": "roc-curve-chart",
  "sankey-chart": "sankey-chart",
  "scatter-chart": "scatter-chart",
  "scatter-matrix-chart": "scatter-matrix-chart",
  "scatter-regression-chart": "scatter-regression-chart",
  "slope-chart": "slope-chart",
  "sparkline": "sparkline",
  "spectrogram-chart": "spectrogram-chart",
  "sunburst-chart": "sunburst-chart",
  "surface3-dchart": "surface3-dchart",
  "survival-curve-chart": "survival-curve-chart",
  "term-structure-chart": "term-structure-chart",
  "ternary-chart": "ternary-chart",
  "theme-river-chart": "theme-river-chart",
  "treemap-chart": "treemap-chart",
  "vector-field-chart": "vector-field-chart",
  "volatility-smile-chart": "volatility-smile-chart",
  "volatility-surface-chart": "volatility-surface-chart",
  "waterfall-chart": "waterfall-chart",
  "wind-rose-chart": "wind-rose-chart",
};

/**
 * The next candidates, deliberately *not* wired.
 *
 * Listing them here is how "not written yet" stays visible instead of becoming
 * silent: the wiring test asserts these stay unwired while their adapter does
 * not exist, and the coverage numbers on `/docs` count them. They are
 * candidates, not promises — an adapter lands only when it can be honest about
 * the props involved.
 */
export const PLANNED_PLAYGROUNDS: Record<string, string> = {
  select: "select",
  slider: "slider",
  tabs: "tabs",
  "data-table": "data-table",
  /*
   * Deliberately not wired: `choropleth-chart`, `geo-scatter-chart` and
   * `geo-trajectory-chart`. All three need a base map registered with
   * `registerEChartsMap` before they can render at all, so a control panel over
   * "height, state and the accessible name" would be a panel bolted onto a demo
   * that the reader cannot re-fixture. They have a Live Demo and no Playground,
   * and the coverage report says exactly that. `small-multiples` joins them:
   * its fixture is a grid of child panels, so a control panel over the
   * container would control nothing a reader can see.
   */
};
