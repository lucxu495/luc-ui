# Chart coverage, status and roadmap

**Date:** 2026-10-08
**Companion to:** [`2026-10-08-phase-4-spatial-language-and-expansion.md`](./2026-10-08-phase-4-spatial-language-and-expansion.md)
**Public mirror:** `/charts/catalog` in the Showcase (bilingual).

---

## 1. Method

Three sources, kept separate:

1. **LUC UI's own registries** — `packages/ui/src/charts/index.ts` plus the five
   new pack modules, `docs/component-catalog.json` (generated), and the
   Showcase routes. This is the only source for "what LUC UI has".
2. **The engine's capability list** — the modular ECharts registrations in
   `adapters/echarts/runtime.ts`. A type is only "engine available" if a
   `core.use([…])` registration makes it drawable; an unregistered option is
   accepted and silently ignored, which is the single most common false claim
   about a chart library.
3. **Structural sharing** — two entries count as two types only when a reader
   would reach for them for different questions. Aliases and cosmetic variants
   are counted once. For example, the ECharts `CandlestickChart` and the
   Lightweight Charts `FinancialChart` are listed as one *type*, because a
   reader picks between engines, not between chart types.

## 2. Status legend

| Status | Meaning |
| --- | --- |
| **Public** | A typed component exists in `@luc/ui/charts` today, with tests and a Showcase page. |
| **Engine** | The renderer can draw it; LUC has not wrapped it. Reachable through `extendOption` / `onReady`. |
| **Planned** | Agreed as valuable, not started. The blocker is named. |
| **Blocked** | Needs a dependency or a dataset LUC deliberately does not ship. |

## 3. Current coverage

| Status | Count |
| --- | --- |
| Public | 62 |
| Engine | 2 |
| Planned | 2 |
| Blocked | 2 |
| **Total tracked** | **68** |

The count is reproducible from `/charts/catalog`, which renders exactly this
table from the same data. It is not a marketing number: the six non-public
entries are named below.

### 3.1 By domain

| Domain | Public types |
| --- | --- |
| General | Line, area, bar, composed, scatter, bubble, pie/donut, histogram, waterfall, funnel, range band, fan band, sparkline, small multiples (14) |
| Statistical | ECDF, Q–Q, violin, density/KDE, box plot, confidence interval, regression, residual, correlation matrix, ROC, calibration, confusion matrix, quadrant scatter (13) |
| Scientific and mathematical | Parallel coordinates, scatterplot matrix, polar rose, wind rose, ternary, vector field, contour, hexbin, spectrogram, theme river, ridgeline (11) |
| Financial and quantitative | Candlestick/OHLC, drawdown, term structure, curve comparison, volatility smile, efficient frontier, factor exposure, P&L attribution, market depth, historical position (10) |
| Multidimensional, network, hierarchy | Radar, Sankey, graph, treemap, sunburst, tree/dendrogram (6) |
| Workflow and operations | Gantt, dumbbell, lollipop, bullet, slope, bump, Mekko, segmented bars (8) |
| Time series and sequence | Regime strip, event timeline, calendar heatmap, heatmap, gauge, rolling measure (6) |
| Geographic | Geographic scatter (1) |

### 3.2 The non-public entries

| Type | Status | Why |
| --- | --- | --- |
| 3D surface (and a 3D volatility surface) | **Blocked** | Needs `echarts-gl`, roughly 180 KB, for a genuine 3D coordinate system. It must not enter the base `@luc/ui/charts` entry point; the correct shape is an optional `@luc/ui/charts-3d` subpath behind a dynamic import. |
| Choropleth | **Planned** | It needs a value per region plus a registered map, which is a different data contract from `GeoScatterChart`'s point list. The engine is ready — `MapChart` and `GeoComponent` are registered — so what blocks it is the region-value contract and the map-data policy. |
| Chord diagram | **Planned** | Arc layout and adjacency ordering are the work; the engine draws the marks. Worth doing only with a real consumer. |
| Route / trajectory map | **Engine** | `lines` with `coordinateSystem: "geo"` draws it today through `extendOption`. A wrapper is a small job once a consumer needs it. |
| Spatial density (map) | **Engine** | `HexbinChart` plus `GeoScatterChart` cover it; a dedicated combined component would duplicate both. |

