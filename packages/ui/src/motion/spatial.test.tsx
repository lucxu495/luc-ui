import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CardStack, CardStackControls, CardStackItem } from "./card-stack";
import { ExpandableSurface, ExpandableSurfaceContent, ExpandableSurfaceTrigger } from "./expandable-surface";
import { KineticHeadline } from "./kinetic-headline";
import { OrbitField, OrbitFieldCore, OrbitFieldNode, OrbitFieldRing } from "./orbit-field";
import { ParallaxLayer, ParallaxScene } from "./parallax-scene";

describe("ParallaxScene", () => {
  it("gives every layer the scene's depth vocabulary", () => {
    const { container } = render(
      <ParallaxScene depth={24}>
        <ParallaxLayer depth={-1.5} z={40} data-testid="front">
          <span>Badge</span>
        </ParallaxLayer>
        <ParallaxLayer depth={0}>Readable copy</ParallaxLayer>
      </ParallaxScene>,
    );

    const scene = container.querySelector("[data-slot='parallax-scene']");
    expect(scene).toBeInTheDocument();
    // The variables are published by the scene and read by the layers, so a
    // layer never re-renders while the pointer moves.
    expect(screen.getByTestId("front").style.transform).toContain("calc(var(--luc-parallax-x, 0px) * -1.5)");
    expect(screen.getByTestId("front").style.transform).toContain("40px");
  });

  it("renders the composed arrangement when the pointer effect is off", () => {
    document.documentElement.dataset.motion = "reduced";
    try {
      const { container } = render(
        <ParallaxScene>
          <ParallaxLayer depth={2}>Still here</ParallaxLayer>
        </ParallaxScene>,
      );
      expect(container.querySelector("[data-slot='parallax-scene']")).toHaveAttribute("data-parallax", "off");
      expect(screen.getByText("Still here")).toBeInTheDocument();
    } finally {
      delete document.documentElement.dataset.motion;
    }
  });
});

describe("OrbitField", () => {
  it("keeps labels upright by counter-rotating them at the ring's period", () => {
    const { container } = render(
      <OrbitField label="Pipeline">
        <OrbitFieldRing radius={80} duration={20}>
          <OrbitFieldNode angle={0}>
            <span>Crawler</span>
          </OrbitFieldNode>
        </OrbitFieldRing>
        <OrbitFieldCore>
          <span>Store</span>
        </OrbitFieldCore>
      </OrbitField>,
    );

    const ring = container.querySelector("[data-slot='orbit-ring']");
    const counter = container.querySelector("[data-slot='orbit-counter']");
    expect(ring?.className).toContain("luc-orbit-spin");
    expect(counter?.className).toContain("luc-orbit-counter");
    // Same period, opposite rotation: the label travels but never tilts.
    expect(counter).toHaveStyle({ animationDuration: "20s" });
    expect(screen.getByRole("group", { name: "Pipeline" })).toBeInTheDocument();
  });

  it("counter-rotates a reversed ring forwards, so the label still cancels", () => {
    const { container } = render(
      <OrbitField>
        <OrbitFieldRing radius={60} duration={30} direction="reverse">
          <OrbitFieldNode angle={90}>
            <span>Seat</span>
          </OrbitFieldNode>
        </OrbitFieldRing>
      </OrbitField>,
    );
    const ring = container.querySelector("[data-slot='orbit-ring']");
    const counter = container.querySelector("[data-slot='orbit-counter']");
    expect(ring).toHaveStyle({ animationDirection: "reverse" });
    // A reversed ring's angle is -360t/T, so the counter must run +360t/T.
    expect(counter?.className).toContain("luc-orbit-spin");
    expect(counter).toHaveStyle({ animationDuration: "30s" });
  });

  it("exposes seats as buttons with pressed state when selection is asked for", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <OrbitField paused>
        <OrbitFieldRing>
          <OrbitFieldNode angle={45} onSelect={onSelect} active label="Choose storage">
            <span>Storage</span>
          </OrbitFieldNode>
        </OrbitFieldRing>
      </OrbitField>,
    );

    const seat = screen.getByRole("button", { name: "Choose storage" });
    expect(seat).toHaveAttribute("aria-pressed", "true");
    await user.click(seat);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("stops every ring when paused, without removing the arrangement", () => {
    const { container } = render(
      <OrbitField paused>
        <OrbitFieldRing>
          <OrbitFieldNode>
            <span>A</span>
          </OrbitFieldNode>
        </OrbitFieldRing>
      </OrbitField>,
    );
    expect(container.querySelector("[data-slot='orbit-field']")).toHaveAttribute("data-spinning", "false");
    expect(container.querySelector("[data-slot='orbit-ring']")?.className).not.toContain("luc-orbit-spin");
  });
});

