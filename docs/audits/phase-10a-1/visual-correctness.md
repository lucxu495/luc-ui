# Phase 10A.1 — the eleven reports, and the two extra defects

Every row below was reproduced, diagnosed, fixed, and re-measured on the deployed
container. "After" screenshots are in `luc-ui/apps/showcase/artifacts/chart-review/after/`;
before/after numbers come from `qa/probe-chart-visual.mjs` (canvas marks, text boxes,
label overlaps) rather than from an impression of a PNG.

## 1. The reported eleven

### 1.1 GanttChart — confirmed, fixed

* **Defect.** Task names and grid drawn, no bars; the time axis printed "Jan 1" four times.
* **Cause.** RC1 — the custom series carried no `encode`, so the time axis took its
  domain from the task index.
* **Change.** `encode: { x: [1, 2], y: 0 }`; the demonstration's `timeFormat` changed
  from `{ kind: "number" }` to a date, so the axis prints dates rather than epoch
  milliseconds.
* **Test.** `visual-correctness.test.tsx` → "binds the time axis to the task timestamps,
  not to the row index", "gives the bars a non-zero width in data space".
* **Measured after.** 7 rects, 15 texts (4 task names, 4 date ticks, 5 value ticks), 0
  overlaps; ink 0.0186 → 0.0814.

### 1.2 ScatterMatrixChart — confirmed, fixed

* **Defect.** Points compressed into tiny groups; ticks illegible; a large canvas with
  little readable data.
* **Cause.** RC3 — `cellSize / 100` percent, plus no label margin and five ticks per axis.
* **Change.** Cells are `100 / n` percent, `containLabel` on every panel, three splits
  per axis, faint split lines for reading values.
* **Test.** "gives every off-diagonal pair a full cell of the canvas", "plots each
  variable against exactly the variable its cell names".
* **Measured after.** 142 marks, 22 texts, 0 overlaps; ink 0.0028 → 0.0149.

### 1.3 VectorFieldChart — confirmed, fixed

* **Defect.** A few disconnected diagonal lines; large empty regions; no readable
  arrowheads.
* **Cause.** RC4 — the domain covered the sampling lattice, not the arrow tips.
* **Change.** Domain over tails *and* tips with an 8 % margin; arrowhead floor at 5 px.
* **Test.** "covers the arrow tips in the axis domain, not only the sample points".
* **Measured after.** 22 lines, 8 polygons (shafts and heads), 14 texts; ink 0.0065 →
  0.0320.

### 1.4 CardStack — confirmed, fixed

* **Defect.** Cards and controls clipped or collapsed into a shallow container; content
  colliding with the code example.
* **Cause.** RC6 — no stage height (every layer absolute) and a top-left overlay.
* **Change.** Default `min-h-60` on the deck; overlay lays out at the bottom; the
  demonstration passes `h-48` so the deck frames its cards.
* **Test.** The behaviour suite walks the deck with the arrow keys and asserts the deck's
  box contains every card (see `test-log.md`).
* **Measured after.** The deck is 192 px tall with three cards of 128 px inside it; the
  controls no longer intersect the active card.

### 1.5 Surface3DChart — confirmed, fixed (and the documentation corrected)

* **Defect.** A flat tilted sheet rather than an understandable 3D surface; weak depth.
* **Cause.** No axes and no shading: the option was a base plane plus flat-filled quads,
  so the only depth cue was the colour ramp. This is a **documented orthographic
  projection, not a 3D engine**, and the component's description already said so; the
  report is being answered by making the projection readable, not by claiming 3D.
* **Change.** A frame (base grid, x/y tick labels from the caller's labels, a vertical z
  axis with real values) and Lambert shading computed from each quad's data-space
  normal rotated into view space, drawn as a neutral overlay so the ramp keeps meaning
  "value".
* **Test.** "draws a frame — grid, ticks, z scale — around the projected sheet".
* **Measured after.** 19 polygons (base + 4 cells × fill and shading where the grid is
  3×3), 12 polyline/axis marks, 12 texts, 0 overlaps.

### 1.6 HistoricalPositionChart — confirmed, fixed

* **Defect.** The value and percentile labels overlapped the tick labels.
* **Cause.** RC5 — a centred readout with no bounds, plus only 4 px of clearance above
  the tick row.
* **Change.** The readout sits above the band and aligns to the container edge within
  12 % of either end; tick numbers moved down to `top-4`.
* **Test.** "clamps the readout inside the band instead of over the end tick".
* **Measured after.** At 95 % the block is right-aligned (`right: 0`); at 50 % it is
  centred with `translateX(-50%)`.

### 1.7 SunburstChart — confirmed, fixed

* **Defect.** Labels crossing neighbouring sectors; some unreadable against their fill.
* **Cause.** RC5 — horizontal labels in a narrow inner annulus, no truncation, no
  collision pass.
