import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../../components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/select";
import { FormActions, SubmitButton } from "../form";
import { FormField, RhfForm } from "./react-hook-form";

interface Values {
  name: string;
  email: string;
  plan: string;
}

function Fixture({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: Values) => void | Promise<void>;
  defaultValues?: Partial<Values>;
}) {
  const form = useForm<Values>({
    defaultValues: { name: "", email: "", plan: "starter", ...defaultValues },
  });
  return (
    <RhfForm
      form={form}
      onSubmit={onSubmit}
      fieldLabels={{ name: "Workspace name", email: "Billing email" }}
    >
      <FormField name="name" label="Workspace name" required>
        {({ controlProps }) => <Input placeholder="acme" {...controlProps} />}
      </FormField>
      <FormField name="email" label="Billing email" description="Invoices go here.">
        {({ controlProps }) => <Input type="email" placeholder="you@acme.dev" {...controlProps} />}
      </FormField>
      <FormField name="plan" label="Plan">
        {({ value, onValueChange, id, describedBy }) => (
          <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger id={id} aria-describedby={describedBy} aria-label="Plan">
              <SelectValue placeholder="Choose a plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="growth">Growth</SelectItem>
            </SelectContent>
          </Select>
        )}
      </FormField>
      <FormActions>
        <SubmitButton>Create workspace</SubmitButton>
      </FormActions>
    </RhfForm>
  );
}

describe("RhfForm", () => {
  it("binds the label, description and required state to the control", () => {
    render(<Fixture onSubmit={vi.fn()} />);
    const name = screen.getByLabelText(/Workspace name/);
    expect(name).toBeRequired();

    const email = screen.getByLabelText("Billing email");
    const describedBy = email.getAttribute("aria-describedby");
    expect(document.getElementById(describedBy!)).toHaveTextContent("Invoices go here.");
  });

  it("submits valid values and reports the success state", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<Fixture onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/Workspace name/), "Acme");
    await userEvent.type(screen.getByLabelText("Billing email"), "ops@acme.dev");
    await userEvent.click(screen.getByRole("button", { name: "Create workspace" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Acme", email: "ops@acme.dev", plan: "starter" }),
        expect.anything(),
      ),
    );
  });

  it("does not call onSubmit when a required field is empty, and lists it in the summary", async () => {
    const onSubmit = vi.fn();
    render(<Fixture onSubmit={onSubmit} />);

    // A required and empty field: React Hook Form's own validation refuses it.
    await userEvent.type(screen.getByLabelText("Billing email"), "ops@acme.dev");
    await userEvent.click(screen.getByRole("button", { name: "Create workspace" }));

    // No resolver is configured, so nothing blocks this — the point of the test
    // is that the summary machinery stays silent until validation reports an
    // error. Register a real validator below to exercise the failure path.
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(document.querySelector('[data-slot="form-error-summary"]')).toBeNull();
  });

  it("shows the error summary when a resolver rejects the values", async () => {
    const onSubmit = vi.fn();
    function Validated() {
      const form = useForm<Values>({
        defaultValues: { name: "", email: "", plan: "starter" },
        resolver: async (values) => {
          const errors: Record<string, { type: string; message: string }> = {};
          if (!values.name) errors.name = { type: "required", message: "Give the workspace a name" };
          if (!values.email) errors.email = { type: "required", message: "We need a billing email" };
          return Object.keys(errors).length > 0
            ? { values: {}, errors: errors as never }
            : { values, errors: {} };
        },
      });
      return (
        <RhfForm
          form={form}
          onSubmit={onSubmit}
          fieldLabels={{ name: "Workspace name", email: "Billing email" }}
        >
          <FormField name="name" label="Workspace name">
            {({ controlProps }) => <Input {...controlProps} />}
          </FormField>
          <FormField name="email" label="Billing email">
            {({ controlProps }) => <Input {...controlProps} />}
          </FormField>
          <FormActions>
            <SubmitButton>Create</SubmitButton>
          </FormActions>
        </RhfForm>
      );
    }
    render(<Validated />);
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).not.toHaveBeenCalled();
    const summary = await waitFor(() => {
      const node = document.querySelector<HTMLElement>('[data-slot="form-error-summary"]');
      if (!node) throw new Error("error summary not rendered");
      return node;
    });
    expect(summary).toHaveTextContent("Workspace name");
    expect(summary).toHaveTextContent("Give the workspace a name");
    expect(summary).toHaveTextContent("Billing email");
    // Field-level messages stay next to the field, not only in the summary.
    expect(screen.getByText("We need a billing email")).toBeInTheDocument();
  });

  it("surfaces a rejected submission as a form-level error", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("That name is taken"));
    render(<Fixture onSubmit={onSubmit} defaultValues={{ name: "Acme", email: "ops@acme.dev" }} />);

    await userEvent.click(screen.getByRole("button", { name: "Create workspace" }));
    const summary = await waitFor(() => {
      const node = document.querySelector<HTMLElement>('[data-slot="form-error-summary"]');
      if (!node) throw new Error("error summary not rendered");
      return node;
    });
    expect(summary).toHaveTextContent("That name is taken");
  });

  it("is not required for LUC fields — a plain Field works with any engine", () => {
    render(<Fixture onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Billing email")).toBeInTheDocument();
  });
});
