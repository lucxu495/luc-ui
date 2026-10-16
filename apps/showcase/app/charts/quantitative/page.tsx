"use client";

import {
  CandlestickChart,
  DrawdownChart,
  EfficientFrontierChart,
  FactorExposureChart,
  PnlAttributionChart,
  Section,
  VolatilitySmileChart,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import {
  candleOverlays,
  candles,
  drawdownPoints,
  factorExposures,
  frontierAssets,
  frontierCurve,
  pnlPeriods,
  pnlSeries,
  volatilitySlices,
} from "@/lib/chart-packs-data";
import { useI18n } from "@/lib/i18n/provider";


export default function QuantitativeChartsPage() {
  const { tc, tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader eyebrow={tcs("Charts")} title="Quantitative charts" lead={tc("charts.quantitative.lead")} />

      <Section title={tc("charts.quantitative.price.title")} description={tc("charts.quantitative.price.lead")}>
        <ChartPanel
          title={tcs("Candlestick")}
          description={tc("charts.quantitative.candles")}
          height={360}
          series={[
            { id: "MA 20", label: "MA 20", tone: "accent" },
            { id: "MA 50", label: "MA 50", tone: "info" },
          ]}
          render={({ height, visibleSeries }) => (
            <CandlestickChart
              height={height}
              ariaLabel={tcs("Synthetic daily candles with two overlays")}
              candles={candles}
              overlays={candleOverlays.filter((overlay) => !visibleSeries || visibleSeries.includes(overlay.label))}
              priceFormat={{ kind: "number", decimals: 2 }}
            />
          )}
        />
        <div className="mt-5">
          <ChartPanel
            title={tcs("Drawdown")}
            description={tc("charts.quantitative.drawdown")}
            height={300}
            render={({ height }) => (
              <DrawdownChart height={height} ariaLabel={tcs("Drawdown from running peak")} points={drawdownPoints} />
            )}
          />
        </div>
      </Section>

      <Section title={tc("charts.quantitative.surface.title")} description={tc("charts.quantitative.surface.lead")}>
        <ChartPanel
          title={tcs("Volatility smile")}
          description={tc("charts.quantitative.smile")}
          height={340}
          render={({ height }) => (
            <VolatilitySmileChart
              height={height}
              ariaLabel={tcs("Implied volatility against strike by expiry")}
              slices={volatilitySlices}
              strikeFormat={{ kind: "number", decimals: 0 }}
              volFormat={{ kind: "number", decimals: 1, suffix: "%" }}
            />
          )}
        />
      </Section>

      <Section title={tc("charts.quantitative.portfolio.title")} description={tc("charts.quantitative.portfolio.lead")}>
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartPanel
            title={tcs("Efficient frontier")}
            description={tc("charts.quantitative.frontier")}
            height={340}
            render={({ height }) => (
              <EfficientFrontierChart
                height={height}
                ariaLabel={tcs("Assets against a supplied efficient frontier")}
                assets={frontierAssets}
                frontier={frontierCurve}
                current={{ label: "Current portfolio", risk: 10, expectedReturn: 5.5 }}
                riskFormat={{ kind: "percent", decimals: 0 }}
                returnFormat={{ kind: "percent", decimals: 0 }}
              />
            )}
          />
          <ChartPanel
            title={tcs("Factor exposure")}
            description={tc("charts.quantitative.factors")}
            height={340}
            render={({ height }) => (
              <FactorExposureChart
                height={height}
                ariaLabel={tcs("Factor exposures of the current portfolio")}
                factors={factorExposures}
                format={{ kind: "number", decimals: 2, signed: true }}
              />
            )}
          />
        </div>
        <div className="mt-5">
          <ChartPanel
            title={tcs("P&L attribution")}
            description={tc("charts.quantitative.pnl")}
            height={340}
            render={({ height }) => (
              <PnlAttributionChart
                height={height}
                ariaLabel={tcs("Monthly contribution by source")}
                periods={pnlPeriods}
                series={pnlSeries}
                format={{ kind: "number", decimals: 0, suffix: " bps" }}
              />
            )}
          />
        </div>
      </Section>
    </DocPage>
  );
}
