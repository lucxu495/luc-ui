"use client";

/*
 * The chart catalogue.
 *
 * Every entry is a *claim about what a developer can import today*, and the
 * status column is the honest part: `Public` means a typed component exists in
 * `@luc/ui/charts`; `Engine` means ECharts can draw it but LUC has not wrapped
 * it; `Planned` and `Blocked` are not shipped, and the reason is stated. The
 * page exists because a roadmap that lives only in an audit document goes stale
 * the moment nobody re-reads it.
 *
 * The data lives in `components/charts/chart-catalog-data.ts`, not here, because
 * three consumers have to agree about it: this page, `scripts/chart-catalog.mjs`
 * (which resolves every symbol against the package's exports and refuses a
 * duplicate id) and an agent looking for something to import. The counts on
 * this page are derived from that file, so they cannot drift from it.
 */

import { Badge, Card, Code, Heading, Link, Section, Text } from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartThumbnail } from "@/components/charts/chart-thumbnail";
import {
  chartGroups,
  chartStatusCounts,
  chartVariants,
  publicChartSymbols,
  type ChartStatus,
} from "@/components/charts/chart-catalog-data";
import { chartDemoId, chartPageForSymbol } from "@/lib/docs/chart-links";
import { useI18n } from "@/lib/i18n/provider";

const STATUS_TONE: Record<ChartStatus, "positive" | "info" | "warning" | "neutral"> = {
  public: "positive",
  engine: "info",
  planned: "warning",
  blocked: "neutral",
};

export default function ChartCatalogPage() {
  const { tc, t, tcs, href } = useI18n();
  const counts = chartStatusCounts(chartGroups);
  const publicSymbols = publicChartSymbols(chartGroups);
  /*
   * Three numbers, because they answer three questions.
   *
   * `counts.public` is how many documentation rows are shipped. The distinct
   * symbol count is how many *components* those rows name — one row can cover
   * two components ("Candlestick / OHLC"). The kind badge on each card says
   * whether the row is a distinct plot, a variant of another plot, or a
   * composition of two. Reporting only the first is how a catalogue quietly
   * inflates.
   */
  const plotTypes = chartGroups.flatMap((group) =>
    group.entries.filter((entry) => entry.status === "public" && entry.kind === "plot"),
  ).length;

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Charts")}
        title="Chart catalogue"
        lead={tc("charts.catalog.lead")}
      />
      <Text variant="caption" tone="muted" as="p" className="max-w-[68ch]">
        {tcs("Every public row is drawn by the component it names, from that chart's own page fixture.")}
      </Text>

      <Section title={tc("charts.catalog.status.title")} description={tc("charts.catalog.status.lead")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["public", "engine", "planned", "blocked"] as const).map((status) => (
            <Card key={status} variant="outline" padding="sm" className="gap-1.5">
              <Badge tone={STATUS_TONE[status]} size="sm">
                {t(`charts.catalog.status.${status}`)}
              </Badge>
              <Heading size="display-sm" as="p">
                {counts[status]}
              </Heading>
              <Text variant="caption" tone="muted">
                {tc(`charts.catalog.status.${status}.note`)}
              </Text>
              {status === "public" ? (
                <Text variant="caption" tone="muted">
                  {tcs("Distinct plot types: {plots} · components: {components}")
                    .replace("{plots}", String(plotTypes))
                    .replace("{components}", String(publicSymbols.length))}
                </Text>
              ) : null}
            </Card>
          ))}
        </div>
      </Section>

      {chartGroups.map((group) => (
        <Section
          key={group.id}
          title={tcs(group.title)}
          description={tcs(group.description)}
        >
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {group.entries.map((entry) => {
              /*
               * The row a reader actually wants to click.
               *
               * A catalogue of names made every row a dead end: the name was a
               * link to itself, and what the chart *looks like* was something you
               * found out on the next page. The row now opens the chart's own
               * page (localised) and carries the real drawing, which is the
               * difference between a list of exports and a catalogue.
               *
               * `page` is resolved from the row's public symbol, so only a
               * `public` row — one with a shipped component — can have either.
               * The two rows that are still planned or blocked keep the honest,
               * compact shape they had: no picture, no link, no pretence.
               */
              const page = entry.status === "public" ? chartPageForSymbol(entry.symbol) : undefined;
              return (
                /*
                 * CHT-002. Every row is addressable at its own id, so a reader can
                 * link a colleague to one chart instead of to "somewhere in the
                 * catalogue". The id is the registry's own entry id, which is
                 * already unique across the page and already the key the catalogue
                 * script resolves against `@luc/ui/charts` — one name, one row,
                 * one anchor. `scroll-mt-24` keeps the sticky header off the row
                 * once it is scrolled to.
                 */
                <Card
                  key={entry.id}
                  id={entry.id}
                  variant="outline"
                  padding="sm"
                  className="scroll-mt-24 gap-2"
                >
                  {page ? (
                    <Link
                      href={href(page.route)}
                      aria-label={tcs("Open {name}").replace("{name}", tcs(entry.name))}
                      className="luc-focus block overflow-hidden rounded-md border border-line-subtle"
                    >
                      <ChartThumbnail id={chartDemoId(page.route)} />
                    </Link>
                  ) : null}
                  <span className="flex items-center justify-between gap-2">
                    {page ? (
                      <Link href={href(page.route)} className="luc-focus rounded-sm">
                        <Text variant="label">{tcs(entry.name)}</Text>
                      </Link>
                    ) : (
                      <Text variant="label">{tcs(entry.name)}</Text>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Badge tone={STATUS_TONE[entry.status]} size="sm">
                        {t(`charts.catalog.status.${entry.status}`)}
                      </Badge>
                      {/* The row's own permalink. Kept as a real anchor with a
                       * name of its own so a deep link to one row is still a
                       * thing a reader can copy, now that the title navigates. */}
                      <Link
                        href={`#${entry.id}`}
                        aria-label={tcs("Link to {name}").replace("{name}", tcs(entry.name))}
                        className="luc-focus rounded-sm text-caption text-fg-muted"
                      >
                        #
                      </Link>
                    </span>
                  </span>
                  <Code>{entry.symbol}</Code>
                  <Text variant="caption" tone="muted">
                    {entry.kind === "plot"
                      ? tcs("plot type")
                      : entry.kind === "variant"
                        ? tcs("variant of another plot")
                        : tcs("composition of two plots")}{" "}
                    · {entry.engine}
                  </Text>
                  {entry.note ? (
                    <Text variant="caption" tone="muted">
                      {tcs(entry.note)}
                    </Text>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </Section>
      ))}

      <Section title={tc("charts.catalog.variants.title")} description={tc("charts.catalog.variants.lead")}>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {chartVariants.map((variant) => (
            <Card key={variant.name} variant="outline" padding="sm" className="gap-1.5">
              <span className="flex items-center justify-between gap-2">
                <Text variant="label">{tcs(variant.name)}</Text>
                <Badge tone="neutral" size="sm">
                  {tc("charts.catalog.variants.badge")}
                </Badge>
              </span>
              <Code>{variant.of}</Code>
              <Text variant="caption" tone="muted">
                {tcs(variant.note)}
              </Text>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={tc("charts.catalog.rules.title")} description={tc("charts.catalog.rules.lead")}>
        <Card variant="outline" className="gap-3 p-4">
          <Text variant="caption" tone="secondary">
            {tc("charts.catalog.rules.body")}
          </Text>
        </Card>
      </Section>
    </DocPage>
  );
}
