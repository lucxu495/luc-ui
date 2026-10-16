"use client";

import { Code, GaugeChart, RadarChart, Section } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { gaugeMetrics, radarData } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const RADAR = radarData();
const GAUGES = gaugeMetrics();

export default function RadialPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Radial")}
        title="Radar and gauge"
        lead="Radial charts are special-purpose and stay restrained: two or three radar series with no symbols, and gauges with a thin track, a single accent stroke and a tabular readout. No glossy arcs, no needles, no gradient rainbows."
      />

      <Section
        title={tcs("Radar")}
        description={tcs("Six prepared spokes, three series, low-alpha fills so overlapping shapes stay readable.")}
      >
        <ChartPanel
          title={tcs("Strategy profile")}
          description={tcs("Higher is better on every spoke; the axes are normalised by the caller.")}
          height={380}
          render={({ height }) => (
            <RadarChart
              indicators={RADAR.indicators}
              series={RADAR.series}
              format={{ kind: "integer" }}
              height={height}
              ariaLabel={tcs("Radar comparison of three strategy profiles")}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Gauge")}
        description={tcs("Three compact gauges. Threshold zones are optional and drawn as a track, not as separate dials.")}
      >
        <div className="grid gap-5 md:grid-cols-3">
          {GAUGES.map((metric, index) => (
            <ChartPanel
              key={metric.label}
              title={metric.label}
              height={240}
              render={({ height }) => (
                <GaugeChart
                  value={metric.value}
                  label={metric.label}
                  format={metric.format}
                  variant={index === 0 ? "semi" : "ring"}
                  max={index === 2 ? 2_000 : 100}
                  thresholds={
                    index === 0
                      ? [
                          { value: 40, tone: "positive" },
                          { value: 75, tone: "warning" },
                          { value: 100, tone: "negative" },
                        ]
                      : undefined
                  }
                  height={height}
                />
              )}
            />
          ))}
        </div>
      </Section>

      <Section title={tcs("Usage")}>
        <Code block>{`<RadarChart indicators={spokes} series={[{ name: "Momentum", values }]} />

<GaugeChart
  value={38.4}
  max={100}
  label="Realized volatility"
  format={{ kind: "percent" }}
  variant="semi"
  thresholds={[{ value: 40, tone: "positive" }, { value: 75, tone: "warning" }]}
/>`}</Code>
      </Section>
    </DocPage>
  );
}
