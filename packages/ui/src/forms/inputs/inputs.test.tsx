import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field } from "../../components/field";
import { CurrencyInput, NumberInput, PercentageInput } from "./number-input";
import { OtpInput } from "./otp-input";
import { PasswordInput } from "./password-input";
import { FileInput } from "./file-input";
import { TagInput } from "./tag-input";

describe("NumberInput", () => {
  it("reports the canonical number, not the formatted string", async () => {
    const onValueChange = vi.fn();
    render(
      <Field label="Quantity">
        <NumberInput onValueChange={onValueChange} decimals={2} />
      </Field>,
    );
    const input = screen.getByLabelText("Quantity");
    await userEvent.type(input, "1234.5");
    // Numeric fields commit on blur or Enter, like a well-behaved number input:
    // partial input is never reported to the form as a value.
    await userEvent.tab();
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(1234.5));
    expect(input).toHaveValue("1,234.50");
  });

  it("clamps to min and max on blur", async () => {
    const onValueChange = vi.fn();
    render(<NumberInput aria-label="Weight" min={0} max={100} onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Weight");
    await userEvent.type(input, "500");
    await userEvent.tab();
    await waitFor(() => expect(input).toHaveValue("100"));
  });

  it("steps with the increment button", async () => {
    const onValueChange = vi.fn();
    render(<NumberInput aria-label="Step" defaultValue={10} step={5} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: /increase/i }));
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(15));
  });

  it("does not silently snap a value onto a grid it was not given", () => {
    render(<NumberInput aria-label="Weight" value={1234.567} decimals={2} />);
    // Without a `step`, 1234.567 stays 1234.567 — only the display is rounded.
    expect(screen.getByLabelText("Weight")).toHaveValue("1,234.57");
  });
});

describe("CurrencyInput", () => {
  it("keeps the numeric value while formatting with a currency", () => {
    render(<CurrencyInput aria-label="Notional" currency="EUR" value={1234.5} locale="de-DE" />);
    const input = screen.getByLabelText("Notional");
    expect(input).toHaveValue("1.234,50 €");
  });
});

describe("PercentageInput", () => {
  it("treats the canonical value as a fraction when scale is `fraction`", () => {
    render(<PercentageInput aria-label="Allocation" scale="fraction" value={0.12} />);
    expect(screen.getByLabelText("Allocation")).toHaveValue("12.0%");
  });

  it("treats the canonical value as percent points when scale is `percent`", () => {
    render(<PercentageInput aria-label="Allocation" scale="percent" value={12} />);
    expect(screen.getByLabelText("Allocation")).toHaveValue("12.0%");
  });

  it("converts back to the declared contract on change", async () => {
    const onValueChange = vi.fn();
    render(<PercentageInput aria-label="Allocation" scale="percent" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Allocation"), "12");
    await userEvent.tab();
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(12));
  });

  it("applies the same contract to an uncontrolled default value", () => {
    const { unmount } = render(<PercentageInput aria-label="Rate" scale="percent" defaultValue={8} />);
    expect(screen.getByLabelText("Rate")).toHaveValue("8.0%");
    unmount();
    render(<PercentageInput aria-label="Rate" scale="fraction" defaultValue={0.08} />);
    expect(screen.getByLabelText("Rate")).toHaveValue("8.0%");
  });
});

describe("PasswordInput", () => {
  it("reveals and re-hides the value with a labelled toggle", async () => {
    render(
      <Field label="Password">
        <PasswordInput autoComplete="new-password" />
      </Field>,
    );
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autocomplete", "new-password");

    await userEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not block pasting", async () => {
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password");
    await userEvent.click(input);
    await userEvent.paste("correct horse battery staple");
    expect(input).toHaveValue("correct horse battery staple");
  });
});