* **Change.** Inner ring `minAngle: 26` with truncation, second ring tangential
  (`minAngle: 10`), series-level `labelLayout.hideOverlap`. No node is dropped: the
  sector, its colour and its tooltip remain, and the component documents that a label
  is withheld only where it cannot be read.
* **Test.** "suppresses a label only where its sector cannot hold one".
* **Measured after.** 9 sectors, 8 texts, 0 overlaps.

### 1.8 HierarchyTreeChart — confirmed, fixed

* **Defect.** Labels clipped at the canvas edges and the diagram spread too wide for its
  labels.
* **Cause.** RC5 — ECharts' default label position is `left` for every orientation.
* **Change.** Per-orientation label position with the padding derived from it
  (132 px on the label side, 24 px elsewhere), truncation with an ellipsis, and 320 px
  of height kept.
* **Test.** "points labels away from the canvas edge and reserves room for them", and
  the mirrored case for right-left orientation.
* **Measured after.** 10 texts (root plus every node), 0 overlaps, 0 clipped.

### 1.9 ChordChart — confirmed, fixed

* **Defect.** Suspicious ribbon shapes; weak label legibility.
* **Cause.** RC2 — two subpaths per fill.
* **Change.** One closed outline per ribbon (arc, curve through the centre, arc back) and
  one annulus outline per ring band.
* **Test.** "draws each ribbon and each ring band as one closed outline" — one `M` per
  shape, ending in `Z`.
* **Measured after.** 16 filled paths (one per ribbon and ring band), 4 group labels,
  0 overlaps; ink 0.1578 → 0.2594. Ribbon geometry itself was already
  correct: `chordLayout` is pure and tested, and the ribbon endpoints come from the
  supplied matrix (the flow matrix is preserved exactly).

### 1.10 BulletChart — confirmed as a quality gap, refined

* **Defect.** Legible, but the hierarchy was flat: the reading was only in the tooltip.
* **Change.** `min: 0` made explicit (the bands are cumulative from zero), 12 % headroom
  for the label, a calmer band opacity ladder, the value printed at the end of its bar,
  and a hairline outline on the target marker.
* **Test.** "starts at zero, leaves room for the value label, and prints the reading".
* **Measured after.** 12 rects (bands, bar, marker), 13 texts, 0 overlaps.
* **Quantitative check.** Target positions are `[row.target, index]` on a category axis;
  the axis max is `max(value, target, ranges) × 1.12`, so a target is never clipped.

### 1.11 CalendarHeatmap — confirmed, fixed

* **Defect.** Sparse data hard to read; the colour legend collided with the month
  labels; empty-day styling dominated the field.
* **Cause.** The legend sat in the month-label band, and a 2 px border on all 365 day
  cells drew a grid louder than the ten days with values.
* **Change.** The legend moved to the bottom with formatted min/max read-outs, the
  per-cell border removed, and the calendar's margins reserved for both.
* **Test.** "keeps the legend out of the month-label band and leaves empty days blank".
* **Measured after.** 376 rects (one per day), 21 texts (12 month labels, 7 day labels,
  2 legend values), 0 overlaps.

## 2. Two defects found by measuring the rest of the catalogue

| Chart | Defect | Cause | Status |
| --- | --- | --- | --- |
| BumpChart | The axis name "Rank" printed on top of the first period label "Q1" (70 px² of overlap) | ECharts puts an axis name at the axis end by default, which is the corner the first tick occupies | fixed — `nameLocation: "middle"`, `nameGap: 46` (a new, optional `axisFragment` field) |
| VolatilitySurfaceChart | The last strike label "110.00" under the z tick "21.00%" (105 px²) | the z axis stood at the right *near* corner, where the x labels run | fixed — the z axis moved to the back-right corner after measuring two other placements |

## 3. Confirmations that were not defects

Recorded because a heuristic that flags a chart is not a verdict:

* **GaugeChart** drew only 7 marks. Reviewed: three threshold sectors, one progress arc,
  one hub and two labels — exactly what a gauge is. No defect.
* **TreemapChart** reported zero text items in the digest, which looks like "no labels".
  Reviewed on screen: all seven labels are drawn. The digest under-reports text for
  charts whose labels live in a nested render layer; the limitation is recorded in
  `baseline.md` §2 and the instrument is not used for that family.
* **FunnelChart / radar-chart / ridgeline-chart** have few marks by construction; each
  was reviewed and is correct.

## 4. Evidence index

* Before: `apps/showcase/artifacts/chart-review/*.png` (11 charts, dark, 1440 px).
* After: `apps/showcase/artifacts/chart-review/after/*.png` (same charts) and
  `*.json` beside each PNG with the renderer digest, overlap pairs and canvas size.
* Census: `apps/showcase/artifacts/chart-census/*.{png,json}` (all 76 chart routes).
* Browser assertions: `apps/showcase/qa/geometry.mjs` → `checkChartGeometry`, which
  visits ten chart routes and fails on a missing digest, a missing mark family, or any
  two labels sharing pixels.
