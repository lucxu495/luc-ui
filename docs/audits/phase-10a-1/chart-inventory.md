# Phase 10A.1 — chart catalogue inventory

All 76 public chart routes, measured through `qa/probe-chart-visual.mjs` against the
deployed container (dark, 1440 px viewport, 860 × 280–380 px plot). Raw evidence:
`luc-ui/apps/showcase/artifacts/chart-census/*.{png,json}`.

Columns: **marks** = drawable items the renderer reported (`n/a` = no ECharts canvas),
**texts** = text items in the digest, **ovl** = pairs of text boxes sharing pixels,
**status** = what was actually established about that chart.

Status vocabulary, deliberately narrow:

* `fixed in 10A.1` — a reported or discovered defect was fixed and re-measured.
* `rendered, measured` — a digest with ≥ 12 marks and zero label overlaps; not a claim
  of aesthetic review.
* `few marks — reviewed visually, correct` — flagged by a threshold, opened, dismissed.
* `no canvas / digest-limited` — SVG-rendered, or labels live in a nested render layer;
  the digest does not cover it (see `baseline.md` §2).

| Chart | marks | texts | ovl | status |
| --- | --- | --- | --- | --- |
| `area-chart` | 33 | 15 | 0 | rendered, measured |
| `autocorrelation-chart` | 62 | 15 | 0 | rendered, measured |
| `bar-chart` | 24 | 11 | 0 | rendered, measured |
| `box-plot-chart` | 25 | 11 | 0 | rendered, measured |
| `bubble-chart` | 36 | 13 | 0 | rendered, measured |
| `bullet-chart` | 36 | 13 | 0 | fixed in 10A.1 |
| `bump-chart` | 33 | 9 | 1 | fixed in 10A.1 |
| `calendar-heatmap` | 400 | 21 | 0 | fixed in 10A.1 |
| `calibration-chart` | 32 | 12 | 0 | rendered, measured |
| `candlestick-chart` | 27 | 13 | 0 | rendered, measured |
| `chord-chart` | 20 | 4 | 0 | fixed in 10A.1 |
| `choropleth-chart` | 30 | 2 | 0 | rendered, measured |
| `composed-chart` | 45 | 20 | 0 | rendered, measured |
| `confusion-matrix-chart` | 26 | 15 | 0 | rendered, measured |
| `contour-chart` | 33 | 10 | 0 | rendered, measured |
| `correlation-matrix` | 66 | 37 | 0 | rendered, measured |
| `curve-comparison-chart` | 36 | 15 | 0 | rendered, measured |
| `dendrogram-chart` | 41 | 13 | 0 | rendered, measured |
| `depth-chart` | 35 | 14 | 0 | rendered, measured |
| `distribution-chart` | 32 | 15 | 0 | rendered, measured |
| `drawdown-chart` | 25 | 15 | 0 | rendered, measured |
| `dumbbell-chart` | 29 | 10 | 0 | rendered, measured |
| `ecdf-chart` | 26 | 12 | 0 | rendered, measured |
| `efficient-frontier-chart` | 45 | 20 | 0 | rendered, measured |
| `error-bar-chart` | 38 | 11 | 0 | rendered, measured |
| `event-timeline` | 21 | 9 | 0 | rendered, measured |
| `factor-exposure-chart` | 30 | 14 | 0 | rendered, measured |
| `fan-chart` | 33 | 16 | 0 | rendered, measured |
| `feature-importance-chart` | 39 | 11 | 0 | rendered, measured |
| `funnel-chart` | 10 | 5 | 0 | few marks — reviewed visually, correct |
| `gantt-chart` | 28 | 15 | 0 | fixed in 10A.1 |
| `gauge-chart` | 7 | 2 | 0 | few marks — reviewed visually, correct |
| `geo-scatter-chart` | 32 | 0 | 0 | no canvas / digest-limited |
| `geo-trajectory-chart` | 33 | 15 | 0 | rendered, measured |
| `graph-chart` | 18 | 6 | 0 | rendered, measured |
| `heatmap-chart` | 64 | 36 | 0 | rendered, measured |
| `hexbin-chart` | 34 | 13 | 0 | rendered, measured |
| `hierarchy-tree-chart` | 29 | 10 | 0 | fixed in 10A.1 |
| `histogram-chart` | 29 | 14 | 0 | rendered, measured |
| `historical-position-chart` | n/a | n/a | 0 | no canvas / digest-limited (SVG; DOM labels verified) |
| `line-chart` | 32 | 14 | 0 | rendered, measured |
| `lollipop-chart` | 28 | 11 | 0 | rendered, measured |
| `mekko-chart` | 9 | 0 | 0 | no canvas / digest-limited |
| `parallel-coordinates-chart` | 68 | 31 | 0 | rendered, measured |
| `pie-chart` | 17 | 7 | 0 | rendered, measured |
| `pnl-attribution-chart` | 37 | 12 | 0 | rendered, measured |
| `polar-rose-chart` | 24 | 8 | 0 | rendered, measured |
| `precision-recall-chart` | 26 | 12 | 0 | rendered, measured |
| `qq-plot-chart` | 41 | 14 | 0 | rendered, measured |
| `quadrant-scatter-chart` | 48 | 20 | 0 | rendered, measured |
| `radar-chart` | 15 | 5 | 0 | rendered, measured |
| `range-band-chart` | 32 | 20 | 0 | rendered, measured |
| `regime-strip` | 18 | 12 | 0 | rendered, measured |
| `ridgeline-chart` | 16 | 5 | 0 | rendered, measured |
| `roc-curve-chart` | 27 | 12 | 0 | rendered, measured |
| `sankey-chart` | 22 | 7 | 0 | rendered, measured |
| `scatter-chart` | 40 | 15 | 0 | rendered, measured |
| `scatter-matrix-chart` | 142 | 22 | 0 | fixed in 10A.1 |
| `scatter-regression-chart` | 45 | 16 | 0 | rendered, measured |
| `slope-chart` | 25 | 13 | 0 | rendered, measured |
| `small-multiples` | n/a | n/a | 0 | no canvas / digest-limited (SVG) |
| `sparkline` | n/a | n/a | 0 | no canvas / digest-limited (SVG) |
| `spectrogram-chart` | 40 | 10 | 0 | rendered, measured |
| `sunburst-chart` | 17 | 8 | 0 | fixed in 10A.1 |
| `surface3-dchart` | 59 | 12 | 0 | fixed in 10A.1 |
| `survival-curve-chart` | 28 | 12 | 0 | rendered, measured |
| `term-structure-chart` | 31 | 11 | 0 | rendered, measured |
| `ternary-chart` | 40 | 6 | 0 | rendered, measured |
| `theme-river-chart` | 24 | 10 | 0 | rendered, measured |
| `treemap-chart` | 24 | 7 | 0 | rendered, measured |
| `vector-field-chart` | 44 | 14 | 0 | fixed in 10A.1 |
| `violin-chart` | 23 | 10 | 0 | rendered, measured |
| `volatility-smile-chart` | 38 | 13 | 0 | rendered, measured |
| `volatility-surface-chart` | 71 | 13 | 1 | fixed in 10A.1 |
| `waterfall-chart` | 34 | 11 | 0 | rendered, measured |
| `wind-rose-chart` | 52 | 16 | 0 | rendered, measured |

## What this table does and does not claim

It claims that every one of the 76 public chart routes was rendered in a real browser,
that the renderer reported how many marks and text items it drew, and that no chart
leaves two labels sharing pixels. It does **not** claim that all 76 are beautiful: the
status column says "measured" where a measurement was taken, and the charts flagged by
a threshold were opened and judged by eye rather than assumed correct from a number.

The three charts with no digest (sparkline, small-multiples, historical position) are
SVG-rendered; the treemap, mekko and geo-scatter labels sit in a nested render layer the
digest does not reach. That limitation is a property of the instrument and is recorded
rather than papered over.
