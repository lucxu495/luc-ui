"use client";

import { AreaChart, Badge, Card, Code, Inline, LineChart, Section, Text, formatNumber } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { denseTimeSeries } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const DENSE = denseTimeSeries(10_000);
const MEDIUM = DENSE.filter((_, index) => index % 4 === 0);

export default function PerformancePage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Performance")}
        title="Dense time series"
        lead="Charts have to survive real data volumes. ECharts renders these with its own progressive path, animation is capped, and symbols are dropped past a few hundred points rather than drawn and hidden."
      />

      <Section
        title={tcs("10,000 points, two engines")}
        description={tcs("Both charts below share one deterministic dataset. The notes are local environment observations, not a benchmark claim.")}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("ECharts · 10,000 points")}
            description={tcs("Line plus a prepared band, progressive rendering, no intro animation.")}
            height={320}
            readout={
              <Inline gap="sm">
                <Badge size="sm" tone="outline">
                  10,000 pts
                </Badge>
                <Text variant="caption" tone="muted" as="span">
                  progressive
                </Text>
              </Inline>
            }
            render={({ height }) => (
              <LineChart
                data={DENSE}
                xKey="time"
                x={{ type: "time" }}
                series={[
                  { key: "value", label: "Level", type: "line", tone: "accent", symbol: false, lineWidth: 1.2 },
                ]}
                interaction={{ zoom: "inside" }}
                tooltip={{ mode: "axis" }}
                height={height}
                ariaLabel={tcs("Ten thousand point time series")}
              />
            )}
          />
          <ChartPanel
            title={tcs("ECharts · decimated to 2,500")}
            description={tcs("The same shape after a caller-side decimation step.")}
            height={320}
            readout={
              <Inline gap="sm">
                <Badge size="sm" tone="outline">
                  2,500 pts
                </Badge>
                <Text variant="caption" tone="muted" as="span">
                  every 4th
                </Text>
              </Inline>
            }
            render={({ height }) => (
              <LineChart
                data={MEDIUM}
                xKey="time"
                x={{ type: "time" }}
                series={[{ key: "value", label: "Level", type: "line", tone: "accent", symbol: false, lineWidth: 1.2 }]}
                interaction={{ zoom: "inside" }}
                height={height}
                ariaLabel="Decimated time series"
              />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("Prepared envelope at scale")} description={tcs("Upper and lower bounds as an area pair, with the series in line.")}>
        <ChartPanel
          title={tcs("Band at 10,000 points")}
          description={tcs("The band is drawn with the same transparent-stack technique; no custom renderer is involved.")}
          height={320}
          render={({ height }) => (
            <AreaChart
              data={DENSE.map((point) => ({
                time: point.time,
                base: point.lower,
                width: point.upper - point.lower,
                value: point.value,
              }))}
              xKey="time"
              series={[
                {
                  key: "base",
                  label: "Base",
                  type: "area",
                  stack: "band",
                  color: "transparent",
                  symbol: false,
                  lineWidth: 0,
                },
                {
                  key: "width",
                  label: "Envelope",
                  type: "area",
                  stack: "band",
                  tone: "accent",
                  symbol: false,
                  lineWidth: 1,
                },
                { key: "value", label: "Level", type: "area", tone: "neutral", symbol: false, lineWidth: 1.2 },
              ]}
              interaction={{ zoom: "inside" }}
              tooltip={{ mode: "axis" }}
              height={height}
              ariaLabel={tcs("Envelope at ten thousand points")}
            />
          )}
        />
      </Section>

      <Section title={tcs("What the system does at scale")} description={tcs("Rules, not tricks.")}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Symbols drop out",
              copy: "Past 60 points a line series stops drawing vertex symbols unless the caller asks for them.",
            },
            {
              title: "Animation caps",
              copy: "Intro animation is 0 under reduced motion, and update transitions never exceed the motion budget.",
            },
            {
              title: "Progressive rendering",
              copy: "Heatmap and long series use the engine's progressive path rather than a single blocking draw.",
            },
            {
              title: tcs("Decimation is the caller's call"),
              copy: "Luc UI does not silently drop points. If a series needs decimating, the data layer does it.",
            },
          ].map((item) => (
            <Card key={item.title} variant="outline" className="gap-1.5 p-4">
              <Text variant="label" as="p">
                {item.title}
              </Text>
              <Text variant="caption" tone="muted" as="p">
                {tcs(item.copy)}
              </Text>
            </Card>
          ))}
        </div>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Latest synthetic value in this dataset:")}{" "}{formatNumber(DENSE[DENSE.length - 1]!.value, { kind: "decimal" })}{tcs(". Timings are not published here because a screenshot environment is not a benchmark.")}</Text>
        <Code block>{`// The chart never silently decimates. Do it in the data layer if needed.
const shown = points.filter((_, index) => index % 4 === 0);
<LineChart data={shown} xKey="time" series={[{ key: "value", symbol: false }]} />`}</Code>
      </Section>
    </DocPage>
  );
}
