"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Badge,
  ChartResetButton,
  Code,
  FinancialChart,
  Inline,
  Section,
  Text,
  Toggle,
  catppuccinMochaChartTheme,
  formatNumber,
  type FinancialChartController,
  type IndicatorPane,
  type OverlayPoint,
  type PriceSeriesData,
} from "@luc/ui";
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

/**
 * Range presets control the viewport, not the loaded history. Keeping the full
 * fixture mounted means a range click does not replace every series or collapse
 * reader zoom into a blank window.
 */
function rangeFor(range: string): { from: number; to: number } | null {
  const days = Math.min(RANGE_DAYS[range] ?? ROWS.length, ROWS.length);
  if (days >= ROWS.length) return null;
  const from = ROWS[ROWS.length - days]!.time.getTime();
  const to = ROWS[ROWS.length - 1]!.time.getTime();
  return { from, to };
}

/** Prepared overlays share the complete candle time domain. */
function overlaysFor() {
  return [
    {
      id: "sma50",
      label: "SMA 50",
      data: overlayFrom(ROWS, "sma50"),
      tone: "info" as const,
      lineType: "dashed" as const,
    },
    {
      id: "sma200",
      label: "SMA 200",
      data: overlayFrom(ROWS, "sma200"),
      tone: "neutral" as const,
    },
  ];
}

function indicatorsFor() {
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
          data: overlayFrom(ROWS, "rv30"),
          tone: "warning" as const,
          lineWidth: 1.6,
          format: { kind: "number" as const, decimals: 2, suffix: "%" },
        },
      ],
    },
  ];
}

/**
 * Prepared rolling Sharpe values for the notebook-style comparison demo.
 * The Showcase computes this fixture; FinancialChart only draws it.
 */
function rollingSharpe(): OverlayPoint[] {
  const returns = ROWS.map((row, index) =>
    index === 0 ? null : Math.log(row.close / ROWS[index - 1]!.close),
  );
  return ROWS.map((row, index) => {
    if (index < 30) return { time: row.time, value: null };
    const window = returns.slice(index - 29, index + 1) as number[];
    const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
    const variance =
      window.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(1, window.length - 1);
    return {
      time: row.time,
      value: Number(((mean / Math.sqrt(variance)) * Math.sqrt(252)).toFixed(2)),
    };
  });
}

const SHARPE = rollingSharpe();

const CANDLE_OVERLAYS = overlaysFor();
const RV_PANES = indicatorsFor();
const NOTEBOOK_PRICE_SERIES = [
  {
    id: "portfolio",
    label: "Portfolio close",
    data: ROWS.map((row) => ({ time: row.time, close: row.close })),
    tone: "accent",
    lineWidth: 2,
  },
  {
    id: "benchmark",
    label: "Prepared benchmark",
    data: ROWS.map((row) => ({ time: row.time, close: row.sma50 })),
    tone: "warning",
    lineWidth: 1.5,
  },
] satisfies readonly PriceSeriesData[];

const SHARPE_PANE = {
  id: "sharpe",
  label: "Rolling 30d Sharpe",
  referenceLines: [0],
  stretch: 1,
  series: [
    {
      id: "sharpe",
      kind: "line",
      data: SHARPE,
      tone: "neutral",
      lineWidth: 1.5,
      format: { kind: "number", decimals: 2 },
    },
  ],
} satisfies IndicatorPane;

function ViewportReadout({ label }: { label: string }) {
  const { tcs } = useI18n();
  return (
    <Inline gap="sm">
      <Badge size="sm" tone="outline">
        {label}
      </Badge>
      <Text variant="micro" tone="muted" as="span">
        {formatNumber(ROWS.length, { kind: "number", maximumFractionDigits: 0 })}{" "}
        {tcs("UTC sessions")}
      </Text>
    </Inline>
  );
}

