# Phase 10A.1 — baseline and reproduction

## 1. What was reported, and how it was reproduced

The user reviewed the deployed Phase 10A Showcase (image `4a3dca5b45c5`, container
`a7ebe04b324b`) and found eleven components visibly wrong, while the previous phase
reported 493 screenshots, 155 passing behaviour checks and zero axe violations. Both
statements were true: the screenshots proved the *pages* loaded, and nothing in the
harness looked at what the renderer drew. That is the failure this phase starts from.

Every report was reproduced before a line of code changed; the "before" PNGs are in
`luc-ui/apps/showcase/artifacts/chart-review/`.

| Report | Reproduction | Before evidence |
| --- | --- | --- |
| Gantt: task names and grid, no bars; axis reads "Jan 1" four times | exact | `charts-gantt-chart-dark-1440.png` |
| Scatter matrix: points in tiny isolated groups, ticks unreadable | exact; 0.28 % ink | `charts-scatter-matrix-chart-dark-1440.png` |
| Vector field: a few disconnected diagonal lines, large empty regions | exact; 0.65 % ink | `charts-vector-field-chart-dark-1440.png` |
| Card stack: collapsed preview, controls over the cards, collision with the code block | exact | `motion-card-stack-dark-1440.png` |
| Surface 3D: a flat tilted sheet, weak depth | exact; no axes, no shading | `charts-surface3-dchart-dark-1440.png` |
| Historical position: value and percentile labels on the ticks | exact ("78th percentile" over "75") | `charts-historical-position-chart-dark-1440.png` |
| Sunburst: labels crossing neighbouring sectors | exact ("Fixed income" across two groups) | `charts-sunburst-chart-dark-1440.png` |
| Hierarchy tree: labels clipped at both edges | exact ("ortfolio", "Sovere…") | `charts-hierarchy-tree-chart-dark-1440.png` |
| Chord: suspicious ribbon shapes | exact — every ribbon was two disconnected crescents | `charts-chord-chart-dark-1440.png` |
| Bullet: legible but flat hierarchy | exact; the reading was not printed | `charts-bullet-chart-dark-1440.png` |
| Calendar: legend over the month labels, empty-day grid dominating | exact | `charts-calendar-heatmap-dark-1440.png` |

## 2. The instrument this phase had to build first

The reason the previous QA could not see any of this is structural: a canvas chart is
opaque to the DOM. Its labels are pixels, so "the labels overlap" was not measurable,
and the only automated signal available was "a canvas element exists".

Two instruments were added, and both are now part of the repository:

1. `packages/ui/src/charts/core/diagnostics.ts` plus a hook in `EChartSurface`. After
   every finished frame the surface publishes a digest on its host element as
   `data-luc-chart-diagnostics`: marks drawn by kind, and the screen-space box of every
   text item (rotated labels measured by transforming the corners rather than trusting
   `x`/`y`). It is a reading — nothing in the library consumes it — and it is capped so
   a five-thousand-point scatter cannot slow a frame.
2. `apps/showcase/qa/probe-chart-visual.mjs`. One route in, one chart out: a screenshot
   of the chart stage, the digest, label overlap pairs, clipped labels, canvas size and
   an ink ratio from the bitmap.

Measured limits of the instrument, stated because they are load-bearing: the digest
under-reports text for charts whose labels live in a nested render layer (treemap,
mekko, geo-scatter) and does not apply to the SVG-rendered charts (sparkline,
small-multiples, historical position). The treemap was checked by eye and its labels
are drawn.

## 3. Baseline before/after, one number per chart

Ink ratio is the crude proxy that started the investigation (non-background pixels,
sampled every second pixel). It cannot confirm correctness — one chart's bitmap read
back cleared, which is why the renderer digest exists — but a five-fold change is a
fact:

| Chart | ink before | ink after | reading |
| --- | --- | --- | --- |
| gantt | 0.0186 | 0.0814 | four bars appeared |
| scatter-matrix | 0.0028 | 0.0149 | twelve panels instead of twelve stamps |
| vector-field | 0.0065 | 0.0320 | arrows inside the plot instead of clipped at its edge |
| chord | 0.1578 | 0.2594 | ribbons filled instead of crescent outlines |
| surface3d | 0.2831 | 0.2855 | same ink, twenty marks added (frame and shading) |
