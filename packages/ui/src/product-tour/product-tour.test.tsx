import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductTour, type ProductTourProps } from "./product-tour";
import {
  positionTourBubble,
  resolveTourTarget,
  type TourRect,
} from "./engine";

const viewport = { width: 1200, height: 800 };

function anchor(id: string, rect: Partial<DOMRect> = {}) {
  const element = document.createElement("button");
  element.id = id;
  element.type = "button";
  element.textContent = id;
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    x: rect.left ?? 80,
    y: rect.top ?? 90,
    top: rect.top ?? 90,
    left: rect.left ?? 80,
    right: (rect.left ?? 80) + (rect.width ?? 160),
    bottom: (rect.top ?? 90) + (rect.height ?? 40),
    width: rect.width ?? 160,
    height: rect.height ?? 40,
    toJSON: () => ({}),
  });
  document.body.append(element);
  return element;
}

function Harness(props: Partial<ProductTourProps>) {
  const [open, setOpen] = useState(props.defaultOpen ?? true);
  return (
    <>
      <button type="button" aria-label="Launch" onClick={() => setOpen(true)}>
        Launch
      </button>
      <ProductTour
        {...props}
        steps={props.steps ?? []}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
      />
    </>
  );
}

afterEach(() => {
  vi.useRealTimers();
  document.documentElement.removeAttribute("data-motion");
});

describe("ProductTour engine", () => {
  it("flips from a preferred side to the side with usable room", () => {
    const target: TourRect = { top: 740, left: 200, width: 220, height: 52 };
    const result = positionTourBubble({
      anchor: target,
      bubble: { width: 340, height: 180 },
      viewport,
      preferred: "bottom",
    });
    expect(result.placement).toBe("top");
    expect(result.top).toBeLessThan(target.top);
    expect(result.tail?.side).toBe("bottom");
  });

  it("shifts a bubble inside the viewport and clamps its tail", () => {
    const target: TourRect = { top: 340, left: 1120, width: 64, height: 36 };
    const result = positionTourBubble({
      anchor: target,
      bubble: { width: 320, height: 170 },
      viewport,
      preferred: "right",
    });
    expect(result.left).toBeLessThanOrEqual(viewport.width - 320 - 12);
    expect(result.left).toBeGreaterThanOrEqual(12);
    expect(result.tail?.x).toBeGreaterThanOrEqual(0);
    expect(result.tail?.x).toBeLessThanOrEqual(320);
  });

  it("resolves a selector, an element, a resolver and a missing target", () => {
    const element = anchor("resolve-anchor");
    expect(resolveTourTarget("#resolve-anchor")).toBe(element);
    expect(resolveTourTarget(element)).toBe(element);
    expect(resolveTourTarget(() => element)).toBe(element);
    expect(resolveTourTarget("#not-here")).toBeNull();
  });
});

