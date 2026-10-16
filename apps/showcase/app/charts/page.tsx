"use client";

import {
  Badge,
  Card,
  CorrelationMatrix,
  Inline,
  LineChart,
  Link,
  PieChart,
  Section,
  Text,
  formatNumber,
  type SeriesSpec,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import {
  ASSET_LABELS,
  TIME_RANGES,
  compositionData,
  correlationMatrix,
  marketSeries,
  pctChange,
  windowForRange,
} from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 900 });
const CORRELATION = correlationMatrix(ASSET_LABELS.slice(0, 6));

const RESEARCH_SERIES: SeriesSpec[] = [
  { key: "close", label: "Close", type: "line", tone: "accent", lineWidth: 2 },
  { key: "sma50", label: "SMA 50", type: "line", tone: "info", lineWidth: 1.5, lineType: "dashed", symbol: false },
  { key: "sma200", label: "SMA 200", type: "line", tone: "neutral", lineWidth: 1.5, symbol: false },
];

const FAMILIES = [
  { href: "/charts/timeseries", title: "Time series", copy: "Line, area, bands, thresholds, events." },
  { href: "/charts/comparison", title: "Comparison", copy: "Bars, grouping, stacking, waterfall." },
  { href: "/charts/distribution", title: "Distribution", copy: "Histogram and box plot." },
  { href: "/charts/relationship", title: "Relationship", copy: "Scatter, bubble, quadrants." },
  { href: "/charts/matrix", title: "Matrix", copy: "Heatmap, correlation, calendar." },
  { href: "/charts/composition", title: "Composition", copy: "Donut, treemap, sunburst, funnel." },
  { href: "/charts/flow", title: "Flow", copy: "Sankey and network." },
  { href: "/charts/radial", title: "Radial", copy: "Radar and gauge." },
  { href: "/charts/composed", title: "Composed", copy: "Mixed marks, dual axes." },
  { href: "/charts/research", title: "Research", copy: "Drawdown, regimes, curves, depth." },
  { href: "/charts/financial", title: "Financial", copy: "Candles, volume, overlays, panes." },
  { href: "/charts/sync", title: "Synchronised", copy: "Cross-engine crosshair and range." },
];

/*
 * LEG-002 — the topic pages, from a declared destination.
 *
 * Eight chart routes answered 200 with **zero inbound links** anywhere on the
 * site: `/charts/architecture`, `/interaction`, `/networks`, `/performance`,
 * `/quantitative`, `/sizing`, `/surfaces` and `/uncertainty`. They are not
 * duplicates of the family pages — one is a guide to the two engines, one is the
 * interaction contract, one is the sizing rule — and the action item's
 * acceptance criteria allow either a link from a declared destination or a
 * redirect to canon. The redirect half needs the owner's decision (`LEG-001`,
 * still blocked), so this is the half that is safe to take now: they are listed
 * here, with what each one answers, and the route-health and journey gates then
 * cover them like any other page.
 *
 * Deleting them is not on the table from here — an infrequently visited page is
 * not an obsolete one, and a route with real content is the owner's call.
 */
const TOPICS = [
  { href: "/charts/architecture", title: "How the chart system is put together", copy: "Two engines, one experience." },
  { href: "/charts/interaction", title: "Tooltips, zoom, brush, fullscreen", copy: "The interaction contract, stated once." },
  { href: "/charts/uncertainty", title: "Uncertainty and evidence", copy: "A forecast cone, a fit, a regime strip." },
  { href: "/charts/performance", title: "Dense time series", copy: "What happens at real data volumes." },
  { href: "/charts/quantitative", title: "Quantitative charts", copy: "Drawdown, equity curves, attribution." },
  { href: "/charts/networks", title: "Network and hierarchy charts", copy: "Sankey, graph, tree, sunburst." },
  { href: "/charts/surfaces", title: "Surfaces", copy: "Three-dimensional fields and their projections." },
  { href: "/charts/sizing", title: "Semantic chart sizing", copy: "Height follows the information geometry." },
];

