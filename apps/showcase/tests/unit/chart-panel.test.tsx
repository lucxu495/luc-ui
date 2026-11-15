import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TooltipProvider } from "@luc/ui";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ChartPanel } from "@/components/charts/chart-panel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function click(button: Element | null) {
  if (!button) throw new Error("Expected an interactive element");
  act(() => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("ChartPanel financial demo controls", () => {
  it("turns an empty legend selection into an actionable empty state", () => {
    act(() =>
      root.render(
        <TooltipProvider>
          <ChartPanel
            title="Close comparison"
            series={[
              { id: "portfolio", label: "Portfolio", tone: "accent" },
              { id: "benchmark", label: "Benchmark", tone: "warning" },
            ]}
            defaultVisible={[]}
            emptyWhenNoSeries
            render={({ state }) => <div data-testid="plot" data-state={state} />}
          />
        </TooltipProvider>,
      ),
    );

    expect(container.textContent).toContain("No series selected");
    click(
      [...container.querySelectorAll("button")].find(
        (button) => button.textContent === "Show series",
      ) ?? null,
    );
    expect(container.querySelector('[data-testid="plot"]')?.getAttribute("data-state")).toBe(
      "ready",
    );
    const legend = [...container.querySelectorAll("[data-slot=chart-legend] button")];
    expect(legend).toHaveLength(2);
    expect(legend.every((button) => button.getAttribute("aria-pressed") === "true")).toBe(true);
  });

  it("keeps custom header actions in the fullscreen research view", () => {
    act(() =>
      root.render(
        <TooltipProvider>
          <ChartPanel
            title="Close comparison"
            actions={<button type="button">Volume</button>}
            render={() => <div data-testid="plot" />}
          />
        </TooltipProvider>,
      ),
    );

    const fullscreen =
      [...container.querySelectorAll("button")].find(
        (button) => button.textContent === "Toggle fullscreen",
      ) ?? null;
    click(fullscreen);
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(
      [...document.querySelectorAll("button")].filter((button) => button.textContent === "Volume")
        .length,
    ).toBeGreaterThan(0);
  });
});
