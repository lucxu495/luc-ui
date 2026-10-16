"use client";

import { AreaChart, Code, ComposedChart, Section } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { TIME_RANGES, marketSeries, windowForRange } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 420 });
const PRICE_VOLUME = ROWS.map((row, index) => ({
  time: row.time,
  close: row.close,
  volume: row.volume / 1e9,
  change: index === 0 ? 0 : ((row.close - ROWS[index - 1]!.close) / ROWS[index - 1]!.close) * 100,
}));

export default function ComposedPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Composed")}
        title="Mixed marks and dual axes"
        lead="A second axis is a claim that two measures share a shape but not a unit. The API forces that claim to be explicit: every series names the axis it belongs to, and the axis carries its own formatter."
      />

      <Section
        title={tcs("Dual axis")}
        description={tcs("Price on the left in currency, realized volatility on the right in percent.")}
      >
        <ChartPanel
          title={tcs("Price and realized volatility")}
          description={tcs("Two marks, two axes, one tooltip that names both.")}
          series={[
            { id: "close", label: "Close", tone: "accent" },
            { id: "rv30", label: "Realized vol 30d", tone: "warning" },
          ]}
          ranges={TIME_RANGES}
          defaultRange="1y"
          height={360}
          render={({ range, visibleSeries, height }) => (
            <ComposedChart
              data={windowForRange(ROWS, range)}
              xKey="time"
              axes={[
                { id: "primary", position: "right", format: { kind: "currency", currency: "USD" } },
                { id: "secondary", position: "left", format: { kind: "percent", decimals: 1 } },
              ]}
              series={[
                {
                  key: "close",
                  label: "Close",
                  type: "line",
                  axis: "primary",
                  tone: "accent",
                  lineWidth: 2,
                  symbol: false,
                },
                {
                  key: "rv30",
                  label: "Realized vol 30d",
                  type: "line",
                  axis: "secondary",
                  tone: "warning",
                  lineWidth: 1.5,
                  symbol: false,
                  opacity: 0.85,
                },
              ]}
              visibleSeries={visibleSeries}
              height={height}
            />
          )}
        />
      </Section>

      <Section
        title={tcs("Bars and a line")}
        description={tcs("Volume as bars on a secondary axis, price as a line — both prepared.")}
      >
        <ChartPanel
          title={tcs("Price and volume")}
          height={340}
          render={({ height }) => (
            <ComposedChart
              data={PRICE_VOLUME}
              xKey="time"
              axes={[
                { id: "primary", position: "right", format: { kind: "currency", currency: "USD" } },
                { id: "secondary", position: "left", format: { kind: "decimal", decimals: 1, suffix: "B" } },
              ]}
              series={[
                {
                  key: "volume",
                  label: "Volume",
                  type: "bar",
                  axis: "secondary",
                  tone: "neutral",
                  opacity: 0.32,
                },
                { key: "close", label: "Close", type: "line", axis: "primary", tone: "accent", symbol: false },
              ]}
              height={height}
            />
          )}
        />
      </Section>

      <Section title={tcs("Area and line")} description={tcs("The quiet pairing: an envelope in area, the series in line.")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Volatility envelope")}
            height={280}
            render={({ height }) => (
              <AreaChart
                data={ROWS.map((row) => ({
                  time: row.time,
                  base: row.bandLower,
                  width: row.bandUpper !== null && row.bandLower !== null ? row.bandUpper - row.bandLower : null,
                  close: row.close,
                }))}
                xKey="time"
                series={[
                  {
                    key: "base",
                    label: "Band base",
                    type: "area",
                    stack: "band",
                    color: "transparent",
                    symbol: false,
                    lineWidth: 0,
                  },
                  {
                    key: "width",
                    label: "Band",
                    type: "area",
                    stack: "band",
                    tone: "accent",
                    symbol: false,
                    lineWidth: 1,
                  },
                  { key: "close", label: "Close", type: "area", tone: "neutral", symbol: false, lineWidth: 1.4 },
                ]}
                interaction={{ zoom: "none" }}
                height={height}
                ariaLabel={tcs("Close price inside a prepared volatility band")}
              />
            )}
          />
          <ChartPanel
            title={tcs("Return profile")}
            height={280}
            render={({ height }) => (
              <AreaChart
                data={PRICE_VOLUME}
                xKey="time"
                series={[{ key: "change", label: "Daily change %", type: "area", tone: "info", lineWidth: 1 }]}
                height={height}
              />
            )}
          />
        </div>
      </Section>

      <Section title={tcs("Usage")}>
        <Code block>{`<ComposedChart
  data={rows}
  xKey="time"
  axes={[
    { id: "primary", position: "right", format: { kind: "currency" } },
    { id: "secondary", position: "left", format: { kind: "percent" } },
  ]}
  series={[
    { key: "close", type: "line", axis: "primary" },
    { key: "rv30", type: "line", axis: "secondary", tone: "warning" },
  ]}
/>`}</Code>
      </Section>
    </DocPage>
  );
}
