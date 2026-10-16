"use client";

import { BarChart, Card, Code, Section, Text, WaterfallChart } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { channelBars, divergingBars, revenueRows, waterfallData } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const CHANNELS = channelBars();
const REVENUE = revenueRows(8);
const DIVERGING = divergingBars().map((row) => ({
  segment: row.segment,
  negative: Math.min(0, row.change),
  positive: Math.max(0, row.change),
}));
const WATERFALL = waterfallData();

export default function ComparisonPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Comparison")}
        title="Magnitude by category"
        lead="Bars answer one question: how do these categories compare? Grouping, stacking and orientation are properties of the same component; waterfall and diverging bars get their own vocabulary because their shape carries the meaning."
      />

      <Section title={tcs("Grouped and stacked")} description={tcs("Two periods side by side, then three quarters stacked.")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Current vs previous")}
            description={tcs("Grouped bars, two series, one category axis.")}
            height={280}
            render={({ height }) => (
              <BarChart
                data={CHANNELS}
                xKey="channel"
                series={[
                  { key: "current", label: "This quarter", type: "bar", tone: "accent" },
                  { key: "previous", label: "Last quarter", type: "bar", tone: "neutral", opacity: 0.55 },
                ]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Stacked")}
            description={tcs("Stacking groups series under one key and totals the axis.")}
            height={280}
            render={({ height }) => (
              <BarChart
                data={REVENUE}
                xKey="period"
                series={[
                  { key: "product", label: "Product", type: "bar", stack: "rev", tone: "accent" },
                  { key: "services", label: "Services", type: "bar", stack: "rev", tone: "info" },
                  { key: "partnerships", label: "Partnerships", type: "bar", stack: "rev", tone: "neutral" },
                ]}
                tooltip={{ mode: "axis", total: true }}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Horizontal and 100%")}
        description={tcs("Long category labels are the signal to go horizontal; 100% stacking is for share, not for absolute size.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Horizontal bars")}
            description={tcs("Same component, orientation swapped.")}
            height={280}
            render={({ height }) => (
              <BarChart
                data={CHANNELS}
                xKey="channel"
                orientation="horizontal"
                series={[
                  { key: "current", label: "This quarter", type: "bar", tone: "accent" },
                  { key: "previous", label: "Last quarter", type: "bar", tone: "neutral", opacity: 0.5 },
                ]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("100% stacked")}
            description={tcs("stackMode percent is presentation normalisation, not analytics.")}
            height={280}
            render={({ height }) => (
              <BarChart
                data={REVENUE}
                xKey="period"
                series={[
                  { key: "product", label: "Product", type: "bar", stack: "mix", stackMode: "percent", tone: "accent" },
                  { key: "services", label: "Services", type: "bar", stack: "mix", stackMode: "percent", tone: "info" },
                  {
                    key: "partnerships",
                    label: "Partnerships",
                    type: "bar",
                    stack: "mix",
                    stackMode: "percent",
                    tone: "neutral",
                  },
                ]}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Diverging and waterfall")}
        description={tcs("Diverging data is split into two signed series that share a stack key; a waterfall is a transparent base plus a visible delta.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Diverging bars")}
            description={tcs("Six segments, signed change prepared by the caller.")}
            height={300}
            render={({ height }) => (
              <BarChart
                data={DIVERGING}
                xKey="segment"
                series={[
                  { key: "negative", label: "Decline", type: "bar", stack: "delta", tone: "negative" },
                  { key: "positive", label: "Growth", type: "bar", stack: "delta", tone: "accent" },
                ]}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Waterfall")}
            description={tcs("Opening ARR to closing ARR with connector lines.")}
            height={300}
            render={({ height }) => (
              <WaterfallChart data={WATERFALL} format={{ kind: "number", suffix: "m" }} height={height} />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("When not to use a bar")} description={tcs("Three rules the Showcase enforces on itself.")}>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            "Do not use bars for a time progression — a line shows the rate of change, bars do not.",
            "Do not stack series with different units. Percent stacking is the only honest mixed stack.",
            "Do not put more than roughly twelve categories on a vertical bar axis; go horizontal or filter them.",
          ].map((rule) => (
            <Card key={rule} variant="outline" className="gap-1.5 p-4">
              <Text variant="caption" tone="muted" as="p">
                {tcs(rule)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={tcs("Usage")}>
        <Code block>{`<BarChart
  data={rows}
  xKey="channel"
  series={[{ key: "current", type: "bar", tone: "accent" }]}
  orientation="horizontal"   // optional
  tooltip={{ mode: "axis", total: true }}
/>`}</Code>
      </Section>
    </DocPage>
  );
}
