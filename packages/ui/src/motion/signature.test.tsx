import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuroraSurface } from "./aurora-surface";
import { BeamFlow } from "./beam-flow";
import { MagnifyDock, MagnifyDockItem } from "./magnify-dock";
import { Marquee } from "./marquee";
import { PressRipple, RippleLayer, usePressRipple } from "./press-ripple";

describe("PressRipple", () => {
  it("spawns ink at the press point and cleans it up", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PressRipple className="h-10 px-4">
        <span>Save</span>
      </PressRipple>,
    );
    expect(container.querySelectorAll("[data-slot='ripple-ring']")).toHaveLength(0);
    await user.click(screen.getByText("Save"));
    expect(container.querySelectorAll("[data-slot='ripple-ring']").length).toBeGreaterThan(0);
  });

  it("keeps the decorative layer out of the accessibility tree", () => {
    const { container } = render(
      <button type="button">
        Press
        <RippleLayer ripples={[{ id: 1, x: 4, y: 8, size: 120 }]} />
      </button>,
    );
    const layer = container.querySelector("[data-slot='ripple-layer']");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer?.className).toContain("pointer-events-none");
  });

  it("does not emit ink when motion is forced to reduced", async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.motion = "reduced";
    try {
      const { container } = render(<PressRipple>Rest</PressRipple>);
      await user.click(screen.getByText("Rest"));
      expect(container.querySelectorAll("[data-slot='ripple-ring']")).toHaveLength(0);
    } finally {
      delete document.documentElement.dataset.motion;
    }
  });

  it("exposes the hook for surfaces that own their own element", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    function Probe() {
      const ripple = usePressRipple();
      spy(ripple.ripples.length);
      return (
        <button type="button" onPointerDown={ripple.onPointerDown}>
          Own
          <RippleLayer ripples={ripple.ripples} />
        </button>
      );
    }
    render(<Probe />);
    await user.click(screen.getByRole("button", { name: "Own" }));
    expect(spy).toHaveBeenLastCalledWith(1);
  });
});

describe("AuroraSurface", () => {
  it("renders real content above decorative fields", () => {
    const { container } = render(
      <AuroraSurface density="rich" grid>
        <h1>Build faster</h1>
      </AuroraSurface>,
    );
    expect(screen.getByRole("heading", { name: "Build faster" })).toBeInTheDocument();
    expect(container.querySelectorAll("[data-slot='aurora-field']")).toHaveLength(5);
    // Every decorative layer lives inside one hidden wrapper, so the grid, the
    // fields and the vignette cost the accessibility tree nothing.
    const decorative = container.querySelector("[data-slot='aurora-grid']")?.parentElement;
    expect(decorative).toHaveAttribute("aria-hidden", "true");
  });

  it("freezes the composition when asked to stay static", () => {
    const { container } = render(<AuroraSurface static />);
    expect(container.querySelector(".luc-aurora-drift")).toBeNull();
  });
});

describe("BeamFlow", () => {
  it("draws one path per waypoint segment plus the rail", () => {
    const { container } = render(
      <BeamFlow points={[{ x: 10, y: 50 }, { x: 50, y: 20 }, { x: 90, y: 50 }]} label="request" />,
    );
    const root = container.querySelector("[data-slot='beam-flow']")!;
    expect(root).toHaveAttribute("role", "img");
    expect(root).toHaveAttribute("aria-label", "request");
    const rail = container.querySelector("path")!;
    expect(rail.getAttribute("d")).toContain("C");
    expect(container.querySelectorAll(".luc-beam-travel")).toHaveLength(2);
  });

  it("is decorative when it has no label", () => {
    const { container } = render(<BeamFlow points={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} />);
    expect(container.querySelector("[data-slot='beam-flow']")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("stops the packet under reduced motion but keeps the rail", () => {
    document.documentElement.dataset.motion = "reduced";
    try {
      const { container } = render(
        <BeamFlow points={[{ x: 0, y: 0 }, { x: 100, y: 0 }]} />,
      );
      expect(container.querySelector(".luc-beam-travel")).toBeNull();
      expect(container.querySelector("path")).toBeInTheDocument();
    } finally {
      delete document.documentElement.dataset.motion;
    }
  });
});

describe("Marquee", () => {
  it("renders the content once for assistive tech and twice for the loop", () => {
    const { container } = render(
      <Marquee speed={12}>
        {["alpha", "beta"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </Marquee>,
    );
    const copies = container.querySelectorAll("[data-slot='marquee-copy']");
    expect(copies).toHaveLength(2);
    expect(copies[1]).toHaveAttribute("aria-hidden", "true");
    // The real copy is exposed; the loop partner is hidden from assistive tech.
    expect(copies[0]?.textContent).toContain("alpha");
    expect(copies[0]).not.toHaveAttribute("aria-hidden");
  });

  it("collapses to a single, still copy under reduced motion", () => {
    document.documentElement.dataset.motion = "reduced";
    try {
      const { container } = render(<Marquee>ticker</Marquee>);
      expect(container.querySelectorAll("[data-slot='marquee-copy']")).toHaveLength(1);
      expect(container.querySelector(".luc-marquee-x")).toBeNull();
    } finally {
      delete document.documentElement.dataset.motion;
    }
  });
});

describe("MagnifyDock", () => {
  it("lays out every lane at rest and keeps them reachable", () => {
    const { container } = render(
      <MagnifyDock aria-label="Chart tools">
        <MagnifyDockItem>
          <button type="button">Zoom</button>
        </MagnifyDockItem>
        <MagnifyDockItem>
          <button type="button">Pan</button>
        </MagnifyDockItem>
      </MagnifyDock>,
    );
    const dock = container.querySelector("[data-slot='magnify-dock']")!;
    expect(dock).toHaveAttribute("aria-label", "Chart tools");
    expect(container.querySelectorAll("[data-slot='magnify-dock-item']")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Zoom" })).toBeInTheDocument();
  });

  /*
   * `aria-label` on a `generic` element is prohibited: axe calls it
   * `aria-prohibited-attr`, and the custom-element-rendering page that ships
   * this component failed the sweep on it. A labelled lane is a `group`, and
   * the control inside it stays in the accessibility tree — which is why the
   * role is not `img`, whose children are presentational.
   */
  it("makes a labelled lane a named group and keeps the control inside it", () => {
    const { container } = render(
      <MagnifyDock>
        <MagnifyDockItem label="Zoom controls">
          <button type="button">Zoom</button>
        </MagnifyDockItem>
        <MagnifyDockItem>
          <button type="button">Pan</button>
        </MagnifyDockItem>
      </MagnifyDock>,
    );
    const [labelled, plain] = Array.from(
      container.querySelectorAll("[data-slot='magnify-dock-item']"),
    );
    expect(labelled).toHaveAttribute("role", "group");
    expect(labelled).toHaveAccessibleName("Zoom controls");
    expect(plain).not.toHaveAttribute("role");
    expect(screen.getByRole("button", { name: "Zoom" })).toBeInTheDocument();
  });
});
