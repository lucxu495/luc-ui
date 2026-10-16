"use client";

import { Code, Section, Text } from "@luc/ui";
import {
  TradingViewCryptoHeatmap,
  TradingViewEtfHeatmap,
  TradingViewForexTable,
  TradingViewStockHeatmap,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

export default function TradingViewHeatmapsPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Heatmaps")}
        title="Where the colour is the data"
        lead="Heatmaps are the one family LUC deliberately does not restyle: red and green mean performance, and repainting them with LUC accents would destroy the meaning. Only the surrounding chrome is themed."
      />

      <Section title={tcs("Stock Heatmap")} description={tcs("S&P 500 constituents sized by market cap and coloured by change.")}>
        <TradingViewTile definition={tradingViewWidgetById("stock-heatmap")!}>
          <TradingViewStockHeatmap height={590} />
        </TradingViewTile>
        <Text variant="caption" tone="muted" as="p">
          <Code>blockSize</Code> {tcs("switches between market cap and volume;")}{" "}<Code>blockColor</Code> {tcs("between daily change and period performance.")}</Text>
      </Section>

      <Section title={tcs("Crypto Coins Heatmap")} description={tcs("Sized by market cap, coloured by change.")}>
        <TradingViewTile definition={tradingViewWidgetById("crypto-heatmap")!}>
          <TradingViewCryptoHeatmap height={590} />
        </TradingViewTile>
      </Section>

      <Section title={tcs("ETF Heatmap")} description={tcs("US ETFs grouped by asset class.")}>
        <TradingViewTile definition={tradingViewWidgetById("etf-heatmap")!}>
          <TradingViewEtfHeatmap height={540} />
        </TradingViewTile>
      </Section>

      <Section
        title={tcs("Forex Table")}
        description={tcs("A Web Component — the one heatmap family that is not an iframe, so it inherits LUC's tokens.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("forex-table")!} useCase={tcs("Cross rates.")}>
            <TradingViewForexTable displayedValue="rate" height={400} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("forex-table")!} useCase={tcs("Daily change, heat-coloured.")}>
            <TradingViewForexTable
              currencies={["EUR", "USD", "GBP", "JPY", "CHF", "AUD"]}
              displayedValue="dailyChange"
              heatmap
              height={400}
            />
          </TradingViewTile>
        </div>
      </Section>
    </DocPage>
  );
}
