import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Rating } from "./rating";
import { Stepper } from "./stepper";
import { Timeline } from "./timeline";

describe("Timeline", () => {
  it("is an ordered list, so the sequence is real", () => {
    render(
      <Timeline
        items={[
          { id: "a", title: "Ingestion", description: "1,284 bars", meta: "04:00" },
          { id: "b", title: "Analytics", tone: "positive", meta: "04:12" },
        ]}
      />,
    );
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("stops the rail at the last item", () => {
    render(<Timeline items={[{ id: "a", title: "One" }, { id: "b", title: "Two" }]} />);
    /* Two markers, one connector — a rail that ran past the end would be a bug. */
    expect(document.querySelectorAll("[data-slot=timeline-marker]")).toHaveLength(2);
    expect(document.querySelectorAll("[data-slot=timeline-rail]")).toHaveLength(1);
  });
});

describe("Stepper", () => {
  const steps = [
    { id: "account", label: "Account" },
    { id: "plan", label: "Plan" },
    { id: "payment", label: "Payment" },
  ];

  it("marks exactly one step as current", () => {
    render(<Stepper steps={steps} current={1} />);
    const currentSteps = document.querySelectorAll('[aria-current="step"]');
    expect(currentSteps).toHaveLength(1);
    expect(currentSteps[0]).toHaveAttribute("data-state", "current");
  });

  /*
   * Where `aria-current` sits, not only how many carry it.
   *
   * With an `onStepSelect` the steps are buttons, and the current one has to
   * carry the attribute itself: a screen reader announces the *focused* element,
   * and a `<li>` it never lands on told a reader nothing. Without a handler there
   * is no button at all, so the list item keeps it.
   */
  it("puts aria-current on the control that can be reached", () => {
    const { unmount } = render(<Stepper steps={steps} current={1} onStepSelect={vi.fn()} />);
    const current = document.querySelector('[aria-current="step"]');
    expect(current?.tagName).toBe("BUTTON");
    expect(current).toHaveAccessibleName(/Plan/);
    unmount();

    render(<Stepper steps={steps} current={1} />);
    const staticStep = document.querySelector('[aria-current="step"]');
    expect(staticStep?.tagName).toBe("LI");
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
  });

  it("makes completed steps navigable and future steps static", async () => {
    const onStepSelect = vi.fn();
    render(<Stepper steps={steps} current={1} onStepSelect={onStepSelect} />);
    /* Account (done) and Plan (current) are buttons; Payment is not. */
    await userEvent.click(screen.getByRole("button", { name: /Account/ }));
    expect(onStepSelect).toHaveBeenCalledWith(0);
    expect(screen.queryByRole("button", { name: /Payment/ })).not.toBeInTheDocument();
  });

  it("does not make steps interactive when no handler is given", () => {
    render(<Stepper steps={steps} current={2} />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});

describe("Rating", () => {
  it("is a radio group: one tab stop, arrow keys move the value", async () => {
    const onValueChange = vi.fn();
    render(<Rating label="Quality" defaultValue={3} onValueChange={onValueChange} />);
    const group = screen.getByRole("radiogroup", { name: "Quality" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("radio", { name: "3 of 5" })).toHaveAttribute("aria-checked", "true");

    /* Focus lands on the checked radio — a radiogroup itself is not a tab stop. */
    screen.getByRole("radio", { name: "3 of 5" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(4);
  });

  it("clears the score when the current star is chosen again", async () => {
    const onValueChange = vi.fn();
    render(<Rating label="Quality" defaultValue={2} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "2 of 5" }));
    expect(onValueChange).toHaveBeenCalledWith(0);
  });

  it("renders a read-only score as data, not as a control", () => {
    render(<Rating readOnly value={2.5} allowHalf label="Average rating" />);
    expect(screen.getByRole("img", { name: "Average rating" })).toBeInTheDocument();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
  });
});
