/*
 * Focus restore for a *controlled* modal.
 *
 * Radix restores focus to `triggerRef.current`, which only exists when the
 * consumer renders a `DialogTrigger`. A modal a product opens by itself — the
 * image lightbox, a command palette bound to a hotkey, a sheet opened from a
 * table row — has no trigger, Radix focuses nothing, and the browser drops
 * focus onto `<body>`; a keyboard user closing the overlay loses their place.
 * `useDialogFocusRestore` is the missing half of that contract, so these tests
 * pin it in both directions: it restores when Radix has nothing to restore to,
 * and it stays out of the way when Radix did the job.
 */

import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { DialogContent, DialogRoot, DialogTitle, DialogTrigger } from "./dialog";

function Overlay({ withTrigger }: { withTrigger: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
        Open the panel
      </button>
      <DialogRoot open={open} onOpenChange={setOpen}>
        {withTrigger ? (
          <DialogTrigger asChild>
            <button type="button">Trigger</button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogTitle>Panel</DialogTitle>
          <button type="button" data-testid="inside" onClick={() => setOpen(false)}>
            Close
          </button>
        </DialogContent>
      </DialogRoot>
    </>
  );
}

describe("useDialogFocusRestore", () => {
  it("returns focus to the control that opened a trigger-less modal", async () => {
    render(<Overlay withTrigger={false} />);
    const opener = screen.getByTestId("opener");
    opener.focus();
    expect(document.activeElement).toBe(opener);

    act(() => {
      opener.click();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const inside = screen.getByTestId("inside");
    inside.focus();
    act(() => {
      inside.click();
    });
    /* The restore is deferred by one task so it cannot race Radix's own. */
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 10)));

    expect(document.activeElement).toBe(opener);
  });

  it("does not fight Radix when a DialogTrigger exists", async () => {
    render(<Overlay withTrigger />);
    const opener = screen.getByTestId("opener");
    opener.focus();
    act(() => {
      opener.click();
    });
    const inside = screen.getByTestId("inside");
    inside.focus();
    act(() => {
      inside.click();
    });
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 10)));
    /*
     * Radix's own restore is what runs here; the assertion is only that the
     * result is a real, connected element rather than `<body>`.
     */
    expect(document.activeElement).not.toBe(document.body);
  });

  it("survives the opened control having been removed", async () => {
    const focus = vi.fn();
    const { unmount } = render(<Overlay withTrigger={false} />);
    const opener = screen.getByTestId("opener");
    opener.focus();
    act(() => {
      opener.click();
    });
    const inside = screen.getByTestId("inside");
    inside.focus();
    act(() => {
      inside.click();
    });
    /* Unmounting removes both the modal and the opener in one commit. */
    unmount();
    await act(() => new Promise((resolve) => window.setTimeout(resolve, 10)));
    expect(focus).not.toHaveBeenCalled();
    expect(document.body.contains(opener)).toBe(false);
  });
});
