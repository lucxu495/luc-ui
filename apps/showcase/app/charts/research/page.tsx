"use client";

import { Code, DepthChart, LineChart, Section, TermStructureChart, CurveComparisonChart, AreaChart } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import {
  TIME_RANGES,
  curveComparison,
  depthData,
  marketSeries,
  termStructure,
  windowForRange,
} from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 900 });
const TERM = termStructure();
const SMILE = curveComparison();
const DEPTH = depthData();

const REGIME_BANDS = [
  { id: "calm", from: -100, to: 1.5, label: "Calm", tone: "positive" as const },
  { id: "watch", from: 1.5, to: 2.5, label: "Watch", tone: "warning" as const },
  { id: "stress", from: 2.5, to: 100, label: "Stress", tone: "negative" as const },
];

export default function ResearchPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Research")}
        title="Research patterns"
        lead="These are compositions rather than new engines: a drawdown is an area chart, a regime chart is a z-score with reference bands, a term structure is a curve comparison. Every value arrives prepared."
      />

      <Section title={tcs("Drawdown")} description={tcs("Cumulative drawdown as a negative area, with a reference line at the risk threshold.")}>
        <ChartPanel
          title={tcs("Drawdown from peak")}
          description={tcs("Prepared percentage from the running peak.")}
          ranges={TIME_RANGES}
          defaultRange="1y"
          height={300}
          render={({ range, height }) => (
            <AreaChart
              data={windowForRange(ROWS, range)}
              xKey="time"
              axes={[{ id: "primary", format: { kind: "percent", decimals: 1 } }]}
              series={[{ key: "drawdown", label: "Drawdown", type: "area", tone: "negative", symbol: false }]}
              annotations={{
                referenceLines: [{ value: -20, label: "Risk limit", axisLabel: true, tone: "warning" }],
              }}
              interaction={{ zoom: "inside" }}
              height={height}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Regimes and rolling correlation")}
        description={tcs("Reference bands are prepared ranges; the chart never classifies a regime itself.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Z-score with regimes")}
            description={tcs("Bands above and below the mean, drawn at 8% alpha so the series stays dominant.")}
            height={300}
            render={({ height }) => (
              <LineChart
                data={ROWS.slice(-365)}
                xKey="time"
                series={[{ key: "zscore", label: "Z-score", type: "line", tone: "accent", symbol: false }]}
                annotations={{
                  referenceLines: [{ value: 0, tone: "neutral" }],
                  referenceBands: [
                    { from: 2, to: 3.2, label: "Stretched", tone: "negative" },
                    { from: -3.2, to: -2, label: "Stretched", tone: "positive" },
                  ],
                }}
                interaction={{ zoom: "none" }}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Rolling correlation")}
            description={tcs("Prepared correlation against a benchmark, with neutral bands.")}
            height={300}
            render={({ height }) => (
              <LineChart
                data={ROWS.slice(-365)}
                xKey="time"
                axes={[{ id: "primary", format: { kind: "decimal", decimals: 1 }, min: -1, max: 1 }]}
                series={[{ key: "rollingCorr", label: "Correlation", type: "area", tone: "info", symbol: false }]}
                annotations={{
                  referenceLines: [
                    { value: 0, tone: "neutral" },
                    { value: 0.8, label: "High", tone: "warning" },
                  ],
                  referenceBands: REGIME_BANDS.map((band) => ({
                    from: band.from,
                    to: band.to,
                    label: band.label,
                    tone: band.tone,
                    opacity: 0.04,
                  })),
                }}
                interaction={{ zoom: "none" }}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Curves")}
        description={tcs("Term structure and a volatility smile use the same component: an ordered x, several prepared curves, one emphasised as the latest.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Term structure")}
            description={tcs("Tenor on the x axis, three snapshots, the latest emphasised.")}
            height={320}
            render={({ height }) => (
              <TermStructureChart
                tenors={TERM.tenors}
                curves={TERM.curves}
                yLabel="Rate"
                format={{ kind: "percent", decimals: 2 }}
                interaction={{ zoom: "none" }}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Volatility smile")}
            description={tcs("Strike on a numeric axis, three expiries.")}
            height={320}
            render={({ height }) => (
              <CurveComparisonChart
                xLabels={SMILE.strikes}
                curves={SMILE.curves}
                xLabel="Strike"
                yLabel="Implied volatility"
                format={{ kind: "percent", decimals: 1 }}
                interaction={{ zoom: "none" }}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("Market depth")} description={tcs("Two prepared cumulative curves around a mid price.")}>
        <ChartPanel
          title={tcs("Order book depth")}
          height={320}
          render={({ height }) => (
            <DepthChart
              bids={DEPTH.bids}
              asks={DEPTH.asks}
              mid={DEPTH.mid}
              priceFormat={{ kind: "currency", currency: "USD", decimals: 0 }}
              sizeFormat={{ kind: "decimal", decimals: 1 }}
              height={height}
            />
          )}
        />
      </Section>

      <Section title={tcs("Usage")}>
        <Code block>{`// A regime chart is prepared data plus annotations.
<LineChart
  data={rows}
  xKey="time"
  series={[{ key: "zscore", tone: "accent" }]}
  annotations={{
    referenceBands: [{ from: 2, to: 3.2, label: "Stretched", tone: "negative" }],
    referenceLines: [{ value: 0 }],
  }}
/>`}</Code>
      </Section>
    </DocPage>
  );
}