function CandleShowcase() {
  const { tcs } = useI18n();
  const controller = useRef<FinancialChartController | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showPriceLine, setShowPriceLine] = useState(true);

  return (
    <ChartPanel
      title={tcs("Candles · volume · overlays")}
      description={tcs(
        "Prepared OHLC, volume and moving averages. Range presets move the viewport without replacing the loaded history.",
      )}
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
        { id: "sma50", label: "SMA 50", tone: "info", mark: "line", line: "dashed" },
        { id: "sma200", label: "SMA 200", tone: "neutral", mark: "line" },
      ]}
      defaultVisible={["sma50", "sma200"]}
      actions={
        <>
          <Toggle
            size="sm"
            pressed={showVolume}
            onPressedChange={setShowVolume}
            label={tcs("Toggle volume")}
          >
            {tcs("Volume")}
          </Toggle>
          <Toggle
            size="sm"
            pressed={showPriceLine}
            onPressedChange={setShowPriceLine}
            label={tcs("Toggle last price line")}
          >
            {tcs("Price line")}
          </Toggle>
          <ChartResetButton
            label={tcs("Reset viewport")}
            onReset={() => controller.current?.fit()}
          />
        </>
      }
      ranges={TIME_RANGES}
      defaultRange="6m"
      height="clamp(340px, 54vw, 460px)"
      states
      exportFilename="luc-candlestick"
      render={({ range, visibleSeries, state, height }) => (
        <FinancialChart
          candles={CANDLES}
          volume={showVolume ? VOLUME : undefined}
          overlays={CANDLE_OVERLAYS}
          visibleOverlays={visibleSeries}
          showVolume={showVolume}
          showPriceLine={showPriceLine}
          showLegend={false}
          priceFormat={{ kind: "currency", currency: "USD", decimals: 2 }}
          mode="candlestick"
          range={rangeFor(range)}
          state={state}
          height={height}
          onControllerReady={(next) => {
            controller.current = next;
          }}
          ariaLabel={tcs("Candlestick chart with volume and moving averages")}
          ariaDescription={tcs(
            "Hover to inspect OHLC, volume and prepared moving averages. Scroll to zoom and drag to pan.",
          )}
          tooltipLabels={{
            open: tcs("Open"),
            high: tcs("High"),
            low: tcs("Low"),
            close: tcs("Close"),
            change: tcs("Change"),
            volume: tcs("Volume"),
          }}
        />
      )}
    />
  );
}

function NotebookShowcase() {
  const { tcs } = useI18n();
  const controller = useRef<FinancialChartController | null>(null);
  const [showSharpe, setShowSharpe] = useState(true);
  const [useCatppuccin, setUseCatppuccin] = useState(true);
  const localizedPriceSeries = useMemo(
    () =>
      NOTEBOOK_PRICE_SERIES.map((series) => ({
        ...series,
        label: tcs(series.label ?? series.id ?? "Price"),
      })),
    [tcs],
  );
  const localizedSharpe = useMemo(
    () => ({
      ...SHARPE_PANE,
      label: tcs(SHARPE_PANE.label),
    }),
    [tcs],
  );

  return (
    <ChartPanel
      title={tcs("Portfolio versus prepared benchmark")}
      description={tcs(
        "Close-only data goes directly to two price lines. No synthetic OHLC is created, and the prepared Sharpe series gets its own synchronized pane.",
      )}
      readout={<ViewportReadout label={tcs("2 panes · close-only")} />}
      series={[
        {
          id: "portfolio",
          label: tcs("Portfolio close"),
          tone: "accent",
          mark: "line",
          weight: "strong",
        },
        {
          id: "benchmark",
          label: tcs("Prepared benchmark"),
          tone: "warning",
          mark: "line",
        },
      ]}
      actions={
        <>
          <Toggle
            size="sm"
            pressed={showSharpe}
            onPressedChange={setShowSharpe}
            label={tcs("Toggle Sharpe pane")}
          >
            {tcs("Sharpe")}
          </Toggle>
          <Toggle
            size="sm"
            pressed={useCatppuccin}
            onPressedChange={setUseCatppuccin}
            label={tcs("Toggle Catppuccin Mocha preset")}
          >
            {tcs("Mocha")}
          </Toggle>
          <ChartResetButton
            label={tcs("Reset viewport")}
            onReset={() => controller.current?.fit()}
          />
        </>
      }
      ranges={TIME_RANGES}
      defaultRange="6m"
      scale={{ allowed: ["linear", "log"], default: "log" }}
      height="clamp(340px, 50vw, 470px)"
      states
      emptyWhenNoSeries
      render={({ range, visibleSeries, state, height, scaleMode }) => (
        <FinancialChart
          series={
            visibleSeries
              ? localizedPriceSeries.filter((item) => visibleSeries.includes(item.id!))
              : localizedPriceSeries
          }
          indicators={showSharpe ? [localizedSharpe] : undefined}
          showVolume={false}
          showPriceLine
          showLegend={false}
          priceScale={{ mode: scaleMode }}
          range={rangeFor(range)}
          state={state}
          syncGroup="financial-notebook"
          themeOverride={useCatppuccin ? catppuccinMochaChartTheme : undefined}
          priceFormat={{ kind: "currency", currency: "USD", decimals: 2 }}
          height={height}
          onControllerReady={(next) => {
            controller.current = next;
          }}
          ariaLabel={tcs(
            "Close-only comparison with a Sharpe pane and logarithmic price scale",
          )}
          ariaDescription={tcs(
            "Two close series share one time scale. The prepared Sharpe pane follows the same crosshair and viewport.",
          )}
          tooltipLabels={{
            close: tcs("Close"),
            change: tcs("Change"),
            volume: tcs("Volume"),
          }}
        />
      )}
    />
  );
}

