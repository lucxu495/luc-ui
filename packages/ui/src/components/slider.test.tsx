import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./field";
import { RangeSlider, Slider } from "./slider";

describe("Slider", () => {
  it("exposes one thumb with the slider semantics and the numeric bounds", () => {
    render(<Slider defaultValue={40} min={10} max={90} label="Lookback" />);
    const thumb = screen.getByRole("slider", { name: "Lookback" });
    expect(thumb).toHaveAttribute("aria-valuenow", "40");
    expect(thumb).toHaveAttribute("aria-valuemin", "10");
    expect(thumb).toHaveAttribute("aria-valuemax", "90");
    expect(thumb).toHaveAttribute("data-orientation", "horizontal");
  });

  it("steps with the arrow keys and clamps at the bounds", async () => {
    const onValueChange = vi.fn();
    render(<Slider defaultValue={50} step={5} onValueChange={onValueChange} label="Weight" />);
    const thumb = screen.getByRole("slider", { name: "Weight" });

    await userEvent.tab();
    expect(thumb).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(55);
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith(45);
    await userEvent.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith(0);
    await userEvent.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith(100);
  });

  it("reports the value as a number, not the primitive's array", async () => {
    const onValueChange = vi.fn();
    render(<Slider defaultValue={0} onValueChange={onValueChange} label="Opacity" />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenCalledWith(1);
  });

  it("keeps the value bubble quiet by default and reveals it on demand", () => {
    const { rerender } = render(<Slider defaultValue={25} label="Threshold" />);
    const hidden = screen.getByText("25");
    expect(hidden).toHaveAttribute("aria-hidden", "true");
    expect(hidden.className).toContain("opacity-0");

    rerender(<Slider defaultValue={25} label="Threshold" showValue="always" formatValue={(v) => `${v}%`} />);
    expect(screen.getByText("25%").className).toContain("opacity-100");
  });

  it("is a single tab stop and not focusable when disabled", () => {
    const { rerender } = render(<Slider defaultValue={10} label="Disabled later" disabled />);
    const thumb = screen.getByRole("slider");
    expect(thumb).not.toHaveAttribute("tabindex");
    rerender(<Slider defaultValue={10} label="Disabled later" />);
    expect(screen.getByRole("slider")).toHaveAttribute("tabindex", "0");
  });

  it("works with a Field label and error without duplicating the label", () => {
    render(
      <Field label="Warm-up bars" description="Kept before the first signal." error="Too short">
        <Slider defaultValue={120} />
      </Field>,
    );
    const thumb = screen.getByRole("slider", { name: "Warm-up bars" });
    expect(thumb).toHaveAttribute("aria-invalid", "true");
    expect(thumb.getAttribute("aria-describedby")).toContain("-error");
  });
});

describe("RangeSlider", () => {
  it("exposes two thumbs, one inclusive pair", () => {
    render(<RangeSlider defaultValue={[20, 80]} label="Window" />);
    const thumbs = screen.getAllByRole("slider");
    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveAttribute("aria-valuenow", "20");
    expect(thumbs[1]).toHaveAttribute("aria-valuenow", "80");
  });

  it("keeps an accessible name on both thumbs when only a Field label exists", () => {
    render(
      <Field label="Position band">
        <RangeSlider defaultValue={[10, 90]} />
      </Field>,
    );
    // The primitive's own "Minimum"/"Maximum" defaults must survive: passing an
    // explicit `aria-label={undefined}` would erase them and leave both thumbs
    // nameless (axe: aria-input-field-name).
    expect(screen.getByRole("slider", { name: "Minimum" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Maximum" })).toBeInTheDocument();
  });

  it("names the two thumbs from the field label", () => {
    render(
      <Field label="Confidence band">
        <RangeSlider defaultValue={[10, 90]} label="Confidence band" />
      </Field>,
    );
    expect(screen.getByRole("slider", { name: "Confidence band minimum" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Confidence band maximum" })).toBeInTheDocument();
  });

  it("delivers a clean typed tuple and keeps it ordered", async () => {
    const onValueChange = vi.fn();
    render(<RangeSlider defaultValue={[20, 80]} label="Band" onValueChange={onValueChange} />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith([21, 80]);
  });

  it("stays controlled when the consumer owns the value", async () => {
    function Controlled() {
      const [value, setValue] = useState<[number, number]>([30, 70]);
      return (
        <>
          <RangeSlider value={value} onValueChange={setValue} label="Controlled band" />
          <output data-testid="value">{`${value[0]}-${value[1]}`}</output>
        </>
      );
    }
    render(<Controlled />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByTestId("value")).toHaveTextContent("31-70");
  });

  /*
   * The box makes room for the decorations it draws. jsdom has no layout, so
   * these assert the *classes* that produce the geometry — which is the part a
   * refactor could silently drop, and the part that two measured overlaps on
   * `/components/slider` came out of: a value bubble painted 21 px over the
   * field label above the control, and a mark caption 7 px over the sentence
   * below it.
   */
  describe("room for the decorations it draws", () => {
    /** The root's classes, or an empty string if the element is not in a slider. */
    const rootClassOf = (element: HTMLElement) =>
      element.closest('[data-slot="slider"]')?.className ?? "";

    it("reserves the bubble band unless the value is never printed", () => {
      const { rerender } = render(<Slider defaultValue={20} label="Bubble room" />);
      expect(rootClassOf(screen.getByRole("slider"))).toContain("pt-8");

      rerender(<Slider defaultValue={20} label="Bubble room" showValue="never" />);
      const quiet = rootClassOf(screen.getByRole("slider"));
      expect(quiet).not.toContain("pt-8");
      /* The groove's own height comes back, so a toolbar slider keeps its 20 px. */
      expect(quiet).toContain("h-5");
    });

    it("reserves the caption band only for a mark that has a caption", () => {
      const { rerender } = render(
        <Slider
          defaultValue={20}
          label="Marked"
          showValue="never"
          marks={[{ value: 20, label: "20" }, { value: 80 }]}
        />,
      );
      expect(rootClassOf(screen.getByRole("slider"))).toContain("pb-5");

      rerender(
        <Slider defaultValue={20} label="Marked" showValue="never" marks={[{ value: 20 }, { value: 80 }]} />,
      );
      expect(rootClassOf(screen.getByRole("slider"))).not.toContain("pb-5");
    });

    it("positions a horizontal tick against the rail and leaves the vertical one alone", () => {
      const { rerender } = render(
        <Slider defaultValue={20} label="Horizontal" showValue="never" marks={[{ value: 20, label: "20" }]} />,
      );
      /* The tick's `top-1/2` has to resolve against a box the height of the
       * groove: against the padded root it lands 6 px above the groove. */
      const rail = document.querySelector('[data-slot="slider-rail"]');
      expect(rail).not.toBeNull();
      expect(rail?.querySelector('[data-slot="slider-track"]')).not.toBeNull();

      rerender(
        <Slider
          defaultValue={20}
          label="Vertical"
          orientation="vertical"
          showValue="never"
          marks={[{ value: 20, label: "20" }]}
        />,
      );
      /* A vertical slider's captions sit beside the rail and nothing is padded,
       * so it keeps the structure it has always had. */
      expect(document.querySelector('[data-slot="slider-rail"]')).toBeNull();
      const root = rootClassOf(screen.getByRole("slider"));
      expect(root).toContain("h-40");
      expect(root).not.toContain("pt-8");
      expect(root).not.toContain("pb-5");
    });
  });
});
