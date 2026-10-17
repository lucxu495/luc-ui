"use client";
import type { ReactNode } from "react";

import { Code, Section, Text } from "@luc/ui";
import {
  TradingViewMarketData,
  TradingViewMarketOverview,
  TradingViewMarketSummary,
  TradingViewWorldMarketSummary,
  TRADINGVIEW_DEFAULT_SECTORS,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { IntegrationNotes } from "@/components/docs/integration-notes";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

const SECTORS = [
  { sectionName: "Indices", symbols: ["FOREXCOM:SPXUSD", "FOREXCOM:NSXUSD", "FOREXCOM:DJI", "INDEX:NKY"] },
  { sectionName: "FX", symbols: ["FX:EURUSD", "FX:GBPUSD", "FX:USDJPY"] },
  { sectionName: "Crypto", symbols: ["BITSTAMP:BTCUSD", "BITSTAMP:ETHUSD"] },
];

export default function TradingViewWatchlistsPage({ api }: { api?: ReactNode }) {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Watchlists")}
        title="Market sections"
        lead="Watchlist widgets put a market overview in a panel: indices, FX, crypto and single names, with the provider's own session status and change calculations."
      />

      <Section
        title={tcs("Market Summary")}
        description={tcs("A dense market row — provider movers by default, or your own symbol groups.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile
            definition={tradingViewWidgetById("market-summary")!}
            useCase={tcs("Provider market movers, horizontal flow layout.")}
          >
            <TradingViewMarketSummary mode="market-movers" assetsType="stocks" height={220} />
          </TradingViewTile>
          <TradingViewTile
            definition={tradingViewWidgetById("market-summary")!}
            useCase={tcs("Your own sectors, grid layout, compact items.")}
          >
            <TradingViewMarketSummary
              mode="custom"
              symbolSectors={SECTORS}
              layoutMode="grid"
              itemSize="compact"
              height={220}
            />
          </TradingViewTile>
        </div>
      </Section>

      <Section title={tcs("Market Overview")} description={tcs("A market sidebar with a chart for the selected instrument.")}>
        <TradingViewTile definition={tradingViewWidgetById("market-overview")!}>
          <TradingViewMarketOverview symbolSectors={TRADINGVIEW_DEFAULT_SECTORS} height={550} />
        </TradingViewTile>
      </Section>

      <Section title={tcs("Market Data")} description={tcs("Global sections as a table, or as a performance heatmap.")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("market-data")!} useCase={tcs("Overview view.")}>
            <TradingViewMarketData symbolSectors={SECTORS} view="overview" height={340} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("market-data")!} useCase={tcs("Performance view with heatmap colouring.")}>
            <TradingViewMarketData symbolSectors={SECTORS} view="performance" heatmap height={340} />
          </TradingViewTile>
        </div>
      </Section>

      <Section title={tcs("World Market Summary")} description={tcs("Country-level equity performance as a map or a list.")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("world-market-summary")!} useCase={tcs("Map view.")}>
            <TradingViewWorldMarketSummary view="map" height={520} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("world-market-summary")!} useCase={tcs("List view, sorted by performance.")}>
            <TradingViewWorldMarketSummary view="list" sort="performance" height={520} />
          </TradingViewTile>
        </div>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Sector attributes are JSON on the element, exactly as the provider's own snippet writes them. LUC's typed props serialise to that form, so a pasted provider snippet and a LUC component produce the same markup.")}{" "}
          <Code>{'symbol-sectors="[…]"'}</Code>
        </Text>
      </Section>

      <IntegrationNotes entryId="tradingview-watchlists" />
      {api}
    </DocPage>
  );
}
