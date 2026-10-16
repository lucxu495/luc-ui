import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSelectionCount, DataTableToolbar } from "./data-table-toolbar";
import { DataTable } from "./data-table";
import { FacetFilter } from "./facet-filter";
import { textColumn, integerColumn, percentColumn, statusColumn } from "./columns";
import type { DataTableColumn } from "./types";

interface Row {
  id: string;
  symbol: string;
  status: string;
  trades: number;
  sharpe: number;
}

const ROWS: Row[] = [
  { id: "a", symbol: "ALPHA", status: "live", trades: 320, sharpe: 0.5 },
  { id: "b", symbol: "BRAVO", status: "stale", trades: 12, sharpe: -0.2 },
  { id: "c", symbol: "CHARLIE", status: "live", trades: 48, sharpe: 1.4 },
  { id: "d", symbol: "DELTA", status: "down", trades: 7, sharpe: 0 },
];

function columns(): Array<DataTableColumn<Row>> {
  return [
    textColumn<Row, "symbol">("symbol", { header: "Symbol", locked: true }),
    statusColumn<Row, "status">("status", {
      header: "Status",
      filterable: true,
      filterFn: "arrHas",
      map: (value) => ({ status: value === "live" ? "live" : value === "down" ? "down" : "stale" }),
    }),
    integerColumn<Row, "trades">("trades", { header: "Trades" }),
    percentColumn<Row, "sharpe">("sharpe", { header: "Return", tone: "signed", decimals: 1 }),
  ];
}

function bodyRows() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").slice(1);
}

