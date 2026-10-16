"use client";

import { Code, Section, Text } from "@luc/ui";
import {
  TradingViewAdvancedChart,
  TradingViewMiniChart,
  TradingViewSeasonalChart,
  TradingViewSymbolOverview,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

export default function TradingViewChartsPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Charts")}
        title="Provider charts"
        lead="Four chart widgets, from a sparkline in a card to the full TradingView terminal. Use them when a standard market chart is enough — LUC's own engines take over the moment the data, the overlays or the interaction has to be yours."
      />

      <Section
        title={tcs("Advanced Chart")}
        description={tcs("The full provider chart. iframe format, so the chart, its toolbars and its attribution are TradingView's own.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("advanced-chart")!}>
          <TradingViewAdvancedChart symbol="BINANCE:BTCUSDT" preset="standard" height={560} />
        </TradingViewTile>
        <div className="grid gap-4 md:grid-cols-2">
          <TradingViewTile
            definition={tradingViewWidgetById("advanced-chart")!}
            useCase={tcs("preset=\"minimal\" — candles and volume, no toolbar. The reading view.")}
          >
            <TradingViewAdvancedChart symbol="NASDAQ:AAPL" preset="minimal" height={420} />
          </TradingViewTile>
          <TradingViewTile
            definition={tradingViewWidgetById("advanced-chart")!}
            useCase={
              <>
                {tcs("preset=\"analysis\" — drawing tools, details and date ranges on the")}{" "}<Code>TVC:USOIL</Code>{" "}
                contract.
              </>
            }
          >
            <TradingViewAdvancedChart symbol="TVC:USOIL" preset="analysis" height={420} />
          </TradingViewTile>
        </div>
      </Section>

      <Section
        title={tcs("Mini Chart")}
        description={tcs("The card-sized chart. Web Component format, so it follows LUC's tokens directly.")}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["NASDAQ:AAPL", "Apple"],
            ["BINANCE:BTCUSDT", "Bitcoin"],
            ["FX:EURUSD", "EUR/USD"],
          ] as const).map(([symbol, label]) => (
            <TradingViewTile key={symbol} definition={tradingViewWidgetById("mini-chart")!} useCase={label}>
              <TradingViewMiniChart symbol={symbol} height={180} />
            </TradingViewTile>
          ))}
        </div>
        <Text variant="caption" tone="muted" as="p">
          <Code>chartOnly</Code> {tcs("drops the header for a pure sparkline;")}{" "}<Code>lineChartType</Code> {tcs("switches between area, line and baseline.")}</Text>
      </Section>

      <Section
        title={tcs("Symbol Overview")}
        description={tcs("A compact multi-symbol chart with ranges and overlays. One iframe draws all three series and links each one in its attribution line.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("symbol-overview")!}>
          <TradingViewSymbolOverview
            symbols={[
              { title: "Apple", symbol: "AAPL|1D" },
              { title: "Microsoft", symbol: "MSFT|1D" },
              { title: "Nvidia", symbol: "NVDA|1D" },
            ]}
            showVolume
            height={420}
          />
        </TradingViewTile>
      </Section>

      <Section
        title={tcs("Seasonal Chart")}
        description={tcs("Multi-year seasonal pattern. A research-shaped view the provider already computes.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("seasonal-chart")!}>
          <TradingViewSeasonalChart symbol="NASDAQ:AAPL" showAverage height={400} />
        </TradingViewTile>
      </Section>
    </DocPage>
  );
}
