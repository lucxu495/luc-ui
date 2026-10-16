import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

function Fixture({ onConfirm }: { onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger">Delete dataset</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete this dataset?</AlertDialogTitle>
        <AlertDialogDescription>
          312 rows and their derived analytics will be removed. This cannot be undone.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Delete dataset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  it("is announced as an alert dialog, not a dialog", async () => {
    render(<Fixture onConfirm={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete dataset" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveAccessibleName("Delete this dataset?");
    expect(dialog).toHaveAccessibleDescription(/cannot be undone/);
  });

  it("focuses the cancel control, so Enter cancels rather than destroys", async () => {
    const onConfirm = vi.fn();
    render(<Fixture onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete dataset" }));
    await screen.findByRole("alertdialog");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    });
    await userEvent.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("runs the action and closes when the confirm button is pressed", async () => {
    const onConfirm = vi.fn();
    render(<Fixture onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete dataset" }));
    await screen.findByRole("alertdialog");
    await userEvent.click(screen.getByRole("button", { name: "Delete dataset" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Fixture onConfirm={() => {}} />);
    const trigger = screen.getByRole("button", { name: "Delete dataset" });
    await userEvent.click(trigger);
    await screen.findByRole("alertdialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
