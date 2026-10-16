"use client";

/*
 * The table-context demos.
 *
 * Four documented components — `DataTableToolbar`, `DataTablePagination`,
 * `ColumnVisibilityMenu`, `FacetFilter` — are *parts of a table*: they read the
 * TanStack table instance from `DataTableContext` and throw without it. A
 * specimen that renders one of them alone would therefore be impossible, and a
 * specimen that mocks the context would be a lie about how the component is
 * used.
 *
 * So the demo is what the documentation should show anyway: a small real table
 * with the part in its real place. One island, four parts, one fixture — the
 * only thing that changes is which piece of the table the reader is looking at.
 *
 * It is a client component because a table's state is client state. The fixture
 * comes from the existing `/data/table` demo data, so the numbers on this page
 * are the numbers that page shows.
 */

import { useMemo } from "react";
import {
  ColumnVisibilityMenu,
  DataTable,
  DataTablePagination,
  DataTableSelectionCount,
  DataTableToolbar,
  FacetFilter,
} from "@luc/ui";
import { runColumns } from "@/components/tables/run-columns";
import { researchRuns, type ResearchRun } from "@/lib/table-data";

export type TableDemoPart = "toolbar" | "pagination" | "columns" | "facets";

/** Six deterministic runs: enough for a facet to have something to filter. */
const RUNS = researchRuns(6);

export function TableContextDemo({ part }: { part: TableDemoPart }) {
  const columns = useMemo(() => runColumns(), []);

  const toolbar =
    part === "toolbar" ? (
      <DataTableToolbar
        search={{ label: "Search runs", placeholder: "Search runs…" }}
        actions={<DataTableSelectionCount label="selected" />}
      />
    ) : part === "columns" ? (
      <DataTableToolbar actions={<ColumnVisibilityMenu />} />
    ) : part === "facets" ? (
      <DataTableToolbar>
        <FacetFilter columnId="status" label="Status" />
      </DataTableToolbar>
    ) : undefined;

  return (
    <DataTable<ResearchRun>
      ariaLabel="Research runs"
      ariaDescription="Six prepared research runs with performance and metadata columns."
      columns={columns}
      data={RUNS}
      getRowId={(row) => row.id}
      density="comfortable"
      enableFiltering
      enableColumnVisibility
      enableRowSelection={part === "toolbar"}
      pageSize={6}
      defaultSorting={[{ id: "sharpe", desc: true }]}
      {...(toolbar ? { toolbar } : {})}
      {...(part === "pagination" ? { footer: <DataTablePagination rowLabel="runs" /> } : {})}
    />
  );
}
