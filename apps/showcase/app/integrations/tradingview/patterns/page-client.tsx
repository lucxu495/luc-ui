"use client";
import type { ReactNode } from "react";

import { Card, Code, SegmentedControl, SegmentedItem, Section, Text } from "@luc/ui";
import { useState } from "react";
import {
  TradingViewAdvancedChart,
  TradingViewCryptoHeatmap,
  TradingViewCryptocurrencyMarket,
  TradingViewEconomicCalendar,
  TradingViewEconomicMap,
  TradingViewFundamentalData,
  TradingViewMarketOverview,
  TradingViewSingleTicker,
  TradingViewStockHeatmap,
  TradingViewSymbolInfo,
  TradingViewTechnicalAnalysis,
  TradingViewTopStories,
  TradingViewWorldMarketSummary,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { IntegrationNotes } from "@/components/docs/integration-notes";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

const INSTRUMENTS = [
  { id: "NASDAQ:AAPL", label: "Apple" },
  { id: "NASDAQ:NVDA", label: "Nvidia" },
  { id: "BINANCE:BTCUSDT", label: "Bitcoin" },
] as const;

export default function TradingViewPatternsPage({ api }: { api?: ReactNode }) {
  const { tcs } = useI18n();
  const [symbol, setSymbol] = useState<string>(INSTRUMENTS[0].id);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Patterns")}
        title="Composed market pages"
        lead="Three compositions that combine provider widgets into a page. The point is not the widgets — it is that the consumer owns the state that ties them together, not the provider."
      />

      <Section
        title={tcs("Instrument detail")}
        description={tcs("One selector drives four widgets. The selected symbol is React state in this page — @luc/ui ships no global symbol store, and no widget writes to it.")}
      >
        <SegmentedControl value={symbol} onValueChange={(next) => next && setSymbol(next)} aria-label="Instrument">
          {INSTRUMENTS.map((instrument) => (
            <SegmentedItem key={instrument.id} value={instrument.id}>
              {instrument.label}
            </SegmentedItem>
          ))}
        </SegmentedControl>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <TradingViewTile definition={tradingViewWidgetById("advanced-chart")!} useCase={tcs("The price.")}>
            <TradingViewAdvancedChart symbol={symbol} preset="standard" height={520} />
          </TradingViewTile>
          <div className="flex flex-col gap-4">
            <TradingViewTile definition={tradingViewWidgetById("single-ticker")!} useCase={tcs("The quote.")}>
              <TradingViewSingleTicker symbol={symbol} height={114} />
            </TradingViewTile>
            <TradingViewTile definition={tradingViewWidgetById("technical-analysis")!} useCase={tcs("The provider's read.")}>
              <TradingViewTechnicalAnalysis symbol={symbol} height={340} />
            </TradingViewTile>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("symbol-info")!} useCase={tcs("The facts.")}>
            <TradingViewSymbolInfo symbol={symbol} height={282} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("top-stories")!} useCase={tcs("The context.")}>
            <TradingViewTopStories feedMode="symbol" symbol={symbol} height={282} />
          </TradingViewTile>
        </div>
        <Text variant="caption" tone="muted" as="p">
          {tcs("A fourth widget could sit under the chart —")}{" "}<Code>fundamental-data</Code> {tcs("— at the cost of another iframe. The pattern is deliberately bounded: four to six embeds per page is a page; twelve is a network incident.")}</Text>
      </Section>

      <Section
        title={tcs("Crypto desk")}
        description={tcs("A market-level composition: no single symbol, but the whole asset class.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("crypto-heatmap")!} useCase={tcs("The map.")}>
            <TradingViewCryptoHeatmap height={520} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("crypto-mkt-screener")!} useCase={tcs("The table.")}>
            <TradingViewCryptocurrencyMarket height={520} />
          </TradingViewTile>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("advanced-chart")!} useCase={tcs("BTC/USDT.")}>
            <TradingViewAdvancedChart symbol="BINANCE:BTCUSDT" preset="minimal" height={420} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("top-stories")!} useCase={tcs("Feed.")}>
            <TradingViewTopStories displayMode="compact" height={420} />
          </TradingViewTile>
        </div>
      </Section>

      <Section
        title={tcs("Macro panel")}
        description={tcs("World equity performance, macro events and indicators — four widgets that would otherwise each need a data pipeline.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("world-market-summary")!} useCase={tcs("Country performance.")}>
            <TradingViewWorldMarketSummary view="map" height={480} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("economic-map")!} useCase={tcs("One indicator, worldwide.")}>
            <TradingViewEconomicMap metric="gdp" height={480} />
          </TradingViewTile>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("economic-calendar")!} useCase={tcs("What is coming.")}>
            <TradingViewEconomicCalendar importanceFilter="1" height={560} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("market-overview")!} useCase={tcs("What is trading.")}>
            <TradingViewMarketOverview mode="market-movers" assetsType="stocks" height={560} />
          </TradingViewTile>
        </div>
      </Section>

      <Section
        title={tcs("Mixing lanes on one page")}
        description={tcs("A provider chart and a LUC table inside the same LUC card.")}
      >
        <Card variant="outline" className="gap-4 p-4">
          <Text variant="label" as="p">
            {tcs("Provider chart, LUC frame")}</Text>
          <div className="grid gap-4 lg:grid-cols-2">
            <TradingViewStockHeatmap height={420} />
            <TradingViewFundamentalData symbol="NASDAQ:AAPL" height={420} />
          </div>
          <Text variant="caption" tone="muted" as="p">
            {tcs("Both are iframes, so both keep their own typography and their own attribution line. The LUC card supplies the surface, the spacing and the grid; the provider supplies the content. That is the whole contract.")}</Text>
        </Card>
      </Section>

      <IntegrationNotes entryId="tradingview-patterns" />
      {api}
    </DocPage>
  );
}
