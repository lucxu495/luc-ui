import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import * as buttonEntry from "./button";
import { Button } from "./button";
import { buttonVariants } from "./button-variants";

describe("button entry point", () => {
  it("exports the component and its recipe from the public subpath module", () => {
    // `@luc/ui/components/button` maps here: docs promise both, and the entry
    // must stay server-safe so `buttonVariants()` is callable during SSR.
    expect(typeof buttonEntry.Button).toBe("function");
    expect(typeof buttonEntry.buttonVariants).toBe("function");
    expect(buttonEntry.buttonVariants).toBe(buttonVariants);
  });
});

describe("Button", () => {
  it("renders its label and calls onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Run backtest</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Run backtest" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is not interactive when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Delete
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("reports a busy state and swallows clicks while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving run" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: /Save/ });
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    // The label stays in the DOM so the button keeps its width.
    expect(button).toHaveTextContent("Save");
    expect(screen.getByText("Saving run")).toBeInTheDocument();
  });

  it("keeps the label colour when merged with a size class", () => {
    // Guards the tailwind-merge configuration: a dropped colour class is a
    // contrast failure, not a cosmetic nit.
    const classes = buttonVariants({ variant: "primary", size: "md" });
    expect(classes).toContain("text-accent-on-accent");
    expect(classes).toContain("text-label");
  });

  it("renders icon slots around the label", () => {
    render(
      <Button leadingIcon={<span data-testid="leading" />} trailingIcon={<span data-testid="trailing" />}>
        Export
      </Button>,
    );
    expect(screen.getByTestId("leading")).toBeInTheDocument();
    expect(screen.getByTestId("trailing")).toBeInTheDocument();
  });

  it("offers an accent twin of primary, tinted rather than filled", () => {
    const accent = buttonVariants({ variant: "accent" });
    // Same accent identity as IconButton's `accent`, at lower volume.
    expect(accent).toContain("bg-accent-soft");
    expect(accent).toContain("text-fg-accent");
    expect(accent).not.toContain("bg-accent-default");

    // Only the filled variants carry the signature hover sweep.
    expect(buttonVariants({ variant: "primary" })).toContain("luc-sheen");
    expect(accent).toContain("luc-sheen");
    expect(buttonVariants({ variant: "secondary" })).not.toContain("luc-sheen");
  });
});
