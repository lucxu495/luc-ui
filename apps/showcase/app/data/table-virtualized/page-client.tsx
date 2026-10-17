"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Code,
  DataTablePagination,
  DataTableToolbar,
  Panel,
  Section,
  StatCard,
  Text,
  VirtualDataTable,
  compactColumn,
  currencyColumn,
  dateColumn,
  displayColumn,
  numericColumn,
  textColumn,
  type DataTableColumn,
} from "@luc/ui";
import { DocPage } from "@/components/docs/doc-page";
import { PageHeader } from "@/components/docs/page-header";
import { EntryFooter } from "@/components/docs/entry-footer";
import { ImportLine } from "@/components/docs/family-imports";
import { Example } from "@/components/docs/example";
import { ledgerRows, type LedgerRow } from "@/lib/table-data";
import { useI18n } from "@/lib/i18n/provider";
import { EntryNotes } from "@/components/docs/entry-notes";
import { ExamplesHeading } from "@/components/docs/examples-heading";

const ROWS = ledgerRows(10_000);

function ledgerColumns(): Array<DataTableColumn<LedgerRow>> {
  return [
    textColumn<LedgerRow, "id">("id", { header: "Fill", locked: true, pin: "start", size: 140, mono: true }),
    textColumn<LedgerRow, "venue">("venue", { header: "Venue", size: 128 }),
    textColumn<LedgerRow, "pair">("pair", { header: "Pair", size: 128, emphasis: true }),
    displayColumn<LedgerRow>({
      id: "side",
      header: "Side",
      size: 96,
      cell: (row) => (
        <Badge size="sm" tone={row.side === "buy" ? "positive" : "negative"}>
          {row.side === "buy" ? "Buy" : "Sell"}
        </Badge>
      ),
    }),
    currencyColumn<LedgerRow, "price">("price", { header: "Price", size: 132, decimals: 2 }),
    numericColumn<LedgerRow, "quantity">("quantity", { header: "Quantity", size: 120, decimals: 4 }),
    compactColumn<LedgerRow, "notional">("notional", {
      header: "Notional",
      size: 132,
      currency: "USD",
      kind: "currency",
    }),
    numericColumn<LedgerRow, "fee">("fee", { header: "Fee", size: 108, decimals: 4 }),
    dateColumn<LedgerRow, "timestamp">("timestamp", {
      id: "when",
      header: "Time",
      size: 160,
      style: "datetime",
    }),
  ];
}

export function VirtualTablePage({ apiSection }: { apiSection?: ReactNode }) {
  const { tcs } = useI18n();
  const columns = useMemo(() => ledgerColumns(), []);
  const [rendered, setRendered] = useState(0);

  return (
    <DocPage>
      <PageHeader
        eyebrow={tcs("Data · Virtualised table")}
        title="Virtualised table"
        lead="Opt-in virtualisation for the case where the DOM, not the data, is the bottleneck. The visible rows are still real table rows — two hidden spacer rows preserve the layout — so semantics never degrade into absolutely-positioned divs."
      />
      <ExamplesHeading />

      <ImportLine line={'import { DataTablePagination, DataTableToolbar, StatCard, VirtualDataTable } from "@luc/ui";'} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Rows loaded" value={ROWS.length} />
        <StatCard label={tcs("Rows in the DOM")} value={rendered} footer="Window plus overscan" />
        <StatCard label="Rendered rows" value={rendered} footer="of 10,000 loaded" />
      </div>

      <Example
        title={tcs("10,000 fills")}
        code={`<VirtualDataTable<LedgerRow>
  ariaLabel="Trade ledger"
  columns={columns}
  data={ROWS}
  getRowId={(row) => row.id}
  height={520}
  pageSize={10_000}
  stickyHeader
  onRenderedRowCountChange={setRendered}
  toolbar={<DataTableToolbar search={{ label: "Search fills" }} />}
  footer={<DataTablePagination rowLabel="fills" pageSizeOptions={[25, 50, 100, 250]} />}
/>`}
        description={tcs("Scroll, sort and filter the whole set. Only the window plus a small overscan is mounted, so interaction stays responsive without pretending this is a benchmark.")}
      >

        <VirtualDataTable<LedgerRow>
          ariaLabel="Trade ledger"
          columns={columns}
          data={ROWS}
          getRowId={(row) => row.id}
          height={520}
          pageSize={10_000}
          stickyHeader
          onRenderedRowCountChange={setRendered}
          toolbar={<DataTableToolbar search={{ label: "Search fills", placeholder: tcs("Search venue or pair…") }} />}
          footer={<DataTablePagination rowLabel="fills" pageSizeOptions={[25, 50, 100, 250]} />}
        />
      </Example>

      <Section title={tcs("When to virtualise")} description={tcs("Virtualising twenty rows costs correctness and buys nothing.")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col gap-3 p-5">
            <Text variant="label" as="p">
              Use DataTable
            </Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>{tcs("Under a few hundred rows on one page.")}</li>
              <li>{tcs("When browser find-in-page and text selection matter most.")}</li>
              <li>{tcs("Anywhere row expansion or variable row heights are used.")}</li>
            </ul>
          </Panel>
          <Panel className="flex flex-col gap-3 p-5">
            <Text variant="label" as="p">
              Use VirtualDataTable
            </Text>
            <ul className="flex flex-col gap-2 text-caption text-fg-muted">
              <li>{tcs("Thousands of rows in one scroll area.")}</li>
              <li>{tcs("Fixed row height and no expansion.")}</li>
              <li>{tcs("When mounting every row measurably slows interaction.")}</li>
            </ul>
          </Panel>
        </div>
        <Code block>{`<VirtualDataTable
  columns={columns}
  data={rows}            // 10,000 rows
  getRowId={(row) => row.id}
  height={520}
  rowHeight={40}         // must match the rendered row
  overscan={12}
  stickyHeader
  ariaLabel="Trade ledger"
/>`}</Code>
      </Section>
          {apiSection}
      <EntryNotes entryIds={["virtual-data-table"]} />
          <EntryFooter />
    </DocPage>
  );
}
