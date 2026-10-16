import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster, toast } from "./toast";

function setup() {
  return render(<Toaster />);
}

describe("Toast", () => {
  afterEach(async () => {
    toast.dismiss();
    /*
     * Let Sonner finish its exit animation while the DOM still exists.
     *
     * `dismiss()` starts a short removal sequence, and its final state update is
     * scheduled on a timer. If the jsdom environment is torn down first, React
     * raises "window is not defined" from a callback that is no longer
     * observable by any test — an uncaught exception that can turn a green suite
     * red depending on how many workers were busy at the time.
     *
     * A fixed 260 ms sleep was the first attempt and it was not enough: under a
     * loaded suite the animation had not finished, the final `setState` landed
     * after teardown, and the whole `pnpm verify` gate went red with 898 tests
     * passing. The wait is therefore driven by the thing that actually ends the
     * sequence — the list emptying — with the sleep kept as a floor rather than
     * as the whole guarantee.
     */
    await new Promise((resolve) => setTimeout(resolve, 260));
    await waitFor(
      () => {
        expect(document.querySelectorAll("[data-sonner-toast]")).toHaveLength(0);
      },
      { timeout: 2_000 },
    ).catch(() => {});
    cleanup();
  });

  it("renders a default toast with a title and description", async () => {
    setup();
    toast("Saved", { description: "3 rows updated" });
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("3 rows updated")).toBeInTheDocument();
  });

  it.each([
    ["success", "success"],
    ["error", "error"],
    ["warning", "warning"],
    ["info", "info"],
  ] as const)("renders the %s tone with its own data-type", async (kind, expected) => {
    setup();
    toast[kind](`${kind} message`);
    const node = await screen.findByText(`${kind} message`);
    expect(node.closest("[data-sonner-toast]")).toHaveAttribute("data-type", expected);
  });

  it("dismisses through the close button", async () => {
    setup();
    toast("Closable");
    await screen.findByText("Closable");
    await userEvent.click(screen.getByRole("button", { name: /Dismiss/i }));
    await waitFor(() => expect(screen.queryByText("Closable")).not.toBeInTheDocument());
  });

  it("runs an action callback", async () => {
    const onAction = vi.fn();
    setup();
    toast("Deleted", { action: { label: "Undo", onClick: onAction } });
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("settles a promise toast into its success state", async () => {
    setup();
    const pending = Promise.resolve("ok");
    toast.promise(pending, {
      loading: "Running backtest",
      success: "Backtest finished",
      error: "Backtest failed",
    });
    expect(await screen.findByText("Backtest finished")).toBeInTheDocument();
  });

  it("uses the LUC toast classes rather than raw sonner styling", async () => {
    setup();
    toast.success("Styled");
    const node = await screen.findByText("Styled");
    const toastEl = node.closest("[data-sonner-toast]");
    expect(toastEl).toHaveClass("luc-toast");
    const viewport = toastEl?.parentElement;
    expect(viewport).toHaveClass("luc-toaster");
  });
});
