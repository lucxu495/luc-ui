import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chartSyncBus } from "./sync";
import { ChartInspectionArea, ChartInspectionProvider, ChartPinButton, ChartPinStatus } from "./inspection";

afterEach(() => {
  chartSyncBus.reset();
  vi.restoreAllMocks();
});

function Harness({ isolated = false }: { isolated?: boolean }) {
  return (
    <ChartInspectionProvider groupId="sync" isolated={isolated}>
      <ChartPinButton />
      <ChartPinStatus format={(value) => new Date(value).toISOString().slice(0, 10)} />
    </ChartInspectionProvider>
  );
}

/** The bus delivers a hover on the next frame, so wait for the pin to arm. */
async function pinCurrent(user: ReturnType<typeof userEvent.setup>) {
  const pin = screen.getByRole("button", { name: "Pin inspection" });
  await waitFor(() => expect(pin).toBeEnabled());
  await user.click(pin);
}

describe("pinned chart inspection", () => {
  it("cannot pin before there is a hover to pin", () => {
    render(<Harness />);
    expect(screen.getByRole("button", { name: "Pin inspection" })).toBeDisabled();
  });

  it("pins the hovered x, publishes it to the group and shows the pin state", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    chartSyncBus.publishCursor("sync", Date.UTC(2026, 5, 20), "chart-a");
    await pinCurrent(user);

    expect(chartSyncBus.getPinned("sync")).toBe(Date.UTC(2026, 5, 20));
    expect(screen.getByRole("button", { name: "Unpin inspection" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("2026-06-20")).toBeInTheDocument();
  });

  it("unpins and clears the crosshair for every chart", async () => {
    const user = userEvent.setup();
    const onCursor = vi.fn();
    chartSyncBus.subscribe("sync", { id: "chart-b", onCursor });
    render(<Harness />);
    chartSyncBus.publishCursor("sync", 1_000, "chart-a");
    await pinCurrent(user);
    await user.click(screen.getByRole("button", { name: "Unpin inspection" }));
    expect(chartSyncBus.getPinned("sync")).toBeNull();
    expect(onCursor).toHaveBeenLastCalledWith(null);
  });

  it("keeps a pinned value steady when the pointer keeps moving", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    chartSyncBus.publishCursor("sync", 5_000, "chart-a");
    await pinCurrent(user);
    chartSyncBus.publishCursor("sync", 9_000, "chart-a");
    expect(chartSyncBus.getPinned("sync")).toBe(5_000);
    expect(chartSyncBus.getCursor("sync")).toBe(5_000);
  });

  it("uses a private bus when isolated", () => {
    render(<Harness isolated />);
    // The shared bus never sees the pin, so two workspaces stay independent.
    chartSyncBus.publishCursor("sync", 4_000, "chart-a");
    expect(chartSyncBus.getPinned("sync")).toBeNull();
  });
});

describe("keyboard chart inspection", () => {
  const xValues = [Date.UTC(2026, 5, 18), Date.UTC(2026, 5, 19), Date.UTC(2026, 5, 20)];

  function KeyboardHarness() {
    return (
      <ChartInspectionProvider groupId="sync">
        <ChartInspectionArea xValues={xValues} format={(value) => new Date(value).toISOString().slice(0, 10)}>
          <div style={{ height: 200 }} />
        </ChartInspectionArea>
        <ChartPinStatus format={(value) => new Date(value).toISOString().slice(0, 10)} />
      </ChartInspectionProvider>
    );
  }

  it("is a labelled, focusable region", () => {
    render(<KeyboardHarness />);
    const area = screen.getByRole("group");
    expect(area).toHaveAttribute("tabindex", "0");
    expect(area.getAttribute("aria-label")).toMatch(/arrow keys/i);
  });

  it("steps across the prepared x values and announces each one", async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness />);
    await user.tab();
    expect(screen.getByRole("group")).toHaveFocus();

    // Stepping starts at the most recent point, then walks backwards.
    await user.keyboard("{ArrowLeft}");
    expect(chartSyncBus.getPinned("sync")).toBe(xValues[1]);
    await user.keyboard("{Home}");
    expect(chartSyncBus.getPinned("sync")).toBe(xValues[0]);
    await user.keyboard("{End}");
    expect(chartSyncBus.getPinned("sync")).toBe(xValues[2]);
    expect(screen.getByRole("status")).toHaveTextContent("2026-06-20");
  });

  it("clamps at both ends instead of wrapping", async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness />);
    await user.tab();
    await user.keyboard("{Home}{ArrowLeft}{ArrowLeft}");
    expect(chartSyncBus.getPinned("sync")).toBe(xValues[0]);
    await user.keyboard("{End}{ArrowRight}");
    expect(chartSyncBus.getPinned("sync")).toBe(xValues[2]);
  });

  it("pins and clears with Enter and Escape", async () => {
    const user = userEvent.setup();
    render(<KeyboardHarness />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(chartSyncBus.getPinned("sync")).toBe(xValues[2]);
    await user.keyboard("{Enter}");
    expect(chartSyncBus.getPinned("sync")).toBeNull();
    await user.keyboard("{ArrowLeft}");
    // With nothing pinned the cursor restarts at the most recent point.
    expect(chartSyncBus.getPinned("sync")).toBe(xValues[1]);
    await user.keyboard("{Escape}");
    expect(chartSyncBus.getPinned("sync")).toBeNull();
  });

  it("passes children through unchanged outside an inspection provider", () => {
    render(
      <ChartInspectionArea xValues={xValues} data-testid="bare">
        <span>Plot</span>
      </ChartInspectionArea>,
    );
    const area = screen.getByTestId("bare");
    expect(area).not.toHaveAttribute("tabindex");
    expect(area).toHaveTextContent("Plot");
  });
});