describe("ExpandableSurface", () => {
  function Harness() {
    return (
      <ExpandableSurface>
        <ExpandableSurfaceTrigger>
          <span>Q3 revenue</span>
        </ExpandableSurfaceTrigger>
        <ExpandableSurfaceContent>
          <p>Breakdown by region</p>
          <button type="button">Export</button>
        </ExpandableSurfaceContent>
      </ExpandableSurface>
    );
  }

  it("expands in place, wires aria and moves focus into the panel", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Q3 revenue" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const region = screen.getByRole("region");
    expect(region).toBeInTheDocument();
    expect(trigger.getAttribute("aria-controls")).toBe(region.id);
    expect(document.activeElement).toBe(region);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Q3 revenue" });

    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("KineticHeadline", () => {
  it("gives a screen reader one string, not one node per word", () => {
    const { container } = render(<KineticHeadline text="Built for data-heavy teams" />);
    const heading = screen.getByRole("heading", { name: "Built for data-heavy teams" });
    expect(heading).toBeInTheDocument();
    // The animated layer is decorative; the words inside it are hidden from AT.
    expect(container.querySelectorAll("[data-slot='kinetic-word']")).toHaveLength(4);
    const animated = container.querySelector("[data-slot='kinetic-word']")?.closest("span[aria-hidden='true']");
    expect(animated).not.toBeNull();
  });

  it("keeps the visible words as selectable text and honours the tag", () => {
    render(<KineticHeadline as="h1" text="One idea" className="text-display" />);
    expect(screen.getByRole("heading", { level: 1, name: "One idea" })).toBeInTheDocument();
  });
});

describe("CardStack", () => {
  function Deck() {
    return (
      <CardStack label="Release notes" className="h-64">
        <CardStackItem>
          <span>First release</span>
        </CardStackItem>
        <CardStackItem>
          <span>Second release</span>
        </CardStackItem>
        <CardStackItem>
          <span>Third release</span>
        </CardStackItem>
        <CardStackControls className="absolute bottom-2 left-2" />
      </CardStack>
    );
  }

  it("steps with the keyboard and keeps the deck described", async () => {
    const user = userEvent.setup();
    const { container } = render(<Deck />);
    const deck = screen.getByRole("group", { name: "Release notes" });
    expect(deck).toHaveAttribute("data-active", "0");

    deck.focus();
    await user.keyboard("{ArrowRight}");
    expect(deck).toHaveAttribute("data-active", "1");
    await user.keyboard("{End}");
    expect(deck).toHaveAttribute("data-active", "2");
    await user.keyboard("{ArrowRight}");
    expect(deck).toHaveAttribute("data-active", "2");

    const layers = container.querySelectorAll("[data-slot='card-stack-layer']");
    expect(layers).toHaveLength(3);
    // The cards behind the active one are out of the tab order entirely.
    expect(layers[1]).toHaveAttribute("inert");
    expect(layers[0]).toHaveAttribute("aria-hidden", "true");
    expect(layers[2]).not.toHaveAttribute("aria-hidden");
  });

  it("drives the deck from its composable controls", async () => {
    const user = userEvent.setup();
    render(<Deck />);
    const next = screen.getByRole("button", { name: "Next card" });
    await user.click(next);
    expect(screen.getByRole("group", { name: "Release notes" })).toHaveAttribute("data-active", "1");
    expect(screen.getByRole("button", { name: "Previous card" })).toBeEnabled();
  });
});
