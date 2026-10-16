# LUC UI — chart guide

V0.2 ships the chart system: two engines, one experience. The engines draw
pixels; LUC UI owns everything the reader perceives.

## 1. The split

```
LUC chart system
  |
  +-- chrome (engine independent)
  |     ChartCard, ChartHeader, ChartPlot, ChartToolbar, ChartLegend,
  |     RangeSelector, ChartSkeleton, ChartEmptyState, ChartErrorState,
  |     FullscreenResearchView, ChartExportButton, ChartResetButton
  |
  +-- config primitives
  |     ChartSpec, SeriesSpec, AxisSpec, AnnotationSpec, ChartFormat,
  |     ChartRangeSpec, ChartInteractionSpec, ChartTooltipSpec, syncGroup
  |
  +-- adapters (the only files allowed to import an engine)
  |     adapters/echarts      -> general analytical charts
  |     adapters/lightweight  -> financial price charts
  |     components/sparkline  -> hand-rolled SVG, no engine
  |
  +-- interaction layer
        core/sync.ts (bus), core/formatters.ts, core/export.ts, marks.ts
```

An adapter may import its engine. **Nothing else may.** Reach the engine only
through the documented escape hatches:

| Escape hatch | Use when |
| --- | --- |
| `spec.extendOption(option)` | The assembled ECharts option needs one last override. |
| `onReady={(engine) => …}` | You need the live instance — export, custom actions, measurement. |
| `<EChartSurface>` / `<LightweightSurface>` | You are writing a family the spec cannot express. |

If a page needs an escape hatch for something a spec could express, the spec is
missing a field. Add it to `types.ts` instead.

## 2. Choosing an engine

| Need | Component | Engine |
| --- | --- | --- |
| Time series, bars, scatter, heatmap, hierarchy, flow, radial | `LineChart`, `AreaChart`, `BarChart`, `ScatterChart`, `BubbleChart`, `ComposedChart`, `WaterfallChart`, `HistogramChart`, `BoxPlotChart`, `HeatmapChart`, `CorrelationMatrix`, `CalendarHeatmap`, `PieChart`, `TreemapChart`, `SunburstChart`, `FunnelChart`, `SankeyChart`, `GraphChart`, `RadarChart`, `GaugeChart` | ECharts |
| Candles, volume, price panes, financial overlays | `FinancialChart` | Lightweight Charts |
| Term structure, smile, yield curve, depth | `TermStructureChart`, `CurveComparisonChart`, `DepthChart` | ECharts (thin wrappers over the line/area families) |
| Stat cards, watchlists, dense table cells | `Sparkline`, `SparkArea`, `MiniBar` | none (SVG) |

## 3. Choosing a chart type

| Question the reader has | Chart |
| --- | --- |
| How did this change over time? | `LineChart` (with `smooth` or `step` when the data is smooth or discrete) |
| How much of the total happened here? | `AreaChart`, stacked when the parts sum to a meaningful whole |
| How do these categories compare? | `BarChart` |
| What is the distribution? | `HistogramChart`, `BoxPlotChart` |
| Do these two measures move together? | `ScatterChart`, `BubbleChart` when a third prepared value matters |
| How do many pairs relate at once? | `CorrelationMatrix` |
| What is the shape of the whole? | `PieChart` (donut), `TreemapChart`, `SunburstChart` |
| Where does it go? | `SankeyChart`, `GraphChart` |
| Where did it drop out? | `FunnelChart` |
| How do I compare a profile across dimensions? | `RadarChart` (two or three series, never five) |
| How is one number tracking against its range? | `GaugeChart` |
| What is the price doing? | `FinancialChart` |
| Where could this plausibly go? (a forecast cone, a bootstrap) | `FanChart` |
| What is the estimate, and how wide is the interval? | `RangeBandChart` |
| Is this relationship real, and how strong? | `ScatterRegressionChart` (the fit is **input**) |
| Which quadrant is this asset in? | `QuadrantScatterChart` |
| What shape is this sample, and where is its centre? | `DistributionChart` (bins + density + prepared references) |
| In which regime was this observation? | `RegimeStrip` |
| What happened, and when? | `EventTimeline` |
| Four windows of the same measure | `SmallMultiples` + `SmallMultiple` |

Rules that stop the usual mistakes:

1. A pie needs a real whole, six or fewer parts, and no need for precise values.
   Otherwise it is a bar chart.
2. A dual axis is a claim that two measures share a shape but not a unit. Name
   the axes (`axis: "primary" | "secondary"`) and format each axis separately.
3. Never stack series with different units. Percent stacking is the only honest
   mixed stack, and `stackMode: "percent"` says so in the code.
4. More than about twelve categories on a vertical bar axis means the chart
   should be horizontal, filtered, or a table.
5. Radar with four or more overlapping series is noise. Two is ideal.
6. **A fit, a band, a bin and a quantile are all inputs.** `FanChart`,
   `RangeBandChart`, `ScatterRegressionChart`, `DistributionChart` and
   `BoxPlotChart` never compute. The analytics layer owns the statistics; the
   chart owns the picture (§40).
