"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Button,
  Code,
  ColumnVisibilityMenu,
  DataTable,
  DataTablePagination,
  DataTableSelectionCount,
  DataTableToolbar,
  FacetFilter,
  Panel,
  Section,
  SegmentedControl,
  SegmentedItem,
  Text,
  type DataTableState,
} from "@luc/ui";
import { RiDownloadLine } from "@remixicon/react";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { runColumns, STATUS_PRESETS } from "@/components/tables/run-columns";
import { researchRuns, type ResearchRun } from "@/lib/table-data";
import { useI18n } from "@/lib/i18n/provider";

const RUNS = researchRuns(48);
const statusLabel = (value: string) => STATUS_PRESETS[value as ResearchRun["status"]]?.label ?? value;

export function DataTablePage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const columns = useMemo(() => runColumns(), []);
  const [state, setState] = useState<DataTableState>("ready");

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Data · Data table")}
        title="Data table"
        lead="A real table, not a spreadsheet. Semantic markup keeps screen readers and browser find-in-page working, while columns describe intent — numeric, currency, percent, status, sparkline — instead of repeating alignment and formatting rules on every screen."
      />

      <ImportLine line={'import {\n  ColumnVisibilityMenu,\n  DataTable,\n  DataTablePagination,\n  DataTableSelectionCount,\n  DataTableToolbar,\n  FacetFilter,\n  SegmentedControl,\n  SegmentedItem,\n} from "@luc/ui";'} />

      <Example
        title={tcs("Full table")}
        code={`<DataTable<ResearchRun>
  ariaLabel="Research runs"
  columns={columns}
  data={RUNS}
  getRowId={(row) => row.id}
  state={state}
  onStateChange={setState}
  density="comfortable"
  stickyHeader
  maxHeight={560}
  enableRowSelection
  enableExpansion
  enableFiltering
  enableColumnVisibility
  pageSize={12}
  defaultSorting={[{ id: "sharpe", desc: true }]}
/>`}
        description={tcs("Sorting, global search, faceted filters, selection, column visibility, sticky header, pinned edges, expansion and pagination — in one table, all keyboard reachable.")}
      >

        <DataTable<ResearchRun>
          ariaLabel={tcs("Research runs")}
          ariaDescription={tcs("Forty-eight prepared research runs with performance and metadata columns.")}
          columns={columns}
          data={RUNS}
          getRowId={(row) => row.id}
          state={state}
          density="comfortable"
          stickyHeader
          maxHeight={560}
          enableRowSelection
          enableExpansion
          enableFiltering
          enableColumnVisibility
          pageSize={12}
          defaultSorting={[{ id: "sharpe", desc: true }]}
          defaultColumnVisibility={{ regime: false, maxDrawdown: false, trades: false, exposure: false }}
          toolbar={
            <DataTableToolbar
              search={{ label: "Search runs", placeholder: "Search runs…" }}
              actions={
                <>
                  <DataTableSelectionCount label="selected" />
                  <ColumnVisibilityMenu />
                </>
              }
            >
              <FacetFilter columnId="status" label="Status" formatValue={statusLabel} />
              <FacetFilter columnId="regime" label="Regime" searchable={false} />
            </DataTableToolbar>
          }
          footer={<DataTablePagination rowLabel="runs" />}
          renderSubRow={(row) => (
            <div className="grid gap-3 text-caption sm:grid-cols-3">
              <div>
                <p className="text-micro text-fg-muted uppercase">Run</p>
                <p className="font-mono text-fg-secondary">{row.id}</p>
              </div>
              <div>
                <p className="text-micro text-fg-muted uppercase">Exposure</p>
                <p className="luc-numeric text-fg-secondary">{row.exposure.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-micro text-fg-muted uppercase">Trades</p>
                <p className="luc-numeric text-fg-secondary">{row.trades}</p>
              </div>
            </div>
          )}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl size="sm" value={state} onValueChange={(next) => next && setState(next as DataTableState)}>
            {(["ready", "loading", "empty", "error"] as const).map((option) => (
              <SegmentedItem key={option} size="sm" value={option}>
                {option}
              </SegmentedItem>
            ))}
          </SegmentedControl>
          <Text variant="caption" tone="muted">
            {tcs("The state switch is a demo control: the component just renders the state you give it.")}</Text>
        </div>
      </Example>

      <Section
        title={tcs("Columns carry the semantics")}
        description={tcs("A column helper decides alignment, tabular figures, em-dash handling and tone. Nothing guesses units: a value formatted as a percentage is one because the column said so.")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-3 p-5">
            <Text variant="label" as="p">
              {tcs("What the helpers do")}</Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>{tcs("Numeric columns are right-aligned with tabular figures.")}</li>
              <li>{tcs("null, NaN and Infinity render an em dash — never “NaN”.")}</li>
              <li>{tcs("tone: \"signed\" uses the semantic positive/negative tokens.")}</li>
              <li>{tcs("Filtering is opt-in per column, and the predicate is named.")}</li>
              <li>{tcs("Locked columns cannot be hidden; pinned columns stay opaque.")}</li>
            </ul>
          </Panel>
          <Panel className="flex flex-col gap-3 p-5">
            <Text variant="label" as="p">
              {tcs("What they never do")}</Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>{tcs("Compute return, volatility, drawdown or any other metric.")}</li>
              <li>{tcs("Convert units (0.0001 is never silently 0.01%).")}</li>
              <li>{tcs("Fetch data — the table renders the rows you give it.")}</li>
              <li>{tcs("Own sort/filter/page state when you control it yourself.")}</li>
              <li>{tcs("Turn into a spreadsheet: no cell editing or fill handles.")}</li>
            </ul>
          </Panel>
        </div>
        <Code block>{`const columns = [
  textColumn("symbol", { header: "Symbol", locked: true, pin: "start" }),
  numericColumn("sharpe", { header: "Sharpe", decimals: 2, tone: "signed" }),
  percentColumn("cagr", { header: "CAGR", decimals: 1 }),
  statusColumn("status", { header: "Status", filterable: true, filterFn: "arrHas", map: toStatus }),
];

<DataTable columns={columns} data={runs} getRowId={(row) => row.id} ariaLabel="Research runs" />`}</Code>
      </Section>

      <Example
        title={tcs("Server-driven, without a rewrite")}
        description={tcs("Pass manualPagination, manualSorting and the matching controlled state and the table stops slicing locally. Row identity, selection and column visibility keep working because they were never tied to the client row model.")}
        layout="block"
        code={`<DataTable
  manualPagination
  manualSorting
  manualFiltering
  pageCount={pageCountFromServer}
  rowCount={totalRows}
  pagination={pagination}
  onPaginationChange={setPagination}
  sorting={sorting}
  onSortingChange={setSorting}
  columns={columns}
  data={pageOfRows}
  ariaLabel="Research runs"
/>`}
      >

        <Panel className="flex flex-wrap items-center gap-3 p-5">
          <Button variant="secondary" leadingIcon={<RiDownloadLine />}>
            Export selection
          </Button>
          <Text variant="caption" tone="muted">
            {tcs("The toolbar is a slot. LUC ships the bound pieces — search, selection count, column menu, facets, pagination — and stays out of the rest.")}</Text>
        </Panel>
      </Example>
          {apiSection}
          <EntryFooter />
    </DocPage>
  );
}
