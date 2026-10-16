"use client";

import { Badge, Code, Section, Text } from "@luc/ui";
import {
  TradingViewBrokerRating,
  TradingViewIframe,
  TradingViewWebComponent,
  TRADINGVIEW_CATALOG,
  TRADINGVIEW_LEGACY_EMBEDS,
  tradingViewWidgetById,
  type TradingViewWidgetDefinition,
} from "@luc/ui/tradingview";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { DataTable } from "@/components/docs/data-table";
import { TradingViewTile } from "@/components/integrations/tradingview-tile";
import { useI18n } from "@/lib/i18n/provider";

const MISSING_WEB_COMPONENT = {
  ...tradingViewWidgetById("mini-chart")!,
  id: "missing-web-component",
  element: "tv-luc-missing-widget",
  moduleUrl: "https://widgets.tradingview-widget.com/w/en/tv-luc-missing-widget.js",
} satisfies TradingViewWidgetDefinition;

const MISSING_IFRAME = {
  ...tradingViewWidgetById("symbol-info")!,
  id: "missing-iframe",
  scriptUrl: "https://s3.tradingview.com/external-embedding/embed-widget-luc-missing.js",
} satisfies TradingViewWidgetDefinition;

const LANES = [
  {
    lane: "TradingView widgets",
    data: "Provider market data",
    engine: "TradingView",
    use: "Standard market presentation: quotes, candlesticks, screeners, heatmaps, news, calendars.",
    avoid: "Do not use when the data must be yours, or when you need cross-engine sync or your own annotations.",
  },
  {
    lane: "LUC FinancialChart",
    data: "Your prepared OHLC",
    engine: "Lightweight Charts",
    use: "Your candles, overlays, panes and indicators, with LUC's theme, tooltips and accessible table fallback.",
    avoid: "Do not use to re-implement a generic market chart the provider already hosts well.",
  },
  {
    lane: "LUC research charts",
    data: "Your analytics",
    engine: "Apache ECharts",
    use: "Drawdown, regimes, distributions, correlations and anything LUC computes and has to explain.",
    avoid: "Do not use for live quotes. Nothing in the chart layer fetches.",
  },
];

const CSP_NOTE = `# domains the TradingView integrations require
script-src  https://s3.tradingview.com https://widgets.tradingview-widget.com https://www.tradingview-widget.com
frame-src   https://www.tradingview-widget.com https://s.tradingview.com
img-src     https://s3.tradingview.com https://www.tradingview.com https://*.tradingview.com blob:
connect-src https://widget-sheriff.tradingview-widget.com`;

