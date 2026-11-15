"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChartResetButton, FinancialChart, Toggle, catppuccinMochaChartTheme,
  type FinancialChartController, type IndicatorPane, type PriceSeriesData,
} from "@luc/ui";
import { ChartPanel } from "@/components/charts/chart-panel";
import { useI18n } from "@/lib/i18n/provider";
import { candlesFrom, marketSeries, overlayFrom, volumeFrom } from "@/lib/mock-data";
import type { LightweightExampleId } from "@/lib/charts/lightweight-examples";

/** The data fixture is deterministic. Indicator mathematics belongs to the caller, not Luc UI. */
const rows = marketSeries({ days: 540, seed: 20261115 });
const candles = candlesFrom(rows);
const volume = volumeFrom(rows);
const overlays = [
  { id: "sma50", label: "SMA 50", data: overlayFrom(rows, "sma50"), tone: "info" as const },
  { id: "sma200", label: "SMA 200", data: overlayFrom(rows, "sma200"), tone: "neutral" as const },
];
const close = rows.map((row) => ({ time: row.time, close: row.close }));
const comparison = rows.map((row) => ({ time: row.time, close: row.sma50 }));
const closeLine: PriceSeriesData = { id: "btc", label: "Close", kind: "line", data: close, tone: "accent" };
const priceArea: PriceSeriesData = { ...closeLine, kind: "area" };
const benchmark: PriceSeriesData = { id: "benchmark", label: "Prepared benchmark", kind: "line", data: comparison, tone: "warning" };
const volatility: IndicatorPane = {
  id: "volatility", label: "Prepared volatility", stretch: 1, referenceLines: [20],
  series: [{ id: "rv", label: "RV 30d", kind: "line", tone: "warning", data: overlayFrom(rows, "rv30") }],
};
/**
 * A genuine 30-day rolling Sharpe calculated only for the fixed Showcase fixture.
 * The reusable Luc UI chart takes already-computed values; it performs no statistics.
 * Risk-free rate is explicitly 0 for this synthetic demonstration, annualized by 252.
 */
const rollingSharpe = rows.map((row, index) => {
  if (index < 30) return { time: row.time, value: null };
  const returns = Array.from({ length: 30 }, (_, offset) => {
    const j = index - 29 + offset;
    return Math.log(rows[j]!.close / rows[j - 1]!.close);
  });
  const mean = returns.reduce((a, b) => a + b, 0) / 30;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 29;
  return {
    time: row.time,
    value: variance > 0 ? Number(((mean / Math.sqrt(variance)) * Math.sqrt(252)).toFixed(3)) : null,
  };
});

const sharpe: IndicatorPane = {
  id: "sharpe", label: "Prepared rolling Sharpe (30d; rf = 0)", stretch: 1, referenceLines: [-1, 0, 1],
  series: [{
    id: "rolling", label: "Rolling Sharpe (synthetic)", kind: "line", tone: "neutral",
    data: rollingSharpe,
  }],
};

const ranges = ["1m", "3m", "6m", "1y", "all"];
const days: Record<string, number> = { "1m": 30, "3m": 91, "6m": 182, "1y": 365, all: rows.length };
function visibleRange(range: string) {
  const count = Math.min(rows.length, days[range] ?? rows.length);
  if (count === rows.length) return null;
  return { from: rows[rows.length - count]!.time.getTime(), to: rows[rows.length - 1]!.time.getTime() };
}

export function LightweightLiveExample({ example }: { example: LightweightExampleId }) {
  const { tcs } = useI18n();
  const controller = useRef<FinancialChartController | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicator, setShowIndicator] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showLastPrice, setShowLastPrice] = useState(true);
  const [mocha, setMocha] = useState(false);
  const preparedSeries = useMemo<readonly PriceSeriesData[]>(() => {
    if (example === "area") return [priceArea];
    if (example === "comparison" || example === "sharpe") return [closeLine, benchmark];
    return [closeLine];
  }, [example]);

  const candlesMode = example === "candles" || example === "panes";
  const pane = example === "panes" ? volatility : example === "sharpe" ? sharpe : null;
  const title = tcs({
    candles: "Candlestick & Volume",
    line: "Close Line",
    area: "Price Area",
    comparison: "Multi-series Comparison",
    panes: "Multi-pane Indicators",
    sharpe: "Rolling Sharpe Research",
  }[example]);

  return (
    <div data-qa={`lightweight-${example}`}>
      <ChartPanel
        title={title}
        description={tcs("Synthetic, prepared fixture. Change the controls, inspect the crosshair, zoom and pan the real Lightweight Charts canvas.")}
        ranges={ranges}
        defaultRange="6m"
        scale={{ allowed: ["linear", "log"], default: "linear" }}
        height="clamp(340px, 55vw, 510px)"
        actions={
          <>
            {candlesMode ? (
              <Toggle size="sm" label="Toggle volume" pressed={showVolume} onPressedChange={setShowVolume}>Volume</Toggle>
            ) : null}
            {candlesMode ? (
              <Toggle size="sm" label="Toggle SMA" pressed={showOverlay} onPressedChange={setShowOverlay}>SMA</Toggle>
            ) : null}
            {pane ? (
              <Toggle size="sm" label="Toggle indicator pane" pressed={showIndicator} onPressedChange={setShowIndicator}>Indicator</Toggle>
            ) : null}
            <Toggle size="sm" label="Toggle last price" pressed={showLastPrice} onPressedChange={setShowLastPrice}>Last price</Toggle>
            <Toggle size="sm" label="Toggle Mocha theme" pressed={mocha} onPressedChange={setMocha}>Mocha</Toggle>
            <ChartResetButton label="Reset viewport" onReset={() => controller.current?.fit()} />
          </>
        }
        render={({ range, height, scaleMode }) => {
          const props = {
            height,
            priceFormat: { kind: "currency" as const, currency: "USD", decimals: 2 },
            priceScale: { mode: scaleMode },
            range: visibleRange(range),
            showPriceLine: showLastPrice,
            showLegend: true,
            themeOverride: mocha ? catppuccinMochaChartTheme : undefined,
            indicators: pane && showIndicator ? [pane] : undefined,
            onControllerReady: (next: FinancialChartController) => { controller.current = next; },
            ariaLabel: title,
          };
          if (candlesMode) {
            return <FinancialChart {...props} candles={candles} volume={showVolume ? volume : undefined}
              overlays={showOverlay ? overlays : undefined} showVolume={showVolume} />;
          }
          return <FinancialChart {...props} series={preparedSeries} />;
        }}
      />
    </div>
  );
}