export default function ChartsOverviewPage() {
  const { tcs, href } = useI18n();
  const latest = ROWS[ROWS.length - 1]!;
  const yearAgo = ROWS[Math.max(0, ROWS.length - 366)]!;
  const change = pctChange(yearAgo.close, latest.close);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts")}
        title="Chart system"
        lead="Two engines behind one experience: Apache ECharts for analytical shapes, TradingView Lightweight Charts for financial panes. The rendering is infrastructure — tooltips, legends, ranges, annotations, synchronisation and fullscreen come from LUC UI."
      />

      <Section
        title={tcs("One system, many shapes")}
        description={tcs("Every chart below is drawn by a real engine, themed from the LUC token layer, and rendered at its least forgiving size.")}
      >
        <ChartPanel
          title={tcs("Price research · daily")}
          description={tcs("Close with two moving averages, a trailing range control and a fullscreen research view.")}
          readout={
            <Inline gap="sm">
              <Text variant="label" tone="primary" as="span">
                {formatNumber(latest.close, { kind: "currency", minimumFractionDigits: 2 })}
              </Text>
              <Badge size="sm" tone={change >= 0 ? "positive" : "negative"} dot>
                {formatNumber(change, { kind: "percent", signed: true })}
              </Badge>
            </Inline>
          }
          series={[
            { id: "close", label: "Close", tone: "accent" },
            { id: "sma50", label: "SMA 50", tone: "info" },
            { id: "sma200", label: "SMA 200", tone: "neutral" },
          ]}
          ranges={TIME_RANGES}
          defaultRange="1y"
          height={340}
          states
          exportFilename="luc-price-research"
          render={({ range, visibleSeries, state, height }) => (
            <LineChart
              data={windowForRange(ROWS, range)}
              xKey="time"
              series={RESEARCH_SERIES}
              visibleSeries={visibleSeries}
              interaction={{ zoom: "inside" }}
              tooltip={{ mode: "axis", sort: "none" }}
              height={height}
              state={state}
              ariaLabel={tcs("Close price with moving averages")}
              ariaDescription={tcs("Daily close price with 50 and 200 day moving averages.")}
            />
          )}
        />
      </Section>

      <Section title={tcs("Matrix and composition")} description={tcs("Two families that fail loudly when they are styled badly.")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartPanel
            title={tcs("Correlation matrix")}
            description={tcs("Diverging palette anchored at zero.")}
            height={330}
            render={({ height }) => (
              <CorrelationMatrix
                labels={CORRELATION.labels}
                values={CORRELATION.values}
                height={height}
                ariaLabel={tcs("Correlation matrix of six assets")}
              />
            )}
          />
          <ChartPanel
            title={tcs("Cost composition")}
            description={tcs("Donut, capped at six slices on purpose.")}
            height={330}
            render={({ height }) => (
              <PieChart
                data={compositionData()}
                centerValue={formatNumber(1152, { kind: "compact" })}
                centerLabel="Total"
                format={{ kind: "compact" }}
                height={height}
                ariaLabel={tcs("Cost composition by category")}
              />
            )}
          />
        </div>
      </Section>

      <Section
        title={tcs("Families")}
        /*
         * The count is derived, not written. It said "sixteen routes" while the
         * list held twelve — the same class of drift `LEG-004` records for the
         * chart counts in prose, caught here by printing the number the array
         * actually has.
         */
        description={tcs(
          "{count} routes covering the shapes a research terminal, a SaaS dashboard or an analytics product actually asks for.",
        ).replace("{count}", String(FAMILIES.length))}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FAMILIES.map((family) => (
            <Card key={family.href} variant="default" padding="md" className="gap-1.5">
              <Link href={href(family.href)} className="text-label font-medium text-fg-primary">
                {family.title}
              </Link>
              <Text variant="caption" tone="muted" as="p">
                {tcs(family.copy)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title={tcs("Topic pages")}
        description={tcs(
          "Cross-cutting pages: how the engines fit together, the interaction contract, sizing, and the charts that answer a specific question rather than a shape.",
        )}
      >
        <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {TOPICS.map((topic) => (
            <li key={topic.href} className="flex flex-col gap-0.5">
              <Link href={href(topic.href)} className="luc-focus rounded-sm text-label text-fg-primary underline">
                {tcs(topic.title)}
              </Link>
              <Text variant="caption" tone="muted" as="p">
                {tcs(topic.copy)}
              </Text>
            </li>
          ))}
        </ul>
      </Section>
    </DocPage>
  );
}