function MultiPaneShowcase() {
  const { tcs } = useI18n();
  const controller = useRef<FinancialChartController | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicator, setShowIndicator] = useState(true);
  const localizedIndicators = useMemo(
    () =>
      RV_PANES.map((pane) => ({
        ...pane,
        label: tcs(pane.label),
      })),
    [tcs],
  );

  return (
    <ChartPanel
      title={tcs("Price · volume · realized volatility")}
      description={tcs(
        "Indicators arrive as prepared values with reference lines. Hiding a pane closes the gap instead of leaving an empty strip.",
      )}
      readout={<ViewportReadout label={tcs("Prepared research panes")} />}
      series={[
        { id: "rv", label: tcs("RV 30d"), tone: "warning", mark: "line" },
        { id: "sma50", label: "SMA 50", tone: "info", mark: "line", line: "dashed" },
      ]}
      actions={
        <>
          <Toggle
            size="sm"
            pressed={showVolume}
            onPressedChange={setShowVolume}
            label={tcs("Toggle volume")}
          >
            {tcs("Volume")}
          </Toggle>
          <Toggle
            size="sm"
            pressed={showIndicator}
            onPressedChange={setShowIndicator}
            label={tcs("Toggle volatility pane")}
          >
            {tcs("Volatility")}
          </Toggle>
          <ChartResetButton
            label={tcs("Reset viewport")}
            onReset={() => controller.current?.fit()}
          />
        </>
      }
      ranges={TIME_RANGES}
      defaultRange="6m"
      height="clamp(360px, 56vw, 480px)"
      render={({ range, visibleSeries, height }) => (
        <FinancialChart
          candles={CANDLES}
          volume={showVolume ? VOLUME : undefined}
          overlays={[CANDLE_OVERLAYS[0]!]}
          visibleOverlays={visibleSeries?.includes("sma50") ? ["sma50"] : []}
          indicators={showIndicator ? localizedIndicators : undefined}
          showVolume={showVolume}
          range={rangeFor(range)}
          priceFormat={{ kind: "currency", currency: "USD", decimals: 2 }}
          height={height}
          onControllerReady={(next) => {
            controller.current = next;
          }}
          ariaLabel={tcs("Multi-pane financial chart")}
          ariaDescription={tcs(
            "Price, optional volume, and optional realized-volatility panes share one native time scale.",
          )}
          tooltipLabels={{
            open: tcs("Open"),
            high: tcs("High"),
            low: tcs("Low"),
            close: tcs("Close"),
            change: tcs("Change"),
            volume: tcs("Volume"),
          }}
        />
      )}
    />
  );
}

