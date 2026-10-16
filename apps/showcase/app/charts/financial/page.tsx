"use client";

import { useState } from "react";
import { Badge, Code, FinancialChart, Inline, Section, Text, formatNumber } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { TIME_RANGES, candlesFrom, marketSeries, overlayFrom, volumeFrom } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 900 });
const CANDLES = candlesFrom(ROWS);
const VOLUME = volumeFrom(ROWS);
const LATEST = ROWS[ROWS.length - 1]!;

const RANGE_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 91,
  "6m": 182,
  "1y": 365,
  all: ROWS.length,
};

function windowFor(range: string) {
  return Math.min(RANGE_DAYS[range] ?? ROWS.length, ROWS.length);
}

/**
 * Overlays are sliced to the same window as the candles. If they are not, the
 * time scale stretches to the longest series and the price pane ends up with a
 * history it is not showing candles for.
 */
function overlaysFor(range: string) {
  const window = windowFor(range);
  return [
    {
      id: "sma50",
      label: "SMA 50",
      data: overlayFrom(ROWS, "sma50").slice(-window),
      tone: "info" as const,
      lineType: "dashed" as const,
    },
    {
      id: "sma200",
      label: "SMA 200",
      data: overlayFrom(ROWS, "sma200").slice(-window),
      tone: "neutral" as const,
    },
  ];
}

function indicatorsFor(range: string) {
  const window = windowFor(range);
  return [
    {
      id: "rv",
      label: "Realized volatility 30d",
      stretch: 1,
      series: [
        {
          id: "rv30",
          label: "RV 30d",
          kind: "line" as const,
          data: overlayFrom(ROWS, "rv30").slice(-window),
          tone: "warning" as const,
          lineWidth: 1.6,
        },
      ],
    },
  ];
}

export default function FinancialPage() {
  const { tcs } = useI18n();
  const [visibleOverlays] = useState<string[]>(["sma50", "sma200"]);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts · Financial")}
        title="Price, volume, panes"
        lead="Lightweight Charts behind a LUC adapter: candle colours, crosshair, panes, overlays, range and synchronisation all come from the design system. The consumer never calls createChart, and never receives an engine handle unless it asks for one."
      />

      <Section
        title={tcs("Candlestick with volume and overlays")}
        description={tcs("A price pane, a volume pane, two moving-average overlays and a fullscreen research view.")}
      >
        <ChartPanel
          title={tcs("Candles · volume · overlays")}
          description={tcs("Prepared OHLC, volume and moving averages — no indicator is computed here.")}
          readout={
            <Inline gap="sm">
              <Text variant="label" as="span">
                {formatNumber(LATEST.close, { kind: "currency", minimumFractionDigits: 2 })}
              </Text>
              <Badge size="sm" tone={LATEST.close >= LATEST.open ? "positive" : "negative"} dot>
                {formatNumber(((LATEST.close - LATEST.open) / LATEST.open) * 100, {
                  kind: "percent",
                  signed: true,
                })}
              </Badge>
            </Inline>
          }
          series={[
            { id: "sma50", label: "SMA 50", tone: "info" },
            { id: "sma200", label: "SMA 200", tone: "neutral" },
          ]}
          defaultVisible={visibleOverlays}
          ranges={TIME_RANGES}
          defaultRange="6m"
          height={420}
          states
          exportFilename="luc-candlestick"
          render={({ range, visibleSeries, state, height }) => (
            <FinancialChart
              candles={CANDLES.slice(-windowFor(range))}
              volume={VOLUME.slice(-windowFor(range))}
              overlays={overlaysFor(range)}
              visibleOverlays={visibleSeries}
              priceFormat={{ kind: "currency", currency: "USD", decimals: 2 }}
              mode="candlestick"
              range={null}
              state={state}
              height={height}
              ariaLabel={tcs("Candlestick chart with volume and moving averages")}
            />
          )}
        />
      </Section>

      <Section title={tcs("Line and area modes")} description={tcs("The same component, the same panes, a different price mark.")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Price line")}
            height={300}
            render={({ height }) => (
              <FinancialChart
                candles={CANDLES.slice(-365)}
                volume={VOLUME.slice(-365)}
                mode="line"
                height={height}
                ariaLabel="Price line chart"
              />
            )}
          />
          <ChartPanel
            title={tcs("Price area")}
            height={300}
            render={({ height }) => (
              <FinancialChart
                candles={CANDLES.slice(-365)}
                mode="area"
                showVolume={false}
                height={height}
                ariaLabel="Price area chart"
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={"Multi-pane"}
        description={tcs("Price, volume and a prepared indicator pane. RSI or MACD would arrive the same way: prepared values with reference lines.")}
      >
        <ChartPanel
          title={tcs("Price · volume · realized volatility")}
          ranges={TIME_RANGES}
          defaultRange="6m"
          height={440}
          render={({ range, height }) => (
            <FinancialChart
              candles={CANDLES.slice(-windowFor(range))}
              volume={VOLUME.slice(-windowFor(range))}
              overlays={[overlaysFor(range)[0]!]}
              indicators={indicatorsFor(range)}
              height={height}
              ariaLabel="Multi-pane financial chart"
            />
          )}
        />
      </Section>

      <Section title={tcs("Usage")}>
        <Code block>{`<FinancialChart
  candles={candles}                 // prepared OHLC
  volume={volume}                   // prepared volume, optional direction
  overlays={[{ id: "sma50", label: "SMA 50", data: sma50 }]}
  indicators={[
    { id: "rsi", label: "RSI 14", series: [{ id: "rsi", kind: "line", data: rsi }], referenceLines: [30, 70] },
  ]}
  mode="candlestick"
  range={{ from, to }}              // or null to fit all
  syncGroup="research-stack"
/>`}</Code>
      </Section>
    </DocPage>
  );
}
