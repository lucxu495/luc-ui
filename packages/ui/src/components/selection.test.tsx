import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";
import { Radio, RadioGroup } from "./radio-group";
import { Switch } from "./switch";

describe("Checkbox", () => {
  it("toggles by click and by keyboard", async () => {
    render(<Checkbox label="Include delisted instruments" />);
    const box = screen.getByRole("checkbox", { name: "Include delisted instruments" });
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(box).toBeChecked();
    box.focus();
    await userEvent.keyboard(" ");
    expect(box).not.toBeChecked();
  });

  it("supports the indeterminate state", () => {
    render(<Checkbox checked="indeterminate" label="All domains" />);
    const box = screen.getByRole("checkbox", { name: "All domains" });
    expect(box).toHaveAttribute("data-state", "indeterminate");
    expect(box).toHaveAttribute("aria-checked", "mixed");
  });

  it("is not toggleable when disabled", async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={onCheckedChange} label="Locked" />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Locked" }));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe("Switch", () => {
  it("toggles by click and exposes aria-checked", async () => {
    render(<Switch label="Show pending runs" />);
    const control = screen.getByRole("switch", { name: "Show pending runs" });
    expect(control).toHaveAttribute("aria-checked", "false");
    await userEvent.click(control);
    expect(control).toHaveAttribute("aria-checked", "true");
    control.focus();
    await userEvent.keyboard(" ");
    expect(control).toHaveAttribute("aria-checked", "false");
  });
});

describe("RadioGroup", () => {
  it("selects one option at a time", async () => {
    render(
      <RadioGroup defaultValue="top25" aria-label="Universe">
        <Radio value="top25" label="Top 25 by volume" />
        <Radio value="majors" label="Majors only" />
      </RadioGroup>,
    );
    const majors = screen.getByRole("radio", { name: "Majors only" });
    await userEvent.click(majors);
    expect(majors).toBeChecked();
    expect(screen.getByRole("radio", { name: "Top 25 by volume" })).not.toBeChecked();
  });
});