## 4. Correctness rules that apply to every new type

1. **Required data shape is in the props type.** No `unknown[]`.
2. **Units and coordinate conventions are documented in the component JSDoc.**
   Ternary states which vertex is `a`; the spectrogram states that `values` is
   indexed `[frequency][time]` and names the unit; the vector field states that
   `scale` multiplies the raw magnitude and that the multiplier is reported in
   the tooltip.
3. **Supplied versus calculated is explicit.** Every numeric input is the
   caller's. The only transforms in the whole pack are a barycentric projection
   (ternary), a hexagon polygon at a caller-supplied radius (hexbin), a
   silhouette offset delegated to the engine (theme river), a ridge offset
   (ridgeline), and the ratio to percent display mapping (`formatRatio`).
4. **Missing data is drawn as missing.** `null` in a bump chart breaks the line;
   a strike with no quote is fewer points; `connectNulls` stays `false`.
5. **Empty state is a real state.** Every new chart routes an empty input to
   `ChartEmptyState` with copy that names what was missing, and the Showcase QA
   sweep captures it — `GeoScatterChart` renders exactly that state when no map
   is registered.
6. **Fixtures are deterministic.** Every Showcase fixture is generated from a
   fixed seed at module load, so SSR and hydration agree and screenshots are
   stable.
7. **Accessible alternative.** All new charts sit behind the same
   `ChartDataTable` / `ChartDataViewToggle` contract as the rest of the system,
   and each supplies a fallback accessible name when the caller gives none.

## 5. Bundle and performance

- The five new modules live behind `@luc/ui/charts`; none is reachable from the
  root barrel's button-only consumer path. `pnpm test:consumer` asserts this.
- New engine registrations add code to the shared ECharts chunk, not to a
  per-component chunk. The consumer harness records the charts entry in
  `packages/ui/bundle-baseline.json` with an unchanged 8%-or-1KB tolerance; the
  measured growth is the registrations plus the five modules.
- `SpectrogramChart` sets `progressive` / `progressiveThreshold` so a long
  capture renders incrementally rather than blocking the main thread.
- `ScatterMatrixChart`, `MekkoChart`, `ViolinChart`, `GanttChart`, `HexbinChart`,
  `ContourChart`, `TernaryChart`, `ErrorBarChart` and `DumbbellChart` use ECharts
  `custom` series, which draw with `zrender` primitives and never allocate a
  React element per datum.
- Charts stay outside the React render path: the option is memoised on its
  inputs, and pointer interaction is handled by the engine (`emphasis`,
  `blurScope`) rather than by re-rendering React.

## 6. Recommended sequence beyond Phase 4

| Order | Item | Why now | Cost |
| --- | --- | --- | --- |
| 1 | Choropleth `MapChart` plus a documented map policy | The engine is ready; the only blocker is a region-value contract, which is a design decision rather than an engineering one | Small |
| 2 | `@luc/ui/charts-3d` behind a dynamic import | Unblocks 3D surfaces, including the 3D volatility surface, without touching the base entry point | Medium |
| 3 | Route/trajectory `GeoLinesChart` | A thin wrapper over `lines` on a geo coordinate system | Small |
| 4 | Chord diagram | Needs a real consumer to justify the arc layout | Medium |
| 5 | Gantt dependency arrows, resource lanes, critical path | The base Gantt exists; a planner build-out is the natural next step | Medium |
| 6 | Scroll-driven chart scenes | Uses the existing chart sync bus plus the motion layer | Medium |

Nothing above is started. Each is listed so the backlog stays actionable rather
than aspirational.
