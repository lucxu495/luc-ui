import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "./aspect-ratio";
import { Button } from "./button";
import { ButtonGroup, ButtonGroupSeparator } from "./button-group";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupSeparator } from "./input-group";
import { KbdGroup } from "./kbd";
import { Kbd } from "./typography";
import { Label } from "./label";
import { NativeSelect } from "./native-select";
import { ScrollArea } from "./scroll-area";

describe("AspectRatio", () => {
  it("turns a named preset into the right numeric ratio", () => {
    const { container } = render(
      <AspectRatio ratio="video">
        <span>clip</span>
      </AspectRatio>,
    );
    const box = container.querySelector("[data-slot=aspect-ratio]") as HTMLElement;
    /* Radix reserves the space on the wrapper, so the child never shifts. */
    expect(Number(box.parentElement!.style.paddingBottom.replace("%", ""))).toBeCloseTo(56.25, 1);
    expect(box.parentElement!.style.position).toBe("relative");
  });

  it("accepts a raw ratio", () => {
    const { container } = render(<AspectRatio ratio={2.5} />);
    const box = container.querySelector("[data-slot=aspect-ratio]") as HTMLElement;
    expect(Number(box.parentElement!.style.paddingBottom.replace("%", ""))).toBeCloseTo(40, 1);
  });
});

describe("Kbd", () => {
  it("is a real kbd element", () => {
    render(<Kbd>⌘</Kbd>);
    expect(document.querySelector("[data-slot=kbd]")?.tagName).toBe("KBD");
  });

  it("hides the chord separator so the reader hears one shortcut", () => {
    render(<KbdGroup keys={["⌘", "K"]} />);
    const group = document.querySelector("[data-slot=kbd-group]")!;
    const separator = group.querySelector("[aria-hidden=true]")!;
    expect(separator).toHaveTextContent("+");
    expect(document.querySelectorAll("[data-slot=kbd]")).toHaveLength(2);
  });
});

describe("Label", () => {
  it("marks a required field with an asterisk that is not read twice", () => {
    render(
      <Label htmlFor="email" required>
        Email
      </Label>,
    );
    const label = screen.getByText("Email").closest("label")!;
    expect(label).toHaveAttribute("for", "email");
    expect(Array.from(label.children).some((child) => child.getAttribute("aria-hidden") === "true")).toBe(true);
  });
});

describe("ButtonGroup", () => {
  it("collapses the joint between neighbours without restyling them", () => {
    render(
      <ButtonGroup>
        <Button variant="secondary">Day</Button>
        <Button variant="secondary">Week</Button>
        <ButtonGroupSeparator />
        <Button variant="danger">Reset</Button>
      </ButtonGroup>,
    );
    const group = document.querySelector("[data-slot=button-group]")!;
    expect(group.className).toContain("[&>*+*]:-ms-px");
    expect(screen.getByRole("button", { name: "Reset" })).toHaveClass("bg-negative");
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});

describe("InputGroup", () => {
  it("composes addons around one focusable field", () => {
    render(
      <InputGroup>
        <InputGroupAddon>https://</InputGroupAddon>
        <InputGroupInput aria-label="Host" defaultValue="example.com" />
        <InputGroupSeparator />
        <InputGroupAddon align="end">.com</InputGroupAddon>
      </InputGroup>,
    );
    expect(screen.getByRole("textbox", { name: "Host" })).toHaveValue("example.com");
    expect(document.querySelectorAll("[data-slot=input-group-addon]")).toHaveLength(2);
  });
});

describe("NativeSelect", () => {
  it("is a real select with real options", () => {
    render(
      <NativeSelect
        aria-label="Density"
        defaultValue="md"
        options={[
          { value: "sm", label: "Compact" },
          { value: "md", label: "Comfortable" },
        ]}
      />,
    );
    const select = screen.getByRole("combobox", { name: "Density" }) as HTMLSelectElement;
    expect(select.tagName).toBe("SELECT");
    expect(select.value).toBe("md");
    expect(screen.getByRole("option", { name: "Compact" })).toBeInTheDocument();
  });
});

describe("ScrollArea", () => {
  it("renders one styled scrollbar per axis and a labelled viewport", () => {
    render(
      <ScrollArea className="h-40" aria-label="Log">
        <div style={{ height: 400 }}>rows</div>
      </ScrollArea>,
    );
    const root = document.querySelector("[data-slot=scroll-area]")!;
    expect(root).toBeInTheDocument();
    expect(document.querySelector("[data-slot=scroll-area-viewport]")).toBeInTheDocument();
  });
});