7. On a `time` x-axis, every point of every series must be an `[x, y]` pair. A
   bare number is read as an x *index*, which draws a band in the wrong place —
   the V1.1 band-chart bug, now covered by the showcase and the chart contract
   tests.

## 3a. Chart animation (V1.1)

`ChartSpec.animation` takes `none` | `subtle` | `standard` | `emphasized`
(default `standard`). It resolves through `useChartMotion`, which also owns the
two policies that matter more than the numbers:

- **Reduced motion is zero, not slow.** `prefers-reduced-motion` (or
  `data-motion="reduced"`) renders the final frame immediately, disables the
  universal transition and skips the entrance.
- **A large series is drawn, not animated.** Past
  `CHART_ANIMATION_POINT_LIMIT` marks the entrance is clipped and the universal
  transition is refused, because animating ten thousand points is waste, not
  polish.

Hover emphasis is a *reading* aid and is on for every family: the hovered series
is focused, its peers step back through a shared `blur` state (line 0.24, area
0.10), and no data is hidden. Use `ChartSpec.universalTransition` only when two
views are genuinely the same data in two shapes (a histogram ↔ a ranked bar), and
remember it is refused for a dense series.

## 4. Data contract

Rows are `object`s with a field per series. An x field is named by `xKey`.

```ts
<LineChart
  data={rows}              // readonly TRow[]
  xKey="time"              // Date | number | string
  x={{ type: "time" }}     // optional; inferred when every value is a Date
  series={[
    { key: "close", label: "Close", tone: "accent" },
    { key: "sma50", label: "SMA 50", tone: "info", lineType: "dashed", symbol: false },
  ]}
/>
```

Guidance:

1. **x axis.** A `Date` (or an ISO string with `type: "time"`) becomes a time
   axis in milliseconds. Numbers use a value axis. Anything else is categorical.
   A numeric x that should be *positional* (depth, scatter, curves) needs
   `x: { type: "value" }`; otherwise small numbers are treated as an ordering.
2. **Gaps.** `null` is a gap, never a zero. Nothing is dropped or interpolated.
3. **Units.** Chart components never convert. `12.4` with `{ kind: "percent" }`
   renders `12.4%`; it does not assume the input was `0.124`.
4. **Analytics.** Binning, smoothing, correlation, drawdown, RSI, MACD and
   volatility are the caller's job. The Showcase has deterministic mock
   generators for demos; production components stay calculation-agnostic.

## 5. Series model

| Field | Meaning |
| --- | --- |
| `key` | Row field, or a stable id for inline `data`. |
| `type` | `line`, `area`, `bar`, `scatter`, `candlestick`, `boxplot`. |
| `axis` | Axis id: `primary`, `secondary`, or a custom id declared in `axes`. |
| `tone` | `accent`, `positive`, `negative`, `warning`, `info`, `neutral`. |
| `palette` | Explicit slot 1–12 when tone is not expressive enough. |
| `stack` / `stackMode` | Share a stack key; `"percent"` normalises to 100%. |
| `smooth` / `step` / `area` / `areaGradient` | Line-family shape. |
| `symbol` / `lineWidth` / `lineType` / `opacity` | Stroke and marker. |
| `format` / `formatter` | Presentation. `formatter` wins. |
| `visibleByDefault` | Seeds a legend's initial state. |
| `sizeKey` | Bubble family: row field for symbol area. |

## 6. Colour

- `chart.series.1 … 12` is a deliberate categorical palette, tuned per theme.
- **V1.1 adds two continuous ramps and a deterministic assignment rule.**
  `chart.seq.low/mid/high` and `chart.div.low/mid/high` are the ramp anchors;
  `sequentialPalette(theme, n)` and `divergingPalette(theme, n)` interpolate
  them (`fanPalette` returns one hue at layered opacity for quantile bands).
  Use a ramp when the question is *how much* (intensity, correlation, exposure);
  use the categorical palette when the question is *which series*.
- **`seriesColor(theme, key, index?)` is the assignment rule.** A series key
  resolves to a *stable* slot: `price`/`primary` → slot 0, `benchmark`/
  `reference` → slot 1, then the macro factors, funding, open interest, risk and
  on-chain concepts, then a stable hash for anything unknown. The point is that
  filtering a series out of a chart never repaints the others, which is what an
  index-based palette does. Pass an explicit `index` only when the caller owns
  the order.
- **`benchmarkColor(theme)`** gives the reference treatment: a distinct hue,
  drawn thinner and dashed beside a primary series. A benchmark in the primary's
  own colour at low opacity reads as the same series.
- `chart.positive / negative / warning / neutral` are *semantic* and are never
  used for arbitrary series. A categorical series must never mean "up".
- A series gets its colour from `tone`, then `palette`, then its index. Use
  `color` only through the escape hatch.
- The resolved palette is normalised to `rgb()`/`rgba()` before it reaches an
  engine: Chrome hands back `lab(...)` for `oklch()` input, and neither engine's
  colour parser understands `lab()`, `oklch()` or `color-mix()`.
  `parseColor` therefore also converts `oklch()` itself, so a ramp built from
  the fallback theme (which is authored in oklch) still resolves to real
  channels before the DOM is ready.

## 6a. Rendering correctness (V0.6)

