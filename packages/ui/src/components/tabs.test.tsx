import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "./tabs";

function Fixture({ onValueChange }: { onValueChange?: (value: string) => void } = {}) {
  return (
    <Tabs defaultValue="overview" onValueChange={onValueChange}>
      <Tabs.List>
        <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
        <Tabs.Trigger value="metrics">Metrics</Tabs.Trigger>
        <Tabs.Trigger value="data" disabled>
          Data
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="overview">Overview panel</Tabs.Content>
      <Tabs.Content value="metrics">Metrics panel</Tabs.Content>
      <Tabs.Content value="data">Data panel</Tabs.Content>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default panel and switches on click", async () => {
    render(<Fixture />);
    expect(screen.getByText("Overview panel")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Metrics" }));
    expect(screen.getByRole("tab", { name: "Metrics" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Metrics panel")).toBeInTheDocument();
  });

  it("moves between triggers with the arrow keys", async () => {
    render(<Fixture />);
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Metrics" })).toHaveAttribute("aria-selected", "true");
  });

  it("does not activate a disabled trigger", async () => {
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("tab", { name: "Data" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText("Overview panel")).toBeInTheDocument();
  });

  it("gives every trigger a resolvable aria-controls target", () => {
    render(<Fixture />);
    for (const tab of screen.getAllByRole("tab")) {
      const controls = tab.getAttribute("aria-controls");
      if (controls) expect(document.getElementById(controls)).not.toBeNull();
    }
  });
});
