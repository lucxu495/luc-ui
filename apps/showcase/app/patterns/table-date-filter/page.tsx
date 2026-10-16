"use client";

import { useMemo, useState } from "react";
import {
  Button,
  CalendarDate,
  Combobox,
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  DateRangePicker,
  FacetFilter,
  Field,
  Section,
  Text,
  type ComboboxOption,
  type DateRange,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { runColumns, STATUS_PRESETS } from "@/components/tables/run-columns";
import { instruments, researchRuns, type ResearchRun } from "@/lib/table-data";
import { DEMO_RANGE, DEMO_TODAY, RANGE_PRESETS } from "@/lib/form-data";
import { useI18n } from "@/lib/i18n/provider";

const RUNS = researchRuns(64);

const ASSET_OPTIONS: ComboboxOption[] = instruments.map((item) => ({
  value: item.value,
  label: item.label,
  description: item.description,
  group: item.group,
}));

const statusLabel = (value: string) => STATUS_PRESETS[value as ResearchRun["status"]]?.label ?? value;

/**
 * The filter-form pattern a research product actually needs: a date range and
 * an instrument narrowing the rows, with the range expressed as calendar dates
 * rather than timestamps.
 */
export default function TableDateFilterPatternPage() {
  const { tcs } = useI18n();
  const columns = useMemo(() => runColumns(), []);
  const [range, setRange] = useState<DateRange | null>(DEMO_RANGE);
  const [asset, setAsset] = useState<ComboboxOption | null>(null);

  const rows = useMemo(() => {
    return RUNS.filter((row) => {
      const day = new CalendarDate(
        new Date(row.updated).getUTCFullYear(),
        new Date(row.updated).getUTCMonth() + 1,
        new Date(row.updated).getUTCDate(),
      );
      const inRange = !range || (day.compare(range.start) >= 0 && day.compare(range.end) <= 0);
      const matchesAsset = !asset || row.symbol === asset.value;
      return inRange && matchesAsset;
    });
  }, [asset, range]);

  const total = rows.reduce((sum, row) => sum + row.trades, 0);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Table and dates")}
        title="Table with a date range"
        lead="A period filter over a table. The range is two calendar dates, the instrument is a searchable list, and the table itself stays a table: formatted values in, no fetching, no recomputation."
      />

      <Section
        title={tcs("Filter form")}
        description={tcs("The controls live in a filter form rather than a loose toolbar, so the same values can be submitted, reset or validated.")}
      >
        <Demo bare>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 rounded-lg border border-line-subtle bg-surface-canvas p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)_auto] lg:items-end">
              <Field label={tcs("Period")} description={tcs("Inclusive at both ends; presets are consumer-defined.")}>
                <DateRangePicker
                  value={range}
                  onValueChange={setRange}
                  presets={RANGE_PRESETS}
                  todayValue={DEMO_TODAY}
                  months={2}
                  locale="en-US"
                />
              </Field>
              <Field label={tcs("Instrument")} description={tcs("Search, then choose.")}>
                <Combobox options={ASSET_OPTIONS} value={asset} onValueChange={setAsset} placeholder="Any instrument" />
              </Field>
              <div className="flex items-center gap-2 pb-0.5">
                <Button variant="secondary" disabled={!range && !asset} onClick={() => {
                  setRange(DEMO_RANGE);
                  setAsset(null);
                }}>
                  Reset
                </Button>
                <Text variant="caption" tone="muted">
                  {rows.length} of {RUNS.length} runs
                </Text>
              </div>
            </div>

            <DataTable<ResearchRun>
              ariaLabel={tcs("Runs in the selected period")}
              columns={columns}
              data={rows}
              getRowId={(row) => row.id}
              stickyHeader
              maxHeight={520}
              defaultSorting={[{ id: "updated", desc: true }]}
              defaultColumnVisibility={{ regime: false, maxDrawdown: false, exposure: false }}
              toolbar={
                <DataTableToolbar search={{ label: "Search runs", placeholder: "Search runs…" }}>
                  <FacetFilter columnId="status" label="Status" formatValue={statusLabel} />
                  <FacetFilter columnId="regime" label="Regime" searchable={false} />
                </DataTableToolbar>
              }
              footer={<DataTablePagination pageSizeOptions={[10, 25, 50]} />}
            />
            <Text variant="caption" tone="muted">
              {total.toLocaleString("en-US")} {tcs("trades across the filtered runs.")}</Text>
          </div>
        </Demo>
      </Section>

      <Section
        title={tcs("Why the range is not a timestamp")}
        description={tcs("A research window is a pair of dates. Turning it into an instant — start-of-day in Tokyo, end-of-day in UTC — is the query layer's decision, and it stays there.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-line-subtle bg-surface-canvas p-5">
            <Text variant="label">The component returns</Text>
            <Text variant="caption" tone="muted" className="mt-2 block">
              <code className="text-fg-primary">
                {`{ start: CalendarDate, end: CalendarDate }`}
              </code>
            </Text>
          </div>
          <div className="rounded-lg border border-line-subtle bg-surface-canvas p-5">
            <Text variant="label">The consumer decides</Text>
            <Text variant="caption" tone="muted" className="mt-2 block">
              {tcs("Which zone, which clock, and whether the end is inclusive of the whole day.")}</Text>
          </div>
        </div>
      </Section>
    </DocPage>
  );
}