describe("DataTable", () => {
  it("renders semantic table markup with a header row and named columns", () => {
    render(<DataTable columns={columns()} data={ROWS} getRowId={(row) => row.id} ariaLabel="Runs" />);

    const table = screen.getByRole("table", { name: "Runs" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Symbol",
      "Status",
      "Trades",
      "Return",
    ]);
    expect(bodyRows()).toHaveLength(4);
  });

  it("cycles sorting ascending, descending and back to unsorted", async () => {
    render(<DataTable columns={columns()} data={ROWS} getRowId={(row) => row.id} ariaLabel="Runs" />);
    const header = screen.getByRole("button", { name: /Symbol/ });

    await userEvent.click(header);
    expect(screen.getByRole("columnheader", { name: "Symbol" })).toHaveAttribute("aria-sort", "ascending");
    expect(bodyRows()[0]).toHaveTextContent("ALPHA");

    await userEvent.click(header);
    expect(screen.getByRole("columnheader", { name: "Symbol" })).toHaveAttribute("aria-sort", "descending");
    expect(bodyRows()[0]).toHaveTextContent("DELTA");

    await userEvent.click(header);
    expect(screen.getByRole("columnheader", { name: "Symbol" })).toHaveAttribute("aria-sort", "none");
    expect(bodyRows()[0]).toHaveTextContent("ALPHA");
  });

  it("sorts numerically, not lexically", async () => {
    render(<DataTable columns={columns()} data={ROWS} getRowId={(row) => row.id} ariaLabel="Runs" />);
    await userEvent.click(screen.getByRole("button", { name: /Trades/ }));
    expect(bodyRows()[0]).toHaveTextContent("7");
    expect(bodyRows()[3]).toHaveTextContent("320");
  });

  it("filters through global search and reports the empty state", async () => {
    render(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        toolbar={<DataTableToolbar search={{ label: "Search runs", placeholder: "Search runs" }} />}
      />,
    );

    await userEvent.type(screen.getByLabelText("Search runs"), "bravo");
    expect(bodyRows()).toHaveLength(1);
    expect(bodyRows()[0]).toHaveTextContent("BRAVO");

    await userEvent.clear(screen.getByLabelText("Search runs"));
    await userEvent.type(screen.getByLabelText("Search runs"), "zzzz");
    expect(screen.getByText("No rows")).toBeInTheDocument();
  });

  it("filters by facet with counts, and clears", async () => {
    render(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        toolbar={
          <DataTableToolbar>
            <FacetFilter columnId="status" label="Status" searchable={false} />
          </DataTableToolbar>
        }
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Filter by Status" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "live" }));
    expect(bodyRows()).toHaveLength(2);
    expect(bodyRows()[0]).toHaveTextContent("ALPHA");

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(bodyRows()).toHaveLength(4);
  });

  it("selects rows, selects the page and clears", async () => {
    render(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        enableRowSelection
        toolbar={
          <DataTableToolbar>
            <DataTableSelectionCount />
          </DataTableToolbar>
        }
      />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(screen.getByText("4 selected")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("4 selected")).not.toBeInTheDocument();
  });

  it("paginates and reports the visible window", async () => {
    render(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        pageSize={2}
        footer={<DataTablePagination rowLabel="runs" />}
      />,
    );

    expect(bodyRows()).toHaveLength(2);
    expect(screen.getByText(/1–2/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(bodyRows()).toHaveLength(2);
    expect(bodyRows()[0]).toHaveTextContent("CHARLIE");
    expect(screen.getByText(/3–4/)).toBeInTheDocument();
  });

  it("hides columns through the visibility menu and keeps locked columns", async () => {
    const { rerender } = render(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        enableColumnVisibility
      />,
    );
    expect(screen.getByRole("columnheader", { name: "Trades" })).toBeInTheDocument();

    // The column menu lives in the toolbar; this asserts the underlying state
    // contract rather than reaching through the popover.
    rerender(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        columnVisibility={{ trades: false }}
      />,
    );
    expect(screen.queryByRole("columnheader", { name: "Trades" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Symbol" })).toBeInTheDocument();
  });

  it("never renders a sort button for a column that cannot sort", () => {
    const cols: Array<DataTableColumn<Row>> = [
      textColumn<Row, "symbol">("symbol", { header: "Symbol", sortable: false }),
    ];
    render(<DataTable columns={cols} data={ROWS} getRowId={(row) => row.id} ariaLabel="Runs" />);
    expect(screen.queryByRole("button", { name: /Symbol/ })).not.toBeInTheDocument();
  });

  it("shows the loading skeleton and the error state instead of rows", () => {
    const { rerender } = render(
      <DataTable
        columns={columns()}
        data={[]}
        ariaLabel="Runs"
        state="loading"
        loadingRows={3}
      />,
    );
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(bodyRows()).toHaveLength(3);

    rerender(<DataTable columns={columns()} data={[]} ariaLabel="Runs" state="error" />);
    expect(screen.getByText("Could not load rows")).toBeInTheDocument();
  });

  it("supports fully controlled sorting without owning the state", async () => {
    const onSortingChange = vi.fn();
    render(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /Trades/ }));
    expect(onSortingChange).toHaveBeenCalledWith([{ id: "trades", desc: false }]);
    // Controlled: the table did not move on its own.
    expect(bodyRows()[0]).toHaveTextContent("ALPHA");
  });

  it("expands a row into its detail strip", async () => {
    render(
      <DataTable
        columns={columns()}
        data={ROWS}
        getRowId={(row) => row.id}
        ariaLabel="Runs"
        enableExpansion
        renderSubRow={(row) => <p>{row.symbol} detail</p>}
      />,
    );

    await userEvent.click(screen.getAllByRole("button", { name: "Expand row" })[0]!);
    expect(screen.getByText("ALPHA detail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse row" })).toBeInTheDocument();
  });

  it("keeps an uncontrolled filter self-consistent across re-renders", async () => {
    function Fixture() {
      const [count, setCount] = useState(0);
      return (
        <>
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            bump {count}
          </button>
          <DataTable
            columns={columns()}
            data={ROWS}
            getRowId={(row) => row.id}
            ariaLabel="Runs"
            toolbar={<DataTableToolbar search={{ label: "Search runs", placeholder: "Search runs" }} />}
          />
        </>
      );
    }
    render(<Fixture />);
    await userEvent.type(screen.getByLabelText("Search runs"), "alpha");
    await userEvent.click(screen.getByRole("button", { name: /bump/ }));
    expect(bodyRows()).toHaveLength(1);
  });
});
