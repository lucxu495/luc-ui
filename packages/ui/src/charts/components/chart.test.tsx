import { describe, expect, it, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChartSurface, useChartRange, useSeriesVisibility } from "./chart";
import { ChartLegend, RangeSelector, ScaleSelector } from "../chart-card";
import { FullscreenResearchView } from "./fullscreen";

const SERIES = [
  { id: "close", label: "Close", tone: "accent" },
  { id: "sma50", label: "SMA 50", tone: "info" },
];

describe("ChartSurface states", () => {
  it("renders a skeleton while loading and never mounts an engine", () => {
    render(<ChartSurface option={{}} state="loading" />);
    expect(screen.getByText("Loading chart")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="echart-surface"]')).toBeNull();
  });

  it("explains an empty chart and offers the fixing action", () => {
    render(
      <ChartSurface
        option={{}}
        state="empty"
        copy={{ emptyTitle: "No rows", emptyDescription: "Pick a window.", emptyAction: <span>Reset</span> }}
      />,
    );
    expect(screen.getByText("No rows")).toBeInTheDocument();
    expect(screen.getByText("Pick a window.")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="echart-surface"]')).toBeNull();
  });

  it("renders the error state with a retry affordance", () => {
    render(<ChartSurface option={{}} state="error" copy={{ errorTitle: "Provider failed" }} />);
    expect(screen.getByText("Provider failed")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="echart-surface"]')).toBeNull();
  });
});

describe("ChartLegend", () => {
  it("exposes visibility as a pressed state and toggles a series", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<ChartLegend series={SERIES} visible={["close"]} onToggle={onToggle} />);

    const close = screen.getByRole("button", { name: /Close/ });
    const sma = screen.getByRole("button", { name: /SMA 50/ });
    expect(close).toHaveAttribute("aria-pressed", "true");
    expect(sma).toHaveAttribute("aria-pressed", "false");

    await user.click(sma);
    expect(onToggle).toHaveBeenCalledWith("sma50");
  });

  /*
   * The legend is the plot's decoding key: when a caller declares how a series
   * was drawn, the sample must reproduce that encoding (a bar is not drawn as a
   * line, a dashed series is not drawn solid), and a caller that declares none
   * keeps the plain colour chip.
   */
  it("reproduces the drawn encoding when the caller declares it", () => {
    const { container } = render(
      <ChartLegend
        series={[
          { id: "funding", label: "Funding", color: "var(--accent-default)", mark: "bar" },
          { id: "sma200", label: "SMA 200", color: "var(--info)", mark: "line", line: "dashed", weight: "thin" },
          { id: "close", label: "Close", tone: "accent" },
        ]}
        visible={["funding", "sma200", "close"]}
        onToggle={() => {}}
      />,
    );

    const funding = screen.getByRole("button", { name: /Funding/ });
    const sma = screen.getByRole("button", { name: /SMA 200/ });
    const close = screen.getByRole("button", { name: /Close/ });
    expect(funding.querySelector("rect")).not.toBeNull();
    expect(sma.querySelector("line")?.getAttribute("stroke-dasharray")).toBe("5 4");
    expect(close.querySelector("svg")).toBeNull();
    expect(container.querySelectorAll('[data-slot="chart-legend"] li')).toHaveLength(3);
  });
});

describe("RangeSelector", () => {
  it("reports the chosen range through a single-selection control", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<RangeSelector ranges={["1m", "1y", "all"]} value="1y" onValueChange={onValueChange} />);

    const oneYear = screen.getByRole("radio", { name: "1y" });
    expect(oneYear).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("radio", { name: "1m" }));
    expect(onValueChange).toHaveBeenCalledWith("1m");
  });
});

