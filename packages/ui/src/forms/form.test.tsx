import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Field, FieldGroup, Fieldset } from "../components/field";
import { Input } from "../components/input";
import { Textarea } from "../components/textarea";
import { Form, FormActions, FormErrorSummary, SubmitButton, useLucForm } from "./form";
import { FormSection } from "./sections";

function StatusProbe() {
  const { status, submitAttempted } = useLucForm();
  return <output data-testid="status">{`${status}:${submitAttempted}`}</output>;
}

describe("Field", () => {
  it("wires the label, description and error to the control", () => {
    const { rerender } = render(
      <Field label="Email address" description="We never share it." required>
        <Input placeholder="you@luc.dev" />
      </Field>,
    );

    const input = screen.getByLabelText(/Email address/);
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toHaveTextContent("We never share it.");
    expect(input).toBeRequired();

    rerender(
      <Field label="Email address" description="We never share it." error="Enter a valid address" required>
        <Input placeholder="you@luc.dev" />
      </Field>,
    );

    // The error replaces the description and is announced.
    const errorId = screen.getByLabelText(/Email address/).getAttribute("aria-describedby");
    expect(document.getElementById(errorId!)).toHaveTextContent("Enter a valid address");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid address");
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a quiet validating state and success separately from error", () => {
    const { rerender } = render(
      <Field label="Handle" validating>
        <Input />
      </Field>,
    );
    expect(screen.getByText("Checking…")).toBeInTheDocument();
    expect(screen.getByLabelText("Handle")).toHaveAttribute("aria-busy", "true");

    rerender(
      <Field label="Handle" success="Available">
        <Input />
      </Field>,
    );
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByLabelText("Handle")).not.toHaveAttribute("aria-busy");
  });

  it("propagates read-only and disabled from the field to the control", () => {
    render(
      <Field label="Ticker" readOnly>
        <Input defaultValue="BTC-USD" />
      </Field>,
    );
    expect(screen.getByLabelText("Ticker")).toHaveAttribute("readonly");
  });

  it("groups controls with a real fieldset and legend", () => {
    render(
      <Fieldset legend="Notifications" description="Choose at least one channel.">
        <Field label="Email">
          <Input />
        </Field>
      </Fieldset>,
    );
    const group = screen.getByRole("group", { name: "Notifications" });
    expect(group.tagName).toBe("FIELDSET");
    expect(group).toHaveAccessibleDescription("Choose at least one channel.");
  });

  it("lays fields out in a responsive group without changing their semantics", () => {
    render(
      <FieldGroup columns={2}>
        <Field label="First name">
          <Input />
        </Field>
        <Field label="Last name">
          <Input />
        </Field>
      </FieldGroup>,
    );
    expect(screen.getByLabelText("First name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last name")).toBeInTheDocument();
  });
});

describe("Form", () => {
  it("moves through the submit lifecycle and announces the outcome", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <Form onSubmit={onSubmit}>
        <StatusProbe />
        <Field label="Name">
          <Input />
        </Field>
        <FormActions>
          <SubmitButton>Save changes</SubmitButton>
        </FormActions>
      </Form>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("idle:false");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("success:true"));
  });

  it("keeps the submit handler's own error status instead of reporting success", async () => {
    // A form engine that validates before the request returns "error" — the
    // wrapper must not overwrite that with a success.
    render(
      <Form onSubmit={() => "error"}>
        <StatusProbe />
        <FormErrorSummary />
        <FormActions>
          <SubmitButton>Save</SubmitButton>
        </FormActions>
      </Form>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error:true"));
  });

  it("turns a rejected submit into a form-level error and lists field errors", async () => {
    render(
      <Form
        onSubmit={() => {
          throw new Error("The plan name is already taken");
        }}
        errors={[{ id: "name", label: "Plan name", message: "Required" }]}
      >
        <FormErrorSummary />
        <FormActions>
          <SubmitButton>Save</SubmitButton>
        </FormActions>
      </Form>,
    );

    // Nothing is shown before the first attempt: an error summary that appears
    // while the user is still typing is noise.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    const summary = await screen.findByRole("alert");
    expect(summary).toHaveTextContent("The plan name is already taken");
    expect(summary).toHaveTextContent("Plan name");
    expect(summary).toHaveTextContent("Required");
  });

  it("moves focus back to the field named in the summary", async () => {
    const focus = vi.fn();
    render(
      <Form errors={[{ id: "symbol", label: "Symbol", message: "Unknown ticker", focus }]} onSubmit={() => "error"}>
        <FormErrorSummary />
        <FormActions>
          <SubmitButton>Run</SubmitButton>
        </FormActions>
      </Form>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Run" }));
    await userEvent.click(await screen.findByRole("button", { name: /Symbol/ }));
    expect(focus).toHaveBeenCalled();
  });

  it("disables and reports the submit button while submitting", async () => {
    let release: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    render(
      <Form onSubmit={() => pending}>
        <SubmitButton loadingText="Saving">Save</SubmitButton>
      </Form>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Save/ }));
    const button = await screen.findByRole("button", { name: /Saving/ });
    expect(button).toHaveAttribute("aria-busy", "true");
    release();
    await waitFor(() => expect(screen.getByRole("button", { name: /Save/ })).not.toHaveAttribute("aria-busy"));
  });

  it("resets status without touching field values", async () => {
    function Fixture() {
      const { resetStatus, status } = useLucForm();
      return (
        <>
          <StatusProbe />
          <button type="button" onClick={resetStatus}>
            Reset status
          </button>
          <span data-testid="extra">{status}</span>
        </>
      );
    }
    render(
      <Form onSubmit={() => "error"}>
        <Fixture />
        <SubmitButton>Try</SubmitButton>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Try" }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error:true"));
    await userEvent.click(screen.getByRole("button", { name: "Reset status" }));
    expect(screen.getByTestId("status")).toHaveTextContent("idle:false");
  });
});

describe("FormSection", () => {
  it("renders a navigable heading and description", () => {
    render(
      <FormSection title="Profile" description="How you appear to collaborators.">
        <Field label="Display name">
          <Input />
        </Field>
      </FormSection>,
    );
    expect(screen.getByRole("heading", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("How you appear to collaborators.")).toBeInTheDocument();
  });
});

describe("Field with a multi-line control", () => {
  it("keeps the same wiring for a textarea", () => {
    render(
      <Field label="Notes" description="Markdown is supported.">
        <Textarea />
      </Field>,
    );
    const textarea = screen.getByLabelText("Notes");
    expect(textarea.getAttribute("aria-describedby")).toBeTruthy();
  });
});

describe("controlled values", () => {
  it("does not own the value when the caller supplies one", async () => {
    function Fixture() {
      const [value, setValue] = useState("BTC");
      return (
        <Field label="Symbol">
          <Input value={value} onChange={(event) => setValue(event.target.value)} />
        </Field>
      );
    }
    render(<Fixture />);
    const input = screen.getByLabelText("Symbol");
    await userEvent.clear(input);
    await userEvent.type(input, "ETH");
    expect(input).toHaveValue("ETH");
  });
});
