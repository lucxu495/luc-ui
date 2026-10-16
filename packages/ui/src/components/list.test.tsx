import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { List, ListFooter, ListHeader, ListItem } from "./list";

function Recent() {
  return (
    <List aria-label="Recent runs" divided bordered>
      <ListItem
        title="Run 128"
        description="Momentum, 90 days, 12 symbols"
        meta="2m ago"
        leading={<svg />}
      />
      <ListItem title="Run 127" description="Mean reversion, 30 days" meta="1h ago" />
    </List>
  );
}

describe("List", () => {
  it("is a real list — a `ul` of `li` rows a screen reader can count", () => {
    render(<Recent />);
    const list = screen.getByRole("list", { name: "Recent runs" });
    expect(list.tagName).toBe("UL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
  });

  it("puts every row on the same slot order", () => {
    render(<Recent />);
    const [first, second] = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(within(first!).getByText("Run 128")).toBeInTheDocument();
    expect(within(first!).getByText("2m ago")).toBeInTheDocument();
    expect(within(second!).getByText("Run 127")).toBeInTheDocument();
    /* A row without a leading mark still renders title, description and meta. */
    expect(within(second!).getByText("Mean reversion, 30 days")).toBeInTheDocument();
  });

  it("keeps one border for the whole list instead of one per row", () => {
    render(<Recent />);
    const list = screen.getByRole("list");
    expect(list.className).toContain("border");
    const row = within(list).getAllByRole("listitem")[0]!;
    expect(row.className).not.toContain("border");
  });

  it("renders its edges as the surfaces around the rows", () => {
    render(
      <div>
        <ListHeader title="Recent runs" description="Last 24 hours" actions={<button>New run</button>} />
        <Recent />
        <ListFooter>Showing 2 of 1,284</ListFooter>
      </div>,
    );
    expect(screen.getByText("Recent runs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New run" })).toBeInTheDocument();
    expect(screen.getByText("Showing 2 of 1,284")).toBeInTheDocument();
  });

  it("carries the caller's own attributes through to the element", () => {
    render(<ListItem data-testid="row" title="One" aria-current="true" />);
    expect(screen.getByTestId("row")).toHaveAttribute("aria-current", "true");
  });
});
