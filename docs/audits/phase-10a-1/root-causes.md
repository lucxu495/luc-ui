# Phase 10A.1 — root causes

Six shared causes produced all of the reported failures except two. They are ordered by
how much they explain, because the point of this phase is that these are infrastructure
defects rather than eleven unrelated patches.

## RC1 — A custom series without `encode` maps the wrong dimension to the axis

`GanttChart` is the only chart whose custom series is the sole x-bearing series. ECharts
binds dimension 0 to x and dimension 1 to y when `encode` is absent, so the time axis
derived its domain from the task **index** — 0…3 ms — instead of the timestamps in
dimensions 1 and 2. Both reported symptoms follow: four ticks around 1970-01-01 printed
as "Jan 1", and every bar mapped to a pixel outside that domain and clipped away.

Fix: `encode: { x: [1, 2], y: 0 }`. The two-dimensional x is deliberate: it puts both
ends of each bar into the domain, so the axis covers the whole schedule rather than the
start instants.

Why this is one bug and not a class: every other custom series either has a sibling
series that pins the domain (dumbbell, error bar, contour) or fixed axes (chord,
surface, ternary, hexbin, bump). Each was checked; none is affected. The unit test now
asserts the mapping directly.

## RC2 — `arcPoints` emitted a new subpath, so chords and rings rendered as crescents

`network-charts.tsx` built ribbon and ring-band paths by concatenating two `M…L…`
strings. Two `M`s in one path are two subpaths, and a filled path closes each
separately: the chord diagram drew sixteen slivers hugging the circle and the ring
bands had a hole through them — the reported "suspiciously shaped ribbons".

Fix: the helper returns points; the caller writes one `M`, a polyline along the source
arc, a quadratic curve through the disc's centre, the target arc back, and one `Z`. The
ring band becomes a single annulus outline the same way. The test counts `M` per shape.

## RC3 — A pixel size used as a percentage, and no room reserved for labels

`ScatterMatrixChart` computed each cell as `cellSize / 100` **percent**. With the
documented default of 120 that is 1.2 %, so a three-variable matrix drew twelve postage
stamps in a full-width canvas — the reported "points compressed into small isolated
groups" and "large canvas with little meaningful readable data". The same code reserved
no margin for tick labels.

Fix: a cell is `100 / n` percent, `containLabel` reserves the margin inside the panels
that carry ticks, and each axis uses three splits instead of the engine's five —
measured, because at 1440 px five percentage labels per cell rendered as one unbroken
string.

## RC4 — A domain that ignores the marks it is used to draw

`VectorFieldChart` let the axes infer their domain from the sample points, while each
arrow extends to `sample + (u, v)·scale`. Every arrow leaving the lattice was clipped by
the plot box, which is why the report saw "a few disconnected diagonal lines" and "large
empty plot regions": nine arrows became six fragments pinned to the frame.

Fix: the domain is computed over tails and tips with an 8 % margin, and the arrowhead
has a 5 px floor so a short vector still reads as a vector.

## RC5 — Labels placed without regard for the space that exists

Four reported charts are the same mistake in four places:

* **Hierarchy tree.** ECharts defaults a tree label to `position: "left"` whatever the
  orientation, so an LR tree drew every label left of its node: the root outside the
  16 px margin ("ortfolio") and the longest leaf clipped at the right edge ("Sovere…").
  Fix: the position follows the orientation and the same decision sets the padding
  (132 px on the side labels grow towards), with truncation instead of clipping.
* **Sunburst.** The inner ring forced horizontal labels into a narrow annulus, so "Fixed
  income" printed across two groups. Fix: the inner ring keeps horizontal text only
  where the sector is wide enough (`minAngle: 26`), the second ring is tangential
  (`minAngle: 10`), and the series runs the universal label-layout pass with
  `hideOverlap: true`. Sectors, colours and tooltips keep every node; only text that
  cannot be read is withheld.
* **Historical position.** The readout was centred on `left: {percentile}%` with no
  bounds, so at 78 % it sat on the "75" tick and near the ends it hung outside the band.
  Fix: it aligns to the container edge within 12 % of either end.
* **Bump chart.** The axis name ("Rank") was drawn at the axis end, in the corner the
  first period label occupies. Fix: `nameLocation: "middle"`. This one was not reported;
  the census found it.

## RC6 — A stage that never existed

`CardStack` positions every layer `absolute inset-0`, which is what lets one card recede
behind another, and the group therefore has no intrinsic height. The demonstration set
only a width, so the deck was 0 px tall: the cards spilled over the note and code block
below, and the controls (an `absolute inset-0` overlay) landed on the active card. Two
fixes: a default `min-h-60` stage the caller can override, and an overlay that lays out
at the bottom of the stage instead of its top-left corner.

## Two defects the census found that the user did not report

Running the instrument over all 76 charts found the bump-chart axis-name collision and
the volatility-surface z-axis collision. Both are fixed and recorded in
`chart-inventory.md`. That is the argument for measuring the whole catalogue: a person
reviewing eleven screenshots cannot see seventy-six charts, and neither could the
previous suite.

## Cross-project observations (verified, not assumed)

Render R1.5 raised three concerns from a consumer of an older tarball. Checked against
the current library:

1. **"A value axis beginning at zero compresses financial series."** The financial
   families pass `scale: true`, or an explicit padded domain where they own one, so the
   domain follows the data rather than zero. Not reproduced.
2. **"`chartKind: 'bar'` produced line output."** The bar path draws `rect` marks; the
   census shows five rects for five categories. Not reproduced.
3. **"Missing annotation capabilities."** Still accurate as a capability gap: thresholds
   and reference lines exist inside the families that own them (bullet targets, gauge
   thresholds, reference bands) but there is no general annotation API. A feature
   request, not a defect, and out of scope here.
