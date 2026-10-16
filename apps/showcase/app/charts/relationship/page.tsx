"use client";

import { BubbleChart, Card, Code, ScatterChart, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { scatterRows } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const POINTS = scatterRows(180);
const SORTED = [...POINTS].sort((a, b) => a.factor - b.factor);

export default function RelationshipPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Relationship")}
        title="Scatter and bubble"
        lead="Relationship charts are the right answer whenever two prepared measures might move together. Quadrants and regression lines are annotations; the chart never fits a model."
      />

      <Section title={tcs("Scatter")} description={tcs("Two prepared measures, one point per observation, axis crosshair on both axes.")}>
        <ChartPanel
          title={tcs("Factor exposure vs forward return")}
          description={tcs("Prepared buckets; hover reads both axes.")}
          height={340}
          render={({ height }) => (
            <ScatterChart
              data={POINTS}
              xKey="factor"
              series={[{ key: "forward", label: "Forward return", type: "scatter", tone: "accent" }]}
              annotations={{
                referenceLines: [
                  { value: 0, axis: "x", label: "Zero factor", tone: "neutral" },
                  { value: 0, axis: "y", label: "Zero return", tone: "neutral" },
                ],
              }}
              x={{ type: "value", format: { kind: "decimal", decimals: 2 } }}
              axes={[{ id: "primary", format: { kind: "percent", decimals: 1 } }]}
              height={height}
              ariaLabel={tcs("Scatter of factor exposure against forward return")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Bubble and connected scatter")}
        description={tcs("Bubble encodes a third prepared value as area; a connected scatter is a line series with symbols, ordered by x.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Bubble")}
            description={tcs("Symbol area is proportional to the prepared turnover field.")}
            height={300}
            render={({ height }) => (
              <BubbleChart
                data={POINTS}
                xKey="factor"
                x={{ type: "value", format: { kind: "decimal", decimals: 2 } }}
                axes={[{ id: "primary", format: { kind: "percent", decimals: 1 } }]}
                series={[
                  {
                    key: "forward",
                    label: "Forward return",
                    type: "scatter",
                    tone: "accent",
                    sizeKey: "turnover",
                  },
                ]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Connected scatter")}
            description={tcs("Ordered by x, so the path reads as a trajectory.")}
            height={300}
            render={({ height }) => (
              <ScatterChart
                data={SORTED.slice(-60)}
                xKey="factor"
                x={{ type: "value", format: { kind: "decimal", decimals: 2 } }}
                axes={[{ id: "primary", format: { kind: "percent", decimals: 1 } }]}
                series={[
                  {
                    key: "forward",
                    label: "Path",
                    type: "line",
                    tone: "accent",
                    symbol: "circle",
                  },
                ]}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("Regression lines")} description={tcs("The chart accepts the fit; it never computes it.")}>
        <Card variant="outline" className="gap-2 p-4">
          <Text variant="caption" tone="muted" as="p">
            {tcs("A fitted line is a second series whose data arrives already prepared by the caller. That keeps the chart honest: whatever the model did is visible in the data layer, not hidden inside a renderer.")}</Text>
          <Code block>{`<ScatterChart
  data={points}
  xKey="factor"
  series={[
    { key: "forward", tone: "accent" },
    { key: "fitted", tone: "warning", type: "line", symbol: false },
  ]}
/>`}</Code>
        </Card>
      </Section>
    </DocPage>
  );
}
