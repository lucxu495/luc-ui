"use client";

import { Section, Text } from "@luc/ui";
import {
  TradingViewCryptocurrencyMarket,
  TradingViewScreener,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

export default function TradingViewScreenersPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Screeners")}
        title="Filterable markets"
        lead="A screener is a table with the provider's own columns, presets and filters. LUC gives it a bounded box and a theme; the filtering, the columns and the data stay TradingView's."
      />

      <Section title={tcs("Screener")} description={tcs("One widget, many markets — the market prop selects the universe.")}>
        <TradingViewTile definition={tradingViewWidgetById("screener")!} useCase={tcs("US equities.")}>
          <TradingViewScreener market="america" defaultColumn="overview" height={560} />
        </TradingViewTile>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("screener")!} useCase={tcs("FX.")}>
            <TradingViewScreener market="forex" height={520} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("screener")!} useCase={tcs("Crypto pairs.")}>
            <TradingViewScreener market="crypto" height={520} />
          </TradingViewTile>
        </div>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Constrained heights scroll inside the widget, not inside the page: give a screener a bounded box rather than letting it grow with its row count.")}</Text>
      </Section>

      <Section
        title={tcs("Cryptocurrency Market")}
        description={tcs("The crypto table on its own: price, market cap, volume and change.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("crypto-mkt-screener")!}>
          <TradingViewCryptocurrencyMarket displayCurrency="USD" height={520} />
        </TradingViewTile>
      </Section>
    </DocPage>
  );
}