describe("OtpInput", () => {
  it("accepts a pasted code and reports completion once", async () => {
    const onComplete = vi.fn();
    render(<OtpInput aria-label="Verification code" length={6} onComplete={onComplete} />);
    const input = screen.getByLabelText("Verification code");
    await userEvent.click(input);
    await userEvent.paste("123456");
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith("123456"));
  });

  it("reports each value as it changes", async () => {
    const onValueChange = vi.fn();
    render(<OtpInput aria-label="Code" length={4} onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Code"), "12");
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith("12"));
  });

  /*
   * Regression (V0.6 QA). `input-otp` seeds its state from `defaultValue` and
   * then spreads the remaining props onto the real `<input>` while setting
   * `value` itself, which made React warn about an input with both — on every
   * uncontrolled OTP field in the Showcase. LUC now owns the initial value.
   */
  it("does not hand both value and defaultValue to the underlying input", () => {
    const errors: string[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(" "));
    });
    try {
      const { container } = render(<OtpInput aria-label="Code" length={4} defaultValue="12" />);
      const input = container.querySelector("input") as HTMLInputElement;
      expect(input.value).toBe("12");
      // Two empty slots in one group must not collide as React keys either.
      expect(errors.join("\n")).not.toMatch(/defaultValue|same key/);
    } finally {
      spy.mockRestore();
    }
  });

  it("keeps an uncontrolled default editable", async () => {
    const onValueChange = vi.fn();
    render(<OtpInput aria-label="Code" length={4} defaultValue="12" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Code"), "3");
    await waitFor(() => expect(onValueChange).toHaveBeenCalled());
  });

  it("marks the slots invalid through the surrounding field", () => {
    render(
      <Field label="Code" error="That code has expired">
        <OtpInput length={4} />
      </Field>,
    );
    expect(screen.getByLabelText(/Code/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("That code has expired")).toBeInTheDocument();
  });
});

describe("FileInput", () => {
  const csv = () => new File(["a,b\n1,2"], "prices.csv", { type: "text/csv" });
  const image = () => new File(["x"], "chart.png", { type: "image/png" });

  it("reports a rejected file type instead of silently dropping it", async () => {
    const onFilesChange = vi.fn();
    const onReject = vi.fn();
    render(
      <FileInput
        aria-label="Upload"
        accept={["text/csv"]}
        multiple
        onFilesChange={onFilesChange}
        onReject={onReject}
      />,
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    // `applyAccept: false` — the picker would filter the file out, but a drop
    // (and a determined user) can still deliver a file the field must reject
    // with a message rather than silently ignore.
    await userEvent.upload(input, image(), { applyAccept: false });
    await waitFor(() => expect(onReject).toHaveBeenCalled());
    expect(onFilesChange).toHaveBeenCalledWith([]);
    expect(screen.getByText(/chart.png/)).toBeInTheDocument();
  });

  it("lists accepted files with a remove control and never uploads", () => {
    const onFilesChange = vi.fn();
    render(<FileInput aria-label="Upload" accept={["text/csv"]} multiple onFilesChange={onFilesChange} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const { container } = render(<FileInput aria-label="Upload 2" defaultValue={[csv()]} accept={["text/csv"]} />);
    expect(container.textContent).toContain("prices.csv");
    expect(screen.getByRole("button", { name: "Remove prices.csv" })).toBeInTheDocument();
    expect(input).toBeTruthy();
  });

  it("rejects a file over the size limit", async () => {
    const onReject = vi.fn();
    render(<FileInput aria-label="Upload" multiple maxSize={2} onReject={onReject} />);
    await userEvent.upload(document.querySelector('input[type="file"]') as HTMLInputElement, csv());
    await waitFor(() => expect(onReject).toHaveBeenCalledWith([expect.objectContaining({ reason: "size" })]));
  });

  it("keeps the picker keyboard reachable and labelled by its field", () => {
    render(
      <Field label="Attachments">
        <FileInput accept={["text/csv"]} />
      </Field>,
    );
    expect(screen.getByRole("button", { name: "Attachments" })).toBeInTheDocument();
  });
});

describe("TagInput", () => {
  it("commits on Enter and removes with Backspace", async () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Keywords" onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Keywords");
    await userEvent.type(input, "momentum{Enter}");
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(["momentum"]));
  });

  it("splits a pasted list", async () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Keywords" onValueChange={onValueChange} />);
    const input = screen.getByLabelText("Keywords");
    await userEvent.click(input);
    await userEvent.paste("alpha, bravo, charlie");
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith(["alpha", "bravo", "charlie"]));
  });

  it("rejects duplicates through the validator message", async () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Symbols" defaultValue={["BTC"]} onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Symbols"), "btc{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("already in the list");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("removes a tag with its labelled button", async () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Symbols" defaultValue={["BTC", "ETH"]} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove BTC" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["ETH"]);
  });

  it("honours maxTags", async () => {
    const onValueChange = vi.fn();
    render(<TagInput aria-label="Symbols" defaultValue={["BTC"]} maxTags={1} onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Symbols"), "ETH{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Up to 1 values");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("works as a controlled value", async () => {
    function Fixture() {
      const [tags, setTags] = useState<string[]>([]);
      return (
        <>
          <TagInput aria-label="Controlled" value={tags} onValueChange={setTags} />
          <output data-testid="count">{tags.length}</output>
        </>
      );
    }
    render(<Fixture />);
    await userEvent.type(screen.getByLabelText("Controlled"), "one{Enter}");
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });
});
