import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button } from "./button";
import { DialogBody, DialogContent, DialogFooter, DialogHeader, DialogRoot, DialogTitle, DialogTrigger } from "./dialog";

function Fixture() {
  return (
    <DialogRoot>
      <DialogTrigger asChild>
        <Button>New run</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a backtest run</DialogTitle>
        </DialogHeader>
        <DialogBody>Runs against the retained hourly candle set.</DialogBody>
        <DialogFooter>
          <Button variant="ghost">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

describe("Dialog", () => {
  it("opens, labels itself and traps focus", async () => {
    render(<Fixture />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "New run" });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAccessibleName("Start a backtest run");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "New run" });
    await userEvent.click(trigger);
    await screen.findByRole("dialog");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
