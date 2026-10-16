"use client";

import {
  AreaChart,
  Code,
  DataDetails,
  Panel,
  Section,
  Text,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { marketSeries } from "@/lib/mock-data";
import { useI18n } from "@/lib/i18n/provider";

const ROWS = marketSeries({ days: 400 }).slice(-180);

/**
 * Exact rows without leaving the reading flow.
 *
 * A chart answers "what is going on?"; the table answers "what was the number
 * on the 12th?". The second question should not cost every reader a full-width
 * disclosure under every chart — it belongs behind one compact `Data` control on
 * the surface, opening a bounded panel that keeps the chart where it was.
 *
 * This is deliberately *not* the same control as `ChartDataViewToggle`: that
 * swaps the chart for the table (one view at a time, the canvas unmounts), which
 * is right for a small panel and wrong for a research surface where the reader
 * wants the numbers beside the shape they are reading.
 */
export default function DataDetailsPatternPage() {
  const { tcs } = useI18n();
  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Exact data")}
        title="Data behind a surface"
        lead="Every research surface is a reading of a dataset. The dataset itself stays reachable — as a bounded panel, from the surface's own chrome, without pushing the page down."
      />

      <Section
        title={tcs("One control, a panel that fits the viewport")}
        description={tcs("Desktop opens a right-hand panel; a narrow viewport opens a bottom sheet. Focus is trapped, Escape closes it, and the trigger gets focus back. The chart never unmounts.")}
        actions={
          <DataDetails
            title={tcs("Price, 180 days")}
            description={tcs("The exact served rows behind the chart.")}
            /* The trigger is chrome, so its word follows the page. The rows
             * inside are the served fixture and stay as they are. */
            label={tcs("Data")}
            size="lg"
          >
            <table className="w-full text-caption tabular-nums">
              <thead>
                <tr className="text-left text-fg-muted">
                  <th className="py-1.5 pr-4 font-medium">Date</th>
                  <th className="py-1.5 font-medium">Close</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.time.toISOString()} className="border-t border-line-subtle">
                    <td className="py-1.5 pr-4 text-fg-secondary">
                      {row.time.toISOString().slice(0, 10)}
                    </td>
                    <td className="py-1.5">
                      {row.close.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataDetails>
        }
      >
        <Panel className="p-4">
          <AreaChart
            data={ROWS}
            xKey="time"
            height={320}
            ariaLabel="Price, 180 days"
            axes={[{ id: "primary", label: "Price", format: { kind: "currency", currency: "USD" } }]}
            series={[{ key: "close", label: "Close", axis: "primary", type: "area", tone: "accent" }]}
          />
        </Panel>
      </Section>

      <Section
        title={tcs("Where it belongs")}
        description={tcs("Under a surface whose primary job is a visual, and only when exact rows are genuinely useful.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-2 p-5">
            <Text variant="label" as="p">
              Use it
            </Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>{tcs("A plotted series whose exact values a reader may need to check.")}</li>
              <li>{tcs("A step/regime history where the runs matter as much as the shape.")}</li>
              <li>{tcs("Any surface whose table is")}{" "}<em>inspection</em>{tcs(", not the reading itself.")}</li>
            </ul>
          </Panel>
          <Panel className="flex flex-col gap-2 p-5">
            <Text variant="label" as="p">
              {tcs("Do not use it")}</Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>When the table <em>is</em> {tcs("the visualisation — keep it on the page.")}</li>
              <li>{tcs("When the chart already prints the only column there is.")}</li>
              <li>{tcs("As a place to hide a second data path: the rows are the same ones the chart drew.")}</li>
            </ul>
          </Panel>
        </div>
        <Text variant="caption" as="p" className="text-fg-muted">
          Import it from <Code>@luc/ui/data</Code>{tcs("; it composes the same")}{" "}<Code>Sheet</Code> {tcs("the mobile navigation uses, so there is no second overlay language.")}</Text>
      </Section>
    </DocPage>
  );
}
