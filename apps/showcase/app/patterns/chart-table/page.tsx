"use client";

import { useState } from "react";
import {
  AreaChart,
  ChartDataTable,
  ChartDataViewToggle,
  Code,
  Panel,
  Section,
  Text,
  type ChartDataSeriesSpec,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { ChartPanel } from "@/components/charts/chart-panel";
import { marketSeries } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 400 }).slice(-180);

/** The same prepared rows, in the shape the table wants. */
const TABLE_ROWS = ROWS.map((row) => ({
  time: row.time.getTime(),
  close: row.close,
  rv30: row.rv30,
  funding: row.funding,
}));

const SERIES: ChartDataSeriesSpec[] = [
  { key: "close", label: "Close", format: { kind: "currency", currency: "USD", decimals: 2 } },
  { key: "rv30", label: "RV 30d", format: { kind: "percent", decimals: 1 } },
  { key: "funding", label: "Funding", format: { kind: "percent", decimals: 3 }, tone: "signed" },
];

/**
 * The accessibility pattern: a canvas chart paired with a semantic table of the
 * same numbers, reachable through a real control. It is not shown by default —
 * a table under every chart would be noise — and it respects the chart's own
 * series visibility, because the caller passes the visible series.
 */
export default function ChartTablePatternPage() {
  const { tcs } = useI18n();
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Chart and table")}
        title="Chart with a data table"
        lead="Canvas has no text, so a chart cannot describe itself to a screen reader. The honest fix is not a clever aria-label — it is the same data in a semantic table, one keystroke away. Hiding a series in the legend hides its column too."
      />

      <Section
        title={tcs("One chart, two views")}
        description={tcs("The toggle is a segmented control, so it is a single keyboard stop and the choice is exclusive. The table reads the same prepared rows the chart was given — no second data path, no recomputation.")}
        actions={
          <ChartDataViewToggle
            value={view}
            onValueChange={setView}
            label={tcs("Chart or table view")}
            labels={{ chart: tcs("Chart"), table: tcs("Table") }}
          />
        }
      >
        <ChartPanel
          title={tcs("Price and realised volatility")}
          description={tcs("Apache ECharts · prepared series")}
          series={[
            { id: "close", label: "Close", tone: "accent" },
            { id: "rv30", label: "RV 30d", tone: "warning" },
            { id: "funding", label: "Funding", tone: "info" },
          ]}
          height={340}
          render={({ visibleSeries: shown, height }) => (
            <div className="flex h-full min-h-0 w-full flex-col gap-3">
              {view === "chart" ? (
                <div className="min-h-0 flex-1">
                  <AreaChart
                    data={ROWS}
                    xKey="time"
                    height={height}
                    visibleSeries={shown}
                    ariaLabel={tcs("Price and realised volatility")}
                    axes={[
                      { id: "primary", label: "Price", format: { kind: "currency", currency: "USD" } },
                      { id: "secondary", label: "RV", position: "left", format: { kind: "percent", decimals: 0 } },
                    ]}
                    series={[
                      { key: "close", label: "Close", axis: "primary", type: "area", tone: "accent" },
                      { key: "rv30", label: "RV 30d", axis: "secondary", type: "line", tone: "warning" },
                      { key: "funding", label: "Funding", axis: "secondary", type: "line", tone: "info" },
                    ]}
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1">
                  <ChartDataTable
                    rows={TABLE_ROWS}
                    xKey="time"
                    xLabel="Date"
                    series={SERIES.filter((spec) => (shown ?? SERIES.map((s) => s.key)).includes(spec.key))}
                    caption={tcs("Price, realised volatility and funding")}
                    pageSize={10}
                    maxHeight={280}
                  />
                </div>
              )}
            </div>
          )}
        />
      </Section>

      <Section title={tcs("What this does and does not fix")} description={tcs("Be precise about accessibility claims.")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-2 p-5">
            <Text variant="label" as="p">
              It fixes
            </Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>{tcs("Every plotted number becomes readable text in a real table.")}</li>
              <li>{tcs("The table is reachable and operable with the keyboard alone.")}</li>
              <li>{tcs("Values can be copied, searched with find-in-page and zoomed with the browser.")}</li>
              <li>{tcs("Hidden series disappear from the table, matching what is on screen.")}</li>
            </ul>
          </Panel>
          <Panel className="flex flex-col gap-2 p-5">
            <Text variant="label" as="p">
              {tcs("It does not fix")}</Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>{tcs("The canvas itself still needs its own name and description.")}</li>
              <li>{tcs("A table is not a substitute for describing the trend in words.")}</li>
              <li>{tcs("It is opt-in: a product decides where the toggle belongs.")}</li>
              <li>{tcs("It is not a CSV export; that is a separate, deliberate feature.")}</li>
            </ul>
          </Panel>
        </div>
        <Code block>{`<ChartDataTable
  rows={rows}                 // the same rows the chart got
  xKey="time"
  series={visibleSeries}      // filtered by the legend
  caption="Price and realised volatility"
/>`}</Code>
      </Section>
    </DocPage>
  );
}
