import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Toggle, ToggleGroup, ToggleGroupItem } from "./toggle";

describe("Toggle", () => {
  it("is a pressed button, not a checkbox", async () => {
    render(<Toggle label="Bold">Bold</Toggle>);
    const toggle = screen.getByRole("button", { name: "Bold" });
    expect(toggle).toHaveAttribute("data-state", "off");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("data-state", "on");
  });

  it("owns its default state when uncontrolled and reports it when controlled", async () => {
    const onPressedChange = vi.fn();
    render(
      <Toggle defaultPressed onPressedChange={onPressedChange}>
        Grid
      </Toggle>,
    );
    const toggle = screen.getByRole("button", { name: "Grid" });
    expect(toggle).toHaveAttribute("data-state", "on");
    await userEvent.click(toggle);
    expect(onPressedChange).toHaveBeenCalledWith(false);
  });
});

describe("ToggleGroup", () => {
  it("keeps each item independently pressed in multiple mode", async () => {
    render(
      <ToggleGroup type="multiple" aria-label="Columns">
        <ToggleGroupItem value="price">Price</ToggleGroupItem>
        <ToggleGroupItem value="volume">Volume</ToggleGroupItem>
      </ToggleGroup>,
    );
    const price = screen.getByRole("button", { name: "Price" });
    const volume = screen.getByRole("button", { name: "Volume" });
    await userEvent.click(price);
    await userEvent.click(volume);
    expect(price).toHaveAttribute("data-state", "on");
    expect(volume).toHaveAttribute("data-state", "on");
  });

  it("replaces the selection in single mode", async () => {
    render(
      <ToggleGroup type="single" defaultValue="price" aria-label="Columns">
        <ToggleGroupItem value="price">Price</ToggleGroupItem>
        <ToggleGroupItem value="volume">Volume</ToggleGroupItem>
      </ToggleGroup>,
    );
    /*
     * Single mode is a radio group, not a row of toggle buttons: that is the
     * whole difference from `SegmentedControl`, and it is worth asserting.
     */
    expect(screen.getByRole("radiogroup", { name: "Columns" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Volume" }));
    expect(screen.getByRole("radio", { name: "Price" })).toHaveAttribute("data-state", "off");
    expect(screen.getByRole("radio", { name: "Volume" })).toHaveAttribute("data-state", "on");
  });
});