describe("ScaleSelector", () => {
  it("renders nothing when the chart has a single valid mode", () => {
    const { container } = render(
      <ScaleSelector allowed={["linear"]} value="linear" onValueChange={() => {}} />,
    );
    expect(container.querySelector('[data-slot="chart-scale"]')).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("offers both modes with an accessible selected state", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<ScaleSelector allowed={["linear", "log"]} value="log" onValueChange={onValueChange} />);

    const control = screen.getByRole("radiogroup");
    expect(control).toHaveAttribute("data-scale", "log");
    expect(screen.getByRole("radio", { name: "Log" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Linear" })).toHaveAttribute("aria-checked", "false");

    await user.click(screen.getByRole("radio", { name: "Linear" }));
    expect(onValueChange).toHaveBeenCalledWith("linear");
  });

  it("takes its copy from the caller so a localized page stays localized", () => {
    render(
      <ScaleSelector
        allowed={["linear", "log"]}
        value="linear"
        onValueChange={() => {}}
        labels={{ linear: "线性", log: "对数" }}
      />,
    );
    expect(screen.getByRole("radio", { name: "线性" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "对数" })).toBeInTheDocument();
  });
});

describe("useSeriesVisibility", () => {
  it("starts from the declared defaults and toggles without refetching anything", () => {
    const { result } = renderHook(() =>
      useSeriesVisibility(
        [
          { key: "close", visibleByDefault: true },
          { key: "sma50", visibleByDefault: false },
        ],
      ),
    );
    expect(result.current.visible).toEqual(["close"]);

    act(() => result.current.toggle("sma50"));
    expect(result.current.visible).toEqual(["close", "sma50"]);

    act(() => result.current.toggle("close"));
    expect(result.current.visible).toEqual(["sma50"]);
  });
});

describe("useChartRange", () => {
  it("defaults to the spec default and exposes the supported ranges", () => {
    const { result } = renderHook(() =>
      useChartRange({ ranges: { ranges: ["1m", "1y"], default: "1m" } }),
    );
    expect(result.current.range).toBe("1m");
    expect(result.current.ranges).toEqual(["1m", "1y"]);
  });
});

describe("FullscreenResearchView", () => {
  it("renders a research workspace and closes on Escape", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <FullscreenResearchView
        open
        onOpenChange={onOpenChange}
        title="Close price"
        description="Daily bars"
        ranges={["1m", "1y"]}
        range="1y"
        onRangeChange={() => {}}
        renderChart={({ height }) => <div data-testid="fullscreen-chart">{height}</div>}
        legend={<span>Legend</span>}
      />,
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Close price")).toBeInTheDocument();
    expect(screen.getByTestId("fullscreen-chart")).toHaveTextContent("100%");

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  /*
   * The expanded inspector is **viewport-centred, and the shell has no say**.
   *
   * The previous version padded the centring frame with the measured rail and
   * outline widths ("fill the page's region"), which moved the panel's centre to
   * the *workspace* centre — +120px to the right on a page with a left rail and no
   * right column. jsdom has no layout, so what is pinnable here is the rule: the
   * positioning frame gets no padding derived from the shell, and the panel sizes
   * itself from the viewport model.
   */
  it("centres the panel on the viewport, with no shell-derived padding", async () => {
    render(
      <FullscreenResearchView open onOpenChange={() => {}} title="Close price" renderChart={() => <div />} />,
    );

    await screen.findByRole("dialog");
    // `data-slot` carries the panel's own box: the `role="dialog"` element is the
    // full-viewport positioning frame around it.
    const panel = document.querySelector<HTMLElement>('[data-slot="fullscreen-research-panel"]');
    if (!panel) throw new Error("Fullscreen research panel did not render");
    const frame = panel.parentElement as HTMLElement;
    expect(frame.className).toContain("fixed");
    expect(frame.className).toContain("inset-0");
    expect(frame.className).toContain("items-center");
    expect(frame.className).toContain("justify-center");
    // No shell measurement participates: the frame has no padding of its own.
    expect(frame.style.paddingLeft).toBe("");
    expect(frame.style.paddingRight).toBe("");
    // The panel opens large (the viewport model, applied after mount) — an
    // 88% × 84% workspace rather than a card.
    expect(panel.style.width).not.toBe("");
    expect(panel.style.height).not.toBe("");
    expect(Number.parseFloat(panel.style.width)).toBeGreaterThan(600);
    expect(Number.parseFloat(panel.style.height)).toBeGreaterThan(400);
  });

  /*
   * The panel is resizable from all eight directions, and the four *edges* are
   * the accessible controls while the corners are pointer affordances (both axes
   * stay reachable from the keyboard through the edges).
   */
  it("offers eight resize handles, four of them real separators", async () => {
    render(
      <FullscreenResearchView open onOpenChange={() => {}} title="Close price" renderChart={() => <div />} />,
    );
    await screen.findByRole("dialog");
    const handles = [...document.querySelectorAll('[data-slot="inspector-resize-handle"]')];
    expect(handles.map((handle) => handle.getAttribute("data-handle")).sort()).toEqual([
      "bottom",
      "bottom-left",
      "bottom-right",
      "left",
      "right",
      "top",
      "top-left",
      "top-right",
    ]);
    const separators = await screen.findAllByRole("separator");
    expect(separators).toHaveLength(4);
    for (const separator of separators) {
      expect(separator.getAttribute("aria-label")).toBeTruthy();
      expect(separator.getAttribute("aria-valuenow")).toBeTruthy();
      expect(separator.getAttribute("aria-valuemin")).toBeTruthy();
      expect(separator.getAttribute("aria-valuemax")).toBeTruthy();
      expect(separator).toHaveAttribute("tabindex", "0");
    }
  });
});