Two engine-level rules came out of the V0.6 bug reports. Both are about the
canvas telling the truth, not about taste.

### `useDirtyRect` stays off

`EChartSurface` initialises ECharts with `useDirtyRect: false`.

zrender's dirty-rectangle mode repaints only the regions an element reports as
changed. A series whose intro animation starts from a *degenerate* shape — the
box plot collapses every box onto its median before growing it — can then be left
unpainted: the canvas keeps the collapsed frame, and the box only appears when a
pointer event happens to repaint its region. That is exactly the reported bug
("boxes invisible until hover"), it reproduced on a theme flip as well as first
paint, and it disappeared at every device pixel ratio once the flag was off. A
full repaint per frame is what the rest of the charting world does.

Measured with a pixel probe on `/charts/distribution`: with dirty rect on, the
box-plot layer held 12,788 painted pixels and only one of six boxes; with it off,
26,164 pixels and all six, deterministically across runs.

A second, related defect was fixed at the same time: `EChartSurface` applied the
option twice on mount (once at init, once when `ready` flipped), which restarted
the intro animation of every chart for nothing. The surface now tracks the last
option it applied and skips the redundant one.

### Resting marks are not hover marks

A chart must be readable without a pointer. The box plot's body, median,
whiskers and caps are drawn at rest with a solid accent stroke and a visible
body; hover deepens the same three values (body `0.24 → 0.40`, border
`1.5 → 2`). Nothing that is invisible at rest becomes visible on hover.

## 6b. Matrix value labels (V0.6)

A correlation matrix is read from two channels: the colour and the coefficient.
Printing all of them into a 30×30 grid is noise; printing none of them throws
away half the information.

- `labelMode: "auto" | "always" | "never"` (`auto` is the default).
- `auto` decides from the **rendered cell**, not the row count: values appear
  while a cell is at least `44 × 18` CSS pixels
  (`MATRIX_LABEL_MIN_CELL`), and the decision is re-made on every draw — which is
  why a matrix inside a wider Workspace pane gains its values without a remount.
- The diagonal is printed as `1.00`. The V0.5 implementation blanked it, which
  was the "values in only some cells" half of the bug report.
- `formatValue` overrides the default two-decimal, sign-preserving format.
- `showValues` (the V0.5 prop) still works as `true → "always"`, `false → "never"`.

**Ink is chosen per cell.** A single `textPrimary` ink cannot work: the diverging
ramp crosses mid-lightness, where neither a dark nor a light ink clears 4.5:1 —
the light-theme saturation end measured 3.0:1 against `--fg-primary`.
`readableInk()` composites the cell colour over the card surface, measures both
candidates from the absolute tokens `--chart-ink-dark` / `--chart-ink-light`,
and picks the better one. Where even the better ink falls short (worst case
measured: ~4.0:1) a hairline outline in the card colour closes the gap; it is a
backstop, not the mechanism.

The dense case still has to work: when the labels hide, the tooltip always names
the pair and the coefficient, and the accessible `ChartDataTable` retains every
value.

### Marking the current cell

A period matrix has a newest cell, and a reader should not have to count columns
to find it.

```tsx
<HeatmapChart
  xLabels={["Q1", "Q2", "Q3", "Q4"]}
  yLabels={years}
  values={quarterReturns}
  highlight={[[1, years.length - 1]]}  // [x, y] cells that are "now"
/>
```

`highlight` changes nothing about the values or the colour domain: the marked
cell keeps the fill its own value earned and gains an accent edge, so "where the
series currently is" is a property of the matrix rather than a separate card
above it. An empty cell may be marked too — that is how an in-progress period
is distinguished from a completed one.

## 7. Tooltips

Every tooltip is LUC markup assembled in `adapters/echarts/tooltip-html.ts` and
styled by `styles/charts.css`:

| Mode | For | Shape |
| --- | --- | --- |
| `axis` | Time series, composed charts | Date header, one aligned row per visible series, optional total |
| `item` | Bars, scatter, heatmap, flow, radial | Item header, label/value grid, optional delta row |
| `none` | Decluttered charts | No tooltip at all |

Financial tooltips are built in `FinancialChart` from the live crosshair: date,
OHLC grid, signed change with percentage, volume, then each visible overlay.

Rules:

1. Never accept an engine-default tooltip. `tooltipShell()` neutralises the
   engine's box and keeps the tooltip inside the chart container so the LUC CSS
   variables still resolve.
2. Numbers are tabular. Values are right-aligned in a grid.
3. A tooltip reports only fields that exist. `null` renders an em dash.
4. `Pinned inspection` (click to pin) is **deferred** to V0.3 — it needs a pin
   affordance, an unpin gesture and a rule for a pinned x that scrolls away.

### Histograms: bin range, count and share

`HistogramChart` / `DistributionChart` take `xLabel` / `yLabel` for the axis
titles — an unlabelled pair of numbers leaves the reader to guess which axis is
the bin and which is the count. A bin's tooltip always prints the axis unit (the
caller formats the edges through `xFormat`) and its count. A `share` on a bin
(a served `frequency`) is printed as **Share**; without one the tooltip shows no
share at all, because a percentage derived inside the chart would be a statistic
LUC UI is not entitled to invent.

