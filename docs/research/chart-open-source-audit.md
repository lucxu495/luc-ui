# LUC UI — chart open-source audit

Researched **2026-09-26** for LUC UI V0.2 (Chart System). Licenses, star counts
and last-push dates were read from the GitHub API on that date; the two engines
we actually ship were additionally verified against the license files inside the
installed packages.

The question for every entry is the same: *what should LUC UI learn, and what —
if anything — should it depend on?*

| Repository | License | Signal | Strength | Weakness | Interesting idea | LUC role |
| --- | --- | --- | --- | --- | --- | --- |
| [apache/echarts](https://github.com/apache/echarts) | Apache-2.0 | 67.4k★, pushed 2026-09-16 | One modular API covers Cartesian, matrix, hierarchy, flow, radial and gauge; strong large-data behaviour; `dataset`, `markLine/markArea`, `visualMap`, `brush`, `connect` | Default theme and default tooltip are unmistakably "ECharts"; bundle is large unless modular; theme is applied at init | `extendOption` as a deliberate escape hatch; `connect` for same-engine sync | **DIRECT_DEPENDENCY** (general engine, modular imports only) |
| [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | Apache-2.0 **+ attribution notice** | 17.4k★, pushed 2026-09-25 | Candles, volume, panes, price scales, crosshair and range are native; tiny API; very fast at a few thousand bars | Financial vocabulary only; no built-in tooltip DOM; theme must be re-applied | `attributionLogo` satisfies the licence requirement; panes API keeps multi-pane simple | **DIRECT_DEPENDENCY** (financial engine) |
| [leeoniya/uPlot](https://github.com/leeoniya/uPlot) | MIT | 10.5k★, pushed 2026-09-26 | Extremely fast time series; cursor sync built in; tiny | Sparse API, dated visual defaults, no panes | Cursor synchronisation model — one of the things we copied conceptually for `ChartSyncGroup` | **REFERENCE_ONLY** |
| [ChartGPU/ChartGPU](https://github.com/ChartGPU/ChartGPU) | MIT | 3.2k★, pushed 2026-08-24 | WebGPU rendering for very large data, streaming and multi-chart dashboards | WebGPU availability and fallback story still unsettled | A future ceiling check, not a current need | **REFERENCE_ONLY** |
| [f5/unovis](https://github.com/f5/unovis) | Apache-2.0 | 2.9k★, pushed 2026-09-23 | Modular, framework-agnostic, attractive defaults, good network/flow charts | Smaller coverage than ECharts; visual language would have to be overridden wholesale | Component-per-family structure | **REFERENCE_ONLY** |
| [antvis/G2](https://github.com/antvis/G2) | MIT | 12.6k★, pushed 2026-09-24 | Real grammar of graphics: marks, transforms, coordinates, interaction grammar | Learning curve; a second mental model next to our spec | Informs the shape of `ChartSpec` (x, axes, series, annotations as data) | **REFERENCE_ONLY** |
| [vega/vega-lite](https://github.com/vega/vega-lite) | BSD-3-Clause | 5.5k★, pushed 2026-09-24 | The cleanest declarative encoding model in the ecosystem | Its own compiler and runtime; far heavier than our needs | "Encoding, not components" — the reason `SeriesSpec` is data, not JSX | **REFERENCE_ONLY** |
| [plotly/plotly.js](https://github.com/plotly/plotly.js) | MIT | 18.3k★, pushed 2026-09-25 | Enormous chart-type coverage including 3D, maps, scientific and statistical plots | Very heavy; its own visual identity; hard to theme convincingly | Used purely as a checklist of categories we might be forgetting | **REFERENCE_ONLY** |
| [chartjs/Chart.js](https://github.com/chartjs/Chart.js) | MIT | 67.7k★, pushed 2026-09-14 | Small, well-documented, good plugin model, decimation | Datasets-and-labels model fights time-series and multi-axis work | Plugin architecture | **REFERENCE_ONLY** |
| [recharts/recharts](https://github.com/recharts/recharts) | MIT | 27.6k★, pushed 2026-09-25 | Pleasant declarative SVG composition in React | SVG ceiling on large data; per-chart chrome is not portable | Composed-chart ergonomics informed our `ComposedChart` axis ids | **REFERENCE_ONLY** |
| [plouc/nivo](https://github.com/plouc/nivo) | MIT | 14.1k★, pushed 2026-07-21 | Excellent legends, tooltips, responsive wrappers and heatmaps | Many packages; each family is its own dependency | Tooltip and legend UX patterns | **REFERENCE_ONLY** |
| [airbnb/visx](https://github.com/airbnb/visx) | MIT | 21.1k★, pushed 2026-06-22 | Composable primitives over d3 scales; the right escape hatch for bespoke shapes | You build the chart; no chrome, no axes defaults | The escape hatch we keep in reserve | **REFERENCE_ONLY** (not installed) |
| [tremorlabs/tremor](https://github.com/tremorlabs/tremor) | Apache-2.0 | 3.6k★, pushed 2025-10-10 | Dashboard-ready KPI + chart composition and density | Derived from Recharts; visual identity is its own | Chart-card composition and density | **REFERENCE_ONLY** |
| [react-financial/react-financial-charts](https://github.com/react-financial/react-financial-charts) | MIT | 1.4k★, pushed 2024-03-09 | Complete financial feature vocabulary: Renko, Kagi, P&F, indicators, drawing tools | Effectively unmaintained since 2024 | The feature checklist for what a mature financial chart eventually needs | **REFERENCE_ONLY** |
| [TanStack/table](https://github.com/TanStack/table) | MIT | 28.5k★, pushed 2026-09-16 | Headless sorting, filtering, grouping, pagination, virtualisation | — | Planned data-table engine for V0.3 | **REFERENCE_ONLY** (planned dependency) |
| [bvaughn/react-resizable-panels](https://github.com/bvaughn/react-resizable-panels) | MIT | 5.4k★, pushed 2026-09-25 | Keyboard-accessible, persisted panel layouts | — | Research-terminal layouts | **REFERENCE_ONLY** (planned dependency) |
| [emilkowalski/sonner](https://github.com/emilkowalski/sonner) | MIT | 13.0k★, pushed 2026-08-10 | Best-in-class toast stacking and gestures | — | Feedback UX for a future LUC toast | **REFERENCE_ONLY** (planned dependency) |

## New treasures found during this round

Three projects were not on the V0.1 research list and are worth naming.

### uPlot — `leeoniya/uPlot` (MIT, 10.5k★)

- **What it adds**: proof that cursor and range synchronisation can be a
  first-class, tiny concern rather than a plugin. Its cursor API is the reason
  our sync bus carries a normalised x value and a window rather than an engine
  event object.
- **Why it matters**: it sets the performance expectation for dense time series
  (100k+ points at interactive frame rates).
- **How LUC might use it**: as an ultra-dense mode behind the same public API if
  a consumer ever needs more than ECharts can hold. Not installed: ECharts
  handled 10,000 points comfortably in this round's Showcase.

### ChartGPU — `ChartGPU/ChartGPU` (MIT, 3.2k★)

- **What it adds**: a WebGPU path for streaming and multi-chart dashboards.
- **Why it matters**: it marks the ceiling that canvas engines will eventually
  hit, and it is small enough to be a real option rather than a demo.
- **How LUC might use it**: reference only, because WebGPU availability and the
  no-WebGPU fallback story are not yet settled enough to put behind a product UI.

### AntV G2 — `antvis/G2` (MIT, 12.6k★)

- **What it adds**: a genuine grammar of graphics — marks, transforms,
  coordinates and interaction as composable nouns.
- **Why it matters**: it is the strongest argument that a declarative chart
  description should describe *encodings*, not components. `ChartSpec` follows
  that: `x`, `axes`, `series`, `annotations`, `interaction` are data.
- **How LUC might use it**: reference only. Adopting it would introduce a second
  rendering mental model next to ECharts for no visual gain.

## Rejected as a runtime dependency

| Candidate | Why not |
| --- | --- |
| Plotly.js | 3D, maps and scientific plots are not needed by any current LUC product, and the bundle cost is paid on every page. |
| Chart.js | The datasets-and-labels model makes time axes, multi-axis composition and financial panes awkward. |
| Recharts | SVG ceiling for dense time series, and its chrome would have to be discarded anyway. |
| Nivo | One package per family, and the visual language is not ours to keep. |
| visx | Nothing this round needed a shape ECharts cannot express. Kept as the documented escape hatch. |
| G2 / Vega-Lite | A second grammar and a second runtime. We took the ideas, not the dependency. |
| react-financial-charts | Unmaintained, and Lightweight Charts covers the same ground at a fraction of the size. |
| uPlot / ChartGPU | Not justified while the chosen engines hold the data volumes we have measured. |

## Performance notes gathered while auditing

- ECharts renders 10,000-point line series in this Showcase without animation
  and stays interactive while zooming; heatmaps use its progressive path.
- Lightweight Charts is comfortable at a few thousand bars with several panes;
  panes are the expensive part, not the candles.
- Progressive rendering, `large` mode and decimation are all available in the
  chosen engines. LUC UI deliberately does **not** decimate silently — that is a
  data-layer decision, documented in `docs/CHART_GUIDE.md`.
