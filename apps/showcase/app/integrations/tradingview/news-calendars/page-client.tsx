"use client";
import type { ReactNode } from "react";

import { Code, Section, Text } from "@luc/ui";
import {
  TradingViewEconomicCalendar,
  TradingViewEconomicMap,
  TradingViewTopStories,
  tradingViewWidgetById,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { IntegrationNotes } from "@/components/docs/integration-notes";
import { PageHeader } from "@/components/docs/page-header";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

export default function TradingViewNewsCalendarsPage({ api }: { api?: ReactNode }) {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView · News, calendars, economics")}
        title="Context around the price"
        lead="News, macro events and a world macro map. None of this content passes through LUC: the provider owns the feed, the calendar and the indicator data, and the wrapper only decides where it goes."
      />

      <Section title={tcs("Top Stories")} description={tcs("The provider's market news timeline.")}>
        <TradingViewTile definition={tradingViewWidgetById("top-stories")!}>
          <TradingViewTopStories height={620} />
        </TradingViewTile>
        <Text variant="caption" tone="muted" as="p">
          <Code>feedMode=&quot;symbol&quot;</Code> with a <Code>symbol</Code> {tcs("follows one instrument instead of all markets. LUC does not parse, store or re-render the stories.")}</Text>
      </Section>

      <Section
        title={tcs("Economic Calendar")}
        description={tcs("Named for the provider on purpose: this is not Luc UI's Calendar component, and the two must never be confused.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("economic-calendar")!} useCase={tcs("All importance levels, worldwide.")}>
          <TradingViewEconomicCalendar height={620} />
        </TradingViewTile>
        <TradingViewTile
          definition={tradingViewWidgetById("economic-calendar")!}
          useCase={tcs("High-importance events for the US, EU and UK.")}
        >
          <TradingViewEconomicCalendar importanceFilter="1" countryFilter="us,eu,gb" height={520} />
        </TradingViewTile>
      </Section>

      <Section title={tcs("Economic Map")} description={tcs("A world map of one macro indicator, by region.")}>
        <TradingViewTile definition={tradingViewWidgetById("economic-map")!}>
          <TradingViewEconomicMap metric="gdp" height={475} />
        </TradingViewTile>
        <div className="grid gap-4 lg:grid-cols-2">
          <TradingViewTile definition={tradingViewWidgetById("economic-map")!} useCase={tcs("Inflation rate (iryy).")}>
            <TradingViewEconomicMap region="global" metric="iryy" hideLegend height={420} />
          </TradingViewTile>
          <TradingViewTile definition={tradingViewWidgetById("economic-map")!} useCase={tcs("Unemployment rate (ur), Europe.")}>
            <TradingViewEconomicMap region="europe" metric="ur" hideLegend height={420} />
          </TradingViewTile>
        </div>
      </Section>

      <Section title={tcs("Reuse note")} description={tcs("These four widgets are the cheapest way to give a research page macro context.")}>
        <Text variant="caption" tone="muted" as="p">
          {tcs("They are also the ones most likely to be reused across products: none of them depends on Luc UI's own data, and none of them needs a backend to be useful.")}</Text>
      </Section>

      <IntegrationNotes entryId="tradingview-news-calendars" />
      {api}
    </DocPage>
  );
}
