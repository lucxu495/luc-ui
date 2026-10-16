import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { Button } from "./button";
import { Field } from "./field";
import { Input } from "./input";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetSide,
  type SheetSize,
} from "./sheet";

function Fixture({ side = "right", size = "md" }: { side?: SheetSide; size?: SheetSize }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open settings</Button>
      </SheetTrigger>
      <SheetContent side={side} size={size}>
        <SheetHeader>
          <SheetTitle>Chart settings</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <Field label="Lookback">
            <Input defaultValue="365" />
          </Field>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost">Cancel</Button>
          <Button>Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

describe("Sheet", () => {
  /*
   * The edge is derived from the state that closes the panel — `side={open ?
   * "left" : "right"}` is how anybody writes one sheet that can be anchored
   * several ways. Without the latch the panel re-anchors the instant it starts
   * to close, so it leaves from an edge it was never on: the reported symptom
   * was a top or left sheet that "stayed visible and jumped" while dismissing.
   *
   * The edge latch itself — "a panel exits from the edge it entered" — is
   * verified in a real browser, in `qa/geometry.mjs`, because the render that
   * breaks is the *closing* one and Radix unmounts the content in jsdom before
   * any exit animation can be observed. What is unit-testable here is the two
   * halves either side of it: that a panel still follows its caller while it is
   * open, and that the open state reaches `SheetContent` through the root
   * wrapper at all.
   */
  it("follows its caller's `side` while it is open", async () => {
    function Switchable() {
      const [side, setSide] = useState<SheetSide>("left");
      return (
        <Sheet open>
          <SheetContent side={side}>
            <SheetTitle>Switchable</SheetTitle>
            <SheetBody>
              {/* Inside the panel: a modal marks everything outside it hidden,
               * so a control that drives the demo has to live within it. */}
              <button type="button" onClick={() => setSide("bottom")}>
                Move to bottom
              </button>
            </SheetBody>
          </SheetContent>
        </Sheet>
      );
    }

    render(<Switchable />);
    expect(screen.getByRole("dialog", { name: "Switchable" })).toHaveAttribute("data-side", "left");
    await userEvent.click(screen.getByRole("button", { name: "Move to bottom" }));
    expect(screen.getByRole("dialog", { name: "Switchable" })).toHaveAttribute("data-side", "bottom");
  });

  it("opens, is labelled and anchors to the requested edge", async () => {
    render(<Fixture side="bottom" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));
    const sheet = await screen.findByRole("dialog", { name: "Chart settings" });
    expect(sheet).toHaveAttribute("data-side", "bottom");
  });

  it("traps focus and restores it on Escape", async () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "Open settings" });
    await userEvent.click(trigger);
    const sheet = await screen.findByRole("dialog");
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("closes from the built-in close affordance", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Close panel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("exposes header, body and footer as one scrollable panel", async () => {
    render(<Fixture side="left" size="lg" />);
    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));
    const sheet = await screen.findByRole("dialog");
    expect(sheet.querySelector('[data-slot="sheet-header"]')).toBeTruthy();
    expect(sheet.querySelector('[data-slot="sheet-body"]')).toBeTruthy();
    expect(sheet.querySelector('[data-slot="sheet-footer"]')).toBeTruthy();
    expect(screen.getByLabelText("Lookback")).toHaveValue("365");
  });

  it("closes when the overlay is pressed", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Open settings" }));
    await screen.findByRole("dialog");
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).toBeTruthy();
    await userEvent.click(overlay as Element);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