export default function FinancialPage() {
  const { tcs } = useI18n();

  return (
    <DocPage intent="wide">
      <PageHeader
        eyebrow={tcs("Charts · Financial")}
        title="Price, volume, panes"
        lead="Native Lightweight Charts interaction behind a typed LUC surface: a shared time scale, smooth crosshair inspection, prepared overlays and indicators, and theme-aware controls that preserve the reader's viewport."
      />

      <Link href="/charts/lightweight"
        className="inline-flex w-fit rounded-lg border border-line-subtle px-4 py-2 text-sm text-fg-accent hover:border-fg-accent focus-visible:outline-2 focus-visible:outline-fg-accent">
        {tcs("Explore all Lightweight Charts live examples")}
      </Link>

      <Section
        title={tcs("Candlestick with volume and overlays")}
        description={tcs(
          "Toggle volume, moving averages and the last-price line. Open the inspector for a larger reading surface with the same state.",
        )}
      >
        <CandleShowcase />
      </Section>

      <Section
        title={tcs("Line and area modes")}
        description={tcs(
          "The same time scale and reader gestures with a different price mark. The area variant deliberately omits volume so the price pane keeps the full height.",
        )}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Price line")}
            height="clamp(260px, 38vw, 320px)"
            render={({ height }) => (
              <FinancialChart
                candles={CANDLES}
                volume={VOLUME}
                mode="line"
                range={rangeFor("1y")}
                priceFormat={{ kind: "currency", currency: "USD", decimals: 2 }}
                height={height}
                ariaLabel={tcs("Price line chart")}
                tooltipLabels={{
                  open: tcs("Open"),
                  high: tcs("High"),
                  low: tcs("Low"),
                  close: tcs("Close"),
                  change: tcs("Change"),
                  volume: tcs("Volume"),
                }}
              />
            )}
          />
          <ChartPanel
            title={tcs("Price area")}
            height="clamp(260px, 38vw, 320px)"
            render={({ height }) => (
              <FinancialChart
                candles={CANDLES}
                mode="area"
                showVolume={false}
                range={rangeFor("1y")}
                priceFormat={{ kind: "currency", currency: "USD", decimals: 2 }}
                height={height}
                ariaLabel={tcs("Price area chart")}
                tooltipLabels={{
                  open: tcs("Open"),
                  high: tcs("High"),
                  low: tcs("Low"),
                  close: tcs("Close"),
                  change: tcs("Change"),
                  volume: tcs("Volume"),
                }}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Notebook comparison · log price · Sharpe pane")}
        description={tcs(
          "A close-only research view with two price lines and a lower analysis pane. Switch Linear/Log, hide the Sharpe pane, reset the viewport, or opt into Catppuccin Mocha without changing the page theme.",
        )}
      >
        <NotebookShowcase />
      </Section>

      <Section
        title={tcs("Multi-pane")}
        description={tcs(
          "Price, volume and a prepared indicator pane. Toggle either lower series and the remaining panes close the gap instead of leaving a blank strip.",
        )}
      >
        <MultiPaneShowcase />
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
  showVolume
  showPriceLine
  priceScale={{ mode: "linear" }}
  syncGroup="research-stack"
/>`}</Code>
        <Code block>{`// Close-only comparison, multi-pane analysis and incremental updates.
<FinancialChart
  series={[
    { id: "portfolio", data: [{ time, close }] },
    { id: "benchmark", data: [{ time, close }] },
  ]}
  indicators={[{
    id: "sharpe",
    label: "Sharpe",
    series: [{ id: "sharpe", kind: "line", data, format: { kind: "number", decimals: 2 } }],
  }]}
  priceScale={{ mode: "log" }}
  showVolume={false}
  syncGroup="notebook"
  onControllerReady={({ updatePrice }) => {
    updatePrice({ time: nextTime, close: nextClose });
  }}
/>`}</Code>
      </Section>
    </DocPage>
  );
}
