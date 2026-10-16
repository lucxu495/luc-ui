"use client";

import {
  BarChart,
  Card,
  ChartSyncGroup,
  Code,
  FinancialChart,
  LineChart,
  Section,
  Text,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { candlesFrom, marketSeries, volumeFrom } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 900 });
const CANDLES = candlesFrom(ROWS);
const VOLUME = volumeFrom(ROWS);

const VOLUME_BARS = ROWS.map((row) => ({
  time: row.time,
  volume: row.volume / 1e9,
}));

export default function SyncPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Interaction")}
        title="Synchronised research stack"
        lead="Three charts, two different engines, one crosshair and one visible range. Synchronisation is LUC's, not the engine's: the bus carries a normalised timestamp and window, so ECharts and Lightweight Charts follow each other without either knowing the other exists."
      />

      <Section
        title={tcs("Cross-engine stack")}
        description={tcs("Move the pointer across any pane. Scroll or drag to change the visible window; all three follow. Each chart publishes only what it owns, and a subscriber never receives its own event.")}
      >
        <ChartSyncGroup groupId="research-stack" className="gap-4">
          <ChartPanel
            title={tcs("Price")}
            description={tcs("Lightweight Charts · candlestick, volume pane")}
            height={300}
            render={({ height }) => (
              <FinancialChart
                candles={CANDLES}
                volume={VOLUME}
                mode="candlestick"
                syncGroup="research-stack"
                priceFormat={{ kind: "currency", currency: "USD", decimals: 2 }}
                height={height}
                ariaLabel={tcs("Price pane in the synchronised stack")}
              />
            )}
          />
          <ChartPanel
            title={tcs("Funding rate")}
            description={tcs("Apache ECharts · line with a zero reference")}
            height={170}
            render={({ height }) => (
              <LineChart
                data={ROWS}
                xKey="time"
                syncGroup="research-stack"
                axes={[{ id: "primary", format: { kind: "percent", decimals: 2 } }]}
                series={[
                  { key: "funding", label: "Funding", type: "line", tone: "accent", symbol: false, lineWidth: 1.5 },
                ]}
                annotations={{ referenceLines: [{ value: 0, tone: "neutral" }] }}
                interaction={{ zoom: "inside" }}
                height={height}
                ariaLabel="Funding rate pane"
              />
            )}
          />
          <ChartPanel
            title={tcs("Realized volatility")}
            description={tcs("Apache ECharts · area with a prepared band")}
            height={170}
            render={({ height }) => (
              <LineChart
                data={ROWS}
                xKey="time"
                syncGroup="research-stack"
                axes={[{ id: "primary", format: { kind: "percent", decimals: 0 } }]}
                series={[
                  { key: "rv30", label: "RV 30d", type: "area", tone: "warning", symbol: false, lineWidth: 1.5 },
                ]}
                interaction={{ zoom: "inside" }}
                height={height}
                ariaLabel="Realized volatility pane"
              />
            )}
          />
        </ChartSyncGroup>
      </Section>

      <Section
        title={tcs("Same-engine sync")}
        description={tcs("A price line and a volume bar chart sharing a group. The range selector is absent on purpose: the demo is about the crosshair and the window, not about refetching.")}
      >
        <ChartSyncGroup groupId="echarts-pair" className="gap-4">
          <ChartPanel
            title={tcs("Close")}
            height={220}
            render={({ height }) => (
              <LineChart
                data={ROWS.slice(-365)}
                xKey="time"
                syncGroup="echarts-pair"
                axes={[{ id: "primary", format: { kind: "currency", currency: "USD" } }]}
                series={[{ key: "close", label: "Close", type: "line", tone: "accent", symbol: false }]}
                interaction={{ zoom: "inside" }}
                height={height}
              />
            )}
          />
          <ChartPanel
            title={tcs("Volume")}
            height={180}
            render={({ height }) => (
              <BarChart
                data={VOLUME_BARS.slice(-365)}
                xKey="time"
                syncGroup="echarts-pair"
                axes={[{ id: "primary", format: { kind: "decimal", decimals: 1, suffix: "B" } }]}
                series={[{ key: "volume", label: "Volume", type: "bar", tone: "neutral", opacity: 0.5 }]}
                interaction={{ zoom: "inside" }}
                height={height}
              />
            )}
          />
        </ChartSyncGroup>
      </Section>

      <Section title={tcs("How it works")} description={tcs("Two rules do all the work.")}>
        <div className="grid gap-3 md:grid-cols-2">
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Normalised events
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("The bus carries milliseconds and a window. Each adapter converts at its own boundary: ECharts already speaks milliseconds, Lightweight Charts speaks seconds, and nothing downstream has to know that.")}</Text>
          </Card>
          <Card variant="outline" className="gap-1.5 p-4">
            <Text variant="label" as="p">
              Loop protection
            </Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("A publish carries its origin id, and a subscriber never receives its own event. While an adapter applies a remote value it sets a guard so the engine's resulting event is not re-published.")}</Text>
          </Card>
        </div>
        <Code block>{`<ChartSyncGroup groupId="research-stack">
  <FinancialChart candles={candles} syncGroup="research-stack" />
  <LineChart data={rows} xKey="time" syncGroup="research-stack" series={funding} />
  <LineChart data={rows} xKey="time" syncGroup="research-stack" series={vol} />
</ChartSyncGroup>`}</Code>
      </Section>
    </DocPage>
  );
}
