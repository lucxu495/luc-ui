import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Collapse } from "./collapse";
import { DataChangeFlash } from "./data-change-flash";
import { FadeSwap, Presence } from "./presence";
import { SharedHighlight } from "./shared-highlight";
import { StaggerGroup, StaggerItem } from "./stagger";
import { chartMotion, duration, easing, distance, spring, transitionCss } from "./tokens";

describe("motion tokens", () => {
  it("names durations by intent and keeps them ordered", () => {
    expect(duration.instant).toBeLessThan(duration.fast);
    expect(duration.fast).toBeLessThan(duration.normal);
    expect(duration.normal).toBeLessThan(duration.slow);
    expect(duration.slow).toBeLessThan(duration.deliberate);
  });

  it("exposes the spring presets and the chart budget", () => {
    expect(spring.soft.stiffness).toBeLessThan(spring.responsive.stiffness);
    expect(spring.responsive.stiffness).toBeLessThan(spring.snappy.stiffness);
    expect(chartMotion.update).toBeLessThan(chartMotion.intro);
    expect(distance.xs).toBeLessThan(distance.sm);
  });

  it("builds a CSS transition from the tokens rather than a literal", () => {
    const css = transitionCss("opacity", "fast", "enter");
    expect(css).toContain("140ms");
    expect(css).toContain(`cubic-bezier(${easing.enter.join(", ")})`);
  });
});

describe("StaggerGroup", () => {
  it("renders every item and exposes the group/items for QA", () => {
    const { container } = render(
      <StaggerGroup step={0.02}>
        <StaggerItem index={0}>one</StaggerItem>
        <StaggerItem index={1}>two</StaggerItem>
      </StaggerGroup>,
    );
    expect(container.querySelector('[data-slot="stagger-group"]')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="stagger-item"]')).toHaveLength(2);
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
  });
});

describe("Collapse", () => {
  it("exposes the trigger state and only mounts content when open", async () => {
    const { rerender } = render(
      <Collapse open={false} title="Method">
        <p>detail body</p>
      </Collapse>,
    );
    const trigger = screen.getByRole("button", { name: /method/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByText("detail body")).toBeNull();

    rerender(
      <Collapse open title="Method">
        <p>detail body</p>
      </Collapse>,
    );
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("detail body")).toBeInTheDocument();
  });

  it("is operable by keyboard through the native button", async () => {
    render(
      <Collapse open={false} title="Robustness">
        <p>body</p>
      </Collapse>,
    );
    const trigger = screen.getByRole("button", { name: /robustness/i });
    trigger.focus();
    expect(trigger).toHaveFocus();
    // The trigger is a real button, so activation is the platform's, not ours.
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("type", "button");
  });
});