### The tooltip surface (fixed in V0.3)

Tooltips use a dedicated, effectively opaque surface:
`--chart-tooltip-surface` / `--chart-tooltip-border` / `--chart-tooltip-shadow`,
defined per theme alongside the other `--chart-*` tokens. No backdrop blur is
used to make the text readable.

That is a fix, not a preference. The V0.2 tooltip resolved to a **transparent
panel**: the option builder handed the engine a transparent shell, which is
correct, but `styles/charts.css` also reset `.luc-chart-tooltip-shell > div` —
and the formatter output *is* the shell's direct child, so the reset matched our
own panel and zeroed its background with `!important`. The visible result was
grid lines and candles showing through the values, worst when several
synchronised tooltips sat at the same x.

Two rules came out of it, both now in `DESIGN_SYSTEM.md` §8a:

1. A surface that carries text is opaque; translucency belongs to decorative
   shells.
2. Reset the engine's shell, never its payload. The current rule is
   `.luc-chart-tooltip-shell > div:not(.luc-chart-tooltip)`.

The browser QA asserts the computed alpha of `.luc-chart-tooltip-shell
.luc-chart-tooltip` in both themes (Chrome serialises an `oklch()` background as
`lab()`, so the check parses the alpha generically) and asserts that
`backdrop-filter` is `none`.

## 8. Legends and series visibility

`ChartLegend` is the control *and* the key: clicking a row toggles a series and
the swatch reflects the state. Visibility is local presentation state
(`useSeriesVisibility`), never a refetch. `ChartLegend` renders `aria-pressed`,
so it is reachable and announced.

Legends live in the card footer, under the plot. A legend that floats over the
data is allowed only when the plot has an empty corner and the legend has a
background.

## 9. Ranges, zoom and brush

| Concern | API |
| --- | --- |
| Trailing window | `ranges` on a `ChartSpec`, or `RangeSelector` in a header |
| Wheel zoom / pan | `interaction={{ zoom: "inside", pan: true }}` |
| Slider zoom | `interaction={{ zoom: "slider" }}` |
| Brush selection | `interaction={{ brush: true }}` |
| Off | `interaction={{ zoom: "none" }}` (default for depth and small multiples) |

Range changes must not refetch when all the data is already loaded: filter the
rows and pass the slice. `windowForRange` in the Showcase demonstrates it.

## 10. Annotations

```ts
annotations={{
  referenceLines: [{ value: 100_000, label: "100k", axisLabel: true }],
  referenceBands: [{ from: z2, to: z3, label: "Stretched", tone: "negative" }],
  markers: [{ at: eventTime, label: "Rate decision", shape: "flag", line: true }],
}}
```

- All three are silent and un-animated; they must never fight the data.
- Bands default to 8% alpha. A band that competes with a series is a bug.
- `Date` values are converted to milliseconds at the adapter boundary, so an
  annotation and its series always agree on the x axis.

### Marker shapes and compact markers

`EventMarkerSpec.shape` is `"dot" | "flag" | "pin" | "square" | "triangle-up" |
"triangle-down"`. The last three are the **directional** vocabulary: a square for
a neutral reference event (a protocol milestone), an upright triangle for an
upside landmark, an inverted one for a downside landmark. The glyph carries the
meaning, so the overlay still reads with the colours removed.

```ts
markers: [{
  at: eventDate,
  label: "BTC current-cycle high",
  tone: "negative",
  shape: "triangle-down",
  line: true,
  // Supplying `detail` makes the marker *compact*.
  detail: [["Date", "2025-10-06"], ["Price", "$124,658.54"], ["Cycle", "btc_cycle_840000"]],
}]
```

Supplying `detail` is what makes a marker compact: it suppresses the permanent
label, so a dense event layer never covers the series it annotates, and the
marker's own fields are appended to the chart's tooltip at that date (within
`EVENT_DETAIL_TOLERANCE_MS`, so the pointer does not have to land on the exact
column of a dense daily series). A marker without `detail` keeps the V0.5
behaviour (`shape: "dot"` prints nothing, `flag`/`pin` print the label).

### Dated events

`EventTimeline` puts dated events on one time axis. `labelMode: "auto"` prints
each event's own label at its marker while the history is short enough to read
(at most twelve rows **and** no pile-up: the tightest pair must have room for its
own label — see `MIN_LABEL_GAP_SHARE`), and falls back to markers-only — the
tooltip then carries the name, date and category — once labels would collide
into texture. The label is always the caller's string; LUC UI has no idea what a
halving is.