describe("ProductTour", () => {
  it("walks forward, backward and completes from a manual tour", async () => {
    const onComplete = vi.fn();
    anchor("first");
    anchor("second", { top: 250 });
    render(
      <Harness
        defaultOpen={false}
        steps={[
          { id: "one", target: "#first", title: "First step", description: "One" },
          { id: "two", target: "#second", title: "Second step", description: "Two" },
        ]}
        onComplete={onComplete}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Launch" }));
    const first = screen.getByRole("dialog");
    expect(first).toHaveTextContent("First step");
    await userEvent.click(within(first).getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("Second step"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("First step"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("Second step"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(onComplete).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("restores focus, closes with Escape and reports the skipped step", async () => {
    const onSkip = vi.fn();
    anchor("escape-anchor");
    render(
      <Harness
        defaultOpen={false}
        steps={[{ id: "one", target: "#escape-anchor", title: "Keyboard step" }]}
        onSkip={onSkip}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Launch" }));
    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(onSkip).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Launch" })).toHaveFocus();
  });

  it("includes the live target in the keyboard loop", async () => {
    const input = document.createElement("input");
    input.id = "interactive-target";
    input.setAttribute("aria-label", "Workspace name");
    Object.defineProperty(input, "offsetParent", { get: () => document.body });
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      x: 90,
      y: 120,
      top: 120,
      left: 90,
      right: 350,
      bottom: 154,
      width: 260,
      height: 34,
      toJSON: () => ({}),
    });
    document.body.append(input);
    render(
      <Harness
        defaultOpen={false}
        steps={[{ id: "input", target: "#interactive-target", title: "Interactive target" }]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Launch" }));
    const dialog = screen.getByRole("dialog");
    await waitFor(() => expect(dialog).toHaveFocus());
    screen.getByRole("button", { name: "Finish" }).focus();
    await userEvent.tab();
    expect(input).toHaveFocus();
  });

  it("offers a welcome choice before entering step one", async () => {
    anchor("welcome-target");
    anchor("step-target", { top: 240 });
    render(
      <Harness
        defaultOpen={false}
        steps={[
          { id: "one", target: "#step-target", title: "First tutorial step" },
          { id: "two", title: "Second tutorial step" },
        ]}
        intro={{
          target: "#welcome-target",
          eyebrow: "WELCOME",
          title: "Let’s take a tour?",
          description: "A short introduction.",
        }}
        labels={{
          introMeta: (total) => `${total} quiet steps`,
          takeTour: "Take the tour",
          exploreAlone: "Explore on my own",
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Launch" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Let’s take a tour?");
    expect(dialog).toHaveTextContent("2 quiet steps");
    expect(within(dialog).queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Take the tour" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("First tutorial step"),
    );
  });

  it("can time the welcome and pauses its countdown on hover", async () => {
    vi.useFakeTimers();
    render(
      <Harness
        defaultOpen={false}
        steps={[
          { id: "one", title: "First tutorial step" },
          { id: "two", title: "Second tutorial step" },
        ]}
        intro={{
          eyebrow: "WELCOME",
          title: "Let’s take a tour?",
          description: "A short introduction.",
          autoStartAfter: 1000,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Launch" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.pointerEnter(dialog);
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    expect(screen.getByRole("dialog")).toHaveTextContent("Let’s take a tour?");
    fireEvent.pointerLeave(dialog);
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    vi.useRealTimers();
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("First tutorial step"),
    );
  });

  it("keeps a missing target recoverable and offers a way out", async () => {
    const onSkip = vi.fn();
    render(
      <Harness
        steps={[
          {
            id: "gone",
            target: "#not-here",
            title: "Original title",
            description: "Original copy",
          },
        ]}
        onSkip={onSkip}
        labels={{
          unavailableTitle: "Anchor unavailable",
          unavailableDescription: "Still watching",
        }}
      />,
    );
    expect((await screen.findAllByText("Anchor unavailable")).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText("Still watching")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Skip step" }));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("recovers when a dynamic target appears", async () => {
    render(
      <Harness
        steps={[
          {
            id: "dynamic",
            target: "#dynamic-anchor",
            title: "Dynamic target",
          },
        ]}
      />,
    );
    expect(await screen.findByText("The anchor moved")).toBeInTheDocument();
    act(() => {
      anchor("dynamic-anchor");
    });
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("Dynamic target"));
    expect(within(screen.getByRole("dialog")).queryByText("The anchor moved")).not.toBeInTheDocument();
  });

  it("advances in auto mode and pauses while the bubble is hovered", async () => {
    vi.useFakeTimers();
    const onStepChange = vi.fn();
    anchor("auto-one");
    anchor("auto-two", { top: 260 });
    render(
      <Harness
        steps={[
          { id: "one", target: "#auto-one", title: "Auto one" },
          { id: "two", target: "#auto-two", title: "Auto two" },
        ]}
        mode="auto"
        interval={120}
        onStepChange={onStepChange}
      />,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.pointerEnter(dialog);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("dialog")).toHaveTextContent("Auto one");

    fireEvent.pointerLeave(dialog);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onStepChange).toHaveBeenCalledWith(1, expect.objectContaining({ id: "two" }));
    vi.useRealTimers();
    await waitFor(() =>
      expect(screen.getByRole("dialog")).toHaveTextContent("Auto two"),
    );
  });

  it("honours a controlled current step and keeps two tours isolated", async () => {
    anchor("tour-a");
    anchor("tour-b");
    const onA = vi.fn();
    const onB = vi.fn();
    render(
      <>
        <ProductTour
          defaultOpen
          steps={[{ id: "a", target: "#tour-a", title: "Tour A" }]}
          onClose={onA}
          labels={{ close: "Close A" }}
        />
        <ProductTour
          defaultOpen
          steps={[{ id: "b", target: "#tour-b", title: "Tour B" }]}
          onSkip={onB}
          labels={{ close: "Close B" }}
        />
      </>,
    );
    const dialogs = screen.getAllByRole("dialog");
    expect(dialogs).toHaveLength(2);
    await userEvent.click(within(dialogs[0]!).getByRole("button", { name: "Close A" }));
    expect(onA).toHaveBeenCalledOnce();
    expect(onB).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("Tour B"));
  });
});