describe("SharedHighlight", () => {
  it("marks exactly the active item and glides a single indicator", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    const { container } = render(
      <SharedHighlight
        value="1y"
        onValueChange={(next) => changes.push(next)}
        items={[
          { value: "3m", label: "3M" },
          { value: "1y", label: "1Y" },
          { value: "max", label: "MAX" },
        ]}
      />,
    );
    const pressed = [...container.querySelectorAll("[data-active='true']")];
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent("1Y");
    // One highlight element, not one per item.
    expect(container.querySelectorAll("[data-slot='shared-highlight-thumb']").length).toBeLessThanOrEqual(1);

    await user.click(screen.getByRole("button", { name: "MAX" }));
    expect(changes).toEqual(["max"]);
  });

  it("re-navigating an already-active item reports nothing", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    render(
      <SharedHighlight
        value="1y"
        onValueChange={(next) => changes.push(next)}
        items={[
          { value: "1y", label: "1Y" },
          { value: "max", label: "MAX" },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "1Y" }));
    expect(changes).toEqual([]);
  });

  it("renders links for navigation items, buttons for state items", () => {
    render(
      <SharedHighlight
        value="overview"
        items={[
          { value: "overview", label: "Overview", href: "/en/assets/btc/overview" },
          { value: "signal", label: "Signals", href: "/en/assets/btc/signals" },
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: "Signals" });
    expect(link).toHaveAttribute("href", "/en/assets/btc/signals");
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  });

  it("uses navigation semantics for links, including the underline variant", () => {
    render(
      <SharedHighlight
        ariaLabel="Research pages"
        variant="underline"
        value="overview"
        items={[
          { value: "overview", label: "Overview", href: "/overview" },
          { value: "signals", label: "Signals", href: "/signals" },
        ]}
      />,
    );
    const navigation = screen.getByRole("navigation", { name: "Research pages" });
    expect(navigation).toContainElement(screen.getByRole("link", { name: "Overview" }));
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("uses pressed buttons with native keyboard selection in underline mode", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    render(
      <SharedHighlight
        ariaLabel="Range"
        variant="underline"
        value="1y"
        onValueChange={(next) => changes.push(next)}
        items={[{ value: "1y", label: "1Y" }, { value: "max", label: "MAX" }]}
      />,
    );
    const group = screen.getByRole("group", { name: "Range" });
    const active = screen.getByRole("button", { name: "1Y" });
    const next = screen.getByRole("button", { name: "MAX" });
    expect(group).toContainElement(next);
    expect(active).toHaveAttribute("aria-pressed", "true");
    expect(next).toHaveAttribute("aria-pressed", "false");
    expect(next).toHaveClass("luc-focus");
    next.focus();
    await user.keyboard("{Enter}");
    expect(changes).toEqual(["max"]);
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("removes indicator travel under reduced motion", async () => {
    document.documentElement.dataset.motion = "reduced";
    try {
      const { container } = render(
        <SharedHighlight
          variant="underline"
          value="1y"
          items={[{ value: "1y", label: "1Y" }, { value: "max", label: "MAX" }]}
        />,
      );
      await waitFor(() => expect(container.querySelector('[data-slot="shared-highlight-underline"]')).not.toBeNull());
      const indicator = container.querySelector('[data-slot="shared-highlight-underline"]');
      expect(indicator?.className).not.toContain("transition:transform");
    } finally {
      delete document.documentElement.dataset.motion;
    }
  });
});

describe("Presence", () => {
  it("mounts nothing when absent and the child when present", () => {
    const { rerender } = render(
      <Presence present={false}>
        <span>panel</span>
      </Presence>,
    );
    expect(screen.queryByText("panel")).toBeNull();
    rerender(
      <Presence present>
        <span>panel</span>
      </Presence>,
    );
    expect(screen.getByText("panel")).toBeInTheDocument();
  });
});

describe("FadeSwap", () => {
  it("keys the slot so a change swaps rather than stacking", () => {
    const { container, rerender } = render(<FadeSwap slot="sharpe">0.94</FadeSwap>);
    expect(container.querySelector('[data-slot-key="sharpe"]')).toBeInTheDocument();
    rerender(<FadeSwap slot="vol">27.8%</FadeSwap>);
    expect(container.querySelector('[data-slot-key="vol"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot-key="sharpe"]')).toBeNull();
  });
});

describe("DataChangeFlash", () => {
  it("does not flash on the first observation", () => {
    const { container } = render(
      <DataChangeFlash value={10}>
        <span>$10</span>
      </DataChangeFlash>,
    );
    expect(container.querySelector('[data-slot="data-change-flash"]')).not.toHaveAttribute("data-flashing");
  });

  it("flashes when the value actually changes", async () => {
    const { container, rerender } = render(
      <DataChangeFlash value={10} tone="positive">
        <span>$10</span>
      </DataChangeFlash>,
    );
    rerender(
      <DataChangeFlash value={11} tone="positive">
        <span>$11</span>
      </DataChangeFlash>,
    );
    expect(container.querySelector('[data-slot="data-change-flash"]')).toHaveAttribute("data-flashing", "true");
  });

  it("never flashes under reduced motion", () => {
    document.documentElement.dataset.motion = "reduced";
    try {
      const { container, rerender } = render(<DataChangeFlash value={10}>a</DataChangeFlash>);
      rerender(<DataChangeFlash value={11}>b</DataChangeFlash>);
      expect(container.querySelector('[data-slot="data-change-flash"]')).not.toHaveAttribute("data-flashing");
    } finally {
      delete document.documentElement.dataset.motion;
    }
  });
});
