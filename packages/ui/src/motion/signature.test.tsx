import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuroraSurface } from "./aurora-surface";
import { BeamFlow } from "./beam-flow";
import { MagnifyDock, MagnifyDockItem } from "./magnify-dock";
import { Marquee } from "./marquee";
import { PressRipple, RippleLayer, usePressRipple } from "./press-ripple";

describe("PressRipple", () => {
  /*
   * Every case that looks at ink has to own the clock.
   *
   * A ring is removed by `setTimeout(duration + 60)`, so "there is ink on the
   * surface" is true only inside a window the component opens and closes on its
   * own — an assertion about it is an assertion about *when the assertion runs*.
   * It passed on an idle machine and failed under load, which is the worst kind
   * of test: the reporter cannot reproduce it and the component is innocent.
   * Measured 2026-10-17 with a 900ms real wait before the assertion in the hook
   * case: last call `0`, not `1`.
   *
   * So time is faked and the *lifecycle* is asserted instead — the ink arrives
   * when the press happens and is gone when the ring's lifetime has passed, both
   * of which are the component's contract rather than the scheduler's mood.
   * `duration={120}` keeps the arithmetic in the test instead of depending on the
   * 620ms default. The press is dispatched with `fireEvent.pointerDown` rather
   * than `userEvent.click`: the component listens to `pointerdown` only, and
   * `userEvent` drives the whole pointer protocol through timers, which deadlocks
   * against a faked clock (measured: the hook case timed out at 5s when it did).
   * A press whose coordinates are known is also what makes "at the press point"
   * an assertion rather than a description.
   */
  const RING_LIFETIME_MS = 120;
  const PAST_RING_LIFETIME_MS = RING_LIFETIME_MS + 60;

  afterEach(() => {
    vi.useRealTimers();
  });

  it("spawns ink at the press point and cleans it up", async () => {
    vi.useFakeTimers();
    const { container } = render(
      <PressRipple className="h-10 px-4" duration={RING_LIFETIME_MS}>
        <span>Save</span>
      </PressRipple>,
    );
    expect(container.querySelectorAll("[data-slot='ripple-ring']")).toHaveLength(0);
    const surface = container.querySelector("[data-slot='press-ripple']") as HTMLElement;
    act(() => {
      fireEvent.pointerDown(surface, { clientX: 30, clientY: 12 });
    });
    /* One ring per press by default, so this is an exact number rather than a
     * `> 0` that a second stray ring would also satisfy. */
    const rings = container.querySelectorAll<HTMLElement>("[data-slot='ripple-ring']");
    expect(rings).toHaveLength(1);
    /* "At the press point": the surface's own box starts at 0 in a headless DOM,
     * so the ink is placed at the coordinates the press carried. */
    expect(rings[0]?.style.left).toBe("30px");
    expect(rings[0]?.style.top).toBe("12px");
    act(() => void vi.advanceTimersByTime(PAST_RING_LIFETIME_MS));
    expect(container.querySelectorAll("[data-slot='ripple-ring']")).toHaveLength(0);
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
    vi.useFakeTimers();
    const spy = vi.fn();
    function Probe() {
      const ripple = usePressRipple({ duration: RING_LIFETIME_MS });
      spy(ripple.ripples.length);
      return (
        <button type="button" onPointerDown={ripple.onPointerDown}>
          Own
          <RippleLayer ripples={ripple.ripples} />
        </button>
      );
    }
    const { container } = render(<Probe />);
    act(() => {
      fireEvent.pointerDown(screen.getByRole("button", { name: "Own" }), { clientX: 8, clientY: 8 });
    });
    /* The hook's own contract at the moment of the press… */
    expect(spy).toHaveBeenLastCalledWith(1);
    /* …and afterwards, which is the half the old assertion could not see: a
     * surface that never released its ink would also have passed. */
    act(() => void vi.advanceTimersByTime(PAST_RING_LIFETIME_MS));
    expect(spy).toHaveBeenLastCalledWith(0);
    expect(container.querySelectorAll("[data-slot='ripple-ring']")).toHaveLength(0);
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
