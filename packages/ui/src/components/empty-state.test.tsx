import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders a title, description and both actions", () => {
    render(
      <EmptyState
        title="No runs match these filters"
        description="Widen the date range or clear the status filter."
        action={<Button>Clear filters</Button>}
        secondaryAction={<Button variant="ghost">Reset view</Button>}
      />,
    );
    expect(screen.getByText("No runs match these filters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset view" })).toBeInTheDocument();
  });

  it("is static content — no live region is invented", () => {
    render(<EmptyState title="Nothing selected" />);
    expect(screen.getByText("Nothing selected").closest("[data-slot=empty-state]")).not.toHaveAttribute("role");
  });

  it("keeps the heading level under the consumer's control", () => {
    render(<EmptyState title="No charts" titleAs="h3" />);
    expect(screen.getByRole("heading", { level: 3, name: "No charts" })).toBeInTheDocument();
  });

  it("has a compact size for table regions and panes", () => {
    render(<EmptyState size="sm" title="No rows" icon={<svg />} />);
    expect(screen.getByText("No rows").closest("[data-slot=empty-state]")).toHaveAttribute("data-size", "sm");
  });
});
