import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { Result } from "./result";

describe("Result", () => {
  it("renders the outcome, what to do next, and both actions", () => {
    render(
      <Result
        status="success"
        title="Import finished"
        description="1,284 bars were written for BTCUSDT 1h."
        extra={
          <>
            <Button>Open the dataset</Button>
            <Button variant="ghost">Import another</Button>
          </>
        }
      />,
    );
    expect(screen.getByText("Import finished")).toBeInTheDocument();
    expect(screen.getByText("1,284 bars were written for BTCUSDT 1h.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open the dataset" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import another" })).toBeInTheDocument();
  });

  it("carries the status on the element, so a consumer can style a tone", () => {
    render(<Result status="warning" title="Two rows were skipped" />);
    const result = screen.getByText("Two rows were skipped").closest("[data-slot=result]");
    expect(result).toHaveAttribute("data-status", "warning");
  });

  it("is the page's heading by default, and yields when it is not", () => {
    const { unmount } = render(<Result status="error" title="Backfill failed" />);
    expect(screen.getByRole("heading", { level: 1, name: "Backfill failed" })).toBeInTheDocument();
    unmount();
    render(<Result status="error" title="Backfill failed" titleAs="h3" size="sm" />);
    expect(screen.getByRole("heading", { level: 3, name: "Backfill failed" })).toBeInTheDocument();
  });

  it("invents no live region, and takes one when the caller means it", () => {
    const { unmount } = render(<Result status="info" title="Nothing changed" />);
    expect(screen.getByText("Nothing changed").closest("[data-slot=result]")).not.toHaveAttribute("role");
    unmount();
    render(<Result status="info" title="Nothing changed" role="status" />);
    expect(screen.getByRole("status")).toHaveTextContent("Nothing changed");
  });

  it("lets a caller replace the mark, and remove it", () => {
    const { unmount } = render(
      <Result status="empty" title="No backtests yet" icon={<svg data-testid="mark" />} />,
    );
    expect(screen.getByTestId("mark")).toBeInTheDocument();
    unmount();
    render(<Result status="empty" title="No backtests yet" icon={null} />);
    expect(screen.queryByTestId("mark")).not.toBeInTheDocument();
    /* Removing the mark must not remove the outcome. */
    expect(screen.getByText("No backtests yet")).toBeInTheDocument();
  });
});
