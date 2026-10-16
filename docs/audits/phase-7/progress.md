# Phase 7 — durable progress record

**Updated:** 2026-10-09 (Asia/Singapore)
**Branch:** `main`, HEAD `fce3614` — nothing committed; all work is in the
working tree.
**Scope of writes:** `luc-ui/**` only.

This file exists so an interrupted run resumes without re-deriving anything.
Each row is either done-and-verified or explicitly unfinished.

## Workstreams

| Workstream | State |
| --- | --- |
| 7A full visual + interaction audit | **done** — structural probe over 131 routes (0 overflow, 0 clipped text, 0 collapsed slots, 0 console errors) + item-level review of 182 demo captures |
| 7A target sizes | **done** — 6 real fixes (`luc-hit`, segmented `sm`), remainder triaged and explained |
| 7B interaction correctness | **done** — 12 new journeys in the `components` behaviour group; **93/93** checks pass in the full suite |
| 7C chart correctness | **partially done** — 126 plots measured, 0 blank; 11/11 unit contracts; 7/10 data-fidelity assertions (3 blocked on an interior-crop measurement change) |
| 7D visual-regression evidence | **done for what changed** — before/after pairs under `evidence/`; no baseline was regenerated to hide a defect |
| 7E cross-browser | **done where runnable** — Chromium + Firefox 29 routes each, 0 failures; WebKit unavailable (host libs) |
| 7F bilingual / accessibility regression | **done** — 131/131 bodies, 12 180/12 180 sentences, 88/88 chrome; 204 Chromium + 29 Firefox axe scans, 0 violations |
| 7G packaging / agent integrity | **done** — catalog regenerated, 34 paths resolve, consumer isolation holds, `verify:charts` now runs the unit contract too |
| 7H deploy + report | **in progress** — see the deployment section of the audit |

## Verified fixes

1. `has-[:read-only]` over-match (NumberInput / filled TagInput / SearchInput /
   InputGroup) — verified in the browser after rebuild; regression test added.
2. Modal focus restore without a `DialogTrigger` — verified by behaviour check
   and a jsdom test.
3. Five chart unit errors (frontier, ECDF, histogram, calendar, ternary) —
   verified by screenshot + a new static unit contract wired into `verify`.
4. `DrawdownChart` axis collapsing to `0 %` — verified by screenshot.
5. Empty assistant bubble on `/components/ai` — verified by behaviour check.
6. Six sub-minimum hit targets — verified by the tiny-target probe.
7. `/charts/uncertainty` missing from the QA registry — verified by the sweep
   now covering 131 routes.

## Still open (do not report as done)

1. `ecdf-rises`, `qq-plot-is-a-line`, `roc-above-chance` — the interior-crop
   measurement change is not landed.
2. Duplicate month-granularity time ticks (measured cause recorded).
3. Date/time segment targets (22 px) — accepted deviation, documented.
4. Per-chart interaction pixel assertions (zoom/brush) — not written.
5. Luc Web build / visual verification — out of scope, source-level only.

## Continuation command

```bash
cd luc-ui && pnpm verify && pnpm qa:full
cd apps/showcase && node qa/chart-geometry.mjs --route-groups=charts && node qa/chart-assertions.mjs
```
