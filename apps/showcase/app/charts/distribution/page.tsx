"use client";

import { BoxPlotChart, Card, Code, HistogramChart, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { boxPlotGroups, histogramBins } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const BINS = histogramBins();
const BOXES = boxPlotGroups();

export default function DistributionPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Distribution")}
        title="Shape of a sample"
        lead="Histograms and box plots answer different questions: the histogram shows the shape, the box plot compares many samples at once. Both take prepared values — LUC UI never bins, and never decides what an outlier is."
      />

      <Section
        title={tcs("Histogram")}
        description={tcs("Pre-binned counts, zero baseline, a reference line at the mean of the sample.")}
      >
        <ChartPanel
          title={tcs("Daily return distribution")}
          description={tcs("34 bins over 900 synthetic sessions.")}
          height={320}
          render={({ height }) => (
            <HistogramChart
              bins={BINS}
              xFormat={{ kind: "percent", decimals: 2 }}
              annotations={{
                referenceLines: [
                  { value: 0, label: "Zero", axisLabel: true, tone: "neutral" },
                ],
              }}
              height={height}
              ariaLabel={tcs("Histogram of daily returns")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Box plot")}
        description={tcs("Six prepared five-number summaries with prepared outliers drawn as small hollow points.")}
      >
        <ChartPanel
          title={tcs("Signal dispersion by strategy family")}
          description={tcs("Whiskers are outward, the median is solid, the outliers are not guessed.")}
          height={320}
          render={({ height }) => (
            <BoxPlotChart
              categories={BOXES.groups}
              data={BOXES.summaries}
              outliers={BOXES.outliers}
              format={{ kind: "decimal", decimals: 2 }}
              height={height}
              ariaLabel={tcs("Box plot of signal dispersion by strategy family")}
            />
          )}
        />
      </Section>

      <Section title={tcs("Deferred on purpose")} description={tcs("Two distribution shapes that did not earn a component this round.")}>
        <div className="grid gap-3 md:grid-cols-2">
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Density / violin
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("A kernel density needs a bandwidth and a smoothing convention that would have to live either in the chart or in a helper. Neither belongs in a presentation layer, so density renders as a histogram with a prepared outline series today, and a violin waits for a real consumer that needs one.")}</Text>
          </Card>
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              QQ plot
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("A quantile-quantile plot is a scatter chart with two prepared series and a 45-degree reference line:")}</Text>
            <Code block>{`<ScatterChart
  data={qq}
  xKey="theoretical"
  series={[{ key: "sample", tone: "accent" }]}
  annotations={{ referenceLines: [{ value: 0, axis: "y" }] }}
/>`}</Code>
          </Card>
        </div>
      </Section>
    </DocPage>
  );
}
