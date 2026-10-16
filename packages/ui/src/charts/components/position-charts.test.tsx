import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HistoricalPositionChart } from "./position-charts";

describe("HistoricalPositionChart", () => {
  it("names the current percentile and its value for assistive tech", () => {
    render(
      <HistoricalPositionChart
        percentile={78}
        value="+18.2%"
        percentileLabel="78th percentile"
        ariaLabel="90-day return position"
      />,
    );
    const figure = screen.getByRole("img", { name: "90-day return position" });
    const describedBy = figure.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe("78th percentile · +18.2%");
    expect(screen.getByText("+18.2%")).toBeInTheDocument();
  });

  it("clamps a percentile outside 0–100 rather than overflowing the track", () => {
    render(<HistoricalPositionChart percentile={140} ariaLabel="Position" />);
    const html = screen.getByRole("img", { name: "Position" }).innerHTML;
    expect(html).toMatch(/left:\s*100%/);
    expect(html).not.toMatch(/left:\s*140%/);
  });

  it("shows the honest empty state when no percentile is served", () => {
    render(<HistoricalPositionChart percentile={null} ariaLabel="Position" />);
    expect(screen.queryByRole("img", { name: "Position" })).toBeNull();
    expect(screen.getByText("No percentile")).toBeInTheDocument();
  });

  it("draws the conventional quantile ticks", () => {
    render(<HistoricalPositionChart percentile={50} ariaLabel="Position" />);
    for (const tick of [10, 25, 50, 75, 90]) {
      expect(screen.getByText(String(tick))).toBeInTheDocument();
    }
  });
});
