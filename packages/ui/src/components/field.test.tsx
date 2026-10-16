import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("connects the label, description and control", () => {
    render(
      <Field label="Symbol" description="Ticker in BASE/QUOTE form" required>
        <Input placeholder="BTC/USD" />
      </Field>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAccessibleName("Symbol");
    expect(input).toHaveAccessibleDescription("Ticker in BASE/QUOTE form");
    expect(input).toBeRequired();
  });

  it("replaces the description with an error and marks the control invalid", () => {
    render(
      <Field label="Universe" description="Pick at least one" error="Select at least one instrument">
        <Input />
      </Field>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Select at least one instrument");
    expect(screen.getByRole("alert")).toHaveTextContent("Select at least one instrument");
  });

  it("propagates disabled to the control", () => {
    render(
      <Field label="Locked" disabled>
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
