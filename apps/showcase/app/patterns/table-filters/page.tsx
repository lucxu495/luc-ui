"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Code,
  ColumnVisibilityMenu,
  Combobox,
  DataTable,
  DataTablePagination,
  DataTableSelectionCount,
  DataTableToolbar,
  FacetFilter,
  Panel,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  toast,
  type ComboboxOption,
} from "@luc/ui";
import { RiAddLine, RiRefreshLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { Demo } from "@/components/docs/demo";
import { runColumns, STATUS_PRESETS } from "@/components/tables/run-columns";
import { instruments, researchRuns, type ResearchRun } from "@/lib/table-data";
import { useI18n } from "@/lib/i18n/provider";

const RUNS = researchRuns(48);

const ASSET_OPTIONS: ComboboxOption[] = instruments.map((item) => ({
  value: item.value,
  label: item.label,
  description: item.description,
  group: item.group,
  disabled: item.disabled,
}));

const statusLabel = (value: string) => STATUS_PRESETS[value as ResearchRun["status"]]?.label ?? value;

/**
 * The pattern: a filter toolbar above a table, with every control feeding the
 * same table state. Three different controls, three different semantics —
 * Select for a known window, Combobox for a searchable instrument, FacetFilter
 * for a multi-select dimension.
 */
export default function TableFiltersPatternPage() {
  const { tcs } = useI18n();
  const columns = useMemo(() => runColumns(), []);
  const [window, setWindow] = useState("90d");
  const [asset, setAsset] = useState<ComboboxOption | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);

  // The Select and the Combobox narrow the table the way a *consumer* would: by
  // pre-filtering the rows it hands over. Nothing about that is special-cased
  // in the table.
  const rows = useMemo(() => {
    const windowDays = window === "30d" ? 30 : window === "90d" ? 90 : 365;
    const cutoff = Math.max(...RUNS.map((row) => row.updated)) - windowDays * 86_400_000;
    return RUNS.filter((row) => row.updated >= cutoff).filter((row) => (asset ? row.symbol === asset.value : true));
  }, [asset, window]);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Patterns · Table and filters")}
        title="Table with filters"
        lead="A dense table with a filter bar that reads as one control surface. The window and the instrument are chosen with a Select and a Combobox; the multi-select dimension is a facet filter over the table's own faceted values. Every control is a LUC component and the table stays the thing you read."
      />

      <Section
        title={tcs("Filter bar plus table")}
        description={tcs("Global search, a window Select, an instrument Combobox and two facet filters, all wired to the same table.")}
      >
        <Demo bare>
          <DataTable<ResearchRun>
            ariaLabel={tcs("Filtered research runs")}
            columns={columns}
            data={rows}
            getRowId={(row) => row.id}
            stickyHeader
            maxHeight={520}
            enableRowSelection
            pageSize={10}
            defaultSorting={[{ id: "sharpe", desc: true }]}
            defaultColumnVisibility={{ regime: false, maxDrawdown: false, trades: false, exposure: false }}
            toolbar={
              <DataTableToolbar
                search={{ label: "Search runs", placeholder: "Search runs…" }}
                actions={
                  <>
                    <DataTableSelectionCount label="selected" />
                    <ColumnVisibilityMenu />
                    <Button
                      size="sm"
                      variant="secondary"
                      leadingIcon={<RiRefreshLine />}
                      onClick={() => toast.info("Refreshed", { description: "Filters kept." })}
                    >
                      Refresh
                    </Button>
                  </>
                }
              >
                <Select value={window} onValueChange={setWindow}>
                  <SelectTrigger size="sm" aria-label="Window" className="w-[8.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent size="sm">
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="365d">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <div className="w-[13rem]">
                  <Combobox
                    options={ASSET_OPTIONS}
                    aria-label="Instrument filter"
                    placeholder="Any instrument"
                    size="sm"
                    value={asset}
                    onValueChange={setAsset}
                  />
                </div>
                <FacetFilter columnId="status" label="Status" formatValue={statusLabel} />
                <FacetFilter columnId="regime" label="Regime" searchable={false} />
              </DataTableToolbar>
            }
            footer={<DataTablePagination rowLabel="runs" />}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              leadingIcon={<RiAddLine />}
              onClick={() => setSymbols((current) => [...current, `run-${current.length + 1}`])}
            >
              {tcs("Add to comparison (")}{symbols.length})
            </Button>
            <Text variant="caption" tone="muted">
              {rows.length} of {RUNS.length} {tcs("runs pass the bar. The table itself is unaware of the window and instrument controls.")}</Text>
          </div>
        </Demo>
      </Section>

      <Section title={tcs("Why these controls")} description={tcs("Each control matches the shape of the question.")}>
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel className="flex flex-col gap-2 p-5">
            <Text variant="label" as="p">
              Window
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("Three known options, always the same three. A Select: no search box for three rows.")}</Text>
          </Panel>
          <Panel className="flex flex-col gap-2 p-5">
            <Text variant="label" as="p">
              Instrument
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("A list that grows and that people search by name or ticker. A Combobox.")}</Text>
          </Panel>
          <Panel className="flex flex-col gap-2 p-5">
            <Text variant="label" as="p">
              Status, Regime
            </Text>
            <Text variant="caption" tone="muted">
              {tcs("Multi-select dimensions with counts from the data. A facet filter over the table's own faceted values.")}</Text>
          </Panel>
        </div>
        <Code block>{`<DataTableToolbar search={{ label: "Search runs" }}>
  <Select value={window} onValueChange={setWindow}>...</Select>
  <Combobox options={assets} aria-label="Instrument filter" />
  <FacetFilter columnId="status" label="Status" />
</DataTableToolbar>`}</Code>
      </Section>
    </DocPage>
  );
}
