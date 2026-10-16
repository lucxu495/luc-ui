"use client";

import {
  BarChart,
  Code,
  HeatmapChart,
  HistoricalPositionChart,
  Section,
  chartSizeHeight,
  horizontalBarHeight,
  matrixHeight,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { useI18n } from "@/lib/i18n/provider";

/*
 * A worked demo of the semantic sizing policy: the chart's height follows the
 * *information geometry* rather than a single fixed number. A matrix grows with
 * its rows, a horizontal bar chart grows with its categories, and a compact
 * readout stays compact.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 12 }, (_, index) => String(2014 + index));

/*
 * A calendar with one deliberate extreme month so the robust domain is visible.
 *
 * Monthly returns are in percent, which is the unit the axes, the cell labels
 * and the legend's capped ends all use. In ratio units (`0.14`) the cells
 * printed "+0.1 %" for a fourteen-percent month and the legend read
 * "≥ +0.2 %" — every number on the chart understated its own data by 100×.
 */
const CALENDAR: number[][] = YEARS.map((_, year) =>
  MONTHS.map((__, month) => {
    /* The outlier the robust cap absorbs: extreme, but a number a market can print. */
    if (year === 0 && month === 2) return 68;
    return Math.sin((year * 12 + month) / 5) * 14 + (year % 3 === 0 ? 2 : -1);
  }),
);

const ANNUAL = YEARS.map((year, index) => ({ year, value: Math.sin(index / 1.7) * 85 - 5 }));

export default function SizingPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Sizing")}
        title="Semantic chart sizing"
        lead="Height follows the chart's information geometry: a matrix grows with its year-rows, a horizontal bar chart grows with its categories, and a compact readout stays compact. The colour domain can be made robust so a single outlier does not neutralise the rest."
      />

      <Section
        title={tcs("Row-derived matrix")}
        description={tcs("Twelve year-rows at a readable row height, a robust diverging domain centred on zero, and the return printed in every sufficiently large cell. The legend says '≥ / ≤' at the capped ends.")}
      >
        <ChartPanel
          title={tcs("Monthly return calendar")}
          description={tcs("Values are untouched; only the colour domain is capped.")}
          height={matrixHeight(YEARS.length)}
          render={({ height }) => (
            <HeatmapChart
              xLabels={MONTHS}
              yLabels={YEARS}
              values={CALENDAR}
              palette="diverging"
              midpoint={0}
              robustDomain
              labelMode="auto"
              format={{ kind: "percent", decimals: 1, signed: true }}
              height={height}
              ariaLabel={tcs("Robust monthly return calendar")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Row-derived horizontal bars")}
        description={tcs("A categorical bar chart grows one readable row per year and prints each value past the bar end; negative bars label on the left, positive on the right.")}
      >
        <ChartPanel
          title={tcs("Annual return")}
          description={tcs("Horizontal, zero-centred, value-labelled.")}
          height={horizontalBarHeight(ANNUAL.length)}
          render={({ height }) => (
            <BarChart
              id="annual-return"
              orientation="horizontal"
              x={{ type: "category" }}
              xKey="year"
              series={[
                {
                  key: "value",
                  label: "Return",
                  type: "bar",
                  valueLabels: true,
                  format: { kind: "percent", decimals: 1, signed: true },
                },
              ]}
              data={ANNUAL}
              animation="none"
              height={height}
              ariaLabel={tcs("Annual return, horizontal bars")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Historical position")}
        description={tcs("A compact percentile readout: the served percentile with the conventional quantile ticks. No gauge, no recommendation — just where the reading sits in its own history.")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { horizon: "30D", percentile: 82, value: "+8.4%" },
            { horizon: "90D", percentile: 61, value: "+18.2%" },
            { horizon: "1Y", percentile: 34, value: "+4.1%" },
          ].map((entry) => (
            <div key={entry.horizon} className="rounded-lg border border-line-subtle bg-surface-raised p-4">
              <p className="mb-3 text-caption text-fg-muted">{entry.horizon} return position</p>
              <HistoricalPositionChart
                percentile={entry.percentile}
                value={entry.value}
                percentileLabel={`${entry.percentile}th percentile`}
                ariaLabel={`${entry.horizon} return historical position`}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title={tcs("Named sizes")} description={tcs("For shape-driven charts, three named sizes replace per-chart pixels.")}>
        <Code>{`chartSizeHeight("compact") // ${chartSizeHeight("compact")}
chartSizeHeight("medium")  // ${chartSizeHeight("medium")}
chartSizeHeight("large")   // ${chartSizeHeight("large")}
matrixHeight(rows)         // rows × rowHeight + header + footer
horizontalBarHeight(rows)  // one readable row per category`}</Code>
      </Section>
    </DocPage>
  );
}
