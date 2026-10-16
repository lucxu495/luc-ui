# Phase 10A.1 — test log

Every command below was run in this repository during this phase. Numbers are the
observed output, not targets.

## Engineering gates

| Command | Result |
| --- | --- |
| `cd luc-ui && pnpm verify` | **exit 0** — typecheck, lint, 920 library tests (92 files), 113 showcase tests (14 files), i18n 100 %, chart catalogue, docs registry, package registry, tarball + types |
| `npx vitest run src/charts/components/visual-correctness.test.tsx` | 13 passed — the semantic invariants for the fixed defects |
| `cd apps/showcase && npx tsc --noEmit` | exit 0 |
| `npx eslint src/charts src/motion apps/showcase/components apps/showcase/qa` | exit 0, no warnings |

The library test count went from 907 to 920: +13 in `visual-correctness.test.tsx`. No
existing test was weakened, skipped or deleted.

## Browser gates (against the deployed container)

| Command | Result |
| --- | --- |
| `node scripts/qa-server.mjs --mode=full` | image rebuilt; **176 routes · 493 screenshots · behaviour 156/156 · 0 axe violations across 365 scans · `problems: none`** |
| `node qa/mobile-a11y.mjs` | 190 scans (95 routes × 390×844 and 768×1024) · **0 findings** |
| geometry group, run twice after the sheet-focus fix | **12/12** both times |

Behaviour went from 155 to 156 checks: the new `checkChartGeometry` is the addition, and
it asserts, per chart: a renderer digest exists, at least one expected mark family was
drawn, and no two text items share pixels.

### The intermittent check, diagnosed rather than muted

`closing a Sheet returns focus to the control that opened it` failed once on the first
run of this phase and passed on the next four. Root cause: the check waited for the
panel to leave the DOM and then read `document.activeElement` in the same tick, while
focus restoration is an effect that runs *after* unmount. It was a race in the
instrument, not in the component. The wait is now a bounded wait on the condition
("focus has left the body"), it no longer swallows the DOM-removal timeout, and a
timeout still fails the check.

## Chart-specific measurements

| Instrument | Coverage | Output |
| --- | --- | --- |
| `qa/probe-chart-visual.mjs` | the 11 reported charts (before and after) | PNG + JSON with marks, texts, overlap pairs, clipped labels, canvas size, ink |
| same, census mode | **all 76 public chart routes** | `artifacts/chart-census/*.{png,json}` |

Census summary: 73 of 76 charts reported a renderer digest with 15 or more marks and no
text overlap; 3 are SVG or digest-limited (sparkline, small-multiples, historical
position — the last verified through its DOM labels); 11 charts were fixed; 2 further
defects were found and fixed; 3 heuristics were reviewed by eye and dismissed
(gauge mark count, treemap digest text, small-mark charts).

## What was not run, and why

| Not run | Reason |
| --- | --- |
| `pnpm qa:baseline` (Playwright image baselines) | the charts under test changed on purpose, so the stored baselines describe output that no longer exists. Re-freezing them is a reviewed act; the review here is the before/after screenshots plus the renderer digest. |
| `pnpm qa:providers` (live TradingView) | unrelated to charts, depends on a third-party host |
| WebKit / Firefox | Playwright's WebKit still cannot launch on this host (missing system libraries, unchanged since Phase 8). All browser results are Chromium. |
| Pixel-diff regression on the chart bitmaps | deliberately not adopted: image similarity is not correctness, and the label-overlap and mark-count invariants are stronger signals for this defect class. |
