"use client";

import { Section, Text } from "@luc/ui";
import {
  TradingViewCompanyProfile,
  TradingViewFundamentalData,
  TradingViewSymbolInfo,
  TradingViewTechnicalAnalysis,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

const SYMBOL = "NASDAQ:AAPL";

export default function TradingViewSymbolDetailsPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Symbol details")}
        title="One instrument, four depths"
        lead="Facts, provider-computed ratings, fundamentals and the company profile. LUC computes none of these values and stores none of them — they are TradingView's data, shown in LUC's layout."
      />

      <Section title={tcs("Symbol Info")} description={tcs("Price, ranges, market cap and valuation ratios.")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("symbol-info")!} useCase={tcs("Apple")}>
            <TradingViewSymbolInfo symbol={SYMBOL} height={282} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("symbol-info")!} useCase={tcs("Bitcoin")}>
            <TradingViewSymbolInfo symbol="BINANCE:BTCUSDT" height={282} />
          </TradingViewTile>
        </div>
      </Section>

      <Section
        title={tcs("Technical Analysis")}
        description={tcs("A Web Component with an interval selector and an optional score breakdown.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("technical-analysis")!} useCase={tcs("Gauge, single summary.")}>
            <TradingViewTechnicalAnalysis symbol={SYMBOL} height={340} />
          </TradingViewTile>
          <TradingViewTile
            definition={tradingViewWidgetById("technical-analysis")!}
            useCase={tcs("Gauge and breakdown at a daily interval.")}
          >
            <TradingViewTechnicalAnalysis symbol={SYMBOL} interval="1D" ratingsDisplayMode="gauge-and-breakdown" height={425} />
          </TradingViewTile>
        </div>
      </Section>

      <Section title={tcs("Fundamental Data")} description={tcs("Statements and ratios for one listed instrument.")}>
        <TradingViewTile definition={tradingViewWidgetById("fundamental-data")!}>
          <TradingViewFundamentalData symbol={SYMBOL} height={620} />
        </TradingViewTile>
      </Section>

      <Section title={tcs("Company Profile")} description={tcs("What the company does, and where it sits.")}>
        <TradingViewTile definition={tradingViewWidgetById("company-profile")!}>
          <TradingViewCompanyProfile symbol={SYMBOL} height={530} />
        </TradingViewTile>
        <Text variant="caption" tone="muted" as="p">
          {tcs("A company profile is listed-instrument content: pass a crypto or FX symbol and the provider decides what it can say about it.")}</Text>
      </Section>
    </DocPage>
  );
}
