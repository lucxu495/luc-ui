"use client";

import { Code, Section, Text } from "@luc/ui";
import {
  TradingViewSingleTicker,
  TradingViewTickerTag,
  TradingViewTickerTape,
  TradingViewTickers,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

const TAPE = ["FOREXCOM:SPXUSD", "NASDAQ:AAPL", "NASDAQ:NVDA", "BITSTAMP:BTCUSD", "FX:EURUSD", "CMCMARKETS:GOLD"];

export default function TradingViewTickersPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Tickers")}
        title="Quotes in a strip, a chip or a card"
        lead="Four ticker widgets for four different shapes of space. All four are Web Components, so they inherit LUC's colours and font through the provider's documented token bridge."
      />

      <Section
        title={tcs("Ticker Tape")}
        description={tcs("The strip. A horizontal tape defines its own height, so the box only needs to be wide enough.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("ticker-tape")!}>
          <TradingViewTickerTape symbols={TAPE} direction="horizontal" height={104} />
        </TradingViewTile>
        <TradingViewTile
          definition={tradingViewWidgetById("ticker-tape")!}
          useCase={tcs("Vertical, with hover charts and compact items.")}
        >
          <TradingViewTickerTape
            symbols={TAPE}
            direction="vertical"
            itemSize="compact"
            showHover
            hoverType="chart"
            height={400}
          />
        </TradingViewTile>
      </Section>

      <Section
        title={tcs("Tickers")}
        description={tcs("The same strip with price, change and an optional inline chart; hideChart turns it into a compact quote list.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("tickers")!} useCase={tcs("Horizontal, no chart.")}>
            <TradingViewTickers symbols={TAPE} hideChart direction="horizontal" height={140} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("tickers")!} useCase={tcs("Vertical with inline charts.")}>
            <TradingViewTickers symbols={TAPE.slice(0, 4)} direction="vertical" height={400} />
          </TradingViewTile>
        </div>
      </Section>

      <Section title={tcs("Single Ticker")} description={tcs("One instrument: name, price and change.")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {([
            ["NASDAQ:AAPL", "Apple"],
            ["BINANCE:BTCUSDT", "Bitcoin"],
            ["TVC:GOLD", "Gold"],
          ] as const).map(([symbol, label]) => (
            <TradingViewTile key={symbol} definition={tradingViewWidgetById("single-ticker")!} useCase={label}>
              <TradingViewSingleTicker symbol={symbol} height={114} />
            </TradingViewTile>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("Ticker Tag")}
        description={tcs("The inline chip. It composes inside a sentence, a table cell or a metadata row without breaking the line box.")}
      >
        <TradingViewTile
          definition={tradingViewWidgetById("ticker-tag")!}
          useCase={tcs("Inline in prose, with and without a background.")}
        >
          <div className="flex flex-wrap items-center gap-2 text-body text-fg-secondary">
            <span>{tcs("Reported revenue grew while")}</span>
            <TradingViewTickerTag symbol="NASDAQ:AAPL" size="small" />
            <span>{tcs("held its margin, and")}</span>
            <TradingViewTickerTag symbol="BINANCE:BTCUSDT" size="medium" hideBackground />
            <span>{tcs("traded through the range.")}</span>
          </div>
        </TradingViewTile>
        <Text variant="caption" tone="muted" as="p">
          <Code>preserveText</Code> {tcs("uses your own words as the label; the provider still owns the price and the link.")}</Text>
      </Section>
    </DocPage>
  );
}
