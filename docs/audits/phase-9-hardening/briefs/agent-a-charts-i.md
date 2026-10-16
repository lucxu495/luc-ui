# Brief — Agent A: chart Live Demos (general, statistical, financial)

## What you are fixing

`/charts/<id>` exists for all 76 public charts. Every one of those pages
currently renders an API table and no chart. A reader can read `EcdfChart`'s
props and never see an ECDF.

## Read first

1. `luc-ui/docs/audits/phase-9-hardening/00-architecture-and-coordination.md`
   — the contract, the rules, the ownership table. It is binding.
2. `luc-ui/apps/showcase/lib/demo/types.ts`, `jsx.ts`, `index.ts`.
3. `luc-ui/apps/showcase/lib/demo/components/data-display.tsx` — the reference
   implementation, written by the Lead.
4. `luc-ui/apps/showcase/components/docs/demo-stage.tsx` — how a demo is shown.

## Your files (37 demos; write these three files and nothing else)

* `lib/demo/charts/general.tsx` → `chartGeneralDemos` (14):
  `area-chart bar-chart bubble-chart composed-chart fan-chart funnel-chart
  histogram-chart line-chart pie-chart range-band-chart scatter-chart
  small-multiples sparkline waterfall-chart`
* `lib/demo/charts/statistical.tsx` → `chartStatisticalDemos` (12):
  `box-plot-chart calibration-chart confusion-matrix-chart correlation-matrix
  distribution-chart ecdf-chart error-bar-chart qq-plot-chart
  quadrant-scatter-chart roc-curve-chart scatter-regression-chart violin-chart`
* `lib/demo/charts/financial.tsx` → `chartFinancialDemos` (11):
  `candlestick-chart curve-comparison-chart depth-chart drawdown-chart
  efficient-frontier-chart factor-exposure-chart historical-position-chart
  pnl-attribution-chart term-structure-chart volatility-smile-chart
  volatility-surface-chart`

The export names and the arrays already exist as stubs — keep them.

## How to write one

```tsx
import { EcdfChart, type EcdfChartProps } from "@luc/ui/charts";
import type { DemoSpec } from "../types";
import { demo } from "../jsx";

export const chartStatisticalDemos: readonly DemoSpec[] = [
  demo<EcdfChartProps>({
    id: "ecdf-chart",
    component: "EcdfChart",
    props: {
      series: [
        { key: "baseline", label: "Baseline", tone: "neutral", points: [/* … */] },
        { key: "candidate", label: "Candidate", tone: "accent", points: [/* … */] },
      ],
      xFormat: { kind: "percent", decimals: 1 },
      height: 320,
      ariaLabel: "ECDF of returns",
    },
    render: (props) => <EcdfChart {...props} />,
    note: "Two hundred and forty prepared session returns, drawn as a step function.",
  }),
];
```

* The props type is passed explicitly (`demo<EcdfChartProps>(…)`) or TypeScript
  widens `"percent"` to `string` and the spread stops checking.
* `note` is one sentence about the fixture: units, how many observations, what
  the reader should notice. It is user-visible prose, so write a sentence, and
  keep every *other* string in the demo to three words or fewer (those are data
  labels, not documentation).

## Where the truth is

* **Working usage to copy from:** `apps/showcase/app/charts/<family>/page.tsx`
  already renders most of these charts, live, from fixtures in
  `apps/showcase/lib/chart-packs-data.ts` and `lib/mock-data.ts`. Start there.
* **Prop names and types:** `apps/showcase/lib/docs/generated/api.ts` holds the
  compiler's own prop list per entry id (`"ecdf-chart": [ … ]`). Only use props
  that appear there.
* **Import path:** charts come from `@luc/ui/charts`.

## Fixture rules (the part that decides whether this is good)

1. **Compact.** The fixture is inlined in the copyable snippet. Target ≤ 24
   rows, ≤ 30 printed lines. Reduce a 240-point sample to a representative
   subset rather than pasting it. If reduction destroys the chart's meaning,
   build a smaller *valid* dataset instead (12 order statistics, 8 sessions).
2. **Deterministic.** No `Math.random`, no `Date.now`; ISO date strings with an
   explicit zone; numbers spelled out.
3. **Scientifically valid per family:**
   * ECDF / survival: monotone (ECDF non-decreasing 0→1, survival
     non-increasing 1→0); ECDF is a step, so keep the repeated x where the jump
     happens.
   * ROC: `tpr` and `fpr` both non-decreasing from (0,0) to (1,1); include the
     chance diagonal if the component takes one.
   * Precision–recall / calibration: state the units (ratio vs percent).
   * Q–Q: `x` is the theoretical quantile, `y` the sample quantile, both
     ascending.
   * Distribution / violin / box plot: real densities and five-number
     summaries — never a fabricated "fit".
   * Correlation matrix: values in [-1, 1], symmetric, diagonal exactly 1.
   * Confusion matrix: non-negative integer counts, labels matching the shape.
   * Candlestick: `low ≤ min(open, close) ≤ max(open, close) ≤ high` on every
     row.
   * Drawdown: values ≤ 0, ascending dates.
   * Volatility surfaces/smiles: ascending moneyness or strike, positive
     volatilities, declared `percent` if they are percentages.
   * Efficient frontier: risk ascending, return rising then flattening; the
     frontier and the individual assets are separate series.
   * Funnel: stages in order, each count ≤ the previous.
   * Waterfall: the running total must be arithmetically correct.
   * Fan / range band: low ≤ mid ≤ high at every x.
   * Histogram / bubble / scatter: non-negative bin counts, no non-finite
     values.
4. **No invented computation.** These components render prepared values and
   compute nothing. Never write a demo whose note implies the chart derived a
   statistic, a fit, a band or a model output.
5. **Units are declared.** `format`/`valueFormat`/`xFormat`/`yFormat` carry the
   unit; `0.05` is a ratio, a percentage or five basis points depending only on
   what the caller declares.

## Hard constraints

* Write only your three files. Do not touch the registries, `types.ts`,
  `jsx.ts`, `entry-page.tsx`, `package.json`, translations, `packages/ui/**`,
  or anything outside `luc-ui/**`.
* Do not commit, do not run Docker, do not run browser suites. Other agents and
  a shared production host are using this machine: run one command at a time.
* If a chart cannot be given an honest, compact, valid fixture, do **not**
  invent one: leave it out of the array and report it as an exception with the
  reason. An unwritten demo is a gap; a wrong one is a defect.

## Verify before reporting

```
cd /home/luc/code/luc-quant/luc-ui/apps/showcase && pnpm typecheck
cd /home/luc/code/luc-quant/luc-ui && pnpm --filter @luc/ui test:showcase
```

Both must be clean (0 type errors; 79 showcase tests still passing).

## Report back

ids delivered, ids deliberately skipped with reasons, the exact verification
commands and their output, and anything you found wrong in the library while
writing a fixture (do not fix it — report it).
