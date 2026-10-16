import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartDataTable } from "./chart-data-table";

const ROWS = [
  // Percentages arrive already scaled, per LUC's "never convert units" rule.
  { time: Date.UTC(2026, 0, 3), close: 101_250.5, rv30: 42 },
  { time: Date.UTC(2026, 0, 2), close: 99_800.25, rv30: 38 },
];

describe("ChartDataTable", () => {
  it("exposes the chart's numbers as a semantic table", () => {
    render(
      <ChartDataTable
        rows={ROWS}
        xKey="time"
        xLabel="Date"
        series={[
          { key: "close", label: "Close", format: { kind: "currency", currency: "USD", decimals: 2 } },
          { key: "rv30", label: "RV 30d", format: { kind: "percent", decimals: 1 } },
        ]}
        caption="Close and realised volatility"
      />,
    );

    const table = screen.getByRole("table", { name: "Close and realised volatility" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent)).toEqual([
      "Date",
      "Close",
      "RV 30d",
    ]);
    // Sorted newest first by default, and formatted with the caller's formats.
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("$101,250.50");
    expect(rows[0]).toHaveTextContent("42.0%");
  });

  it("omits series the caller did not pass, so a hidden legend series disappears", () => {
    render(
      <ChartDataTable
        rows={ROWS}
        xKey="time"
        series={[{ key: "close", label: "Close" }]}
        caption="Close only"
      />,
    );
    const table = screen.getByRole("table", { name: "Close only" });
    expect(within(table).queryByRole("columnheader", { name: "RV 30d" })).not.toBeInTheDocument();
  });

  it("renders an em dash instead of inventing a number", () => {
    render(
      <ChartDataTable
        rows={[{ time: Date.UTC(2026, 0, 1), close: null }]}
        xKey="time"
        series={[{ key: "close", label: "Close" }]}
        caption="Gaps"
        pageSize={0}
      />,
    );
    expect(screen.getByRole("table", { name: "Gaps" })).toHaveTextContent("—");
  });
});