export default function TradingViewOverviewPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Integrations · TradingView")}
        title="Provider market data, LUC-shaped"
        lead="TradingView embeds cover the market views a product should not rebuild: standard charts, quotes, screeners, heatmaps, news and macro calendars. They complement LUC's own chart engines rather than replacing them, and they stay provider data — LUC never reads a widget to get a number."
      />

      <Section
        title={tcs("Three lanes, one visual language")}
        description={tcs("A page can hold all three at once. They are different jobs, not competing implementations.")}
      >
        <DataTable
          caption={tcs("Which visualisation lane to use")}
          columns={[
            { key: "lane", header: "Lane", render: (row: (typeof LANES)[number]) => <span className="text-fg-primary">{row.lane}</span> },
            { key: "data", header: "Data", render: (row: (typeof LANES)[number]) => tcs(row.data) },
            { key: "engine", header: "Rendered by", render: (row: (typeof LANES)[number]) => <Code>{row.engine}</Code> },
            { key: "use", header: "Use it for", render: (row: (typeof LANES)[number]) => tcs(row.use) },
            { key: "avoid", header: "Not for", render: (row: (typeof LANES)[number]) => tcs(row.avoid) },
          ]}
          rows={LANES}
        />
      </Section>

      <Section
        title={tcs("Catalog")}
        description={tcs("Every current, officially documented widget, audited against TradingView's own directory. The registry below drives this table, the sidebar and the package exports.")}
      >
        <DataTable
          caption={tcs("TradingView widget catalog")}
          columns={[
            {
              key: "name",
              header: "Widget",
              render: (row: TradingViewWidgetDefinition) => (
                <span className="text-fg-primary">{row.name}</span>
              ),
            },
            { key: "category", header: "Category", render: (row: TradingViewWidgetDefinition) => row.category },
            {
              key: "format",
              header: "Format",
              render: (row: TradingViewWidgetDefinition) => (
                <Badge size="sm" tone={row.format === "web-component" ? "info" : "neutral"}>
                  {row.format === "web-component" ? "Web Component" : "iframe"}
                </Badge>
              ),
            },
            {
              key: "min",
              header: "Min size",
              render: (row: TradingViewWidgetDefinition) => `${row.minSize.width}×${row.minSize.height}`,
            },
            {
              key: "capabilities",
              header: "Theme / symbol / link",
              render: (row: TradingViewWidgetDefinition) =>
                [row.supports.theme && "theme", row.supports.symbol || row.supports.symbols, row.supports.symbolUrl && "symbol-url"]
                  .filter(Boolean)
                  .join(" · "),
            },
            {
              key: "docs",
              header: "Docs",
              render: (row: TradingViewWidgetDefinition) => (
                <a
                  href={row.docsUrl}
                  target="_blank"
                  rel="noopener nofollow"
                  className="luc-focus text-fg-accent underline-offset-4 hover:underline"
                >
                  Official page
                </a>
              ),
            },
          ]}
          rows={[...TRADINGVIEW_CATALOG]}
        />
        <Text variant="caption" tone="muted" as="p">
          {TRADINGVIEW_CATALOG.filter((widget) => widget.format === "web-component").length} Web Components and{" "}
          {TRADINGVIEW_CATALOG.filter((widget) => widget.format === "iframe").length} {tcs("iframe widgets. No legacy embed is wrapped: a canonical replacement always wins.")}</Text>
      </Section>

      <Section
        title={tcs("Legacy and replaced")}
        description={tcs("Recorded so nobody restores one of these by accident.")}
      >
        <DataTable
          caption={tcs("Legacy TradingView embeds")}
          columns={[
            { key: "script", header: "Embed script", render: (row: (typeof TRADINGVIEW_LEGACY_EMBEDS)[number]) => <Code>{row.script}</Code> },
            {
              key: "replacement",
              header: "Canonical replacement",
              render: (row: (typeof TRADINGVIEW_LEGACY_EMBEDS)[number]) => row.replacedBy,
            },
            {
              key: "status",
              header: "Still served",
              render: (row: (typeof TRADINGVIEW_LEGACY_EMBEDS)[number]) => (
                <Badge size="sm" tone={row.status === "served" ? "warning" : "outline"}>
                  {row.status}
                </Badge>
              ),
            },
            { key: "note", header: "Note", render: (row: (typeof TRADINGVIEW_LEGACY_EMBEDS)[number]) => tcs(row.note) },
          ]}
          rows={[...TRADINGVIEW_LEGACY_EMBEDS]}
        />
      </Section>

      <Section
        title={tcs("What LUC controls, and what it cannot")}
        description={tcs("Two customization depths, kept apart on purpose.")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-raised p-4">
            <Text variant="label" as="p">
              {tcs("Web Components — deep")}</Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("Closed shadow roots, so LUC styles only through the provider's published contract: a")}{" "}
              <Code>theme</Code> {tcs("attribute, its documented CSS custom properties (mapped from LUC tokens by")}{" "}
              <Code>TRADINGVIEW_TOKEN_BRIDGE</Code>), and <Code>::part()</Code> {tcs("where a widget exposes one.")}</Text>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-line-subtle bg-surface-raised p-4">
            <Text variant="label" as="p">
              {tcs("iframes — config only")}</Text>
            <Text variant="caption" tone="muted" as="p">
              {tcs("A separate document. LUC can pass the provider's own keys (")}<Code>colorTheme</Code>,{" "}
              <Code>backgroundColor</Code>, <Code>gridColor</Code>, <Code>isTransparent</Code>{tcs(" and size the box. It cannot restyle the inside, and it does not pretend to — the visual difference between the two formats is visible on the Themes page rather than hidden.")}</Text>
          </div>
        </div>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Attribution is never touched. TradingView's copyright block is rendered exactly as the provider ships it, and nothing in LUC is ever placed over a widget box: only symbol links can be redirected, through the provider's own")}<Code>symbol-url</Code> contract and <Code>tv-link-open</Code> event.
        </Text>
      </Section>

      <Section
        title={tcs("Failure is a state, not a crash")}
        description={tcs("Both formats below point at widget modules that do not exist, on the provider's real hosts. That is what an unreachable provider looks like — and it never takes the page with it.")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TradingViewTile
            definition={MISSING_WEB_COMPONENT}
            useCase={tcs("Web Component whose module 404s: the wrapper waits, gives up, and offers a retry.")}
          >
            <TradingViewWebComponent
              definition={MISSING_WEB_COMPONENT}
              settings={{ symbol: "NASDAQ:AAPL" }}
              timeoutMs={6000}
              loading="eager"
              height={180}
            />
          </TradingViewTile>
          <TradingViewTile
            definition={MISSING_IFRAME}
            useCase={tcs("iframe whose embed script 404s: the script's own error event becomes the wrapper's error state.")}
          >
            <TradingViewIframe
              definition={MISSING_IFRAME}
              providerConfig={{ symbol: "NASDAQ:AAPL", autosize: true }}
              attribution={{ href: "", label: "AAPL performance" }}
              loading="eager"
              timeoutMs={6000}
              height={180}
            />
          </TradingViewTile>
        </div>
      </Section>

      <Section
        title={tcs("Brokers")}
        description={tcs("The two Broker widgets are the provider's partner embeds: the broker id is part of the script URL, and the widget shows one broker's rating and reviews.")}
      >
        <TradingViewTile definition={tradingViewWidgetById("broker-rating")!}>
          <TradingViewBrokerRating broker="sample" height={200} />
        </TradingViewTile>
      </Section>

      <Section title={tcs("Network policy")} description={tcs("These are the only Showcase routes that depend on third-party resources.")}>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Nothing is requested until a wrapper is near the viewport, and nothing outside the catalog pages loads TradingView at all. A production CSP needs the domains below — derived from the provider's own embeds and observed requests, not guessed:")}</Text>
        <Code block>{CSP_NOTE}</Code>
        <Text variant="caption" tone="muted" as="p">
          {tcs("Rendering a widget also loads third-party resources in the visitor's browser, which is a privacy and consent question for the consuming product to answer. LUC documents the behaviour; it does not decide the legal position.")}</Text>
      </Section>
    </DocPage>
  );
}
