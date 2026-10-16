import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DistributionChart } from "./distribution-charts";
import { FanChart, RangeBandChart } from "./band-charts";
import { QuadrantScatterChart, ScatterRegressionChart } from "./relationship-charts";
import { EventTimeline, RegimeStrip } from "./sequence-charts";
import { SmallMultiple, SmallMultiples } from "./small-multiples";

/**
 * The research charts are engine-backed, so these tests assert the *contract*
 * rather than the pixels: the plot host mounts with the caller's label, an
 * empty input renders the honest empty state instead of an engine, and none of
 * them throw on the happy path. Pixel/behavioural checks live in the showcase
 * QA and the option-builder tests.
 */

const X = ["2026-01-01", "2026-02-01", "2026-03-01"];

function plotHost() {
  return document.querySelector('[data-slot="echart-surface"]');
}

describe("chart contract", () => {
  it("RangeBandChart mounts a labelled plot and empties gracefully", () => {
    const { rerender } = render(
      <RangeBandChart
        points={[
          { t: X[0]!, center: 1, lower: 0.5, upper: 1.5 },
          { t: X[1]!, center: 1.2, lower: 0.7, upper: 1.7 },
          { t: X[2]!, center: 1.4, lower: 0.9, upper: 1.9 },
        ]}
        ariaLabel="Estimate with interval"
      />,
    );
    expect(plotHost()).toBeInTheDocument();
    expect(screen.getByLabelText("Estimate with interval")).toBeInTheDocument();

    rerender(<RangeBandChart points={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(plotHost()).toBeNull();
  });

  it("FanChart requires both a domain and bands to draw", () => {
    const { rerender } = render(
      <FanChart
        x={X}
        median={[1, 1.2, 1.4]}
        bands={[
          { label: "P5–P95", lower: [0.2, 0.4, 0.6], upper: [1.8, 2.0, 2.2] },
          { label: "P25–P75", lower: [0.6, 0.8, 1.0], upper: [1.4, 1.6, 1.8] },
        ]}
        ariaLabel="Forecast fan"
      />,
    );
    expect(plotHost()).toBeInTheDocument();

    rerender(<FanChart x={X} median={[1, 1.2, 1.4]} bands={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("DistributionChart draws bins and empties on an empty sample", () => {
    const bins = [
      { from: -1, to: 0, count: 8 },
      { from: 0, to: 1, count: 15 },
      { from: 1, to: 2, count: 6 },
    ];
    const { rerender } = render(
      <DistributionChart
        bins={bins}
        references={[{ value: 0.4, label: "Median", kind: "median" }]}
        ariaLabel="Return distribution"
      />,
    );
    expect(plotHost()).toBeInTheDocument();

    rerender(<DistributionChart bins={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("ScatterRegressionChart draws observations with a prepared fit", () => {
    const { rerender } = render(
      <ScatterRegressionChart
        points={[
          { x: -1, y: -0.8 },
          { x: 0, y: 0.1 },
          { x: 1, y: 0.9 },
        ]}
        regression={{ slope: 0.85, intercept: 0.05 }}
        ariaLabel="Beta regression"
      />,
    );
    expect(plotHost()).toBeInTheDocument();

    rerender(<ScatterRegressionChart points={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("QuadrantScatterChart draws the reference lines it was given", () => {
    const { rerender } = render(
      <QuadrantScatterChart
        points={[
          { x: -1, y: 1, label: "A" },
          { x: 1, y: -1, label: "B" },
        ]}
        xReference={0}
        yReference={0}
        quadrantLabels={{ topRight: "Add", topLeft: "Watch" }}
        ariaLabel="Risk vs return"
      />,
    );
    expect(plotHost()).toBeInTheDocument();

    rerender(<QuadrantScatterChart points={[]} xReference={0} yReference={0} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("RegimeStrip needs intervals and a state vocabulary", () => {
    const { rerender } = render(
      <RegimeStrip
        intervals={[
          { start: X[0]!, end: X[1]!, state: "risk-on" },
          { start: X[1]!, end: X[2]!, state: "risk-off" },
        ]}
        states={[
          { state: "risk-on", tone: "positive" },
          { state: "risk-off", tone: "negative" },
        ]}
        ariaLabel="Regime strip"
      />,
    );
    expect(plotHost()).toBeInTheDocument();

    rerender(<RegimeStrip intervals={[]} states={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("EventTimeline groups events by the caller's category", () => {
    const { rerender } = render(
      <EventTimeline
        events={[
          { at: X[0]!, label: "Halving", category: "protocol" },
          { at: X[1]!, label: "FOMC", category: "macro" },
        ]}
        ariaLabel="Event timeline"
      />,
    );
    expect(plotHost()).toBeInTheDocument();

    rerender(<EventTimeline events={[]} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("SmallMultiples lays out labelled panels without owning a chart", () => {
    render(
      <SmallMultiples columns={2} label="Rolling Sharpe">
        <SmallMultiple title="30D" aside="0.94">
          <span>chart one</span>
        </SmallMultiple>
        <SmallMultiple title="1Y" caption="annualised">
          <span>chart two</span>
        </SmallMultiple>
      </SmallMultiples>,
    );
    expect(document.querySelector('[data-slot="small-multiples"]')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="small-multiple"]')).toHaveLength(2);
    // A panel is a figure with a caption, so a screen reader gets the identity.
    expect(screen.getByText("30D").closest("figcaption")).toBeInTheDocument();
    expect(screen.getByText("annualised")).toBeInTheDocument();
  });
});
