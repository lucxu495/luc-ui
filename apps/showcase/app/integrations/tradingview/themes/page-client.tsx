"use client";
import type { ReactNode } from "react";

import { Code, Section, Switch, Text } from "@luc/ui";
import {
  useTheme } from "@luc/ui";
import {
  TradingViewAdvancedChart,
  TradingViewMarketData,
  TradingViewMiniChart,
  TradingViewTickerTape,
  TRADINGVIEW_TOKEN_BRIDGE,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { IntegrationNotes } from "@/components/docs/integration-notes";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

const BRIDGE_SNIPPET = Object.entries(TRADINGVIEW_TOKEN_BRIDGE)
  .map(([token, value]) => `${token}: ${value};`)
  .join("\n");

export default function TradingViewThemesPage({ api }: { api?: ReactNode }) {
  const { tcs } = useI18n();
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · Themes")}
        title="Two depths of theming"
        lead="Web Components take LUC's tokens through the provider's published CSS custom properties. iframe widgets take the provider's own theme configuration and nothing else. Switch the theme and watch which parts move."
        actions={
          <Switch
            checked={resolvedTheme === "dark"}
            onCheckedChange={() => toggleTheme()}
            /* Not "dark theme": that name collides with the shell's own theme
               control, and two controls with one name is an a11y bug. */
            aria-label={tcs("Compare themes")}
          />
        }
      />

      <Section
        title={tcs("Web Component: tokens")}
        description={tcs("One mapping, applied by every Web Component wrapper.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("mini-chart")!} useCase={tcs("Follows LUC's surface, text and font tokens.")}>
          <TradingViewMiniChart symbol="NASDAQ:AAPL" height={180} />
        </TradingViewTile>
        <TradingViewTile definition={tradingViewWidgetById("market-data")!} useCase={tcs("Same bridge, a denser widget.")}>
          <TradingViewMarketData view="overview" height={300} />
        </TradingViewTile>
        <Code block>{BRIDGE_SNIPPET}</Code>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Only tokens with a clear semantic counterpart are mapped. The provider keeps its own market-status chips and its up/down area fills, and LUC does not guess at internal selectors: the shadow root is closed, and")}{" "}
          <Code>::part()</Code> {tcs("is used only where a widget documents one.")}</Text>
      </Section>

      <Section
        title={tcs("iframe: provider configuration")}
        description={tcs("The chart below is the same widget in a separate document. It matches the theme; it does not inherit LUC's colours.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("advanced-chart")!} useCase={tcs("Provider theme, LUC surface colours passed through the provider's own keys.")}>
          <TradingViewAdvancedChart symbol="BINANCE:BTCUSDT" preset="minimal" height={420} />
        </TradingViewTile>
        <Text variant="caption" tone="muted" as="p">
          The wrapper passes <Code>theme</Code>, <Code>backgroundColor</Code> and <Code>gridColor</Code> {tcs("resolved from LUC tokens, so the chart's surface matches the card it sits in. Everything inside — axis labels, crosshair, toolbar, dialogs — is the provider's. That limit is the honest boundary of iframe theming, not a bug to paper over.")}</Text>
      </Section>

      <Section
        title={tcs("Transparency")}
        description={tcs("Both formats expose an official transparent option. LUC defaults to opaque.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("ticker-tape")!} useCase={tcs("Opaque (default).")}>
            <TradingViewTickerTape symbols={["NASDAQ:AAPL", "BINANCE:BTCUSDT", "FX:EURUSD"]} height={104} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("ticker-tape")!} useCase={tcs("transparent on a LUC surface.")}>
            <div className="rounded-lg bg-surface-sunken p-2">
              <TradingViewTickerTape symbols={["NASDAQ:AAPL", "BINANCE:BTCUSDT", "FX:EURUSD"]} transparent height={104} />
            </div>
          </TradingViewTile>
        </div>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Dense financial content is more readable on an opaque surface, which is why opaque is the default. Transparency is available where a widget needs to sit directly on a LUC panel.")}</Text>
      </Section>

      <Section
        title={tcs("Theme changes are live")}
        description={tcs("Flip the switch at the top of this page.")}
      >
        <Text variant="caption" tone="muted" as="p">
          {tcs("Web Components follow the attribute update immediately. iframe widgets are re-created with the new configuration — the wrapper removes the previous embed first, so a theme change can never leave two widgets stacked.")}</Text>
      </Section>

      <IntegrationNotes entryId="tradingview-themes" />
      {api}
    </DocPage>
  );
}