`range` gives the plate the same lookback control every other historical chart
has. The caller owns the vocabulary and resolves the window (it knows the
asset's own clock); the chart only clamps its time axis, so nothing refetches and
nothing is recomputed. `range.window: null` is MAX.

```tsx
<EventTimeline
  events={events}
  range={{ ranges: ["3m", "6m", "1y", "2y", "5y", "max"], value, onValueChange, window }}
/>
```

### Pointer overlays on Lightweight Charts

Lightweight Charts has no annotation tooltip — a series marker prints a
permanent `text` and nothing else. `LightweightSurface` therefore publishes the
cursor (`onCrosshair`, a plain `CrosshairPosition`: the timestamp under the
pointer plus the pointer's own plot coordinates) so a caller can draw its own
overlay without reaching into engine internals. It carries no data and triggers
no React render of its own.

## 11. Synchronisation

```tsx
<ChartSyncGroup groupId="research-stack">
  <FinancialChart candles={candles} syncGroup="research-stack" />
  <LineChart data={rows} xKey="time" syncGroup="research-stack" series={funding} />
  <LineChart data={rows} xKey="time" syncGroup="research-stack" series={vol} />
</ChartSyncGroup>
```

- The bus (`core/sync.ts`) carries a normalised cursor (epoch ms) and a
  normalised window (`{ from, to }` in ms). No engine object crosses it.
- Cursor events are coalesced to one animation frame; range events are immediate
  and applied to a late subscriber on join.
- **Loop protection is two-layered.** A publish carries its origin id and is
  never delivered back to it; while an adapter applies a remote value it sets a
  guard so the engine's own resulting event is not re-published.
- `ChartSyncGroup` scopes a group id; a chart inside it inherits the group when
  it does not name its own `syncGroup`.

## 12. Fullscreen

`FullscreenResearchView` is a real research workspace: title, description,
latest readouts, range control, actions, export, series legend, and a chart that
fills the remaining height. Escape closes it; focus returns to the trigger. The
chart is re-rendered at the larger size rather than reparented, so an engine is
never asked to survive a DOM move.

## 13. Loading, empty and error

`ChartSurface` resolves the state **before** it resolves the plot. A chart that
is loading, empty or in error never initialises an engine at all:

| State | Rendered |
| --- | --- |
| `loading` | `ChartSkeleton` mirroring the final layout |
| `empty` | `ChartEmptyState` explaining why, with the action that fixes it |
| `error` | `ChartErrorState` naming what failed, with a retry |
| `ready` | The engine surface |

An empty chart is detected automatically when no series has a finite value, and
can be forced with `state="empty"`.

## 14. Theming

Chart colours come from `--chart-*` semantic tokens, defined for both themes in
`tokens.css`. `useChartTheme()` resolves them once per theme and caches the
result per mode; a theme flip rebuilds each option and re-applies it in place —
no remount, no lost zoom, no flash.

To add a chart token: add it to `:root` **and** `.dark`, bridge it in
`@theme inline` only if a utility needs it, and document it in
`DESIGN_SYSTEM.md`.

## 15. Accessibility

- A canvas surface renders `role="img"` with an `aria-label`, plus a visually
  hidden description wired through `aria-describedby` when one is supplied. A
  chart always has a name: the caller's label, then the spec title, then a label
  derived from the family and its visible series.
- The financial surface renders `role="figure"` instead, because the engine's
  canvas is focusable and the attribution notice is a link — `img` would be a
  nested-interactive defect.
- Legends are buttons with `aria-pressed`. Range selectors are radio groups.
  Fullscreen is a dialog with a title, a description and Escape.
- Reduced motion removes chart entrance animation and range transitions; the
  crosshair and hover feedback stay immediate.
- **Honest limitation**: a canvas chart is not screen-reader readable. LUC UI does
  not pretend otherwise, and a data-table fallback is not part of V0.2. Supply a
  `ariaDescription`, and give the reader the prepared numbers somewhere real.

## 16. Performance

- Both engines load through a dynamic import inside an effect: nothing touches
  `window` during SSR, and Lightweight Charts only loads on pages that render a
  financial chart.
- **An engine is created when it is worth the main thread.** `useChartArm`
  (`charts/core/use-chart-arm.ts`) gates every `EChartSurface` /
  `LightweightSurface`: an `IntersectionObserver` with a 900 px margin arms the
  surface as soon as it is about a screen away, and everything else joins one
  module-level queue that arms **one engine per idle period** (a 600 ms
  `requestIdleCallback` timeout is the backstop for a page that is never idle).
  The host box is in the layout the whole time, so nothing shifts; a caller that
  must be ready immediately passes `eager`. A research domain mounts twenty to
  forty surfaces at once, and most of them are below the fold.
- **The idle queue is bounded by distance.** Only a surface within
  `CHART_ARM_PREFETCH_SCREENS` (3) viewport heights of the viewport joins it;
  anything further arms on approach through the observer every surface has
  anyway. Measured on the Indicator domains, queueing *every* surface built a
  valuation domain's 46 canvases while the reader was still at the top of the
  page, and a Chrome trace of one navigation showed the main thread saturated
  from first paint to ~5 s. A chart five screens down is work the reader has not
  asked for yet; when they do scroll to it, the reserved box means the engine
  appears without moving anything on the page.
- ECharts is registered from `echarts/core` with only the chart types and
  components in use.
- Line series drop their vertex symbols past 60 points. Heatmaps use the
  engine's progressive path.
- 10,000-point series are the tested ceiling; the Showcase's performance page
  renders one with and without caller-side decimation and deliberately publishes
  no timing claims.
- LUC UI never decimates silently. If a series needs thinning, the data layer
  thins it.

## 17. Export

`ChartExportButton` + `core/export.ts` handle both engines: ECharts via
`getDataURL`, Lightweight Charts via `takeScreenshot()` composited over the card
surface so a transparent chart does not export as black. SVG and CSV export are
deferred.

## 18. Deliberate non-goals in V0.2

| Not built | Why |
| --- | --- |
| DataTable fallback for charts | It belongs with the V0.3 data table. |
| Pinned tooltip | Needs a real unpin gesture and a scroll-out rule. |
| 3D / ECharts-GL surface, contour, parallel coordinates | No consumer, and a large dependency for a demo. |
| Volatility surface rendering | Needs real options data to judge; architected, not implemented. |
| Server-side chart rendering | Reports are HTML with client charts; revisit with the serving layer. |
| CSV / shareable URL state | Export architecture is in place; the features are not. |

## Licensing notes for the engines

- **ECharts** — Apache-2.0. `LICENSE`, `NOTICE` and `licenses/` ship with the
  installed package. Modular imports only.
- **Lightweight Charts** — Apache-2.0 **and an attribution notice requirement**.
  `LightweightSurface` keeps `layout.attributionLogo` enabled, which the library
  documents as satisfying the requirement. Never hide it, and never imply
  TradingView endorsement.

See `docs/research/license-matrix.md` and
`docs/research/chart-open-source-audit.md`.

## 19. Chart kinetics (V1.2)

The V1.1 animation budget is unchanged — a chart's *entrance* and its *update*
are separate budgets, and past the point threshold ECharts stops animating
individual marks. V1.2 adds **interaction** kinetics on top, and never fakes
history:

| Interaction | Implementation | Engine | Performance |
| --- | --- | --- | --- |
| Series focus | The focused stroke thickens (+1.25px) and gains a soft shadow; peers dim through one `blur` definition declared in `baseOption` | ECharts | Constant cost; no extra marks |
| Current point | `SeriesSpec.currentPoint` appends one `effectScatter` series at the latest **real** observation (nulls skipped) with a lit core and a ripple halo | ECharts | One extra mark; the ripple is gated on `motion.emphasis` |
| Scatter focus | Hovered point scales 1.6×, gains a surface-coloured border and a halo | ECharts | Per-mark `emphasis`, no per-frame work |
| Heatmap focus | Hovered cell lights its border, lifts with a glow and forces its label on | ECharts | Per-cell `emphasis`; matrix geometry untouched |
| Range / preset changes | The chart's visible window is a pure viewport change; no new data | Both | See §A4/§A6 of the product spec |
| Fullscreen | `FullscreenChart` builds on `MorphingDialog`, so the panel grows out of the chart card | Both | One shared `layoutId`; no engine reparenting |

Rules that must not be broken:

1. `currentPoint` marks the latest *valid* observation of one series. It is never
   a forecast, never filled in for a gap, and only one series per chart should
   carry it.
2. No looping animation on a data mark. The current-point ripple is the single
   exception and is disabled when chart motion forbids it.
3. Reduced motion keeps every state change and drops every transition — the
   chart still draws, the marker still shows, the hover still emphasises; it just
   does so instantly.

## 20. Axis, scale and domain (V1.3)

Three decisions that used to belong to whichever engine drew the pixels now
belong to the chart system, in `charts/core/axis.ts`.

### 20.1 The axis side

**An ordinary single-Y-axis chart puts its plate on the right.**
`DEFAULT_Y_AXIS_SIDE = "right"`, and the declarative cartesian builder applies it
to the first axis. Two things follow:

- **A percentage is not a reason to move left.** Drawdown, funding, realized
  volatility, distance-to-MA and every other signed measurement read on the right
  exactly like price does, so a stacked research column has one visual edge.
- **A second axis is a deliberate exception.** Only a genuinely different unit
  (price USD on the right, volume units on the left) earns a second plate, and
  the *second* axis defaults to the left. Nothing else should pass `position`.

ECharts' own default is `left`; that is precisely why the analytical lane and the
financial lane used to disagree for no reason a reader could see.

### 20.2 The scale

```ts
type YScaleMode = "linear" | "log";

interface ChartSpec {
  scale?: {
    allowed?: readonly YScaleMode[]; // what the product may offer
    default?: YScaleMode;            // what it opens on
    mode?: YScaleMode;               // what the reader chose
  };
}
```

- **Scale is presentation, not analysis.** The adapter maps the *same* values
  linearly or logarithmically. No layer above the chart transforms them, and
  tooltips, crosshair values, annotations, exports and API payloads are always
  the original numbers.
- **Log is only valid for strictly positive data.** A request for log over a
  series that contains a zero or a negative resolves to linear and warns in
  development (`resolveScaleMode`). Never drop the value, never add an epsilon,
  never take an absolute value — ECharts would otherwise quietly draw a `[1, 10]`
  axis, which is worse than a linear chart.
- **No control when there is one option.** `ScaleSelector` renders `null` unless
  the allow-list has at least two modes; a signed drawdown never grows a Log
  toggle.
- **Nothing switches the scale behind the reader.** A range change moves the
  window, never the mapping. The mode is a stored preference (see
  `docs/INTERACTION_MATRIX.md`), not a function of the window.
- **Price and its moving averages share one scale.** Both series live on one
  axis; a chart can never plot price linear against its own SMA in log.

### 20.3 The domain

`resolveAxisBounds` gives every autoscaled linear axis the same treatment:

1. **Zero is a boundary.** A one-signed metric never grows a plot band into the
   direction its values cannot take (volatility has no negative part), unless the
   data itself reaches zero there.
2. **Every other edge gets proportional headroom** (10%, or 16% when a marker
   such as `currentPoint` is drawn on the extreme), so an extremum, its stroke
   and its glow are drawn inside the plot rather than riding its border.
3. **The drawdown crest is the case that matters.** 0% is the ceiling and stays
   the semantic maximum; the headroom above it is marked `maxHeadroom`, and the
   axis *does not label it* — a `+8.5%` tick on a drawdown would claim data that
   cannot exist. The tick and its split line stay; only the number goes.
4. **Declared levels stay visible.** A reference line or band value the chart
   communicates is folded into the extent, so a threshold that fell outside the
   axis cannot silently disappear.
5. **Flat and near-flat series** get a minimum visual span snapped to a 1/2/2.5/5
   step instead of a zero-height domain or an astronomical one.
6. **Log padding is multiplicative** (a fraction of the *log* span), and interior
   decade ticks stay readable.
7. **The bounds are functions, not frozen numbers.** ECharts calls them with the
   currently visible extent, so zooming keeps the padding instead of pinning the
   axis to the full-history domain.

Bounded metrics (RSI 0–100, correlation −1–1) declare `axes[].min` / `max` and
skip autoscaling entirely; a declared bound is a real value and always keeps its
label.

The financial lane does not use this function: Lightweight Charts autoscales to
the *visible* range and applies `scaleMargins` (12%) — the pixel-space equivalent
of the same headroom, which is what keeps a pannable price chart honest.

### 20.4 Plot geometry

One rectangle, derived from which sides carry an axis:

```ts
CHART_PLOT_LAYOUT = { edgeInset: 6, axisGutter: 60, topInset: 16, bottomInset: 12 };
resolveChartPlotRect(["right"]); // { left: 6, right: 60, top: 16, bottom: 12, containLabel: false }
```

- The gutter is **reserved**, not measured, and `containLabel` is off for the
  cartesian lane: two stacked charts whose labels read `$124.7K` and `-33.1%`
  must share one data area, and a per-chart measured inset is exactly what made
  them drift.
- Lightweight Charts reaches the same rectangle with
  `rightPriceScale.minimumWidth = axisGutter`, which is the library's own answer
  to "vertical stacks should have an identical price scale width".
- Fixed-geometry families (heatmap, correlation matrix, waterfall, flow) keep
  their own deliberate grids: a matrix header is not a value-axis gutter.

### 20.5 Axis labels

`numericAxisFormatter` abbreviates from ten thousand up and keeps the unit, so a
log price axis reads `$20K` … `$124.7K` rather than `700000.00`. Tooltips keep
full precision: the axis is the only place abbreviation is welcome.

### 20.6 Anti-patterns

These are defects, not style choices:

| Anti-pattern | Why it is wrong |
| --- | --- |
| A backend `log(price)` output for display | Destroys the real value in tooltips, exports and the API; scale is presentation. |
| A log axis over signed data | The engine silently renders `[1, 10]` and the chart becomes fiction. |
| Switching linear ↔ log on a range change | The visual meaning of the chart changes without the reader asking. |
| A per-chart arbitrary axis side | The stack stops reading as one instrument. |
| Multiplying a value in a formatter "to show a percent" | Double-scaling: a ratio is converted once, at the display boundary, and the axis, tooltip and card all use that one number. |
| Labelling a padded edge | A `+8.5%` tick on a drawdown, or a `-3%` tick under a volatility axis, claims data the chart does not have. |

## 21. The V4.0 chart packs

Phase 4 added thirty-five public chart components in five modules. They follow
every rule above and add three of their own.

### 21.1 Where they live

| Module | Families |
| --- | --- |
| `components/statistical-charts.tsx` | `EcdfChart`, `QqPlotChart`, `ViolinChart`, `RocCurveChart`, `CalibrationChart`, `ConfusionMatrixChart`, `ErrorBarChart`, `ResidualChart` |
| `components/scientific-charts.tsx` | `ParallelCoordinatesChart`, `PolarRoseChart`, `WindRoseChart`, `TernaryChart`, `VectorFieldChart`, `ContourChart`, `SpectrogramChart`, `ThemeRiverChart`, `RidgelineChart`, `HexbinChart` |
| `components/workflow-charts.tsx` | `GanttChart`, `DumbbellChart`, `SlopeChart`, `LollipopChart`, `BulletChart`, `BumpChart`, `MekkoChart` |
| `components/quantitative-charts.tsx` | `CandlestickChart`, `DrawdownChart`, `VolatilitySmileChart`, `EfficientFrontierChart`, `FactorExposureChart`, `PnlAttributionChart` |
| `components/multidimensional-charts.tsx` | `ScatterMatrixChart`, `HierarchyTreeChart`, `GeoScatterChart` |

The status of every candidate — including what is *not* shipped and why — is the
public `/charts/catalog` page and
[`docs/audits/phase-4/2026-10-08-chart-coverage-and-status.md`](./audits/phase-4/2026-10-08-chart-coverage-and-status.md).

### 21.2 Three rules the packs add

1. **Prepared data, always.** Not one of the thirty-five computes a statistic.
   The ECDF receives cumulative values, the residual plot receives residuals,
   the error bar receives its interval, the frontier receives ordered points and
   the confusion matrix receives counts. A caller that wants a fit, a kernel or
   an optimisation runs it where the data lives, so the number in the chart is
   answerable to exactly one place.
2. **A display transform is named.** Five of them exist and each is documented
   in the component's own JSDoc: barycentric projection (ternary), hexagon
   geometry at a caller-supplied radius (hexbin), the engine's silhouette layout
   (theme river), the ridge offset (ridgeline), and `formatRatio`, which converts
   a 0–1 probability to a percentage **once**, at the rendering boundary — the
   same rule as a log axis. `ratioAxis` is the axis form; `formatRatioOrValue`
   is the tooltip form; both read the same numbers the caller passed.
3. **`custom` series are the default for anything geometric.** Violin, contour,
   hexbin, ternary, ridgeline, Mekko, Gantt, dumbbell and error bars draw with
   `zrender` primitives through ECharts' `custom` series. Nothing allocates one
   DOM node per datum, and the geometry is in data coordinates, so it stays
   correct at any zoom.

### 21.3 Maps

LUC ships **no map data**. A boundary file is large, it carries a licence, and
bundling one imposes a particular political boundary set on every consumer.
`GeoScatterChart` therefore takes a `mapName` and requires the caller to
register a GeoJSON first:

```ts
import { registerEChartsMap, GeoScatterChart } from "@luc/ui/charts";

await registerEChartsMap("world", worldGeoJson);
// <GeoScatterChart mapName="world" points={offices} />
```

Registration happens once, before the first render, because it is a global
engine property — doing it inside a component would run on every mount. With no
map registered, the chart renders its empty state and names the missing step.
A choropleth is a separate contract (a value **per region**) and is tracked as
planned rather than shipped.

### 21.4 Engine registrations

An unregistered ECharts component or series is accepted and silently ignored.
The packs needed `ThemeRiverChart`, `ParallelChart`, `MapChart`,
`ParallelComponent`, `SingleAxisComponent` and `GeoComponent`; all six are now
registered in `adapters/echarts/runtime.ts`. **Adding a chart type means adding
its registration in the same change** — otherwise the component renders an empty
box and the tests still pass.

### 21.5 Phase 5 — diagnostics, networks, geography and a real 3D surface

Ten further public types, in four modules, with one rule unchanged: the library
renders, it does not estimate.

| Module | Types |
| --- | --- |
| `components/diagnostic-charts.tsx` | `AutocorrelationChart`, `SurvivalCurveChart`, `PrecisionRecallChart`, `FeatureImportanceChart` |
| `components/network-charts.tsx` | `ChordChart`, `DendrogramChart` (+ exported `chordLayout`) |
| `components/geo-charts.tsx` | `ChoroplethChart`, `GeoTrajectoryChart` (+ exported `unwrapLongitudes`) |
| `components/surface3d-charts.tsx` | `Surface3DChart`, `VolatilitySurfaceChart` |

**What the caller must still supply.** The lag correlations *and* the
significance half-width (no band is drawn without one); the survival estimates
*and* the censoring marks; the precision/recall pairs *and* the no-skill
prevalence; the feature importances *and* their intervals; a square matrix for a
chord; the leaf order *and* the merges for a dendrogram (LUC does not cluster);
a registered map name plus a value per region for a choropleth; a **grid** of
implied volatilities for a volatility surface (interpolating quotes into a grid
is modelling). `null` is always "no data", never zero.

**3D without a 3D engine.** `Surface3DChart` rotates, projects orthographically,
sorts quads by depth and paints them back to front inside a single `custom`
series `renderItem` — one data item, one group, so the painter's algorithm
orders the whole mesh globally instead of by data index. Azimuth and elevation
are props (controlled or uncontrolled), the pointer can drag and the keyboard
can rotate. `echarts-gl` is **not** installed: it would add a second renderer
and a GPU context to every `@luc/ui/charts` consumer, and installing it would
have required writing the shared root lockfile. The measured reason is in the
component header and on `/charts/surfaces`.

**Geometry in pixel space.** Chord arcs/ribbons, the autocorrelation band, the
dendrogram connectors, the feature-importance intervals and every surface quad
are drawn from `api.coord(...)` / `api.getWidth()` results, never from data
units. Phase 4 shipped three blank charts by trusting data units inside a
`custom` series; `chart-packs-v5.test.tsx` asserts the layout maths directly
(`chordLayout` angles, `unwrapLongitudes`), which is the class of check that
catches it without a browser.

**`/charts/catalog` is the count.** It computes its own numbers (entries by
status, and the distinct components those entries name) and lists the deliberate
*non*-types — adjacency matrix, alluvial, a 2D volatility heatmap, mirrored
ridgelines, a rolling risk panel — so a renderer reuse can never be relabelled
into a new plot type.
