import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTriggerRow,
} from "./accordion";
import { Badge } from "./badge";

function Fixture() {
  return (
    <Accordion type="single" collapsible defaultValue="ingestion">
      <AccordionItem value="ingestion">
        <AccordionTrigger aside={<Badge tone="positive">ok</Badge>}>Ingestion</AccordionTrigger>
        <AccordionContent>1,284 bars written.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="analytics">
        <AccordionTrigger>Analytics</AccordionTrigger>
        <AccordionContent>Seven domains validated.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("gives every trigger a header with an expanded state", () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: /Ingestion/ });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger.closest("h3")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Analytics" })).toHaveAttribute("aria-expanded", "false");
  });

  it("opens another section and collapses the first (single mode)", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Analytics" }));
    expect(screen.getByRole("button", { name: "Analytics" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Ingestion/ })).toHaveAttribute("aria-expanded", "false");
  });

  it("removes collapsed content from the tree rather than hiding it", async () => {
    render(<Fixture />);
    expect(screen.getByText("1,284 bars written.")).toBeInTheDocument();
    expect(screen.queryByText("Seven domains validated.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Analytics" }));
    expect(await screen.findByText("Seven domains validated.")).toBeInTheDocument();
  });

  it("marks the flush variant on the item so the surface is the consumer's", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a" variant="flush">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Body</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = screen.getByText("Section").closest("[data-slot=accordion-item]")!;
    expect(item.className).toContain("border-b");
    expect(item.className).not.toContain("rounded-lg");
  });
});

describe("Collapsible", () => {
  it("toggles one region through a real disclosure button", async () => {
    render(
      <Collapsible>
        <CollapsibleTriggerRow>Advanced settings</CollapsibleTriggerRow>
        <CollapsibleContent>Retention is 30 days.</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole("button", { name: /Advanced settings/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls");
  });
});
